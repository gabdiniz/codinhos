import { useEffect, useRef, useState, useCallback } from 'react'
import { Link, useParams } from 'react-router-dom'
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
import { autocompletion, type CompletionContext, type CompletionResult } from '@codemirror/autocomplete'
import { oneDark } from '@codemirror/theme-one-dark'
import { api, ApiError } from '../../lib/api.ts'
import { humanizeSandboxError, extractRawSandboxError, type RawSandboxError } from '../../lib/humanizeSandboxError.ts'
import { BlocklyEditor } from '../../components/BlocklyEditor/BlocklyEditor.tsx'
import { useClass } from '../../contexts/ClassContext.tsx'
import styles from './ChallengePage.module.css'

const QUICK_REPLIES = [
  'Poderia me explicar o desafio?',
  'Me dê uma dica, sem a resposta',
  'Como posso melhorar meu código?',
  'Por que meu código falhou?',
]

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Difficulty = 'easy' | 'medium' | 'hard'
type ModuleStatus = 'locked' | 'available' | 'completed'

interface TestCase {
  input: unknown
  expected: unknown
  description: string
}

interface TestResult {
  passed: boolean
  input: unknown
  expected: unknown
  actual: unknown
  description: string
  error?: string
  /** err.name (ex.: "TypeError") — só vem preenchido quando o teste roda no worker do navegador */
  errorName?: string
}

interface Challenge {
  id: string
  title: string
  description: string | null
  starterCode: string | null
  testCases: TestCase[] | null
  difficulty: Difficulty
  baseXp: number
  targetFn?: string | null
}

interface ModuleDetail {
  module: { id: string; title: string; concept: string | null; exampleCode: string | null }
  challenge: Challenge | null
  progress: { status: ModuleStatus; attempts: number }
  visualBlocksEnabled: boolean
  availableVocabulary: string[]
  nextModuleId: string | null
}

interface AiMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
}

/** Contexto de um teste que falhou — enviado quando o aluno pede ajuda ao Codi */
interface FailedTestContext {
  description: string
  expected?: string
  actual?: string
  error?: string
}

/** Pedido de ajuda originado de um clique em "Pedir ajuda ao Codi" num teste falho */
interface HelpRequest {
  failedTest: FailedTestContext
  /** Identificador único por clique — garante que o CodiDrawer reaja mesmo a cliques repetidos no mesmo teste */
  nonce: number
}

interface AiConversationData {
  conversationId: string
  messages: AiMessage[]
  messagesUsedToday: number
  dailyLimit: number | null
  aiErrorExplanationEnabled: boolean
}

/** Serializa um valor de teste (unknown) para texto, respeitando o limite do backend (500 chars) */
function serializeTestValue(value: unknown): string {
  if (value === undefined) return 'undefined'
  let text: string
  try {
    text = JSON.stringify(value) ?? String(value)
  } catch {
    text = String(value)
  }
  return text.slice(0, 500)
}

// ─── Markdown-lite para mensagens do Codi ──────────────────────────────────────
// Sem dependência externa: o conteúdo das mensagens (IA e aluno) só usa um
// subconjunto simples de Markdown (negrito, código inline, listas), então um
// parser dedicado e leve evita adicionar uma lib só para isso.

type ContentBlock =
  | { type: 'paragraph'; lines: string[] }
  | { type: 'list'; ordered: boolean; items: string[] }

/** Quebra o texto em blocos de parágrafo/lista a partir de linhas em branco e marcadores */
function parseContentBlocks(text: string): ContentBlock[] {
  const lines = text.split('\n')
  const blocks: ContentBlock[] = []
  let paragraphLines: string[] = []

  const flushParagraph = () => {
    if (paragraphLines.length > 0) {
      blocks.push({ type: 'paragraph', lines: paragraphLines })
      paragraphLines = []
    }
  }

  const isListLine = (l: string) => /^[-*]\s+(.*)/.exec(l) ?? /^\d+[.)]\s+(.*)/.exec(l)

  let i = 0
  while (i < lines.length) {
    const trimmed = lines[i].trim()

    if (trimmed === '') {
      flushParagraph()
      i++
      continue
    }

    if (isListLine(trimmed)) {
      flushParagraph()
      const ordered = /^\d+[.)]\s+/.test(trimmed)
      const items: string[] = []
      while (i < lines.length) {
        const match = isListLine(lines[i].trim())
        if (!match) break
        items.push(match[1])
        i++
      }
      blocks.push({ type: 'list', ordered, items })
      continue
    }

    paragraphLines.push(lines[i])
    i++
  }
  flushParagraph()

  return blocks
}

