import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { EditorState } from '@codemirror/state'
import {
  EditorView,
  keymap,
  lineNumbers,
  highlightActiveLine,
  highlightActiveLineGutter,
  drawSelection,
} from '@codemirror/view'
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands'
import { javascript } from '@codemirror/lang-javascript'
import { oneDark } from '@codemirror/theme-one-dark'
import { api, ApiError } from '../../lib/api.ts'
import { humanizeSandboxError, extractRawSandboxError } from '../../lib/humanizeSandboxError.ts'
import { useClass } from '../../contexts/ClassContext.tsx'
import styles from './WeeklyChallengePage.module.css'

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface ActiveWeekly {
  id: string
  challenge: {
    id: string
    title: string
    description: string | null
    difficulty: string
  }
  startsAt: string
  endsAt: string
  mySubmission: { status: string; attemptNumber: number } | null
}

interface HistoryEntry {
  id: string
  challenge: { id: string; title: string }
  startsAt: string
  endsAt: string
  topStudents: { name: string; xp: number }[]
}

interface TestResult {
  passed: boolean
  input: unknown
  expected: unknown
  actual: unknown
  description: string
}

interface SubmitBadge {
  id: string
  slug: string
  name: string
  iconUrl: string | null
}

interface SubmitResult {
  submission: {
    id: string
    attemptNumber: number
    status: 'passed' | 'failed' | 'pending' | 'under_review'
    testResults: TestResult[] | null
  }
  xpEarned: number
  newBadges: SubmitBadge[]
}

interface LeaderboardEntry {
  position: number
  student: { id: string; name: string; avatarUrl: string | null }
  submittedAt: string | null
  status: string | null
}

interface LeaderboardData {
  leaderboard: LeaderboardEntry[]
  myPosition: number | null
}

// ─── Labels e helpers ─────────────────────────────────────────────────────────

const DIFF_LABEL: Record<string, string> = { easy: 'fácil', medium: 'médio', hard: 'difícil' }
const MEDAL: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' }

function diffClass(d: string) {
  return styles[`diff_${d}`] ?? ''
}

/** Tempo restante até o fim do desafio, em PT-BR, formato curto. */
function formatTimeRemaining(endsAtIso: string): string {
  const diffMs = new Date(endsAtIso).getTime() - Date.now()
  if (diffMs <= 0) return 'encerrado'
  const diffMin = Math.floor(diffMs / 60_000)
  if (diffMin < 60) return `termina em ${diffMin} min`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `termina em ${diffH}h`
  const diffD = Math.floor(diffH / 24)
  return diffD === 1 ? 'termina em 1 dia' : `termina em ${diffD} dias`
}

function submissionStatusLabel(sub: { status: string; attemptNumber: number } | null): string {
  if (!sub) return 'você ainda não tentou'
  if (sub.status === 'passed') return '✅ você passou!'
  if (sub.status === 'under_review') return 'em revisão pelo professor'
  return `tentativa nº ${sub.attemptNumber}`
}

function leaderboardStatusLabel(status: string | null): string {
  if (status === 'passed') return '✅ aprovado'
  if (status === 'under_review') return 'em revisão'
  if (status === 'failed') return 'tentou'
  return 'não enviou'
}

// ─── Tema do CodeMirror (mesma lógica do ChallengePage) ───────────────────────

function buildEditorTheme() {
  const s = getComputedStyle(document.documentElement)
  const get = (v: string, fallback: string) => s.getPropertyValue(v).trim() || fallback

  const primary = get('--color-primary', '#6366f1')
  const editorBg = get('--color-editor-bg', '#12121a')
  const gutter = get('--color-editor-gutter', '#1e1e2d')
  const border = get('--color-border', '#2e2e3f')
  const muted = get('--color-text-muted', '#9490b5')
  const surfaceRaised = get('--color-surface-raised', '#22222f')

  return EditorView.theme(
    {
      '&': { height: '100%', fontSize: '0.875rem' },
      '.cm-scroller': { overflow: 'auto', fontFamily: "'JetBrains Mono', 'Fira Code', monospace" },
      '.cm-content': { padding: '0.75rem 0', caretColor: primary, minHeight: '100%' },
      '.cm-line': { padding: '0 1rem' },
      '.cm-gutters': {
        backgroundColor: gutter,
        borderRight: `1px solid ${border}`,
        color: muted,
        minWidth: '2.5rem',
      },
      '.cm-activeLineGutter': { backgroundColor: surfaceRaised },
      '.cm-activeLine': { backgroundColor: `color-mix(in srgb, ${primary} 5%, transparent)` },
      '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': {
        backgroundColor: `color-mix(in srgb, ${primary} 22%, transparent)`,
      },
      '.cm-cursor': { borderLeftColor: primary },
      '.cm-editor': { backgroundColor: editorBg },
    },
    { dark: true },
  )
}

