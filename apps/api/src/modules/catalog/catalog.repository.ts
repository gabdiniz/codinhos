import { count, eq, inArray, and, isNull } from 'drizzle-orm'
import { db } from '../../shared/db/index.js'
import {
  trails,
  trailModules,
  challenges,
  tenantTrails,
  challengeSubmissions,
  classWeeklyChallenges,
  aiConversations,
  moduleProgress,
} from '../../shared/db/schema.js'
import type { TestCase } from '../../shared/db/schema.js'

// ─── Trails ───────────────────────────────────────────────────────────────────

type ListTrailsOptions = {
  language?: 'javascript' | 'python'
  page: number
  limit: number
}

export async function listTrails({ language, page, limit }: ListTrailsOptions) {
  // Catálogo = só trilhas globais (tenant_id NULL). Trilhas próprias de escola
  // (autoria do gestor) NÃO aparecem aqui — evita vazamento entre tenants.
  const where =
    language !== undefined
      ? and(isNull(trails.tenantId), eq(trails.language, language))
      : isNull(trails.tenantId)

  const [rows, [{ value: total }]] = await Promise.all([
    db
      .select({
        id: trails.id,
        slug: trails.slug,
        title: trails.title,
        description: trails.description,
        language: trails.language,
        order: trails.order,
      })
      .from(trails)
      .where(where)
      .orderBy(trails.order, trails.createdAt)
      .limit(limit)
      .offset((page - 1) * limit),
    db.select({ value: count() }).from(trails).where(where),
  ])

  return { rows, total: Number(total) }
}

export async function findTrailById(id: string) {
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
    .where(and(eq(trails.id, id), isNull(trails.tenantId)))
    .limit(1)
  return trail ?? null
}

export async function findTrailBySlug(slug: string) {
  const [trail] = await db
    .select({ id: trails.id })
    .from(trails)
    .where(eq(trails.slug, slug))
    .limit(1)
  return trail ?? null
}

/** Retorna trail com módulos e desafios aninhados */
export async function findTrailWithModules(trailId: string) {
  const trail = await findTrailById(trailId)
  if (!trail) return null

  const modules = await db
    .select({
      id: trailModules.id,
      title: trailModules.title,
      order: trailModules.order,
    })
    .from(trailModules)
    .where(eq(trailModules.trailId, trailId))
    .orderBy(trailModules.order)

  const moduleIds = modules.map((m) => m.id)

  let allChallenges: {
    id: string
    moduleId: string
    title: string
    description: string | null
    starterCode: string | null
    testCases: TestCase[] | null
    difficulty: 'easy' | 'medium' | 'hard'
    order: number
    baseXp: number
    targetFn: string | null
    renderMode: string | null
  }[] = []

  if (moduleIds.length > 0) {
    allChallenges = await db
      .select({
        id: challenges.id,
        moduleId: challenges.moduleId,
        title: challenges.title,
        description: challenges.description,
        starterCode: challenges.starterCode,
        testCases: challenges.testCases,
        difficulty: challenges.difficulty,
        order: challenges.order,
        baseXp: challenges.baseXp,
        targetFn: challenges.targetFn,
        renderMode: challenges.renderMode,
      })
      .from(challenges)
      .where(inArray(challenges.moduleId, moduleIds))
      .orderBy(challenges.order)
  }

  const modulesWithChallenges = modules.map((m) => ({
    ...m,
    challenges: allChallenges.filter((c) => c.moduleId === m.id),
  }))

  return { trail, modules: modulesWithChallenges }
}

type CreateTrailInput = {
  slug: string
  title: string
  description?: string
  language: 'javascript' | 'python'
  order: number
}

export async function createTrail(input: CreateTrailInput) {
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

type UpdateTrailInput = {
  title?: string
  description?: string | null
  order?: number
}

export async function updateTrail(id: string, input: UpdateTrailInput) {
  const [trail] = await db
    .update(trails)
    .set({
      ...(input.title !== undefined && { title: input.title }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.order !== undefined && { order: input.order }),
    })
    .where(eq(trails.id, id))
    .returning({
      id: trails.id,
      slug: trails.slug,
      title: trails.title,
      description: trails.description,
      language: trails.language,
      order: trails.order,
    })
  return trail ?? null
}

export async function deleteTrail(id: string) {
  await db.delete(trails).where(eq(trails.id, id))
}

/** Verifica se a trilha está em uso por algum tenant */
export async function isTrailInUse(trailId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: tenantTrails.id })
    .from(tenantTrails)
    .where(eq(tenantTrails.trailId, trailId))
    .limit(1)
  return row !== undefined
}

// ─── Modules ──────────────────────────────────────────────────────────────────

