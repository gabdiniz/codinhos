import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { resolveTenant } from '../../shared/middlewares/resolve-tenant.js'
import { authenticate } from '../../shared/middlewares/authenticate.js'
import { requireRole } from '../../shared/middlewares/require-role.js'
import { getTemplates, upsertTemplate, removeTemplate } from './certificates.service.js'
import {
  slugParamsSchema,
  templateParamsSchema,
  upsertTemplateBodySchema,
  listTemplatesResponseSchema,
  templateResponseSchema,
  messageResponseSchema,
} from './certificates.schema.js'

export async function certificatesRoutes(app: FastifyInstance) {
  const f = app.withTypeProvider<ZodTypeProvider>()
  const managerGuard = [resolveTenant, authenticate, requireRole('manager')]

  f.get(
    '/:slug/certificates/templates',
    { schema: { params: slugParamsSchema, response: { 200: listTemplatesResponseSchema } }, preHandler: managerGuard },
    async (req, reply) => {
      const result = await getTemplates(req.resolvedTenantId)
      return reply.status(200).send(result)
    },
  )

  f.put(
    '/:slug/certificates/templates',
    {
      schema: { params: slugParamsSchema, body: upsertTemplateBodySchema, response: { 200: templateResponseSchema } },
      preHandler: managerGuard,
    },
    async (req, reply) => {
      const result = await upsertTemplate(req.resolvedTenantId, req.body)
      return reply.status(200).send({ data: result })
    },
  )

  f.delete(
    '/:slug/certificates/templates/:templateId',
    { schema: { params: templateParamsSchema, response: { 200: messageResponseSchema } }, preHandler: managerGuard },
    async (req, reply) => {
      await removeTemplate(req.resolvedTenantId, req.params.templateId)
      return reply.status(200).send({ data: { message: 'Template removido' } })
    },
  )
}
