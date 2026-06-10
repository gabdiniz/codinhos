import { eq, and, count, desc, sql } from 'drizzle-orm'
import { db } from '../../shared/db/index.js'
import {
  challenges,
  trailModules,
  classTrails,
  classes,
  classStudents,
  challengeSubmissions,
  moduleProgress,
  studentStats,
  xpEvents,
  notifications,
  badges,
  studentBadges,
  tenants,
  users,
  type TestResult,
} from '../../shared/db/schema.js'

// ─── Tipos internos ───────────────────────────────────────────────────────────

/** Subconjunto do db compatível com transações do Drizzle */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Executor = typeof db | any

// ─── Desafio e turma ──────────────────────────────────────────────────────────

export async function findChallengeForSubmission(challengeId: string) {
  const [row] = await db
    .select({
      id: challenges.id,
      moduleId: challenges.moduleId,
      title: challenges.title,
      baseXp: challenges.baseXp,
      testCases: challenges.testCases,
      validationModeOverride: challenges.validationModeOverride,
    })
    .from(challenges)
    .where(eq(challenges.id, challengeId))
    .limit(1)
  return row ?? null
}

export async function findClassForSubmission(classId: string, tenantId: string) {
  const [row] = await db
    .select({
      id: classes.id,
      validationMode: classes.validationMode,
      progressionMode: classes.progressionMode,
    })
    .from(classes)
    .where(and(eq(classes.id, classId), eq(classes.tenantId, tenantId)))
    .limit(1)
  return row ?? null
}

/** Verifica se o aluno é membro da turma. */
export async function isStudentInClass(classId: string, studentId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: classStudents.id })
    .from(classStudents)
    .where(and(eq(classStudents.classId, classId), eq(classStudents.studentId, studentId)))
    .limit(1)
  return !!row
}

/** Verifica se o desafio pertence a uma trilha atribuída à turma. */
export async function isChallengeInClass(challengeId: string, classId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: classTrails.id })
    .from(challenges)
    .innerJoin(trailModules, eq(trailModules.id, challenges.moduleId))
    .innerJoin(classTrails, eq(classTrails.trailId, trailModules.trailId))
    .where(and(eq(challenges.id, challengeId), eq(classTrails.classId, classId)))
    .limit(1)
  return !!row
}

// ─── Módulos e progresso (para checar se módulo está acessível) ───────────────

/** IDs ordenados dos módulos da trilha que contém o desafio. */
export async function listTrailModuleIdsForChallenge(challengeId: string) {
  const [ch] = await db
    .select({ trailId: trailModules.trailId })
    .from(challenges)
    .innerJoin(trailModules, eq(trailModules.id, challenges.moduleId))
    .where(eq(challenges.id, challengeId))
    .limit(1)

  if (!ch) return []

  return db
    .select({ id: trailModules.id, order: trailModules.order })
    .from(trailModules)
    .where(eq(trailModules.trailId, ch.trailId))
    .orderBy(trailModules.order)
}

/** Mapa moduleId → status para a trilha que contém o desafio. */
export async function listModuleProgressForChallenge(
  challengeId: string,
  studentId: string,
  tenantId: string,
): Promise<Map<string, 'locked' | 'available' | 'completed'>> {
  const [ch] = await db
    .select({ trailId: trailModules.trailId })
    .from(challenges)
    .innerJoin(trailModules, eq(trailModules.id, challenges.moduleId))
    .where(eq(challenges.id, challengeId))
    .limit(1)

  if (!ch) return new Map()

  const rows = await db
    .select({ moduleId: moduleProgress.moduleId, status: moduleProgress.status })
    .from(moduleProgress)
    .innerJoin(trailModules, eq(trailModules.id, moduleProgress.moduleId))
    .where(
      and(
        eq(moduleProgress.tenantId, tenantId),
        eq(moduleProgress.studentId, studentId),
        eq(trailModules.trailId, ch.trailId),
      ),
    )
  return new Map(rows.map((r) => [r.moduleId, r.status]))
}

// ─── Submissões — leitura ─────────────────────────────────────────────────────

export async function countStudentSubmissionsForClass(
  challengeId: string,
  studentId: string,
  classId: string,
  tenantId: string,
): Promise<number> {
  const [row] = await db
    .select({ total: count() })
    .from(challengeSubmissions)
    .where(
      and(
        eq(challengeSubmissions.tenantId, tenantId),
        eq(challengeSubmissions.studentId, studentId),
        eq(challengeSubmissions.challengeId, challengeId),
        eq(challengeSubmissions.classId, classId),
      ),
    )
  return Number(row?.total ?? 0)
}

