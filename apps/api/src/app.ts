import Fastify, { type FastifyError } from 'fastify'
import cookie from '@fastify/cookie'
import cors from '@fastify/cors'
import multipart from '@fastify/multipart'
import rateLimit from '@fastify/rate-limit'
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod'
import { authRoutes } from './modules/auth/auth.routes.js'
import { tenantsRoutes } from './modules/tenants/tenants.routes.js'
import { usersRoutes } from './modules/users/users.routes.js'
import { catalogRoutes } from './modules/catalog/catalog.routes.js'
import { certificatesRoutes } from './modules/certificates/certificates.routes.js'
import { tenantTrailsRoutes } from './modules/tenant-trails/tenant-trails.routes.js'
import { authoringRoutes } from './modules/authoring/authoring.routes.js'
import { classesRoutes } from './modules/classes/classes.routes.js'
import { integrationsRoutes } from './modules/integrations/integrations.routes.js'
import { guardiansRoutes } from './modules/guardians/guardians.routes.js'
import { learnRoutes } from './modules/learn/learn.routes.js'
import { submissionsRoutes } from './modules/submissions/submissions.routes.js'
import { gamificationRoutes } from './modules/gamification/gamification.routes.js'
import { notificationsRoutes } from './modules/notifications/notifications.routes.js'
import { dashboardRoutes } from './modules/dashboard/dashboard.routes.js'
import { weeklyChallengesRoutes } from './modules/weekly-challenges/weekly-challenges.routes.js'
import { tenantSettingsRoutes } from './modules/tenant-settings/tenant-settings.routes.js'
import { studentProfileRoutes } from './modules/student-profile/student-profile.routes.js'
import { portfolioRoutes } from './modules/portfolio/portfolio.routes.js'
import { adminRoutes } from './modules/admin/admin.routes.js'
import { aiTutorRoutes } from './modules/ai-tutor/ai-tutor.routes.js'
import { progressRoutes } from './modules/progress/progress.routes.js'
import { AppError } from './shared/errors/index.js'

export async function createApp() {
  const app = Fastify({
    logger:
      process.env.NODE_ENV !== 'test'
        ? { level: process.env.LOG_LEVEL ?? 'info' }
        : false,
  })

  // Zod type provider
  app.setValidatorCompiler(validatorCompiler)
  app.setSerializerCompiler(serializerCompiler)

  // Plugins
  await app.register(cookie)
  await app.register(multipart, {
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB — suficiente para CSV de importação de alunos
  })

  const isDev = process.env.NODE_ENV !== 'production'
  const allowedOrigins = process.env.CORS_ORIGIN?.split(',').map((o) => o.trim())
    ?? (isDev ? ['http://localhost:5173', 'http://localhost:3000'] : [])

  await app.register(cors, {
    origin: allowedOrigins,
    credentials: true,
  })

  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
    keyGenerator: (req) => req.ip,
  })

  // Error handler global
  // Fastify v5: setErrorHandler recebe FastifyError (extends Error) — já tem statusCode, validation, etc.
  app.setErrorHandler((error: FastifyError, _req, reply) => {
    // AppError e subclasses (instanceof + fallback duck-type para tsx/esbuild edge cases)
    const isAppError =
      error instanceof AppError ||
      ('statusCode' in error &&
        'code' in error &&
        typeof (error as AppError).code === 'string' &&
        [400, 401, 403, 404, 409, 422, 429, 503].includes((error as AppError).statusCode))

    if (isAppError) {
      const appErr = error as AppError
      return reply.status(appErr.statusCode).send({
        error: { code: appErr.code, message: appErr.message },
      })
    }

    // Erros de validação Zod gerados pelo fastify-type-provider-zod
    if (error.validation) {
      return reply.status(400).send({
        error: { code: 'VALIDATION_ERROR', message: error.message },
      })
    }

    // Erros de rate limit
    if (error.statusCode === 429) {
      return reply.status(429).send({
        error: { code: 'RATE_LIMIT', message: 'Muitas requisições. Tente novamente em breve.' },
      })
    }

    app.log.error(error)
    return reply.status(500).send({
      error: { code: 'INTERNAL_ERROR', message: 'Erro interno do servidor' },
    })
  })

  // Routes
  await app.register(authRoutes, { prefix: '/api' })
  await app.register(tenantsRoutes, { prefix: '/api' })
  await app.register(usersRoutes, { prefix: '/api' })
  await app.register(catalogRoutes, { prefix: '/api' })
  await app.register(tenantTrailsRoutes, { prefix: '/api' })
  await app.register(authoringRoutes, { prefix: '/api' })
  await app.register(classesRoutes, { prefix: '/api' })
  await app.register(integrationsRoutes, { prefix: '/api' })
  await app.register(guardiansRoutes, { prefix: '/api' })
  await app.register(certificatesRoutes, { prefix: '/api' })
  await app.register(learnRoutes, { prefix: '/api' })
  await app.register(submissionsRoutes, { prefix: '/api' })
  await app.register(gamificationRoutes, { prefix: '/api' })
  await app.register(notificationsRoutes, { prefix: '/api' })
  await app.register(dashboardRoutes, { prefix: '/api' })
  await app.register(weeklyChallengesRoutes, { prefix: '/api' })
  await app.register(tenantSettingsRoutes, { prefix: '/api' })
  await app.register(studentProfileRoutes, { prefix: '/api' })
  await app.register(portfolioRoutes, { prefix: '/api' })
  await app.register(adminRoutes, { prefix: '/api' })
  await app.register(aiTutorRoutes, { prefix: '/api' })
  await app.register(progressRoutes, { prefix: '/api' })

  return app
}
