import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { resolveTenant } from '../../shared/middlewares/resolve-tenant.js'
import { authenticate } from '../../shared/middlewares/authenticate.js'
import { requireRole } from '../../shared/middlewares/require-role.js'
import {
  getStatus,
  getAuthUrl,
  handleCallback,
  disconnect,
  listGoogleCourses,
  importCourse,
} from './integrations.service.js'
import {
  slugParamsSchema,
  importCourseBodySchema,
  statusResponseSchema,
  authUrlResponseSchema,
  coursesResponseSchema,
  importResponseSchema,
  messageResponseSchema,
} from './integrations.schema.js'

const STATE_COOKIE = 'g_oauth_state'

export async function integrationsRoutes(app: FastifyInstance) {
  const f = app.withTypeProvider<ZodTypeProvider>()
  const managerGuard = [resolveTenant, authenticate, requireRole('manager')]

  // ── Status / conexão (gestor) ──────────────────────────────────────────────

  f.get(
    '/:slug/integrations/google/status',
    { schema: { params: slugParamsSchema, response: { 200: statusResponseSchema } }, preHandler: managerGuard },
    async (req, reply) => {
      const result = await getStatus(req.resolvedTenantId)
      return reply.status(200).send(result)
    },
  )

  f.get(
    '/:slug/integrations/google/auth-url',
    { schema: { params: slugParamsSchema, response: { 200: authUrlResponseSchema } }, preHandler: managerGuard },
    async (req, reply) => {
      const { url, state } = getAuthUrl(req.params.slug)
      // state CSRF em cookie httpOnly de curta duração — comparado no callback
      reply.setCookie(STATE_COOKIE, state, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 600,
      })
      return reply.status(200).send({ data: { url } })
    },
  )

  // ── Callback do Google (path fixo — redirect_uri exato exigido pelo Google) ──
  // Não usa :slug (o slug vem no state). Autentica pela sessão do gestor que
  // iniciou o fluxo (cookie SameSite=Lax é enviado na navegação top-level).
  f.get(
    '/integrations/google/callback',
    {
      schema: {
        querystring: z.object({
          code: z.string().optional(),
          state: z.string().optional(),
          error: z.string().optional(),
        }),
      },
      preHandler: [authenticate],
    },
    async (req, reply) => {
      const appUrl = process.env.APP_URL ?? 'http://localhost:3000'
      const cookieState = req.cookies?.[STATE_COOKIE]
      reply.clearCookie(STATE_COOKIE, { path: '/' })

      const { code, state, error } = req.query
      const slug = state?.split(':')[1] ?? ''
      const settingsUrl = `${appUrl}/${slug}/manager/settings`

      // Validações: papel, erro do Google, CSRF (state), code presente
      if (req.user.role !== 'manager' || error || !code || !state || state !== cookieState) {
        return reply.redirect(`${settingsUrl}?google=error`)
      }

      try {
        await handleCallback(req.tenantId, req.user.id, code)
        return reply.redirect(`${settingsUrl}?google=connected`)
      } catch (err) {
        console.error('[integrations] callback falhou:', err)
        return reply.redirect(`${settingsUrl}?google=error`)
      }
    },
  )

  // ── Rostering (gestor) ─────────────────────────────────────────────────────

  f.get(
    '/:slug/integrations/google/courses',
    { schema: { params: slugParamsSchema, response: { 200: coursesResponseSchema } }, preHandler: managerGuard },
    async (req, reply) => {
      const result = await listGoogleCourses(req.resolvedTenantId)
      return reply.status(200).send(result)
    },
  )

  f.post(
    '/:slug/integrations/google/import',
    {
      schema: { params: slugParamsSchema, body: importCourseBodySchema, response: { 201: importResponseSchema } },
      preHandler: managerGuard,
    },
    async (req, reply) => {
      const result = await importCourse(req.resolvedTenantId, req.params.slug, req.body)
      return reply.status(201).send(result)
    },
  )

  f.delete(
    '/:slug/integrations/google',
    { schema: { params: slugParamsSchema, response: { 200: messageResponseSchema } }, preHandler: managerGuard },
    async (req, reply) => {
      await disconnect(req.resolvedTenantId)
      return reply.status(200).send({ data: { message: 'Conta Google desconectada' } })
    },
  )
}
