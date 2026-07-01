import { NotFoundError } from '../../shared/errors/index.js'
import type { CertificateConfig } from '../../shared/db/schema.js'
import {
  listTemplates,
  findTemplate,
  insertTemplate,
  updateTemplateById,
  deleteTemplateById,
} from './certificates.repository.js'
import type { UpsertTemplateBody } from './certificates.schema.js'

export async function getTemplates(tenantId: string) {
  const rows = await listTemplates(tenantId)
  return { data: rows }
}

export async function upsertTemplate(tenantId: string, body: UpsertTemplateBody) {
  const trailId = body.trailId ?? null
  const existing = await findTemplate(tenantId, trailId)
  const config = (body.config ?? {}) as CertificateConfig
  const row = existing
    ? await updateTemplateById(existing.id, { enabled: body.enabled, config })
    : await insertTemplate({ tenantId, trailId, enabled: body.enabled, config })
  return { template: row }
}

export async function removeTemplate(tenantId: string, templateId: string) {
  const removed = await deleteTemplateById(tenantId, templateId)
  if (!removed) throw new NotFoundError('Template de certificado')
}

/**
 * Resolve o template efetivo para um curso: específico do curso → padrão da
 * escola → nenhum (usa o layout padrão embutido, sempre habilitado).
 * Usado pelo portfólio na emissão do certificado.
 */
export async function resolveCertificateTemplate(tenantId: string, trailId: string) {
  const specific = await findTemplate(tenantId, trailId)
  if (specific) return specific
  return findTemplate(tenantId, null)
}
