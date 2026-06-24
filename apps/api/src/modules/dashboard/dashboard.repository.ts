import { eq, and, lt, count, sql, gte, desc, inArray } from 'drizzle-orm'
import { db } from '../../shared/db/index.js'
import {
  users,
  classes,
  classStudents,
  challengeSubmissions,
  studentStats,
  studentBadges,
  badges,
  moduleProgress,
  trailModules,
  trails,
  tenantTrails,
  challenges,
} from '../../shared/db/schema.js'

// ─── Overview ────────────────────────────────────────────────────────────────

export async function countTenantStudents(tenantId: string): Promise<number> {
  const [row] = await db
    .select({ total: count() })
    .from(users)
    .where(
      and(
        eq(users.tenantId, tenantId),
        eq(users.role, 'student'),
        eq(users.isActive, true),
      ),
    )
  return Number(row?.total ?? 0)
}

export async function countActiveTodayTenant(tenantId: string): Promise<number> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const [row] = await db
    .select({ total: sql<string>`count(distinct ${challengeSubmissions.studentId})` })
    .from(challengeSubmissions)
    .where(
      and(
        eq(challengeSubmissions.tenantId, tenantId),
        gte(challengeSubmissions.submittedAt, since),
      ),
    )
  return Number(row?.total ?? 0)
}

export async function countTenantClasses(tenantId: string): Promise<number> {
  const [row] = await db
    .select({ total: count() })
    .from(classes)
    .where(eq(classes.tenantId, tenantId))
  return Number(row?.total ?? 0)
}

// ─── Alertas ─────────────────────────────────────────────────────────────────

/** Submissões aguardando revisão manual há mais de 24h. Uma linha por student+class. */
export async function findPendingReviewAlerts(tenantId: string) {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000)
  return db
    .selectDistinctOn([challengeSubmissions.studentId, challengeSubmissions.classId], {
      studentId: challengeSubmissions.studentId,
      studentName: users.name,
      classId: challengeSubmissions.classId,
    })
    .from(challengeSubmissions)
    .innerJoin(users, eq(users.id, challengeSubmissions.studentId))
    .where(
      and(
        eq(challengeSubmissions.tenantId, tenantId),
        eq(challengeSubmissions.status, 'under_review'),
        lt(challengeSubmissions.submittedAt, since),
      ),
    )
}

/** Alunos sem atividade há 7+ dias. Uma linha por student+class (primeira turma). */
export async function findNoActivityAlerts(tenantId: string) {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10) // 'YYYY-MM-DD'

  return db
    .selectDistinctOn([users.id], {
      studentId: users.id,
      studentName: users.name,
      classId: classStudents.classId,
    })
    .from(users)
    .innerJoin(classStudents, eq(classStudents.studentId, users.id))
    .leftJoin(
      studentStats,
      and(eq(studentStats.studentId, users.id), eq(studentStats.tenantId, tenantId)),
    )
    .where(
      and(
        eq(users.tenantId, tenantId),
        eq(users.role, 'student'),
        eq(users.isActive, true),
        sql`(${studentStats.lastActivity} IS NULL OR ${studentStats.lastActivity} < ${sevenDaysAgo}::date)`,
      ),
    )
}

/** Alunos com 5+ tentativas falhas no mesmo desafio. */
export async function findStuckOnModuleAlerts(tenantId: string) {
  return db
    .select({
      studentId: challengeSubmissions.studentId,
      studentName: users.name,
      classId: challengeSubmissions.classId,
      failCount: sql<string>`count(*)`,
    })
    .from(challengeSubmissions)
    .innerJoin(users, eq(users.id, challengeSubmissions.studentId))
    .where(
      and(
        eq(challengeSubmissions.tenantId, tenantId),
        eq(challengeSubmissions.status, 'failed'),
      ),
    )
    .groupBy(
      challengeSubmissions.studentId,
      users.name,
      challengeSubmissions.challengeId,
      challengeSubmissions.classId,
    )
    .having(sql`count(*) >= 5`)
}

// ─── Detalhe do aluno ─────────────────────────────────────────────────────────

export async function findStudentForDashboard(studentId: string, tenantId: string) {
  const [row] = await db
    .select({
      id: users.id,
      name: users.name,
      avatarUrl: users.avatarUrl,
    })
    .from(users)
    .where(
      and(
        eq(users.id, studentId),
        eq(users.tenantId, tenantId),
        eq(users.role, 'student'),
        eq(users.isActive, true),
      ),
    )
    .limit(1)
  return row ?? null
}

export async function findStudentStatsForDashboard(studentId: string, tenantId: string) {
  const [row] = await db
    .select({
      totalXp: studentStats.totalXp,
      level: studentStats.level,
      currentStreak: studentStats.currentStreak,
    })
    .from(studentStats)
    .where(
      and(eq(studentStats.tenantId, tenantId), eq(studentStats.studentId, studentId)),
    )
    .limit(1)
  return row ?? null
}

export async function findStudentEarnedBadges(studentId: string, tenantId: string) {
  return db
    .select({
      slug: badges.slug,
      name: badges.name,
      earnedAt: studentBadges.earnedAt,
    })
    .from(studentBadges)
    .innerJoin(badges, eq(badges.id, studentBadges.badgeId))
    .where(
      and(eq(studentBadges.tenantId, tenantId), eq(studentBadges.studentId, studentId)),
    )
}

