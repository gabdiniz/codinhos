import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api, ApiError } from '../../lib/api.ts'
import styles from './ClassesPage.module.css'

type ProgressionMode = 'free' | 'sequential' | 'controlled'
type ValidationMode = 'auto' | 'auto_review' | 'manual'

interface ClassRow {
  id: string
  name: string
  progressionMode: ProgressionMode
  validationMode: ValidationMode
  showRanking: boolean
  studentsCount: number
  createdAt: string
}

const PROGRESSION_LABEL: Record<ProgressionMode, string> = {
  free: 'Livre',
  sequential: 'Sequencial',
  controlled: 'Controlada',
}

const VALIDATION_LABEL: Record<ValidationMode, string> = {
  auto: 'Automática',
  auto_review: 'Auto + Revisão',
  manual: 'Manual',
}

export default function ClassesPage() {
  const { slug } = useParams<{ slug: string }>()
  const [classes, setClasses] = useState<ClassRow[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    if (!slug) return
    let active = true
    api
      .get<{ data: ClassRow[] }>(`/api/${slug}/classes`)
      .then((res) => { if (active) setClasses(res.data) })
      .catch((err) => {
        if (active) setLoadError(err instanceof ApiError ? err.message : 'Erro ao carregar turmas.')
      })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [slug])

  if (loading) {
    return (
      <div className={styles.state}>
        <span className={styles.stateText}>// carregando turmas...</span>
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

  return (
    <div className={styles.root}>
      <header className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Minhas turmas</h1>
        <p className={styles.pageSubtitle}>
          {classes.length} {classes.length === 1 ? 'turma atribuída' : 'turmas atribuídas'} a você
        </p>
      </header>

      {classes.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>Nenhuma turma atribuída</p>
          <p className={styles.emptyText}>
            Quando o gestor vincular você a uma turma, ela aparecerá aqui.
          </p>
        </div>
      ) : (
        <div className={styles.grid}>
          {classes.map((c) => (
            <Link key={c.id} to={`/${slug}/professor/classes/${c.id}`} className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>{c.name}</h2>
                <span className={styles.studentsCount}>
                  {c.studentsCount} {c.studentsCount === 1 ? 'aluno' : 'alunos'}
                </span>
              </div>
              <div className={styles.cardBadges}>
                <span className={styles.badge}>{PROGRESSION_LABEL[c.progressionMode]}</span>
                <span className={styles.badge}>{VALIDATION_LABEL[c.validationMode]}</span>
                {c.showRanking && <span className={styles.badgeMuted}>ranking</span>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
