import { eq, and, inArray } from 'drizzle-orm'
import { db } from '../../shared/db/index.js'
import { trails, trailModules, challenges, classTrails } from '../../shared/db/schema.js'
import type { TestCase } from '../../shared/db/schema.js'

// ─── Trilhas próprias do tenant ───────────────────────────────────────────────

type CreateOwnedTrailInput = {
  tenantId: string
  slug: string
  title: string
  description?: string
  language: 'javascript' | 'python'
  order: number
}

export async function createOwnedTrail(input: CreateOwnedTrailInput) {
  const [trail] = await db
    .insert(trails)
    .values(input)
    .returning({
      id: trails.id,
      slug: trails.slug,
      title: trails.title,
      description: trails.description,
      language: trails.language,
      order: trails.order,
    })
  return trail!
}

export async function listOwnedTrails(tenantId: string) {
  return db
    .select({
      id: trails.id,
      slug: trails.slug,
      title: trails.title,
      description: trails.description,
      language: trails.language,
      order: trails.order,
    })
    .from(trails)
    .where(eq(trails.tenantId, tenantId))
    .orderBy(trails.order, trails.createdAt)
}

// Anotação explícita: sem ela o TS descarta o ramo `null` do `?? null`.
export async function findOwnedTrail(
  trailId: string,
  tenantId: string,
): Promise<
  | { id: string; slug: string; title: string; description: string | null; language: 'javascript' | 'python'; order: number }
  | null
> {
  const [trail] = await db
    .select({
      id: trails.id,
      slug: trails.slug,
      title: trails.title,
      description: trails.description,
      language: trails.language,
      order: trails.order,
    })
    .from(trails)
    .where(and(eq(trails.id, trailId), eq(trails.tenantId, tenantId)))
    .limit(1)
  return trail ?? null
}

/** Detalhe completo da trilha própria (módulos + desafios) para edição. */
export async function getOwnedTrailDetail(trailId: string, tenantId: string) {
  const trail = await findOwnedTrail(trailId, tenantId)
  if (!trail) return null

  const modules = await db
    .select({
      id: trailModules.id,
      title: trailModules.title,
      concept: trailModules.concept,
      exampleCode: trailModules.exampleCode,
      vocabulary: trailModules.vocabulary,
      order: trailModules.order,
    })
    .from(trailModules)
    .where(eq(trailModules.trailId, trailId))
    .orderBy(trailModules.order)

  const moduleIds = modules.map((m) => m.id)
  let challengeRows: {
    id: string
    moduleId: string
    title: string
    description: string | null
    starterCode: string | null
    testCases: TestCase[] | null
    difficulty: 'easy' | 'medium' | 'hard'
    baseXp: number
    order: number
  }[] = []
  if (moduleIds.length > 0) {
    challengeRows = await db
      .select({
        id: challenges.id,
        moduleId: challenges.moduleId,
        title: challenges.title,
        description: challenges.description,
        starterCode: challenges.starterCode,
        testCases: challenges.testCases,
        difficulty: challenges.difficulty,
        baseXp: challenges.baseXp,
        order: challenges.order,
      })
      .from(challenges)
      .where(inArray(challenges.moduleId, moduleIds))
      .orderBy(challenges.order)
  }

  return {
    trail,
    modules: modules.map((m) => ({
      ...m,
      vocabulary: m.vocabulary ?? [],
      challenges: challengeRows.filter((c) => c.moduleId === m.id),
    })),
  }
}

// ─── Verificações de posse (escopo de tenant) ─────────────────────────────────

/** Retorna o trailId se o módulo pertence a uma trilha do tenant; senão null. */
export async function findOwnedTrailIdForModule(moduleId: string, tenantId: string): Promise<string | null> {
  const [row] = await db
    .select({ trailId: trailModules.trailId })
    .from(trailModules)
    .innerJoin(trails, eq(trails.id, trailModules.trailId))
    .where(and(eq(trailModules.id, moduleId), eq(trails.tenantId, tenantId)))
    .limit(1)
  return row?.trailId ?? null
}

/** Retorna o moduleId se o desafio pertence a uma trilha do tenant; senão null. */
export async function findOwnedModuleIdForChallenge(challengeId: string, tenantId: string): Promise<string | null> {
  const [row] = await db
    .select({ moduleId: challenges.moduleId })
    .from(challenges)
    .innerJoin(trailModules, eq(trailModules.id, challenges.moduleId))
    .innerJoin(trails, eq(trails.id, trailModules.trailId))
    .where(and(eq(challenges.id, challengeId), eq(trails.tenantId, tenantId)))
    .limit(1)
  return row?.moduleId ?? null
}

/** Remove os vínculos de turma (class_trails) de uma trilha — usado no cascade de deleção. */
export async function deleteClassTrailsByTrail(trailId: string) {
  await db.delete(classTrails).where(eq(classTrails.trailId, trailId))
}
