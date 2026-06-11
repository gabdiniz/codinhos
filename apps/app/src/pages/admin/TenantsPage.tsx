import { useEffect, useState, useCallback, useRef } from 'react'
import { api, ApiError } from '../../lib/api.ts'
import styles from './TenantsPage.module.css'

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface TenantRow {
  id: string
  slug: string
  name: string
  plan: string
  isActive: boolean
  createdAt: string
}

interface Meta {
  total: number
  page: number
  limit: number
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const PAGE_SIZE = 20

const PLAN_OPTIONS = ['starter', 'basic', 'pro', 'enterprise'] as const
const PLAN_LABEL: Record<string, string> = {
  starter: 'Starter', basic: 'Basic', pro: 'Pro', enterprise: 'Enterprise',
}

// ─── Ícones ───────────────────────────────────────────────────────────────────

function IconPlus() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

function IconEdit() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
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

// ─── Modal de criação ─────────────────────────────────────────────────────────

interface CreateModalProps {
  onClose: () => void
  onSave: () => void
}

function CreateModal({ onClose, onSave }: CreateModalProps) {
  const [slug, setSlug] = useState('')
  const [name, setName] = useState('')
  const [plan, setPlan] = useState<typeof PLAN_OPTIONS[number]>('starter')
  const [managerName, setManagerName] = useState('')
  const [managerEmail, setManagerEmail] = useState('')
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
      await api.post('/api/admin/tenants', {
        slug: slug.trim(),
        name: name.trim(),
        plan,
        managerName: managerName.trim(),
        managerEmail: managerEmail.trim(),
      })
      onSave()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao criar escola.')
      setSaving(false)
    }
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose} aria-modal="true" role="dialog">
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Nova escola</h2>
          <button className={styles.modalClose} onClick={onClose} aria-label="Fechar"><IconClose /></button>
        </div>
        <form className={styles.modalForm} onSubmit={handleSubmit}>
          <div className={styles.formRow}>
            <div className={styles.field}>
              <label className={styles.label}>Slug</label>
              <input ref={firstRef} className={styles.input} type="text" value={slug}
                onChange={(e) => setSlug(e.target.value)} placeholder="escola-demo" required
                pattern="[a-z0-9-]+" title="Apenas letras minúsculas, números e hífens" />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Plano</label>
              <select className={styles.input} value={plan} onChange={(e) => setPlan(e.target.value as typeof plan)}>
                {PLAN_OPTIONS.map((p) => <option key={p} value={p}>{PLAN_LABEL[p]}</option>)}
              </select>
            </div>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Nome da escola</label>
            <input className={styles.input} type="text" value={name}
              onChange={(e) => setName(e.target.value)} placeholder="Escola Municipal João da Silva" required maxLength={255} />
          </div>
          <p className={styles.fieldGroupLabel}>Gestor inicial</p>
          <div className={styles.formRow}>
            <div className={styles.field}>
              <label className={styles.label}>Nome</label>
              <input className={styles.input} type="text" value={managerName}
                onChange={(e) => setManagerName(e.target.value)} placeholder="Ana Lima" required maxLength={255} />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>E-mail</label>
              <input className={styles.input} type="email" value={managerEmail}
                onChange={(e) => setManagerEmail(e.target.value)} placeholder="gestor@escola.edu.br" required />
            </div>
          </div>
          {error && <p className={styles.formError}>{error}</p>}
          <div className={styles.modalActions}>
            <button type="button" className={styles.btnSecondary} onClick={onClose} disabled={saving}>Cancelar</button>
            <button type="submit" className={styles.btnPrimary} disabled={saving || !slug || !name || !managerName || !managerEmail}>
              {saving ? 'Criando...' : 'Criar escola'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Modal de edição ──────────────────────────────────────────────────────────

interface EditModalProps {
  tenant: TenantRow
  onClose: () => void
  onSave: () => void
}

function EditModal({ tenant, onClose, onSave }: EditModalProps) {
  const [name, setName] = useState(tenant.name)
  const [plan, setPlan] = useState(tenant.plan)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
      await api.patch(`/api/admin/tenants/${tenant.id}`, { name: name.trim(), plan })
      onSave()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao salvar.')
      setSaving(false)
    }
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose} aria-modal="true" role="dialog">
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Editar escola</h2>
          <button className={styles.modalClose} onClick={onClose} aria-label="Fechar"><IconClose /></button>
        </div>
        <form className={styles.modalForm} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label className={styles.label}>Slug</label>
            <input className={`${styles.input} ${styles.inputDisabled}`} type="text" value={tenant.slug} disabled />
          </div>
          <div className={styles.formRow}>
            <div className={styles.field}>
              <label className={styles.label}>Nome da escola</label>
              <input className={styles.input} type="text" value={name}
                onChange={(e) => setName(e.target.value)} required maxLength={255} autoFocus />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Plano</label>
              <select className={styles.input} value={plan} onChange={(e) => setPlan(e.target.value)}>
                {PLAN_OPTIONS.map((p) => <option key={p} value={p}>{PLAN_LABEL[p]}</option>)}
              </select>
            </div>
          </div>
          {error && <p className={styles.formError}>{error}</p>}
          <div className={styles.modalActions}>
            <button type="button" className={styles.btnSecondary} onClick={onClose} disabled={saving}>Cancelar</button>
            <button type="submit" className={styles.btnPrimary} disabled={saving || !name.trim()}>
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Confirmação de desativação ───────────────────────────────────────────────

