import { useEffect, useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api, ApiError } from '../../lib/api.ts'
import styles from './AdminTrailPage.module.css'

type Difficulty = 'easy' | 'medium' | 'hard'
type Matcher = 'equal' | 'approx' | 'contains' | 'regex'
type AstRuleKind = 'requireRecursion' | 'forbidLoops' | 'requireMethod' | 'forbidMethod' | 'requireCall' | 'forbidCall'
type RenderMode = 'js' | 'p5'
interface TestCase { input: unknown; expected: unknown; description: string; matcher?: Matcher; tolerance?: number; mode?: 'stdout' | 'ast'; astRule?: { kind: AstRuleKind; name?: string } }
interface Challenge {
  id: string
  title: string
  description: string | null
  starterCode: string | null
  testCases: TestCase[] | null
  difficulty: Difficulty
  baseXp: number
  order: number
  targetFn?: string | null
  renderMode?: RenderMode | null
}
interface Module {
  id: string
  title: string
  concept: string | null
  exampleCode: string | null
  vocabulary: string[]
  order: number
  challenges: Challenge[]
}
interface TrailDetail {
  trail: { id: string; slug: string; title: string; description: string | null; language: string; order: number }
  modules: Module[]
}

const DIFF_LABEL: Record<Difficulty, string> = { easy: 'Fácil', medium: 'Médio', hard: 'Difícil' }

function parseValue(text: string): unknown {
  const t = text.trim()
  if (t === '') return ''
  try { return JSON.parse(t) } catch { return text }
}
function stringifyValue(v: unknown): string {
  if (typeof v === 'string') return v
  try { return JSON.stringify(v) } catch { return String(v) }
}

// ─── Form de módulo ────────────────────────────────────────────────────────────

function ModuleForm({ initial, onClose, onSave }: {
  initial: Module | null
  onClose: () => void
  onSave: (body: { title: string; concept?: string; exampleCode?: string; vocabulary?: string[] }) => Promise<void>
}) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [concept, setConcept] = useState(initial?.concept ?? '')
  const [exampleCode, setExampleCode] = useState(initial?.exampleCode ?? '')
  const [vocabulary, setVocabulary] = useState((initial?.vocabulary ?? []).join(', '))
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setError(null)
    try {
      await onSave({
        title: title.trim(),
        concept: concept.trim() || undefined,
        exampleCode: exampleCode.trim() || undefined,
        vocabulary: vocabulary.split(',').map((v) => v.trim()).filter(Boolean),
      })
    } catch (err) { setError(err instanceof ApiError ? err.message : 'Erro ao salvar.'); setSaving(false) }
  }

  return (
    <div className={styles.overlay} onClick={onClose} role="dialog" aria-modal="true">
      <form className={styles.modal} onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <h2 className={styles.modalTitle}>{initial ? 'Editar módulo' : 'Novo módulo'}</h2>
        <label className={styles.label}>Título
          <input className={styles.input} value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Ex.: Variáveis e tipos" />
          <small className={styles.hint}>Nome da lição (o aluno vê na trilha).</small>
        </label>
        <label className={styles.label}>Conceito (markdown)
          <textarea className={styles.textarea} value={concept} onChange={(e) => setConcept(e.target.value)} rows={3} placeholder="Ex.: Uma variável guarda um valor que pode mudar. Use let para declarar." />
          <small className={styles.hint}>A teoria que aparece para o aluno antes de resolver o desafio.</small>
        </label>
        <label className={styles.label}>Código de exemplo
          <textarea className={`${styles.textarea} ${styles.mono}`} value={exampleCode} onChange={(e) => setExampleCode(e.target.value)} rows={3} placeholder={"let nome = 'Ana'\nconsole.log(nome)"} />
          <small className={styles.hint}>Um trecho curto demonstrando o conceito.</small>
        </label>
        <label className={styles.label}>Vocabulário (separado por vírgula)
          <input className={styles.input} value={vocabulary} onChange={(e) => setVocabulary(e.target.value)} placeholder="let, const, if, console" />
          <small className={styles.hint}>Termos que o autocomplete do aluno vai sugerir aqui (acumula com os módulos anteriores).</small>
        </label>
        {error && <p className={styles.error}>{error}</p>}
        <div className={styles.actions}>
          <button type="button" className={styles.btnGhost} onClick={onClose}>Cancelar</button>
          <button type="submit" className={styles.btnPrimary} disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</button>
        </div>
      </form>
    </div>
  )
}

