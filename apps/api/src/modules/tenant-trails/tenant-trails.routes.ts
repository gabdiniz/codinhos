import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { resolveTenant } from '../../shared/middlewares/resolve-tenant.js'
import { authenticate } from '../../shared/middlewares/authenticate.js'
import { requireRole } from '../../shared/middlewares/require-role.js'
import {
  getTenantTrails,
  activateTenantTrail,
  reorderTenantTrail,
  deactivateTenantTrail,
} from './tenant-trails.service.js'
import {
  slugParamsSchema,
  trailParamsSchema,
  activateTrailBodySchema,
  reorderTrailBodySchema,
  listTenantTrailsResponseSchema,
  tenantTrailResponseSchema,
  messageResponseSchema,
} from './tenant-trails.schema.js'

export async function tenantTrailsRoutes(app: FastifyInstance) {
  const f = app.withTypeProvider<ZodTypeProvider>()
  const readGuard = [resolveTenant, authenticate, requireRole('manager', 'student')]
  const writeGuard = [resolveTenant, authenticate, requireRole('manager')]

  // GET /:slug/trails — lista trilhas ativadas (manager e student)
  f.get(
    '/:slug/trails',
    {
      schema: {
        params: slugParamsSchema,
        response: { 200: listTenantTrailsResponseSchema },
      },
      preHandler: readGuard,
    },
    async (req, reply) => {
      const result = await getTenantTrails(req.resolvedTenantId)
      return reply.status(200).send(result)
    },
  )

  // POST /:slug/trails — ativa trilha do catálogo (manager)
  f.post(
    '/:slug/trails',
    {
      schema: {
        params: slugParamsSchema,
        body: activateTrailBodySchema,
        response: { 201: tenantTrailResponseSchema },
      },
      preHandler: writeGuard,
    },
    async (req, reply) => {
      const result = await activateTenantTrail(req.resolvedTenantId, req.body)
      return reply.status(201).send({ data: result })
    },
  )

  // PATCH /:slug/trails/:trailId/order — reordena trilha (manager)
  f.patch(
    '/:slug/trails/:trailId/order',
    {
      schema: {
        params: trailParamsSchema,
        body: reorderTrailBodySchema,
        response: { 200: tenantTrailResponseSchema },
      },
      preHandler: writeGuard,
    },
    async (req, reply) => {
      const result = await reorderTenantTrail(req.resolvedTenantId, req.params.trailId, req.body)
      return reply.status(200).send({ data: result })
    },
  )

  // DELETE /:slug/trails/:trailId — remove trilha do tenant (manager)
  f.delete(
    '/:slug/trails/:trailId',
    {
      schema: {
        params: trailParamsSchema,
        response: { 200: messageResponseSchema },
      },
      preHandler: writeGuard,
    },
    async (req, reply) => {
      await deactivateTenantTrail(req.resolvedTenantId, req.params.trailId)
      return reply.status(200).send({ data: { message: 'Trilha removida do tenant' } })
    },
  )
}
