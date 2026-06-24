import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { resolveTenant } from '../../shared/middlewares/resolve-tenant.js'
import { authenticate } from '../../shared/middlewares/authenticate.js'
import { requireRole } from '../../shared/middlewares/require-role.js'
import {
  createSubmission,
  listChallengeSubmissions,
  getSubmissionDetail,
  reviewSubmission,
} from './submissions.service.js'
import {
  submissionsParamsSchema,
  submissionDetailParamsSchema,
  listSubmissionsQuerySchema,
  createSubmissionBodySchema,
  reviewSubmissionBodySchema,
  createSubmissionResponseSchema,
  listSubmissionsResponseSchema,
  submissionDetailResponseSchema,
  reviewSubmissionResponseSchema,
} from './submissions.schema.js'

export async function submissionsRoutes(app: FastifyInstance) {
  const f = app.withTypeProvider<ZodTypeProvider>()
  const base = [resolveTenant, authenticate]

  // POST /:slug/challenges/:challengeId/submissions — aluno submete solução
  f.post(
    '/:slug/challenges/:challengeId/submissions',
    {
      schema: {
        params: submissionsParamsSchema,
        body: createSubmissionBodySchema,
        response: { 201: createSubmissionResponseSchema },
      },
      preHandler: [...base, requireRole('student')],
    },
    async (req, reply) => {
      const result = await createSubmission(
        req.resolvedTenantId,
        req.user.id,
        req.params.challengeId,
        req.body,
      )
      return reply.status(201).send(result)
    },
  )

  // GET /:slug/challenges/:challengeId/submissions — lista submissões
  f.get(
    '/:slug/challenges/:challengeId/submissions',
    {
      schema: {
        params: submissionsParamsSchema,
        querystring: listSubmissionsQuerySchema,
        response: { 200: listSubmissionsResponseSchema },
      },
      preHandler: [...base, requireRole('student', 'manager', 'professor')],
    },
    async (req, reply) => {
      const result = await listChallengeSubmissions(
        req.resolvedTenantId,
        req.user.id,
        req.user.role,
        req.params.challengeId,
        req.query.classId,
      )
      return reply.status(200).send(result)
    },
  )

  // GET /:slug/challenges/:challengeId/submissions/:submissionId — detalhe
  f.get(
    '/:slug/challenges/:challengeId/submissions/:submissionId',
    {
      schema: {
        params: submissionDetailParamsSchema,
        response: { 200: submissionDetailResponseSchema },
      },
      preHandler: [...base, requireRole('student', 'manager', 'professor')],
    },
    async (req, reply) => {
      const result = await getSubmissionDetail(
        req.resolvedTenantId,
        req.user.id,
        req.user.role,
        req.params.challengeId,
        req.params.submissionId,
      )
      return reply.status(200).send(result)
    },
  )

  // PATCH /:slug/challenges/:challengeId/submissions/:submissionId/review — gestor revisa
  f.patch(
    '/:slug/challenges/:challengeId/submissions/:submissionId/review',
    {
      schema: {
        params: submissionDetailParamsSchema,
        body: reviewSubmissionBodySchema,
        response: { 200: reviewSubmissionResponseSchema },
      },
      preHandler: [...base, requireRole('manager', 'professor')],
    },
    async (req, reply) => {
      const result = await reviewSubmission(
        req.resolvedTenantId,
        req.user.id,
        req.user.role,
        req.params.challengeId,
        req.params.submissionId,
        req.body,
      )
      return reply.status(200).send(result)
    },
  )
}