// ─── Ícones inline ────────────────────────────────────────────────────────────

function IconSend() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  )
}

function IconCheck() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function IconX() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

function IconClock() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

// ─── CodeEditor (mesmo componente usado no ChallengePage) ─────────────────────

interface CodeEditorProps {
  initialValue: string
  onChange: (v: string) => void
}

function CodeEditor({ initialValue, onChange }: CodeEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  useEffect(() => {
    if (!containerRef.current) return

    const state = EditorState.create({
      doc: initialValue,
      extensions: [
        lineNumbers(),
        highlightActiveLine(),
        highlightActiveLineGutter(),
        history(),
        drawSelection(),
        javascript(),
        oneDark,
        buildEditorTheme(),
        keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChangeRef.current(update.state.doc.toString())
          }
        }),
      ],
    })

    const view = new EditorView({ state, parent: containerRef.current })
    return () => view.destroy()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return <div ref={containerRef} className={styles.editorInner} />
}

// ─── SandboxErrorMessage ──────────────────────────────────────────────────────

function SandboxErrorMessage({ message, name }: { message: string; name?: string }) {
  const [showTechnical, setShowTechnical] = useState(false)
  const friendly = humanizeSandboxError(message)
  const technical = name ? `${name}: ${message}` : message

  return (
    <div className={styles.resultErrorBlock}>
      <span className={styles.resultError}>{friendly}</span>
      <button
        type="button"
        className={styles.rawErrorToggle}
        onClick={() => setShowTechnical((v) => !v)}
      >
        {showTechnical ? 'ocultar mensagem técnica' : 'ver mensagem técnica'}
      </button>
      {showTechnical && <code className={styles.rawErrorText}>{technical}</code>}
    </div>
  )
}

// ─── TestResultsList ──────────────────────────────────────────────────────────

