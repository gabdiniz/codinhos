import { db } from '../../shared/db/index.js'
import { computeModuleStatuses } from '../../shared/utils/progression.js'
import { runTests } from '../../shared/utils/run-tests.js'
import { ForbiddenError, NotFoundError, UnprocessableError } from '../../shared/errors/index.js'
import type { TenantSettings, TestResult } from '../../shared/db/schema.js'
import {
  findChallengeForSubmission,
  findClassForSubmission,
  isStudentInClass,
  isChallengeInClass,
  listTrailModuleIdsForChallenge,
  listModuleProgressForChallenge,
  countStudentSubmissionsForClass,
  hasStudentPassedChallenge,
  hasStudentAnySubmission,
  insertSubmission,
  updateSubmissionStatus,
  listSubmissions,
  findSubmissionById,
  findTenantSettings,
  findStudentStatsRow,
  listAllBadges,
  findStudentBadgeIds,
  countDistinctPassedChallenges,
  upsertStudentStats,
  insertXpEvent,
  insertNotification,
  insertStudentBadge,
  upsertModuleProgress,
} from './submissions.repository.js'

// ─── Gamificação — configuração ───────────────────────────────────────────────

const GAMIFICATION_DEFAULTS = {
  xp_per_level: 100,
  first_attempt_bonus_multiplier: 1.5,
  streak_bonus_xp: 5,
  streak_bonus_max_xp: 50,
  streak_milestone_days: [7, 30, 100],
} as const

type GamificationConfig = Required<NonNullable<TenantSettings['gamification']>>

function resolveGamificationConfig(settings: TenantSettings | null): GamificationConfig {
  const g = settings?.gamification ?? {}
  return {
    xp_per_level: g.xp_per_level ?? GAMIFICATION_DEFAULTS.xp_per_level,
    first_attempt_bonus_multiplier:
      g.first_attempt_bonus_multiplier ?? GAMIFICATION_DEFAULTS.first_attempt_bonus_multiplier,
    streak_bonus_xp: g.streak_bonus_xp ?? GAMIFICATION_DEFAULTS.streak_bonus_xp,
    streak_bonus_max_xp: g.streak_bonus_max_xp ?? GAMIFICATION_DEFAULTS.streak_bonus_max_xp,
    streak_milestone_days:
      g.streak_milestone_days ?? [...GAMIFICATION_DEFAULTS.streak_milestone_days],
  }
}

// ─── Utilitários de data UTC ──────────────────────────────────────────────────

