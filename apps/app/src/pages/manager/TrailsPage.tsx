import { useEffect, useMemo, useState, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { api, ApiError } from '../../lib/api.ts'
import styles from './TrailsPage.module.css'

type Language = 'javascript' | 'python'

interface TenantTrail {
  id: string
  slug: string
  title: string
  description: string | null
  language: Language
  order: number
}

interface AvailableTrail {
  id: string
  slug: string
  title: string
  description: string | null
  language: Language
  activated: boolean
}

const LANG_LABEL: Record<Language, string> = { javascript: 'JavaScript', python: 'Python' }

// ─── Modal: ativar trilha do catálogo ─────────────────────────────────────────

function ActivateModal({ onClose, onActivated }: { onClose: () => void; onActivated: () => void }) {
  const { slug } = useParams<{ slug: string }>()
  const [items, setItems] = useState<AvailableTrail[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [addingId, setAddingId] = useState<string | null>(null)

  useEffect(() => {
    if (!slug) return
    let active = true
    api
      .get<{ data: AvailableTrail[] }>(`/api/${slug}/trails/available`)
      .then((res) => { if (active) setItems(res.data) })
      .catch((err) => { if (active) setError(err instanceof ApiError ? err.message : 'Erro ao carregar catálogo.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [slug])

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [onClose])

  const available = useMemo(() => items.filter((t) => !t.activated), [items])

  async function activate(trailId: string) {
    if (!slug) return
    setAddingId(trailId)
    setError(null)
    try {
      await api.post(`/api/${slug}/trails`, { trailId })
      onActivated()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao ativar trilha.')
      setAddingId(null)
    }
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose} role="dialog" aria-modal="true">
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Ativar trilha do catálogo</h2>
          <button className={styles.modalClose} onClick={onClose} aria-label="Fechar">×</button>
        </div>
        <div className={styles.modalBody}>
          {error && <p className={styles.formError}>{error}</p>}
          {loading ? (
            <p className={styles.stateText}>// carregando catálogo...</p>
          ) : available.length === 0 ? (
            <p className={styles.stateText}>Todas as trilhas do catálogo já estão ativadas.</p>
          ) : (
            <ul className={styles.candidateList}>
              {available.map((t) => (
                <li key={t.id} className={styles.candidateRow}>
                  <div className={styles.candidateInfo}>
                    <span className={styles.candidateName}>{t.title}</span>
                    <span className={styles.candidateMeta}>{LANG_LABEL[t.language]}{t.description ? ` · ${t.description}` : ''}</span>
                  </div>
                  <button className={styles.btnPrimarySm} onClick={() => activate(t.id)} disabled={addingId !== null}>
                    {addingId === t.id ? 'Ativando...' : 'Ativar'}
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

// ─── TrailsPage ───────────────────────────────────────────────────────────────

export default function TrailsPage() {
  const { slug } = useParams<{ slug: string }>()
  const [trails, setTrails] = useState<TenantTrail[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [removing, setRemoving] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!slug) return
    setLoadError(null)
    try {
      const res = await api.get<{ data: TenantTrail[] }>(`/api/${slug}/trails`)
      setTrails(res.data)
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : 'Erro ao carregar trilhas.')
    } finally {
      setLoading(false)
    }
  }, [slug])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(t)
  }, [toast])

  async function deactivate(trailId: string) {
    if (!slug) return
    setRemoving(trailId)
    try {
      await api.delete(`/api/${slug}/trails/${trailId}`)
      setToast('Trilha desativada.')
      await load()
    } catch (err) {
      setToast(err instanceof ApiError ? err.message : 'Erro ao desativar.')
    } finally {
      setRemoving(null)
    }
  }

  if (loading) return <div className={styles.state}><span className={styles.stateText}>// carregando trilhas...</span></div>
  if (loadError) return <div className={styles.state}><span className={styles.stateError}>{loadError}</span></div>

  return (
    <div className={styles.root}>
      <header className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Trilhas</h1>
          <p className={styles.pageSubtitle}>{trails.length} {trails.length === 1 ? 'trilha ativada' : 'trilhas ativadas'} na escola</p>
        </div>
        <button className={styles.btnPrimary} onClick={() => setModalOpen(true)}>+ Ativar trilha</button>
      </header>

      {trails.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>Nenhuma trilha ativada</p>
          <p className={styles.emptyText}>Ative trilhas do catálogo para poder atribuí-las às turmas.</p>
          <button className={styles.btnPrimary} onClick={() => setModalOpen(true)}>+ Ativar trilha</button>
        </div>
      ) : (
        <div className={styles.grid}>
          {trails.map((t) => (
            <div key={t.id} className={styles.card}>
              <div className={styles.cardHead}>
                <h2 className={styles.cardTitle}>{t.title}</h2>
                <span className={styles.badge}>{LANG_LABEL[t.language]}</span>
              </div>
              {t.description && <p className={styles.cardDesc}>{t.description}</p>}
              <button className={styles.btnDanger} onClick={() => deactivate(t.id)} disabled={removing === t.id}>
                {removing === t.id ? 'Desativando...' : 'Desativar'}
              </button>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <ActivateModal onClose={() => setModalOpen(false)} onActivated={() => { setModalOpen(false); setToast('Trilha ativada.'); load() }} />
      )}
      {toast && <div className={styles.toast}>{toast}</div>}
    </div>
  )
}
