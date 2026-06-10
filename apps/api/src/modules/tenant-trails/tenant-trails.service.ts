import {
  listTenantTrails,
  findTenantTrail,
  nextTenantTrailOrder,
  activateTrail,
  updateTenantTrailOrder,
  deactivateTrail,
} from './tenant-trails.repository.js'
import { findTrailById } from '../catalog/catalog.repository.js'
import { ConflictError, NotFoundError } from '../../shared/errors/index.js'
import type { ActivateTrailBody, ReorderTrailBody } from './tenant-trails.schema.js'

export async function getTenantTrails(tenantId: string) {
  const rows = await listTenantTrails(tenantId)
  return { data: rows }
}

export async function activateTenantTrail(tenantId: string, body: ActivateTrailBody) {
  const trail = await findTrailById(body.trailId)
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
