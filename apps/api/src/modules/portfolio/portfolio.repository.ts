import { eq, and, sql } from 'drizzle-orm'
import { db } from '../../shared/db/index.js'
import {
  users,
  tenants,
  trails,
  trailModules,
  tenantTrails,
  moduleProgress,
  classStudents,
  classTrails,
  challenges,
  challengeSubmissions,
} from '../../shared/db/schema.js'

/**
 * Progresso por trilha do próprio aluno (trilhas atribuídas às turmas dele),
 * com total de módulos, concluídos e última atividade. A trilha é considerada
 * concluída quando `completed === total` e `total > 0`.
 */
export async function listStudentTrailCompletion(studentId: string, tenantId: string) {
  return db
    .selectDistinct({
      trailId: trails.id,
      trailTitle: trails.title,
      totalModules: sql<string>`count(distinct ${trailModules.id})`,
      completedModules: sql<string>`count(distinct ${moduleProgress.id}) filter (where ${moduleProgress.status} = 'completed')`,
      lastActivity: sql<string | null>`max(${challengeSubmissions.submittedAt})`,
    })
    .from(classStudents)
    .innerJoin(classTrails, eq(classTrails.classId, classStudents.classId))
    .innerJoin(trails, eq(trails.id, classTrails.trailId))
    .innerJoin(tenantTrails, and(eq(tenantTrails.trailId, trails.id), eq(tenantTrails.tenantId, tenantId)))
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
    .where(eq(classStudents.studentId, studentId))
    .groupBy(trails.id, trails.title)
}

/** Nome do aluno (validando tenant + papel student). */
export async function findStudentName(studentId: string, tenantId: string): Promise<string | null> {
  const [row] = await db
    .select({ name: users.name })
    .from(users)
    .where(and(eq(users.id, studentId), eq(users.tenantId, tenantId), eq(users.role, 'student')))
    .limit(1)
  return row?.name ?? null
}

/** Nome do tenant (para o rodapé do certificado). */
export async function findTenantName(tenantId: string): Promise<string | null> {
  const [row] = await db.select({ name: tenants.name }).from(tenants).where(eq(tenants.id, tenantId)).limit(1)
  return row?.name ?? null
}

/** Conclusão de uma trilha específica para o aluno (para validar o certificado). */
export async function findTrailCompletion(studentId: string, tenantId: string, trailId: string) {
  const [row] = await db
    .select({
      trailTitle: trails.title,
      totalModules: sql<string>`count(distinct ${trailModules.id})`,
      completedModules: sql<string>`count(distinct ${moduleProgress.id}) filter (where ${moduleProgress.status} = 'completed')`,
    })
    .from(trails)
    .innerJoin(tenantTrails, and(eq(tenantTrails.trailId, trails.id), eq(tenantTrails.tenantId, tenantId)))
    .leftJoin(trailModules, eq(trailModules.trailId, trails.id))
    .leftJoin(
      moduleProgress,
      and(
        eq(moduleProgress.moduleId, trailModules.id),
        eq(moduleProgress.studentId, studentId),
        eq(moduleProgress.tenantId, tenantId),
      ),
    )
    .where(eq(trails.id, trailId))
    .groupBy(trails.id, trails.title)
    .limit(1)
  return row ?? null
}
