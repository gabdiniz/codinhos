import type { FastifyRequest, FastifyReply } from 'fastify'
import { eq } from 'drizzle-orm'
import { db } from '../db/index.js'
import { tenants } from '../db/schema.js'
import { NotFoundError } from '../errors/index.js'

declare module 'fastify' {
  interface FastifyRequest {
    /** tenantId resolvido a partir do :slug na URL — disponível em todas as rotas com :slug */
    resolvedTenantId: string
  }
}

/**
 * Middleware: lê `:slug` dos params, valida que o tenant existe e está ativo,
 * e injeta `req.resolvedTenantId`.
 *
 * Deve ser registrado como preHandler nas rotas sob /api/:slug/.
 * NÃO define `req.tenantId` — esse é responsabilidade do middleware `authenticate`.
 */
export async function resolveTenant(req: FastifyRequest, _reply: FastifyReply): Promise<void> {
  const { slug } = req.params as { slug?: string }

  if (!slug) {
    throw new NotFoundError('Tenant')
  }

  const [tenant] = await db
    .select({ id: tenants.id, isActive: tenants.isActive })
    .from(tenants)
    .where(eq(tenants.slug, slug))
    .limit(1)

  if (!tenant || !tenant.isActive) {
    throw new NotFoundError('Tenant')
  }

  req.resolvedTenantId = tenant.id
}
