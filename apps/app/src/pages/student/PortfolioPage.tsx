import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api, ApiError } from '../../lib/api.ts'
import styles from './PortfolioPage.module.css'

interface CompletedTrail { id: string; title: string; completedAt: string | null }
interface InProgressTrail { id: string; title: string; progress: { completed: number; total: number } }
interface Badge { slug: string; name: string; earnedAt: string }

interface Portfolio {
  stats: { totalXp: number; level: number; currentStreak: number }
  completedTrails: CompletedTrail[]
  inProgressTrails: InProgressTrail[]
  badges: Badge[]
}

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3333'

function IconAward() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="8" r="6" />
      <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
    </svg>
  )
}

export default function PortfolioPage() {
  const { slug } = useParams<{ slug: string }>()
  const [data, setData] = useState<Portfolio | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [downloading, setDownloading] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  useEffect(() => {
    if (!slug) return
    let active = true
    api
      .get<{ data: Portfolio }>(`/api/${slug}/portfolio`)
      .then((res) => { if (active) setData(res.data) })
      .catch((err) => {
        if (active) setLoadError(err instanceof ApiError ? err.message : 'Erro ao carregar.')
      })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [slug])

  async function downloadCertificate(trailId: string, title: string) {
    if (!slug) return
    setDownloading(trailId)
    setActionError(null)
    try {
      const res = await fetch(`${API_BASE}/api/${slug}/portfolio/certificates/${trailId}`, {
        credentials: 'include',
      })
      if (!res.ok) throw new Error('falha')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `certificado-${title.toLowerCase().replace(/\s+/g, '-')}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch {
      setActionError('Não foi possível gerar o certificado. Tente novamente.')
    } finally {
      setDownloading(null)
    }
  }

  if (loading) {
    return <div className={styles.state}><span className={styles.stateText}>// carregando portfólio...</span></div>
  }
  if (loadError || !data) {
    return <div className={styles.state}><span className={styles.stateError}>{loadError ?? 'Erro.'}</span></div>
  }

  return (
    <div className={styles.root}>
      <header className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Meu portfólio</h1>
        <div className={styles.headerStats}>
          <span className={styles.level}>Nível {data.stats.level}</span>
          <span className={styles.xp}>{data.stats.totalXp} XP</span>
          <span className={styles.streak}>🔥 {data.stats.currentStreak}</span>
        </div>
      </header>

      {actionError && <p className={styles.formError}>{actionError}</p>}

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Trilhas concluídas ({data.completedTrails.length})</h2>
        {data.completedTrails.length === 0 ? (
          <p className={styles.muted}>Conclua uma trilha para ganhar seu primeiro certificado. 🎓</p>
        ) : (
          <div className={styles.trailList}>
            {data.completedTrails.map((t) => (
              <div key={t.id} className={styles.certCard}>
                <div className={styles.certIcon}><IconAward /></div>
                <div className={styles.certInfo}>
                  <span className={styles.certTitle}>{t.title}</span>
                  <span className={styles.certMeta}>Trilha concluída</span>
                </div>
                <button
                  className={styles.btnDownload}
                  onClick={() => downloadCertificate(t.id, t.title)}
                  disabled={downloading === t.id}
                >
                  {downloading === t.id ? 'Gerando...' : 'Baixar certificado'}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {data.inProgressTrails.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Em andamento</h2>
          <div className={styles.trailList}>
            {data.inProgressTrails.map((t) => {
              const pct = t.progress.total > 0 ? Math.round((t.progress.completed / t.progress.total) * 100) : 0
              return (
                <div key={t.id} className={styles.progressCard}>
                  <div className={styles.progressHead}>
                    <span className={styles.certTitle}>{t.title}</span>
                    <span className={styles.certMeta}>{t.progress.completed}/{t.progress.total}</span>
                  </div>
                  <div className={styles.progressTrack}>
                    <div className={styles.progressFill} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Badges ({data.badges.length})</h2>
        {data.badges.length === 0 ? (
          <p className={styles.muted}>Nenhuma badge conquistada ainda.</p>
        ) : (
          <div className={styles.badgeGrid}>
            {data.badges.map((b) => (
              <div key={b.slug} className={styles.badge} title={b.name}>
                <span className={styles.badgeIcon}>🏅</span>
                <span className={styles.badgeName}>{b.name}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
