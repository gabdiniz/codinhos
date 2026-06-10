import { ConflictError, NotFoundError } from '../../shared/errors/index.js'
import {
  findClassTenant,
  findActiveWeeklyChallenge,
  findMyWeeklySubmission,
  findOverlappingWeeklyChallenge,
  listWeeklyChallengeHistory,
  findTopStudentsForWeekly,
  findWeeklyChallengeById,
  findLeaderboardEntries,
  insertWeeklyChallenge,
} from './weekly-challenges.repository.js'

// ─── GET /:classId — desafio ativo ────────────────────────────────────────────

export async function getActiveWeeklyChallenge(
  classId: string,
  tenantId: string,
  studentId: string | null,
) {
  const cls = await findClassTenant(classId, tenantId)
  if (!cls) throw new NotFoundError('Turma')

  const weekly = await findActiveWeeklyChallenge(classId, tenantId)
  if (!weekly) return { data: { weeklyChallenge: null } }

  const mySubmission =
    studentId != null
      ? await findMyWeeklySubmission(
          weekly.challengeId,
          classId,
          studentId,
          tenantId,
          weekly.startsAt,
          weekly.endsAt,
        )
      : null

  return {
    data: {
      weeklyChallenge: {
        id: weekly.id,
        challenge: {
          id: weekly.challengeId,
          title: weekly.challengeTitle,
          description: weekly.challengeDescription ?? null,
          difficulty: weekly.challengeDifficulty,
        },
        startsAt: weekly.startsAt.toISOString(),
        endsAt: weekly.endsAt.toISOString(),
        mySubmission: mySubmission
          ? { status: mySubmission.status, attemptNumber: mySubmission.attemptNumber }
          : null,
      },
    },
  }
}

// ─── POST /:classId — criar desafio da semana ─────────────────────────────────

export async function createWeeklyChallenge(
  classId: string,
  tenantId: string,
  challengeId: string,
  startsAt: Date,
  endsAt: Date,
) {
  const cls = await findClassTenant(classId, tenantId)
  if (!cls) throw new NotFoundError('Turma')

  const overlap = await findOverlappingWeeklyChallenge(classId, tenantId, startsAt, endsAt)
  if (overlap) throw new ConflictError('Já existe um desafio com período sobreposto para esta turma')

  const row = await insertWeeklyChallenge({ tenantId, classId, challengeId, startsAt, endsAt })

  return {
    data: {
      weeklyChallenge: {
        id: row.id,
        challengeId: row.challengeId,
        classId: row.classId,
        startsAt: row.startsAt.toISOString(),
        endsAt: row.endsAt.toISOString(),
        createdAt: row.createdAt.toISOString(),
      },
    },
  }
}

// ─── GET /:classId/history ────────────────────────────────────────────────────

export async function getWeeklyChallengeHistory(classId: string, tenantId: string) {
  const cls = await findClassTenant(classId, tenantId)
  if (!cls) throw new NotFoundError('Turma')

  const past = await listWeeklyChallengeHistory(classId, tenantId)

  const history = await Promise.all(
    past.map(async (w) => {
      const topStudents = await findTopStudentsForWeekly(
        w.challengeId,
        classId,
        tenantId,
        w.startsAt,
        w.endsAt,
      )
      return {
        id: w.id,
        challenge: { id: w.challengeId, title: w.challengeTitle },
        startsAt: w.startsAt.toISOString(),
        endsAt: w.endsAt.toISOString(),
        topStudents: topStudents.map((s) => ({
          name: s.studentName,
          xp: Number(s.totalXp),
        })),
      }
    }),
  )

  return { data: { history } }
}

// ─── GET /:classId/:weeklyId/leaderboard ──────────────────────────────────────

export async function getLeaderboard(
  weeklyId: string,
  classId: string,
  tenantId: string,
  requesterId: string,
) {
  const weekly = await findWeeklyChallengeById(weeklyId, tenantId)
  if (!weekly || weekly.classId !== classId) throw new NotFoundError('Desafio da semana')

  const entries = await findLeaderboardEntries(
    weekly.challengeId,
    classId,
    tenantId,
    weekly.startsAt,
    weekly.endsAt,
  )

  // Ordenação: passed primeiro, depois menor tentativa, depois submittedAt mais cedo
  // Alunos sem submissão vão para o final
  const sorted = [...entries].sort((a, b) => {
    const aPassed = a.status === 'passed' ? 0 : 1
    const bPassed = b.status === 'passed' ? 0 : 1
    if (aPassed !== bPassed) return aPassed - bPassed

    const aAttempt = Number(a.attemptNumber ?? 999)
    const bAttempt = Number(b.attemptNumber ?? 999)
    if (aAttempt !== bAttempt) return aAttempt - bAttempt

    const aTime = a.submittedAt != null ? new Date(a.submittedAt).getTime() : Infinity
    const bTime = b.submittedAt != null ? new Date(b.submittedAt).getTime() : Infinity
    return aTime - bTime
  })

  const leaderboard = sorted.map((entry, index) => ({
    position: index + 1,
    student: {
      id: entry.studentId,
      name: entry.studentName,
      avatarUrl: entry.avatarUrl ?? null,
    },
    submittedAt: entry.submittedAt ?? null,
    status: entry.status ?? null,
  }))

  const myIndex = sorted.findIndex((e) => e.studentId === requesterId)
  const myPosition = myIndex >= 0 ? myIndex + 1 : null

  return { data: { leaderboard, myPosition } }
}
