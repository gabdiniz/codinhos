import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { authenticate } from '../../shared/middlewares/authenticate.js'
import { requireRole } from '../../shared/middlewares/require-role.js'
import {
  getTenants,
  getTenantById,
  createNewTenant,
  updateExistingTenant,
  deactivateTenant,
} from './tenants.service.js'
import {
  tenantIdParamsSchema,
  listTenantsQuerySchema,
  createTenantBodySchema,
  updateTenantBodySchema,
  listTenantsResponseSchema,
  tenantResponseSchema,
  createTenantResponseSchema,
  messageResponseSchema,
} from './tenants.schema.js'

export async function tenantsRoutes(app: FastifyInstance) {
  const f = app.withTypeProvider<ZodTypeProvider>()
  const adminGuard = [authenticate, requireRole('super_admin')]

  // ── GET /api/admin/tenants ─────────────────────────────────────────────────

  f.get(
    '/admin/tenants',
    {
      schema: {
        querystring: listTenantsQuerySchema,
        response: { 200: listTenantsResponseSchema },
      },
      preHandler: adminGuard,
    },
    async (req, reply) => {
      const result = await getTenants(req.query)
      return reply.status(200).send(result)
    },
  )

  // ── POST /api/admin/tenants ────────────────────────────────────────────────

  f.post(
    '/admin/tenants',
    {
      schema: {
        body: createTenantBodySchema,
        response: { 201: createTenantResponseSchema },
      },
      preHandler: adminGuard,
    },
    async (req, reply) => {
      const result = await createNewTenant(req.body)
      return reply.status(201).send({ data: result })
    },
  )

  // ── GET /api/admin/tenants/:tenantId ───────────────────────────────────────

  f.get(
    '/admin/tenants/:tenantId',
    {
      schema: {
        params: tenantIdParamsSchema,
        response: { 200: tenantResponseSchema },
      },
      preHandler: adminGuard,
    },
    async (req, reply) => {
      const result = await getTenantById(req.params.tenantId)
      return reply.status(200).send({ data: result })
    },
  )

  // ── PATCH /api/admin/tenants/:tenantId ─────────────────────────────────────

  f.patch(
    '/admin/tenants/:tenantId',
    {
      schema: {
        params: tenantIdParamsSchema,
        body: updateTenantBodySchema,
        response: { 200: tenantResponseSchema },
      },
      preHandler: adminGuard,
    },
    async (req, reply) => {
      const result = await updateExistingTenant(req.params.tenantId, req.body)
      return reply.status(200).send({ data: result })
    },
  )

  // ── DELETE /api/admin/tenants/:tenantId ────────────────────────────────────

  f.delete(
    '/admin/tenants/:tenantId',
    {
      schema: {
        params: tenantIdParamsSchema,
        response: { 200: messageResponseSchema },
      },
      preHandler: adminGuard,
    },
    async (req, reply) => {
      await deactivateTenant(req.params.tenantId)
      return reply.status(200).send({ data: { message: 'Tenant desativado com sucesso' } })
    },
  )
}