/** Renderiza `**negrito**` e `` `código inline` `` dentro de um trecho de texto */
function renderInline(text: string, keyPrefix: string) {
  const tokens = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter((token) => token !== '')
  return tokens.map((token, idx) => {
    if (token.startsWith('**') && token.endsWith('**') && token.length > 4) {
      return <strong key={`${keyPrefix}-${idx}`}>{token.slice(2, -2)}</strong>
    }
    if (token.startsWith('`') && token.endsWith('`') && token.length > 2) {
      return (
        <code key={`${keyPrefix}-${idx}`} className={styles.mdCode}>
          {token.slice(1, -1)}
        </code>
      )
    }
    return <span key={`${keyPrefix}-${idx}`}>{token}</span>
  })
}

/** Converte o conteúdo de uma mensagem (texto com Markdown-lite) em JSX */
function renderMessageContent(content: string) {
  return parseContentBlocks(content).map((block, bIdx) => {
    if (block.type === 'list') {
      const ListTag = block.ordered ? 'ol' : 'ul'
      return (
        <ListTag key={bIdx} className={styles.mdList}>
          {block.items.map((item, iIdx) => (
            <li key={iIdx}>{renderInline(item, `${bIdx}-${iIdx}`)}</li>
          ))}
        </ListTag>
      )
    }
    return (
      <p key={bIdx} className={styles.mdParagraph}>
        {block.lines.map((line, lIdx) => (
          <span key={lIdx}>
            {renderInline(line, `${bIdx}-${lIdx}`)}
            {lIdx < block.lines.length - 1 && <br />}
          </span>
        ))}
      </p>
    )
  })
}

interface SubmitBadge {
  id: string; slug: string; name: string; iconUrl: string | null
}

interface SubmitResult {
  submission: {
    id: string
    status: 'passed' | 'failed' | 'pending' | 'under_review'
    testResults: TestResult[] | null
  }
  xpEarned: number
  newBadges: SubmitBadge[]
}

// ─── Labels ───────────────────────────────────────────────────────────────────

const DIFF_LABEL: Record<Difficulty, string> = { easy: 'fácil', medium: 'médio', hard: 'difícil' }

// ─── Theme CodeMirror ─────────────────────────────────────────────────────────

/** Lê variáveis CSS do DOM para montar o tema do editor dinamicamente. */
function buildEditorTheme() {
  const s = getComputedStyle(document.documentElement)
  const get = (v: string, fallback: string) => s.getPropertyValue(v).trim() || fallback

  const primary  = get('--color-primary',       '#6366f1')
  const editorBg = get('--color-editor-bg',     '#12121a')
  const gutter   = get('--color-editor-gutter', '#1e1e2d')
  const border   = get('--color-border',        '#2e2e3f')
  const muted    = get('--color-text-muted',    '#9490b5')
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

// ─── Helpers de renderização ──────────────────────────────────────────────────

/** Renderiza texto com blocos de código separados. */
function ConceptText({ text }: { text: string }) {
  const parts = text.split(/(```[\s\S]*?```)/g)
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('```')) {
          const body = part.replace(/^```\w*\n?/, '').replace(/\n?```$/, '')
          return (
            <pre key={i} className={styles.conceptCodeBlock}>
              <code>{body}</code>
            </pre>
          )
        }
        return (
          <span key={i} className={styles.conceptProse}>
            {part}
          </span>
        )
      })}
    </>
  )
}

function diffClass(d: Difficulty) {
  return styles[`diff_${d}`]
}

// ─── Ícones inline ────────────────────────────────────────────────────────────

function IconPlay() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  )
}

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

function IconChevronLeft() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  )
}

function IconBot() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M12 11V5" />
      <circle cx="12" cy="4" r="1" />
      <line x1="8" y1="15" x2="8" y2="15" strokeWidth="2.5" />
      <line x1="16" y1="15" x2="16" y2="15" strokeWidth="2.5" />
    </svg>
  )
}

function IconClose() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

// ─── CodeEditor ───────────────────────────────────────────────────────────────

interface CodeEditorProps {
  initialValue: string
  onChange: (v: string) => void
  vocabulary: string[]
}

// Autocomplete contextual (Sprint 7.1): sugere SOMENTE o vocabulário já ensinado
// até o módulo atual da trilha. `override` substitui o autocomplete padrão do JS.
function makeVocabularyCompletion(vocabulary: string[]) {
  const options = vocabulary.map((label) => ({ label, type: 'keyword' as const }))
  return (context: CompletionContext): CompletionResult | null => {
    const word = context.matchBefore(/\w+/)
    if (!word || (word.from === word.to && !context.explicit)) return null
    if (options.length === 0) return null
    return { from: word.from, options }
  }
}

