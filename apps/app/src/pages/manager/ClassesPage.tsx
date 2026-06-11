import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { api, ApiError } from '../../lib/api.ts'
import styles from './ClassesPage.module.css'

// ─── Tipos ────────────────────────────────────────────────────────────────────

type ProgressionMode = 'free' | 'sequential' | 'controlled'
type ValidationMode = 'auto' | 'auto_review' | 'manual'

interface ClassRow {
  id: string
  name: string
  progressionMode: ProgressionMode
  validationMode: ValidationMode
  showRanking: boolean
  studentsCount: number
  createdAt: string
}

interface ClassFormData {
  name: string
  progressionMode: ProgressionMode
  validationMode: ValidationMode
  showRanking: boolean
}

// ─── Labels ───────────────────────────────────────────────────────────────────

const PROGRESSION_LABEL: Record<ProgressionMode, string> = {
  free:       'Livre',
  sequential: 'Sequencial',
  controlled: 'Controlada',
}

const VALIDATION_LABEL: Record<ValidationMode, string> = {
  auto:        'Automática',
  auto_review: 'Auto + Revisão',
  manual:      'Manual',
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

function IconUsers() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

// ─── Modal criar/editar ───────────────────────────────────────────────────────

const DEFAULT_FORM: ClassFormData = {
  name: '',
  progressionMode: 'sequential',
  validationMode: 'auto',
  showRanking: true,
}

interface ClassModalProps {
  initial: ClassFormData | null
  onClose: () => void
  onSave: (data: ClassFormData) => Promise<void>
}

function ClassModal({ initial, onClose, onSave }: ClassModalProps) {
  const [form, setForm] = useState<ClassFormData>(initial ?? DEFAULT_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const firstInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { firstInputRef.current?.focus() }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    setError(null)
    try {
      await onSave(form)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao salvar turma.')
      setSaving(false)
    }
  }

  const isEdit = initial !== null

  return (
    <div className={styles.modalOverlay} onClick={onClose} aria-modal="true" role="dialog">
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>{isEdit ? 'Editar turma' : 'Nova turma'}</h2>
          <button className={styles.modalClose} onClick={onClose} aria-label="Fechar"><IconClose /></button>
        </div>

        <form className={styles.modalForm} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="class-name">Nome da turma</label>
            <input
              id="class-name"
              ref={firstInputRef}
              className={styles.input}
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Ex: Turma A — 6º ano"
              maxLength={255}
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="progression-mode">Modo de progressão</label>
            <select
              id="progression-mode"
              className={styles.select}
              value={form.progressionMode}
              onChange={(e) => setForm((f) => ({ ...f, progressionMode: e.target.value as ProgressionMode }))}
            >
              <option value="free">Livre — aluno acessa qualquer módulo</option>
              <option value="sequential">Sequencial — módulos em ordem</option>
              <option value="controlled">Controlada — gestor libera manualmente</option>
            </select>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="validation-mode">Validação de submissões</label>
            <select
              id="validation-mode"
              className={styles.select}
              value={form.validationMode}
              onChange={(e) => setForm((f) => ({ ...f, validationMode: e.target.value as ValidationMode }))}
            >
              <option value="auto">Automática — corrigida pelos testes</option>
              <option value="auto_review">Auto + Revisão — testa e aguarda aprovação</option>
              <option value="manual">Manual — gestor corrige todas</option>
            </select>
          </div>

          <div className={styles.checkboxField}>
            <input
              id="show-ranking"
              type="checkbox"
              className={styles.checkbox}
              checked={form.showRanking}
              onChange={(e) => setForm((f) => ({ ...f, showRanking: e.target.checked }))}
            />
            <label htmlFor="show-ranking" className={styles.checkboxLabel}>
              Mostrar ranking para os alunos
            </label>
          </div>

          {error && <p className={styles.formError}>{error}</p>}

          <div className={styles.modalActions}>
            <button type="button" className={styles.btnSecondary} onClick={onClose} disabled={saving}>
              Cancelar
            </button>
            <button type="submit" className={styles.btnPrimary} disabled={saving || !form.name.trim()}>
              {saving ? 'Salvando...' : isEdit ? 'Salvar alterações' : 'Criar turma'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Confirmação de exclusão ──────────────────────────────────────────────────

interface DeleteConfirmProps {
  className: string
  onConfirm: () => Promise<void>
  onCancel: () => void
}

function DeleteConfirm({ className, onConfirm, onCancel }: DeleteConfirmProps) {
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onCancel])

  async function handleConfirm() {
    setDeleting(true)
    setError(null)
    try {
      await onConfirm()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao excluir turma.')
      setDeleting(false)
    }
  }

  return (
    <div className={styles.modalOverlay} onClick={onCancel} aria-modal="true" role="dialog">
      <div className={`${styles.modal} ${styles.modalSm}`} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Excluir turma</h2>
          <button className={styles.modalClose} onClick={onCancel} aria-label="Fechar"><IconClose /></button>
        </div>
        <div className={styles.deleteBody}>
          <p className={styles.deleteText}>
            Tem certeza que deseja excluir a turma <strong>{className}</strong>?
            Esta ação não pode ser desfeita.
          </p>
          {error && <p className={styles.formError}>{error}</p>}
          <div className={styles.modalActions}>
            <button className={styles.btnSecondary} onClick={onCancel} disabled={deleting}>
              Cancelar
            </button>
            <button className={styles.btnDanger} onClick={handleConfirm} disabled={deleting}>
              {deleting ? 'Excluindo...' : 'Sim, excluir'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── ClassesPage ──────────────────────────────────────────────────────────────

export default function ClassesPage() {
  const { slug } = useParams<{ slug: string }>()
  const [classes, setClasses] = useState<ClassRow[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [modalState, setModalState] = useState<
    null | { mode: 'create' } | { mode: 'edit'; id: string; data: ClassFormData }
  >(null)

  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)

  const load = useCallback(async () => {
    if (!slug) return
    setLoadError(null)
    try {
      const res = await api.get<{ data: ClassRow[] }>(`/api/${slug}/classes`)
      setClasses(res.data)
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : 'Erro ao carregar turmas.')
    } finally {
      setLoading(false)
    }
  }, [slug])

  useEffect(() => { load() }, [load])

  async function handleSave(data: ClassFormData) {
    if (!slug) return
    if (modalState?.mode === 'edit') {
      await api.patch(`/api/${slug}/classes/${modalState.id}`, data)
    } else {
      await api.post(`/api/${slug}/classes`, data)
    }
    setModalState(null)
    await load()
  }

  async function handleDelete() {
    if (!slug || !deleteTarget) return
    await api.delete(`/api/${slug}/classes/${deleteTarget.id}`)
    setDeleteTarget(null)
    await load()
  }

  function openEdit(cls: ClassRow) {
    setModalState({
      mode: 'edit',
      id: cls.id,
      data: {
        name: cls.name,
        progressionMode: cls.progressionMode,
        validationMode: cls.validationMode,
        showRanking: cls.showRanking,
      },
    })
  }

  if (loading) {
    return (
      <div className={styles.state}>
        <span className={styles.stateText}>// carregando turmas...</span>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className={styles.state}>
        <span className={styles.stateError}>{loadError}</span>
      </div>
    )
  }

  return (
    <div className={styles.root}>
      {/* ── Header ── */}
      <header className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Turmas</h1>
          <p className={styles.pageSubtitle}>
            {classes.length} turma{classes.length !== 1 ? 's' : ''} cadastrada{classes.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button className={styles.btnPrimary} onClick={() => setModalState({ mode: 'create' })}>
          <IconPlus />
          Nova turma
        </button>
      </header>

      {/* ── Lista ── */}
      {classes.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>Nenhuma turma ainda</p>
          <p className={styles.emptyText}>Crie a primeira turma para começar.</p>
          <button className={styles.btnPrimary} onClick={() => setModalState({ mode: 'create' })}>
            <IconPlus />
            Nova turma
          </button>
        </div>
      ) : (
        <div className={styles.table}>
          <div className={styles.tableHead}>
            <span className={styles.colName}>Turma</span>
            <span className={styles.colBadge}>Progressão</span>
            <span className={styles.colBadge}>Validação</span>
            <span className={styles.colMeta}>Alunos</span>
            <span className={styles.colActions} />
          </div>

          {classes.map((cls) => (
            <div key={cls.id} className={styles.tableRow}>
              <div className={styles.colName}>
                <span className={styles.className}>{cls.name}</span>
                {cls.showRanking && <span className={styles.rankingBadge}>ranking</span>}
              </div>

              <div className={styles.colBadge}>
                <span className={`${styles.badge} ${styles[`badge_${cls.progressionMode}`]}`}>
                  {PROGRESSION_LABEL[cls.progressionMode]}
                </span>
              </div>

              <div className={styles.colBadge}>
                <span className={`${styles.badge} ${styles[`badge_${cls.validationMode}`]}`}>
                  {VALIDATION_LABEL[cls.validationMode]}
                </span>
              </div>

              <div className={`${styles.colMeta} ${styles.studentCount}`}>
                <IconUsers />
                {cls.studentsCount}
              </div>

              <div className={styles.colActions}>
                <button
                  className={styles.actionBtn}
                  onClick={() => openEdit(cls)}
                  aria-label={`Editar ${cls.name}`}
                  title="Editar"
                >
                  <IconEdit />
                </button>
                <button
                  className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                  onClick={() => setDeleteTarget({ id: cls.id, name: cls.name })}
                  aria-label={`Excluir ${cls.name}`}
                  title="Excluir"
                >
                  <IconTrash />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Modais ── */}
      {modalState !== null && (
        <ClassModal
          initial={modalState.mode === 'edit' ? modalState.data : null}
          onClose={() => setModalState(null)}
          onSave={handleSave}
        />
      )}

      {deleteTarget !== null && (
        <DeleteConfirm
          className={deleteTarget.name}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}
