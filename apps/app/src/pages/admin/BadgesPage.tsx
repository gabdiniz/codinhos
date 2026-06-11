import { useEffect, useState, useCallback, useRef } from 'react'
import { api, ApiError } from '../../lib/api.ts'
import styles from './BadgesPage.module.css'

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Badge {
  id: string
  slug: string
  name: string
  description: string | null
  iconUrl: string | null
  triggerType: string
  triggerValue: number
  createdAt: string
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const TRIGGER_OPTIONS = [
  { value: 'challenges_completed', label: 'Desafios concluídos' },
  { value: 'streak_days',          label: 'Dias consecutivos (streak)' },
  { value: 'level_reached',        label: 'Nível alcançado' },
] as const

type TriggerType = typeof TRIGGER_OPTIONS[number]['value']

const TRIGGER_LABEL: Record<string, string> = Object.fromEntries(
  TRIGGER_OPTIONS.map(({ value, label }) => [value, label]),
)

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

function IconTrash() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" /><path d="M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
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

function IconAward() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="8" r="6" />
      <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
    </svg>
  )
}

// ─── Formulário compartilhado ─────────────────────────────────────────────────

interface BadgeFormState {
  slug: string
  name: string
  description: string
  iconUrl: string
  triggerType: TriggerType
  triggerValue: string
}

const EMPTY_FORM: BadgeFormState = {
  slug: '',
  name: '',
  description: '',
  iconUrl: '',
  triggerType: 'challenges_completed',
  triggerValue: '1',
}

interface BadgeFormProps {
  initial: BadgeFormState
  slugDisabled?: boolean
  saving: boolean
  error: string | null
  onSubmit: (state: BadgeFormState) => void
  onCancel: () => void
  submitLabel: string
}

function BadgeForm({ initial, slugDisabled, saving, error, onSubmit, onCancel, submitLabel }: BadgeFormProps) {
  const [state, setState] = useState<BadgeFormState>(initial)
  const firstRef = useRef<HTMLInputElement>(null)

  useEffect(() => { firstRef.current?.focus() }, [])

  function set<K extends keyof BadgeFormState>(k: K, v: BadgeFormState[K]) {
    setState((s) => ({ ...s, [k]: v }))
  }

  const triggerValueNum = parseInt(state.triggerValue, 10)
  const canSubmit =
    !saving &&
    state.slug.trim().length >= 2 &&
    state.name.trim().length > 0 &&
    !isNaN(triggerValueNum) &&
    triggerValueNum >= 0

  return (
    <form
      className={styles.modalForm}
      onSubmit={(e) => { e.preventDefault(); onSubmit(state) }}
    >
      <div className={styles.formRow}>
        <div className={styles.field}>
          <label className={styles.label}>Slug</label>
          <input
            ref={slugDisabled ? undefined : firstRef}
            className={`${styles.input} ${slugDisabled ? styles.inputDisabled : ''}`}
            type="text"
            value={state.slug}
            onChange={(e) => set('slug', e.target.value)}
            placeholder="primeiro-desafio"
            pattern="[a-z0-9-]+"
            title="Apenas letras minúsculas, números e hífens"
            required
            disabled={slugDisabled}
            minLength={2}
            maxLength={100}
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Nome</label>
          <input
            ref={slugDisabled ? firstRef : undefined}
            className={styles.input}
            type="text"
            value={state.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="Primeiro Passo"
            required
            maxLength={255}
          />
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Descrição (opcional)</label>
        <input
          className={styles.input}
          type="text"
          value={state.description}
          onChange={(e) => set('description', e.target.value)}
          placeholder="Conclua seu primeiro desafio"
          maxLength={500}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label}>URL do ícone (opcional)</label>
        <input
          className={styles.input}
          type="url"
          value={state.iconUrl}
          onChange={(e) => set('iconUrl', e.target.value)}
          placeholder="https://cdn.exemplo.com/badge.png"
        />
      </div>

      <div className={styles.formRow}>
        <div className={styles.field}>
          <label className={styles.label}>Gatilho</label>
          <select
            className={styles.input}
            value={state.triggerType}
            onChange={(e) => set('triggerType', e.target.value as TriggerType)}
          >
            {TRIGGER_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Valor</label>
          <input
            className={styles.input}
            type="number"
            min="0"
            value={state.triggerValue}
            onChange={(e) => set('triggerValue', e.target.value)}
            required
          />
        </div>
      </div>

      {error && <p className={styles.formError}>{error}</p>}

      <div className={styles.modalActions}>
        <button type="button" className={styles.btnSecondary} onClick={onCancel} disabled={saving}>
          Cancelar
        </button>
        <button type="submit" className={styles.btnPrimary} disabled={!canSubmit}>
          {saving ? 'Salvando...' : submitLabel}
        </button>
      </div>
    </form>
  )
}

// ─── Modal de criação ─────────────────────────────────────────────────────────

interface CreateModalProps {
  onClose: () => void
  onSave: () => void
}

function CreateModal({ onClose, onSave }: CreateModalProps) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [onClose])

  async function handleSubmit(state: BadgeFormState) {
    setSaving(true)
    setError(null)
    try {
      await api.post('/api/admin/badges', {
        slug: state.slug.trim(),
        name: state.name.trim(),
        ...(state.description.trim() && { description: state.description.trim() }),
        ...(state.iconUrl.trim() && { iconUrl: state.iconUrl.trim() }),
        triggerType: state.triggerType,
        triggerValue: parseInt(state.triggerValue, 10),
      })
      onSave()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao criar badge.')
      setSaving(false)
    }
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose} aria-modal="true" role="dialog">
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Novo badge</h2>
          <button className={styles.modalClose} onClick={onClose} aria-label="Fechar"><IconClose /></button>
        </div>
        <BadgeForm
          initial={EMPTY_FORM}
          saving={saving}
          error={error}
          onSubmit={handleSubmit}
          onCancel={onClose}
          submitLabel="Criar badge"
        />
      </div>
    </div>
  )
}

