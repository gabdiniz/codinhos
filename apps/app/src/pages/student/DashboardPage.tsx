import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api, ApiError } from '../../lib/api.ts'
import { useClass } from '../../contexts/ClassContext.tsx'
import styles from './DashboardPage.module.css'

// ─── Tipos ────────────────────────────────────────────────────────────────────

type TrailStatus = 'not_started' | 'in_progress' | 'completed'

interface Trail {
  id: string
  title: string
  progress: { completed: number; total: number }
  status: TrailStatus
}

interface DashboardData {
  data: {
    class: { id: string; name: string }
    trails: Trail[]
    stats: { xp: number; level: number; streak: number }
  }
}

// ─── Labels de status ─────────────────────────────────────────────────────────

const STATUS_LABEL: Record<TrailStatus, string> = {
  not_started: 'não iniciada',
  in_progress: 'em progresso',
  completed:   'concluída',
}

// ─── Ícones inline ────────────────────────────────────────────────────────────

function IconFlame() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
    </svg>
  )
}

function IconStar() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none"
      aria-hidden="true">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  )
}

function IconShield() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  )
}

function IconArrow() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="5" y1="12" x2="19" y2="12"/>
      <polyline points="12 5 19 12 12 19"/>
    </svg>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function DashboardPage() {
  const { slug } = useParams<{ slug: string }>()
  const { setCurrentClass } = useClass()
  const [data, setData] = useState<DashboardData['data'] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!slug) return
    api
      .get<DashboardData>(`/api/${slug}/learn`)
      .then((res) => {
        setData(res.data)
        setCurrentClass(res.data.class)
      })
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : 'Erro ao carregar trilhas.')
      })
      .finally(() => setLoading(false))
  }, [slug, setCurrentClass])

  if (loading) {
    return (
      <div className={styles.state}>
        <span className={styles.stateText}>// carregando trilhas...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.state}>
        <span className={styles.stateError}>{error}</span>
      </div>
    )
  }

  if (!data) return null

  const { trails, stats, class: cls } = data

  return (
    <div className={styles.root}>

      {/* ── Header ── */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.headerTitle}>
            <p className={styles.className}>// {cls.name}</p>
            <h1 className={styles.title}>Trilhas</h1>
          </div>

          <div className={styles.hud}>
            <HudChip icon={<IconStar />} label="XP" value={stats.xp.toLocaleString('pt-BR')} colorVar="--color-xp" />
            <HudChip icon={<IconShield />} label="Nível" value={String(stats.level)} colorVar="--color-level" />
            <HudChip icon={<IconFlame />} label="Streak" value={`${stats.streak}d`} colorVar="--color-accent" />
          </div>
        </div>
      </header>

      {/* ── Trilhas ── */}
      {trails.length === 0 ? (
        <p className={styles.empty}>
          // nenhuma trilha atribuída à sua turma ainda.
        </p>
      ) : (
        <ul className={styles.grid}>
          {trails.map((trail, i) => (
            <TrailCard key={trail.id} trail={trail} slug={slug!} index={i} />
          ))}
        </ul>
      )}
    </div>
  )
}

// ─── HudChip ─────────────────────────────────────────────────────────────────

function HudChip({
  icon,
  label,
  value,
  colorVar,
}: {
  icon: React.ReactNode
  label: string
  value: string
  colorVar: string
}) {
  return (
    <div
      className={styles.hudChip}
      style={{ '--chip-color': `var(${colorVar})` } as React.CSSProperties}
    >
      <span className={styles.hudIcon}>{icon}</span>
      <div className={styles.hudText}>
        <span className={styles.hudLabel}>{label}</span>
        <span className={styles.hudValue}>{value}</span>
      </div>
    </div>
  )
}

// ─── TrailCard ────────────────────────────────────────────────────────────────

function TrailCard({ trail, slug, index }: { trail: Trail; slug: string; index: number }) {
  const pct =
    trail.progress.total > 0
      ? Math.round((trail.progress.completed / trail.progress.total) * 100)
      : 0

  return (
    <li
      className={`${styles.card} ${styles[`card_${trail.status}`]}`}
      style={{ '--delay': `${index * 70}ms` } as React.CSSProperties}
    >
      <Link to={`/${slug}/learn/${trail.id}`} className={styles.cardLink}>
        <div className={styles.cardTop}>
          <span className={`${styles.badge} ${styles[`badge_${trail.status}`]}`}>
            // {STATUS_LABEL[trail.status]}
          </span>
          <span className={styles.cardArrow}>
            <IconArrow />
          </span>
        </div>

        <h2 className={styles.trailTitle}>{trail.title}</h2>

        <div className={styles.progressArea}>
          <div className={styles.progressTrack}>
            <div
              className={`${styles.progressFill} ${styles[`fill_${trail.status}`]}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className={styles.progressMeta}>
            <span className={styles.progressLabel}>
              {trail.progress.completed}/{trail.progress.total} módulos
            </span>
            <span className={styles.progressPct}>{pct}%</span>
          </div>
        </div>
      </Link>
    </li>
  )
}
