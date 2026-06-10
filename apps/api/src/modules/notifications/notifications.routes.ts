import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { resolveTenant } from '../../shared/middlewares/resolve-tenant.js'
import { authenticate } from '../../shared/middlewares/authenticate.js'
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead } from './notifications.service.js'
import {
  slugParamsSchema,
  notificationParamsSchema,
  listNotificationsQuerySchema,
  listNotificationsResponseSchema,
  unreadCountResponseSchema,
  markReadResponseSchema,
  readAllResponseSchema,
} from './notifications.schema.js'

export async function notificationsRoutes(app: FastifyInstance) {
  const f = app.withTypeProvider<ZodTypeProvider>()
  const guard = [resolveTenant, authenticate]

  // GET /:slug/notifications — lista notificações do usuário
  f.get(
    '/:slug/notifications',
    {
      schema: {
        params: slugParamsSchema,
        querystring: listNotificationsQuerySchema,
        response: { 200: listNotificationsResponseSchema },
      },
      preHandler: guard,
    },
    async (req, reply) => {
      const result = await getNotifications(
        req.user.id,
        req.resolvedTenantId,
        req.query.page,
        req.query.limit,
        req.query.read,
      )
      return reply.status(200).send(result)
    },
  )

  // GET /:slug/notifications/unread-count — contagem de não lidas
  f.get(
    '/:slug/notifications/unread-count',
    {
      schema: {
        params: slugParamsSchema,
        response: { 200: unreadCountResponseSchema },
      },
      preHandler: guard,
    },
    async (req, reply) => {
      const result = await getUnreadCount(req.user.id, req.resolvedTenantId)
      return reply.status(200).send({ data: result })
    },
  )

  // PATCH /:slug/notifications/read-all — marca todas como lidas
  f.patch(
    '/:slug/notifications/read-all',
    {
      schema: {
        params: slugParamsSchema,
        response: { 200: readAllResponseSchema },
      },
      preHandler: guard,
    },
    async (req, reply) => {
      const result = await markAllAsRead(req.user.id, req.resolvedTenantId)
      return reply.status(200).send({ data: result })
    },
  )

  // PATCH /:slug/notifications/:notificationId/read — marca uma como lida
  f.patch(
    '/:slug/notifications/:notificationId/read',
    {
      schema: {
        params: notificationParamsSchema,
        response: { 200: markReadResponseSchema },
      },
      preHandler: guard,
    },
    async (req, reply) => {
      const result = await markAsRead(
        req.params.notificationId,
        req.user.id,
        req.resolvedTenantId,
      )
      return reply.status(200).send({ data: result })
    },
  )
}
