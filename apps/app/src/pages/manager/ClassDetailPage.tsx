import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api, ApiError } from '../../lib/api.ts'
import styles from './ClassDetailPage.module.css'

// ─── Tipos ────────────────────────────────────────────────────────────────────

type ProgressionMode = 'free' | 'sequential' | 'controlled'
type ValidationMode = 'auto' | 'auto_review' | 'manual'

interface ClassDetail {
  id: string
  name: string
  progressionMode: ProgressionMode
  validationMode: ValidationMode
  showRanking: boolean
  createdAt: string
}

interface ClassStudent {
  id: string
  name: string
  email: string
  avatarUrl: string | null
  isActive: boolean
}

interface AvailableStudent {
  id: string
  name: string
  email: string
  role: string
  isActive: boolean
  createdAt: string
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

function IconArrowLeft() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
    </svg>
  )
}

function IconPlus() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
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

function IconSearch() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function Avatar({ name }: { name: string }) {
  return <div className={styles.avatar}>{initials(name)}</div>
}

// ─── Modal: adicionar aluno ───────────────────────────────────────────────────

interface AddStudentModalProps {
  excludeIds: Set<string>
  onClose: () => void
  onAdd: (studentId: string) => Promise<void>
}

function AddStudentModal({ excludeIds, onClose, onAdd }: AddStudentModalProps) {
  const { slug } = useParams<{ slug: string }>()
  const [candidates, setCandidates] = useState<AvailableStudent[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [addingId, setAddingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => { searchRef.current?.focus() }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  useEffect(() => {
    if (!slug) return
    let active = true
    setLoading(true)
    api
      .get<{ data: AvailableStudent[] }>(`/api/${slug}/users?role=student&limit=100`)
      .then((res) => { if (active) setCandidates(res.data) })
      .catch((err) => {
        if (active) setLoadError(err instanceof ApiError ? err.message : 'Erro ao carregar alunos.')
      })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [slug])

  const available = useMemo(() => {
    const term = search.trim().toLowerCase()
    return candidates
      .filter((s) => !excludeIds.has(s.id))
      .filter((s) => !term || s.name.toLowerCase().includes(term) || s.email.toLowerCase().includes(term))
  }, [candidates, excludeIds, search])

  async function handleAdd(studentId: string) {
    setAddingId(studentId)
    setError(null)
    try {
      await onAdd(studentId)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao adicionar aluno.')
      setAddingId(null)
    }
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose} aria-modal="true" role="dialog">
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Adicionar aluno</h2>
          <button className={styles.modalClose} onClick={onClose} aria-label="Fechar"><IconClose /></button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.searchBox}>
            <IconSearch />
            <input
              ref={searchRef}
              className={styles.searchInput}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome ou e-mail..."
            />
          </div>

          {error && <p className={styles.formError}>{error}</p>}

          {loading ? (
            <div className={styles.modalState}>
              <span className={styles.stateText}>// carregando alunos...</span>
            </div>
          ) : loadError ? (
            <div className={styles.modalState}>
              <span className={styles.stateError}>{loadError}</span>
            </div>
          ) : available.length === 0 ? (
            <div className={styles.modalState}>
              <span className={styles.stateText}>
                {candidates.length === 0 ? 'Nenhum aluno cadastrado no momento.' : 'Nenhum aluno disponível encontrado.'}
              </span>
            </div>
          ) : (
            <ul className={styles.candidateList}>
              {available.map((s) => (
                <li key={s.id} className={styles.candidateRow}>
                  <Avatar name={s.name} />
                  <div className={styles.candidateInfo}>
                    <span className={styles.candidateName}>{s.name}</span>
                    <span className={styles.candidateEmail}>{s.email}</span>
                  </div>
                  <button
                    className={styles.btnPrimarySm}
                    onClick={() => handleAdd(s.id)}
                    disabled={addingId !== null}
                  >
                    {addingId === s.id ? 'Adicionando...' : 'Adicionar'}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Confirmação de remoção ───────────────────────────────────────────────────

interface RemoveConfirmProps {
  studentName: string
  onConfirm: () => Promise<void>
  onCancel: () => void
}

function RemoveConfirm({ studentName, onConfirm, onCancel }: RemoveConfirmProps) {
  const [removing, setRemoving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onCancel])

  async function handleConfirm() {
    setRemoving(true)
    setError(null)
    try {
      await onConfirm()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao remover aluno.')
      setRemoving(false)
    }
  }

  return (
    <div className={styles.modalOverlay} onClick={onCancel} aria-modal="true" role="dialog">
      <div className={`${styles.modal} ${styles.modalSm}`} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Remover aluno</h2>
          <button className={styles.modalClose} onClick={onCancel} aria-label="Fechar"><IconClose /></button>
        </div>
        <div className={styles.deleteBody}>
          <p className={styles.deleteText}>
            Remover <strong>{studentName}</strong> desta turma? O histórico de submissões e progresso é mantido.
          </p>
          {error && <p className={styles.formError}>{error}</p>}
          <div className={styles.modalActions}>
            <button className={styles.btnSecondary} onClick={onCancel} disabled={removing}>
              Cancelar
            </button>
            <button className={styles.btnDanger} onClick={handleConfirm} disabled={removing}>
              {removing ? 'Removendo...' : 'Sim, remover'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── ClassDetailPage ──────────────────────────────────────────────────────────

export default function ClassDetailPage() {
  const { slug, classId } = useParams<{ slug: string; classId: string }>()
  const [cls, setCls] = useState<ClassDetail | null>(null)
  const [students, setStudents] = useState<ClassStudent[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [addModalOpen, setAddModalOpen] = useState(false)
  const [removeTarget, setRemoveTarget] = useState<{ id: string; name: string } | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!slug || !classId) return
    setLoadError(null)
    try {
      const [detailRes, studentsRes] = await Promise.all([
        api.get<{ data: { class: ClassDetail; studentsCount: number; trailsCount: number } }>(
          `/api/${slug}/classes/${classId}`,
        ),
        api.get<{ data: ClassStudent[] }>(`/api/${slug}/classes/${classId}/students`),
      ])
      setCls(detailRes.data.class)
      setStudents(studentsRes.data)
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : 'Erro ao carregar turma.')
    } finally {
      setLoading(false)
    }
  }, [slug, classId])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 3500)
    return () => clearTimeout(timer)
  }, [toast])

  async function handleAddStudent(studentId: string) {
    if (!slug || !classId) return
    await api.post(`/api/${slug}/classes/${classId}/students`, { studentId })
    setAddModalOpen(false)
    setToast('Aluno adicionado à turma.')
    await load()
  }

  async function handleRemoveStudent() {
    if (!slug || !classId || !removeTarget) return
    await api.delete(`/api/${slug}/classes/${classId}/students/${removeTarget.id}`)
    setRemoveTarget(null)
    setToast('Aluno removido da turma.')
    await load()
  }

  const excludeIds = useMemo(() => new Set(students.map((s) => s.id)), [students])

  if (loading) {
    return (
      <div className={styles.state}>
        <span className={styles.stateText}>// carregando turma...</span>
      </div>
    )
  }

  if (loadError || !cls) {
    return (
      <div className={styles.state}>
        <span className={styles.stateError}>{loadError ?? 'Turma não encontrada.'}</span>
      </div>
    )
  }

  return (
    <div className={styles.root}>
      {/* ── Header ── */}
      <Link to={`/${slug}/manager/classes`} className={styles.backLink}>
        <IconArrowLeft />
        Turmas
      </Link>

      <header className={styles.pageHeader}>
        <div className={styles.pageHeaderInfo}>
          <h1 className={styles.pageTitle}>{cls.name}</h1>
          <div className={styles.pageBadges}>
            <span className={`${styles.badge} ${styles[`badge_${cls.progressionMode}`]}`}>
              {PROGRESSION_LABEL[cls.progressionMode]}
            </span>
            <span className={`${styles.badge} ${styles[`badge_${cls.validationMode}`]}`}>
              {VALIDATION_LABEL[cls.validationMode]}
            </span>
            {cls.showRanking && <span className={styles.rankingBadge}>ranking</span>}
          </div>
        </div>
        <button className={styles.btnPrimary} onClick={() => setAddModalOpen(true)}>
          <IconPlus />
          Adicionar aluno
        </button>
      </header>

      {/* ── Lista de alunos ── */}
      {students.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>Nenhum aluno nesta turma</p>
          <p className={styles.emptyText}>Adicione alunos para começar.</p>
          <button className={styles.btnPrimary} onClick={() => setAddModalOpen(true)}>
            <IconPlus />
            Adicionar aluno
          </button>
        </div>
      ) : (
        <div className={styles.table}>
          <div className={styles.tableHead}>
            <span className={styles.colName}>Aluno</span>
            <span className={styles.colStatus}>Status</span>
            <span className={styles.colActions} />
          </div>

          {students.map((s) => (
            <div key={s.id} className={styles.tableRow}>
              <div className={styles.colName}>
                <Avatar name={s.name} />
                <div className={styles.studentInfo}>
                  <span className={styles.studentName}>{s.name}</span>
                  <span className={styles.studentEmail}>{s.email}</span>
                </div>
              </div>

              <div className={styles.colStatus}>
                <span className={s.isActive ? styles.statusActive : styles.statusInactive}>
                  {s.isActive ? 'Ativo' : 'Inativo'}
                </span>
              </div>

              <div className={styles.colActions}>
                <button
                  className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                  onClick={() => setRemoveTarget({ id: s.id, name: s.name })}
                  aria-label={`Remover ${s.name}`}
                  title="Remover da turma"
                >
                  <IconTrash />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Modais ── */}
      {addModalOpen && (
        <AddStudentModal
          excludeIds={excludeIds}
          onClose={() => setAddModalOpen(false)}
          onAdd={handleAddStudent}
        />
      )}

      {removeTarget !== null && (
        <RemoveConfirm
          studentName={removeTarget.name}
          onConfirm={handleRemoveStudent}
          onCancel={() => setRemoveTarget(null)}
        />
      )}

      {/* ── Toast ── */}
      {toast && <div className={styles.toast}>{toast}</div>}
    </div>
  )
}