// ─── Modal de edição ──────────────────────────────────────────────────────────

interface EditModalProps {
  badge: Badge
  onClose: () => void
  onSave: () => void
}

function EditModal({ badge, onClose, onSave }: EditModalProps) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [onClose])

  async function handleSubmit(state: BadgeFormState) {
    setSaving(true)
    setError(null)
    try {
      await api.patch(`/api/admin/badges/${badge.id}`, {
        name: state.name.trim(),
        ...(state.description.trim() !== (badge.description ?? '') && { description: state.description.trim() || undefined }),
        ...(state.iconUrl.trim() !== (badge.iconUrl ?? '') && { iconUrl: state.iconUrl.trim() || undefined }),
        triggerType: state.triggerType,
        triggerValue: parseInt(state.triggerValue, 10),
      })
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
          <h2 className={styles.modalTitle}>Editar badge</h2>
          <button className={styles.modalClose} onClick={onClose} aria-label="Fechar"><IconClose /></button>
        </div>
        <BadgeForm
          initial={{
            slug: badge.slug,
            name: badge.name,
            description: badge.description ?? '',
            iconUrl: badge.iconUrl ?? '',
            triggerType: badge.triggerType as TriggerType,
            triggerValue: String(badge.triggerValue),
          }}
          slugDisabled
          saving={saving}
          error={error}
          onSubmit={handleSubmit}
          onCancel={onClose}
          submitLabel="Salvar"
        />
      </div>
    </div>
  )
}

// ─── Confirmação de exclusão ──────────────────────────────────────────────────

interface DeleteConfirmProps {
  badge: Badge
  onConfirm: () => Promise<void>
  onCancel: () => void
}