/** Progresso por trilha: módulos completos, total e última atividade. */
export async function findStudentTrailProgress(studentId: string, tenantId: string) {
  return db
    .select({
      trailId: trails.id,
      trailTitle: trails.title,
      trailOrder: tenantTrails.order,
      totalModules: sql<string>`count(distinct ${trailModules.id})`,
      completedModules: sql<string>`count(distinct ${moduleProgress.id}) filter (where ${moduleProgress.status} = 'completed')`,
      lastActivity: sql<Date | null>`max(${challengeSubmissions.submittedAt})`,
    })
    .from(tenantTrails)
    .innerJoin(trails, eq(trails.id, tenantTrails.trailId))
    .leftJoin(trailModules, eq(trailModules.trailId, trails.id))
    .leftJoin(
      moduleProgress,
      and(
        eq(moduleProgress.moduleId, trailModules.id),
        eq(moduleProgress.studentId, studentId),
        eq(moduleProgress.tenantId, tenantId),
      ),
    )
    .leftJoin(challenges, eq(challenges.moduleId, trailModules.id))
    .leftJoin(
      challengeSubmissions,
      and(
        eq(challengeSubmissions.challengeId, challenges.id),
        eq(challengeSubmissions.studentId, studentId),
        eq(challengeSubmissions.tenantId, tenantId),
      ),
    )
    .where(eq(tenantTrails.tenantId, tenantId))
    .groupBy(trails.id, trails.title, tenantTrails.order)
    .orderBy(tenantTrails.order)
}

// ─── Detalhe da turma ─────────────────────────────────────────────────────────

export async function findClassForDashboard(classId: string, tenantId: string) {
  const [row] = await db
    .select({
      id: classes.id,
      name: classes.name,
      progressionMode: classes.progressionMode,
      validationMode: classes.validationMode,
    })
    .from(classes)
    .where(and(eq(classes.id, classId), eq(classes.tenantId, tenantId)))
    .limit(1)
  return row ?? null
}

export async function countClassActiveToday(classId: string, tenantId: string): Promise<number> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const [row] = await db
    .select({ total: sql<string>`count(distinct ${challengeSubmissions.studentId})` })
    .from(challengeSubmissions)
    .where(
      and(
        eq(challengeSubmissions.tenantId, tenantId),
        eq(challengeSubmissions.classId, classId),
        gte(challengeSubmissions.submittedAt, since),
      ),
    )
  return Number(row?.total ?? 0)
}

/** Todos os alunos da turma com stats, última atividade e submissões pendentes. */
export async function findClassStudentsWithStats(classId: string, tenantId: string) {
  return db
    .select({
      studentId: classStudents.studentId,
      name: users.name,
      avatarUrl: users.avatarUrl,
      totalXp: sql<string>`coalesce(${studentStats.totalXp}, 0)`,
      level: sql<string>`coalesce(${studentStats.level}, 1)`,
      lastActivity: studentStats.lastActivity,
      pendingReview: sql<string>`count(${challengeSubmissions.id}) filter (where ${challengeSubmissions.status} = 'under_review')`,
    })
    .from(classStudents)
    .innerJoin(users, eq(users.id, classStudents.studentId))
    .leftJoin(
      studentStats,
      and(
        eq(studentStats.studentId, classStudents.studentId),
        eq(studentStats.tenantId, tenantId),
      ),
    )
    .leftJoin(
      challengeSubmissions,
      and(
        eq(challengeSubmissions.studentId, classStudents.studentId),
        eq(challengeSubmissions.classId, classId),
        eq(challengeSubmissions.tenantId, tenantId),
      ),
    )
    .where(eq(classStudents.classId, classId))
    .groupBy(
      classStudents.studentId,
      users.name,
      users.avatarUrl,
      studentStats.totalXp,
      studentStats.level,
      studentStats.lastActivity,
    )
    .orderBy(desc(sql`coalesce(${studentStats.totalXp}, 0)`))
}


// ─── Fila de revisão ──────────────────────────────────────────────────────────

/**
 * Submissões aguardando revisão manual (status under_review) no escopo informado.
 * classIds undefined → todo o tenant (gestor); array → restringe às turmas do professor.
 */
export async function findReviewQueue(tenantId: string, classIds?: string[]) {
  const conditions = [
    eq(challengeSubmissions.tenantId, tenantId),
    eq(challengeSubmissions.status, 'under_review'),
  ]
  if (classIds) {
    if (classIds.length === 0) return []
    conditions.push(inArray(challengeSubmissions.classId, classIds))
  }
  return db
    .select({
      submissionId: challengeSubmissions.id,
      challengeId: challengeSubmissions.challengeId,
      challengeTitle: challenges.title,
      studentId: challengeSubmissions.studentId,
      studentName: users.name,
      classId: challengeSubmissions.classId,
      className: classes.name,
      attemptNumber: challengeSubmissions.attemptNumber,
      submittedAt: challengeSubmissions.submittedAt,
    })
    .from(challengeSubmissions)
    .innerJoin(users, eq(users.id, challengeSubmissions.studentId))
    .innerJoin(classes, eq(classes.id, challengeSubmissions.classId))
    .innerJoin(challenges, eq(challenges.id, challengeSubmissions.challengeId))
    .where(and(...conditions))
    .orderBy(challengeSubmissions.submittedAt)
}
