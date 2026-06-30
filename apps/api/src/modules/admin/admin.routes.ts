import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { authenticate } from '../../shared/middlewares/authenticate.js'
import { requireRole } from '../../shared/middlewares/require-role.js'
import { getBadges, createBadge, editBadge, removeBadge, getAdminUsers, adminResetPassword } from './admin.service.js'
import {
  badgeIdParamsSchema,
  createBadgeBodySchema,
  updateBadgeBodySchema,
  listAdminUsersQuerySchema,
  listBadgesResponseSchema,
  badgeResponseSchema,
  messageResponseSchema,
  listAdminUsersResponseSchema,
  adminUserIdParamsSchema,
  resetPasswordResponseSchema,
} from './admin.schema.js'

export async function adminRoutes(app: FastifyInstance) {
  const f = app.withTypeProvider<ZodTypeProvider>()
  const guard = [authenticate, requireRole('super_admin')]

  // GET /admin/badges
  f.get(
    '/admin/badges',
    {
      schema: {
        response: { 200: listBadgesResponseSchema },
      },
      preHandler: guard,
    },
    async (req, reply) => {
      const result = await getBadges()
      return reply.status(200).send(result)
    },
  )

  // POST /admin/badges
  f.post(
    '/admin/badges',
    {
      schema: {
        body: createBadgeBodySchema,
        response: { 201: badgeResponseSchema },
      },
      preHandler: guard,
    },
    async (req, reply) => {
      const result = await createBadge(req.body)
      return reply.status(201).send(result)
    },
  )

  // PATCH /admin/badges/:badgeId
  f.patch(
    '/admin/badges/:badgeId',
    {
      schema: {
        params: badgeIdParamsSchema,
        body: updateBadgeBodySchema,
        response: { 200: badgeResponseSchema },
      },
      preHandler: guard,
    },
    async (req, reply) => {
      const result = await editBadge(req.params.badgeId, req.body)
      return reply.status(200).send(result)
    },
  )

  // DELETE /admin/badges/:badgeId
  f.delete(
    '/admin/badges/:badgeId',
    {
      schema: {
        params: badgeIdParamsSchema,
        response: { 200: messageResponseSchema },
      },
      preHandler: guard,
    },
    async (req, reply) => {
      const result = await removeBadge(req.params.badgeId)
      return reply.status(200).send(result)
    },
  )

  // GET /admin/users
  f.get(
    '/admin/users',
    {
      schema: {
        querystring: listAdminUsersQuerySchema,
        response: { 200: listAdminUsersResponseSchema },
      },
      preHandler: guard,
    },
    async (req, reply) => {
      const result = await getAdminUsers(req.query)
      return reply.status(200).send(result)
    },
  )

  // POST /admin/users/:userId/reset-password
  f.post(
    '/admin/users/:userId/reset-password',
    {
      schema: {
        params: adminUserIdParamsSchema,
        response: { 200: resetPasswordResponseSchema },
      },
      preHandler: guard,
    },
    async (req, reply) => {
      const result = await adminResetPassword(req.params.userId)
      return reply.status(200).send({ data: result })
    },
  )
}
