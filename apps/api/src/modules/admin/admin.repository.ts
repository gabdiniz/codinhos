import { and, count, eq, isNull } from 'drizzle-orm'
import { db } from '../../shared/db/index.js'
import { badges, studentBadges, users, tenants, passwordResetTokens } from '../../shared/db/schema.js'

// ─── Badges ───────────────────────────────────────────────────────────────────

export async function findAllBadges() {
  return db
    .select({
      id: badges.id,
      slug: badges.slug,
      name: badges.name,
      description: badges.description,
      iconUrl: badges.iconUrl,
      triggerType: badges.triggerType,
      triggerValue: badges.triggerValue,
      createdAt: badges.createdAt,
    })
    .from(badges)
    .orderBy(badges.createdAt)
}

export async function findBadgeById(badgeId: string) {
  const [row] = await db
    .select({
      id: badges.id,
      slug: badges.slug,
      name: badges.name,
      description: badges.description,
      iconUrl: badges.iconUrl,
      triggerType: badges.triggerType,
      triggerValue: badges.triggerValue,
      createdAt: badges.createdAt,
    })
    .from(badges)
    .where(eq(badges.id, badgeId))
    .limit(1)
  return row ?? null
}

export async function findBadgeBySlug(slug: string) {
  const [row] = await db
    .select({ id: badges.id })
    .from(badges)
    .where(eq(badges.slug, slug))
    .limit(1)
  return row ?? null
}

export async function countStudentBadgesByBadgeId(badgeId: string) {
  const [{ value }] = await db
    .select({ value: count() })
    .from(studentBadges)
    .where(eq(studentBadges.badgeId, badgeId))
  return Number(value)
}

type InsertBadgeInput = {
  slug: string
  name: string
  description?: string
  iconUrl?: string
  triggerType: string
  triggerValue: number
}

export async function insertBadge(input: InsertBadgeInput) {
  const [row] = await db
    .insert(badges)
    .values({
      slug: input.slug,
      name: input.name,
      description: input.description,
      iconUrl: input.iconUrl,
      triggerType: input.triggerType,
      triggerValue: input.triggerValue,
    })
    .returning({
      id: badges.id,
      slug: badges.slug,
      name: badges.name,
      description: badges.description,
      iconUrl: badges.iconUrl,
      triggerType: badges.triggerType,
      triggerValue: badges.triggerValue,
      createdAt: badges.createdAt,
    })
  return row!
}

type UpdateBadgeInput = {
  name?: string
  description?: string
  iconUrl?: string
  triggerType?: string
  triggerValue?: number
}

export async function updateBadge(badgeId: string, input: UpdateBadgeInput) {
  const [row] = await db
    .update(badges)
    .set({
      ...(input.name !== undefined && { name: input.name }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.iconUrl !== undefined && { iconUrl: input.iconUrl }),
      ...(input.triggerType !== undefined && { triggerType: input.triggerType }),
      ...(input.triggerValue !== undefined && { triggerValue: input.triggerValue }),
    })
    .where(eq(badges.id, badgeId))
    .returning({
      id: badges.id,
      slug: badges.slug,
      name: badges.name,
      description: badges.description,
      iconUrl: badges.iconUrl,
      triggerType: badges.triggerType,
      triggerValue: badges.triggerValue,
      createdAt: badges.createdAt,
    })
  return row ?? null
}

export async function deleteBadgeById(badgeId: string) {
  await db.delete(badges).where(eq(badges.id, badgeId))
}

// ─── Users (cross-tenant) ─────────────────────────────────────────────────────

type ListAdminUsersOptions = {
  tenantId?: string
  role?: 'super_admin' | 'manager' | 'professor' | 'student' | 'guardian'
  isActive?: boolean
  page: number
  limit: number
}

function buildUsersWhere(opts: Omit<ListAdminUsersOptions, 'page' | 'limit'>) {
  const conditions = []
  if (opts.tenantId !== undefined) conditions.push(eq(users.tenantId, opts.tenantId))
  if (opts.role !== undefined) conditions.push(eq(users.role, opts.role))
  if (opts.isActive !== undefined) conditions.push(eq(users.isActive, opts.isActive))
  return conditions.length > 0 ? and(...conditions) : undefined
}

export async function listAdminUsers(opts: ListAdminUsersOptions) {
  const where = buildUsersWhere(opts)

  const [rows, [{ value: total }]] = await Promise.all([
    db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        isActive: users.isActive,
        tenantId: users.tenantId,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(where)
      .orderBy(users.createdAt)
      .limit(opts.limit)
      .offset((opts.page - 1) * opts.limit),
    db.select({ value: count() }).from(users).where(where),
  ])

  return { rows, total: Number(total) }
}

// ─── Reset de senha iniciado pelo super admin (cross-tenant) ──────────────────

export async function findUserWithTenantForReset(userId: string) {
  const [row] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      isActive: users.isActive,
      slug: tenants.slug,
    })
    .from(users)
    .innerJoin(tenants, eq(tenants.id, users.tenantId))
    .where(eq(users.id, userId))
    .limit(1)
  return row ?? null
}

export async function invalidateActiveResetTokens(userId: string) {
  await db
    .update(passwordResetTokens)
    .set({ usedAt: new Date() })
    .where(
      and(
        eq(passwordResetTokens.userId, userId),
        eq(passwordResetTokens.type, 'reset'),
        isNull(passwordResetTokens.usedAt),
      ),
    )
}

export async function createResetToken(input: { userId: string; tokenHash: string; expiresAt: Date }) {
  await db.insert(passwordResetTokens).values({ ...input, type: 'reset' })
}
