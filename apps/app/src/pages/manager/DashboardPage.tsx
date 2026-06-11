import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api, ApiError } from '../../lib/api.ts'
import styles from './DashboardPage.module.css'

// ─── Tipos ────────────────────────────────────────────────────────────────────

type AlertType = 'pending_review' | 'no_activity_7d' | 'stuck_on_module'

interface Alert {
  type: AlertType
  studentId: string
  studentName: string
  classId: string
  message: string
}

interface Overview {
  totalStudents: number
  activeToday: number
  totalClasses: number
  alerts: Alert[]
}

// ─── Ícones ───────────────────────────────────────────────────────────────────

function IconUsers() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function IconActivity() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  )
}

function IconLayers() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  )
}

function IconChevronRight() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ALERT_META: Record<AlertType, { label: string; colorClass: string }> = {
  pending_review:  { label: 'Revisão pendente',  colorClass: 'alertWarning' },
  no_activity_7d:  { label: 'Sem atividade',     colorClass: 'alertInfo'    },
  stuck_on_module: { label: 'Travado no desafio', colorClass: 'alertError'  },
}

// ─── Componentes locais ───────────────────────────────────────────────────────

interface KpiCardProps {
  label: string
  value: number
  icon: React.ReactNode
  accent?: 'primary' | 'success' | 'secondary'
}

function KpiCard({ label, value, icon, accent = 'primary' }: KpiCardProps) {
  return (
    <div className={`${styles.kpiCard} ${styles[`kpiCard_${accent}`]}`}>
      <div className={styles.kpiIcon}>{icon}</div>
      <div className={styles.kpiBody}>
        <span className={styles.kpiValue}>{value.toLocaleString('pt-BR')}</span>
        <span className={styles.kpiLabel}>{label}</span>
      </div>
    </div>
  )
}

// ─── ManagerDashboardPage ─────────────────────────────────────────────────────

export default function ManagerDashboardPage() {
  const { slug } = useParams<{ slug: string }>()
  const [overview, setOverview] = useState<Overview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!slug) return
    api
      .get<{ data: Overview }>(`/api/${slug}/dashboard`)
      .then((res) => setOverview(res.data))
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Erro ao carregar dashboard.'))
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) {
    return (
      <div className={styles.state}>
        <span className={styles.stateText}>// carregando...</span>
      </div>
    )
  }

  if (error || !overview) {
    return (
      <div className={styles.state}>
        <span className={styles.stateError}>{error ?? 'Erro desconhecido.'}</span>
      </div>
    )
  }

  const alertsByType = overview.alerts.reduce<Record<AlertType, Alert[]>>(
    (acc, a) => {
      acc[a.type].push(a)
      return acc
    },
    { pending_review: [], no_activity_7d: [], stuck_on_module: [] },
  )

  return (
    <div className={styles.root}>
      {/* ── Header ── */}
      <header className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Dashboard</h1>
          <p className={styles.pageSubtitle}>Visão geral da escola</p>
        </div>
      </header>

      {/* ── KPIs ── */}
      <section className={styles.kpiGrid} aria-label="Resumo">
        <KpiCard
          label="Alunos cadastrados"
          value={overview.totalStudents}
          icon={<IconUsers />}
          accent="primary"
        />
        <KpiCard
          label="Ativos hoje"
          value={overview.activeToday}
          icon={<IconActivity />}
          accent="success"
        />
        <KpiCard
          label="Turmas"
          value={overview.totalClasses}
          icon={<IconLayers />}
          accent="secondary"
        />
      </section>

      {/* ── Alertas ── */}
      <section className={styles.alertsSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Alertas</h2>
          <span className={styles.alertCount}>
            {overview.alerts.length} {overview.alerts.length === 1 ? 'alerta' : 'alertas'}
          </span>
        </div>

        {overview.alerts.length === 0 ? (
          <div className={styles.emptyAlerts}>
            <span>✓</span>
            <p>Tudo em ordem! Nenhum alerta no momento.</p>
          </div>
        ) : (
          <div className={styles.alertGroups}>
            {(Object.entries(alertsByType) as [AlertType, Alert[]][])
              .filter(([, list]) => list.length > 0)
              .map(([type, list]) => {
                const meta = ALERT_META[type]
                return (
                  <div key={type} className={styles.alertGroup}>
                    <div className={styles.alertGroupHeader}>
                      <span className={`${styles.alertTag} ${styles[meta.colorClass]}`}>
                        {meta.label}
                      </span>
                      <span className={styles.alertGroupCount}>{list.length}</span>
                    </div>
                    <ul className={styles.alertList}>
                      {list.map((alert, i) => (
                        <li key={i} className={styles.alertItem}>
                          <div className={styles.alertItemBody}>
                            <span className={styles.alertName}>{alert.studentName}</span>
                            <span className={styles.alertMsg}>{alert.message}</span>
                          </div>
                          <Link
                            to={`/${slug}/manager/students?id=${alert.studentId}`}
                            className={styles.alertLink}
                            aria-label={`Ver aluno ${alert.studentName}`}
                          >
                            <IconChevronRight />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              })}
          </div>
        )}
      </section>
    </div>
  )
}
