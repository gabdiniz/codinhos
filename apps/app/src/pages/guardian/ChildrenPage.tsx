import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api, ApiError } from '../../lib/api.ts'
import styles from './ChildrenPage.module.css'

interface Child {
  id: string
  name: string
  avatarUrl: string | null
  totalXp: number
  level: number
  currentStreak: number
  lastActivity: string | null
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export default function ChildrenPage() {
  const { slug } = useParams<{ slug: string }>()
  const [children, setChildren] = useState<Child[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    if (!slug) return
    let active = true
    api
      .get<{ data: Child[] }>(`/api/${slug}/guardian/children`)
      .then((res) => { if (active) setChildren(res.data) })
      .catch((err) => {
        if (active) setLoadError(err instanceof ApiError ? err.message : 'Erro ao carregar.')
      })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [slug])

  if (loading) {
    return <div className={styles.state}><span className={styles.stateText}>// carregando...</span></div>
  }
  if (loadError) {
    return <div className={styles.state}><span className={styles.stateError}>{loadError}</span></div>
  }

  return (
    <div className={styles.root}>
      <header className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Acompanhamento</h1>
        <p className={styles.pageSubtitle}>
          {children.length} {children.length === 1 ? 'filho vinculado' : 'filhos vinculados'}
        </p>
      </header>

      {children.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>Nenhum filho vinculado</p>
          <p className={styles.emptyText}>
            Quando a escola vincular você a um aluno, o progresso dele aparecerá aqui.
          </p>
        </div>
      ) : (
        <div className={styles.grid}>
          {children.map((c) => (
            <Link key={c.id} to={`/${slug}/guardian/children/${c.id}`} className={styles.card}>
              <div className={styles.cardTop}>
                <div className={styles.avatar}>{initials(c.name)}</div>
                <div className={styles.cardInfo}>
                  <span className={styles.cardName}>{c.name}</span>
                  <span className={styles.cardLevel}>Nível {c.level}</span>
                </div>
              </div>
              <div className={styles.cardStats}>
                <span className={styles.xp}>{c.totalXp} XP</span>
                <span className={styles.streak}>🔥 {c.currentStreak}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
