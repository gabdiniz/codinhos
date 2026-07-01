import { useEffect, useState, useCallback } from 'react'
import type { JSX } from 'react'
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
  aiErrorExplanationEnabled: boolean
  allowStudentProfileView: boolean
}

type TabId = 'geral' | 'tema' | 'gamificacao' | 'tutor-ia' | 'privacidade' | 'integracoes'

interface GoogleCourse { id: string; name: string; section: string | null }

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

// Espelha os valores padrão definidos em styles/global.css :root.
// Usado pelo botão "Restaurar padrão" — nunca hardcode cores fora daqui.
const DEFAULT_THEME: Record<string, string> = {
  'color-primary':        '#6366f1',
  'color-primary-hover':  '#4f46e5',
  'color-secondary':      '#8b5cf6',
  'color-accent':         '#f59e0b',
  'color-background':     '#0f0f13',
  'color-surface':        '#1a1a24',
  'color-surface-raised': '#22222f',
  'color-border':         '#2e2e3f',
  'color-text':           '#f1f0fb',
  'color-text-muted':     '#9490b5',
  'color-text-inverse':   '#0f0f13',
  'color-success':        '#22c55e',
  'color-error':          '#ef4444',
  'color-warning':        '#f59e0b',
  'color-info':           '#3b82f6',
}

const DEFAULT_GAMIFICATION: Gamification = {
  xpPerLevel: 100,
  firstAttemptBonusMultiplier: 1.5,
  streakBonusXp: 10,
  streakBonusMaxXp: 50,
  streakMilestoneDays: [7, 14, 30],
}

// ─── Ícones das abas ──────────────────────────────────────────────────────────

function IconBuilding() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4" y="3" width="16" height="18" rx="1" />
      <path d="M9 21v-4h6v4" />
      <path d="M8 7h2M14 7h2M8 11h2M14 11h2" />
    </svg>
  )
}

function IconPalette() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22a9 9 0 1 0 0-18c-4.97 0-9 3.694-9 8.25 0 1.78 1.567 2.75 3.5 2.75H8a1.5 1.5 0 0 1 1.5 1.5v.75c0 1.5 1 2.75 2.5 2.75Z" />
      <circle cx="7.5" cy="10.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="7.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="16.5" cy="10.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

function IconZap() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  )
}

function IconBot() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 8V4" />
      <rect x="4" y="8" width="16" height="12" rx="2" />
      <circle cx="9" cy="13" r="1" fill="currentColor" stroke="none" />
      <circle cx="15" cy="13" r="1" fill="currentColor" stroke="none" />
      <path d="M9 17h6" />
      <circle cx="12" cy="3" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

function IconRefresh() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
      <path d="M3 21v-5h5" />
    </svg>
  )
}

function IconShield() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
    </svg>
  )
}

function IconPlug() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 2v6M15 2v6M7 8h10v3a5 5 0 0 1-10 0z" />
      <path d="M12 16v6" />
    </svg>
  )
}

