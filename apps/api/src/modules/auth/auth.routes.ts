import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { resolveTenant } from '../../shared/middlewares/resolve-tenant.js'
import { authenticate } from '../../shared/middlewares/authenticate.js'
import {
  login,
  loginSuperAdmin,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
} from './auth.service.js'
import {
  slugParamsSchema,
  loginBodySchema,
  adminLoginBodySchema,
  forgotPasswordBodySchema,
  resetPasswordBodySchema,
  loginResponseSchema,
  meResponseSchema,
  messageResponseSchema,
} from './auth.schema.js'

export async function authRoutes(app: FastifyInstance) {
  const f = app.withTypeProvider<ZodTypeProvider>()

  // ── Rotas de tenant (:slug) ────────────────────────────────────────────────

  /**
   * POST /api/:slug/auth/login
   * Autentica um usuário do tenant. Cria sessão e seta cookie httpOnly.
   */
  f.post(
    '/:slug/auth/login',
    {
      schema: {
        params: slugParamsSchema,
        body: loginBodySchema,
        response: { 200: loginResponseSchema },
      },
      preHandler: [resolveTenant],
    },
    async (req, reply) => {
      const result = await login(req.resolvedTenantId, req.body, reply)
      return reply.status(200).send(result)
    },
  )

  /**
   * POST /api/:slug/auth/logout
   * Invalida a sessão atual e limpa o cookie.
   */
  f.post(
    '/:slug/auth/logout',
    {
      schema: {
        params: slugParamsSchema,
        response: { 200: messageResponseSchema },
      },
      preHandler: [resolveTenant, authenticate],
    },
    async (req, reply) => {
      await logout(req.sessionId, reply)
      return reply.status(200).send({ message: 'Logout realizado com sucesso' })
    },
  )

  /**
   * GET /api/:slug/auth/me
   * Retorna os dados do usuário autenticado.
   */
  f.get(
    '/:slug/auth/me',
    {
      schema: {
        params: slugParamsSchema,
        response: { 200: meResponseSchema },
      },
      preHandler: [resolveTenant, authenticate],
    },
    async (req, reply) => {
      const result = await getMe(req.user.id)
      return reply.status(200).send(result)
    },
  )

  /**
   * POST /api/:slug/auth/forgot-password
   * Envia e-mail de redefinição de senha. Resposta sempre 200 (não revela existência).
   */
  f.post(
    '/:slug/auth/forgot-password',
    {
      schema: {
        params: slugParamsSchema,
        body: forgotPasswordBodySchema,
        response: { 200: messageResponseSchema },
      },
      preHandler: [resolveTenant],
    },
    async (req, reply) => {
      await forgotPassword(req.params.slug, req.resolvedTenantId, req.body)
      return reply
        .status(200)
        .send({ message: 'Se o e-mail existir, você receberá as instruções em breve' })
    },
  )

  /**
   * POST /api/:slug/auth/reset-password
   * Redefine a senha usando o token recebido por e-mail.
   */
  f.post(
    '/:slug/auth/reset-password',
    {
      schema: {
        params: slugParamsSchema,
        body: resetPasswordBodySchema,
        response: { 200: messageResponseSchema },
      },
      preHandler: [resolveTenant],
    },
    async (req, reply) => {
      await resetPassword(req.body)
      return reply.status(200).send({ message: 'Senha redefinida com sucesso' })
    },
  )

  // ── Rotas de Super Admin (sem slug) ───────────────────────────────────────

  /**
   * POST /api/admin/auth/login
   * Autentica o Super Admin. Sem slug na URL.
   */
  f.post(
    '/admin/auth/login',
    {
      schema: {
        body: adminLoginBodySchema,
        response: { 200: loginResponseSchema },
      },
    },
    async (req, reply) => {
      const result = await loginSuperAdmin(req.body, reply)
      return reply.status(200).send(result)
    },
  )

  /**
   * POST /api/admin/auth/logout
   * Invalida a sessão do Super Admin.
   */
  f.post(
    '/admin/auth/logout',
    {
      schema: {
        response: { 200: messageResponseSchema },
      },
      preHandler: [authenticate],
    },
    async (req, reply) => {
      await logout(req.sessionId, reply)
      return reply.status(200).send({ message: 'Logout realizado com sucesso' })
    },
  )
}
