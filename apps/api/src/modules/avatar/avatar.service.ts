import type { AvatarConfig, AvatarCategory } from '@codinhos/types'
import { BadRequestError } from '../../shared/errors/index.js'
import { findStudentStats } from '../gamification/gamification.repository.js'
import { AVATAR_CATALOG, DEFAULT_AVATAR_CONFIG } from './avatar.catalog.js'
import { findAvatarConfig, updateAvatarConfig } from './avatar.repository.js'
import type { AvatarConfigBody } from './avatar.schema.js'

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Monta as categorias com o flag `unlocked` conforme o nível do aluno. */
function buildCategories(level: number): AvatarCategory[] {
  return AVATAR_CATALOG.map((cat) => ({
    key: cat.key,
    label: cat.label,
    kind: cat.kind,
    options: cat.options.map((opt) => ({
      value: opt.value,
      label: opt.label,
      requiredLevel: opt.requiredLevel,
      ...(opt.swatch !== undefined && { swatch: opt.swatch }),
      unlocked: level >= opt.requiredLevel,
    })),
  }))
}

/**
 * Valida um config completo contra o catálogo e o nível do aluno.
 * Lança BadRequestError se algum valor não existe ou está travado.
 */
function validateConfig(config: AvatarConfigBody, level: number): void {
  for (const cat of AVATAR_CATALOG) {
    const chosen = config[cat.key]
    const opt = cat.options.find((o) => o.value === chosen)
    if (!opt) {
      throw new BadRequestError(`Opção inválida para "${cat.label}".`)
    }
    if (level < opt.requiredLevel) {
      throw new BadRequestError(
        `"${opt.label}" (${cat.label}) desbloqueia no nível ${opt.requiredLevel}.`,
      )
    }
  }
}

// ─── GET /:slug/me/avatar ─────────────────────────────────────────────────────

export async function getAvatarStudio(studentId: string, tenantId: string) {
  const [stats, row] = await Promise.all([
    findStudentStats(studentId, tenantId),
    findAvatarConfig(studentId, tenantId),
  ])
  const level = stats?.level ?? 1
  const config: AvatarConfig = row?.avatarConfig ?? DEFAULT_AVATAR_CONFIG

  return {
    config,
    level,
    categories: buildCategories(level),
  }
}

// ─── PUT /:slug/me/avatar ─────────────────────────────────────────────────────

export async function saveAvatar(
  studentId: string,
  tenantId: string,
  body: AvatarConfigBody,
) {
  const stats = await findStudentStats(studentId, tenantId)
  const level = stats?.level ?? 1

  // Defesa em profundidade: a UI já esconde itens travados, mas a API revalida.
  validateConfig(body, level)

  await updateAvatarConfig(studentId, tenantId, body)
  return { config: body }
}
