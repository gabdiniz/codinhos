import { randomBytes } from 'node:crypto'
import {
  createOwnedTrail,
  listOwnedTrails,
  findOwnedTrail,
  getOwnedTrailDetail,
  findOwnedTrailIdForModule,
  findOwnedModuleIdForChallenge,
  deleteClassTrailsByTrail,
} from './authoring.repository.js'
import {
  updateTrail,
  deleteTrail,
  hasTrailSubmissions,
  findModuleIdsByTrailId,
  createModule,
  updateModule,
  deleteModule,
  nextModuleOrder,
  hasModuleSubmissions,
  deleteChallengesOfModule,
  deleteModuleProgress,
  createChallenge,
  updateChallenge,
  deleteChallenge,
  nextChallengeOrder,
  hasChallengeSubmissions,
  deleteChallengeDependencies,
} from '../catalog/catalog.repository.js'
import { activateTrail, deactivateTrail, nextTenantTrailOrder, findTenantTrail } from '../tenant-trails/tenant-trails.repository.js'
import { ConflictError, NotFoundError } from '../../shared/errors/index.js'
import type { TestCase } from '../../shared/db/schema.js'
import type {
  CreateTrailBody,
  UpdateTrailBody,
  CreateModuleBody,
  UpdateModuleBody,
  CreateChallengeBody,
  UpdateChallengeBody,
} from './authoring.schema.js'

function slugify(title: string): string {
  const base = title
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
  return `${base || 'trilha'}-${randomBytes(4).toString('hex')}`
}

function moduleOut(m: { id: string; title: string; concept: string | null; exampleCode: string | null; vocabulary: string[] | null; order: number }) {
  return { id: m.id, title: m.title, concept: m.concept, exampleCode: m.exampleCode, vocabulary: m.vocabulary ?? [], order: m.order }
}

// ─── Trilhas ──────────────────────────────────────────────────────────────────

export async function getMyTrails(tenantId: string) {
  return { data: await listOwnedTrails(tenantId) }
}

export async function createMyTrail(tenantId: string, body: CreateTrailBody) {
  const existing = await listOwnedTrails(tenantId)
  const trail = await createOwnedTrail({
    tenantId,
    slug: slugify(body.title),
    title: body.title,
    description: body.description,
    language: body.language,
    order: existing.length,
  })
  // Auto-ativa no tenant (entra em tenant_trails) para já poder ser atribuída a turmas.
  const already = await findTenantTrail(tenantId, trail.id)
  if (!already) {
    await activateTrail(tenantId, trail.id, await nextTenantTrailOrder(tenantId))
  }
  return { trail }
}

export async function getMyTrailDetail(tenantId: string, trailId: string) {
  const detail = await getOwnedTrailDetail(trailId, tenantId)
  if (!detail) throw new NotFoundError('Trilha')
  return {
    trail: detail.trail,
    modules: detail.modules.map((m) => ({ ...moduleOut(m), challenges: m.challenges })),
  }
}

export async function updateMyTrail(tenantId: string, trailId: string, body: UpdateTrailBody) {
  const owned = await findOwnedTrail(trailId, tenantId)
  if (!owned) throw new NotFoundError('Trilha')
  const trail = await updateTrail(trailId, { title: body.title, description: body.description })
  return { trail: trail! }
}

export async function removeMyTrail(tenantId: string, trailId: string) {
  const owned = await findOwnedTrail(trailId, tenantId)
  if (!owned) throw new NotFoundError('Trilha')
  if (await hasTrailSubmissions(trailId)) {
    throw new ConflictError('Trilha possui desafios com submissões — não é possível remover')
  }
  // Cascade: vínculos de turma → desativa do tenant → desafios/progresso → módulos → trilha
  await deleteClassTrailsByTrail(trailId)
  await deactivateTrail(tenantId, trailId)
  const moduleIds = await findModuleIdsByTrailId(trailId)
  for (const moduleId of moduleIds) {
    await deleteChallengesOfModule(moduleId)
    await deleteModuleProgress(moduleId)
    await deleteModule(moduleId)
  }
  await deleteTrail(trailId)
}

// ─── Módulos ──────────────────────────────────────────────────────────────────

export async function addMyModule(tenantId: string, trailId: string, body: CreateModuleBody) {
  const owned = await findOwnedTrail(trailId, tenantId)
  if (!owned) throw new NotFoundError('Trilha')
  const order = await nextModuleOrder(trailId)
  const mod = await createModule({
    trailId,
    title: body.title,
    concept: body.concept,
    exampleCode: body.exampleCode,
    vocabulary: body.vocabulary,
    order,
  })
  return { module: moduleOut(mod) }
}

export async function updateMyModule(tenantId: string, moduleId: string, body: UpdateModuleBody) {
  const trailId = await findOwnedTrailIdForModule(moduleId, tenantId)
  if (!trailId) throw new NotFoundError('Módulo')
  const mod = await updateModule(moduleId, {
    title: body.title,
    concept: body.concept,
    exampleCode: body.exampleCode,
    vocabulary: body.vocabulary,
  })
  return { module: moduleOut(mod!) }
}

export async function removeMyModule(tenantId: string, moduleId: string) {
  const trailId = await findOwnedTrailIdForModule(moduleId, tenantId)
  if (!trailId) throw new NotFoundError('Módulo')
  if (await hasModuleSubmissions(moduleId)) {
    throw new ConflictError('Módulo tem desafios com submissões — não é possível remover')
  }
  await deleteChallengesOfModule(moduleId)
  await deleteModuleProgress(moduleId)
  await deleteModule(moduleId)
}

// ─── Desafios ─────────────────────────────────────────────────────────────────

export async function addMyChallenge(tenantId: string, moduleId: string, body: CreateChallengeBody) {
  const trailId = await findOwnedTrailIdForModule(moduleId, tenantId)
  if (!trailId) throw new NotFoundError('Módulo')
  const order = await nextChallengeOrder(moduleId)
  const challenge = await createChallenge({
    moduleId,
    title: body.title,
    description: body.description,
    starterCode: body.starterCode,
    testCases: body.testCases as TestCase[] | undefined,
    difficulty: body.difficulty,
    baseXp: body.baseXp ?? 10,
    order,
    targetFn: body.targetFn,
  })
  return { challenge }
}

export async function updateMyChallenge(tenantId: string, challengeId: string, body: UpdateChallengeBody) {
  const moduleId = await findOwnedModuleIdForChallenge(challengeId, tenantId)
  if (!moduleId) throw new NotFoundError('Desafio')
  const challenge = await updateChallenge(challengeId, {
    title: body.title,
    description: body.description,
    starterCode: body.starterCode,
    testCases: body.testCases as TestCase[] | null | undefined,
    difficulty: body.difficulty,
    baseXp: body.baseXp,
    targetFn: body.targetFn,
  })
  return { challenge: challenge! }
}

export async function removeMyChallenge(tenantId: string, challengeId: string) {
  const moduleId = await findOwnedModuleIdForChallenge(challengeId, tenantId)
  if (!moduleId) throw new NotFoundError('Desafio')
  if (await hasChallengeSubmissions(challengeId)) {
    throw new ConflictError('Desafio tem submissões — não é possível remover')
  }
  await deleteChallengeDependencies(challengeId)
  await deleteChallenge(challengeId)
}
