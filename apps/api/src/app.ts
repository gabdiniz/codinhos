import Fastify from 'fastify'
import cookie from '@fastify/cookie'
import cors from '@fastify/cors'
import rateLimit from '@fastify/rate-limit'
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod'
import { authRoutes } from './modules/auth/auth.routes.js'
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

  await app.register(cors, {
    origin: process.env.CORS_ORIGIN?.split(',').map((o) => o.trim()) ?? [],
    credentials: true,
  })

  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
    keyGenerator: (req) => req.ip,
  })

  // Error handler global
  app.setErrorHandler((error, _req, reply) => {
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        error: { code: error.code, message: error.message },
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

  // Health check
  app.get('/health', async () => ({ status: 'ok' }))

  return app
}
