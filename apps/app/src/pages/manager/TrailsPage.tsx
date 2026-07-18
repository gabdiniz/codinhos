import { useEffect, useMemo, useState, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
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
      // Marca localmente como ativada (sai da lista de disponíveis) e atualiza
      // a lista de fundo — sem fechar o modal, para ativar várias em sequência.
      setItems((prev) => prev.map((t) => (t.id === trailId ? { ...t, activated: true } : t)))
      onActivated()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao ativar trilha.')
    } finally {
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

interface OwnTrail {
  id: string
  slug: string
  title: string
  description: string | null
  language: Language
  order: number
}

function CreateTrailModal({ onClose }: { onClose: () => void }) {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [language, setLanguage] = useState<Language>('javascript')
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!slug) return
    setSaving(true); setError(null)
    try {
      const res = await api.post<{ data: { trail: { id: string } } }>(`/api/${slug}/authoring/trails`, {
        title: title.trim(),
        language,
        description: description.trim() || undefined,
      })
      navigate(`/${slug}/manager/trails/edit/${res.data.trail.id}`)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao criar trilha.')
      setSaving(false)
    }
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose} role="dialog" aria-modal="true">
      <form className={styles.modal} onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Criar trilha própria</h2>
          <button type="button" className={styles.modalClose} onClick={onClose} aria-label="Fechar">×</button>
        </div>
        <div className={styles.modalBody}>
          <label className={styles.formLabel}>Título
            <input className={styles.formInput} value={title} onChange={(e) => setTitle(e.target.value)} required autoFocus placeholder="Ex.: Lógica com JavaScript" />
            <small className={styles.hint}>Nome da trilha que o aluno vê na lista.</small>
          </label>
          <label className={styles.formLabel}>Linguagem
            <select className={styles.formInput} value={language} onChange={(e) => setLanguage(e.target.value as Language)}>
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
            </select>
            <small className={styles.hint}>Linguagem dos desafios desta trilha.</small>
          </label>
          <label className={styles.formLabel}>Descrição (opcional)
            <textarea className={styles.formInput} value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Ex.: Primeiros passos em programação, com variáveis e condições." />
            <small className={styles.hint}>Texto curto que resume a trilha.</small>
          </label>
          {error && <p className={styles.formError}>{error}</p>}
          <div className={styles.formActions}>
            <button type="button" className={styles.btnGhost} onClick={onClose}>Cancelar</button>
            <button type="submit" className={styles.btnPrimary} disabled={saving}>{saving ? 'Criando...' : 'Criar e editar'}</button>
          </div>
        </div>
      </form>
    </div>
  )
}