function TestResultsList({ results }: { results: TestResult[] }) {
  const passed = results.filter((r) => r.passed).length
  const total = results.length
  const allPassed = passed === total

  return (
    <div className={`${styles.resultsPanel} ${allPassed ? styles.resultsPassed : styles.resultsFailed}`}>
      <div className={styles.resultsSummary}>
        <span className={styles.resultsIcon}>{allPassed ? '🎉' : '🔍'}</span>
        <span className={styles.resultsSummaryText}>
          {allPassed ? `${total}/${total} testes passaram!` : `${passed}/${total} testes passaram`}
        </span>
      </div>

      <ul className={styles.resultsList}>
        {results.map((r, i) => {
          const rawError = extractRawSandboxError(undefined, undefined, r.actual)
          return (
            <li key={i} className={`${styles.resultItem} ${r.passed ? styles.resultItemPassed : styles.resultItemFailed}`}>
              <span className={styles.resultIcon}>{r.passed ? <IconCheck /> : <IconX />}</span>
              <div className={styles.resultBody}>
                <span className={styles.resultDescription}>{r.description}</span>
                {!r.passed && (
                  <div className={styles.resultDetail}>
                    {rawError ? (
                      <SandboxErrorMessage message={rawError.message} name={rawError.name} />
                    ) : (
                      <>
                        <span className={styles.resultExpected}>
                          esperado: <code>{JSON.stringify(r.expected)}</code>
                        </span>
                        <span className={styles.resultActual}>
                          recebido: <code>{JSON.stringify(r.actual)}</code>
                        </span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

// ─── SubmitResultPanel ────────────────────────────────────────────────────────

function SubmitResultPanel({ result }: { result: SubmitResult }) {
  const passed = result.submission.status === 'passed'

  return (
    <>
      <div className={`${styles.submitResult} ${passed ? styles.submitResultPassed : styles.submitResultFailed}`}>
        <div className={styles.submitResultHeader}>
          <span>{passed ? '✅ Desafio concluído!' : '❌ Não passou ainda'}</span>
          {result.xpEarned > 0 && <span className={styles.xpEarned}>+{result.xpEarned} XP</span>}
        </div>
        {result.newBadges.length > 0 && (
          <div className={styles.newBadges}>
            <span className={styles.badgesLabel}>Novo badge desbloqueado:</span>
            {result.newBadges.map((b) => (
              <span key={b.id} className={styles.badge}>🏆 {b.name}</span>
            ))}
          </div>
        )}
      </div>
      {result.submission.testResults && <TestResultsList results={result.submission.testResults} />}
    </>
  )
}

// ─── LeaderboardSection ───────────────────────────────────────────────────────

function LeaderboardSection({
  slug,
  classId,
  weeklyId,
}: {
  slug: string
  classId: string
  weeklyId: string
}) {
  const [data, setData] = useState<LeaderboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    api
      .get<{ data: LeaderboardData }>(`/api/${slug}/weekly-challenges/${classId}/${weeklyId}/leaderboard`)
      .then((res) => {
        if (!cancelled) setData(res.data)
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : 'Não foi possível carregar o placar.')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [slug, classId, weeklyId])

  if (loading) return <p className={styles.leaderboardState}>// carregando placar...</p>
  if (error) return <p className={styles.leaderboardStateError}>{error}</p>
  if (!data || data.leaderboard.length === 0) {
    return <p className={styles.leaderboardState}>Nenhuma submissão neste desafio ainda.</p>
  }

  return (
    <ol className={styles.leaderboardList}>
      {data.leaderboard.map((entry) => (
        <li
          key={entry.student.id}
          className={`${styles.leaderboardRow} ${entry.position === data.myPosition ? styles.leaderboardRowMe : ''}`}
        >
          <span className={styles.leaderboardPosition}>{MEDAL[entry.position] ?? `#${entry.position}`}</span>
          <span className={styles.leaderboardName}>{entry.student.name}</span>
          <span className={styles.leaderboardStatus}>{leaderboardStatusLabel(entry.status)}</span>
        </li>
      ))}
    </ol>
  )
}

// ─── WeeklyChallengePage ──────────────────────────────────────────────────────
// Consome só endpoints já existentes do módulo `weekly-challenges` (ativo,
// histórico, placar) e o endpoint genérico de submissão por challengeId
// (`/challenges/:challengeId/submissions`, já usado pelo ChallengePage) —
// sem rota nova no backend.

export default function WeeklyChallengePage() {
  const { slug } = useParams<{ slug: string }>()
  const { currentClass, setCurrentClass } = useClass()

  const [classId, setClassId] = useState<string | null>(null)
  const [className, setClassName] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [active, setActive] = useState<ActiveWeekly | null>(null)
  const [historyEntries, setHistoryEntries] = useState<HistoryEntry[] | null>(null)
  const [historyLoading, setHistoryLoading] = useState(false)

  const codeRef = useRef('// Escreva sua solução aqui\n')
  const [submitState, setSubmitState] = useState<'idle' | 'submitting'>('idle')
  const [submitResult, setSubmitResult] = useState<SubmitResult | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const [expandedLeaderboard, setExpandedLeaderboard] = useState<string | null>(null)

  // Carrega turma + desafio ativo
  useEffect(() => {
    if (!slug) return
    let cancelled = false

    async function load() {
      let cid = currentClass?.id ?? null
      let cname = currentClass?.name ?? ''

      if (!cid) {
        const learnRes = await api.get<{ data: { class: { id: string; name: string } } }>(
          `/api/${slug}/learn`,
        )
        cid = learnRes.data.class.id
        cname = learnRes.data.class.name
        setCurrentClass({ id: cid, name: cname })
      }
      if (cancelled) return

      setClassId(cid)
      setClassName(cname)

      const activeRes = await api.get<{ data: { weeklyChallenge: ActiveWeekly | null } }>(
        `/api/${slug}/weekly-challenges/${cid}`,
      )
      if (cancelled) return
      setActive(activeRes.data.weeklyChallenge)
    }

    load()
      .catch((err) => {
        if (!cancelled) {
          setLoadError(err instanceof ApiError ? err.message : 'Erro ao carregar desafio da semana.')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [slug]) // eslint-disable-line react-hooks/exhaustive-deps

  // Carrega histórico — depende só do classId já resolvido
  useEffect(() => {
    if (!slug || !classId) return
    let cancelled = false
    setHistoryLoading(true)
    api
      .get<{ data: { history: HistoryEntry[] } }>(`/api/${slug}/weekly-challenges/${classId}/history`)
      .then((res) => {
        if (!cancelled) setHistoryEntries(res.data.history)
      })
      .catch(() => {
        if (!cancelled) setHistoryEntries([])
      })
      .finally(() => {
        if (!cancelled) setHistoryLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [slug, classId])

  const handleSubmit = useCallback(async () => {
    if (!active || !classId || !slug || submitState === 'submitting') return
    setSubmitState('submitting')
    setSubmitError(null)
    try {
      const res = await api.post<{ data: SubmitResult }>(
        `/api/${slug}/challenges/${active.challenge.id}/submissions`,
        { classId, code: codeRef.current },
      )
      setSubmitResult(res.data)
      setActive((prev) =>
        prev
          ? {
              ...prev,
              mySubmission: {
                status: res.data.submission.status,
                attemptNumber: res.data.submission.attemptNumber,
              },
            }
          : prev,
      )
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : 'Erro ao enviar solução.')
    } finally {
      setSubmitState('idle')
    }
  }, [active, classId, slug, submitState])

  function toggleLeaderboard(weeklyId: string) {
    setExpandedLeaderboard((v) => (v === weeklyId ? null : weeklyId))
  }

  // ── Loading / erro de carregamento inicial ──
  if (loading) {
    return (
      <div className={styles.state}>
        <span className={styles.stateText}>// carregando desafio da semana...</span>
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
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <p className={styles.subtitle}>// {className}</p>
          <h1 className={styles.title}>Desafio da Semana</h1>
        </div>
      </header>

      {/* ── Desafio ativo ── */}
      {!active ? (
        <div className={styles.emptyCard}>
          <span className={styles.emptyIcon}>🗓️</span>
          <p className={styles.emptyText}>Nenhum desafio da semana ativo agora. Volte em breve!</p>
        </div>
      ) : (
        <section className={styles.activeCard}>
          <div className={styles.activeHeader}>
            <span className={`${styles.diffBadge} ${diffClass(active.challenge.difficulty)}`}>
              {DIFF_LABEL[active.challenge.difficulty] ?? active.challenge.difficulty}
            </span>
            <span className={styles.countdown}>
              <IconClock />
              {formatTimeRemaining(active.endsAt)}
            </span>
          </div>

          <h2 className={styles.challengeTitle}>{active.challenge.title}</h2>
          {active.challenge.description && (
            <p className={styles.challengeDescription}>{active.challenge.description}</p>
          )}

          <div className={styles.statusRow}>
            <span className={styles.statusValue}>{submissionStatusLabel(active.mySubmission)}</span>
            <button
              type="button"
              className={styles.leaderboardToggle}
              onClick={() => toggleLeaderboard(active.id)}
            >
              {expandedLeaderboard === active.id ? 'ocultar placar' : 'ver placar'}
            </button>
          </div>

          {expandedLeaderboard === active.id && classId && (
            <LeaderboardSection slug={slug!} classId={classId} weeklyId={active.id} />
          )}

          <div className={styles.editorWrapper}>
            <div className={styles.editorHeader}>
              <span className={styles.editorFilename}>solucao.js</span>
              <div className={styles.editorDots}>
                <span /><span /><span />
              </div>
            </div>
            <div className={styles.editorBody}>
              <CodeEditor
                key={active.id}
                initialValue={codeRef.current}
                onChange={(v) => { codeRef.current = v }}
              />
            </div>
          </div>

          <div className={styles.actionBar}>
            <button
              type="button"
              className={styles.submitBtn}
              onClick={handleSubmit}
              disabled={submitState === 'submitting'}
            >
              <IconSend />
              {submitState === 'submitting' ? 'enviando...' : 'enviar solução'}
            </button>
          </div>

          {submitError && <p className={styles.submitError}>{submitError}</p>}
          {submitResult && <SubmitResultPanel result={submitResult} />}
        </section>
      )}

      {/* ── Histórico ── */}
      <section className={styles.historySection}>
        <h2 className={styles.historyTitle}>Histórico</h2>

        {historyLoading && <p className={styles.stateText}>// carregando histórico...</p>}

        {!historyLoading && historyEntries && historyEntries.length === 0 && (
          <p className={styles.empty}>Nenhum desafio da semana encerrado ainda.</p>
        )}

        {!historyLoading && historyEntries && historyEntries.length > 0 && (
          <ul className={styles.historyList}>
            {historyEntries.map((h) => (
              <li key={h.id} className={styles.historyItem}>
                <div className={styles.historyRow}>
                  <span className={styles.historyChallengeTitle}>{h.challenge.title}</span>
                  <button
                    type="button"
                    className={styles.leaderboardToggle}
                    onClick={() => toggleLeaderboard(h.id)}
                  >
                    {expandedLeaderboard === h.id ? 'ocultar placar' : 'ver placar completo'}
                  </button>
                </div>

                <div className={styles.historyTop}>
                  {h.topStudents.length === 0 ? (
                    <span className={styles.historyEmpty}>ninguém completou este desafio.</span>
                  ) : (
                    h.topStudents.map((s, i) => (
                      <span key={i} className={styles.historyTopStudent}>
                        {MEDAL[i + 1] ?? `#${i + 1}`} {s.name} — {s.xp}xp
                      </span>
                    ))
                  )}
                </div>

                {expandedLeaderboard === h.id && classId && (
                  <LeaderboardSection slug={slug!} classId={classId} weeklyId={h.id} />
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
