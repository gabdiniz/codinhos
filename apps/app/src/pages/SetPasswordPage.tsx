import { useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { api, ApiError } from '../lib/api.ts'
import styles from './SetPasswordPage.module.css'

// Tela única para definir senha — serve tanto para convite (/accept-invite)
// quanto para recuperação (/reset-password). Ambos usam o mesmo endpoint
// POST /:slug/auth/reset-password { token, newPassword }.
export default function SetPasswordPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const location = useLocation()

  const isReset = location.pathname.endsWith('/reset-password')
  const token = new URLSearchParams(location.search).get('token') ?? ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const title = isReset ? 'Redefinir senha' : 'Configurar acesso'
  const subtitle = isReset
    ? 'Escolha uma nova senha para sua conta.'
    : 'Defina uma senha para ativar seu acesso.'

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    if (!token) {
      setError('Link inválido — token ausente.')
      return
    }
    if (password.length < 8) {
      setError('A senha deve ter no mínimo 8 caracteres.')
      return
    }
    if (password !== confirm) {
      setError('As senhas não coincidem.')
      return
    }
    setLoading(true)
    try {
      await api.post(`/api/${slug}/auth/reset-password`, { token, newPassword: password })
      setDone(true)
    } catch (err) {
      if (err instanceof ApiError && err.status === 422) {
        setError('Link inválido, expirado ou já utilizado. Peça um novo.')
      } else {
        setError('Algo deu errado. Tente novamente.')
      }
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className={styles.root}>
        <div className={styles.card}>
          <div className={styles.logo} aria-hidden="true">
            {'{'}<span className={styles.brand}>cod</span>{'}'}
          </div>
          <h1 className={styles.title}>Senha definida!</h1>
          <p className={styles.subtitle}>Sua senha foi configurada. Agora é só entrar.</p>
          <button className={styles.btn} onClick={() => navigate(`/${slug}/login`, { replace: true })}>
            Ir para o login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.root}>
      <form className={styles.card} onSubmit={handleSubmit}>
        <div className={styles.logo} aria-hidden="true">
          {'{'}<span className={styles.brand}>cod</span>{'}'}
        </div>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.subtitle}>{subtitle}</p>

        {!token && <p className={styles.error} role="alert">Link inválido — token ausente.</p>}

        <label className={styles.label}>
          Nova senha
          <input
            className={styles.input}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
            autoFocus
            autoComplete="new-password"
          />
        </label>

        <label className={styles.label}>
          Confirmar senha
          <input
            className={styles.input}
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            autoComplete="new-password"
          />
        </label>

        {error && <p className={styles.error} role="alert" aria-live="assertive">{error}</p>}

        <button className={styles.btn} type="submit" disabled={loading || !token}>
          {loading ? 'Salvando...' : 'Salvar senha'}
        </button>
      </form>
    </div>
  )
}