// ─── Form de desafio ───────────────────────────────────────────────────────────

function ChallengeForm({ initial, onClose, onSave }: {
  initial: Challenge | null
  onClose: () => void
  onSave: (body: { title: string; description?: string; starterCode?: string; testCases?: TestCase[]; difficulty: Difficulty; baseXp?: number; targetFn?: string | null; renderMode?: RenderMode | null }) => Promise<void>
}) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [starterCode, setStarterCode] = useState(initial?.starterCode ?? '')
  const [targetFn, setTargetFn] = useState(initial?.targetFn ?? '')
  const [renderMode, setRenderMode] = useState<RenderMode>(initial?.renderMode === 'p5' ? 'p5' : 'js')
  const [difficulty, setDifficulty] = useState<Difficulty>(initial?.difficulty ?? 'easy')
  const [baseXp, setBaseXp] = useState(String(initial?.baseXp ?? 10))
  const [rows, setRows] = useState<{ input: string; expected: string; description: string; matcher: string; tolerance: string; mode: string; astRuleKind: string; astRuleName: string }[]>(
    (initial?.testCases ?? []).map((t) => ({
      input: stringifyValue(t.input),
      expected: stringifyValue(t.expected),
      description: t.description,
      matcher: t.matcher ?? 'equal',
      tolerance: t.tolerance != null ? String(t.tolerance) : '',
      mode: t.mode ?? '',
      astRuleKind: t.astRule?.kind ?? 'requireRecursion',
      astRuleName: t.astRule?.name ?? '',
    })),
  )
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  function addRow() { setRows((r) => [...r, { input: '', expected: '', description: '', matcher: 'equal', tolerance: '', mode: '', astRuleKind: 'requireRecursion', astRuleName: '' }]) }
  function setRow(i: number, k: 'input' | 'expected' | 'description' | 'matcher' | 'tolerance' | 'mode' | 'astRuleKind' | 'astRuleName', v: string) {
    setRows((r) => r.map((row, idx) => (idx === i ? { ...row, [k]: v } : row)))
  }
  function removeRow(i: number) { setRows((r) => r.filter((_, idx) => idx !== i)) }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setError(null)
    const testCases: TestCase[] = rows
      .filter((r) => r.input !== '' || r.expected !== '' || r.description !== '' || r.mode === 'ast')
      .map((r) => {
        if (r.mode === 'ast') {
          const kind = r.astRuleKind as AstRuleKind
          const needsName = kind === 'requireMethod' || kind === 'forbidMethod' || kind === 'requireCall' || kind === 'forbidCall'
          return {
            input: null,
            expected: r.description,
            description: r.description,
            mode: 'ast' as const,
            astRule: { kind, ...(needsName && r.astRuleName.trim() ? { name: r.astRuleName.trim() } : {}) },
          }
        }
        const tc: TestCase = { input: parseValue(r.input), expected: parseValue(r.expected), description: r.description }
        if (r.mode === 'stdout') tc.mode = 'stdout'
        if (r.matcher !== 'equal') tc.matcher = r.matcher as Matcher
        if (r.matcher === 'approx' && r.tolerance.trim() !== '') tc.tolerance = Number(r.tolerance)
        return tc
      })
    try {
      await onSave({
        title: title.trim(),
        description: description.trim() || undefined,
        starterCode: starterCode.trim() || undefined,
        testCases: testCases.length ? testCases : undefined,
        difficulty,
        baseXp: Number(baseXp) || 10,
        targetFn: targetFn.trim() || null,
        renderMode,
      })
    } catch (err) { setError(err instanceof ApiError ? err.message : 'Erro ao salvar.'); setSaving(false) }
  }

  return (
    <div className={styles.overlay} onClick={onClose} role="dialog" aria-modal="true">
      <form className={`${styles.modal} ${styles.modalWide}`} onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <h2 className={styles.modalTitle}>{initial ? 'Editar desafio' : 'Novo desafio'}</h2>
        <label className={styles.label}>Título
          <input className={styles.input} value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Ex.: Some dois números" />
          <small className={styles.hint}>Nome do exercício.</small>
        </label>
        <label className={styles.label}>Descrição
          <textarea className={styles.textarea} value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Ex.: Escreva a função soma(a, b) que retorna a + b." />
          <small className={styles.hint}>O enunciado que o aluno lê.</small>
        </label>
        <label className={styles.label}>Código inicial (starter)
          <textarea className={`${styles.textarea} ${styles.mono}`} value={starterCode} onChange={(e) => setStarterCode(e.target.value)} rows={3} placeholder={"function soma(a, b) {\n  // seu código aqui\n}"} />
          <small className={styles.hint}>Código que já vem preenchido no editor do aluno.</small>
        </label>
        <div className={styles.rowTwo}>
          <label className={styles.label}>Dificuldade
            <select className={styles.input} value={difficulty} onChange={(e) => setDifficulty(e.target.value as Difficulty)}>
              <option value="easy">Fácil</option><option value="medium">Médio</option><option value="hard">Difícil</option>
            </select>
          </label>
          <label className={styles.label}>XP base
            <input className={styles.input} type="number" min={1} value={baseXp} onChange={(e) => setBaseXp(e.target.value)} />
            <small className={styles.hint}>Pontos ao concluir.</small>
          </label>
        </div>
        <label className={styles.label}>Função avaliada (opcional)
          <input className={`${styles.input} ${styles.mono}`} value={targetFn} onChange={(e) => setTargetFn(e.target.value)} placeholder="Ex.: soma" />
          <small className={styles.hint}>Nome da função testada. Vazio = usa a primeira função do código. Preencha se o aluno vai escrever funções auxiliares.</small>
        </label>
        <label className={styles.label}>Tipo de desafio
          <select className={styles.input} value={renderMode} onChange={(e) => setRenderMode(e.target.value as RenderMode)}>
            <option value="js">código (padrão)</option>
            <option value="p5">visual (p5.js)</option>
          </select>
          <small className={styles.hint}>Visual mostra o desenho do sketch numa prévia; a nota vem dos casos de teste do tipo <b>estrutura do código</b> (ex.: exige <code>ellipse</code>) ou de validação manual.</small>
        </label>

        <div className={styles.testsHead}>
          <span className={styles.label}>Casos de teste</span>
          <button type="button" className={styles.btnGhostSm} onClick={addRow}>+ caso</button>
        </div>
        <small className={styles.hint}>O aluno escreve uma função; o sistema chama com o <b>input</b> e compara o retorno com o <b>esperado</b>. Use JSON: texto entre aspas (<code>&quot;oi&quot;</code>), números e listas sem aspas (<code>[2, 3]</code>, <code>5</code>).</small>
        {rows.map((r, i) => (
          <div key={i} className={styles.testCase}>
            <div className={styles.testRow}>
              <input className={`${styles.input} ${styles.mono}`} value={r.input} onChange={(e) => setRow(i, 'input', e.target.value)} placeholder='input (ex: [2,3])' />
              <input className={`${styles.input} ${styles.mono}`} value={r.expected} onChange={(e) => setRow(i, 'expected', e.target.value)} placeholder='esperado (ex: 5)' />
              <input className={styles.input} value={r.description} onChange={(e) => setRow(i, 'description', e.target.value)} placeholder='descrição' />
              <button type="button" className={styles.btnRemoveSm} onClick={() => removeRow(i)} aria-label="Remover caso">×</button>
            </div>
            <div className={styles.testRowOpts}>
              <span className={styles.hint}>tipo:</span>
              <select className={styles.selectSm} value={r.mode} onChange={(e) => setRow(i, 'mode', e.target.value)}>
                <option value="">retorno da função</option>
                <option value="stdout">saída (console.log)</option>
                <option value="ast">estrutura do código</option>
              </select>
              {r.mode === 'ast' ? (
                <>
                  <span className={styles.hint}>regra:</span>
                  <select className={styles.selectSm} value={r.astRuleKind} onChange={(e) => setRow(i, 'astRuleKind', e.target.value)}>
                    <option value="requireRecursion">exige recursão</option>
                    <option value="forbidLoops">proíbe laços (for/while)</option>
                    <option value="requireMethod">exige método (.nome())</option>
                    <option value="forbidMethod">proíbe método (.nome())</option>
                    <option value="requireCall">exige função (nome())</option>
                    <option value="forbidCall">proíbe função (nome())</option>
                  </select>
                  {(r.astRuleKind === 'requireMethod' || r.astRuleKind === 'forbidMethod') && (
                    <input className={styles.selectSm} value={r.astRuleName} onChange={(e) => setRow(i, 'astRuleName', e.target.value)} placeholder="método (ex: map)" />
                  )}
                  {(r.astRuleKind === 'requireCall' || r.astRuleKind === 'forbidCall') && (
                    <input className={styles.selectSm} value={r.astRuleName} onChange={(e) => setRow(i, 'astRuleName', e.target.value)} placeholder="função (ex: ellipse)" />
                  )}
                </>
              ) : (
                <>
                  <span className={styles.hint}>comparação:</span>
                  <select className={styles.selectSm} value={r.matcher} onChange={(e) => setRow(i, 'matcher', e.target.value)}>
                    <option value="equal">igual (padrão)</option>
                    <option value="approx">aproximado (número)</option>
                    <option value="contains">contém</option>
                    <option value="regex">regex</option>
                  </select>
                  {r.matcher === 'approx' && (
                    <input className={styles.selectSm} type="number" step="any" min={0} value={r.tolerance} onChange={(e) => setRow(i, 'tolerance', e.target.value)} placeholder="tolerância (ex: 0.01)" />
                  )}
                </>
              )}
            </div>
            {r.mode === 'stdout' && (
              <small className={styles.hint}>Saída do console: em <b>esperado</b> coloque o texto impresso. Para várias linhas, use uma string JSON com <code>\n</code> (ex.: <code>&quot;linha 1\nlinha 2&quot;</code>). <b>input</b> só é usado se o aluno escreve uma função que imprime.</small>
            )}
            {r.mode === 'ast' && (
              <small className={styles.hint}>Verifica a <b>estrutura</b> do código (não usa input/esperado) — ex.: exigir recursão ou proibir laços. Use a <b>descrição</b> para explicar a regra ao aluno.</small>
            )}
          </div>
        ))}

        {error && <p className={styles.error}>{error}</p>}
        <div className={styles.actions}>
          <button type="button" className={styles.btnGhost} onClick={onClose}>Cancelar</button>
          <button type="submit" className={styles.btnPrimary} disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</button>
        </div>
      </form>
    </div>
  )
}