function CodeEditor({ initialValue, onChange, vocabulary }: CodeEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  // onChange em ref para evitar recriação do editor a cada render
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
        autocompletion({ override: [makeVocabularyCompletion(vocabulary)] }),
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
  // initialValue usada só no mount; key no pai controla re-mount quando muda

  return <div ref={containerRef} className={styles.editorInner} />
}

// ─── SandboxErrorMessage ──────────────────────────────────────────────────────
// Mostra a versão humanizada do erro por padrão; a mensagem técnica original
// (stack/erro nativo) fica escondida atrás de um toggle, para quem quiser ver.

function SandboxErrorMessage({ raw }: { raw: RawSandboxError }) {
  const [showTechnical, setShowTechnical] = useState(false)
  const friendly = humanizeSandboxError(raw.message)
  const technical = raw.name ? `${raw.name}: ${raw.message}` : raw.message

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

// ─── TestResultsPanel ─────────────────────────────────────────────────────────

interface TestResultsPanelProps {
  results: TestResult[]
  /** Chamado quando o aluno clica em "Pedir ajuda ao Codi" num teste que falhou */
  onAskCodi?: (result: TestResult) => void
  /** Tarefa 3.3 — esconde o botão quando o tenant desabilitou a explicação de erro */
  aiHelpEnabled?: boolean
}

function TestResultsPanel({ results, onAskCodi, aiHelpEnabled }: TestResultsPanelProps) {
  const passed = results.filter((r) => r.passed).length
  const total = results.length
  const allPassed = passed === total

  return (
    <div className={`${styles.resultsPanel} ${allPassed ? styles.resultsPassed : styles.resultsFailed}`}>
      <div className={styles.resultsSummary}>
        <span className={styles.resultsIcon}>{allPassed ? '🎉' : '🔍'}</span>
        <span className={styles.resultsSummaryText}>
          {allPassed
            ? `${total}/${total} testes passaram!`
            : `${passed}/${total} testes passaram`}
        </span>
      </div>

      <ul className={styles.resultsList}>
        {results.map((r, i) => (
          <li key={i} className={`${styles.resultItem} ${r.passed ? styles.resultItemPassed : styles.resultItemFailed}`}>
            <span className={styles.resultIcon}>
              {r.passed ? <IconCheck /> : <IconX />}
            </span>
            <div className={styles.resultBody}>
              <span className={styles.resultDescription}>{r.description}</span>
              {!r.passed && (
                <div className={styles.resultDetail}>
                  {(() => {
                    const rawError = extractRawSandboxError(r.error, r.errorName, r.actual)
                    if (rawError) {
                      return <SandboxErrorMessage raw={rawError} />
                    }
                    return (
                      <>
                        <span className={styles.resultExpected}>
                          esperado: <code>{JSON.stringify(r.expected)}</code>
                        </span>
                        <span className={styles.resultActual}>
                          recebido: <code>{JSON.stringify(r.actual)}</code>
                        </span>
                      </>
                    )
                  })()}
                </div>
              )}
              {!r.passed && aiHelpEnabled && onAskCodi && (
                <button
                  type="button"
                  className={styles.askCodiBtn}
                  onClick={() => onAskCodi(r)}
                >
                  <IconBot />
                  Pedir ajuda ao Codi
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

// ─── SubmitResultPanel ────────────────────────────────────────────────────────

function SubmitResultPanel({ result }: { result: SubmitResult }) {
  const status = result.submission.status
  const variantClass =
    status === 'passed'
      ? styles.submitResultPassed
      : status === 'under_review'
        ? styles.submitResultReview
        : styles.submitResultFailed
  const headerLabel =
    status === 'passed'
      ? '✅ Desafio concluído!'
      : status === 'under_review'
        ? '📤 Enviado para revisão do professor'
        : '❌ Não passou ainda'

  return (
    <div className={`${styles.submitResult} ${variantClass}`}>
      <div className={styles.submitResultHeader}>
        <span>{headerLabel}</span>
        {result.xpEarned > 0 && (
          <span className={styles.xpEarned}>+{result.xpEarned} XP</span>
        )}
      </div>
      {status === 'under_review' && (
        <p className={styles.submitResultNote}>
          Sua solução foi enviada. O professor vai revisar e dar a nota.
        </p>
      )}
      {result.newBadges.length > 0 && (
        <div className={styles.newBadges}>
          <span className={styles.badgesLabel}>Novo badge desbloqueado:</span>
          {result.newBadges.map((b) => (
            <span key={b.id} className={styles.badge}>🏆 {b.name}</span>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── CodiDrawer ───────────────────────────────────────────────────────────────

interface CodiDrawerProps {
  open: boolean
  onClose: () => void
  challengeId: string | null
  slug: string
  getCode: () => string
  /** Conversa carregada pelo ChallengePage ao abrir o desafio (sem round-trip extra) */
  conversation: AiConversationData | null
  /** Pedido de ajuda originado de um clique em "Pedir ajuda ao Codi" num teste falho */
  pendingHelpRequest: HelpRequest | null
  /** Mensagem disparada automaticamente (ex.: botão "Me ajude com este desafio") */
  autoMessage: { text: string; nonce: number } | null
  /** Módulo atual — usado no modo lição (sem desafio) */
  moduleId: string | null
  /** true quando o módulo é uma lição (sem desafio) */
  isLesson: boolean
}

function CodiDrawer({
  open,
  onClose,
  challengeId,
  slug,
  getCode,
  conversation,
  pendingHelpRequest,
  autoMessage,
  moduleId,
  isLesson,
}: CodiDrawerProps) {
  const [messages, setMessages] = useState<AiMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dailyLimit, setDailyLimit] = useState<number | null>(null)
  const [usedToday, setUsedToday] = useState(0)
  const [pendingFailedTest, setPendingFailedTest] = useState<FailedTestContext | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Sincroniza com a conversa carregada pelo ChallengePage
  useEffect(() => {
    if (!conversation) return
    setMessages(conversation.messages)
    setUsedToday(conversation.messagesUsedToday)
    setDailyLimit(conversation.dailyLimit)
  }, [conversation])

  // Pré-popula o campo ao receber um pedido de ajuda vindo de um teste que falhou
  // (Tarefa 3.2) — não envia automaticamente, o aluno confirma o envio
  useEffect(() => {
    if (!pendingHelpRequest) return
    setPendingFailedTest(pendingHelpRequest.failedTest)
    setInput('Por que esse teste falhou?')
  }, [pendingHelpRequest])

  // Mensagem automática (botão "Me ajude com este desafio") — envia uma vez por nonce
  const lastAutoNonce = useRef(0)
  useEffect(() => {
    if (!autoMessage || autoMessage.nonce === lastAutoNonce.current) return
    lastAutoNonce.current = autoMessage.nonce
    handleSend(autoMessage.text)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoMessage])

  // Scroll automático para o fim
  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open])

  async function handleSend(textArg?: string) {
    const text = (typeof textArg === 'string' ? textArg : input).trim()
    if (!text || sending) return

    const userMsg: AiMessage = {
      id: `local-${Date.now()}`,
      role: 'user',
      content: text,
      createdAt: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, userMsg])
    if (typeof textArg !== 'string') setInput('')
    setSending(true)
    setError(null)

    try {
      if (isLesson && moduleId) {
        const res = await api.post<{
          data: { reply: string; messagesUsedToday: number; dailyLimit: number | null }
        }>(`/api/${slug}/ai/modules/${moduleId}/messages`, {
          message: text,
          history: messages.map((m) => ({ role: m.role, content: m.content })),
        })
        setMessages((prev) => [
          ...prev,
          { id: `codi-${Date.now()}`, role: 'assistant', content: res.data.reply, createdAt: new Date().toISOString() },
        ])
        setUsedToday(res.data.messagesUsedToday)
        setDailyLimit(res.data.dailyLimit)
      } else {
        const res = await api.post<{
          data: {
            message: AiMessage
            messagesUsedToday: number
            dailyLimit: number | null
          }
        }>(`/api/${slug}/ai/challenges/${challengeId}/messages`, {
          message: text,
          currentCode: getCode(),
          ...(pendingFailedTest ? { failedTest: pendingFailedTest } : {}),
        })
        setMessages((prev) => [...prev, res.data.message])
        setUsedToday(res.data.messagesUsedToday)
        setDailyLimit(res.data.dailyLimit)
        // Contexto consumido — não deve vazar pra próxima mensagem livre
        setPendingFailedTest(null)
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Codi não está disponível agora.')
      setMessages((prev) => prev.filter((m) => m.id !== userMsg.id))
    } finally {
      setSending(false)
    }
  }

  const limitReached = dailyLimit !== null && usedToday >= dailyLimit

  return (
    <div className={`${styles.codiDrawer} ${open ? styles.codiDrawerOpen : ''}`} aria-label="Tutor Codi">
      {/* Header */}
      <div className={styles.codiHeader}>
        <div className={styles.codiHeaderLeft}>
          <span className={styles.codiAvatar}><IconBot /></span>
          <div>
            <span className={styles.codiName}>Codi</span>
            <span className={styles.codiSub}>tutor de IA</span>
          </div>
        </div>
        <div className={styles.codiHeaderRight}>
          {dailyLimit !== null && (
            <span className={styles.codiLimit}>{usedToday}/{dailyLimit} mensagens</span>
          )}
          <button className={styles.codiClose} onClick={onClose} aria-label="Fechar Codi">
            <IconClose />
          </button>
        </div>
      </div>

      {/* Mensagens */}
      <div className={styles.codiMessages}>
        {messages.length === 0 && !sending && (
          <div className={styles.codiEmpty}>
            <p>Olá! Sou o Codi, seu tutor de IA. 👋</p>
            <p>Pode me perguntar sobre o desafio, pedir dicas ou tirar dúvidas sobre JavaScript!</p>
          </div>
        )}
        {messages.map((m) => (
          <div key={m.id} className={`${styles.codiMsg} ${m.role === 'user' ? styles.codiMsgUser : styles.codiMsgCodi}`}>
            <div className={styles.codiMsgContent}>{renderMessageContent(m.content)}</div>
          </div>
        ))}
        {sending && (
          <div className={`${styles.codiMsg} ${styles.codiMsgCodi}`}>
            <span className={styles.codiTyping}>
              <span /><span /><span />
            </span>
          </div>
        )}
        {error && <p className={styles.codiError}>{error}</p>}
        <div ref={bottomRef} />
      </div>

      {/* Mensagens rápidas */}
      {!limitReached && (
        <div className={styles.codiChips}>
          {QUICK_REPLIES.map((q) => (
            <button key={q} type="button" className={styles.codiChip} onClick={() => handleSend(q)} disabled={sending}>
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className={styles.codiInputArea}>
        <textarea
          className={styles.codiInput}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSend()
            }
          }}
          placeholder={limitReached ? 'Limite diário atingido' : 'Pergunte algo...'}
          disabled={sending || limitReached}
          rows={2}
          aria-label="Mensagem para o Codi"
        />
        <button
          className={styles.codiSendBtn}
          onClick={() => handleSend()}
          disabled={sending || !input.trim() || limitReached}
          aria-label="Enviar mensagem"
        >
          <IconSend />
        </button>
      </div>
    </div>
  )
}

// ─── ChallengePage ────────────────────────────────────────────────────────────

export default function ChallengePage() {
  const { slug, trailId, moduleId } = useParams<{
    slug: string
    trailId: string
    moduleId: string
  }>()
  const { currentClass, setCurrentClass } = useClass()

  // Dados
  const [moduleData, setModuleData] = useState<ModuleDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  // Editor — código vive em ref para não causar re-renders no editor
  const codeRef = useRef('')

  // Execução local (worker)
  const [runState, setRunState] = useState<'idle' | 'running' | 'done'>('idle')
  const [testResults, setTestResults] = useState<TestResult[] | null>(null)
  const workerRef = useRef<Worker | null>(null)

  // Submissão
  const [submitState, setSubmitState] = useState<'idle' | 'submitting'>('idle')
  const [submitResult, setSubmitResult] = useState<SubmitResult | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Codi
  const [codiOpen, setCodiOpen] = useState(false)
  const [aiData, setAiData] = useState<AiConversationData | null>(null)
  const [helpRequest, setHelpRequest] = useState<HelpRequest | null>(null)
  const helpRequestSeq = useRef(0)
  const [autoMsg, setAutoMsg] = useState<{ text: string; nonce: number } | null>(null)
  const autoMsgSeq = useRef(0)
  const [lessonResult, setLessonResult] = useState<{ xpEarned: number; alreadyCompleted: boolean; nextModuleId: string | null } | null>(null)
  const [completingLesson, setCompletingLesson] = useState(false)
  const [resetNonce, setResetNonce] = useState(0)

  // Carrega dados do módulo — reseta estado ao trocar de módulo
  useEffect(() => {
    if (!slug || !moduleId) return
    setLoading(true)
    setLoadError(null)
    setModuleData(null)
    setRunState('idle')
    setTestResults(null)
    setSubmitResult(null)
    setSubmitError(null)
    setCodiOpen(false)
    setAiData(null)
    setHelpRequest(null)
    setAutoMsg(null)
    setLessonResult(null)
    setCompletingLesson(false)
    setResetNonce(0)
    api
      .get<{ data: ModuleDetail }>(`/api/${slug}/learn/modules/${moduleId}`)
      .then((res) => {
        setModuleData(res.data)
        codeRef.current = res.data.challenge?.starterCode ?? ''
      })
      .catch((err) => setLoadError(err instanceof ApiError ? err.message : 'Erro ao carregar desafio.'))
      .finally(() => setLoading(false))
  }, [slug, moduleId])

  // Carrega a conversa com o Codi assim que o desafio é conhecido — uma única vez,
  // sem round-trip extra (Tarefa 1.3 / 3.3: já traz aiErrorExplanationEnabled)
  const challengeIdForAi = moduleData?.challenge?.id
  useEffect(() => {
    if (!slug || !challengeIdForAi) return
    api
      .get<{ data: AiConversationData }>(`/api/${slug}/ai/challenges/${challengeIdForAi}/conversation`)
      .then((res) => setAiData(res.data))
      .catch(() => {
        // Codi pode não estar configurado no ambiente demo — assume feature desligada
        setAiData({
          conversationId: '',
          messages: [],
          messagesUsedToday: 0,
          dailyLimit: null,
          aiErrorExplanationEnabled: false,
        })
      })
  }, [slug, challengeIdForAi])

  // ── Pedir ajuda ao Codi sobre um teste que falhou (Tarefa 3.1) ──
  // Trunca pra respeitar os limites do failedTestSchema no backend (500/500/1000 chars)
  const handleAskCodi = useCallback((result: TestResult) => {
    helpRequestSeq.current += 1
    setHelpRequest({
      failedTest: {
        description: result.description.slice(0, 500),
        expected: result.error ? undefined : serializeTestValue(result.expected),
        actual: result.error ? undefined : serializeTestValue(result.actual),
        error: result.error?.slice(0, 1000),
      },
      nonce: helpRequestSeq.current,
    })
    setCodiOpen(true)
  }, [])

  // Termina worker ao desmontar
  useEffect(() => {
    return () => {
      workerRef.current?.terminate()
    }
  }, [])

  // ── Executar testes localmente ──
  const handleRun = useCallback(() => {
    const challenge = moduleData?.challenge
    if (!challenge?.testCases?.length) return

    // Termina worker anterior se ainda rodar
    workerRef.current?.terminate()

    setRunState('running')
    setTestResults(null)
    setSubmitResult(null)

    const worker = new Worker(
      new URL('../../workers/sandbox.worker.ts', import.meta.url),
      { type: 'module' },
    )
    workerRef.current = worker

    // Timeout de segurança: 5s
    const timeout = setTimeout(() => {
      worker.terminate()
      setRunState('done')
      setTestResults([{
        passed: false,
        input: null,
        expected: null,
        actual: null,
        description: 'Tempo limite excedido (5s). Verifique se há loop infinito.',
      }])
    }, 5000)

    worker.onmessage = (e: MessageEvent<{ results: TestResult[] }>) => {
      clearTimeout(timeout)
      worker.terminate()
      setTestResults(e.data.results)
      setRunState('done')
    }

    worker.onerror = () => {
      clearTimeout(timeout)
      worker.terminate()
      setRunState('done')
      setTestResults([{
        passed: false,
        input: null,
        expected: null,
        actual: null,
        description: 'Erro inesperado ao executar o código.',
        error: 'Erro interno do sandbox.',
      }])
    }

    worker.postMessage({ code: codeRef.current, testCases: challenge.testCases, targetFn: challenge.targetFn })
  }, [moduleData])

  // ── Enviar submissão ──
  const handleSubmit = useCallback(async () => {
    const challenge = moduleData?.challenge
    if (!slug || !challenge || submitState === 'submitting') return

    setSubmitState('submitting')
    setSubmitError(null)
    setSubmitResult(null)

    try {
      // Resolve classId
      let classId = currentClass?.id
      if (!classId) {
        const learnRes = await api.get<{ data: { class: { id: string; name: string } } }>(
          `/api/${slug}/learn`,
        )
        classId = learnRes.data.class.id
        setCurrentClass({ id: classId, name: learnRes.data.class.name })
      }

      const res = await api.post<{ data: SubmitResult }>(
        `/api/${slug}/challenges/${challenge.id}/submissions`,
        { classId, code: codeRef.current },
      )
      setSubmitResult(res.data)

      // Atualiza test results com os resultados do servidor
      if (res.data.submission.testResults) {
        setTestResults(res.data.submission.testResults)
        setRunState('done')
      }
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : 'Erro ao enviar solução.')
    } finally {
      setSubmitState('idle')
    }
  }, [moduleData, submitState, currentClass, slug, setCurrentClass])

  // ── Loading / Error ──
  if (loading) {
    return (
      <div className={styles.state}>
        <span className={styles.stateText}>// carregando desafio...</span>
      </div>
    )
  }

  if (loadError || !moduleData) {
    return (
      <div className={styles.state}>
        <span className={styles.stateError}>{loadError ?? 'Erro desconhecido.'}</span>
      </div>
    )
  }

  async function handleCompleteLesson() {
    if (!slug || !moduleId) return
    setCompletingLesson(true)
    setSubmitError(null)
    try {
      const res = await api.post<{ data: { xpEarned: number; alreadyCompleted: boolean; nextModuleId: string | null } }>(
        `/api/${slug}/learn/modules/${moduleId}/complete`,
        {},
      )
      setLessonResult(res.data)
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : 'Erro ao concluir a lição.')
    } finally {
      setCompletingLesson(false)
    }
  }

  const { module: mod, challenge } = moduleData
  const starterCode = challenge?.starterCode ?? '// Escreva seu código aqui\n'
  const hasTests = (challenge?.testCases?.length ?? 0) > 0

  return (
    <div className={styles.root}>

      {/* ── Header ── */}
      <header className={styles.header}>
        <Link to={`/${slug}/learn/${trailId}`} className={styles.backLink}>
          <IconChevronLeft />
          Trilha
        </Link>

        <div className={styles.headerCenter}>
          <h1 className={styles.headerTitle}>
            {challenge ? challenge.title : mod.title}
          </h1>
          {challenge && (
            <span className={`${styles.diffBadge} ${diffClass(challenge.difficulty)}`}>
              {DIFF_LABEL[challenge.difficulty]}
            </span>
          )}
        </div>

        <div className={styles.headerActions}>
          <button
            className={styles.helpChallengeBtn}
            onClick={() => {
              setCodiOpen(true)
              autoMsgSeq.current += 1
              setAutoMsg({ text: challenge ? 'Poderia me explicar o desafio?' : 'Pode me explicar esta lição?', nonce: autoMsgSeq.current })
            }}
          >
            {challenge ? '💡 Me ajude com este desafio' : '💡 Me ajude com esta lição'}
          </button>
          <button
            className={`${styles.codiToggle} ${codiOpen ? styles.codiToggleActive : ''}`}
            onClick={() => setCodiOpen((v) => !v)}
            aria-label="Abrir tutor Codi"
          >
            <IconBot />
            <span>Codi</span>
          </button>
        </div>
      </header>

      {/* ── Layout principal ── */}
      <div className={styles.layout}>

        {/* ── Painel esquerdo: conteúdo do módulo ── */}
        <aside className={styles.leftPanel}>

          {/* Conceito */}
          {mod.concept && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>// conceito</h2>
              <div className={styles.conceptBody}>
                <ConceptText text={mod.concept} />
              </div>
            </section>
          )}

          {/* Código de exemplo */}
          {mod.exampleCode && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>// exemplo</h2>
              <pre className={styles.exampleCode}>
                <code>{mod.exampleCode}</code>
              </pre>
            </section>
          )}

          {/* Descrição do desafio */}
          {challenge?.description && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>// desafio</h2>
              <div className={styles.challengeDesc}>
                <ConceptText text={challenge.description} />
              </div>
            </section>
          )}

          {/* Tentativas */}
          {moduleData.progress.attempts > 0 && (
            <p className={styles.attemptsNote}>
              {moduleData.progress.attempts} tentativa{moduleData.progress.attempts !== 1 ? 's' : ''}
            </p>
          )}
        </aside>

        {/* ── Painel direito: editor + resultados ── */}
        <div className={styles.rightPanel}>
          {challenge ? (
            <>

          {/* Editor */}
          <div className={styles.editorWrapper}>
            <div className={styles.editorHeader}>
              <span className={styles.editorFilename}>solution.js</span>
              <div className={styles.editorDots}>
                <span /><span /><span />
              </div>
            </div>
            <div className={styles.editorBody}>
              {moduleData?.visualBlocksEnabled ? (
                <BlocklyEditor
                  key={`blocks-${challenge?.id ?? mod.id}-${resetNonce}`}
                  onChange={(v) => { codeRef.current = v }}
                />
              ) : (
                <CodeEditor
                  key={`${challenge?.id ?? mod.id}-${resetNonce}`}
                  initialValue={starterCode}
                  onChange={(v) => { codeRef.current = v }}
                  vocabulary={moduleData?.availableVocabulary ?? []}
                />
              )}
            </div>
          </div>

          {/* Botões de ação */}
          <div className={styles.actionBar}>
            {hasTests && (
              <button
                className={styles.runBtn}
                onClick={handleRun}
                disabled={runState === 'running'}
                aria-busy={runState === 'running'}
              >
                <IconPlay />
                {runState === 'running' ? 'Executando...' : 'Executar'}
              </button>
            )}

            {challenge && (
              <button
                className={styles.submitBtn}
                onClick={handleSubmit}
                disabled={submitState === 'submitting'}
                aria-busy={submitState === 'submitting'}
              >
                {submitState === 'submitting' ? 'Enviando...' : '✓ Enviar solução'}
              </button>
            )}

            {challenge && (
              <button
                className={styles.resetBtn}
                type="button"
                onClick={() => {
                  codeRef.current = starterCode
                  setResetNonce((n) => n + 1)
                }}
                title="Volta o código ao ponto inicial do desafio"
              >
                ↺ Resetar código
              </button>
            )}
          </div>

          {/* Resultado da submissão */}
          {submitResult && <SubmitResultPanel result={submitResult} />}
          {submitResult?.submission.status === 'passed' && (
            <div className={styles.nextActions}>
              {moduleData?.nextModuleId ? (
                <Link
                  to={`/${slug}/learn/${trailId}/module/${moduleData.nextModuleId}`}
                  className={styles.btnNext}
                >
                  Próximo desafio →
                </Link>
              ) : (
                <Link to={`/${slug}/learn/${trailId}`} className={styles.btnNext}>
                  🎉 Você concluiu a trilha!
                </Link>
              )}
              <Link to={`/${slug}/learn/${trailId}`} className={styles.btnBackTrail}>
                Voltar à trilha
              </Link>
            </div>
          )}
          {submitError && <p className={styles.submitError}>{submitError}</p>}

          {/* Resultados dos testes */}
          {testResults && runState === 'done' && (
            <TestResultsPanel
              results={testResults}
              onAskCodi={handleAskCodi}
              aiHelpEnabled={aiData?.aiErrorExplanationEnabled ?? false}
            />
          )}
            </>
          ) : (
            <div className={styles.lessonPanel}>
              {!lessonResult ? (
                <>
                  <div className={styles.lessonCard}>
                    <span className={styles.lessonIcon}>📖</span>
                    <p className={styles.lessonText}>Esta é uma <strong>lição</strong>. Leia o conceito e o exemplo ao lado e, quando terminar, avance.</p>
                    <p className={styles.lessonHint}>Ficou com dúvida? Abra o <strong>Codi</strong> aqui em cima — ele conhece esta lição.</p>
                  </div>
                  <button className={styles.lessonBtn} onClick={handleCompleteLesson} disabled={completingLesson}>
                    {completingLesson ? 'Salvando...' : 'Entendi, avançar →'}
                  </button>
                  {submitError && <p className={styles.submitError}>{submitError}</p>}
                </>
              ) : (
                <div className={styles.nextActions}>
                  <p className={styles.lessonDone}>✅ Lição concluída!{lessonResult.xpEarned > 0 ? ` +${lessonResult.xpEarned} XP` : ''}</p>
                  {lessonResult.nextModuleId ? (
                    <Link to={`/${slug}/learn/${trailId}/module/${lessonResult.nextModuleId}`} className={styles.btnNext}>Próximo →</Link>
                  ) : (
                    <Link to={`/${slug}/learn/${trailId}`} className={styles.btnNext}>🎉 Você concluiu a trilha!</Link>
                  )}
                  <Link to={`/${slug}/learn/${trailId}`} className={styles.btnBackTrail}>Voltar à trilha</Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Codi Drawer ── */}
      {moduleData && (
        <>
          {codiOpen && (
            <div
              className={styles.codiOverlay}
              onClick={() => setCodiOpen(false)}
              aria-hidden="true"
            />
          )}
          <CodiDrawer
            open={codiOpen}
            onClose={() => setCodiOpen(false)}
            challengeId={challenge?.id ?? null}
            moduleId={moduleId ?? null}
            isLesson={!challenge}
            slug={slug!}
            getCode={() => codeRef.current}
            conversation={aiData}
            pendingHelpRequest={helpRequest}
            autoMessage={autoMsg}
          />
        </>
      )}
    </div>
  )
}