/** Verifica se o aluno já possui uma submissão aprovada neste desafio (qualquer turma). */
export async function hasStudentPassedChallenge(
  challengeId: string,
  studentId: string,
  tenantId: string,
): Promise<boolean> {
  const [row] = await db
    .select({ id: challengeSubmissions.id })
    .from(challengeSubmissions)
    .where(
      and(
        eq(challengeSubmissions.tenantId, tenantId),
        eq(challengeSubmissions.studentId, studentId),
        eq(challengeSubmissions.challengeId, challengeId),
        eq(challengeSubmissions.status, 'passed'),
      ),
    )
    .limit(1)
  return !!row
}

/** Verifica se é a primeira submissão do aluno no tenant (qualquer desafio, qualquer status). */
export async function hasStudentAnySubmission(
  studentId: string,
  tenantId: string,
): Promise<boolean> {
  const [row] = await db
    .select({ id: challengeSubmissions.id })
    .from(challengeSubmissions)
    .where(
      and(
        eq(challengeSubmissions.tenantId, tenantId),
        eq(challengeSubmissions.studentId, studentId),
      ),
    )
    .limit(1)
  return !!row
}

export async function listSubmissions(
  challengeId: string,
  classId: string,
  tenantId: string,
  studentId?: string,
) {
  const conditions = [
    eq(challengeSubmissions.tenantId, tenantId),
    eq(challengeSubmissions.challengeId, challengeId),
    eq(challengeSubmissions.classId, classId),
  ]
  if (studentId) conditions.push(eq(challengeSubmissions.studentId, studentId))

  return db
    .select({
      id: challengeSubmissions.id,
      attemptNumber: challengeSubmissions.attemptNumber,
      code: challengeSubmissions.code,
      status: challengeSubmissions.status,
      testResults: challengeSubmissions.testResults,
      score: challengeSubmissions.score,
      reviewerNote: challengeSubmissions.reviewerNote,
      submittedAt: challengeSubmissions.submittedAt,
      reviewedAt: challengeSubmissions.reviewedAt,
      studentId: challengeSubmissions.studentId,
      studentName: users.name,
    })
    .from(challengeSubmissions)
    .innerJoin(users, eq(users.id, challengeSubmissions.studentId))
    .where(and(...conditions))
    .orderBy(desc(challengeSubmissions.submittedAt))
}

export async function findSubmissionById(submissionId: string, tenantId: string) {
  const [row] = await db
    .select({
      id: challengeSubmissions.id,
      challengeId: challengeSubmissions.challengeId,
      classId: challengeSubmissions.classId,
      studentId: challengeSubmissions.studentId,
      studentName: users.name,
      attemptNumber: challengeSubmissions.attemptNumber,
      code: challengeSubmissions.code,
      status: challengeSubmissions.status,
      testResults: challengeSubmissions.testResults,
      score: challengeSubmissions.score,
      reviewerNote: challengeSubmissions.reviewerNote,
      submittedAt: challengeSubmissions.submittedAt,
      reviewedAt: challengeSubmissions.reviewedAt,
    })
    .from(challengeSubmissions)
    .innerJoin(users, eq(users.id, challengeSubmissions.studentId))
    .where(and(eq(challengeSubmissions.id, submissionId), eq(challengeSubmissions.tenantId, tenantId)))
    .limit(1)
  return row ?? null
}

// ─── Submissões — escrita ─────────────────────────────────────────────────────

export async function insertSubmission(data: {
  tenantId: string
  studentId: string
  challengeId: string
  classId: string
  attemptNumber: number
  code: string
  status: 'pending' | 'passed' | 'failed' | 'under_review'
  testResults?: TestResult[] | null
}) {
  const [row] = await db
    .insert(challengeSubmissions)
    .values({
      ...data,
      testResults: data.testResults ?? null,
    })
    .returning({ id: challengeSubmissions.id, submittedAt: challengeSubmissions.submittedAt })
  return row!
}

export async function updateSubmissionStatus(
  submissionId: string,
  data: {
    status: 'passed' | 'failed' | 'under_review'
    reviewerId?: string
    reviewerNote?: string | null
    reviewedAt?: Date | null
  },
  executor: Executor = db,
) {
  await executor
    .update(challengeSubmissions)
    .set({
      status: data.status,
      ...(data.reviewerId !== undefined && { reviewerId: data.reviewerId }),
      ...(data.reviewerNote !== undefined && { reviewerNote: data.reviewerNote }),
      ...(data.reviewedAt !== undefined && { reviewedAt: data.reviewedAt }),
    })
    .where(eq(challengeSubmissions.id, submissionId))
}

