import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api, ApiError } from '../../lib/api.ts'
import { useAuth } from '../../contexts/AuthContext.tsx'
import { useClass } from '../../contexts/ClassContext.tsx'
import styles from './RankingPage.module.css'

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface RankingEntry {
  position: number
  student: { id: string; name: string; avatarUrl: string | null }
  totalXp: number
  level: number
}

interface RankingData {
  ranking: RankingEntry[]
  myPosition: number | null
}

// ─── Ícones inline ────────────────────────────────────────────────────────────

function IconStar() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

const MEDAL: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' }

// ─── Componente principal ─────────────────────────────────────────────────────

export default function RankingPage() {
  const { slug } = useParams<{ slug: string }>()
  const { user } = useAuth()
  const { currentClass, setCurrentClass } = useClass()

  const [data, setData] = useState<RankingData | null>(null)
  const [className, setClassName] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!slug) return

    async function load() {
      // Resolve classId: usa contexto se disponível, caso contrário busca via /learn
      let classId = currentClass?.id ?? null
      let resolvedClassName = currentClass?.name ?? ''

      if (!classId) {
        const learnRes = await api.get<{ data: { class: { id: string; name: string } } }>(`/api/${slug}/learn`)
        classId = learnRes.data.class.id
        resolvedClassName = learnRes.data.class.name
        setCurrentClass({ id: classId, name: resolvedClassName })
      }

      setClassName(resolvedClassName)

      const rankRes = await api.get<{ data: RankingData }>(`/api/${slug}/gamification/ranking/${classId}`)
      setData(rankRes.data)
    }

    load()
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : 'Erro ao carregar ranking.')
      })
      .finally(() => setLoading(false))
  }, [slug]) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className={styles.state}>
        <span className={styles.stateText}>// carregando ranking...</span>
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

  const { ranking, myPosition } = data

  return (
    <div className={styles.root}>

      {/* ── Header ── */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <p className={styles.subtitle}>// {className}</p>
          <h1 className={styles.title}>Ranking</h1>
        </div>
        {myPosition !== null && (
          <div className={styles.myPosition}>
            <span className={styles.myPositionLabel}>sua posição</span>
            <span className={styles.myPositionValue}>#{myPosition}</span>
          </div>
        )}
      </header>

      {/* ── Pódio (top 3) ── */}
      {ranking.length >= 3 && (
        <section className={styles.podium}>
          {/* 2º lugar */}
          <PodiumSlot entry={ranking[1]!} myId={user?.id} />
          {/* 1º lugar (centro, mais alto) */}
          <PodiumSlot entry={ranking[0]!} myId={user?.id} first />
          {/* 3º lugar */}
          <PodiumSlot entry={ranking[2]!} myId={user?.id} />
        </section>
      )}

      {/* ── Lista completa ── */}
      {ranking.length === 0 ? (
        <p className={styles.empty}>// nenhum aluno no ranking ainda.</p>
      ) : (
        <ol className={styles.list}>
          {ranking.map((entry) => {
            const isMe = entry.student.id === user?.id
            return (
              <li
                key={entry.student.id}
                className={`${styles.row} ${isMe ? styles.rowMe : ''}`}
              >
                <span className={styles.position}>
                  {MEDAL[entry.position] ?? `#${entry.position}`}
                </span>

                <div className={styles.avatarWrap}>
                  {entry.student.avatarUrl
                    ? <img src={entry.student.avatarUrl} alt={entry.student.name} className={styles.avatarImg} />
                    : <div className={styles.avatar}>{initials(entry.student.name)}</div>
                  }
                </div>

                <span className={styles.studentName}>
                  {entry.student.name}
                  {isMe && <span className={styles.meTag}>você</span>}
                </span>

                <div className={styles.rowStats}>
                  <span className={styles.xp}>
                    <IconStar />
                    {entry.totalXp.toLocaleString('pt-BR')}
                  </span>
                  <span className={styles.level}>Nível {entry.level}</span>
                </div>
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}

// ─── PodiumSlot ───────────────────────────────────────────────────────────────

function PodiumSlot({
  entry,
  myId,
  first = false,
}: {
  entry: RankingEntry
  myId?: string
  first?: boolean
}) {
  const isMe = entry.student.id === myId
  const medal = MEDAL[entry.position] ?? ''

  return (
    <div className={`${styles.podiumSlot} ${first ? styles.podiumFirst : ''} ${isMe ? styles.podiumMe : ''}`}>
      <span className={styles.podiumMedal}>{medal}</span>
      <div className={styles.podiumAvatar}>
        {entry.student.avatarUrl
          ? <img src={entry.student.avatarUrl} alt={entry.student.name} className={styles.podiumAvatarImg} />
          : <span className={styles.podiumInitials}>{initials(entry.student.name)}</span>
        }
      </div>
      <span className={styles.podiumName}>{entry.student.name.split(' ')[0]}</span>
      <span className={styles.podiumXp}>
        <IconStar />
        {entry.totalXp.toLocaleString('pt-BR')}
      </span>
    </div>
  )
}
