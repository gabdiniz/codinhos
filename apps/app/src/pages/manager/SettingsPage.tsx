import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { api, ApiError } from '../../lib/api.ts'
import styles from './SettingsPage.module.css'

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Gamification {
  xpPerLevel: number
  firstAttemptBonusMultiplier: number
  streakBonusXp: number
  streakBonusMaxXp: number
  streakMilestoneDays: number[]
}

interface TenantSettings {
  name: string
  plan: string
  theme: Record<string, string> | null
  gamification: Gamification | null
  aiMessagesPerDay: number | null
  maxStudents: number | null
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const PLAN_LABEL: Record<string, string> = {
  starter: 'Starter',
  basic: 'Basic',
  pro: 'Pro',
  enterprise: 'Enterprise',
}

interface ThemeVar { key: string; label: string }

const THEME_GROUPS: { group: string; vars: ThemeVar[] }[] = [
  {
    group: 'Marca',
    vars: [
      { key: 'color-primary',        label: 'Cor principal' },
      { key: 'color-primary-hover',  label: 'Hover da cor principal' },
      { key: 'color-secondary',      label: 'Cor secundária' },
      { key: 'color-accent',         label: 'Destaque' },
    ],
  },
  {
    group: 'Layout',
    vars: [
      { key: 'color-background',     label: 'Fundo da página' },
      { key: 'color-surface',        label: 'Fundo de cards' },
      { key: 'color-surface-raised', label: 'Cards elevados' },
      { key: 'color-border',         label: 'Bordas' },
    ],
  },
  {
    group: 'Texto',
    vars: [
      { key: 'color-text',           label: 'Texto principal' },
      { key: 'color-text-muted',     label: 'Texto secundário' },
      { key: 'color-text-inverse',   label: 'Texto invertido' },
    ],
  },
  {
    group: 'Feedback',
    vars: [
      { key: 'color-success',        label: 'Sucesso' },
      { key: 'color-error',          label: 'Erro' },
      { key: 'color-warning',        label: 'Aviso' },
      { key: 'color-info',           label: 'Informação' },
    ],
  },
]

const DEFAULT_GAMIFICATION: Gamification = {
  xpPerLevel: 100,
  firstAttemptBonusMultiplier: 1.5,
  streakBonusXp: 10,
  streakBonusMaxXp: 50,
  streakMilestoneDays: [7, 14, 30],
}

// ─── Sub-componente: seletor de cor ──────────────────────────────────────────

interface ColorRowProps {
  label: string
  value: string
  onChange: (v: string) => void
}

function ColorRow({ label, value, onChange }: ColorRowProps) {
  // <input type="color"> requer hex de 6 dígitos; fallback para preto
  const pickerValue = /^#[0-9a-fA-F]{6}$/.test(value) ? value : '#000000'

  return (
    <div className={styles.colorRow}>
      <span className={styles.colorLabel}>{label}</span>
      <div className={styles.colorInputs}>
        <input
          type="color"
          className={styles.colorPicker}
          value={pickerValue}
          onChange={(e) => onChange(e.target.value)}
          title={label}
        />
        <input
          type="text"
          className={styles.colorText}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
          spellCheck={false}
        />
      </div>
    </div>
  )
}

// ─── SettingsPage ─────────────────────────────────────────────────────────────

type GamifFields = Omit<Gamification, 'streakMilestoneDays'>

export default function SettingsPage() {
  const { slug } = useParams<{ slug: string }>()

  const [settings, setSettings] = useState<TenantSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  // Tema
  const [themeValues, setThemeValues] = useState<Record<string, string>>({})
  const [savingTheme, setSavingTheme] = useState(false)
  const [themeMsg, setThemeMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Gamificação
  const [gamif, setGamif] = useState<GamifFields>({
    xpPerLevel: DEFAULT_GAMIFICATION.xpPerLevel,
    firstAttemptBonusMultiplier: DEFAULT_GAMIFICATION.firstAttemptBonusMultiplier,
    streakBonusXp: DEFAULT_GAMIFICATION.streakBonusXp,
    streakBonusMaxXp: DEFAULT_GAMIFICATION.streakBonusMaxXp,
  })
  const [milestonesRaw, setMilestonesRaw] = useState('7, 14, 30')
  const [savingGamif, setSavingGamif] = useState(false)
  const [gamifMsg, setGamifMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const load = useCallback(async () => {
    if (!slug) return
    setLoadError(null)
    try {
      const res = await api.get<{ data: { settings: TenantSettings } }>(`/api/${slug}/settings`)
      const s = res.data.settings
      setSettings(s)
      setThemeValues(s.theme ?? {})
      const g = s.gamification ?? DEFAULT_GAMIFICATION
      setGamif({
        xpPerLevel: g.xpPerLevel,
        firstAttemptBonusMultiplier: g.firstAttemptBonusMultiplier,
        streakBonusXp: g.streakBonusXp,
        streakBonusMaxXp: g.streakBonusMaxXp,
      })
      setMilestonesRaw(g.streakMilestoneDays.join(', '))
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : 'Erro ao carregar configurações.')
    } finally {
      setLoading(false)
    }
  }, [slug])

  useEffect(() => { load() }, [load])

  // Auto-dismiss das mensagens de feedback
  useEffect(() => {
    if (!themeMsg) return
    const t = setTimeout(() => setThemeMsg(null), 3500)
    return () => clearTimeout(t)
  }, [themeMsg])

  useEffect(() => {
    if (!gamifMsg) return
    const t = setTimeout(() => setGamifMsg(null), 3500)
    return () => clearTimeout(t)
  }, [gamifMsg])

  function setColor(key: string, value: string) {
    setThemeValues((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSaveTheme() {
    if (!slug) return
    setSavingTheme(true)
    setThemeMsg(null)
    try {
      await api.patch(`/api/${slug}/settings`, { theme: themeValues })
      setThemeMsg({ type: 'success', text: 'Tema salvo com sucesso.' })
    } catch (err) {
      setThemeMsg({ type: 'error', text: err instanceof ApiError ? err.message : 'Erro ao salvar tema.' })
    } finally {
      setSavingTheme(false)
    }
  }

  async function handleSaveGamification() {
    if (!slug) return

    if (gamif.xpPerLevel < 1) {
      setGamifMsg({ type: 'error', text: 'XP por nível deve ser no mínimo 1.' })
      return
    }
    if (gamif.firstAttemptBonusMultiplier < 1) {
      setGamifMsg({ type: 'error', text: 'Multiplicador deve ser no mínimo 1.' })
      return
    }

    const parsedMilestones = milestonesRaw
      .split(',')
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !isNaN(n) && n > 0)

    if (parsedMilestones.length === 0) {
      setGamifMsg({ type: 'error', text: 'Insira ao menos um marco de streak válido.' })
      return
    }

    setSavingGamif(true)
    setGamifMsg(null)
    try {
      await api.patch(`/api/${slug}/settings`, {
        gamification: { ...gamif, streakMilestoneDays: parsedMilestones },
      })
      setGamifMsg({ type: 'success', text: 'Gamificação salva com sucesso.' })
    } catch (err) {
      setGamifMsg({ type: 'error', text: err instanceof ApiError ? err.message : 'Erro ao salvar gamificação.' })
    } finally {
      setSavingGamif(false)
    }
  }

  // ── Estados de carregamento ────────────────────────────────────────────────

  if (loading) {
    return (
      <div className={styles.state}>
        <span className={styles.stateText}>// carregando configurações...</span>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className={styles.state}>
        <span className={styles.stateError}>{loadError}</span>
      </div>
    )
  }

  if (!settings) return null

  return (
    <div className={styles.root}>
      {/* ── Header ── */}
      <header className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Configurações</h1>
          <p className={styles.pageSubtitle}>{settings.name}</p>
        </div>
      </header>

      {/* ── Informações da escola ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Informações da escola</h2>
        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Nome</span>
            <span className={styles.infoValue}>{settings.name}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Plano</span>
            <span className={`${styles.infoValue} ${styles.planBadge}`}>
              {PLAN_LABEL[settings.plan] ?? settings.plan}
            </span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Máx. de alunos</span>
            <span className={styles.infoValue}>
              {settings.maxStudents !== null ? settings.maxStudents.toLocaleString('pt-BR') : '—'}
            </span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Msgs de IA / dia</span>
            <span className={styles.infoValue}>
              {settings.aiMessagesPerDay !== null
                ? settings.aiMessagesPerDay.toLocaleString('pt-BR')
                : '—'}
            </span>
          </div>
        </div>
        <p className={styles.infoHint}>
          Esses valores são configurados pelo administrador da plataforma.
          Para alterar seu plano, entre em contato com o suporte.
        </p>
      </section>

      {/* ── Tema visual ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Tema visual</h2>
        <p className={styles.sectionDesc}>
          Personalize as cores da plataforma para os alunos da sua escola.
          As alterações entram em vigor imediatamente após salvar.
        </p>

        <div className={styles.themeGroups}>
          {THEME_GROUPS.map(({ group, vars }) => (
            <div key={group} className={styles.themeGroup}>
              <h3 className={styles.themeGroupTitle}>{group}</h3>
              <div className={styles.colorRows}>
                {vars.map(({ key, label }) => (
                  <ColorRow
                    key={key}
                    label={label}
                    value={themeValues[key] ?? ''}
                    onChange={(v) => setColor(key, v)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {themeMsg && (
          <p className={themeMsg.type === 'success' ? styles.feedbackSuccess : styles.feedbackError}>
            {themeMsg.text}
          </p>
        )}

        <div className={styles.sectionFooter}>
          <button className={styles.btnPrimary} onClick={handleSaveTheme} disabled={savingTheme}>
            {savingTheme ? 'Salvando...' : 'Salvar tema'}
          </button>
        </div>
      </section>

      {/* ── Gamificação ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Gamificação</h2>
        <p className={styles.sectionDesc}>
          Ajuste as regras de XP e streaks para a sua escola.
        </p>

        <div className={styles.gamifGrid}>
          <div className={styles.field}>
            <label className={styles.label}>XP por nível</label>
            <p className={styles.fieldHint}>XP necessário para subir um nível.</p>
            <input
              type="number"
              className={styles.input}
              value={gamif.xpPerLevel}
              min={1}
              onChange={(e) => setGamif((g) => ({ ...g, xpPerLevel: Number(e.target.value) }))}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Multiplicador — 1ª tentativa</label>
            <p className={styles.fieldHint}>Bônus de XP ao resolver na primeira tentativa (ex: 1.5 = +50%).</p>
            <input
              type="number"
              className={styles.input}
              value={gamif.firstAttemptBonusMultiplier}
              min={1}
              step={0.1}
              onChange={(e) =>
                setGamif((g) => ({ ...g, firstAttemptBonusMultiplier: Number(e.target.value) }))
              }
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Bônus XP por streak (diário)</label>
            <p className={styles.fieldHint}>XP extra por dia de streak ativo.</p>
            <input
              type="number"
              className={styles.input}
              value={gamif.streakBonusXp}
              min={0}
              onChange={(e) => setGamif((g) => ({ ...g, streakBonusXp: Number(e.target.value) }))}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Bônus XP máximo de streak</label>
            <p className={styles.fieldHint}>Teto do bônus de streak diário acumulado.</p>
            <input
              type="number"
              className={styles.input}
              value={gamif.streakBonusMaxXp}
              min={0}
              onChange={(e) => setGamif((g) => ({ ...g, streakBonusMaxXp: Number(e.target.value) }))}
            />
          </div>

          <div className={`${styles.field} ${styles.fieldFull}`}>
            <label className={styles.label}>Marcos de streak (dias)</label>
            <p className={styles.fieldHint}>
              Dias que concedem badges de conquista. Separe por vírgula. Ex: 7, 14, 30
            </p>
            <input
              type="text"
              className={styles.input}
              value={milestonesRaw}
              onChange={(e) => setMilestonesRaw(e.target.value)}
              placeholder="7, 14, 30, 60, 90"
              spellCheck={false}
            />
          </div>
        </div>

        {gamifMsg && (
          <p className={gamifMsg.type === 'success' ? styles.feedbackSuccess : styles.feedbackError}>
            {gamifMsg.text}
          </p>
        )}

        <div className={styles.sectionFooter}>
          <button className={styles.btnPrimary} onClick={handleSaveGamification} disabled={savingGamif}>
            {savingGamif ? 'Salvando...' : 'Salvar gamificação'}
          </button>
        </div>
      </section>
    </div>
  )
}
