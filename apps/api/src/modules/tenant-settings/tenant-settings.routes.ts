import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { resolveTenant } from '../../shared/middlewares/resolve-tenant.js'
import { authenticate } from '../../shared/middlewares/authenticate.js'
import { requireRole } from '../../shared/middlewares/require-role.js'
import { getSettings, updateSettings } from './tenant-settings.service.js'
import {
  slugParamsSchema,
  updateSettingsBodySchema,
  settingsResponseSchema,
} from './tenant-settings.schema.js'

export async function tenantSettingsRoutes(app: FastifyInstance) {
  const f = app.withTypeProvider<ZodTypeProvider>()
  const guard = [resolveTenant, authenticate, requireRole('manager')]

  // GET /:slug/settings — configurações do tenant
  f.get(
    '/:slug/settings',
    {
      schema: {
        params: slugParamsSchema,
        response: { 200: settingsResponseSchema },
      },
      preHandler: guard,
    },
    async (req, reply) => {
      const result = await getSettings(req.resolvedTenantId)
      return reply.status(200).send(result)
    },
  )

  // PATCH /:slug/settings — atualiza theme e/ou gamification
  f.patch(
    '/:slug/settings',
    {
      schema: {
        params: slugParamsSchema,
        body: updateSettingsBodySchema,
        response: { 200: settingsResponseSchema },
      },
      preHandler: guard,
    },
    async (req, reply) => {
      const result = await updateSettings(req.resolvedTenantId, req.body)
      return reply.status(200).send(result)
    },
  )
}