interface DeactivateConfirmProps {
  tenant: TenantRow
  onConfirm: () => Promise<void>
  onCancel: () => void
}

function DeactivateConfirm({ tenant, onConfirm, onCancel }: DeactivateConfirmProps) {
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
          <h2 className={styles.modalTitle}>Desativar escola</h2>
          <button className={styles.modalClose} onClick={onCancel} aria-label="Fechar"><IconClose /></button>
        </div>
        <div className={styles.deleteBody}>
          <p className={styles.deleteText}>
            Desativar <strong>{tenant.name}</strong> ({tenant.slug})?
            Os alunos e gestores perderão acesso à plataforma.
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

// ─── TenantsPage ──────────────────────────────────────────────────────────────

export default function TenantsPage() {
  const [tenants, setTenants] = useState<TenantRow[]>([])
  const [meta, setMeta] = useState<Meta>({ total: 0, page: 1, limit: PAGE_SIZE })
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [showCreate, setShowCreate] = useState(false)
  const [editTarget, setEditTarget] = useState<TenantRow | null>(null)
  const [deactivateTarget, setDeactivateTarget] = useState<TenantRow | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const load = useCallback(async (p: number) => {
    setLoadError(null)
    try {
      const qs = new URLSearchParams({ page: String(p), limit: String(PAGE_SIZE) })
      const res = await api.get<{ data: TenantRow[]; meta: Meta }>(`/api/admin/tenants?${qs}`)
      setTenants(res.data)
      setMeta(res.meta)
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : 'Erro ao carregar escolas.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load(page) }, [load, page])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3500)
    return () => clearTimeout(t)
  }, [toast])

  async function handleDeactivate() {
    if (!deactivateTarget) return
    const targetName = deactivateTarget.name
    await api.delete(`/api/admin/tenants/${deactivateTarget.id}`)
    setDeactivateTarget(null)
    setToast(`${targetName} foi desativada.`)
    await load(page)
  }

  async function handleSaveCreate() {
    setShowCreate(false)
    setToast('Escola criada com sucesso!')
    await load(page)
  }

  async function handleSaveEdit() {
    setEditTarget(null)
    setToast('Escola atualizada.')
    await load(page)
  }

  function handlePageChange(newPage: number) {
    setPage(newPage)
    setLoading(true)
  }

  if (loading) {
    return <div className={styles.state}><span className={styles.stateText}>// carregando escolas...</span></div>
  }

  if (loadError) {
    return <div className={styles.state}><span className={styles.stateError}>{loadError}</span></div>
  }

  const totalPages = Math.ceil(meta.total / PAGE_SIZE)

  return (
    <div className={styles.root}>
      <header className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Escolas</h1>
          <p className={styles.pageSubtitle}>{meta.total} escola{meta.total !== 1 ? 's' : ''} cadastrada{meta.total !== 1 ? 's' : ''}</p>
        </div>
        <button className={styles.btnPrimary} onClick={() => setShowCreate(true)}>
          <IconPlus />
          Nova escola
        </button>
      </header>

      {tenants.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>Nenhuma escola</p>
          <p className={styles.emptyText}>Crie a primeira escola para começar.</p>
          <button className={styles.btnPrimary} onClick={() => setShowCreate(true)}><IconPlus />Nova escola</button>
        </div>
      ) : (
        <div className={styles.table}>
          <div className={styles.tableHead}>
            <span>Slug</span>
            <span>Nome</span>
            <span>Plano</span>
            <span>Status</span>
            <span />
          </div>
          {tenants.map((t) => (
            <div key={t.id} className={styles.tableRow}>
              <span className={styles.slug}>{t.slug}</span>
              <span className={styles.tenantName}>{t.name}</span>
              <span>
                <span className={`${styles.badge} ${styles[`plan_${t.plan}`]}`}>
                  {PLAN_LABEL[t.plan] ?? t.plan}
                </span>
              </span>
              <span>
                <span className={`${styles.badge} ${t.isActive ? styles.statusActive : styles.statusInactive}`}>
                  {t.isActive ? 'Ativa' : 'Inativa'}
                </span>
              </span>
              <div className={styles.colActions}>
                <button className={styles.actionBtn} onClick={() => setEditTarget(t)} title="Editar" aria-label={`Editar ${t.name}`}>
                  <IconEdit />
                </button>
                {t.isActive && (
                  <button className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                    onClick={() => setDeactivateTarget(t)} title="Desativar" aria-label={`Desativar ${t.name}`}>
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
          <button className={styles.pageBtn} onClick={() => handlePageChange(page - 1)} disabled={page === 1} aria-label="Anterior">
            <IconChevronLeft />
          </button>
          <span className={styles.pageInfo}>{page} / {totalPages}</span>
          <button className={styles.pageBtn} onClick={() => handlePageChange(page + 1)} disabled={page === totalPages} aria-label="Próxima">
            <IconChevronRight />
          </button>
        </div>
      )}

      {showCreate && <CreateModal onClose={() => setShowCreate(false)} onSave={handleSaveCreate} />}
      {editTarget && <EditModal tenant={editTarget} onClose={() => setEditTarget(null)} onSave={handleSaveEdit} />}
      {deactivateTarget && (
        <DeactivateConfirm
          tenant={deactivateTarget}
          onConfirm={handleDeactivate}
          onCancel={() => setDeactivateTarget(null)}
        />
      )}

      {toast && <div className={styles.toast} role="status">{toast}</div>}
    </div>
  )
}
