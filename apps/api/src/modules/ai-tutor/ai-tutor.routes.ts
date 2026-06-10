import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { resolveTenant } from '../../shared/middlewares/resolve-tenant.js'
import { authenticate } from '../../shared/middlewares/authenticate.js'
import { requireRole } from '../../shared/middlewares/require-role.js'
import { getConversation, sendMessage } from './ai-tutor.service.js'
import { getTenantAiConfig, getStudentLevel } from './ai-tutor.repository.js'
import {
  slugChallengeParamsSchema,
  sendMessageBodySchema,
  conversationResponseSchema,
  sendMessageResponseSchema,
} from './ai-tutor.schema.js'
import { NotFoundError } from '../../shared/errors/index.js'

const guard = [resolveTenant, authenticate, requireRole('student')]

export async function aiTutorRoutes(app: FastifyInstance) {
  const f = app.withTypeProvider<ZodTypeProvider>()

  /**
   * GET /api/:slug/ai/challenges/:challengeId/conversation
   * Retorna (ou cria) a conversa do aluno para o desafio, com o histórico.
   */
  f.get(
    '/:slug/ai/challenges/:challengeId/conversation',
    {
      schema: {
        params: slugChallengeParamsSchema,
        response: { 200: conversationResponseSchema },
      },
      preHandler: guard,
    },
    async (req, reply) => {
      const { challengeId } = req.params

      const tenantConfig = await getTenantAiConfig(req.resolvedTenantId)
      if (!tenantConfig) throw new NotFoundError('Tenant')

      const result = await getConversation(
        req.resolvedTenantId,
        req.user.id,
        challengeId,
        tenantConfig.aiMessagesPerDay,
      )

      return reply.status(200).send({ data: result })
    },
  )

  /**
   * POST /api/:slug/ai/challenges/:challengeId/messages
   * Envia uma mensagem do aluno e retorna a resposta do tutor.
   */
  f.post(
    '/:slug/ai/challenges/:challengeId/messages',
    {
      schema: {
        params: slugChallengeParamsSchema,
        body: sendMessageBodySchema,
        response: { 200: sendMessageResponseSchema },
      },
      preHandler: guard,
    },
    async (req, reply) => {
      const { challengeId } = req.params

      const [tenantConfig, studentLevel] = await Promise.all([
        getTenantAiConfig(req.resolvedTenantId),
        getStudentLevel(req.resolvedTenantId, req.user.id),
      ])

      if (!tenantConfig) throw new NotFoundError('Tenant')

      const result = await sendMessage(
        req.resolvedTenantId,
        req.user.id,
        challengeId,
        req.body,
        { name: req.user.name, level: studentLevel },
        tenantConfig,
      )

      return reply.status(200).send({ data: result })
    },
  )
}
