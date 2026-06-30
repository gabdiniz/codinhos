import { useEffect, useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api, ApiError } from '../../lib/api.ts'
import styles from './GuardiansPage.module.css'

interface Guardian {
  id: string
  name: string
  email: string
  isActive: boolean
  studentsCount: number
}
interface StudentOption {
  id: string
  name: string
  email: string
}

interface StudentsMeta { total: number; page: number; limit: number }

async function fetchAllStudents(slug: string): Promise<StudentOption[]> {
  const acc: StudentOption[] = []
  let page = 1
  for (;;) {
    const res = await api.get<{ data: StudentOption[]; meta: StudentsMeta }>(
      `/api/${slug}/users?role=student&page=${page}&limit=100`,
    )
    acc.push(...res.data)
    if (res.data.length === 0 || acc.length >= res.meta.total) break
    page++
  }
  return acc
}

// ─── Modal: criar responsável ─────────────────────────────────────────────────

function CreateModal({ slug, onClose, onCreated }: { slug: string; onClose: () => void; onCreated: (name: string) => void }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [students, setStudents] = useState<StudentOption[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let active = true
    fetchAllStudents(slug)
      .then((all) => { if (active) setStudents(all) })
      .catch(() => {})
    return () => { active = false }
  }, [slug])

  function toggle(id: string) {
    setSelected((prev) => {
      const n = new Set(prev)
      if (n.has(id)) n.delete(id); else n.add(id)
      return n
    })
  }

  const filtered = students.filter((s) => {
    const q = search.trim().toLowerCase()
    return !q || s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q)
  })

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await api.post(`/api/${slug}/guardians`, {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        studentIds: [...selected],
      })
      onCreated(name.trim())
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao criar responsável.')
      setSaving(false)
    }
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose} role="dialog" aria-modal="true">
      <form className={styles.modal} onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Criar responsável</h2>
          <button type="button" className={styles.modalClose} onClick={onClose} aria-label="Fechar">×</button>
        </div>
        <div className={styles.modalBody}>
          <label className={styles.formLabel}>Nome
            <input className={styles.formInput} value={name} onChange={(e) => setName(e.target.value)} required autoFocus placeholder="Ex.: Maria Souza" />
          </label>
          <label className={styles.formLabel}>E-mail
            <input className={styles.formInput} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="maria@email.com" />
            <small className={styles.hint}>Recebe um convite por e-mail para acessar o portal do responsável.</small>
          </label>

          <div className={styles.pickerLabel}>
            Filhos <span className={styles.pickerCount}>{selected.size} selecionado{selected.size !== 1 ? 's' : ''}</span>
          </div>
          <input className={styles.pickerSearch} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar aluno por nome ou e-mail…" />
          <div className={styles.pickerList}>
            {filtered.length === 0 ? (
              <p className={styles.pickerEmpty}>Nenhum aluno encontrado.</p>
            ) : (
              filtered.map((s) => (
                <label key={s.id} className={styles.pickerItem}>
                  <input type="checkbox" checked={selected.has(s.id)} onChange={() => toggle(s.id)} />
                  <span className={styles.pickerName}>{s.name}</span>
                  <span className={styles.pickerEmail}>{s.email}</span>
                </label>
              ))
            )}
          </div>

          {error && <p className={styles.formError}>{error}</p>}
          <div className={styles.formActions}>
            <button type="button" className={styles.btnGhost} onClick={onClose}>Cancelar</button>
            <button type="submit" className={styles.btnPrimary} disabled={saving}>{saving ? 'Criando...' : 'Criar responsável'}</button>
          </div>
        </div>
      </form>
    </div>
  )
}

// ─── GuardiansPage ────────────────────────────────────────────────────────────

export default function GuardiansPage() {
  const { slug } = useParams<{ slug: string }>()
  const [guardians, setGuardians] = useState<Guardian[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!slug) return
    setLoadError(null)
    try {
      const res = await api.get<{ data: Guardian[] }>(`/api/${slug}/guardians`)
      setGuardians(res.data)
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : 'Erro ao carregar responsáveis.')
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

  if (loading) return <div className={styles.state}><span className={styles.stateText}>// carregando responsáveis...</span></div>
  if (loadError) return <div className={styles.state}><span className={styles.stateError}>{loadError}</span></div>

  return (
    <div className={styles.root}>
      <header className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Responsáveis</h1>
          <p className={styles.pageSubtitle}>{guardians.length} responsáve{guardians.length !== 1 ? 'is' : 'l'} na escola</p>
        </div>
        <button className={styles.btnPrimary} onClick={() => setCreateOpen(true)}>+ Criar responsável</button>
      </header>

      {guardians.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>Nenhum responsável ainda</p>
          <p className={styles.emptyText}>Cadastre responsáveis e vincule os filhos para que acompanhem o progresso pelo portal.</p>
          <button className={styles.btnPrimary} onClick={() => setCreateOpen(true)}>+ Criar responsável</button>
        </div>
      ) : (
        <div className={styles.list}>
          {guardians.map((g) => (
            <div key={g.id} className={styles.row}>
              <div className={styles.info}>
                <span className={styles.name}>{g.name}</span>
                <span className={styles.email}>{g.email}</span>
              </div>
              <span className={styles.countBadge}>{g.studentsCount} {g.studentsCount === 1 ? 'filho' : 'filhos'}</span>
              <span className={`${styles.badge} ${g.isActive ? styles.badgeActive : styles.badgeInactive}`}>
                {g.isActive ? 'Ativo' : 'Inativo'}
              </span>
              <Link to={`/${slug}/manager/guardians/${g.id}`} className={styles.btnEdit}>Gerenciar filhos</Link>
            </div>
          ))}
        </div>
      )}

      {createOpen && slug && (
        <CreateModal
          slug={slug}
          onClose={() => setCreateOpen(false)}
          onCreated={(name) => { setCreateOpen(false); setToast(`Responsável ${name} criado.`); load() }}
        />
      )}
      {toast && <div className={styles.toast}>{toast}</div>}
    </div>
  )
}
