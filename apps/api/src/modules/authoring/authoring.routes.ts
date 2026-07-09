import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { resolveTenant } from '../../shared/middlewares/resolve-tenant.js'
import { authenticate } from '../../shared/middlewares/authenticate.js'
import { requireRole } from '../../shared/middlewares/require-role.js'
import { generateChallenge } from './challenge-gen.service.js'
import {
  getMyTrails,
  createMyTrail,
  getMyTrailDetail,
  updateMyTrail,
  removeMyTrail,
  addMyModule,
  updateMyModule,
  removeMyModule,
  addMyChallenge,
  updateMyChallenge,
  removeMyChallenge,
} from './authoring.service.js'
import {
  slugParamsSchema,
  trailParamsSchema,
  moduleParamsSchema,
  challengeParamsSchema,
  createTrailBodySchema,
  updateTrailBodySchema,
  createModuleBodySchema,
  updateModuleBodySchema,
  createChallengeBodySchema,
  generateChallengeBodySchema,
  generateChallengeResponseSchema,
  updateChallengeBodySchema,
  listTrailsResponseSchema,
  trailResponseSchema,
  trailDetailResponseSchema,
  moduleResponseSchema,
  challengeResponseSchema,
  messageResponseSchema,
} from './authoring.schema.js'

// Autoria de conteúdo próprio do tenant (Sprint 9) — só gestor. Tudo escopado por
// tenant_id na camada de service (posse verificada antes de cada operação).
export async function authoringRoutes(app: FastifyInstance) {
  const f = app.withTypeProvider<ZodTypeProvider>()
  const guard = [resolveTenant, authenticate, requireRole('manager')]

  // ── Trilhas ─────────────────────────────────────────────────────────────────
  f.get('/:slug/authoring/trails',
    { schema: { params: slugParamsSchema, response: { 200: listTrailsResponseSchema } }, preHandler: guard },
    async (req, reply) => reply.status(200).send(await getMyTrails(req.resolvedTenantId)))

  f.post('/:slug/authoring/trails',
    { schema: { params: slugParamsSchema, body: createTrailBodySchema, response: { 201: trailResponseSchema } }, preHandler: guard },
    async (req, reply) => reply.status(201).send({ data: await createMyTrail(req.resolvedTenantId, req.body) }))

  f.get('/:slug/authoring/trails/:trailId',
    { schema: { params: trailParamsSchema, response: { 200: trailDetailResponseSchema } }, preHandler: guard },
    async (req, reply) => reply.status(200).send({ data: await getMyTrailDetail(req.resolvedTenantId, req.params.trailId) }))

  f.patch('/:slug/authoring/trails/:trailId',
    { schema: { params: trailParamsSchema, body: updateTrailBodySchema, response: { 200: trailResponseSchema } }, preHandler: guard },
    async (req, reply) => reply.status(200).send({ data: await updateMyTrail(req.resolvedTenantId, req.params.trailId, req.body) }))

  f.delete('/:slug/authoring/trails/:trailId',
    { schema: { params: trailParamsSchema, response: { 200: messageResponseSchema } }, preHandler: guard },
    async (req, reply) => { await removeMyTrail(req.resolvedTenantId, req.params.trailId); return reply.status(200).send({ data: { message: 'Trilha removida' } }) })

  // ── Módulos ─────────────────────────────────────────────────────────────────
  f.post('/:slug/authoring/trails/:trailId/modules',
    { schema: { params: trailParamsSchema, body: createModuleBodySchema, response: { 201: moduleResponseSchema } }, preHandler: guard },
    async (req, reply) => reply.status(201).send({ data: await addMyModule(req.resolvedTenantId, req.params.trailId, req.body) }))

  f.patch('/:slug/authoring/modules/:moduleId',
    { schema: { params: moduleParamsSchema, body: updateModuleBodySchema, response: { 200: moduleResponseSchema } }, preHandler: guard },
    async (req, reply) => reply.status(200).send({ data: await updateMyModule(req.resolvedTenantId, req.params.moduleId, req.body) }))

  f.delete('/:slug/authoring/modules/:moduleId',
    { schema: { params: moduleParamsSchema, response: { 200: messageResponseSchema } }, preHandler: guard },
    async (req, reply) => { await removeMyModule(req.resolvedTenantId, req.params.moduleId); return reply.status(200).send({ data: { message: 'Módulo removido' } }) })

  // ── Desafios ────────────────────────────────────────────────────────────────
  f.post('/:slug/authoring/modules/:moduleId/challenges',
    { schema: { params: moduleParamsSchema, body: createChallengeBodySchema, response: { 201: challengeResponseSchema } }, preHandler: guard },
    async (req, reply) => reply.status(201).send({ data: await addMyChallenge(req.resolvedTenantId, req.params.moduleId, req.body) }))

  f.patch('/:slug/authoring/challenges/:challengeId',
    { schema: { params: challengeParamsSchema, body: updateChallengeBodySchema, response: { 200: challengeResponseSchema } }, preHandler: guard },
    async (req, reply) => reply.status(200).send({ data: await updateMyChallenge(req.resolvedTenantId, req.params.challengeId, req.body) }))

  f.delete('/:slug/authoring/challenges/:challengeId',
    { schema: { params: challengeParamsSchema, response: { 200: messageResponseSchema } }, preHandler: guard },
    async (req, reply) => { await removeMyChallenge(req.resolvedTenantId, req.params.challengeId); return reply.status(200).send({ data: { message: 'Desafio removido' } }) })

  // ── Geração de desafio por IA (D4) ──────────────────────────────────────────
  f.post('/:slug/authoring/generate-challenge',
    { schema: { params: slugParamsSchema, body: generateChallengeBodySchema, response: { 200: generateChallengeResponseSchema } }, preHandler: guard },
    async (req, reply) => reply.status(200).send({ data: await generateChallenge(req.body) }))
}
