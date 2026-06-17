import { eq, and, desc, count, sql } from 'drizzle-orm'
import { db } from '../../shared/db/index.js'
import {
  studentStats,
  xpEvents,
  badges,
  studentBadges,
  classStudents,
  classes,
  users,
} from '../../shared/db/schema.js'

// ─── Stats do aluno ───────────────────────────────────────────────────────────

export async function findStudentStats(
  studentId: string,
  tenantId: string,
): Promise<{
  totalXp: number
  level: number
  currentStreak: number
  longestStreak: number
} | null> {
  const [row] = await db
    .select({
      totalXp: studentStats.totalXp,
      level: studentStats.level,
      currentStreak: studentStats.currentStreak,
      longestStreak: studentStats.longestStreak,
    })
    .from(studentStats)
    .where(and(eq(studentStats.tenantId, tenantId), eq(studentStats.studentId, studentId)))
    .limit(1)
  // Anotação explícita acima: sem ela o TS prova (incorretamente) que `row` nunca
  // é undefined e descarta o ramo `null`, quebrando o caso "aluno sem stats ainda".
  return row ?? null
}

/** Badges conquistados pelo aluno (com earnedAt). */
export async function findEarnedBadges(studentId: string, tenantId: string) {
  return db
    .select({
      id: badges.id,
      slug: badges.slug,
      name: badges.name,
      earnedAt: studentBadges.earnedAt,
    })
    .from(studentBadges)
    .innerJoin(badges, eq(badges.id, studentBadges.badgeId))
    .where(and(eq(studentBadges.tenantId, tenantId), eq(studentBadges.studentId, studentId)))
}

// ─── Ranking ─────────────────────────────────────────────────────────────────

/** Verifica se a turma existe no tenant e retorna showRanking. */
export async function findClassRankingConfig(
  classId: string,
  tenantId: string,
): Promise<{ showRanking: boolean } | null> {
  const [row] = await db
    .select({ showRanking: classes.showRanking })
    .from(classes)
    .where(and(eq(classes.id, classId), eq(classes.tenantId, tenantId)))
    .limit(1)
  // Mesmo padrão: anotação explícita pra TS não descartar o ramo `null`.
  return row ?? null
}

/** Stats de todos os alunos da turma, ordenados por totalXp desc. */
export async function listClassRanking(classId: string, tenantId: string) {
  return db
    .select({
      studentId: classStudents.studentId,
      name: users.name,
      avatarUrl: users.avatarUrl,
      totalXp: sql<number>`coalesce(${studentStats.totalXp}, 0)`,
      level: sql<number>`coalesce(${studentStats.level}, 1)`,
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
    .where(eq(classStudents.classId, classId))
    .orderBy(
      desc(sql`coalesce(${studentStats.totalXp}, 0)`),
      users.name,
    )
}

// ─── Catálogo de badges ───────────────────────────────────────────────────────

/** Catálogo completo de badges com flag de conquista do aluno. */
export async function listBadgesWithEarnedStatus(studentId: string, tenantId: string) {
  return db
    .select({
      id: badges.id,
      slug: badges.slug,
      name: badges.name,
      description: badges.description,
      iconUrl: badges.iconUrl,
      triggerType: badges.triggerType,
      triggerValue: badges.triggerValue,
      earnedAt: studentBadges.earnedAt,
    })
    .from(badges)
    .leftJoin(
      studentBadges,
      and(
        eq(studentBadges.badgeId, badges.id),
        eq(studentBadges.studentId, studentId),
        eq(studentBadges.tenantId, tenantId),
      ),
    )
    .orderBy(badges.name)
}

// ─── XP Events ───────────────────────────────────────────────────────────────

export async function countXpEvents(studentId: string, tenantId: string): Promise<number> {
  const [row] = await db
    .select({ total: count() })
    .from(xpEvents)
    .where(and(eq(xpEvents.tenantId, tenantId), eq(xpEvents.studentId, studentId)))
  return Number(row?.total ?? 0)
}

export async function listXpEvents(
  studentId: string,
  tenantId: string,
  offset: number,
  limit: number,
) {
  return db
    .select({
      id: xpEvents.id,
      amount: xpEvents.amount,
      reason: xpEvents.reason,
      refId: xpEvents.refId,
      createdAt: xpEvents.createdAt,
    })
    .from(xpEvents)
    .where(and(eq(xpEvents.tenantId, tenantId), eq(xpEvents.studentId, studentId)))
    .orderBy(desc(xpEvents.createdAt))
    .limit(limit)
    .offset(offset)
}
