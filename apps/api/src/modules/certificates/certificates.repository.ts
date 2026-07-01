import { and, eq, isNull } from 'drizzle-orm'
import { db } from '../../shared/db/index.js'
import { certificateTemplates } from '../../shared/db/schema.js'
import type { CertificateConfig } from '../../shared/db/schema.js'

const cols = {
  id: certificateTemplates.id,
  trailId: certificateTemplates.trailId,
  enabled: certificateTemplates.enabled,
  config: certificateTemplates.config,
}

export async function listTemplates(tenantId: string) {
  return db.select(cols).from(certificateTemplates).where(eq(certificateTemplates.tenantId, tenantId))
}

/** trailId null = template padrão da escola. */
export async function findTemplate(tenantId: string, trailId: string | null) {
  const where =
    trailId === null
      ? and(eq(certificateTemplates.tenantId, tenantId), isNull(certificateTemplates.trailId))
      : and(eq(certificateTemplates.tenantId, tenantId), eq(certificateTemplates.trailId, trailId))
  const [row] = await db.select(cols).from(certificateTemplates).where(where).limit(1)
  return row ?? null
}

export async function insertTemplate(input: {
  tenantId: string
  trailId: string | null
  enabled: boolean
  config: CertificateConfig
}) {
  const [row] = await db
    .insert(certificateTemplates)
    .values({ tenantId: input.tenantId, trailId: input.trailId, enabled: input.enabled, config: input.config })
    .returning(cols)
  return row!
}

export async function updateTemplateById(id: string, patch: { enabled: boolean; config: CertificateConfig }) {
  const [row] = await db
    .update(certificateTemplates)
    .set({ enabled: patch.enabled, config: patch.config })
    .where(eq(certificateTemplates.id, id))
    .returning(cols)
  return row!
}

export async function deleteTemplateById(tenantId: string, id: string) {
  const [row] = await db
    .delete(certificateTemplates)
    .where(and(eq(certificateTemplates.tenantId, tenantId), eq(certificateTemplates.id, id)))
    .returning({ id: certificateTemplates.id })
  return row ?? null
}