function DeleteConfirm({ badge, onConfirm, onCancel }: DeleteConfirmProps) {
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
    catch (err) { setError(err instanceof ApiError ? err.message : 'Erro ao remover.'); setLoading(false) }
  }

  return (
    <div className={styles.modalOverlay} onClick={onCancel} aria-modal="true" role="dialog">
      <div className={`${styles.modal} ${styles.modalSm}`} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Remover badge</h2>
          <button className={styles.modalClose} onClick={onCancel} aria-label="Fechar"><IconClose /></button>
        </div>
        <div className={styles.deleteBody}>
          <p className={styles.deleteText}>
            Remover <strong>{badge.name}</strong>? Esta ação não poderá ser desfeita.
            Badges já concedidos a alunos não podem ser removidos.
          </p>
          {error && <p className={styles.formError}>{error}</p>}
          <div className={styles.modalActions}>
            <button className={styles.btnSecondary} onClick={onCancel} disabled={loading}>Cancelar</button>
            <button className={styles.btnDanger} onClick={handleConfirm} disabled={loading}>
              {loading ? 'Removendo...' : 'Sim, remover'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── BadgeCard ────────────────────────────────────────────────────────────────

interface BadgeCardProps {
  badge: Badge
  onEdit: () => void
  onDelete: () => void
}

function BadgeCard({ badge, onEdit, onDelete }: BadgeCardProps) {
  return (
    <article className={styles.card}>
      <div className={styles.cardIcon}>
        {badge.iconUrl
          ? <img src={badge.iconUrl} alt={badge.name} className={styles.cardIconImg} />
          : <span className={styles.cardIconDefault}><IconAward /></span>
        }
      </div>
      <div className={styles.cardBody}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardName}>{badge.name}</h3>
          <span className={styles.cardSlug}>{badge.slug}</span>
        </div>
        {badge.description && (
          <p className={styles.cardDesc}>{badge.description}</p>
        )}
        <div className={styles.cardMeta}>
          <span className={`${styles.triggerBadge} ${styles[`trigger_${badge.triggerType}`]}`}>
            {TRIGGER_LABEL[badge.triggerType] ?? badge.triggerType}
          </span>
          <span className={styles.cardValue}>≥ {badge.triggerValue}</span>
        </div>
      </div>
      <div className={styles.cardActions}>
        <button
          className={styles.actionBtn}
          onClick={onEdit}
          title="Editar"
          aria-label={`Editar ${badge.name}`}
        >
          <IconEdit />
        </button>
        <button
          className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
          onClick={onDelete}
          title="Remover"
          aria-label={`Remover ${badge.name}`}
        >
          <IconTrash />
        </button>
      </div>
    </article>
  )
}

// ─── BadgesPage ───────────────────────────────────────────────────────────────

export default function BadgesPage() {
  const [badges, setBadges] = useState<Badge[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [showCreate, setShowCreate] = useState(false)
  const [editTarget, setEditTarget] = useState<Badge | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Badge | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoadError(null)
    try {
      const res = await api.get<{ data: Badge[] }>('/api/admin/badges')
      setBadges(res.data)
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : 'Erro ao carregar badges.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3500)
    return () => clearTimeout(t)
  }, [toast])

  async function handleDelete() {
    if (!deleteTarget) return
    const targetName = deleteTarget.name
    await api.delete(`/api/admin/badges/${deleteTarget.id}`)
    setDeleteTarget(null)
    setToast(`${targetName} foi removido.`)
    await load()
  }

  async function handleSaveCreate() {
    setShowCreate(false)
    setToast('Badge criado!')
    await load()
  }

  async function handleSaveEdit() {
    setEditTarget(null)
    setToast('Badge atualizado.')
    await load()
  }

  if (loading) {
    return <div className={styles.state}><span className={styles.stateText}>// carregando badges...</span></div>
  }

  if (loadError) {
    return <div className={styles.state}><span className={styles.stateError}>{loadError}</span></div>
  }

  return (
    <div className={styles.root}>
      <header className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Badges</h1>
          <p className={styles.pageSubtitle}>{badges.length} badge{badges.length !== 1 ? 's' : ''} cadastrado{badges.length !== 1 ? 's' : ''}</p>
        </div>
        <button className={styles.btnPrimary} onClick={() => setShowCreate(true)}>
          <IconPlus />
          Novo badge
        </button>
      </header>

      {badges.length === 0 ? (
        <div className={styles.empty}>
          <span className={styles.emptyIcon}><IconAward /></span>
          <p className={styles.emptyTitle}>Nenhum badge</p>
          <p className={styles.emptyText}>Crie badges para recompensar o progresso dos alunos.</p>
          <button className={styles.btnPrimary} onClick={() => setShowCreate(true)}>
            <IconPlus />Novo badge
          </button>
        </div>
      ) : (
        <div className={styles.grid}>
          {badges.map((b) => (
            <BadgeCard
              key={b.id}
              badge={b}
              onEdit={() => setEditTarget(b)}
              onDelete={() => setDeleteTarget(b)}
            />
          ))}
        </div>
      )}

      {showCreate && <CreateModal onClose={() => setShowCreate(false)} onSave={handleSaveCreate} />}
      {editTarget && <EditModal badge={editTarget} onClose={() => setEditTarget(null)} onSave={handleSaveEdit} />}
      {deleteTarget && (
        <DeleteConfirm
          badge={deleteTarget}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {toast && <div className={styles.toast} role="status">{toast}</div>}
    </div>
  )
}