function ManualModal({ onClose }: { onClose: () => void }) {
  return (
    <div className={styles.modalOverlay} onClick={onClose} role="dialog" aria-modal="true">
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Como montar uma trilha</h2>
          <button type="button" className={styles.modalClose} onClick={onClose} aria-label="Fechar">×</button>
        </div>
        <div className={styles.modalBody}>
          <div className={styles.manual}>
            <p><strong>Trilha</strong> é um curso — ex.: <em>"Lógica com JavaScript"</em>. Ela é dividida em módulos.</p>
            <p><strong>Módulo</strong> é uma lição: tem um <em>conceito</em> (a teoria), um <em>código de exemplo</em> e o <em>vocabulário</em> ensinado. Ex.: <em>"Variáveis"</em>. Cada módulo tem um ou mais desafios.</p>
            <p><strong>Desafio</strong> é o exercício prático: o aluno escreve código no editor e o sistema corrige automaticamente pelos <em>casos de teste</em>.</p>
            <p><strong>Casos de teste</strong> — o coração da correção. O aluno escreve uma função; para cada caso, o sistema chama a função com o <code>input</code> e compara o retorno com o <code>esperado</code>. Escreva os dois em <strong>JSON</strong>:</p>
            <ul className={styles.manualList}>
              <li>Função que soma dois números → input <code>[2, 3]</code>, esperado <code>5</code></li>
              <li>Função que deixa em maiúsculas → input <code>["oi"]</code>, esperado <code>"OI"</code></li>
              <li>Texto entre aspas; números e listas sem aspas.</li>
            </ul>
            <p><strong>Vocabulário</strong> são os termos (ex.: <code>let</code>, <code>const</code>, <code>if</code>) que o autocomplete do aluno vai sugerir — só o que já foi ensinado até aquele módulo.</p>
            <p className={styles.manualFlow}><strong>Fluxo:</strong> Criar trilha → adicionar módulos → adicionar desafios → a trilha já fica ativa → <em>Atribuir à turma</em> → o aluno aprende.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function TrailsPage() {
  const { slug } = useParams<{ slug: string }>()
  const [trails, setTrails] = useState<TenantTrail[]>([])
  const [ownTrails, setOwnTrails] = useState<OwnTrail[]>([])
  const [createOpen, setCreateOpen] = useState(false)
  const [manualOpen, setManualOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [removing, setRemoving] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [dragId, setDragId] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!slug) return
    setLoadError(null)
    try {
      const [res, ownRes] = await Promise.all([
        api.get<{ data: TenantTrail[] }>(`/api/${slug}/trails`),
        api.get<{ data: OwnTrail[] }>(`/api/${slug}/authoring/trails`),
      ])
      setTrails(res.data)
      setOwnTrails(ownRes.data)
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

  // ── Reordenação por arrastar e soltar ──
  async function persistOrder(next: TenantTrail[], prev: TenantTrail[]) {
    if (!slug) return
    // Renormaliza todas para order 1..n (1-based, igual à ativação). Evita empates,
    // já que a listagem do gestor ordena só por order, sem desempate.
    const changed = next.filter((t, i) => t.order !== i + 1 || prev[i]?.id !== t.id)
    try {
      await Promise.all(
        changed.map((t) =>
          api.patch(`/api/${slug}/trails/${t.id}/order`, {
            order: next.findIndex((x) => x.id === t.id) + 1,
          }),
        ),
      )
      setTrails(next.map((t, i) => ({ ...t, order: i + 1 })))
      setToast('Ordem atualizada.')
    } catch (err) {
      setToast(err instanceof ApiError ? err.message : 'Erro ao reordenar.')
      setTrails(prev) // rollback otimista
    }
  }

  function reorder(fromId: string, toId: string) {
    if (fromId === toId) return
    const from = trails.findIndex((t) => t.id === fromId)
    const to = trails.findIndex((t) => t.id === toId)
    if (from < 0 || to < 0) return
    const prev = trails
    const next = [...trails]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved!)
    setTrails(next)
    void persistOrder(next, prev)
  }

  async function deleteOwn(trailId: string) {
    if (!slug) return
    setRemoving(trailId)
    try {
      await api.delete(`/api/${slug}/authoring/trails/${trailId}`)
      setToast('Trilha removida.')
      await load()
    } catch (err) {
      setToast(err instanceof ApiError ? err.message : 'Erro ao remover.')
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
        <>
          {trails.length > 1 && (
            <p className={styles.reorderHint}>// arraste os cards para reordenar as trilhas</p>
          )}
          <div className={styles.grid}>
            {trails.map((t) => (
              <div
                key={t.id}
                className={`${styles.card} ${styles.cardDraggable} ${dragId === t.id ? styles.cardDragging : ''} ${overId === t.id && dragId !== t.id ? styles.cardDragOver : ''}`}
                draggable
                onDragStart={() => setDragId(t.id)}
                onDragEnter={() => { if (dragId && dragId !== t.id) setOverId(t.id) }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); if (dragId) reorder(dragId, t.id); setDragId(null); setOverId(null) }}
                onDragEnd={() => { setDragId(null); setOverId(null) }}
              >
                <div className={styles.cardHead}>
                  <h2 className={styles.cardTitle}>
                    <span className={styles.dragHandle} aria-hidden="true">⠿</span>
                    {t.title}
                  </h2>
                  <span className={styles.badge}>{LANG_LABEL[t.language]}</span>
                </div>
                {t.description && <p className={styles.cardDesc}>{t.description}</p>}
                <button className={styles.btnDanger} onClick={() => deactivate(t.id)} disabled={removing === t.id}>
                  {removing === t.id ? 'Desativando...' : 'Desativar'}
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── Minhas trilhas (autoria própria) ── */}
      <div className={styles.ownHeader}>
        <div className={styles.ownHeaderTitle}>
          <h2 className={styles.sectionTitle}>Minhas trilhas</h2>
          <button type="button" className={styles.helpBtn} onClick={() => setManualOpen(true)}>Como funciona?</button>
        </div>
        <button className={styles.btnPrimary} onClick={() => setCreateOpen(true)}>+ Criar trilha própria</button>
      </div>
      {ownTrails.length === 0 ? (
        <div className={styles.emptyInline}>Nenhuma trilha própria ainda. Crie trilhas exclusivas da sua escola.</div>
      ) : (
        <div className={styles.grid}>
          {ownTrails.map((t) => (
            <div key={t.id} className={styles.card}>
              <div className={styles.cardHead}>
                <h3 className={styles.cardTitle}>{t.title}</h3>
                <span className={styles.badge}>{LANG_LABEL[t.language]}</span>
              </div>
              {t.description && <p className={styles.cardDesc}>{t.description}</p>}
              <div className={styles.ownActions}>
                <Link to={`/${slug}/manager/trails/edit/${t.id}`} className={styles.btnEdit}>Editar conteúdo</Link>
                <button className={styles.btnDanger} onClick={() => deleteOwn(t.id)} disabled={removing === t.id}>Excluir</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {manualOpen && <ManualModal onClose={() => setManualOpen(false)} />}
      {createOpen && <CreateTrailModal onClose={() => setCreateOpen(false)} />}
      {modalOpen && (
        <ActivateModal onClose={() => setModalOpen(false)} onActivated={() => { setToast('Trilha ativada.'); load() }} />
      )}
      {toast && <div className={styles.toast}>{toast}</div>}
    </div>
  )
}
