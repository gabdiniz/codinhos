import { eq } from 'drizzle-orm'
import { db } from '../../shared/db/index.js'
import { googleIntegrations } from '../../shared/db/schema.js'

type UpsertInput = {
  tenantId: string
  connectedBy: string
  googleEmail: string
  accessToken: string
  refreshToken: string
  tokenExpiry: Date
  scope: string | null
}

export async function findGoogleIntegration(tenantId: string): Promise<
  | {
      id: string
      tenantId: string
      googleEmail: string
      accessToken: string
      refreshToken: string
      tokenExpiry: Date
      scope: string | null
    }
  | null
> {
  const [row] = await db
    .select({
      id: googleIntegrations.id,
      tenantId: googleIntegrations.tenantId,
      googleEmail: googleIntegrations.googleEmail,
      accessToken: googleIntegrations.accessToken,
      refreshToken: googleIntegrations.refreshToken,
      tokenExpiry: googleIntegrations.tokenExpiry,
      scope: googleIntegrations.scope,
    })
    .from(googleIntegrations)
    .where(eq(googleIntegrations.tenantId, tenantId))
    .limit(1)
  return row ?? null
}

export async function upsertGoogleIntegration(input: UpsertInput) {
  await db
    .insert(googleIntegrations)
    .values(input)
    .onConflictDoUpdate({
      target: googleIntegrations.tenantId,
      set: {
        connectedBy: input.connectedBy,
        googleEmail: input.googleEmail,
        accessToken: input.accessToken,
        refreshToken: input.refreshToken,
        tokenExpiry: input.tokenExpiry,
        scope: input.scope,
        updatedAt: new Date(),
      },
    })
}

export async function updateGoogleAccessToken(tenantId: string, accessToken: string, tokenExpiry: Date) {
  await db
    .update(googleIntegrations)
    .set({ accessToken, tokenExpiry, updatedAt: new Date() })
    .where(eq(googleIntegrations.tenantId, tenantId))
}

export async function deleteGoogleIntegration(tenantId: string) {
  await db.delete(googleIntegrations).where(eq(googleIntegrations.tenantId, tenantId))
}
