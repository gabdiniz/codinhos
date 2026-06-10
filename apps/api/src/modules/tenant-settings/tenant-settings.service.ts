import { NotFoundError } from '../../shared/errors/index.js'
import type { TenantSettings } from '../../shared/db/schema.js'
import { findTenantSettings, updateTenantSettings } from './tenant-settings.repository.js'
import type { UpdateSettingsBody } from './tenant-settings.schema.js'

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Defaults aplicados quando o tenant não tem configuração salva
const GAMIFICATION_DEFAULTS = {
  xpPerLevel: 100,
  firstAttemptBonusMultiplier: 1.5,
  streakBonusXp: 10,
  streakBonusMaxXp: 50,
  streakMilestoneDays: [7, 14, 30],
}

function mapSettings(tenant: {
  name: string
  plan: string
  theme: Record<string, string> | null | undefined
  settings: TenantSettings
}) {
  const g = tenant.settings?.gamification

  return {
    name: tenant.name,
    plan: tenant.plan,
    theme: tenant.theme ?? null,
    gamification: {
      xpPerLevel: g?.xp_per_level ?? GAMIFICATION_DEFAULTS.xpPerLevel,
      firstAttemptBonusMultiplier:
        g?.first_attempt_bonus_multiplier ?? GAMIFICATION_DEFAULTS.firstAttemptBonusMultiplier,
      streakBonusXp: g?.streak_bonus_xp ?? GAMIFICATION_DEFAULTS.streakBonusXp,
      streakBonusMaxXp: g?.streak_bonus_max_xp ?? GAMIFICATION_DEFAULTS.streakBonusMaxXp,
      streakMilestoneDays: g?.streak_milestone_days ?? GAMIFICATION_DEFAULTS.streakMilestoneDays,
    },
    aiMessagesPerDay: tenant.settings?.ai_messages_per_day ?? null,
    maxStudents: tenant.settings?.max_students ?? null,
  }
}

// ─── GET /:slug/settings ──────────────────────────────────────────────────────

export async function getSettings(tenantId: string) {
  const tenant = await findTenantSettings(tenantId)
  if (!tenant) throw new NotFoundError('Tenant')

  return { data: { settings: mapSettings(tenant) } }
}

// ─── PATCH /:slug/settings ────────────────────────────────────────────────────

export async function updateSettings(tenantId: string, body: UpdateSettingsBody) {
  const current = await findTenantSettings(tenantId)
  if (!current) throw new NotFoundError('Tenant')

  // Se não há nada a atualizar, retorna as configurações atuais sem write no banco
  if (!body.theme && !body.gamification) {
    return { data: { settings: mapSettings(current) } }
  }

  // Merge parcial de settings.gamification (snake_case no banco)
  let newSettings: TenantSettings | undefined
  if (body.gamification) {
    const g = body.gamification
    newSettings = {
      ...current.settings,
      gamification: {
        ...current.settings?.gamification,
        ...(g.xpPerLevel !== undefined && { xp_per_level: g.xpPerLevel }),
        ...(g.firstAttemptBonusMultiplier !== undefined && {
          first_attempt_bonus_multiplier: g.firstAttemptBonusMultiplier,
        }),
        ...(g.streakBonusXp !== undefined && { streak_bonus_xp: g.streakBonusXp }),
        ...(g.streakBonusMaxXp !== undefined && { streak_bonus_max_xp: g.streakBonusMaxXp }),
        ...(g.streakMilestoneDays !== undefined && {
          streak_milestone_days: g.streakMilestoneDays,
        }),
      },
    }
  }

  const updated = await updateTenantSettings(tenantId, {
    theme: body.theme,
    settings: newSettings,
  })

  if (!updated) throw new NotFoundError('Tenant')

  return { data: { settings: mapSettings(updated) } }
}
