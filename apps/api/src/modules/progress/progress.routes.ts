import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { resolveTenant } from '../../shared/middlewares/resolve-tenant.js'
import { authenticate } from '../../shared/middlewares/authenticate.js'
import { requireRole } from '../../shared/middlewares/require-role.js'
import { unlockModule } from './progress.service.js'
import {
  unlockModuleParamsSchema,
  unlockModuleBodySchema,
  unlockModuleResponseSchema,
} from './progress.schema.js'

export async function progressRoutes(app: FastifyInstance) {
  const f = app.withTypeProvider<ZodTypeProvider>()
  const guard = [resolveTenant, authenticate, requireRole('manager')]

  /**
   * PATCH /api/:slug/progress/modules/:moduleId/unlock
   * Desbloqueia manualmente um módulo para um aluno (turma em modo "controlled").
   */
  f.patch(
    '/:slug/progress/modules/:moduleId/unlock',
    {
      schema: {
        params: unlockModuleParamsSchema,
        body: unlockModuleBodySchema,
        response: { 200: unlockModuleResponseSchema },
      },
      preHandler: guard,
    },
    async (req, reply) => {
      const result = await unlockModule(
        req.resolvedTenantId,
        req.params.moduleId,
        req.body,
        req.user.id,
      )
      return reply.status(200).send(result)
    },
  )
}