// ─── Página ────────────────────────────────────────────────────────────────────

export default function AdminTrailPage() {
  const { slug, trailId } = useParams<{ slug: string; trailId: string }>()
  const [data, setData] = useState<TrailDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [moduleForm, setModuleForm] = useState<{ open: boolean; editing: Module | null }>({ open: false, editing: null })
  const [challengeForm, setChallengeForm] = useState<{ open: boolean; moduleId: string; editing: Challenge | null } | null>(null)

  const load = useCallback(async () => {
    if (!slug || !trailId) return
    setLoadError(null)
    try {
      const res = await api.get<{ data: TrailDetail }>(`/api/admin/trails/${trailId}`)
      setData(res.data)
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : 'Erro ao carregar trilha.')
    } finally { setLoading(false) }
  }, [slug, trailId])

  useEffect(() => { load() }, [load])
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 3000); return () => clearTimeout(t) }, [toast])

  async function saveModule(body: { title: string; concept?: string; exampleCode?: string; vocabulary?: string[] }) {
    if (!slug || !trailId) return
    if (moduleForm.editing) await api.patch(`/api/admin/modules/${moduleForm.editing.id}`, body)
    else await api.post(`/api/admin/trails/${trailId}/modules`, body)
    setModuleForm({ open: false, editing: null }); setToast('Módulo salvo.'); await load()
  }
  async function deleteModule(id: string) {
    if (!slug) return
    try { await api.delete(`/api/admin/modules/${id}`); setToast('Módulo removido.'); await load() }
    catch (err) { setToast(err instanceof ApiError ? err.message : 'Erro ao remover.') }
  }
  async function saveChallenge(body: { title: string; description?: string; starterCode?: string; testCases?: TestCase[]; difficulty: Difficulty; baseXp?: number; targetFn?: string | null }) {
    if (!slug || !challengeForm) return
    if (challengeForm.editing) await api.patch(`/api/admin/challenges/${challengeForm.editing.id}`, body)
    else await api.post(`/api/admin/modules/${challengeForm.moduleId}/challenges`, body)
    setChallengeForm(null); setToast('Desafio salvo.'); await load()
  }
  async function deleteChallenge(id: string) {
    if (!slug) return
    try { await api.delete(`/api/admin/challenges/${id}`); setToast('Desafio removido.'); await load() }
    catch (err) { setToast(err instanceof ApiError ? err.message : 'Erro ao remover.') }
  }

  if (loading) return <div className={styles.state}><span className={styles.stateText}>// carregando trilha...</span></div>
  if (loadError || !data) return <div className={styles.state}><span className={styles.stateError}>{loadError ?? 'Trilha não encontrada.'}</span></div>

  return (
    <div className={styles.root}>
      <Link to={`/${slug}/admin/catalog`} className={styles.backLink}>← Catálogo</Link>
      <header className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>{data.trail.title}</h1>
          {data.trail.description && <p className={styles.pageDesc}>{data.trail.description}</p>}
        </div>
        <button className={styles.btnPrimary} onClick={() => setModuleForm({ open: true, editing: null })}>+ Módulo</button>
      </header>

      {data.modules.length === 0 ? (
        <div className={styles.empty}>Nenhum módulo ainda. Adicione o primeiro módulo da trilha.</div>
      ) : (
        data.modules.map((m) => (
          <section key={m.id} className={styles.moduleCard}>
            <div className={styles.moduleHead}>
              <div>
                <h2 className={styles.moduleTitle}>{m.title}</h2>
                {m.challenges.length === 0 && <span className={styles.lessonBadge}>📖 Lição</span>}
                {(m.vocabulary ?? []).length > 0 && <span className={styles.vocab}>vocab: {(m.vocabulary ?? []).join(', ')}</span>}
              </div>
              <div className={styles.moduleActions}>
                <button className={styles.btnGhostSm} onClick={() => setModuleForm({ open: true, editing: m })}>Editar</button>
                <button className={styles.btnRemoveSm} onClick={() => deleteModule(m.id)}>Excluir</button>
              </div>
            </div>

            <div className={styles.challengeList}>
              {m.challenges.map((c) => (
                <div key={c.id} className={styles.challengeRow}>
                  <div className={styles.challengeInfo}>
                    <span className={styles.challengeTitle}>{c.title}</span>
                    <span className={styles.challengeMeta}>{DIFF_LABEL[c.difficulty]} · {c.baseXp} XP · {(c.testCases ?? []).length} testes</span>
                  </div>
                  <div className={styles.moduleActions}>
                    <button className={styles.btnGhostSm} onClick={() => setChallengeForm({ open: true, moduleId: m.id, editing: c })}>Editar</button>
                    <button className={styles.btnRemoveSm} onClick={() => deleteChallenge(c.id)}>Excluir</button>
                  </div>
                </div>
              ))}
              <button className={styles.addChallenge} onClick={() => setChallengeForm({ open: true, moduleId: m.id, editing: null })}>+ Adicionar desafio</button>
            </div>
          </section>
        ))
      )}

      {moduleForm.open && <ModuleForm initial={moduleForm.editing} onClose={() => setModuleForm({ open: false, editing: null })} onSave={saveModule} />}
      {challengeForm?.open && <ChallengeForm initial={challengeForm.editing} onClose={() => setChallengeForm(null)} onSave={saveChallenge} />}
      {toast && <div className={styles.toast}>{toast}</div>}
    </div>
  )
}
