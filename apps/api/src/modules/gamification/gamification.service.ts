import { ForbiddenError, NotFoundError } from '../../shared/errors/index.js'
import {
  findStudentStats,
  findEarnedBadges,
  findClassRankingConfig,
  listClassRanking,
  listBadgesWithEarnedStatus,
  countXpEvents,
  listXpEvents,
} from './gamification.repository.js'
import { findTenantSettings } from '../tenant-settings/tenant-settings.repository.js'

// ─── /me ─────────────────────────────────────────────────────────────────────

export async function getMyStats(studentId: string, tenantId: string) {
  const [stats, earnedBadges] = await Promise.all([
    findStudentStats(studentId, tenantId),
    findEarnedBadges(studentId, tenantId),
  ])

  return {
    totalXp: stats?.totalXp ?? 0,
    level: stats?.level ?? 1,
    currentStreak: stats?.currentStreak ?? 0,
    longestStreak: stats?.longestStreak ?? 0,
    badges: earnedBadges.map((b) => ({
      id: b.id,
      slug: b.slug,
      name: b.name,
      earnedAt: b.earnedAt.toISOString(),
    })),
  }
}

// ─── /ranking/:classId ────────────────────────────────────────────────────────

export async function getClassRanking(
  classId: string,
  tenantId: string,
  requesterId: string,
  requesterRole: string,
) {
  const cls = await findClassRankingConfig(classId, tenantId)
  if (!cls) throw new NotFoundError('Turma')

  if (!cls.showRanking && requesterRole === 'student') {
    throw new ForbiddenError()
  }

  const rows = await listClassRanking(classId, tenantId)

  const ranking = rows.map((row, index) => ({
    position: index + 1,
    student: {
      id: row.studentId,
      name: row.name,
      avatarUrl: row.avatarUrl ?? null,
      avatarConfig: row.avatarConfig ?? null,
    },
    totalXp: Number(row.totalXp),
    level: Number(row.level),
  }))

  const myIndex = rows.findIndex((r) => r.studentId === requesterId)
  const myPosition = myIndex >= 0 ? myIndex + 1 : null

  // Gestor sempre pode abrir o perfil de um aluno — o toggle só restringe aluno-para-aluno
  let allowProfileView = true
  if (requesterRole === 'student') {
    const tenant = await findTenantSettings(tenantId)
    allowProfileView = tenant?.settings?.allow_student_profile_view ?? true
  }

  return { ranking, myPosition, allowProfileView }
}

// ─── /badges ─────────────────────────────────────────────────────────────────

export async function getBadges(studentId: string, tenantId: string) {
  const rows = await listBadgesWithEarnedStatus(studentId, tenantId)

  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description ?? '',
    iconUrl: row.iconUrl ?? null,
    triggerType: row.triggerType,
    triggerValue: row.triggerValue ?? null,
    earned: row.earnedAt !== null,
    earnedAt: row.earnedAt ? row.earnedAt.toISOString() : null,
  }))
}

// ─── /xp-events ──────────────────────────────────────────────────────────────

export async function getXpEvents(
  studentId: string,
  tenantId: string,
  page: number,
  limit: number,
) {
  const offset = (page - 1) * limit

  const [total, events] = await Promise.all([
    countXpEvents(studentId, tenantId),
    listXpEvents(studentId, tenantId, offset, limit),
  ])

  return {
    data: events.map((e) => ({
      id: e.id,
      amount: e.amount,
      reason: e.reason,
      refId: e.refId ?? null,
      createdAt: e.createdAt.toISOString(),
    })),
    meta: { total, page, limit },
  }
}
