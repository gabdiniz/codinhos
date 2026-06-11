import { eq, and, inArray, count, desc } from 'drizzle-orm'
import { db } from '../../shared/db/index.js'
import {
  classes,
  classStudents,
  classTrails,
  trails,
  trailModules,
  challenges,
  moduleProgress,
  studentStats,
  challengeSubmissions,
} from '../../shared/db/schema.js'

// ─── Membership ───────────────────────────────────────────────────────────────

/** Retorna dados da turma somente se o aluno pertencer a ela (e a turma pertencer ao tenant). */
export async function findClassWithMembership(
  classId: string,
  studentId: string,
  tenantId: string,
) {
  const [row] = await db
    .select({
      id: classes.id,
      name: classes.name,
      progressionMode: classes.progressionMode,
      validationMode: classes.validationMode,
    })
    .from(classes)
    .innerJoin(
      classStudents,
      and(eq(classStudents.classId, classes.id), eq(classStudents.studentId, studentId)),
    )
    .where(and(eq(classes.id, classId), eq(classes.tenantId, tenantId)))
    .limit(1)
  return row ?? null
}

/** Primeira turma em que o aluno está matriculado no tenant (usado quando classId não é informado). */
export async function findFirstStudentClass(studentId: string, tenantId: string) {
  const [row] = await db
    .select({
      id: classes.id,
      name: classes.name,
      progressionMode: classes.progressionMode,
      validationMode: classes.validationMode,
    })
    .from(classes)
    .innerJoin(classStudents, eq(classStudents.classId, classes.id))
    .where(and(eq(classStudents.studentId, studentId), eq(classes.tenantId, tenantId)))
    .limit(1)
  return row ?? null
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

/** Trilhas atribuídas à turma com dados da trilha, ordenadas por order. */
export async function listClassTrailsWithData(classId: string) {
  return db
    .select({
      trailId: classTrails.trailId,
      order: classTrails.order,
      visualBlocksEnabled: classTrails.visualBlocksEnabled,
      trail: {
        id: trails.id,
        title: trails.title,
        description: trails.description,
      },
    })
    .from(classTrails)
    .innerJoin(trails, eq(trails.id, classTrails.trailId))
    .where(eq(classTrails.classId, classId))
    .orderBy(classTrails.order)
}

/** Contagem de módulos totais por trilha (map trailId → total). */
export async function countModulesPerTrail(
  trailIds: string[],
): Promise<Record<string, number>> {
  if (trailIds.length === 0) return {}
  const rows = await db
    .select({ trailId: trailModules.trailId, total: count() })
    .from(trailModules)
    .where(inArray(trailModules.trailId, trailIds))
    .groupBy(trailModules.trailId)
  return Object.fromEntries(rows.map((r) => [r.trailId, Number(r.total)]))
}

/** Contagem de módulos concluídos por trilha para o aluno (map trailId → completed). */
export async function countCompletedModulesPerTrail(
  trailIds: string[],
  studentId: string,
  tenantId: string,
): Promise<Record<string, number>> {
  if (trailIds.length === 0) return {}
  const rows = await db
    .select({ trailId: trailModules.trailId, completed: count() })
    .from(moduleProgress)
    .innerJoin(trailModules, eq(trailModules.id, moduleProgress.moduleId))
    .where(
      and(
        eq(moduleProgress.tenantId, tenantId),
        eq(moduleProgress.studentId, studentId),
        eq(moduleProgress.status, 'completed'),
        inArray(trailModules.trailId, trailIds),
      ),
    )
    .groupBy(trailModules.trailId)
  return Object.fromEntries(rows.map((r) => [r.trailId, Number(r.completed)]))
}

/** Stats do aluno (XP, nível, streak). */
export async function findStudentStats(studentId: string, tenantId: string) {
  const [row] = await db
    .select({
      totalXp: studentStats.totalXp,
      level: studentStats.level,
      currentStreak: studentStats.currentStreak,
    })
    .from(studentStats)
    .where(and(eq(studentStats.tenantId, tenantId), eq(studentStats.studentId, studentId)))
    .limit(1)
  return row ?? null
}

// ─── Trail detail ─────────────────────────────────────────────────────────────

/** class_trail com dados da turma e da trilha. */
export async function findClassTrail(classId: string, trailId: string) {
  const [row] = await db
    .select({
      visualBlocksEnabled: classTrails.visualBlocksEnabled,
      class: {
        id: classes.id,
        progressionMode: classes.progressionMode,
      },
      trail: {
        id: trails.id,
        title: trails.title,
        description: trails.description,
      },
    })
    .from(classTrails)
    .innerJoin(classes, eq(classes.id, classTrails.classId))
    .innerJoin(trails, eq(trails.id, classTrails.trailId))
    .where(and(eq(classTrails.classId, classId), eq(classTrails.trailId, trailId)))
    .limit(1)
  return row ?? null
}

/** Módulos de uma trilha com o primeiro desafio de cada um, ordenados por order. */
export async function listTrailModulesWithChallenge(trailId: string) {
  const mods = await db
    .select({
      id: trailModules.id,
      title: trailModules.title,
      order: trailModules.order,
    })
    .from(trailModules)
    .where(eq(trailModules.trailId, trailId))
    .orderBy(trailModules.order)

  if (mods.length === 0) return []

  const moduleIds = mods.map((m) => m.id)
  const challengeRows = await db
    .select({
      id: challenges.id,
      moduleId: challenges.moduleId,
      title: challenges.title,
      difficulty: challenges.difficulty,
    })
    .from(challenges)
    .where(inArray(challenges.moduleId, moduleIds))
    .orderBy(challenges.order)

  // Primeiro desafio por módulo
  const challengeMap = new Map<string, (typeof challengeRows)[0]>()
  for (const ch of challengeRows) {
    if (!challengeMap.has(ch.moduleId)) challengeMap.set(ch.moduleId, ch)
  }

  return mods.map((m) => ({
    ...m,
    challenge: challengeMap.get(m.id) ?? null,
  }))
}

/** Registros de module_progress do aluno para os módulos de uma trilha.
 *  Retorna map moduleId → status. */
export async function listModuleProgressForTrail(
  trailId: string,
  studentId: string,
  tenantId: string,
): Promise<Map<string, 'locked' | 'available' | 'completed'>> {
  const rows = await db
    .select({
      moduleId: moduleProgress.moduleId,
      status: moduleProgress.status,
    })
    .from(moduleProgress)
    .innerJoin(trailModules, eq(trailModules.id, moduleProgress.moduleId))
    .where(
      and(
        eq(moduleProgress.tenantId, tenantId),
        eq(moduleProgress.studentId, studentId),
        eq(trailModules.trailId, trailId),
      ),
    )
  return new Map(rows.map((r) => [r.moduleId, r.status]))
}

// ─── Module detail ────────────────────────────────────────────────────────────

/** Módulo com seu primeiro desafio (para GET /modules/:moduleId). */
export async function findModuleWithChallenge(moduleId: string) {
  const [mod] = await db
    .select({
      id: trailModules.id,
      trailId: trailModules.trailId,
      title: trailModules.title,
      concept: trailModules.concept,
      exampleCode: trailModules.exampleCode,
      order: trailModules.order,
    })
    .from(trailModules)
    .where(eq(trailModules.id, moduleId))
    .limit(1)
  if (!mod) return null

  const [challenge] = await db
    .select({
      id: challenges.id,
      title: challenges.title,
      description: challenges.description,
      starterCode: challenges.starterCode,
      testCases: challenges.testCases,
      difficulty: challenges.difficulty,
      baseXp: challenges.baseXp,
    })
    .from(challenges)
    .where(eq(challenges.moduleId, moduleId))
    .orderBy(challenges.order)
    .limit(1)

  return { ...mod, challenge: challenge ?? null }
}

/** IDs e order de todos os módulos de uma trilha (para cálculo de status sequencial). */
export async function listTrailModuleIds(trailId: string) {
  return db
    .select({ id: trailModules.id, order: trailModules.order })
    .from(trailModules)
    .where(eq(trailModules.trailId, trailId))
    .orderBy(trailModules.order)
}

/** Total de submissões do aluno para um desafio no tenant. */
export async function countStudentSubmissions(
  challengeId: string,
  studentId: string,
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
      ),
    )
  return Number(row?.total ?? 0)
}

