import { eq, and, or, isNull } from 'drizzle-orm'
import { db } from '../../shared/db/index.js'
import { tenantTrails, trails } from '../../shared/db/schema.js'

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function listTenantTrails(tenantId: string) {
  const rows = await db
    .select({
      id: trails.id,
      slug: trails.slug,
      title: trails.title,
      description: trails.description,
      language: trails.language,
      order: tenantTrails.order,
    })
    .from(tenantTrails)
    .innerJoin(trails, eq(trails.id, tenantTrails.trailId))
    .where(eq(tenantTrails.tenantId, tenantId))
    .orderBy(tenantTrails.order)
  return rows
}

export async function findTenantTrail(tenantId: string, trailId: string) {
  const [row] = await db
    .select({
      id: tenantTrails.id,
      tenantId: tenantTrails.tenantId,
      trailId: tenantTrails.trailId,
      order: tenantTrails.order,
      trail: {
        id: trails.id,
        slug: trails.slug,
        title: trails.title,
        description: trails.description,
        language: trails.language,
      },
    })
    .from(tenantTrails)
    .innerJoin(trails, eq(trails.id, tenantTrails.trailId))
    .where(and(eq(tenantTrails.tenantId, tenantId), eq(tenantTrails.trailId, trailId)))
    .limit(1)
  return row ?? null
}

/** Próximo order disponível para o tenant (max + 1) */
export async function nextTenantTrailOrder(tenantId: string): Promise<number> {
  const rows = await db
    .select({ order: tenantTrails.order })
    .from(tenantTrails)
    .where(eq(tenantTrails.tenantId, tenantId))
    .orderBy(tenantTrails.order)
  if (rows.length === 0) return 1
  return rows[rows.length - 1]!.order + 1
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export async function activateTrail(tenantId: string, trailId: string, order: number) {
  const [row] = await db
    .insert(tenantTrails)
    .values({ tenantId, trailId, order })
    .returning({ id: tenantTrails.id, trailId: tenantTrails.trailId, order: tenantTrails.order })
  return row!
}

export async function updateTenantTrailOrder(tenantId: string, trailId: string, order: number) {
  const [row] = await db
    .update(tenantTrails)
    .set({ order })
    .where(and(eq(tenantTrails.tenantId, tenantId), eq(tenantTrails.trailId, trailId)))
    .returning({ id: tenantTrails.id, trailId: tenantTrails.trailId, order: tenantTrails.order })
  return row ?? null
}

export async function deactivateTrail(tenantId: string, trailId: string) {
  await db
    .delete(tenantTrails)
    .where(and(eq(tenantTrails.tenantId, tenantId), eq(tenantTrails.trailId, trailId)))
}

/** Trilhas que o tenant pode ativar: catálogo global (tenant_id NULL) + as próprias. */
export async function listAvailableTrailsForTenant(tenantId: string) {
  return db
    .select({
      id: trails.id,
      slug: trails.slug,
      title: trails.title,
      description: trails.description,
      language: trails.language,
    })
    .from(trails)
    .where(or(isNull(trails.tenantId), eq(trails.tenantId, tenantId)))
    .orderBy(trails.order)
}

/** Valida que a trilha pode ser ativada por este tenant (global OU própria). */
export async function findActivatableTrail(trailId: string, tenantId: string) {
  const [row] = await db
    .select({ id: trails.id })
    .from(trails)
    .where(and(eq(trails.id, trailId), or(isNull(trails.tenantId), eq(trails.tenantId, tenantId))))
    .limit(1)
  return row ?? null
}
