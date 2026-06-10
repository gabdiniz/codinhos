import { ConflictError, NotFoundError } from '../../shared/errors/index.js'
import {
  findAllBadges,
  findBadgeById,
  findBadgeBySlug,
  countStudentBadgesByBadgeId,
  insertBadge,
  updateBadge,
  deleteBadgeById,
  listAdminUsers,
} from './admin.repository.js'
import type { CreateBadgeBody, UpdateBadgeBody, ListAdminUsersQuery } from './admin.schema.js'

// ─── GET /admin/badges ────────────────────────────────────────────────────────

export async function getBadges() {
  const rows = await findAllBadges()
  return { data: rows }
}

// ─── POST /admin/badges ───────────────────────────────────────────────────────

export async function createBadge(body: CreateBadgeBody) {
  const existing = await findBadgeBySlug(body.slug)
  if (existing) throw new ConflictError('Slug de badge já está em uso')

  const badge = await insertBadge(body)
  return { data: { badge } }
}

// ─── PATCH /admin/badges/:badgeId ─────────────────────────────────────────────

export async function editBadge(badgeId: string, body: UpdateBadgeBody) {
  const current = await findBadgeById(badgeId)
  if (!current) throw new NotFoundError('Badge')

  // Sem campos a atualizar — retorna badge atual sem write
  const hasUpdates = Object.values(body).some((v) => v !== undefined)
  if (!hasUpdates) return { data: { badge: current } }

  const badge = await updateBadge(badgeId, body)
  if (!badge) throw new NotFoundError('Badge')

  return { data: { badge } }
}

// ─── DELETE /admin/badges/:badgeId ────────────────────────────────────────────

export async function removeBadge(badgeId: string) {
  const current = await findBadgeById(badgeId)
  if (!current) throw new NotFoundError('Badge')

  const inUse = await countStudentBadgesByBadgeId(badgeId)
  if (inUse > 0) throw new ConflictError('Badge já foi concedido a alunos e não pode ser removido')

  await deleteBadgeById(badgeId)
  return { data: { message: 'Badge removido com sucesso' } }
}

// ─── GET /admin/users ─────────────────────────────────────────────────────────

export async function getAdminUsers(query: ListAdminUsersQuery) {
  const { rows, total } = await listAdminUsers({
    tenantId: query.tenantId,
    role: query.role,
    isActive: query.isActive,
    page: query.page,
    limit: query.limit,
  })
  return {
    data: rows,
    meta: { total, page: query.page, limit: query.limit },
  }
}
