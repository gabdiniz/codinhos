import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.tsx'
import { api, ApiError } from '../lib/api.ts'
import type { CurrentUser } from '../contexts/AuthContext.tsx'
import styles from './LoginPage.module.css'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function redirectAfterLogin(slug: string, role: CurrentUser['role']): string {
  if (role === 'student') return `/${slug}/learn`
  return `/${slug}/manager`
}

function errorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 401) return 'E-mail ou senha incorretos.'
    if (err.status === 403) return 'Conta inativa. Fale com seu professor.'
    if (err.status === 429) return 'Muitas tentativas. Aguarde um momento.'
  }
  return 'Algo deu errado. Tente novamente.'
}

// ─── Componente ──────────────────────────────────────────────────────────────

export default function LoginPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { setUser } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!slug) return

    setError(null)
    setLoading(true)

    try {
      const res = await api.post<{ data: { user: CurrentUser } }>(
        `/api/${slug}/auth/login`,
        { email, password },
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

  const canSubmit = email.length > 0 && password.length > 0 && !loading

  return (
    <div className={styles.root}>
      {/* Dot grid + glow animado */}
      <div className={styles.bg} aria-hidden="true" />

      <main className={styles.card}>
        {/* Logo */}
        <div className={styles.logo} aria-label="Codinhos">
          <span className={styles.bracket} aria-hidden="true">{'{'}</span>
          <span className={styles.brand}>codinhos</span>
          <span className={styles.bracket} aria-hidden="true">{'}'}</span>
          <span className={styles.cursor} aria-hidden="true" />
        </div>

        <p className={styles.sub}>Faça login para continuar</p>

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          {/* E-mail */}
          <div className={styles.field}>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.input}
              placeholder=" "
              autoComplete="email"
              autoFocus
              required
              aria-required="true"
            />
            <label htmlFor="email" className={styles.label}>
              E-mail
            </label>
          </div>

          {/* Senha */}
          <div className={styles.field}>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={styles.input}
              placeholder=" "
              autoComplete="current-password"
              required
              aria-required="true"
            />
            <label htmlFor="password" className={styles.label}>
              Senha
            </label>
          </div>

          {/* Erro */}
          {error && (
            <p className={styles.error} role="alert" aria-live="assertive">
              {error}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            className={styles.btn}
            disabled={!canSubmit}
            aria-busy={loading}
          >
            {loading ? <span className={styles.spinner} aria-label="Carregando…" /> : 'Entrar'}
          </button>
        </form>
      </main>
    </div>
  )
}
