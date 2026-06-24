import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { resolveTenant } from '../../shared/middlewares/resolve-tenant.js'
import { authenticate } from '../../shared/middlewares/authenticate.js'
import { requireRole } from '../../shared/middlewares/require-role.js'
import { getOverview, getStudentDetail, getClassDetail, getReviewQueue } from './dashboard.service.js'
import {
  slugParamsSchema,
  studentDetailParamsSchema,
  classDetailParamsSchema,
  overviewResponseSchema,
  studentDetailResponseSchema,
  classDetailResponseSchema,
  reviewQueueResponseSchema,
} from './dashboard.schema.js'

export async function dashboardRoutes(app: FastifyInstance) {
  const f = app.withTypeProvider<ZodTypeProvider>()
  const guard = [resolveTenant, authenticate, requireRole('manager')]
  // Visão da própria turma/aluno: gestor e professor. Escopo do professor às
  // turmas atribuídas é aplicado na camada de service.
  const readGuard = [resolveTenant, authenticate, requireRole('manager', 'professor')]

  // GET /:slug/dashboard — visão geral do tenant (apenas gestor)
  f.get(
    '/:slug/dashboard',
    {
      schema: {
        params: slugParamsSchema,
        response: { 200: overviewResponseSchema },
      },
      preHandler: guard,
    },
    async (req, reply) => {
      const result = await getOverview(req.resolvedTenantId)
      return reply.status(200).send(result)
    },
  )

  // GET /:slug/dashboard/students/:studentId — progresso detalhado do aluno
  f.get(
    '/:slug/dashboard/students/:studentId',
    {
      schema: {
        params: studentDetailParamsSchema,
        response: { 200: studentDetailResponseSchema },
      },
      preHandler: readGuard,
    },
    async (req, reply) => {
      const result = await getStudentDetail(req.params.studentId, req.resolvedTenantId, {
        role: req.user.role,
        userId: req.user.id,
      })
      return reply.status(200).send(result)
    },
  )

  // GET /:slug/dashboard/classes/:classId — progresso da turma
  f.get(
    '/:slug/dashboard/classes/:classId',
    {
      schema: {
        params: classDetailParamsSchema,
        response: { 200: classDetailResponseSchema },
      },
      preHandler: readGuard,
    },
    async (req, reply) => {
      const result = await getClassDetail(req.params.classId, req.resolvedTenantId, {
        role: req.user.role,
        userId: req.user.id,
      })
      return reply.status(200).send(result)
    },
  )

  // GET /:slug/dashboard/review-queue — submissões aguardando revisão (escopo do ator)
  f.get(
    '/:slug/dashboard/review-queue',
    {
      schema: {
        params: slugParamsSchema,
        response: { 200: reviewQueueResponseSchema },
      },
      preHandler: readGuard,
    },
    async (req, reply) => {
      const result = await getReviewQueue(req.resolvedTenantId, {
        role: req.user.role,
        userId: req.user.id,
      })
      return reply.status(200).send(result)
    },
  )
}
