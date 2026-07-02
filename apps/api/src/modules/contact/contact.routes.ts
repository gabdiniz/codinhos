import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { contactBodySchema, contactResponseSchema } from './contact.schema.js'
import { sendContactMessage } from './contact.service.js'

export async function contactRoutes(app: FastifyInstance) {
  const f = app.withTypeProvider<ZodTypeProvider>()

  /**
   * POST /api/contact
   * Formulário de contato da landing page. Público (sem auth/tenant). Rate limit
   * próprio, restrito, para conter spam.
   */
  f.post(
    '/contact',
    {
      schema: {
        body: contactBodySchema,
        response: { 200: contactResponseSchema },
      },
      config: {
        rateLimit: { max: 5, timeWindow: '10 minutes' },
      },
    },
    async (req, reply) => {
      const result = await sendContactMessage(req.body)
      return reply.status(200).send({ data: result })
    },
  )
}
