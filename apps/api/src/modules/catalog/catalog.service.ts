import {
  listTrails,
  findTrailById,
  findTrailBySlug,
  findTrailWithModules,
  createTrail,
  updateTrail,
  deleteTrail,
  isTrailInUse,
  hasTrailSubmissions,
  findModuleIdsByTrailId,
  findModuleById,
  nextModuleOrder,
  createModule,
  updateModule,
  deleteModule,
  hasModuleSubmissions,
  deleteChallengesOfModule,
  deleteModuleProgress,
  findChallengeById,
  nextChallengeOrder,
  createChallenge,
  updateChallenge,
  deleteChallenge,
  hasChallengeSubmissions,
  deleteChallengeDependencies,
} from './catalog.repository.js'
import { ConflictError, NotFoundError } from '../../shared/errors/index.js'
import type {
  ListTrailsQuery,
  CreateTrailBody,
  UpdateTrailBody,
  CreateModuleBody,
  UpdateModuleBody,
  CreateChallengeBody,
  UpdateChallengeBody,
} from './catalog.schema.js'

// ─── Trails ───────────────────────────────────────────────────────────────────

export async function getTrails(query: ListTrailsQuery) {
  const { rows, total } = await listTrails({
    language: query.language,
    page: query.page,
    limit: query.limit,
  })
  return { data: rows, meta: { total, page: query.page, limit: query.limit } }
}

export async function getTrailDetail(trailId: string) {
  const result = await findTrailWithModules(trailId)
  if (!result) throw new NotFoundError('Trilha')
  return { trail: result.trail, modules: result.modules }
}

export async function createNewTrail(body: CreateTrailBody) {
  const existing = await findTrailBySlug(body.slug)
  if (existing) throw new ConflictError('Slug já existe no catálogo')

  // order: se não informado, usa 1 (o admin pode reordenar depois via PATCH)
  const trail = await createTrail({
    slug: body.slug,
    title: body.title,
    description: body.description,
    language: body.language,
    order: body.order ?? 1,
  })

  return { trail }
}

export async function updateExistingTrail(trailId: string, body: UpdateTrailBody) {
  const existing = await findTrailById(trailId)
  if (!existing) throw new NotFoundError('Trilha')

  const trail = await updateTrail(trailId, {
    title: body.title,
    description: body.description,
    order: body.order,
  })

  return { trail: trail! }
}

export async function removeTrail(trailId: string) {
  const existing = await findTrailById(trailId)
  if (!existing) throw new NotFoundError('Trilha')

  const inUse = await isTrailInUse(trailId)
  if (inUse) throw new ConflictError('Trilha está em uso por um ou mais tenants')

  const hasSubmissions = await hasTrailSubmissions(trailId)
  if (hasSubmissions) {
    throw new ConflictError('Trilha possui desafios com submissões — não é possível remover')
  }

  // Cascade: challenges (+ dependências) → module_progress → modules → trail
  const moduleIds = await findModuleIdsByTrailId(trailId)
  for (const moduleId of moduleIds) {
    await deleteChallengesOfModule(moduleId)
    await deleteModuleProgress(moduleId)
    await deleteModule(moduleId)
  }
  await deleteTrail(trailId)
}

// ─── Modules ──────────────────────────────────────────────────────────────────

export async function createNewModule(trailId: string, body: CreateModuleBody) {
  const trail = await findTrailById(trailId)
  if (!trail) throw new NotFoundError('Trilha')

  const order = body.order ?? (await nextModuleOrder(trailId))

  const mod = await createModule({
    trailId,
    title: body.title,
    concept: body.concept,
    exampleCode: body.exampleCode,
    vocabulary: body.vocabulary,
    order,
  })

  return { module: mod }
}

export async function updateExistingModule(moduleId: string, body: UpdateModuleBody) {
  const existing = await findModuleById(moduleId)
  if (!existing) throw new NotFoundError('Módulo')

  const mod = await updateModule(moduleId, {
    title: body.title,
    concept: body.concept,
    exampleCode: body.exampleCode,
    vocabulary: body.vocabulary,
    order: body.order,
  })

  return { module: mod! }
}

export async function removeModule(moduleId: string) {
  const existing = await findModuleById(moduleId)
  if (!existing) throw new NotFoundError('Módulo')

  const hasSubmissions = await hasModuleSubmissions(moduleId)
  if (hasSubmissions) {
    throw new ConflictError('Módulo tem desafios com submissões — não é possível remover')
  }

  // Cascade: challenges (+ dependências) → module_progress → module
  await deleteChallengesOfModule(moduleId)
  await deleteModuleProgress(moduleId)
  await deleteModule(moduleId)
}

// ─── Challenges ───────────────────────────────────────────────────────────────

export async function createNewChallenge(moduleId: string, body: CreateChallengeBody) {
  const mod = await findModuleById(moduleId)
  if (!mod) throw new NotFoundError('Módulo')

  const order = body.order ?? (await nextChallengeOrder(moduleId))

  const challenge = await createChallenge({
    moduleId,
    title: body.title,
    description: body.description,
    starterCode: body.starterCode,
    testCases: body.testCases as any,
    difficulty: body.difficulty,
    order,
    baseXp: body.baseXp ?? 10,
    validationModeOverride: body.validationModeOverride,
    targetFn: body.targetFn,
    renderMode: body.renderMode,
  })

  return { challenge }
}

export async function updateExistingChallenge(challengeId: string, body: UpdateChallengeBody) {
  const existing = await findChallengeById(challengeId)
  if (!existing) throw new NotFoundError('Desafio')

  const challenge = await updateChallenge(challengeId, {
    title: body.title,
    description: body.description,
    starterCode: body.starterCode,
    testCases: body.testCases as any,
    difficulty: body.difficulty,
    order: body.order,
    baseXp: body.baseXp,
    validationModeOverride: body.validationModeOverride,
    targetFn: body.targetFn,
    renderMode: body.renderMode,
  })

  return { challenge: challenge! }
}

export async function removeChallenge(challengeId: string) {
  const existing = await findChallengeById(challengeId)
  if (!existing) throw new NotFoundError('Desafio')

  const hasSubmissions = await hasChallengeSubmissions(challengeId)
  if (hasSubmissions) {
    throw new ConflictError('Desafio tem submissões — não é possível remover')
  }

  // Cascade: weekly challenges + ai conversations → challenge
  await deleteChallengeDependencies(challengeId)
  await deleteChallenge(challengeId)
}
