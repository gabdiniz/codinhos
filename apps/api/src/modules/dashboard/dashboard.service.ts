import { NotFoundError } from '../../shared/errors/index.js'
import { findPossiblePlagiarismCandidates } from '../integrity/integrity.service.js'
import {
  isClassAssignedToTeacher,
  isStudentInTeacherClasses,
} from '../classes/classes.repository.js'
import {
  countTenantStudents,
  countActiveTodayTenant,
  countTenantClasses,
  findPendingReviewAlerts,
  findNoActivityAlerts,
  findStuckOnModuleAlerts,
  findStudentForDashboard,
  findStudentStatsForDashboard,
  findStudentEarnedBadges,
  findStudentTrailProgress,
  findClassForDashboard,
  countClassActiveToday,
  findClassStudentsWithStats,
} from './dashboard.repository.js'

// ─── GET / ────────────────────────────────────────────────────────────────────

export async function getOverview(tenantId: string) {
  const [
    totalStudents,
    activeToday,
    totalClasses,
    pendingAlerts,
    noActivityAlerts,
    stuckAlerts,
    plagiarismCandidates,
  ] = await Promise.all([
    countTenantStudents(tenantId),
    countActiveTodayTenant(tenantId),
    countTenantClasses(tenantId),
    findPendingReviewAlerts(tenantId),
    findNoActivityAlerts(tenantId),
    findStuckOnModuleAlerts(tenantId),
    findPossiblePlagiarismCandidates(tenantId),
  ])

  const alerts = [
    ...pendingAlerts.map((a) => ({
      type: 'pending_review' as const,
      studentId: a.studentId,
      studentName: a.studentName,
      classId: a.classId,
      message: 'Submissão aguardando revisão há mais de 24h',
    })),
    ...noActivityAlerts.map((a) => ({
      type: 'no_activity_7d' as const,
      studentId: a.studentId,
      studentName: a.studentName,
      classId: a.classId,
      message: 'Aluno sem atividade há 7 ou mais dias',
    })),
    ...stuckAlerts.map((a) => ({
      type: 'stuck_on_module' as const,
      studentId: a.studentId,
      studentName: a.studentName,
      classId: a.classId,
      message: `${Number(a.failCount)} tentativas falhas no mesmo desafio`,
    })),
    ...plagiarismCandidates.map((c) => ({
      type: 'possible_plagiarism' as const,
      studentId: c.studentId,
      studentName: c.studentName,
      classId: c.classId,
      message: `Código ${Math.round(c.similarity * 100)}% similar ao de ${c.otherStudentName} no mesmo desafio`,
    })),
  ]

  return { data: { totalStudents, activeToday, totalClasses, alerts } }
}

// ─── GET /students/:studentId ─────────────────────────────────────────────────

type DashboardActor = { role: string; userId: string }

export async function getStudentDetail(
  studentId: string,
  tenantId: string,
  actor: DashboardActor,
) {
  const student = await findStudentForDashboard(studentId, tenantId)
  if (!student) throw new NotFoundError('Aluno')

  // Professor só acompanha alunos de turmas atribuídas a ele
  if (actor.role === 'professor') {
    const inScope = await isStudentInTeacherClasses(studentId, actor.userId, tenantId)
    if (!inScope) throw new NotFoundError('Aluno')
  }

  const [stats, earnedBadges, trailProgress] = await Promise.all([
    findStudentStatsForDashboard(studentId, tenantId),
    findStudentEarnedBadges(studentId, tenantId),
    findStudentTrailProgress(studentId, tenantId),
  ])

  return {
    data: {
      student: {
        id: student.id,
        name: student.name,
        avatarUrl: student.avatarUrl ?? null,
      },
      stats: {
        totalXp: stats?.totalXp ?? 0,
        level: stats?.level ?? 1,
        currentStreak: stats?.currentStreak ?? 0,
      },
      badges: earnedBadges.map((b) => ({
        slug: b.slug,
        name: b.name,
        earnedAt: b.earnedAt.toISOString(),
      })),
      trails: trailProgress.map((t) => ({
        id: t.trailId,
        title: t.trailTitle,
        progress: {
          completed: Number(t.completedModules),
          total: Number(t.totalModules),
        },
        lastActivity: t.lastActivity ? t.lastActivity.toISOString() : null,
      })),
    },
  }
}

// ─── GET /classes/:classId ────────────────────────────────────────────────────

export async function getClassDetail(classId: string, tenantId: string, actor: DashboardActor) {
  const cls = await findClassForDashboard(classId, tenantId)
  if (!cls) throw new NotFoundError('Turma')

  // Professor só vê o dashboard de turmas atribuídas a ele
  if (actor.role === 'professor') {
    const assigned = await isClassAssignedToTeacher(classId, actor.userId, tenantId)
    if (!assigned) throw new NotFoundError('Turma')
  }

  const [activeToday, students] = await Promise.all([
    countClassActiveToday(classId, tenantId),
    findClassStudentsWithStats(classId, tenantId),
  ])

  const totalStudents = students.length
  const avgXp =
    totalStudents > 0
      ? Math.round(students.reduce((sum, s) => sum + Number(s.totalXp), 0) / totalStudents)
      : 0

  return {
    data: {
      class: {
        id: cls.id,
        name: cls.name,
        progressionMode: cls.progressionMode,
        validationMode: cls.validationMode,
      },
      stats: { totalStudents, activeToday, avgXp },
      students: students.map((s) => ({
        id: s.studentId,
        name: s.name,
        avatarUrl: s.avatarUrl ?? null,
        totalXp: Number(s.totalXp),
        level: Number(s.level),
        lastActivity: s.lastActivity ?? null,
        pendingReview: Number(s.pendingReview),
      })),
    },
  }
}
