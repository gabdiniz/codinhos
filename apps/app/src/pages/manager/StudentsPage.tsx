import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { api, ApiError } from '../../lib/api.ts'
import styles from './StudentsPage.module.css'

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Student {
  id: string
  name: string
  email: string
  role: string
  isActive: boolean
  createdAt: string
}

interface Meta {
  total: number
  page: number
  limit: number
}

type StatusFilter = 'all' | 'active' | 'inactive'

// ─── Constantes ───────────────────────────────────────────────────────────────

const PAGE_SIZE = 20

// ─── Ícones ───────────────────────────────────────────────────────────────────

function IconPlus() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

function IconSearch() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

function IconRefresh() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
  )
}

function IconSlash() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
    </svg>
  )
}

function IconClose() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

function IconChevronLeft() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="15 18 9 12 15 6" />
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

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ name }: { name: string }) {
  const initials = name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()
  return <div className={styles.avatar} aria-hidden="true">{initials}</div>
}

// ─── Modal de convite ─────────────────────────────────────────────────────────

interface InviteModalProps {
  slug: string
  onClose: () => void
  onSave: (id: string) => void
}

function InviteModal({ slug, onClose, onSave }: InviteModalProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const firstRef = useRef<HTMLInputElement>(null)

  useEffect(() => { firstRef.current?.focus() }, [])
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [onClose])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const res = await api.post<{ data: { user: Student } }>(`/api/${slug}/users`, {
        name: name.trim(),
        email: email.trim(),
        role: 'student',
      })
      onSave(res.data.user.id)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao convidar aluno.')
      setSaving(false)
    }
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose} aria-modal="true" role="dialog">
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Convidar aluno</h2>
          <button className={styles.modalClose} onClick={onClose} aria-label="Fechar"><IconClose /></button>
        </div>
        <form className={styles.modalForm} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label className={styles.label}>Nome completo</label>
            <input
              ref={firstRef}
              className={styles.input}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ana Lima"
              required
              maxLength={255}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>E-mail</label>
            <input
              className={styles.input}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ana@escola.edu.br"
              required
            />
            <span className={styles.inviteHint}>O aluno receberá um e-mail para criar sua senha.</span>
          </div>
          {error && <p className={styles.formError}>{error}</p>}
          <div className={styles.modalActions}>
            <button type="button" className={styles.btnSecondary} onClick={onClose} disabled={saving}>Cancelar</button>
            <button type="submit" className={styles.btnPrimary} disabled={saving || !name.trim() || !email.trim()}>
              {saving ? 'Enviando...' : 'Enviar convite'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Confirmação de desativação ───────────────────────────────────────────────

interface DeactivateConfirmProps {
  student: Student
  onConfirm: () => Promise<void>
  onCancel: () => void
}

function DeactivateConfirm({ student, onConfirm, onCancel }: DeactivateConfirmProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel() }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [onCancel])

  async function handleConfirm() {
    setLoading(true)
    setError(null)
    try { await onConfirm() }
    catch (err) { setError(err instanceof ApiError ? err.message : 'Erro ao desativar.'); setLoading(false) }
  }

  return (
    <div className={styles.modalOverlay} onClick={onCancel} aria-modal="true" role="dialog">
      <div className={`${styles.modal} ${styles.modalSm}`} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Desativar aluno</h2>
          <button className={styles.modalClose} onClick={onCancel} aria-label="Fechar"><IconClose /></button>
        </div>
        <div className={styles.deleteBody}>
          <p className={styles.deleteText}>
            Desativar <strong>{student.name}</strong>? O aluno perderá acesso à plataforma.
          </p>
          {error && <p className={styles.formError}>{error}</p>}
          <div className={styles.modalActions}>
            <button className={styles.btnSecondary} onClick={onCancel} disabled={loading}>Cancelar</button>
            <button className={styles.btnDanger} onClick={handleConfirm} disabled={loading}>
              {loading ? 'Desativando...' : 'Sim, desativar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── StudentsPage ─────────────────────────────────────────────────────────────

export default function StudentsPage() {
  const { slug } = useParams<{ slug: string }>()

  const [students, setStudents] = useState<Student[]>([])
  const [meta, setMeta] = useState<Meta>({ total: 0, page: 1, limit: PAGE_SIZE })
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  const [showInvite, setShowInvite] = useState(false)
  const [deactivateTarget, setDeactivateTarget] = useState<Student | null>(null)
  const [highlightId, setHighlightId] = useState<string | null>(null)
  const [resendingId, setResendingId] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const load = useCallback(async (p: number) => {
    if (!slug) return
    setLoadError(null)
    try {
      const qs = new URLSearchParams({ role: 'student', page: String(p), limit: String(PAGE_SIZE) })
      const res = await api.get<{ data: Student[]; meta: Meta }>(`/api/${slug}/users?${qs}`)
      setStudents(res.data)
      setMeta(res.meta)
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : 'Erro ao carregar alunos.')
    } finally {
      setLoading(false)
    }
  }, [slug])

  useEffect(() => { load(page) }, [load, page])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3500)
    return () => clearTimeout(t)
  }, [toast])

  useEffect(() => {
    if (!highlightId) return
    const t = setTimeout(() => setHighlightId(null), 4000)
    return () => clearTimeout(t)
  }, [highlightId])

  async function handleInvite(newId: string) {
    setShowInvite(false)
    setHighlightId(newId)
    setToast('Convite enviado!')
    await load(page)
  }

  async function handleDeactivate() {
    if (!deactivateTarget || !slug) return
    const targetName = deactivateTarget.name
    await api.delete(`/api/${slug}/users/${deactivateTarget.id}`)
    setDeactivateTarget(null)
    setToast(`${targetName} foi desativado(a).`)
    await load(page)
  }

  async function handleResendInvite(student: Student) {
    if (!slug) return
    setResendingId(student.id)
    try {
      await api.post(`/api/${slug}/users/${student.id}/resend-invite`)
      setToast(`Convite reenviado para ${student.name}.`)
    } catch (err) {
      setToast(err instanceof ApiError ? err.message : 'Erro ao reenviar convite.')
    } finally {
      setResendingId(null)
    }
  }

  function handlePageChange(newPage: number) {
    setPage(newPage)
    setLoading(true)
  }

  const filtered = useMemo(() => {
    let list = students
    if (statusFilter === 'active')   list = list.filter((s) => s.isActive)
    if (statusFilter === 'inactive') list = list.filter((s) => !s.isActive)
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter((s) =>
        s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q),
      )
    }
    return list
  }, [students, statusFilter, search])

  const totalPages = Math.ceil(meta.total / PAGE_SIZE)

  if (loading) {
    return <div className={styles.state}><span className={styles.stateText}>// carregando alunos...</span></div>
  }

  if (loadError) {
    return <div className={styles.state}><span className={styles.stateError}>{loadError}</span></div>
  }

  return (
    <div className={styles.root}>
      <header className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Alunos</h1>
          <p className={styles.pageSubtitle}>{meta.total} aluno{meta.total !== 1 ? 's' : ''} cadastrado{meta.total !== 1 ? 's' : ''}</p>
        </div>
        <button className={styles.btnPrimary} onClick={() => setShowInvite(true)}>
          <IconPlus />
          Convidar aluno
        </button>
      </header>

      <div className={styles.filters}>
        <div className={styles.searchBox}>
          <span className={styles.searchIcon}><IconSearch /></span>
          <input
            className={styles.searchInput}
            type="search"
            placeholder="Buscar por nome ou e-mail..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Buscar alunos"
          />
        </div>
        <div className={styles.statusTabs} role="tablist" aria-label="Filtrar por status">
          {(['all', 'active', 'inactive'] as StatusFilter[]).map((s) => (
            <button
              key={s}
              role="tab"
              aria-selected={statusFilter === s}
              className={`${styles.statusTab} ${statusFilter === s ? styles.statusTabActive : ''}`}
              onClick={() => setStatusFilter(s)}
            >
              {s === 'all' ? 'Todos' : s === 'active' ? 'Ativos' : 'Inativos'}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>
            {students.length === 0 ? 'Nenhum aluno ainda' : 'Nenhum resultado'}
          </p>
          <p className={styles.emptyText}>
            {students.length === 0
              ? 'Convide o primeiro aluno para comecar.'
              : 'Tente ajustar os filtros ou a busca.'}
          </p>
          {students.length === 0 && (
            <button className={styles.btnPrimary} onClick={() => setShowInvite(true)}>
              <IconPlus />Convidar aluno
            </button>
          )}
        </div>
      ) : (
        <div className={styles.table}>
          <div className={styles.tableHead}>
            <span>Aluno</span>
            <span>Status</span>
            <span />
          </div>
          {filtered.map((s) => (
            <div
              key={s.id}
              className={`${styles.tableRow} ${s.id === highlightId ? styles.tableRowHighlighted : ''}`}
            >
              <div className={styles.colStudent}>
                <Avatar name={s.name} />
                <div className={styles.studentInfo}>
                  <span className={styles.studentName}>{s.name}</span>
                  <span className={styles.studentEmail}>{s.email}</span>
                </div>
              </div>
              <div className={styles.colStatus}>
                <span className={`${styles.statusBadge} ${s.isActive ? styles.statusActive : styles.statusInactive}`}>
                  {s.isActive ? 'Ativo' : 'Inativo'}
                </span>
              </div>
              <div className={styles.colActions}>
                {!s.isActive && (
                  <button
                    className={styles.actionBtn}
                    onClick={() => handleResendInvite(s)}
                    disabled={resendingId === s.id}
                    title="Reenviar convite"
                    aria-label={`Reenviar convite para ${s.name}`}
                  >
                    <IconRefresh />
                  </button>
                )}
                {s.isActive && (
                  <button
                    className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                    onClick={() => setDeactivateTarget(s)}
                    title="Desativar"
                    aria-label={`Desativar ${s.name}`}
                  >
                    <IconSlash />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            className={styles.pageBtn}
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1}
            aria-label="Anterior"
          >
            <IconChevronLeft />
          </button>
          <span className={styles.pageInfo}>{page} / {totalPages}</span>
          <button
            className={styles.pageBtn}
            onClick={() => handlePageChange(page + 1)}
            disabled={page === totalPages}
            aria-label="Proxima"
          >
            <IconChevronRight />
          </button>
        </div>
      )}

      {showInvite && slug && (
        <InviteModal
          slug={slug}
          onClose={() => setShowInvite(false)}
          onSave={handleInvite}
        />
      )}
      {deactivateTarget && (
        <DeactivateConfirm
          student={deactivateTarget}
          onConfirm={handleDeactivate}
          onCancel={() => setDeactivateTarget(null)}
        />
      )}

      {toast && <div className={styles.toast} role="status">{toast}</div>}
    </div>
  )
}
