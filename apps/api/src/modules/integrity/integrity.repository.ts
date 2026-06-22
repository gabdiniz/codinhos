import { eq, desc } from 'drizzle-orm'
import { db } from '../../shared/db/index.js'
import { challengeSubmissions, users } from '../../shared/db/schema.js'

/**
 * Última submissão de cada aluno, por turma + desafio.
 * Uma linha por (classId, challengeId, studentId) — base para comparação de similaridade.
 */
export async function findLatestSubmissionsByClassChallenge(tenantId: string) {
  return db
    .selectDistinctOn(
      [challengeSubmissions.classId, challengeSubmissions.challengeId, challengeSubmissions.studentId],
      {
        classId: challengeSubmissions.classId,
        challengeId: challengeSubmissions.challengeId,
        studentId: challengeSubmissions.studentId,
        studentName: users.name,
        code: challengeSubmissions.code,
      },
    )
    .from(challengeSubmissions)
    .innerJoin(users, eq(users.id, challengeSubmissions.studentId))
    .where(eq(challengeSubmissions.tenantId, tenantId))
    .orderBy(
      challengeSubmissions.classId,
      challengeSubmissions.challengeId,
      challengeSubmissions.studentId,
      desc(challengeSubmissions.submittedAt),
    )
}