export async function findModuleById(id: string) {
  const [mod] = await db
    .select({
      id: trailModules.id,
      trailId: trailModules.trailId,
      title: trailModules.title,
      concept: trailModules.concept,
      exampleCode: trailModules.exampleCode,
      vocabulary: trailModules.vocabulary,
      order: trailModules.order,
    })
    .from(trailModules)
    .where(eq(trailModules.id, id))
    .limit(1)
  return mod ?? null
}

/** Próximo order disponível no módulo (max + 1) */
export async function nextModuleOrder(trailId: string): Promise<number> {
  const rows = await db
    .select({ order: trailModules.order })
    .from(trailModules)
    .where(eq(trailModules.trailId, trailId))
    .orderBy(trailModules.order)
  if (rows.length === 0) return 1
  return rows[rows.length - 1]!.order + 1
}

type CreateModuleInput = {
  trailId: string
  title: string
  concept?: string
  exampleCode?: string
  vocabulary?: string[]
  order: number
}

export async function createModule(input: CreateModuleInput) {
  const [mod] = await db
    .insert(trailModules)
    .values(input)
    .returning({
      id: trailModules.id,
      trailId: trailModules.trailId,
      title: trailModules.title,
      concept: trailModules.concept,
      exampleCode: trailModules.exampleCode,
      vocabulary: trailModules.vocabulary,
      order: trailModules.order,
    })
  return mod!
}

type UpdateModuleInput = {
  title?: string
  concept?: string | null
  exampleCode?: string | null
  vocabulary?: string[] | null
  order?: number
}

export async function updateModule(id: string, input: UpdateModuleInput) {
  const [mod] = await db
    .update(trailModules)
    .set({
      ...(input.title !== undefined && { title: input.title }),
      ...(input.concept !== undefined && { concept: input.concept }),
      ...(input.exampleCode !== undefined && { exampleCode: input.exampleCode }),
      ...(input.vocabulary !== undefined && { vocabulary: input.vocabulary }),
      ...(input.order !== undefined && { order: input.order }),
    })
    .where(eq(trailModules.id, id))
    .returning({
      id: trailModules.id,
      trailId: trailModules.trailId,
      title: trailModules.title,
      concept: trailModules.concept,
      exampleCode: trailModules.exampleCode,
      vocabulary: trailModules.vocabulary,
      order: trailModules.order,
    })
  return mod ?? null
}

export async function deleteModule(id: string) {
  await db.delete(trailModules).where(eq(trailModules.id, id))
}

/** Verifica se o módulo tem desafios com submissions */
export async function hasModuleSubmissions(moduleId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: challengeSubmissions.id })
    .from(challengeSubmissions)
    .innerJoin(challenges, eq(challenges.id, challengeSubmissions.challengeId))
    .where(eq(challenges.moduleId, moduleId))
    .limit(1)
  return row !== undefined
}

// ─── Challenges ───────────────────────────────────────────────────────────────

export async function findChallengeById(id: string) {
  const [challenge] = await db
    .select({
      id: challenges.id,
      moduleId: challenges.moduleId,
      title: challenges.title,
      description: challenges.description,
      starterCode: challenges.starterCode,
      testCases: challenges.testCases,
      difficulty: challenges.difficulty,
      order: challenges.order,
      baseXp: challenges.baseXp,
      validationModeOverride: challenges.validationModeOverride,
      targetFn: challenges.targetFn,
      renderMode: challenges.renderMode,
    })
    .from(challenges)
    .where(eq(challenges.id, id))
    .limit(1)
  return challenge ?? null
}

/** Próximo order disponível no desafio (max + 1) */
export async function nextChallengeOrder(moduleId: string): Promise<number> {
  const rows = await db
    .select({ order: challenges.order })
    .from(challenges)
    .where(eq(challenges.moduleId, moduleId))
    .orderBy(challenges.order)
  if (rows.length === 0) return 1
  return rows[rows.length - 1]!.order + 1
}

type CreateChallengeInput = {
  moduleId: string
  title: string
  description?: string
  starterCode?: string
  testCases?: TestCase[]
  difficulty: 'easy' | 'medium' | 'hard'
  order: number
  baseXp: number
  validationModeOverride?: 'auto' | 'auto_review' | 'manual' | null
  targetFn?: string | null
  renderMode?: 'js' | 'p5' | null
}

export async function createChallenge(input: CreateChallengeInput) {
  const [challenge] = await db
    .insert(challenges)
    .values(input)
    .returning({
      id: challenges.id,
      moduleId: challenges.moduleId,
      title: challenges.title,
      description: challenges.description,
      starterCode: challenges.starterCode,
      testCases: challenges.testCases,
      difficulty: challenges.difficulty,
      order: challenges.order,
      baseXp: challenges.baseXp,
      validationModeOverride: challenges.validationModeOverride,
      targetFn: challenges.targetFn,
      renderMode: challenges.renderMode,
    })
  return challenge!
}

