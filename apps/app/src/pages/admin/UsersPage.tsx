import { useEffect, useState, useCallback } from 'react'
import { api, ApiError } from '../../lib/api.ts'
import styles from './UsersPage.module.css'

// ─── Tipos ────────────────────────────────────────────────────────────────────

type UserRole = 'super_admin' | 'manager' | 'professor' | 'student'

interface AdminUser {
  id: string
  name: string
  email: string
  role: UserRole
  isActive: boolean
  tenantId: string
  createdAt: string
}

interface Meta {
  total: number
  page: number
  limit: number
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const PAGE_SIZE = 20

const ROLE_OPTIONS: { value: UserRole | ''; label: string }[] = [
  { value: '',           label: 'Todas as roles' },
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'manager',     label: 'Gestor' },
  { value: 'professor',   label: 'Professor' },
  { value: 'student',     label: 'Aluno' },
]

const ROLE_LABEL: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  manager:     'Gestor',
  professor:   'Professor',
  student:     'Aluno',
}

const STATUS_OPTIONS = [
  { value: '',      label: 'Todos' },
  { value: 'true',  label: 'Ativos' },
  { value: 'false', label: 'Inativos' },
]

// ─── Ícones ───────────────────────────────────────────────────────────────────

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

// ─── UsersPage ────────────────────────────────────────────────────────────────

export default function UsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [meta, setMeta] = useState<Meta>({ total: 0, page: 1, limit: PAGE_SIZE })
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [resetting, setResetting] = useState<string | null>(null)
  const [resetLink, setResetLink] = useState<{ name: string; url: string } | null>(null)
  const [copied, setCopied] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const [roleFilter, setRoleFilter] = useState<UserRole | ''>('')
  const [statusFilter, setStatusFilter] = useState<'true' | 'false' | ''>('')

  const load = useCallback(async (p: number, role: UserRole | '', status: 'true' | 'false' | '') => {
    setLoadError(null)
    try {
      const qs = new URLSearchParams({ page: String(p), limit: String(PAGE_SIZE) })
      if (role)   qs.set('role', role)
      if (status) qs.set('isActive', status)
      const res = await api.get<{ data: AdminUser[]; meta: Meta }>(`/api/admin/users?${qs}`)
      setUsers(res.data)
      setMeta(res.meta)
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : 'Erro ao carregar usuários.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load(page, roleFilter, statusFilter) }, [load, page, roleFilter, statusFilter])
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3500)
    return () => clearTimeout(t)
  }, [toast])

  async function handleReset(u: AdminUser) {
    setResetting(u.id)
    try {
      const res = await api.post<{ data: { message: string; resetUrl: string } }>(
        `/api/admin/users/${u.id}/reset-password`,
      )
      setResetLink({ name: u.name, url: res.data.resetUrl })
      setCopied(false)
    } catch (err) {
      setToast(err instanceof ApiError ? err.message : 'Erro ao disparar reset.')
    } finally {
      setResetting(null)
    }
  }

  async function copyLink() {
    if (!resetLink) return
    try {
      await navigator.clipboard.writeText(resetLink.url)
      setCopied(true)
    } catch {
      setToast('Não foi possível copiar — selecione e copie manualmente.')
    }
  }

  function handleFilterChange(newRole: UserRole | '', newStatus: 'true' | 'false' | '') {
    setRoleFilter(newRole)
    setStatusFilter(newStatus)
    setPage(1)
    setLoading(true)
  }

  function handlePageChange(newPage: number) {
    setPage(newPage)
    setLoading(true)
  }

  const totalPages = Math.ceil(meta.total / PAGE_SIZE)

  if (loading) {
    return <div className={styles.state}><span className={styles.stateText}>// carregando usuários...</span></div>
  }

  if (loadError) {
    return <div className={styles.state}><span className={styles.stateError}>{loadError}</span></div>
  }

  return (
    <div className={styles.root}>
      <header className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Usuários</h1>
          <p className={styles.pageSubtitle}>{meta.total} usuário{meta.total !== 1 ? 's' : ''} no total</p>
        </div>
      </header>

      {/* Filtros */}
      <div className={styles.filters}>
        <select
          className={styles.filterSelect}
          value={roleFilter}
          onChange={(e) => handleFilterChange(e.target.value as UserRole | '', statusFilter)}
          aria-label="Filtrar por role"
        >
          {ROLE_OPTIONS.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>

        <select
          className={styles.filterSelect}
          value={statusFilter}
          onChange={(e) => handleFilterChange(roleFilter, e.target.value as 'true' | 'false' | '')}
          aria-label="Filtrar por status"
        >
          {STATUS_OPTIONS.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {users.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>Nenhum usuário encontrado</p>
          <p className={styles.emptyText}>Tente ajustar os filtros.</p>
        </div>
      ) : (
        <div className={styles.table}>
          <div className={styles.tableHead}>
            <span>Nome</span>
            <span>E-mail</span>
            <span>Role</span>
            <span>Status</span>
            <span>Tenant ID</span>
            <span>Ações</span>
          </div>
          {users.map((u) => (
            <div key={u.id} className={styles.tableRow}>
              <span className={styles.userName}>{u.name}</span>
              <span className={styles.userEmail}>{u.email}</span>
              <span>
                <span className={`${styles.badge} ${styles[`role_${u.role}`]}`}>
                  {ROLE_LABEL[u.role]}
                </span>
              </span>
              <span>
                <span className={`${styles.badge} ${u.isActive ? styles.statusActive : styles.statusInactive}`}>
                  {u.isActive ? 'Ativo' : 'Inativo'}
                </span>
              </span>
              <span className={styles.tenantId} title={u.tenantId}>
                {u.tenantId.slice(0, 8)}…
              </span>
              <span>
                <button
                  className={styles.resetBtn}
                  onClick={() => handleReset(u)}
                  disabled={resetting === u.id}
                  title="Disparar redefinição de senha"
                >
                  {resetting === u.id ? 'Enviando…' : 'Resetar senha'}
                </button>
              </span>
            </div>
          ))}
        </div>
      )}

      {resetLink && (
        <div className={styles.modalOverlay} onClick={() => setResetLink(null)} role="dialog" aria-modal="true">
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Reset enviado</h2>
              <button className={styles.modalClose} onClick={() => setResetLink(null)} aria-label="Fechar">×</button>
            </div>
            <div className={styles.modalBody}>
              <p className={styles.modalText}>
                Um e-mail de redefinição foi enviado para <strong>{resetLink.name}</strong>. O link expira em 24 horas.
                Você também pode copiá-lo e repassar por outro canal:
              </p>
              <div className={styles.linkBox}>
                <code className={styles.linkText}>{resetLink.url}</code>
              </div>
              <div className={styles.modalActions}>
                <button className={styles.copyBtn} onClick={copyLink}>{copied ? 'Copiado!' : 'Copiar link'}</button>
              </div>
            </div>
          </div>
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
            aria-label="Próxima"
          >
            <IconChevronRight />
          </button>
        </div>
      )}

      {toast && <div className={styles.toast}>{toast}</div>}
    </div>
  )
}