// ─── Challenge detail ─────────────────────────────────────────────────────────

/** Desafio com trailId resolvido via join com trail_modules. */
export async function findChallengeWithTrail(challengeId: string) {
  const [row] = await db
    .select({
      id: challenges.id,
      moduleId: challenges.moduleId,
      title: challenges.title,
      description: challenges.description,
      starterCode: challenges.starterCode,
      difficulty: challenges.difficulty,
      baseXp: challenges.baseXp,
      trailId: trailModules.trailId,
    })
    .from(challenges)
    .innerJoin(trailModules, eq(trailModules.id, challenges.moduleId))
    .where(eq(challenges.id, challengeId))
    .limit(1)
  return row ?? null
}

/** Última submissão do aluno para um desafio em uma turma específica. */
export async function findLastSubmission(
  challengeId: string,
  studentId: string,
  classId: string,
  tenantId: string,
) {
  const [row] = await db
    .select({
      id: challengeSubmissions.id,
      code: challengeSubmissions.code,
      status: challengeSubmissions.status,
      testResults: challengeSubmissions.testResults,
    })
    .from(challengeSubmissions)
    .where(
      and(
        eq(challengeSubmissions.tenantId, tenantId),
        eq(challengeSubmissions.studentId, studentId),
        eq(challengeSubmissions.challengeId, challengeId),
        eq(challengeSubmissions.classId, classId),
      ),
    )
    .orderBy(desc(challengeSubmissions.submittedAt))
    .limit(1)
  return row ?? null
}
