import { and, eq } from 'drizzle-orm'
import { db } from '../../shared/db/index.js'
import { users } from '../../shared/db/schema.js'
import type { AvatarConfig } from '@codinhos/types'

// ─── Leitura ──────────────────────────────────────────────────────────────────

// Anotação de retorno explícita: sem ela o TS descarta o ramo `null` do `?? null`.
export async function findAvatarConfig(
  studentId: string,
  tenantId: string,
): Promise<{ avatarConfig: AvatarConfig | null } | null> {
  const [row] = await db
    .select({ avatarConfig: users.avatarConfig })
    .from(users)
    .where(and(eq(users.id, studentId), eq(users.tenantId, tenantId)))
    .limit(1)
  return row ?? null
}

// ─── Escrita ──────────────────────────────────────────────────────────────────

export async function updateAvatarConfig(
  studentId: string,
  tenantId: string,
  config: AvatarConfig,
): Promise<void> {
  await db
    .update(users)
    .set({ avatarConfig: config })
    .where(and(eq(users.id, studentId), eq(users.tenantId, tenantId)))
}