// ─── Gamificação — leitura ────────────────────────────────────────────────────

export async function findTenantSettings(tenantId: string) {
  const [row] = await db
    .select({ settings: tenants.settings })
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1)
  return row?.settings ?? null
}

export async function findStudentStatsRow(studentId: string, tenantId: string) {
  const [row] = await db
    .select({
      totalXp: studentStats.totalXp,
      level: studentStats.level,
      currentStreak: studentStats.currentStreak,
      longestStreak: studentStats.longestStreak,
      lastActivity: studentStats.lastActivity,
    })
    .from(studentStats)
    .where(and(eq(studentStats.tenantId, tenantId), eq(studentStats.studentId, studentId)))
    .limit(1)
  return row ?? null
}

export async function listAllBadges() {
  return db
    .select({
      id: badges.id,
      slug: badges.slug,
      name: badges.name,
      iconUrl: badges.iconUrl,
      triggerType: badges.triggerType,
      triggerValue: badges.triggerValue,
    })
    .from(badges)
}

export async function findStudentBadgeIds(studentId: string, tenantId: string): Promise<Set<string>> {
  const rows = await db
    .select({ badgeId: studentBadges.badgeId })
    .from(studentBadges)
    .where(and(eq(studentBadges.tenantId, tenantId), eq(studentBadges.studentId, studentId)))
  return new Set(rows.map((r) => r.badgeId))
}

/** Conta desafios distintos que o aluno passou (para badge challenges_completed). */
export async function countDistinctPassedChallenges(
  studentId: string,
  tenantId: string,
): Promise<number> {
  const [row] = await db
    .select({ total: sql<string>`count(distinct ${challengeSubmissions.challengeId})` })
    .from(challengeSubmissions)
    .where(
      and(
        eq(challengeSubmissions.tenantId, tenantId),
        eq(challengeSubmissions.studentId, studentId),
        eq(challengeSubmissions.status, 'passed'),
      ),
    )
  return Number(row?.total ?? 0)
}

// ─── Gamificação — escrita (dentro de transação) ──────────────────────────────

export async function upsertStudentStats(
  data: {
    studentId: string
    tenantId: string
    totalXp: number
    level: number
    currentStreak: number
    longestStreak: number
    lastActivity: string // 'YYYY-MM-DD'
  },
  executor: Executor = db,
) {
  await executor
    .insert(studentStats)
    .values({
      studentId: data.studentId,
      tenantId: data.tenantId,
      totalXp: data.totalXp,
      level: data.level,
      currentStreak: data.currentStreak,
      longestStreak: data.longestStreak,
      lastActivity: data.lastActivity,
    })
    .onConflictDoUpdate({
      target: [studentStats.tenantId, studentStats.studentId],
      set: {
        totalXp: data.totalXp,
        level: data.level,
        currentStreak: data.currentStreak,
        longestStreak: data.longestStreak,
        lastActivity: data.lastActivity,
        updatedAt: new Date(),
      },
    })
}

export async function insertXpEvent(
  data: { tenantId: string; studentId: string; amount: number; reason: string; refId?: string },
  executor: Executor = db,
) {
  await executor.insert(xpEvents).values({
    tenantId: data.tenantId,
    studentId: data.studentId,
    amount: data.amount,
    reason: data.reason,
    refId: data.refId ?? null,
  })
}

export async function insertNotification(
  data: { tenantId: string; userId: string; type: string; title: string; body?: string },
  executor: Executor = db,
) {
  await executor.insert(notifications).values({
    tenantId: data.tenantId,
    userId: data.userId,
    type: data.type,
    title: data.title,
    body: data.body ?? null,
  })
}

export async function insertStudentBadge(
  data: { tenantId: string; studentId: string; badgeId: string },
  executor: Executor = db,
) {
  await executor
    .insert(studentBadges)
    .values(data)
    .onConflictDoNothing()
}

export async function upsertModuleProgress(
  data: { tenantId: string; studentId: string; moduleId: string },
  executor: Executor = db,
) {
  await executor
    .insert(moduleProgress)
    .values({
      tenantId: data.tenantId,
      studentId: data.studentId,
      moduleId: data.moduleId,
      status: 'completed',
      completedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [moduleProgress.tenantId, moduleProgress.studentId, moduleProgress.moduleId],
      set: { status: 'completed', completedAt: new Date(), updatedAt: new Date() },
    })
}
