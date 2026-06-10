import type { FastifyRequest, FastifyReply } from 'fastify'
import { and, eq, gt } from 'drizzle-orm'
import { db } from '../db/index.js'
import { sessions, users } from '../db/schema.js'
import { UnauthorizedError, AccountDisabledError, NotFoundError } from '../errors/index.js'

type Role = 'super_admin' | 'manager' | 'professor' | 'student'

declare module 'fastify' {
  interface FastifyRequest {
    /** Dados do usuário autenticado — disponível após authenticate */
    user: {
      id: string
      email: string
      name: string
      role: Role
    }
    /** tenantId vindo da sessão — fonte de verdade para isolamento de dados */
    tenantId: string
    /** ID da sessão atual — usado no logout */
    sessionId: string
  }
}

/**
 * Middleware: valida o cookie `sessionId`, confere a sessão no banco,
 * checa que o usuário está ativo, e injeta `req.user`, `req.tenantId`,
 * `req.sessionId`.
 *
 * Proteção cross-tenant: se `req.resolvedTenantId` estiver preenchido
 * (pelo middleware resolveTenant) e não coincidir com o tenantId da sessão,
 * retorna 404 — exceto para super_admin que pode acessar qualquer tenant.
 */
export async function authenticate(req: FastifyRequest, _reply: FastifyReply): Promise<void> {
  const sessionId = req.cookies?.['sessionId']

  if (!sessionId) {
    throw new UnauthorizedError()
  }

  const [session] = await db
    .select({
      id: sessions.id,
      userId: sessions.userId,
      tenantId: sessions.tenantId,
      role: sessions.role,
      expiresAt: sessions.expiresAt,
    })
    .from(sessions)
    .where(and(eq(sessions.id, sessionId), gt(sessions.expiresAt, new Date())))
    .limit(1)

  if (!session) {
    throw new UnauthorizedError()
  }

  // Proteção cross-tenant: sessão deve pertencer ao mesmo tenant do slug
  // Super admin é a única exceção — pode acessar qualquer tenant
  if (
    req.resolvedTenantId &&
    session.role !== 'super_admin' &&
    req.resolvedTenantId !== session.tenantId
  ) {
    throw new NotFoundError()
  }

  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      isActive: users.isActive,
    })
    .from(users)
    .where(and(eq(users.id, session.userId), eq(users.tenantId, session.tenantId)))
    .limit(1)

  if (!user) {
    throw new UnauthorizedError()
  }

  if (!user.isActive) {
    throw new AccountDisabledError()
  }

  req.user = { id: user.id, email: user.email, name: user.name, role: user.role }
  req.tenantId = session.tenantId
  req.sessionId = session.id
}
