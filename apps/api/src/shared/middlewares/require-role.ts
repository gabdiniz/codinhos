import type { FastifyRequest, FastifyReply } from 'fastify'
import { ForbiddenError } from '../errors/index.js'

type Role = 'super_admin' | 'manager' | 'professor' | 'student' | 'guardian'

/**
 * Middleware factory: retorna um preHandler que exige um dos roles listados.
 * Deve ser usado após `authenticate`.
 *
 * @example
 * app.get('/rota', { preHandler: [authenticate, requireRole('manager', 'super_admin')] }, handler)
 */
export function requireRole(...allowedRoles: Role[]) {
  return async (req: FastifyRequest, _reply: FastifyReply): Promise<void> => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      throw new ForbiddenError()
    }
  }
}
