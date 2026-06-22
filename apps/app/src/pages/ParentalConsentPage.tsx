import { useState } from 'react'
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.tsx'
import { api, ApiError } from '../lib/api.ts'
import type { CurrentUser } from '../contexts/AuthContext.tsx'
import styles from './ParentalConsentPage.module.css'

// ─── Helpers ─────────────────────────────────────────────────────────────────

interface ConsentState {
  consentToken: string
  studentName: string
}

function redirectAfterLogin(slug: string, role: CurrentUser['role']): string {
  if (role === 'student') return `/${slug}/learn`
  return `/${slug}/manager`
}

function errorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 422) return 'Link expirado. Volte e faça login novamente.'
    if (err.status === 429) return 'Muitas tentativas. Aguarde um momento.'
  }
  return 'Algo deu errado. Tente novamente.'
}

// ─── Componente ──────────────────────────────────────────────────────────────

export default function ParentalConsentPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const { setUser } = useAuth()

  const state = location.state as ConsentState | null

  const [guardianName, setGuardianName] = useState('')
  const [guardianEmail, setGuardianEmail] = useState('')
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Acesso direto à URL (sem vir do login) — não há token disponível.
  if (!slug || !state) {
    return (
      <div className={styles.root}>
        <div className={styles.bg} aria-hidden="true" />
        <main className={styles.card}>
          <p className={styles.sub}>
            Não encontramos os dados do login. Volte e tente novamente.
          </p>
          <Link to={slug ? `/${slug}/login` : '/404'} className={styles.btnLink}>
            Voltar ao login
          </Link>
        </main>
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!acceptedTerms) return

    setError(null)
    setLoading(true)

    try {
      const res = await api.post<{ data: { user: CurrentUser; redirectTo: string } }>(
        `/api/${slug}/auth/parental-consent`,
        {
          consentToken: state.consentToken,
          guardianName,
          guardianEmail,
        },
      )
      const user = res.data.user
      setUser(user)
      navigate(redirectAfterLogin(slug, user.role), { replace: true })
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const canSubmit = guardianName.length > 0 && guardianEmail.length > 0 && acceptedTerms && !loading

  return (
    <div className={styles.root}>
      <div className={styles.bg} aria-hidden="true" />

      <main className={styles.card}>
        <div className={styles.logo} aria-label="Codinhos">
          <span className={styles.bracket} aria-hidden="true">{'{'}</span>
          <span className={styles.brand}>codinhos</span>
          <span className={styles.bracket} aria-hidden="true">{'}'}</span>
        </div>

        <p className={styles.sub}>
          Olá! Antes de <strong>{state.studentName}</strong> continuar, a LGPD exige consentimento
          de um responsável para alunos com menos de 12 anos.
        </p>

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          <div className={styles.field}>
            <input
              id="guardianName"
              type="text"
              value={guardianName}
              onChange={(e) => setGuardianName(e.target.value)}
              className={styles.input}
              placeholder=" "
              autoComplete="name"
              autoFocus
              required
              aria-required="true"
            />
            <label htmlFor="guardianName" className={styles.label}>
              Nome do responsável
            </label>
          </div>

          <div className={styles.field}>
            <input
              id="guardianEmail"
              type="email"
              value={guardianEmail}
              onChange={(e) => setGuardianEmail(e.target.value)}
              className={styles.input}
              placeholder=" "
              autoComplete="email"
              required
              aria-required="true"
            />
            <label htmlFor="guardianEmail" className={styles.label}>
              E-mail do responsável
            </label>
          </div>

          <label className={styles.checkboxField}>
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className={styles.checkbox}
            />
            <span>
              Li e autorizo o uso da plataforma Codinhos por {state.studentName}, conforme os
              termos de uso e a política de privacidade.
            </span>
          </label>

          {error && (
            <p className={styles.error} role="alert" aria-live="assertive">
              {error}
            </p>
          )}

          <button type="submit" className={styles.btn} disabled={!canSubmit} aria-busy={loading}>
            {loading ? <span className={styles.spinner} aria-label="Carregando…" /> : 'Confirmar consentimento'}
          </button>
        </form>
      </main>
    </div>
  )
}
