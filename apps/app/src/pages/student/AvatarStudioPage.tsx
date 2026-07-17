import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import type { AvatarConfig, AvatarCategory, AvatarCategoryKey } from '@codinhos/types'
import { api, ApiError } from '../../lib/api.ts'
import { useAuth } from '../../contexts/AuthContext.tsx'
import { avatarDataUri } from '../../lib/avatar.ts'
import styles from './AvatarStudioPage.module.css'

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface StudioData {
  config: AvatarConfig
  level: number
  categories: AvatarCategory[]
}

// ─── Ícones ───────────────────────────────────────────────────────────────────

function IconLock() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}

function IconCheck() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function IconDice() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <circle cx="8.5" cy="8.5" r="1.2" fill="currentColor" />
      <circle cx="15.5" cy="15.5" r="1.2" fill="currentColor" />
      <circle cx="15.5" cy="8.5" r="1.2" fill="currentColor" />
      <circle cx="8.5" cy="15.5" r="1.2" fill="currentColor" />
    </svg>
  )
}

// ─── Página ───────────────────────────────────────────────────────────────────

export function AvatarStudioPage() {
  const { slug } = useParams<{ slug: string }>()
  const { user, setUser } = useAuth()

  const [data, setData] = useState<StudioData | null>(null)
  const [config, setConfig] = useState<AvatarConfig | null>(null)
  const [activeCat, setActiveCat] = useState<AvatarCategoryKey>('skinColor')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    let alive = true
    api
      .get<{ data: StudioData }>(`/api/${slug}/me/avatar`)
      .then(({ data: d }) => {
        if (!alive) return
        setData(d)
        setConfig(d.config)
      })
      .catch((err) => {
        if (!alive) return
        setError(err instanceof ApiError ? err.message : 'Erro ao carregar o avatar.')
      })
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [slug])

  const activeCategory = useMemo(
    () => data?.categories.find((c) => c.key === activeCat) ?? null,
    [data, activeCat],
  )

  const dirty = useMemo(() => {
    if (!data || !config) return false
    return (Object.keys(config) as AvatarCategoryKey[]).some((k) => config[k] !== data.config[k])
  }, [data, config])

  const previewSrc = useMemo(() => (config ? avatarDataUri(config, 320) : null), [config])

  function choose(catKey: AvatarCategoryKey, value: string) {
    setConfig((prev) => (prev ? { ...prev, [catKey]: value } : prev))
    setSaved(false)
  }

  function randomize() {
    if (!data) return
    const next = { ...(config as AvatarConfig) }
    for (const cat of data.categories) {
      const unlocked = cat.options.filter((o) => o.unlocked)
      const pick = unlocked[Math.floor(Math.random() * unlocked.length)]
      if (pick) next[cat.key] = pick.value
    }
    setConfig(next)
    setSaved(false)
  }

  async function save() {
    if (!config || !dirty) return
    setSaving(true)
    setError(null)
    try {
      const { data: res } = await api.put<{ data: { config: AvatarConfig } }>(
        `/api/${slug}/me/avatar`,
        config,
      )
      setData((d) => (d ? { ...d, config: res.config } : d))
      setConfig(res.config)
      if (user) setUser({ ...user, avatarConfig: res.config })
      setSaved(true)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível salvar.')
    } finally {
      setSaving(false)
    }
  }

  function reset() {
    if (data) {
      setConfig(data.config)
      setSaved(false)
    }
  }

  if (loading) {
    return <div className={styles.state}>Carregando estúdio…</div>
  }
  if (error && !data) {
    return <div className={styles.state}>{error}</div>
  }
  if (!data || !config) return null

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <h1 className={styles.title}>Meu Avatar</h1>
        <p className={styles.subtitle}>
          // monte seu personagem — suba de nível para desbloquear mais itens
        </p>
      </header>

      <div className={styles.layout}>
        {/* ── Preview ── */}
        <aside className={styles.previewCol}>
          <div className={styles.previewCard}>
            <div className={styles.previewAvatarWrap}>
              {previewSrc && (
                <img className={styles.previewAvatar} src={previewSrc} alt="Prévia do avatar" draggable={false} />
              )}
              <span className={styles.levelChip}>Nv {data.level}</span>
            </div>

            <button className={styles.randomBtn} onClick={randomize} type="button">
              <IconDice /> Surpreenda-me
            </button>

            <div className={styles.actions}>
              <button
                className={styles.saveBtn}
                onClick={save}
                disabled={!dirty || saving}
                type="button"
              >
                {saving ? 'Salvando…' : saved && !dirty ? 'Salvo!' : 'Salvar'}
              </button>
              <button
                className={styles.resetBtn}
                onClick={reset}
                disabled={!dirty || saving}
                type="button"
              >
                Desfazer
              </button>
            </div>

            {error && <p className={styles.errorMsg}>{error}</p>}
            {saved && !dirty && <p className={styles.savedMsg}>Avatar atualizado ✨</p>}
          </div>
        </aside>

        {/* ── Customização ── */}
        <section className={styles.editorCol}>
          <nav className={styles.tabs} aria-label="Categorias">
            {data.categories.map((cat) => (
              <button
                key={cat.key}
                type="button"
                className={cat.key === activeCat ? `${styles.tab} ${styles.tabActive}` : styles.tab}
                onClick={() => setActiveCat(cat.key)}
              >
                {cat.label}
              </button>
            ))}
          </nav>

          {activeCategory && (
            <div className={styles.options}>
              {activeCategory.options.map((opt) => {
                const selected = config[activeCategory.key] === opt.value
                const locked = !opt.unlocked
                const cls = [
                  styles.option,
                  selected ? styles.optionSelected : '',
                  locked ? styles.optionLocked : '',
                ].join(' ')

                return (
                  <button
                    key={opt.value}
                    type="button"
                    className={cls}
                    onClick={() => !locked && choose(activeCategory.key, opt.value)}
                    disabled={locked}
                    title={locked ? `Desbloqueia no nível ${opt.requiredLevel}` : opt.label}
                    aria-pressed={selected}
                  >
                    {activeCategory.kind === 'color' ? (
                      <span
                        className={styles.swatch}
                        style={{ background: `#${opt.swatch ?? 'cccccc'}` }}
                      />
                    ) : (
                      <img
                        className={styles.optionPreview}
                        src={avatarDataUri({ ...config, [activeCategory.key]: opt.value }, 96)}
                        alt={opt.label}
                        draggable={false}
                      />
                    )}

                    {selected && !locked && (
                      <span className={styles.selectedBadge}>
                        <IconCheck />
                      </span>
                    )}
                    {locked && (
                      <span className={styles.lockBadge}>
                        <IconLock /> {opt.requiredLevel}
                      </span>
                    )}
                    <span className={styles.optionLabel}>{opt.label}</span>
                  </button>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

export default AvatarStudioPage
