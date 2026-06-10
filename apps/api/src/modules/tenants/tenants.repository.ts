import { and, count, eq } from 'drizzle-orm'
import { db } from '../../shared/db/index.js'
import { tenants, users, sessions, passwordResetTokens } from '../../shared/db/schema.js'
import type { TenantSettings, TenantTheme } from '../../shared/db/schema.js'

// ─── Tenant ───────────────────────────────────────────────────────────────────

export async function findTenantBySlug(slug: string) {
  const [tenant] = await db
    .select({ id: tenants.id })
    .from(tenants)
    .where(eq(tenants.slug, slug))
    .limit(1)
  return tenant ?? null
}

export async function findTenantById(id: string) {
  const [tenant] = await db
    .select({
      id: tenants.id,
      slug: tenants.slug,
      name: tenants.name,
      plan: tenants.plan,
      settings: tenants.settings,
      theme: tenants.theme,
      isActive: tenants.isActive,
      createdAt: tenants.createdAt,
    })
    .from(tenants)
    .where(eq(tenants.id, id))
    .limit(1)
  return tenant ?? null
}

type ListTenantsOptions = {
  page: number
  limit: number
  isActive?: boolean
}

export async function listTenants({ page, limit, isActive }: ListTenantsOptions) {
  const where = isActive !== undefined ? eq(tenants.isActive, isActive) : undefined

  const [rows, [{ value: total }]] = await Promise.all([
    db
      .select({
        id: tenants.id,
        slug: tenants.slug,
        name: tenants.name,
        plan: tenants.plan,
        isActive: tenants.isActive,
        createdAt: tenants.createdAt,
      })
      .from(tenants)
      .where(where)
      .orderBy(tenants.createdAt)
      .limit(limit)
      .offset((page - 1) * limit),
    db.select({ value: count() }).from(tenants).where(where),
  ])

  return { rows, total: Number(total) }
}

type UpdateTenantInput = {
  name?: string
  plan?: string
  settings?: TenantSettings
  theme?: TenantTheme
}

export async function updateTenant(id: string, input: UpdateTenantInput) {
  const [tenant] = await db
    .update(tenants)
    .set({
      ...(input.name !== undefined && { name: input.name }),
      ...(input.plan !== undefined && { plan: input.plan }),
      ...(input.settings !== undefined && { settings: input.settings }),
      ...(input.theme !== undefined && { theme: input.theme }),
    })
    .where(eq(tenants.id, id))
    .returning({
      id: tenants.id,
      slug: tenants.slug,
      name: tenants.name,
      plan: tenants.plan,
      settings: tenants.settings,
      theme: tenants.theme,
      isActive: tenants.isActive,
      createdAt: tenants.createdAt,
    })
  return tenant ?? null
}

export async function setTenantActive(id: string, isActive: boolean) {
  await db.update(tenants).set({ isActive }).where(eq(tenants.id, id))
}

// ─── Transação: cria tenant + gestor + token de convite ───────────────────────

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0]

type CreateTenantWithManagerInput = {
  slug: string
  name: string
  plan?: string
  settings?: TenantSettings
  managerEmail: string
  managerName: string
  passwordHash: string
  tokenHash: string
  tokenExpiresAt: Date
}

export async function createTenantWithManager(tx: Tx, input: CreateTenantWithManagerInput) {
  const [tenant] = await tx
    .insert(tenants)
    .values({
      slug: input.slug,
      name: input.name,
      plan: input.plan ?? 'free',
      settings: input.settings ?? {},
      isActive: true,
    })
    .returning({
      id: tenants.id,
      slug: tenants.slug,
      name: tenants.name,
      plan: tenants.plan,
      settings: tenants.settings,
      theme: tenants.theme,
      isActive: tenants.isActive,
      createdAt: tenants.createdAt,
    })

  const [manager] = await tx
    .insert(users)
    .values({
      tenantId: tenant!.id,
      email: input.managerEmail,
      passwordHash: input.passwordHash,
      name: input.managerName,
      role: 'manager',
      isActive: true,
    })
    .returning({ id: users.id, email: users.email })

  await tx.insert(passwordResetTokens).values({
    userId: manager!.id,
    tokenHash: input.tokenHash,
    type: 'invite',
    expiresAt: input.tokenExpiresAt,
  })

  return { tenant: tenant!, manager: manager! }
}

// ─── Sessions ─────────────────────────────────────────────────────────────────

export async function deleteSessionsByTenantId(tenantId: string) {
  await db.delete(sessions).where(eq(sessions.tenantId, tenantId))
}

// ─── User (gestor inicial) ────────────────────────────────────────────────────

export async function findUserByEmailInTenant(email: string, tenantId: string) {
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.email, email), eq(users.tenantId, tenantId)))
    .limit(1)
  return user ?? null
}
