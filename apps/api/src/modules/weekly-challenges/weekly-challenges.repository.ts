import { eq, and, lt, lte, gte, gt, desc, sql } from 'drizzle-orm'
import { db } from '../../shared/db/index.js'
import {
  classWeeklyChallenges,
  challenges,
  challengeSubmissions,
  classStudents,
  users,
  studentStats,
  classes,
} from '../../shared/db/schema.js'

// ─── Leitura ─────────────────────────────────────────────────────────────────

/** Verifica se a turma pertence ao tenant. */
export async function findClassTenant(classId: string, tenantId: string) {
  const [row] = await db
    .select({ id: classes.id })
    .from(classes)
    .where(and(eq(classes.id, classId), eq(classes.tenantId, tenantId)))
    .limit(1)
  return row ?? null
}

/** Desafio da semana ativo agora (starts_at <= now <= ends_at). */
export async function findActiveWeeklyChallenge(classId: string, tenantId: string) {
  const now = new Date()
  const [row] = await db
    .select({
      id: classWeeklyChallenges.id,
      challengeId: challenges.id,
      challengeTitle: challenges.title,
      challengeDescription: challenges.description,
      challengeDifficulty: challenges.difficulty,
      startsAt: classWeeklyChallenges.startsAt,
      endsAt: classWeeklyChallenges.endsAt,
    })
    .from(classWeeklyChallenges)
    .innerJoin(challenges, eq(challenges.id, classWeeklyChallenges.challengeId))
    .where(
      and(
        eq(classWeeklyChallenges.tenantId, tenantId),
        eq(classWeeklyChallenges.classId, classId),
        lte(classWeeklyChallenges.startsAt, now),
        gte(classWeeklyChallenges.endsAt, now),
      ),
    )
    .limit(1)
  return row ?? null
}

/** Melhor submissão do aluno para um desafio dentro do período do weekly. */
export async function findMyWeeklySubmission(
  challengeId: string,
  classId: string,
  studentId: string,
  tenantId: string,
  startsAt: Date,
  endsAt: Date,
) {
  // Prioriza 'passed', depois menor attemptNumber, depois mais recente
  const [row] = await db
    .select({
      status: challengeSubmissions.status,
      attemptNumber: challengeSubmissions.attemptNumber,
    })
    .from(challengeSubmissions)
    .where(
      and(
        eq(challengeSubmissions.tenantId, tenantId),
        eq(challengeSubmissions.studentId, studentId),
        eq(challengeSubmissions.challengeId, challengeId),
        eq(challengeSubmissions.classId, classId),
        gte(challengeSubmissions.submittedAt, startsAt),
        lte(challengeSubmissions.submittedAt, endsAt),
      ),
    )
    .orderBy(
      // passed vem primeiro (status = 'passed' é lexicograficamente depois de 'failed'/'pending'...)
      // Usamos sql para ordenar: passed=0, resto=1
      sql`case when ${challengeSubmissions.status} = 'passed' then 0 else 1 end`,
      challengeSubmissions.attemptNumber,
      desc(challengeSubmissions.submittedAt),
    )
    .limit(1)
  return row ?? null
}

/** Verifica sobreposição de período para a turma (para 409 no POST). */
export async function findOverlappingWeeklyChallenge(
  classId: string,
  tenantId: string,
  startsAt: Date,
  endsAt: Date,
) {
  // Sobreposição: existente.startsAt < novo.endsAt AND existente.endsAt > novo.startsAt
  const [row] = await db
    .select({ id: classWeeklyChallenges.id })
    .from(classWeeklyChallenges)
    .where(
      and(
        eq(classWeeklyChallenges.tenantId, tenantId),
        eq(classWeeklyChallenges.classId, classId),
        lt(classWeeklyChallenges.startsAt, endsAt),
        gt(classWeeklyChallenges.endsAt, startsAt),
      ),
    )
    .limit(1)
  return row ?? null
}

/** Histórico: desafios encerrados (ends_at < now), do mais recente ao mais antigo. */
export async function listWeeklyChallengeHistory(classId: string, tenantId: string) {
  const now = new Date()
  return db
    .select({
      id: classWeeklyChallenges.id,
      challengeId: challenges.id,
      challengeTitle: challenges.title,
      startsAt: classWeeklyChallenges.startsAt,
      endsAt: classWeeklyChallenges.endsAt,
    })
    .from(classWeeklyChallenges)
    .innerJoin(challenges, eq(challenges.id, classWeeklyChallenges.challengeId))
    .where(
      and(
        eq(classWeeklyChallenges.tenantId, tenantId),
        eq(classWeeklyChallenges.classId, classId),
        lt(classWeeklyChallenges.endsAt, now),
      ),
    )
    .orderBy(desc(classWeeklyChallenges.endsAt))
}