function toUtcDateString(d: Date): string {
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function getYesterdayUtc(d: Date): string {
  const prev = new Date(d)
  prev.setUTCDate(prev.getUTCDate() - 1)
  return toUtcDateString(prev)
}

// ─── Fluxo de XP e gamificação ────────────────────────────────────────────────

type BadgeItem = { id: string; slug: string; name: string; iconUrl: string | null }

/**
 * Aplica o fluxo completo de XP após aprovação de uma submissão.
 * Deve ser chamado apenas quando confirmado que esta é a PRIMEIRA aprovação do aluno neste desafio.
 * Toda a operação é atômica (uma única transação).
 */
async function applyXpFlow(params: {
  submissionId: string
  studentId: string
  tenantId: string
  moduleId: string
  baseXp: number
  attemptNumber: number
}): Promise<{ xpEarned: number; newBadges: BadgeItem[] }> {
  const { submissionId, studentId, tenantId, baseXp, attemptNumber, moduleId } = params

  // ── Leituras fora da transação ────────────────────────────────────────────
  const [settings, currentStats, allBadges, ownedBadgeIds, passedCount] = await Promise.all([
    findTenantSettings(tenantId),
    findStudentStatsRow(studentId, tenantId),
    listAllBadges(),
    findStudentBadgeIds(studentId, tenantId),
    countDistinctPassedChallenges(studentId, tenantId),
    // passedCount já inclui a submissão atual (status='passed' no DB)
  ])

  const cfg = resolveGamificationConfig(settings)
  const now = new Date()
  const todayStr = toUtcDateString(now)
  const yesterdayStr = getYesterdayUtc(now)
  const lastActivity = currentStats?.lastActivity ?? null // 'YYYY-MM-DD' ou null

  // ── Cálculo de streak ─────────────────────────────────────────────────────
  const prevStreak = currentStats?.currentStreak ?? 0

  let newStreak: number
  if (!lastActivity) {
    newStreak = 1
  } else if (lastActivity === todayStr) {
    newStreak = prevStreak // mesmo dia: não incrementa
  } else if (lastActivity === yesterdayStr) {
    newStreak = prevStreak + 1
  } else {
    newStreak = 1 // streak quebrado
  }

  const longestStreak = Math.max(currentStats?.longestStreak ?? 0, newStreak)
  const isStreakMilestone =
    lastActivity !== todayStr && cfg.streak_milestone_days.includes(newStreak)

  // ── Cálculo de XP ─────────────────────────────────────────────────────────
  const firstBonus =
    attemptNumber === 1 ? Math.floor(baseXp * (cfg.first_attempt_bonus_multiplier - 1)) : 0

  // Bônus de streak usa o streak já atualizado
  const streakXp = Math.min(cfg.streak_bonus_xp * newStreak, cfg.streak_bonus_max_xp)

  const xpEarned = baseXp + firstBonus + streakXp

  const prevTotalXp = currentStats?.totalXp ?? 0
  const prevLevel = currentStats?.level ?? 1
  const newTotalXp = prevTotalXp + xpEarned
  const newLevel = Math.floor(newTotalXp / cfg.xp_per_level) + 1

  // Badges que o aluno ainda não tem (snapshot pré-transação)
  const unownedBadges = allBadges.filter((b) => !ownedBadgeIds.has(b.id))

  // ── Transação atômica ─────────────────────────────────────────────────────
  const earnedBadges = await db.transaction(async (tx) => {
    const newBadges: BadgeItem[] = []
    const localOwned = new Set(ownedBadgeIds) // cópia local para rastrear duplicatas no loop

    // 1. Marca módulo como concluído
    await upsertModuleProgress({ tenantId, studentId, moduleId }, tx)

    // 2. XP events
    await insertXpEvent(
      { tenantId, studentId, amount: baseXp, reason: 'challenge_passed', refId: submissionId },
      tx,
    )
    if (firstBonus > 0) {
      await insertXpEvent(
        { tenantId, studentId, amount: firstBonus, reason: 'first_attempt_bonus', refId: submissionId },
        tx,
      )
    }
    if (streakXp > 0) {
      await insertXpEvent(
        { tenantId, studentId, amount: streakXp, reason: 'streak_bonus', refId: submissionId },
        tx,
      )
    }

    // 3. Atualiza student_stats
    await upsertStudentStats(
      {
        studentId,
        tenantId,
        totalXp: newTotalXp,
        level: newLevel,
        currentStreak: newStreak,
        longestStreak,
        lastActivity: todayStr,
      },
      tx,
    )

    // 4. Notificação de streak milestone
    if (isStreakMilestone) {
      await insertNotification(
        {
          tenantId,
          userId: studentId,
          type: 'streak_milestone',
          title: `🔥 ${newStreak} dias seguidos!`,
          body: `Você manteve sua sequência por ${newStreak} dias. Continue assim!`,
        },
        tx,
      )
    }

    // 5. Notificação + badge para cada nível atingido (passo g do algoritmo)
    for (let lvl = prevLevel + 1; lvl <= newLevel; lvl++) {
      await insertNotification(
        {
          tenantId,
          userId: studentId,
          type: 'level_up',
          title: `⬆️ Nível ${lvl} alcançado!`,
          body: `Parabéns! Você chegou ao nível ${lvl}.`,
        },
        tx,
      )

      const levelBadge = unownedBadges.find(
        (b) => b.triggerType === 'level_reached' && b.triggerValue === lvl && !localOwned.has(b.id),
      )
      if (levelBadge) {
        await insertStudentBadge({ tenantId, studentId, badgeId: levelBadge.id }, tx)
        await insertXpEvent(
          { tenantId, studentId, amount: 0, reason: 'badge_earned', refId: levelBadge.id },
          tx,
        )
        await insertNotification(
          { tenantId, userId: studentId, type: 'badge_earned', title: `🏅 Badge: ${levelBadge.name}` },
          tx,
        )
        newBadges.push({ id: levelBadge.id, slug: levelBadge.slug, name: levelBadge.name, iconUrl: levelBadge.iconUrl ?? null })
        localOwned.add(levelBadge.id)
      }
    }

    // 6. Badges gerais (passo h do algoritmo — exceto level_reached)
    for (const badge of unownedBadges) {
      if (localOwned.has(badge.id)) continue

      let earned = false
      if (badge.triggerType === 'challenges_completed') {
        earned = passedCount >= badge.triggerValue
      } else if (badge.triggerType === 'streak_days') {
        earned = newStreak >= badge.triggerValue
      } else if (badge.triggerType === 'xp_total') {
        earned = newTotalXp >= badge.triggerValue
      }

      if (earned) {
        await insertStudentBadge({ tenantId, studentId, badgeId: badge.id }, tx)
        await insertXpEvent(
          { tenantId, studentId, amount: 0, reason: 'badge_earned', refId: badge.id },
          tx,
        )
        await insertNotification(
          { tenantId, userId: studentId, type: 'badge_earned', title: `🏅 Badge: ${badge.name}` },
          tx,
        )
        newBadges.push({ id: badge.id, slug: badge.slug, name: badge.name, iconUrl: badge.iconUrl ?? null })
        localOwned.add(badge.id)
      }
    }

    return newBadges
  })

  return { xpEarned, newBadges: earnedBadges }
}

/**
 * Verifica e concede badge first_submission se for a primeira submissão do aluno.
 * Deve ser chamado ANTES de inserir a submissão.
 */
async function checkFirstSubmissionBadge(
  studentId: string,
  tenantId: string,
): Promise<BadgeItem[]> {
  const hasAny = await hasStudentAnySubmission(studentId, tenantId)
  if (hasAny) return []

  const [allBadges, ownedIds] = await Promise.all([
    listAllBadges(),
    findStudentBadgeIds(studentId, tenantId),
  ])
  const badge = allBadges.find((b) => b.triggerType === 'first_submission' && !ownedIds.has(b.id))
  if (!badge) return []

  await db.transaction(async (tx) => {
    await insertStudentBadge({ tenantId, studentId, badgeId: badge.id }, tx)
    await insertXpEvent({ tenantId, studentId, amount: 0, reason: 'badge_earned', refId: badge.id }, tx)
    await insertNotification(
      { tenantId, userId: studentId, type: 'badge_earned', title: `🏅 Badge: ${badge.name}` },
      tx,
    )
  })

  return [{ id: badge.id, slug: badge.slug, name: badge.name, iconUrl: badge.iconUrl ?? null }]
}

// ─── Services públicos ────────────────────────────────────────────────────────

/** POST /:slug/challenges/:challengeId/submissions */
export async function createSubmission(
  tenantId: string,
  studentId: string,
  challengeId: string,
  body: { classId: string; code: string },
) {
  // 1. Validações de acesso
  const [cls, inClass] = await Promise.all([
    findClassForSubmission(body.classId, tenantId),
    isStudentInClass(body.classId, studentId),
  ])
  if (!cls) throw new NotFoundError('Turma')
  if (!inClass) throw new ForbiddenError()

  const challengeInClass = await isChallengeInClass(challengeId, body.classId)
  if (!challengeInClass) throw new NotFoundError('Desafio')

  const challenge = await findChallengeForSubmission(challengeId)
  if (!challenge) throw new NotFoundError('Desafio')

  // 2. Verifica se módulo está acessível
  const [orderedModules, progressMap] = await Promise.all([
    listTrailModuleIdsForChallenge(challengeId),
    listModuleProgressForChallenge(challengeId, studentId, tenantId),
  ])
  const statusMap = computeModuleStatuses(orderedModules, progressMap, cls.progressionMode)
  if ((statusMap.get(challenge.moduleId) ?? 'locked') === 'locked') {
    throw new UnprocessableError('Módulo bloqueado. Complete os módulos anteriores primeiro.')
  }

  // 3. Verificação de idempotência de XP ANTES de inserir
  const prevPassed = await hasStudentPassedChallenge(challengeId, studentId, tenantId)

  // 4. Modo de validação efetivo e número de tentativa
  const effectiveMode = challenge.validationModeOverride ?? cls.validationMode
  const prevCount = await countStudentSubmissionsForClass(challengeId, studentId, body.classId, tenantId)
  const attemptNumber = prevCount + 1

  // 5. Roda os testes (se aplicável)
  let testResults: TestResult[] | null = null
  let submissionStatus: 'passed' | 'failed' | 'under_review'

  if (effectiveMode === 'auto' || effectiveMode === 'auto_review') {
    const testCases = challenge.testCases ?? []
    if (testCases.length > 0) {
      const { results, allPassed } = runTests(body.code, testCases)
      testResults = results
      if (effectiveMode === 'auto') {
        submissionStatus = allPassed ? 'passed' : 'failed'
      } else {
        submissionStatus = 'under_review'
      }
    } else {
      submissionStatus = effectiveMode === 'auto' ? 'passed' : 'under_review'
    }
  } else {
    submissionStatus = 'under_review'
  }

  // 6. Badge first_submission (antes de inserir)
  const firstSubmissionBadges = await checkFirstSubmissionBadge(studentId, tenantId)

  // 7. Insere a submissão
  const { id: submissionId, submittedAt } = await insertSubmission({
    tenantId,
    studentId,
    challengeId,
    classId: body.classId,
    attemptNumber,
    code: body.code,
    status: submissionStatus,
    testResults,
  })

  // 8. Fluxo de XP — apenas na primeira aprovação
  let xpEarned = 0
  let newBadges: BadgeItem[] = [...firstSubmissionBadges]

  if (submissionStatus === 'passed' && !prevPassed) {
    const xpResult = await applyXpFlow({
      submissionId,
      studentId,
      tenantId,
      moduleId: challenge.moduleId,
      baseXp: challenge.baseXp,
      attemptNumber,
    })
    xpEarned = xpResult.xpEarned
    newBadges = [...newBadges, ...xpResult.newBadges]
  }

  return {
    data: {
      submission: {
        id: submissionId,
        attemptNumber,
        code: body.code,
        status: submissionStatus,
        testResults,
        score: null,
        reviewerNote: null,
        submittedAt: submittedAt.toISOString(),
        reviewedAt: null,
      },
      xpEarned,
      newBadges,
    },
  }
}

/** GET /:slug/challenges/:challengeId/submissions */
export async function listChallengeSubmissions(
  tenantId: string,
  actorId: string,
  actorRole: string,
  challengeId: string,
  classId: string,
) {
  const [cls, inClass] = await Promise.all([
    findClassForSubmission(classId, tenantId),
    actorRole === 'student' ? isStudentInClass(classId, actorId) : Promise.resolve(true),
  ])
  if (!cls) throw new NotFoundError('Turma')
  if (!inClass) throw new ForbiddenError()

  const challengeInClass = await isChallengeInClass(challengeId, classId)
  if (!challengeInClass) throw new NotFoundError('Desafio')

  const studentFilter = actorRole === 'student' ? actorId : undefined
  const rows = await listSubmissions(challengeId, classId, tenantId, studentFilter)
  const includeStudent = actorRole !== 'student'

  return {
    data: rows.map((r) => ({
      id: r.id,
      attemptNumber: r.attemptNumber,
      code: r.code,
      status: r.status,
      testResults: r.testResults,
      score: r.score,
      reviewerNote: r.reviewerNote,
      submittedAt: r.submittedAt.toISOString(),
      reviewedAt: r.reviewedAt?.toISOString() ?? null,
      ...(includeStudent && { student: { id: r.studentId, name: r.studentName } }),
    })),
  }
}

/** GET /:slug/challenges/:challengeId/submissions/:submissionId */
export async function getSubmissionDetail(
  tenantId: string,
  actorId: string,
  actorRole: string,
  challengeId: string,
  submissionId: string,
) {
  const submission = await findSubmissionById(submissionId, tenantId)
  if (!submission || submission.challengeId !== challengeId) throw new NotFoundError('Submissão')
  if (actorRole === 'student' && submission.studentId !== actorId) throw new ForbiddenError()

  const includeStudent = actorRole !== 'student'

  return {
    data: {
      id: submission.id,
      attemptNumber: submission.attemptNumber,
      code: submission.code,
      status: submission.status,
      testResults: submission.testResults,
      score: submission.score,
      reviewerNote: submission.reviewerNote,
      submittedAt: submission.submittedAt.toISOString(),
      reviewedAt: submission.reviewedAt?.toISOString() ?? null,
      ...(includeStudent && { student: { id: submission.studentId, name: submission.studentName } }),
    },
  }
}

/** PATCH /:slug/challenges/:challengeId/submissions/:submissionId/review */
export async function reviewSubmission(
  tenantId: string,
  reviewerId: string,
  challengeId: string,
  submissionId: string,
  body: { status: 'passed' | 'failed'; reviewerNote?: string },
) {
  const submission = await findSubmissionById(submissionId, tenantId)
  if (!submission || submission.challengeId !== challengeId) throw new NotFoundError('Submissão')
  if (submission.status !== 'under_review') {
    throw new UnprocessableError('Submissão não está pendente de revisão')
  }

  // Verificação de idempotência ANTES de atualizar o status
  const prevPassed = await hasStudentPassedChallenge(
    submission.challengeId,
    submission.studentId,
    tenantId,
  )

  const now = new Date()
  await updateSubmissionStatus(submissionId, {
    status: body.status,
    reviewerId,
    reviewerNote: body.reviewerNote ?? null,
    reviewedAt: now,
  })

  let xpEarned = 0
  let newBadges: BadgeItem[] = []

  if (body.status === 'passed' && !prevPassed) {
    const challenge = await findChallengeForSubmission(submission.challengeId)
    if (challenge) {
      const xpResult = await applyXpFlow({
        submissionId,
        studentId: submission.studentId,
        tenantId,
        moduleId: challenge.moduleId,
        baseXp: challenge.baseXp,
        attemptNumber: submission.attemptNumber,
      })
      xpEarned = xpResult.xpEarned
      newBadges = xpResult.newBadges
    }
  }

  return {
    data: {
      submission: {
        id: submission.id,
        attemptNumber: submission.attemptNumber,
        code: submission.code,
        status: body.status,
        testResults: submission.testResults,
        score: submission.score,
        reviewerNote: body.reviewerNote ?? null,
        submittedAt: submission.submittedAt.toISOString(),
        reviewedAt: now.toISOString(),
      },
      xpEarned,
      newBadges,
    },
  }
}
