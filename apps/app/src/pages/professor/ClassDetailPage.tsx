import { useEffect, useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api, ApiError } from '../../lib/api.ts'
import styles from './ClassDetailPage.module.css'

interface ClassInfo {
  id: string
  name: string
  progressionMode: string
  validationMode: string
}

interface StudentRow {
  id: string
  name: string
  avatarUrl: string | null
  totalXp: number
  level: number
  lastActivity: string | null
  pendingReview: number
}

interface ClassDashboard {
  class: ClassInfo
  stats: { totalStudents: number; activeToday: number; avgXp: number }
  students: StudentRow[]
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

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

export default function ClassDetailPage() {
  const { slug, classId } = useParams<{ slug: string; classId: string }>()
  const [data, setData] = useState<ClassDashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!slug || !classId) return
    setLoadError(null)
    try {
      const res = await api.get<{ data: ClassDashboard }>(
        `/api/${slug}/dashboard/classes/${classId}`,
      )
      setData(res.data)
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : 'Erro ao carregar turma.')
    } finally {
      setLoading(false)
    }
  }, [slug, classId])

  useEffect(() => { load() }, [load])

  if (loading) {
    return <div className={styles.state}><span className={styles.stateText}>// carregando turma...</span></div>
  }
  if (loadError || !data) {
    return <div className={styles.state}><span className={styles.stateError}>{loadError ?? 'Turma não encontrada.'}</span></div>
  }

  const { class: cls, stats, students } = data

  return (
    <div className={styles.root}>
      <Link to={`/${slug}/professor`} className={styles.backLink}>
        <IconArrowLeft /> Turmas
      </Link>

      <header className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>{cls.name}</h1>
      </header>

      <section className={styles.kpis}>
        <div className={styles.kpi}>
          <span className={styles.kpiValue}>{stats.totalStudents}</span>
          <span className={styles.kpiLabel}>Alunos</span>
        </div>
        <div className={styles.kpi}>
          <span className={styles.kpiValue}>{stats.activeToday}</span>
          <span className={styles.kpiLabel}>Ativos hoje</span>
        </div>
        <div className={styles.kpi}>
          <span className={styles.kpiValue}>{stats.avgXp}</span>
          <span className={styles.kpiLabel}>XP médio</span>
        </div>
      </section>

      {students.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>Nenhum aluno nesta turma</p>
        </div>
      ) : (
        <div className={styles.table}>
          <div className={styles.tableHead}>
            <span className={styles.colName}>Aluno</span>
            <span className={styles.colNum}>Nível</span>
            <span className={styles.colNum}>XP</span>
            <span className={styles.colNum}>Atividade</span>
            <span className={styles.colNum}>Revisões</span>
          </div>

          {students.map((s) => (
            <Link key={s.id} to={`/${slug}/professor/students/${s.id}`} className={styles.tableRow}>
              <div className={styles.colName}>
                <div className={styles.avatar}>{initials(s.name)}</div>
                <span className={styles.studentName}>{s.name}</span>
              </div>
              <span className={styles.colNum}><span className={styles.levelPill}>{s.level}</span></span>
              <span className={`${styles.colNum} ${styles.xp}`}>{s.totalXp}</span>
              <span className={`${styles.colNum} ${styles.muted}`}>{formatDate(s.lastActivity)}</span>
              <span className={styles.colNum}>
                {s.pendingReview > 0
                  ? <span className={styles.reviewBadge}>{s.pendingReview}</span>
                  : <span className={styles.muted}>—</span>}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
