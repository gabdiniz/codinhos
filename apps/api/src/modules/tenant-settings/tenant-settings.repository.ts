import { eq } from 'drizzle-orm'
import { db } from '../../shared/db/index.js'
import { tenants } from '../../shared/db/schema.js'
import type { TenantSettings, TenantTheme } from '../../shared/db/schema.js'

export async function findTenantSettings(tenantId: string) {
  const [row] = await db
    .select({
      id: tenants.id,
      name: tenants.name,
      plan: tenants.plan,
      theme: tenants.theme,
      settings: tenants.settings,
    })
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1)
  return row ?? null
}

type UpdateTenantSettingsInput = {
  theme?: TenantTheme
  settings?: TenantSettings
}

export async function updateTenantSettings(tenantId: string, input: UpdateTenantSettingsInput) {
  const [row] = await db
    .update(tenants)
    .set({
      ...(input.theme !== undefined && { theme: input.theme }),
      ...(input.settings !== undefined && { settings: input.settings }),
    })
    .where(eq(tenants.id, tenantId))
    .returning({
      id: tenants.id,
      name: tenants.name,
      plan: tenants.plan,
      theme: tenants.theme,
      settings: tenants.settings,
    })
  return row ?? null
}
