import { useEffect, useState, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { api, ApiError } from '../../lib/api.ts'
import styles from './CatalogPage.module.css'

type Language = 'javascript' | 'python'

interface CatalogTrail {
  id: string
  slug: string
  title: string
  description: string | null
  language: Language
  order: number
}

const LANG_LABEL: Record<Language, string> = { javascript: 'JavaScript', python: 'Python' }

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100)
}

// ─── Modal: criar trilha global ───────────────────────────────────────────────

function CreateTrailModal({ onClose }: { onClose: () => void }) {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [trailSlug, setTrailSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  const [language, setLanguage] = useState<Language>('javascript')
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const effectiveSlug = slugTouched ? trailSlug : slugify(title)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const res = await api.post<{ data: { trail: { id: string } } }>('/api/admin/trails', {
        slug: effectiveSlug,
        title: title.trim(),
        language,
        description: description.trim() || undefined,
      })
      navigate(`/${slug}/admin/catalog/edit/${res.data.trail.id}`)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao criar trilha.')
      setSaving(false)
    }
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose} role="dialog" aria-modal="true">
      <form className={styles.modal} onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Nova trilha do catálogo</h2>
          <button type="button" className={styles.modalClose} onClick={onClose} aria-label="Fechar">×</button>
        </div>
        <div className={styles.modalBody}>
          <label className={styles.formLabel}>Título
            <input className={styles.formInput} value={title} onChange={(e) => setTitle(e.target.value)} required autoFocus placeholder="Ex.: Lógica com JavaScript" />
            <small className={styles.hint}>Nome da trilha que as escolas e os alunos veem.</small>
          </label>
          <label className={styles.formLabel}>Identificador (slug)
            <input className={styles.formInput} value={effectiveSlug} onChange={(e) => { setSlugTouched(true); setTrailSlug(slugify(e.target.value)) }} required placeholder="logica-com-javascript" />
            <small className={styles.hint}>Usado na URL. Gerado do título; só letras minúsculas, números e hífens.</small>
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

// ─── Modal: manual ────────────────────────────────────────────────────────────

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
            <p className={styles.manualFlow}><strong>Fluxo:</strong> Criar trilha → adicionar módulos → adicionar desafios → a trilha entra no <em>catálogo global</em>, disponível para todas as escolas ativarem nas suas turmas.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── CatalogPage ──────────────────────────────────────────────────────────────

export default function CatalogPage() {
  const { slug } = useParams<{ slug: string }>()
  const [trails, setTrails] = useState<CatalogTrail[]>([])
  const [createOpen, setCreateOpen] = useState(false)
  const [manualOpen, setManualOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [removing, setRemoving] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoadError(null)
    try {
      const res = await api.get<{ data: CatalogTrail[] }>('/api/admin/trails?limit=100')
      setTrails(res.data)
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : 'Erro ao carregar catálogo.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(t)
  }, [toast])

  async function remove(trailId: string) {
    setRemoving(trailId)
    try {
      await api.delete(`/api/admin/trails/${trailId}`)
      setToast('Trilha removida do catálogo.')
      await load()
    } catch (err) {
      setToast(err instanceof ApiError ? err.message : 'Erro ao remover.')
    } finally {
      setRemoving(null)
    }
  }

  if (loading) return <div className={styles.state}><span className={styles.stateText}>// carregando catálogo...</span></div>
  if (loadError) return <div className={styles.state}><span className={styles.stateError}>{loadError}</span></div>

  return (
    <div className={styles.root}>
      <header className={styles.pageHeader}>
        <div className={styles.headLeft}>
          <h1 className={styles.pageTitle}>Catálogo global</h1>
          <button type="button" className={styles.helpBtn} onClick={() => setManualOpen(true)}>Como funciona?</button>
          <p className={styles.pageSubtitle}>{trails.length} {trails.length === 1 ? 'trilha' : 'trilhas'} disponível para todas as escolas</p>
        </div>
        <button className={styles.btnPrimary} onClick={() => setCreateOpen(true)}>+ Nova trilha</button>
      </header>

      {trails.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>Catálogo vazio</p>
          <p className={styles.emptyText}>Crie trilhas globais que qualquer escola poderá ativar nas suas turmas.</p>
          <button className={styles.btnPrimary} onClick={() => setCreateOpen(true)}>+ Nova trilha</button>
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
              <div className={styles.cardActions}>
                <Link to={`/${slug}/admin/catalog/edit/${t.id}`} className={styles.btnEdit}>Editar conteúdo</Link>
                <button className={styles.btnDanger} onClick={() => remove(t.id)} disabled={removing === t.id}>
                  {removing === t.id ? 'Removendo...' : 'Excluir'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {manualOpen && <ManualModal onClose={() => setManualOpen(false)} />}
      {createOpen && <CreateTrailModal onClose={() => setCreateOpen(false)} />}
      {toast && <div className={styles.toast}>{toast}</div>}
    </div>
  )
}
