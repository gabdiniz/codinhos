import { useEffect, useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api, ApiError } from '../../lib/api.ts'
import styles from './ProfessorsPage.module.css'

interface Professor {
  id: string
  name: string
  email: string
  role: string
  isActive: boolean
}

// ─── Modal: convidar professor ────────────────────────────────────────────────

function InviteModal({ onClose, onInvited }: { onClose: () => void; onInvited: (name: string) => void }) {
  const { slug } = useParams<{ slug: string }>()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!slug) return
    setSaving(true)
    setError(null)
    try {
      await api.post(`/api/${slug}/users`, {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role: 'professor',
      })
      onInvited(name.trim())
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao convidar professor.')
      setSaving(false)
    }
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose} role="dialog" aria-modal="true">
      <form className={styles.modal} onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Convidar professor</h2>
          <button type="button" className={styles.modalClose} onClick={onClose} aria-label="Fechar">×</button>
        </div>
        <div className={styles.modalBody}>
          <label className={styles.formLabel}>Nome
            <input className={styles.formInput} value={name} onChange={(e) => setName(e.target.value)} required autoFocus placeholder="Ex.: Ana Souza" />
          </label>
          <label className={styles.formLabel}>E-mail
            <input className={styles.formInput} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="ana@escola.com" />
            <small className={styles.hint}>Ele recebe um convite por e-mail para definir a senha.</small>
          </label>
          {error && <p className={styles.formError}>{error}</p>}
          <div className={styles.formActions}>
            <button type="button" className={styles.btnGhost} onClick={onClose}>Cancelar</button>
            <button type="submit" className={styles.btnPrimary} disabled={saving}>{saving ? 'Convidando...' : 'Convidar'}</button>
          </div>
        </div>
      </form>
    </div>
  )
}

// ─── ProfessorsPage ───────────────────────────────────────────────────────────

export default function ProfessorsPage() {
  const { slug } = useParams<{ slug: string }>()
  const [professors, setProfessors] = useState<Professor[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [resending, setResending] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!slug) return
    setLoadError(null)
    try {
      const res = await api.get<{ data: Professor[] }>(`/api/${slug}/users?role=professor&limit=100`)
      setProfessors(res.data)
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : 'Erro ao carregar professores.')
    } finally {
      setLoading(false)
    }
  }, [slug])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3500)
    return () => clearTimeout(t)
  }, [toast])

  async function resendInvite(id: string) {
    if (!slug) return
    setResending(id)
    try {
      await api.post(`/api/${slug}/users/${id}/resend-invite`)
      setToast('Convite reenviado.')
    } catch (err) {
      setToast(err instanceof ApiError ? err.message : 'Erro ao reenviar convite.')
    } finally {
      setResending(null)
    }
  }

  if (loading) return <div className={styles.state}><span className={styles.stateText}>// carregando professores...</span></div>
  if (loadError) return <div className={styles.state}><span className={styles.stateError}>{loadError}</span></div>

  return (
    <div className={styles.root}>
      <header className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Professores</h1>
          <p className={styles.pageSubtitle}>{professors.length} professor{professors.length !== 1 ? 'es' : ''} na escola</p>
        </div>
        <button className={styles.btnPrimary} onClick={() => setInviteOpen(true)}>+ Convidar professor</button>
      </header>

      {professors.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>Nenhum professor ainda</p>
          <p className={styles.emptyText}>Convide professores para que eles acompanhem turmas e revisem desafios dos alunos.</p>
          <button className={styles.btnPrimary} onClick={() => setInviteOpen(true)}>+ Convidar professor</button>
        </div>
      ) : (
        <div className={styles.list}>
          {professors.map((p) => (
            <div key={p.id} className={styles.row}>
              <div className={styles.info}>
                <span className={styles.name}>{p.name}</span>
                <span className={styles.email}>{p.email}</span>
              </div>
              <span className={`${styles.badge} ${p.isActive ? styles.badgeActive : styles.badgeInactive}`}>
                {p.isActive ? 'Ativo' : 'Inativo'}
              </span>
              <div className={styles.actions}>
                <Link to={`/${slug}/manager/professors/${p.id}`} className={styles.btnEdit}>Gerenciar turmas</Link>
                <button className={styles.btnGhostSm} onClick={() => resendInvite(p.id)} disabled={resending === p.id} title="Reenvia o convite se o professor ainda não definiu a senha">
                  {resending === p.id ? 'Enviando…' : 'Reenviar convite'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {inviteOpen && (
        <InviteModal
          onClose={() => setInviteOpen(false)}
          onInvited={(name) => { setInviteOpen(false); setToast(`Convite enviado para ${name}.`); load() }}
        />
      )}
      {toast && <div className={styles.toast}>{toast}</div>}
    </div>
  )
}
