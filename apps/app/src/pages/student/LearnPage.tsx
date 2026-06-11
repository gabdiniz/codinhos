import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api, ApiError } from '../../lib/api.ts'
import styles from './LearnPage.module.css'

// ─── Tipos ────────────────────────────────────────────────────────────────────

type ModuleStatus = 'locked' | 'available' | 'completed'
type Difficulty   = 'easy' | 'medium' | 'hard'

interface Module {
  id: string
  title: string
  order: number
  status: ModuleStatus
  challenge: { id: string; title: string; difficulty: Difficulty } | null
}

interface TrailDetail {
  trail: { id: string; title: string; description: string | null }
  visualBlocksEnabled: boolean
  modules: Module[]
}

// ─── Labels ───────────────────────────────────────────────────────────────────

const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  easy:   'fácil',
  medium: 'médio',
  hard:   'difícil',
}

const STATUS_LABEL: Record<ModuleStatus, string> = {
  locked:    'bloqueado',
  available: 'disponível',
  completed: 'concluído',
}

// ─── Ícones inline ────────────────────────────────────────────────────────────

function IconLock() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}

function IconCheck() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function IconPlay() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  )
}

function IconArrow() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  )
}

function IconChevronLeft() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function LearnPage() {
  const { slug, trailId } = useParams<{ slug: string; trailId: string }>()

  const [data, setData] = useState<TrailDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!slug || !trailId) return
    api
      .get<{ data: TrailDetail }>(`/api/${slug}/learn/trails/${trailId}`)
      .then((res) => setData(res.data))
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Erro ao carregar trilha.'))
      .finally(() => setLoading(false))
  }, [slug, trailId])

  if (loading) {
    return (
      <div className={styles.state}>
        <span className={styles.stateText}>// carregando trilha...</span>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className={styles.state}>
        <span className={styles.stateError}>{error ?? 'Erro desconhecido.'}</span>
      </div>
    )
  }

  const { trail, modules } = data
  const completedCount = modules.filter((m) => m.status === 'completed').length
  const pct = modules.length > 0 ? Math.round((completedCount / modules.length) * 100) : 0

  return (
    <div className={styles.root}>

      {/* ── Voltar ── */}
      <Link to={`/${slug}/learn`} className={styles.backLink}>
        <IconChevronLeft />
        Trilhas
      </Link>

      {/* ── Header ── */}
      <header className={styles.header}>
        <div className={styles.headerMain}>
          <h1 className={styles.title}>{trail.title}</h1>
          {trail.description && (
            <p className={styles.description}>{trail.description}</p>
          )}
        </div>

        <div className={styles.progressBox}>
          <div className={styles.progressTop}>
            <span className={styles.progressLabel}>progresso</span>
            <span className={styles.progressPct}>{pct}%</span>
          </div>
          <div className={styles.progressTrack}>
            <div className={styles.progressFill} style={{ width: `${pct}%` }} />
          </div>
          <span className={styles.progressCount}>{completedCount}/{modules.length} módulos</span>
        </div>
      </header>

      {/* ── Módulos ── */}
      {modules.length === 0 ? (
        <p className={styles.empty}>// nenhum módulo nesta trilha ainda.</p>
      ) : (
        <ol className={styles.moduleList}>
          {modules.map((mod, i) => (
            <ModuleRow
              key={mod.id}
              module={mod}
              index={i}
              slug={slug!}
              trailId={trailId!}
              isLast={i === modules.length - 1}
            />
          ))}
        </ol>
      )}
    </div>
  )
}

// ─── ModuleRow ────────────────────────────────────────────────────────────────

function ModuleRow({
  module: mod,
  index,
  slug,
  trailId,
  isLast,
}: {
  module: Module
  index: number
  slug: string
  trailId: string
  isLast: boolean
}) {
  const isLocked    = mod.status === 'locked'
  const isCompleted = mod.status === 'completed'
  const isAvailable = mod.status === 'available'

  const statusIcon = isCompleted
    ? <IconCheck />
    : isLocked
    ? <IconLock />
    : <IconPlay />

  const cardContent = (
    <div className={`${styles.moduleCard} ${styles[`card_${mod.status}`]}`}>
      {/* Timeline */}
      <div className={styles.timeline}>
        <div className={`${styles.dot} ${styles[`dot_${mod.status}`]}`}>
          {statusIcon}
        </div>
        {!isLast && (
          <div className={`${styles.connector} ${isCompleted ? styles.connectorDone : ''}`} />
        )}
      </div>

      {/* Conteúdo */}
      <div className={styles.moduleContent}>
        <div className={styles.moduleTop}>
          <span className={styles.moduleOrder}>módulo {String(index + 1).padStart(2, '0')}</span>
          <span className={`${styles.statusBadge} ${styles[`badge_${mod.status}`]}`}>
            // {STATUS_LABEL[mod.status]}
          </span>
        </div>

        <h2 className={styles.moduleTitle}>{mod.title}</h2>

        {mod.challenge && (
          <div className={styles.challengeRow}>
            <span className={styles.challengeLabel}>desafio:</span>
            <span className={styles.challengeTitle}>{mod.challenge.title}</span>
            <span className={`${styles.diffBadge} ${styles[`diff_${mod.challenge.difficulty}`]}`}>
              {DIFFICULTY_LABEL[mod.challenge.difficulty]}
            </span>
          </div>
        )}
      </div>

      {isAvailable && (
        <span className={styles.cardArrow}>
          <IconArrow />
        </span>
      )}
    </div>
  )

  if (isLocked) {
    return <li className={styles.moduleItem}>{cardContent}</li>
  }

  return (
    <li className={styles.moduleItem}>
      <Link to={`/${slug}/learn/${trailId}/module/${mod.id}`} className={styles.moduleLink}>
        {cardContent}
      </Link>
    </li>
  )
}