/**
 * Top 3 alunos aprovados em um desafio da semana dentro do período.
 * Critério: status=passed, menor tentativa, depois mais cedo.
 */
export async function findTopStudentsForWeekly(
  challengeId: string,
  classId: string,
  tenantId: string,
  startsAt: Date,
  endsAt: Date,
) {
  return db
    .select({
      studentId: challengeSubmissions.studentId,
      studentName: users.name,
      totalXp: sql<string>`coalesce(${studentStats.totalXp}, 0)`,
      attemptNumber: challengeSubmissions.attemptNumber,
      submittedAt: challengeSubmissions.submittedAt,
    })
    .from(challengeSubmissions)
    .innerJoin(users, eq(users.id, challengeSubmissions.studentId))
    .leftJoin(
      studentStats,
      and(
        eq(studentStats.studentId, challengeSubmissions.studentId),
        eq(studentStats.tenantId, tenantId),
      ),
    )
    .where(
      and(
        eq(challengeSubmissions.tenantId, tenantId),
        eq(challengeSubmissions.challengeId, challengeId),
        eq(challengeSubmissions.classId, classId),
        eq(challengeSubmissions.status, 'passed'),
        gte(challengeSubmissions.submittedAt, startsAt),
        lte(challengeSubmissions.submittedAt, endsAt),
      ),
    )
    .orderBy(challengeSubmissions.attemptNumber, challengeSubmissions.submittedAt)
    .limit(3)
}

/** Desafio da semana por ID. */
export async function findWeeklyChallengeById(weeklyId: string, tenantId: string) {
  const [row] = await db
    .select({
      id: classWeeklyChallenges.id,
      classId: classWeeklyChallenges.classId,
      challengeId: classWeeklyChallenges.challengeId,
      startsAt: classWeeklyChallenges.startsAt,
      endsAt: classWeeklyChallenges.endsAt,
    })
    .from(classWeeklyChallenges)
    .where(
      and(
        eq(classWeeklyChallenges.id, weeklyId),
        eq(classWeeklyChallenges.tenantId, tenantId),
      ),
    )
    .limit(1)
  return row ?? null
}

/** Todos os alunos da turma com melhor submissão no período (para leaderboard). */
export async function findLeaderboardEntries(
  challengeId: string,
  classId: string,
  tenantId: string,
  startsAt: Date,
  endsAt: Date,
) {
  // Para cada aluno da turma, pega a melhor submissão dentro do período
  // "melhor" = passed > failed > under_review, depois menor tentativa, depois mais cedo
  return db
    .select({
      studentId: classStudents.studentId,
      studentName: users.name,
      avatarUrl: users.avatarUrl,
      status: sql<string | null>`case when max(case when ${challengeSubmissions.status} = 'passed' then 1 else 0 end) = 1 then 'passed' else max(${challengeSubmissions.status}) end`,
      attemptNumber: sql<string | null>`min(${challengeSubmissions.attemptNumber})`,
      submittedAt: sql<string | null>`min(case when ${challengeSubmissions.status} = 'passed' then ${challengeSubmissions.submittedAt} else null end)`,
    })
    .from(classStudents)
    .innerJoin(users, eq(users.id, classStudents.studentId))
    .leftJoin(
      challengeSubmissions,
      and(
        eq(challengeSubmissions.studentId, classStudents.studentId),
        eq(challengeSubmissions.challengeId, challengeId),
        eq(challengeSubmissions.classId, classId),
        eq(challengeSubmissions.tenantId, tenantId),
        gte(challengeSubmissions.submittedAt, startsAt),
        lte(challengeSubmissions.submittedAt, endsAt),
      ),
    )
    .where(eq(classStudents.classId, classId))
    .groupBy(classStudents.studentId, users.name, users.avatarUrl)
}

// ─── Escrita ─────────────────────────────────────────────────────────────────

export async function insertWeeklyChallenge(data: {
  tenantId: string
  classId: string
  challengeId: string
  startsAt: Date
  endsAt: Date
}) {
  const [row] = await db
    .insert(classWeeklyChallenges)
    .values(data)
    .returning({
      id: classWeeklyChallenges.id,
      challengeId: classWeeklyChallenges.challengeId,
      classId: classWeeklyChallenges.classId,
      startsAt: classWeeklyChallenges.startsAt,
      endsAt: classWeeklyChallenges.endsAt,
      createdAt: classWeeklyChallenges.createdAt,
    })
  return row!
}