type UpdateChallengeInput = {
  title?: string
  description?: string | null
  starterCode?: string | null
  testCases?: TestCase[] | null
  difficulty?: 'easy' | 'medium' | 'hard'
  order?: number
  baseXp?: number
  validationModeOverride?: 'auto' | 'auto_review' | 'manual' | null
  targetFn?: string | null
  renderMode?: 'js' | 'p5' | null
}

export async function updateChallenge(id: string, input: UpdateChallengeInput) {
  const [challenge] = await db
    .update(challenges)
    .set({
      ...(input.title !== undefined && { title: input.title }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.starterCode !== undefined && { starterCode: input.starterCode }),
      ...(input.testCases !== undefined && { testCases: input.testCases }),
      ...(input.difficulty !== undefined && { difficulty: input.difficulty }),
      ...(input.order !== undefined && { order: input.order }),
      ...(input.baseXp !== undefined && { baseXp: input.baseXp }),
      ...(input.validationModeOverride !== undefined && {
        validationModeOverride: input.validationModeOverride,
      }),
      ...(input.targetFn !== undefined && { targetFn: input.targetFn }),
      ...(input.renderMode !== undefined && { renderMode: input.renderMode }),
    })
    .where(eq(challenges.id, id))
    .returning({
      id: challenges.id,
      moduleId: challenges.moduleId,
      title: challenges.title,
      description: challenges.description,
      starterCode: challenges.starterCode,
      testCases: challenges.testCases,
      difficulty: challenges.difficulty,
      order: challenges.order,
      baseXp: challenges.baseXp,
      validationModeOverride: challenges.validationModeOverride,
      targetFn: challenges.targetFn,
      renderMode: challenges.renderMode,
    })
  return challenge ?? null
}

export async function deleteChallenge(id: string) {
  await db.delete(challenges).where(eq(challenges.id, id))
}

/** Verifica se o desafio tem submissions */
export async function hasChallengeSubmissions(challengeId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: challengeSubmissions.id })
    .from(challengeSubmissions)
    .where(eq(challengeSubmissions.challengeId, challengeId))
    .limit(1)
  return row !== undefined
}

// ─── Cascade helpers ──────────────────────────────────────────────────────────

/** Retorna IDs dos módulos de uma trilha */
export async function findModuleIdsByTrailId(trailId: string): Promise<string[]> {
  const rows = await db
    .select({ id: trailModules.id })
    .from(trailModules)
    .where(eq(trailModules.trailId, trailId))
  return rows.map((r) => r.id)
}

/** Retorna IDs dos desafios de um módulo */
export async function findChallengeIdsByModuleId(moduleId: string): Promise<string[]> {
  const rows = await db
    .select({ id: challenges.id })
    .from(challenges)
    .where(eq(challenges.moduleId, moduleId))
  return rows.map((r) => r.id)
}

/** Verifica se algum módulo de uma trilha tem submissions */
export async function hasTrailSubmissions(trailId: string): Promise<boolean> {
  const moduleIds = await findModuleIdsByTrailId(trailId)
  if (moduleIds.length === 0) return false

  const [row] = await db
    .select({ id: challengeSubmissions.id })
    .from(challengeSubmissions)
    .innerJoin(challenges, eq(challenges.id, challengeSubmissions.challengeId))
    .where(inArray(challenges.moduleId, moduleIds))
    .limit(1)
  return row !== undefined
}

/** Remove weekly challenges e ai conversations de um desafio (sem submissions) */
export async function deleteChallengeDependencies(challengeId: string) {
  await db
    .delete(classWeeklyChallenges)
    .where(eq(classWeeklyChallenges.challengeId, challengeId))
  await db
    .delete(aiConversations)
    .where(eq(aiConversations.challengeId, challengeId))
}

/** Remove challenges e suas dependências de um módulo (sem submissions) */
export async function deleteChallengesOfModule(moduleId: string) {
  const challengeIds = await findChallengeIdsByModuleId(moduleId)
  if (challengeIds.length === 0) return

  await db
    .delete(classWeeklyChallenges)
    .where(inArray(classWeeklyChallenges.challengeId, challengeIds))
  await db
    .delete(aiConversations)
    .where(inArray(aiConversations.challengeId, challengeIds))
  await db
    .delete(challenges)
    .where(inArray(challenges.id, challengeIds))
}

/** Remove module_progress de um módulo */
export async function deleteModuleProgress(moduleId: string) {
  await db.delete(moduleProgress).where(eq(moduleProgress.moduleId, moduleId))
}
