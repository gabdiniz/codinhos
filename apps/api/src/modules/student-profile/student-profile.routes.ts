import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { resolveTenant } from '../../shared/middlewares/resolve-tenant.js'
import { authenticate } from '../../shared/middlewares/authenticate.js'
import { requireRole } from '../../shared/middlewares/require-role.js'
import { getStudentProfile } from './student-profile.service.js'
import {
  studentProfileParamsSchema,
  studentProfileResponseSchema,
} from './student-profile.schema.js'

export async function studentProfileRoutes(app: FastifyInstance) {
  const f = app.withTypeProvider<ZodTypeProvider>()
  const studentManagerGuard = [resolveTenant, authenticate, requireRole('student', 'manager')]

  // GET /:slug/students/:studentId/profile — perfil de um aluno (visão varia por role)
  f.get(
    '/:slug/students/:studentId/profile',
    {
      schema: {
        params: studentProfileParamsSchema,
        response: { 200: studentProfileResponseSchema },
      },
      preHandler: studentManagerGuard,
    },
    async (req, reply) => {
      const result = await getStudentProfile(
        req.params.studentId,
        req.resolvedTenantId,
        req.user.id,
        req.user.role,
      )
      return reply.status(200).send({ data: result })
    },
  )
}
