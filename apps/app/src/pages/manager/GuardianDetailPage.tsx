import { useEffect, useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api, ApiError } from '../../lib/api.ts'
import styles from './GuardianDetailPage.module.css'

interface UserDetail { id: string; name: string; email: string; role: string; isActive: boolean }
interface StudentOption { id: string; name: string; email: string }

export default function GuardianDetailPage() {
  const { slug, guardianId } = useParams<{ slug: string; guardianId: string }>()
  const [guardian, setGuardian] = useState<UserDetail | null>(null)
  const [students, setStudents] = useState<StudentOption[]>([])
  const [linked, setLinked] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!slug || !guardianId) return
    setLoadError(null)
    try {
      const [gRes, sRes, lRes] = await Promise.all([
        api.get<{ data: { user: UserDetail } }>(`/api/${slug}/users/${guardianId}`),
        api.get<{ data: StudentOption[] }>(`/api/${slug}/users?role=student&limit=200`),
        api.get<{ data: StudentOption[] }>(`/api/${slug}/guardians/${guardianId}/students`),
      ])
      setGuardian(gRes.data.user)
      setStudents(sRes.data)
      setLinked(new Set(lRes.data.map((s) => s.id)))
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : 'Erro ao carregar responsável.')
    } finally {
      setLoading(false)
    }
  }, [slug, guardianId])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(t)
  }, [toast])

  async function toggle(studentId: string, isLinked: boolean) {
    if (!slug || !guardianId) return
    setBusy(studentId)
    try {
      if (isLinked) {
        await api.delete(`/api/${slug}/guardians/${guardianId}/students/${studentId}`)
        setLinked((prev) => { const n = new Set(prev); n.delete(studentId); return n })
        setToast('Filho desvinculado.')
      } else {
        await api.post(`/api/${slug}/guardians/${guardianId}/students`, { studentId })
        setLinked((prev) => new Set(prev).add(studentId))
        setToast('Filho vinculado.')
      }
    } catch (err) {
      setToast(err instanceof ApiError ? err.message : 'Erro ao atualizar vínculo.')
    } finally {
      setBusy(null)
    }
  }

  if (loading) return <div className={styles.state}><span className={styles.stateText}>// carregando...</span></div>
  if (loadError || !guardian) return <div className={styles.state}><span className={styles.stateError}>{loadError ?? 'Responsável não encontrado.'}</span></div>

  const linkedCount = linked.size
  const filtered = students.filter((s) => {
    const q = search.trim().toLowerCase()
    return !q || s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q)
  })

  return (
    <div className={styles.root}>
      <Link to={`/${slug}/manager/guardians`} className={styles.backLink}>← Responsáveis</Link>
      <header className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>{guardian.name}</h1>
          <p className={styles.pageSubtitle}>{guardian.email} · {linkedCount} {linkedCount === 1 ? 'filho' : 'filhos'}</p>
        </div>
        <span className={`${styles.badge} ${guardian.isActive ? styles.badgeActive : styles.badgeInactive}`}>
          {guardian.isActive ? 'Ativo' : 'Inativo'}
        </span>
      </header>

      <h2 className={styles.sectionTitle}>Filhos</h2>
      <p className={styles.sectionHint}>Marque os alunos que este responsável acompanha.</p>
      <input className={styles.search} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar aluno por nome ou e-mail…" />

      {filtered.length === 0 ? (
        <div className={styles.empty}>Nenhum aluno encontrado.</div>
      ) : (
        <div className={styles.list}>
          {filtered.map((s) => {
            const isLinked = linked.has(s.id)
            return (
              <div key={s.id} className={styles.row}>
                <div className={styles.info}>
                  <span className={styles.name}>{s.name}</span>
                  <span className={styles.email}>{s.email}</span>
                </div>
                <button
                  className={isLinked ? styles.btnRemove : styles.btnAssign}
                  onClick={() => toggle(s.id, isLinked)}
                  disabled={busy === s.id}
                >
                  {busy === s.id ? '…' : isLinked ? 'Remover' : 'Vincular'}
                </button>
              </div>
            )
          })}
        </div>
      )}

      {toast && <div className={styles.toast}>{toast}</div>}
    </div>
  )
}
