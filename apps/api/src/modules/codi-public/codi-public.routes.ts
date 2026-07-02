import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { codiAskBodySchema, codiAskResponseSchema } from './codi-public.schema.js'
import { askCodi } from './codi-public.service.js'

export async function codiPublicRoutes(app: FastifyInstance) {
  const f = app.withTypeProvider<ZodTypeProvider>()

  /**
   * POST /api/codi/ask
   * Assistente público da landing page. Sem autenticação e sem tenant — é
   * pré-venda. Rate limit próprio, mais restrito que o global, para conter o
   * custo de IA em endpoint aberto.
   */
  f.post(
    '/codi/ask',
    {
      schema: {
        body: codiAskBodySchema,
        response: { 200: codiAskResponseSchema },
      },
      config: {
        rateLimit: { max: 20, timeWindow: '5 minutes' },
      },
    },
    async (req, reply) => {
      const result = await askCodi(req.body)
      return reply.status(200).send({ data: result })
    },
  )
}
