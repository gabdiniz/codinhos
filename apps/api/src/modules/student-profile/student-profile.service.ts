import { ForbiddenError, NotFoundError } from '../../shared/errors/index.js'
import { findUserById } from '../users/users.repository.js'
import { findStudentCurrentClass } from '../classes/classes.repository.js'
import { findStudentStats, findEarnedBadges } from '../gamification/gamification.repository.js'
import { findTenantSettings } from '../tenant-settings/tenant-settings.repository.js'

// Módulo sem tabela própria: orquestra repositories de users, classes, gamification
// e tenant-settings — não há queries novas que justifiquem um repository.ts dedicado.

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calculateAge(birthDate: string | null): number | null {
  if (!birthDate) return null

  const today = new Date()
  const birth = new Date(birthDate)
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age
}

// ─── GET /:slug/students/:studentId/profile ──────────────────────────────────

export async function getStudentProfile(
  studentId: string,
  tenantId: string,
  requesterId: string,
  requesterRole: string,
) {
  const target = await findUserById(studentId, tenantId)
  if (!target || target.role !== 'student') throw new NotFoundError('Aluno')

  const isManager = requesterRole === 'manager' || requesterRole === 'super_admin'
  const isSelf = requesterId === studentId

  // Aluno olhando o perfil de outro aluno: precisa do toggle do tenant ligado
  // e de estarem na mesma turma (defesa em profundidade — a UI de ranking já
  // só lista colegas de turma, mas a API não confia só na UI).
  if (!isManager && !isSelf) {
    const tenant = await findTenantSettings(tenantId)
    const allowProfileView = tenant?.settings?.allow_student_profile_view ?? true
    if (!allowProfileView) throw new ForbiddenError()

    const [viewerClass, targetClass] = await Promise.all([
      findStudentCurrentClass(requesterId, tenantId),
      findStudentCurrentClass(studentId, tenantId),
    ])
    if (!viewerClass || !targetClass || viewerClass.id !== targetClass.id) {
      throw new ForbiddenError()
    }
  }

  const [classInfo, stats, earnedBadges] = await Promise.all([
    findStudentCurrentClass(studentId, tenantId),
    findStudentStats(studentId, tenantId),
    findEarnedBadges(studentId, tenantId),
  ])

  return {
    id: target.id,
    name: target.name,
    avatarUrl: target.avatarUrl ?? null,
    age: calculateAge(target.birthDate),
    className: classInfo?.name ?? null,
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
    // Dados pessoais completos só para gestor — aluno vendo colega recebe null
    email: isManager ? target.email : null,
    birthDate: isManager ? target.birthDate ?? null : null,
    createdAt: isManager ? target.createdAt.toISOString() : null,
  }
}
