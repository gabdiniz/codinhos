import { useEffect, useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api, ApiError } from '../../lib/api.ts'
import styles from './ProfessorDetailPage.module.css'

interface UserDetail {
  id: string
  name: string
  email: string
  role: string
  isActive: boolean
}
interface ClassItem {
  id: string
  name: string
  studentsCount: number
}

export default function ProfessorDetailPage() {
  const { slug, userId } = useParams<{ slug: string; userId: string }>()
  const [user, setUser] = useState<UserDetail | null>(null)
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [assigned, setAssigned] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!slug || !userId) return
    setLoadError(null)
    try {
      const [uRes, cRes, aRes] = await Promise.all([
        api.get<{ data: { user: UserDetail } }>(`/api/${slug}/users/${userId}`),
        api.get<{ data: ClassItem[] }>(`/api/${slug}/classes`),
        api.get<{ data: string[] }>(`/api/${slug}/teachers/${userId}/classes`),
      ])
      setUser(uRes.data.user)
      setClasses(cRes.data)
      setAssigned(new Set(aRes.data))
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : 'Erro ao carregar professor.')
    } finally {
      setLoading(false)
    }
  }, [slug, userId])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(t)
  }, [toast])

  async function toggle(classId: string, isAssigned: boolean) {
    if (!slug || !userId) return
    setBusy(classId)
    try {
      if (isAssigned) {
        await api.delete(`/api/${slug}/classes/${classId}/teachers/${userId}`)
        setAssigned((prev) => { const n = new Set(prev); n.delete(classId); return n })
        setToast('Professor removido da turma.')
      } else {
        await api.post(`/api/${slug}/classes/${classId}/teachers`, { teacherId: userId })
        setAssigned((prev) => new Set(prev).add(classId))
        setToast('Professor atribuído à turma.')
      }
    } catch (err) {
      setToast(err instanceof ApiError ? err.message : 'Erro ao atualizar vínculo.')
    } finally {
      setBusy(null)
    }
  }

  if (loading) return <div className={styles.state}><span className={styles.stateText}>// carregando...</span></div>
  if (loadError || !user) return <div className={styles.state}><span className={styles.stateError}>{loadError ?? 'Professor não encontrado.'}</span></div>

  const assignedCount = classes.filter((c) => assigned.has(c.id)).length

  return (
    <div className={styles.root}>
      <Link to={`/${slug}/manager/professors`} className={styles.backLink}>← Professores</Link>
      <header className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>{user.name}</h1>
          <p className={styles.pageSubtitle}>{user.email} · {assignedCount} {assignedCount === 1 ? 'turma' : 'turmas'}</p>
        </div>
        <span className={`${styles.badge} ${user.isActive ? styles.badgeActive : styles.badgeInactive}`}>
          {user.isActive ? 'Ativo' : 'Inativo'}
        </span>
      </header>

      <h2 className={styles.sectionTitle}>Turmas</h2>
      <p className={styles.sectionHint}>Marque as turmas que este professor acompanha. Ele só enxerga as turmas atribuídas.</p>

      {classes.length === 0 ? (
        <div className={styles.empty}>Nenhuma turma criada ainda. Crie turmas para poder atribuí-las.</div>
      ) : (
        <div className={styles.list}>
          {classes.map((c) => {
            const isAssigned = assigned.has(c.id)
            return (
              <div key={c.id} className={styles.row}>
                <div className={styles.info}>
                  <span className={styles.name}>{c.name}</span>
                  <span className={styles.meta}>{c.studentsCount} {c.studentsCount === 1 ? 'aluno' : 'alunos'}</span>
                </div>
                <button
                  className={isAssigned ? styles.btnRemove : styles.btnAssign}
                  onClick={() => toggle(c.id, isAssigned)}
                  disabled={busy === c.id}
                >
                  {busy === c.id ? '…' : isAssigned ? 'Remover' : 'Atribuir'}
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
