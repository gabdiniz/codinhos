import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { resolveTenant } from '../../shared/middlewares/resolve-tenant.js'
import { authenticate } from '../../shared/middlewares/authenticate.js'
import { requireRole } from '../../shared/middlewares/require-role.js'
import {
  getUsers,
  getUserById,
  createNewUser,
  updateExistingUser,
  deactivateUser,
  resendInvite,
  updateProfile,
  updatePassword,
} from './users.service.js'
import {
  slugParamsSchema,
  userParamsSchema,
  listUsersQuerySchema,
  createUserBodySchema,
  updateUserBodySchema,
  updateProfileBodySchema,
  updatePasswordBodySchema,
  listUsersResponseSchema,
  userResponseSchema,
  messageResponseSchema,
} from './users.schema.js'

export async function usersRoutes(app: FastifyInstance) {
  const f = app.withTypeProvider<ZodTypeProvider>()

  // ─── Rotas de perfil próprio (qualquer role autenticado) ───────────────────

  /**
   * PATCH /api/:slug/auth/profile
   * Atualiza nome e avatar do próprio usuário.
   */
  f.patch(
    '/:slug/auth/profile',
    {
      schema: {
        params: slugParamsSchema,
        body: updateProfileBodySchema,
        response: { 200: userResponseSchema },
      },
      preHandler: [resolveTenant, authenticate],
    },
    async (req, reply) => {
      const result = await updateProfile(req.user.id, req.body)
      return reply.status(200).send({ data: result })
    },
  )

  /**
   * PATCH /api/:slug/auth/password
   * Troca de senha autenticada. Invalida todas as outras sessões ativas.
   */
  f.patch(
    '/:slug/auth/password',
    {
      schema: {
        params: slugParamsSchema,
        body: updatePasswordBodySchema,
        response: { 200: messageResponseSchema },
      },
      preHandler: [resolveTenant, authenticate],
    },
    async (req, reply) => {
      await updatePassword(req.user.id, req.sessionId, req.body)
      return reply.status(200).send({ data: { message: 'Senha atualizada com sucesso' } })
    },
  )

  // ─── Rotas de gestão de usuários (manager) ─────────────────────────────────

  const managerGuard = [resolveTenant, authenticate, requireRole('manager', 'super_admin')]

  /**
   * GET /api/:slug/users
   * Lista usuários do tenant, filtrável por role.
   */
  f.get(
    '/:slug/users',
    {
      schema: {
        params: slugParamsSchema,
        querystring: listUsersQuerySchema,
        response: { 200: listUsersResponseSchema },
      },
      preHandler: managerGuard,
    },
    async (req, reply) => {
      const result = await getUsers(req.tenantId, req.query)
      return reply.status(200).send(result)
    },
  )

  /**
   * POST /api/:slug/users
   * Cria usuário e envia e-mail de convite.
   */
  f.post(
    '/:slug/users',
    {
      schema: {
        params: slugParamsSchema,
        body: createUserBodySchema,
        response: { 201: userResponseSchema },
      },
      preHandler: managerGuard,
    },
    async (req, reply) => {
      const result = await createNewUser(req.tenantId, req.params.slug, req.body)
      return reply.status(201).send({ data: result })
    },
  )

  /**
   * GET /api/:slug/users/:userId
   * Detalhes de um usuário do tenant.
   */
  f.get(
    '/:slug/users/:userId',
    {
      schema: {
        params: userParamsSchema,
        response: { 200: userResponseSchema },
      },
      preHandler: managerGuard,
    },
    async (req, reply) => {
      const result = await getUserById(req.params.userId, req.tenantId)
      return reply.status(200).send({ data: result })
    },
  )

  /**
   * PATCH /api/:slug/users/:userId
   * Atualiza nome e avatar de um usuário. Role não é atualizável.
   */
  f.patch(
    '/:slug/users/:userId',
    {
      schema: {
        params: userParamsSchema,
        body: updateUserBodySchema,
        response: { 200: userResponseSchema },
      },
      preHandler: managerGuard,
    },
    async (req, reply) => {
      const result = await updateExistingUser(req.params.userId, req.tenantId, req.body)
      return reply.status(200).send({ data: result })
    },
  )

  /**
   * DELETE /api/:slug/users/:userId
   * Desativa usuário (soft delete). Protege auto-desativação e manager/superior.
   */
  f.delete(
    '/:slug/users/:userId',
    {
      schema: {
        params: userParamsSchema,
        response: { 200: messageResponseSchema },
      },
      preHandler: managerGuard,
    },
    async (req, reply) => {
      await deactivateUser(req.params.userId, req.tenantId, req.user.id)
      return reply.status(200).send({ data: { message: 'Usuário desativado com sucesso' } })
    },
  )

  /**
   * POST /api/:slug/users/:userId/resend-invite
   * Invalida tokens anteriores e reenvia convite.
   * 422 se não há token de convite pendente (usuário já configurou acesso).
   */
  f.post(
    '/:slug/users/:userId/resend-invite',
    {
      schema: {
        params: userParamsSchema,
        response: { 200: messageResponseSchema },
      },
      preHandler: managerGuard,
    },
    async (req, reply) => {
      await resendInvite(req.params.userId, req.tenantId, req.params.slug)
      return reply.status(200).send({ data: { message: 'Convite reenviado com sucesso' } })
    },
  )
}