const TABS: { id: TabId; label: string; icon: () => JSX.Element }[] = [
  { id: 'geral',        label: 'Geral',        icon: IconBuilding },
  { id: 'tema',         label: 'Tema visual',  icon: IconPalette },
  { id: 'gamificacao',  label: 'Gamificação',  icon: IconZap },
  { id: 'tutor-ia',     label: 'Tutor de IA',  icon: IconBot },
  { id: 'privacidade',  label: 'Privacidade',  icon: IconShield },
  { id: 'integracoes',  label: 'Integrações',  icon: IconPlug },
]

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

  const [activeTab, setActiveTab] = useState<TabId>('geral')

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

  // Tutor de IA — explicação de erro
  const [aiHelpEnabled, setAiHelpEnabled] = useState(true)
  const [savingAiHelp, setSavingAiHelp] = useState(false)
  const [aiHelpMsg, setAiHelpMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Privacidade — aluno pode ver perfil de outro aluno
  const [allowProfileView, setAllowProfileView] = useState(true)
  const [savingProfileView, setSavingProfileView] = useState(false)
  const [profileViewMsg, setProfileViewMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Integração Google Classroom
  const [googleStatus, setGoogleStatus] = useState<{ connected: boolean; googleEmail: string | null } | null>(null)
  const [googleBusy, setGoogleBusy] = useState(false)
  const [courses, setCourses] = useState<GoogleCourse[] | null>(null)
  const [importingId, setImportingId] = useState<string | null>(null)
  const [googleMsg, setGoogleMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const load = useCallback(async () => {
    if (!slug) return
    setLoadError(null)
    try {
      const res = await api.get<{ data: { settings: TenantSettings } }>(`/api/${slug}/settings`)
      const s = res.data.settings
      setSettings(s)
      // Mescla com os padrões da plataforma: o backend só retorna as cores
      // que a escola já customizou, então campos não-customizados devem
      // exibir o valor padrão real (não ficar vazios/pretos no picker).
      setThemeValues({ ...DEFAULT_THEME, ...(s.theme ?? {}) })
      const g = s.gamification ?? DEFAULT_GAMIFICATION
      setGamif({
        xpPerLevel: g.xpPerLevel,
        firstAttemptBonusMultiplier: g.firstAttemptBonusMultiplier,
        streakBonusXp: g.streakBonusXp,
        streakBonusMaxXp: g.streakBonusMaxXp,
      })
      setMilestonesRaw(g.streakMilestoneDays.join(', '))
      setAiHelpEnabled(s.aiErrorExplanationEnabled)
      setAllowProfileView(s.allowStudentProfileView)
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

  useEffect(() => {
    if (!aiHelpMsg) return
    const t = setTimeout(() => setAiHelpMsg(null), 3500)
    return () => clearTimeout(t)
  }, [aiHelpMsg])

  useEffect(() => {
    if (!profileViewMsg) return
    const t = setTimeout(() => setProfileViewMsg(null), 3500)
    return () => clearTimeout(t)
  }, [profileViewMsg])

  // Status da integração Google
  const loadGoogleStatus = useCallback(async () => {
    if (!slug) return
    try {
      const res = await api.get<{ data: { connected: boolean; googleEmail: string | null } }>(
        `/api/${slug}/integrations/google/status`,
      )
      setGoogleStatus(res.data)
    } catch {
      // silencioso — a aba mostra "não conectado" se falhar
    }
  }, [slug])

  useEffect(() => { loadGoogleStatus() }, [loadGoogleStatus])

  // Volta do consentimento Google: ?google=connected|error → mostra aviso e limpa a URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const g = params.get('google')
    if (!g) return
    if (g === 'connected') {
      setGoogleMsg({ type: 'success', text: 'Google Classroom conectado com sucesso!' })
      setActiveTab('integracoes')
      loadGoogleStatus()
    } else if (g === 'error') {
      setGoogleMsg({ type: 'error', text: 'Não foi possível conectar ao Google. Tente novamente.' })
      setActiveTab('integracoes')
    }
    params.delete('google')
    const qs = params.toString()
    window.history.replaceState({}, '', window.location.pathname + (qs ? `?${qs}` : ''))
  }, [loadGoogleStatus])

  function setColor(key: string, value: string) {
    setThemeValues((prev) => ({ ...prev, [key]: value }))
  }

  function handleResetTheme() {
    setThemeValues({ ...DEFAULT_THEME })
    setThemeMsg(null)
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

  async function handleSaveAiHelp() {
    if (!slug) return
    setSavingAiHelp(true)
    setAiHelpMsg(null)
    try {
      await api.patch(`/api/${slug}/settings`, { aiErrorExplanationEnabled: aiHelpEnabled })
      setAiHelpMsg({ type: 'success', text: 'Configuração do tutor de IA salva com sucesso.' })
    } catch (err) {
      setAiHelpMsg({
        type: 'error',
        text: err instanceof ApiError ? err.message : 'Erro ao salvar configuração do tutor de IA.',
      })
    } finally {
      setSavingAiHelp(false)
    }
  }

  async function handleSaveProfileView() {
    if (!slug) return
    setSavingProfileView(true)
    setProfileViewMsg(null)
    try {
      await api.patch(`/api/${slug}/settings`, { allowStudentProfileView: allowProfileView })
      setProfileViewMsg({ type: 'success', text: 'Configuração de privacidade salva com sucesso.' })
    } catch (err) {
      setProfileViewMsg({
        type: 'error',
        text: err instanceof ApiError ? err.message : 'Erro ao salvar configuração de privacidade.',
      })
    } finally {
      setSavingProfileView(false)
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

  async function handleConnectGoogle() {
    if (!slug) return
    setGoogleBusy(true)
    try {
      const res = await api.get<{ data: { url: string } }>(`/api/${slug}/integrations/google/auth-url`)
      window.location.href = res.data.url
    } catch (err) {
      setGoogleMsg({ type: 'error', text: err instanceof ApiError ? err.message : 'Erro ao iniciar a conexão.' })
      setGoogleBusy(false)
    }
  }

  async function handleDisconnectGoogle() {
    if (!slug) return
    setGoogleBusy(true)
    try {
      await api.delete(`/api/${slug}/integrations/google`)
      setGoogleStatus({ connected: false, googleEmail: null })
      setCourses(null)
      setGoogleMsg({ type: 'success', text: 'Google desconectado.' })
    } catch (err) {
      setGoogleMsg({ type: 'error', text: err instanceof ApiError ? err.message : 'Erro ao desconectar.' })
    } finally {
      setGoogleBusy(false)
    }
  }

  async function handleListCourses() {
    if (!slug) return
    setGoogleBusy(true)
    try {
      const res = await api.get<{ data: GoogleCourse[] }>(`/api/${slug}/integrations/google/courses`)
      setCourses(res.data)
    } catch (err) {
      setGoogleMsg({ type: 'error', text: err instanceof ApiError ? err.message : 'Erro ao listar cursos.' })
    } finally {
      setGoogleBusy(false)
    }
  }

  async function handleImportCourse(course: GoogleCourse) {
    if (!slug) return
    setImportingId(course.id)
    try {
      const res = await api.post<{ data: { className: string; total: number; created: number; reused: number } }>(
        `/api/${slug}/integrations/google/import`,
        { courseId: course.id, courseName: course.name },
      )
      const r = res.data
      setGoogleMsg({ type: 'success', text: `Turma "${r.className}" criada — ${r.total} aluno(s): ${r.created} novo(s), ${r.reused} reaproveitado(s).` })
    } catch (err) {
      setGoogleMsg({ type: 'error', text: err instanceof ApiError ? err.message : 'Erro ao importar o curso.' })
    } finally {
      setImportingId(null)
    }
  }

  return (
    <div className={styles.root}>
      {/* ── Header ── */}
      <header className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Configurações</h1>
          <p className={styles.pageSubtitle}>{settings.name}</p>
        </div>
      </header>

      {/* ── Abas ── */}
      <div className={styles.tabsCard}>
        <div className={styles.tabBar} role="tablist" aria-label="Seções de configuração">
          {TABS.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                role="tab"
                aria-selected={isActive}
                aria-controls="settings-tabpanel"
                className={`${styles.tab} ${isActive ? styles.tabActive : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon />
                {tab.label}
              </button>
            )
          })}
        </div>

        <div id="settings-tabpanel" role="tabpanel" aria-labelledby={`tab-${activeTab}`} className={styles.tabPanel}>
          {/* ── Geral ── */}
          {activeTab === 'geral' && (
            <>
              <p className={styles.sectionDesc}>Dados da sua escola, conforme contratado com a plataforma.</p>

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
            </>
          )}

          {/* ── Tema visual ── */}
          {activeTab === 'tema' && (
            <>
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
                <button className={styles.btnSecondary} onClick={handleResetTheme} disabled={savingTheme}>
                  <IconRefresh />
                  Restaurar padrão
                </button>
                <button className={styles.btnPrimary} onClick={handleSaveTheme} disabled={savingTheme}>
                  {savingTheme ? 'Salvando...' : 'Salvar tema'}
                </button>
              </div>
            </>
          )}

          {/* ── Gamificação ── */}
          {activeTab === 'gamificacao' && (
            <>
              <p className={styles.sectionDesc}>Ajuste as regras de XP e streaks para a sua escola.</p>

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
            </>
          )}

          {/* ── Tutor de IA ── */}
          {activeTab === 'tutor-ia' && (
            <>
              <p className={styles.sectionDesc}>
                Controle se o Codi pode usar o contexto de um teste que falhou para explicar o erro ao aluno.
              </p>

              <div className={styles.toggleRow}>
                <div>
                  <span className={styles.label}>Tutor explica o erro</span>
                  <p className={styles.fieldHint}>
                    Quando ativado, o botão "Pedir ajuda ao Codi" aparece nos testes que falharem,
                    e o Codi recebe o teste como contexto para explicar o que deu errado.
                  </p>
                </div>
                <label className={styles.switch}>
                  <input
                    type="checkbox"
                    className={styles.switchInput}
                    checked={aiHelpEnabled}
                    onChange={(e) => setAiHelpEnabled(e.target.checked)}
                    aria-label="Ativar explicação de erro pelo tutor de IA"
                  />
                  <span className={styles.switchTrack}>
                    <span className={styles.switchThumb} />
                  </span>
                </label>
              </div>

              {aiHelpMsg && (
                <p className={aiHelpMsg.type === 'success' ? styles.feedbackSuccess : styles.feedbackError}>
                  {aiHelpMsg.text}
                </p>
              )}

              <div className={styles.sectionFooter}>
                <button className={styles.btnPrimary} onClick={handleSaveAiHelp} disabled={savingAiHelp}>
                  {savingAiHelp ? 'Salvando...' : 'Salvar tutor de IA'}
                </button>
              </div>
            </>
          )}

          {/* ── Privacidade ── */}
          {activeTab === 'privacidade' && (
            <>
              <p className={styles.sectionDesc}>
                Controle se alunos podem ver o perfil de outros colegas de turma (ranking e listagem).
              </p>

              <div className={styles.toggleRow}>
                <div>
                  <span className={styles.label}>Permitir aluno ver perfil de colega</span>
                  <p className={styles.fieldHint}>
                    Quando ativado, o aluno pode abrir o perfil de um colega de turma a partir do
                    ranking, vendo nome, idade, conquistas e estatísticas (sem e-mail ou data de
                    nascimento). O gestor sempre pode ver o perfil completo de qualquer aluno.
                  </p>
                </div>
                <label className={styles.switch}>
                  <input
                    type="checkbox"
                    className={styles.switchInput}
                    checked={allowProfileView}
                    onChange={(e) => setAllowProfileView(e.target.checked)}
                    aria-label="Permitir que alunos vejam o perfil de colegas de turma"
                  />
                  <span className={styles.switchTrack}>
                    <span className={styles.switchThumb} />
                  </span>
                </label>
              </div>

              {profileViewMsg && (
                <p className={profileViewMsg.type === 'success' ? styles.feedbackSuccess : styles.feedbackError}>
                  {profileViewMsg.text}
                </p>
              )}

              <div className={styles.sectionFooter}>
                <button className={styles.btnPrimary} onClick={handleSaveProfileView} disabled={savingProfileView}>
                  {savingProfileView ? 'Salvando...' : 'Salvar privacidade'}
                </button>
              </div>
            </>
          )}

          {/* ── Integrações ── */}
          {activeTab === 'integracoes' && (
            <>
              <p className={styles.sectionDesc}>
                Conecte o Google Classroom para importar turmas e alunos. Cada curso importado vira uma
                turma no Codinhos, com os alunos correspondentes.
              </p>

              {googleMsg && (
                <p className={googleMsg.type === 'success' ? styles.feedbackSuccess : styles.feedbackError}>
                  {googleMsg.text}
                </p>
              )}

              {!googleStatus?.connected ? (
                <div className={styles.sectionFooter}>
                  <button className={styles.btnPrimary} onClick={handleConnectGoogle} disabled={googleBusy}>
                    {googleBusy ? 'Redirecionando...' : 'Conectar Google'}
                  </button>
                </div>
              ) : (
                <>
                  <div className={styles.infoGrid}>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Conta conectada</span>
                      <span className={styles.infoValue}>{googleStatus.googleEmail ?? '—'}</span>
                    </div>
                  </div>

                  <div className={styles.sectionFooter}>
                    <button className={styles.btnSecondary} onClick={handleListCourses} disabled={googleBusy}>
                      {googleBusy ? 'Carregando...' : 'Listar cursos'}
                    </button>
                    <button className={styles.btnDanger} onClick={handleDisconnectGoogle} disabled={googleBusy}>
                      Desconectar
                    </button>
                  </div>

                  {courses && (
                    courses.length === 0 ? (
                      <p className={styles.fieldHint}>Nenhum curso encontrado nesta conta do Google Classroom.</p>
                    ) : (
                      <div className={styles.courseList}>
                        {courses.map((c) => (
                          <div key={c.id} className={styles.courseRow}>
                            <div className={styles.courseInfo}>
                              <span className={styles.courseName}>{c.name}</span>
                              {c.section && <span className={styles.courseSection}>{c.section}</span>}
                            </div>
                            <button
                              className={styles.btnPrimary}
                              onClick={() => handleImportCourse(c)}
                              disabled={importingId !== null}
                            >
                              {importingId === c.id ? 'Importando...' : 'Importar turma'}
                            </button>
                          </div>
                        ))}
                      </div>
                    )
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
