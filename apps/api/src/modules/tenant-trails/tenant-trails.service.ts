import {
  listTenantTrails,
  findTenantTrail,
  nextTenantTrailOrder,
  activateTrail,
  listAvailableTrailsForTenant,
  findActivatableTrail,
  updateTenantTrailOrder,
  deactivateTrail,
} from './tenant-trails.repository.js'
// (sem dependência do catalog aqui — o scoping é feito no tenant-trails.repository)
import { ConflictError, NotFoundError } from '../../shared/errors/index.js'
import type { ActivateTrailBody, ReorderTrailBody } from './tenant-trails.schema.js'

export async function getTenantTrails(tenantId: string) {
  const rows = await listTenantTrails(tenantId)
  return { data: rows }
}

export async function getAvailableTrails(tenantId: string) {
  // Catálogo global + flag de já-ativada-no-tenant, para o gestor escolher o que ativar.
  const [catalog, activated] = await Promise.all([
    listAvailableTrailsForTenant(tenantId),
    listTenantTrails(tenantId),
  ])
  const activatedIds = new Set(activated.map((t) => t.id))
  return {
    data: catalog.map((t) => ({
      id: t.id,
      slug: t.slug,
      title: t.title,
      description: t.description,
      language: t.language,
      activated: activatedIds.has(t.id),
    })),
  }
}


export async function activateTenantTrail(tenantId: string, body: ActivateTrailBody) {
  const trail = await findActivatableTrail(body.trailId, tenantId)
  if (!trail) throw new NotFoundError('Trilha')

  const existing = await findTenantTrail(tenantId, body.trailId)
  if (existing) throw new ConflictError('Trilha já está ativada para este tenant')

  const order = body.order ?? (await nextTenantTrailOrder(tenantId))
  const row = await activateTrail(tenantId, body.trailId, order)

  const tenantTrail = await findTenantTrail(tenantId, row.trailId)
  return { tenantTrail: tenantTrail! }
}

export async function reorderTenantTrail(
  tenantId: string,
  trailId: string,
  body: ReorderTrailBody,
) {
  const existing = await findTenantTrail(tenantId, trailId)
  if (!existing) throw new NotFoundError('Trilha')

  await updateTenantTrailOrder(tenantId, trailId, body.order)

  const tenantTrail = await findTenantTrail(tenantId, trailId)
  return { tenantTrail: tenantTrail! }
}

export async function deactivateTenantTrail(tenantId: string, trailId: string) {
  const existing = await findTenantTrail(tenantId, trailId)
  if (!existing) throw new NotFoundError('Trilha')

  await deactivateTrail(tenantId, trailId)
}
