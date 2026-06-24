import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api, ApiError } from '../../lib/api.ts'
import styles from './StudentDetailPage.module.css'

interface StudentDetail {
  student: { id: string; name: string; avatarUrl: string | null }
  stats: { totalXp: number; level: number; currentStreak: number }
  badges: { slug: string; name: string; earnedAt: string }[]
  trails: {
    id: string
    title: string
    progress: { completed: number; total: number }
    lastActivity: string | null
  }[]
}

function IconArrowLeft() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
    </svg>
  )
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export default function StudentDetailPage() {
  const { slug, studentId } = useParams<{ slug: string; studentId: string }>()
  const navigate = useNavigate()
  const [data, setData] = useState<StudentDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!slug || !studentId) return
    setLoadError(null)
    try {
      const res = await api.get<{ data: StudentDetail }>(
        `/api/${slug}/dashboard/students/${studentId}`,
      )
      setData(res.data)
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : 'Erro ao carregar aluno.')
    } finally {
      setLoading(false)
    }
  }, [slug, studentId])

  useEffect(() => { load() }, [load])

  if (loading) {
    return <div className={styles.state}><span className={styles.stateText}>// carregando aluno...</span></div>
  }
  if (loadError || !data) {
    return <div className={styles.state}><span className={styles.stateError}>{loadError ?? 'Aluno não encontrado.'}</span></div>
  }

  const { student, stats, badges, trails } = data

  return (
    <div className={styles.root}>
      <button className={styles.backLink} onClick={() => navigate(-1)}>
        <IconArrowLeft /> Voltar
      </button>

      <header className={styles.pageHeader}>
        <div className={styles.avatar}>{initials(student.name)}</div>
        <div>
          <h1 className={styles.pageTitle}>{student.name}</h1>
          <div className={styles.headerStats}>
            <span><strong className={styles.level}>Nível {stats.level}</strong></span>
            <span className={styles.xp}>{stats.totalXp} XP</span>
            <span className={styles.streak}>🔥 {stats.currentStreak}</span>
          </div>
        </div>
      </header>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Progresso por trilha</h2>
        {trails.length === 0 ? (
          <p className={styles.muted}>Nenhuma trilha atribuída.</p>
        ) : (
          <div className={styles.trailList}>
            {trails.map((t) => {
              const pct = t.progress.total > 0 ? Math.round((t.progress.completed / t.progress.total) * 100) : 0
              return (
                <div key={t.id} className={styles.trailRow}>
                  <div className={styles.trailHeader}>
                    <span className={styles.trailTitle}>{t.title}</span>
                    <span className={styles.trailCount}>{t.progress.completed}/{t.progress.total}</span>
                  </div>
                  <div className={styles.progressTrack}>
                    <div className={styles.progressFill} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Badges ({badges.length})</h2>
        {badges.length === 0 ? (
          <p className={styles.muted}>Nenhuma badge conquistada ainda.</p>
        ) : (
          <div className={styles.badgeGrid}>
            {badges.map((b) => (
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
