import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { resolveTenant } from '../../shared/middlewares/resolve-tenant.js'
import { authenticate } from '../../shared/middlewares/authenticate.js'
import { requireRole } from '../../shared/middlewares/require-role.js'
import { getDashboard, getTrailDetail, getModuleDetail, getChallengeDetail } from './learn.service.js'
import {
  slugParamsSchema,
  trailParamsSchema,
  moduleParamsSchema,
  challengeParamsSchema,
  classIdQuerySchema,
  dashboardResponseSchema,
  trailDetailResponseSchema,
  moduleDetailResponseSchema,
  challengeDetailResponseSchema,
} from './learn.schema.js'

export async function learnRoutes(app: FastifyInstance) {
  const f = app.withTypeProvider<ZodTypeProvider>()
  const guard = [resolveTenant, authenticate, requireRole('student')]

  // GET /:slug/learn — dashboard do aluno
  f.get(
    '/:slug/learn',
    {
      schema: {
        params: slugParamsSchema,
        querystring: classIdQuerySchema,
        response: { 200: dashboardResponseSchema },
      },
      preHandler: guard,
    },
    async (req, reply) => {
      const result = await getDashboard(
        req.resolvedTenantId,
        req.user.id,
        req.query.classId,
      )
      return reply.status(200).send(result)
    },
  )

  // GET /:slug/learn/trails/:trailId — detalhe da trilha com módulos e status
  f.get(
    '/:slug/learn/trails/:trailId',
    {
      schema: {
        params: trailParamsSchema,
        querystring: classIdQuerySchema,
        response: { 200: trailDetailResponseSchema },
      },
      preHandler: guard,
    },
    async (req, reply) => {
      const result = await getTrailDetail(
        req.resolvedTenantId,
        req.user.id,
        req.params.trailId,
        req.query.classId,
      )
      return reply.status(200).send(result)
    },
  )

  // GET /:slug/learn/modules/:moduleId — conteúdo do módulo
  f.get(
    '/:slug/learn/modules/:moduleId',
    {
      schema: {
        params: moduleParamsSchema,
        querystring: classIdQuerySchema,
        response: { 200: moduleDetailResponseSchema },
      },
      preHandler: guard,
    },
    async (req, reply) => {
      const result = await getModuleDetail(
        req.resolvedTenantId,
        req.user.id,
        req.params.moduleId,
        req.query.classId,
      )
      return reply.status(200).send(result)
    },
  )

  // GET /:slug/learn/challenges/:challengeId — detalhes do desafio
  f.get(
    '/:slug/learn/challenges/:challengeId',
    {
      schema: {
        params: challengeParamsSchema,
        querystring: classIdQuerySchema,
        response: { 200: challengeDetailResponseSchema },
      },
      preHandler: guard,
    },
    async (req, reply) => {
      const result = await getChallengeDetail(
        req.resolvedTenantId,
        req.user.id,
        req.params.challengeId,
        req.query.classId,
      )
      return reply.status(200).send(result)
    },
  )
}
