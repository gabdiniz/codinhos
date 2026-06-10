import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { authenticate } from '../../shared/middlewares/authenticate.js'
import { requireRole } from '../../shared/middlewares/require-role.js'
import {
  getTrails,
  getTrailDetail,
  createNewTrail,
  updateExistingTrail,
  removeTrail,
  createNewModule,
  updateExistingModule,
  removeModule,
  createNewChallenge,
  updateExistingChallenge,
  removeChallenge,
} from './catalog.service.js'
import {
  trailParamsSchema,
  moduleParamsSchema,
  challengeParamsSchema,
  listTrailsQuerySchema,
  createTrailBodySchema,
  updateTrailBodySchema,
  createModuleBodySchema,
  updateModuleBodySchema,
  createChallengeBodySchema,
  updateChallengeBodySchema,
  listTrailsResponseSchema,
  trailResponseSchema,
  trailDetailResponseSchema,
  moduleResponseSchema,
  challengeResponseSchema,
  messageResponseSchema,
} from './catalog.schema.js'

export async function catalogRoutes(app: FastifyInstance) {
  const f = app.withTypeProvider<ZodTypeProvider>()
  const adminGuard = [authenticate, requireRole('super_admin')]

  // ── Trails ────────────────────────────────────────────────────────────────

  f.get(
    '/admin/trails',
    {
      schema: {
        querystring: listTrailsQuerySchema,
        response: { 200: listTrailsResponseSchema },
      },
      preHandler: adminGuard,
    },
    async (req, reply) => {
      const result = await getTrails(req.query)
      return reply.status(200).send(result)
    },
  )

  f.get(
    '/admin/trails/:trailId',
    {
      schema: {
        params: trailParamsSchema,
        response: { 200: trailDetailResponseSchema },
      },
      preHandler: adminGuard,
    },
    async (req, reply) => {
      const result = await getTrailDetail(req.params.trailId)
      return reply.status(200).send({ data: result })
    },
  )

  f.post(
    '/admin/trails',
    {
      schema: {
        body: createTrailBodySchema,
        response: { 201: trailResponseSchema },
      },
      preHandler: adminGuard,
    },
    async (req, reply) => {
      const result = await createNewTrail(req.body)
      return reply.status(201).send({ data: result })
    },
  )

  f.patch(
    '/admin/trails/:trailId',
    {
      schema: {
        params: trailParamsSchema,
        body: updateTrailBodySchema,
        response: { 200: trailResponseSchema },
      },
      preHandler: adminGuard,
    },
    async (req, reply) => {
      const result = await updateExistingTrail(req.params.trailId, req.body)
      return reply.status(200).send({ data: result })
    },
  )

  f.delete(
    '/admin/trails/:trailId',
    {
      schema: {
        params: trailParamsSchema,
        response: { 200: messageResponseSchema },
      },
      preHandler: adminGuard,
    },
    async (req, reply) => {
      await removeTrail(req.params.trailId)
      return reply.status(200).send({ data: { message: 'Trilha removida do catálogo' } })
    },
  )

  // ── Modules ───────────────────────────────────────────────────────────────

  f.post(
    '/admin/trails/:trailId/modules',
    {
      schema: {
        params: trailParamsSchema,
        body: createModuleBodySchema,
        response: { 201: moduleResponseSchema },
      },
      preHandler: adminGuard,
    },
    async (req, reply) => {
      const result = await createNewModule(req.params.trailId, req.body)
      return reply.status(201).send({ data: result })
    },
  )

  f.patch(
    '/admin/modules/:moduleId',
    {
      schema: {
        params: moduleParamsSchema,
        body: updateModuleBodySchema,
        response: { 200: moduleResponseSchema },
      },
      preHandler: adminGuard,
    },
    async (req, reply) => {
      const result = await updateExistingModule(req.params.moduleId, req.body)
      return reply.status(200).send({ data: result })
    },
  )

  f.delete(
    '/admin/modules/:moduleId',
    {
      schema: {
        params: moduleParamsSchema,
        response: { 200: messageResponseSchema },
      },
      preHandler: adminGuard,
    },
    async (req, reply) => {
      await removeModule(req.params.moduleId)
      return reply.status(200).send({ data: { message: 'Módulo removido' } })
    },
  )

  // ── Challenges ────────────────────────────────────────────────────────────

  f.post(
    '/admin/modules/:moduleId/challenges',
    {
      schema: {
        params: moduleParamsSchema,
        body: createChallengeBodySchema,
        response: { 201: challengeResponseSchema },
      },
      preHandler: adminGuard,
    },
    async (req, reply) => {
      const result = await createNewChallenge(req.params.moduleId, req.body)
      return reply.status(201).send({ data: result })
    },
  )

  f.patch(
    '/admin/challenges/:challengeId',
    {
      schema: {
        params: challengeParamsSchema,
        body: updateChallengeBodySchema,
        response: { 200: challengeResponseSchema },
      },
      preHandler: adminGuard,
    },
    async (req, reply) => {
      const result = await updateExistingChallenge(req.params.challengeId, req.body)
      return reply.status(200).send({ data: result })
    },
  )

  f.delete(
    '/admin/challenges/:challengeId',
    {
      schema: {
        params: challengeParamsSchema,
        response: { 200: messageResponseSchema },
      },
      preHandler: adminGuard,
    },
    async (req, reply) => {
      await removeChallenge(req.params.challengeId)
      return reply.status(200).send({ data: { message: 'Desafio removido' } })
    },
  )
}
