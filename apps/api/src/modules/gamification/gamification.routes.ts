import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { resolveTenant } from '../../shared/middlewares/resolve-tenant.js'
import { authenticate } from '../../shared/middlewares/authenticate.js'
import { requireRole } from '../../shared/middlewares/require-role.js'
import { getMyStats, getClassRanking, getBadges, getXpEvents } from './gamification.service.js'
import {
  slugParamsSchema,
  rankingParamsSchema,
  paginationQuerySchema,
  myStatsResponseSchema,
  rankingResponseSchema,
  badgesResponseSchema,
  xpEventsResponseSchema,
} from './gamification.schema.js'

export async function gamificationRoutes(app: FastifyInstance) {
  const f = app.withTypeProvider<ZodTypeProvider>()
  const studentGuard = [resolveTenant, authenticate, requireRole('student')]
  const studentManagerGuard = [resolveTenant, authenticate, requireRole('student', 'manager')]

  // GET /:slug/gamification/me — XP, nível, streak e badges do aluno
  f.get(
    '/:slug/gamification/me',
    {
      schema: {
        params: slugParamsSchema,
        response: { 200: myStatsResponseSchema },
      },
      preHandler: studentGuard,
    },
    async (req, reply) => {
      const result = await getMyStats(req.user.id, req.resolvedTenantId)
      return reply.status(200).send({ data: result })
    },
  )

  // GET /:slug/gamification/ranking/:classId — ranking da turma
  f.get(
    '/:slug/gamification/ranking/:classId',
    {
      schema: {
        params: rankingParamsSchema,
        response: { 200: rankingResponseSchema },
      },
      preHandler: studentManagerGuard,
    },
    async (req, reply) => {
      const result = await getClassRanking(
        req.params.classId,
        req.resolvedTenantId,
        req.user.id,
        req.user.role,
      )
      return reply.status(200).send({ data: result })
    },
  )

  // GET /:slug/gamification/badges — catálogo completo + status de conquista
  f.get(
    '/:slug/gamification/badges',
    {
      schema: {
        params: slugParamsSchema,
        response: { 200: badgesResponseSchema },
      },
      preHandler: studentGuard,
    },
    async (req, reply) => {
      const result = await getBadges(req.user.id, req.resolvedTenantId)
      return reply.status(200).send({ data: result })
    },
  )

  // GET /:slug/gamification/xp-events — histórico paginado de eventos de XP
  f.get(
    '/:slug/gamification/xp-events',
    {
      schema: {
        params: slugParamsSchema,
        querystring: paginationQuerySchema,
        response: { 200: xpEventsResponseSchema },
      },
      preHandler: studentGuard,
    },
    async (req, reply) => {
      const result = await getXpEvents(
        req.user.id,
        req.resolvedTenantId,
        req.query.page,
        req.query.limit,
      )
      return reply.status(200).send(result)
    },
  )
}
