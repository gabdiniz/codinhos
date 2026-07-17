import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { resolveTenant } from '../../shared/middlewares/resolve-tenant.js'
import { authenticate } from '../../shared/middlewares/authenticate.js'
import { requireRole } from '../../shared/middlewares/require-role.js'
import { getAvatarStudio, saveAvatar } from './avatar.service.js'
import {
  avatarParamsSchema,
  avatarConfigSchema,
  avatarStudioResponseSchema,
  avatarSaveResponseSchema,
} from './avatar.schema.js'

export async function avatarRoutes(app: FastifyInstance) {
  const f = app.withTypeProvider<ZodTypeProvider>()
  const studentGuard = [resolveTenant, authenticate, requireRole('student')]

  // GET /:slug/me/avatar — config atual + catálogo com desbloqueios por nível
  f.get(
    '/:slug/me/avatar',
    {
      schema: {
        params: avatarParamsSchema,
        response: { 200: avatarStudioResponseSchema },
      },
      preHandler: studentGuard,
    },
    async (req, reply) => {
      const result = await getAvatarStudio(req.user.id, req.resolvedTenantId)
      return reply.status(200).send({ data: result })
    },
  )

  // PUT /:slug/me/avatar — salva a personalização do próprio aluno
  f.put(
    '/:slug/me/avatar',
    {
      schema: {
        params: avatarParamsSchema,
        body: avatarConfigSchema,
        response: { 200: avatarSaveResponseSchema },
      },
      preHandler: studentGuard,
    },
    async (req, reply) => {
      const result = await saveAvatar(req.user.id, req.resolvedTenantId, req.body)
      return reply.status(200).send({ data: result })
    },
  )
}
