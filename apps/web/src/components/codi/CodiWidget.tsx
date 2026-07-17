'use client'

import { type FormEvent, type ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import { CodiMascot } from './CodiMascot'
import styles from './CodiWidget.module.css'

/**
 * Widget do Codi na LP — assistente de dúvidas sobre o produto (pré-venda).
 * Conversa de verdade com o endpoint público POST /api/codi/ask, que responde
 * a partir da base curada (docs/codi-kb) com guardrails. Stateless: enviamos o
 * histórico recente a cada pergunta. Fora do escopo, o Codi encaminha ao contato.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333'
const CONTACT_HREF = '#contato'

const SUGGESTIONS = [
  'O que é o Codinhos?',
  'Como funciona pra escola?',
  'O que o aluno aprende?',
  'É seguro pra crianças?',
]

type Msg = { id: string; role: 'user' | 'assistant'; content: string }

let msgSeq = 0
function uid(role: string) {
  msgSeq += 1
  return `${role}-${Date.now()}-${msgSeq}`
}

// ─── Renderização leve de texto ───────────────────────────────────────────────
// O Codi é instruído a responder em texto corrido, mas caso escape algum
// markdown simples (negrito, listas), formatamos com segurança (sem HTML cru).

function renderInline(text: string, prefix: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**') ? (
      <strong key={`${prefix}-${i}`}>{part.slice(2, -2)}</strong>
    ) : (
      <span key={`${prefix}-${i}`}>{part}</span>
    ),
  )
}

function RichText({ text }: { text: string }) {
  // Remove marcadores de título (#, ##) que não fazem sentido num balão de chat
  const clean = text.replace(/^#{1,6}\s*/gm, '').trim()
  const blocks = clean.split(/\n{2,}/)

  return (
    <>
      {blocks.map((block, bi) => {
        const lines = block.split('\n')
        const isList = lines.length > 0 && lines.every((l) => /^\s*[-*]\s+/.test(l))

        if (isList) {
          return (
            <ul key={`b-${bi}`} className={styles.mdList}>
              {lines.map((l, li) => (
                <li key={`b-${bi}-${li}`}>
                  {renderInline(l.replace(/^\s*[-*]\s+/, ''), `b-${bi}-${li}`)}
                </li>
              ))}
            </ul>
          )
        }

        return (
          <p key={`b-${bi}`}>{renderInline(block.replace(/\n/g, ' '), `b-${bi}`)}</p>
        )
      })}
    </>
  )
}

// ─── Efeito de digitação (apenas visual) ──────────────────────────────────────
// A resposta chega inteira do servidor; aqui a revelamos palavra a palavra para
// simular o Codi "escrevendo em tempo real". Respeita prefers-reduced-motion.

const TYPE_INTERVAL_MS = 50

function useReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    if (!mq) return
    setReduced(mq.matches)
    const onChange = () => setReduced(mq.matches)
    mq.addEventListener?.('change', onChange)
    return () => mq.removeEventListener?.('change', onChange)
  }, [])
  return reduced
}

function TypedBubble({
  content,
  animate,
  onProgress,
  onDone,
}: {
  content: string
  animate: boolean
  onProgress?: () => void
  onDone?: () => void
}) {
  // Tokeniza mantendo os espaços, para reconstruir o texto exatamente
  const tokens = useMemo(() => content.split(/(\s+)/), [content])
  const [count, setCount] = useState(animate ? 0 : tokens.length)

  useEffect(() => {
    if (!animate) {
      setCount(tokens.length)
      return
    }
    setCount(0)
    let c = 0
    const id = window.setInterval(() => {
      c += 1
      setCount(c)
      onProgress?.()
      if (c >= tokens.length) {
        window.clearInterval(id)
        onDone?.()
      }
    }, TYPE_INTERVAL_MS)
    return () => window.clearInterval(id)
    // onProgress/onDone são estáveis o suficiente; não queremos reiniciar a animação
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animate, tokens])

  const done = count >= tokens.length
  const shown = done ? content : tokens.slice(0, count).join('')

  return (
    <div className={`${styles.bubbleBot} ${done ? '' : styles.botTyping}`}>
      <RichText text={shown} />
    </div>
  )
}

export function CodiWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // id da resposta recém-chegada que deve ser "digitada" (só ela anima)
  const [freshId, setFreshId] = useState<string | null>(null)
  const bodyRef = useRef<HTMLDivElement | null>(null)
  const reducedMotion = useReducedMotion()

  const scrollToBottom = () => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight })
  }

  // Rola para a última mensagem
  // biome-ignore lint/correctness/useExhaustiveDependencies: rola a cada nova msg/loading
  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, loading])

  async function send(text: string) {
    const question = text.trim()
    if (!question || loading) return

    setError(null)
    const history = messages.slice(-8).map((m) => ({ role: m.role, content: m.content }))
    setMessages((m) => [...m, { id: uid('user'), role: 'user', content: question }])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch(`${API_URL}/api/codi/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: question, history }),
      })

      if (res.status === 429) {
        setError('Muitas perguntas em pouco tempo. Tente de novo daqui a pouco.')
        return
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const json = (await res.json()) as { data?: { answer?: string } }
      const answer = json?.data?.answer?.trim()
      if (!answer) throw new Error('resposta vazia')

      const id = uid('assistant')
      setMessages((m) => [...m, { id, role: 'assistant', content: answer }])
      if (!reducedMotion) setFreshId(id)
    } catch {
      setError('Não consegui responder agora. Tente de novo ou fale com a gente pelo formulário.')
    } finally {
      setLoading(false)
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    void send(input)
  }

  const empty = messages.length === 0

  return (
    <div className={styles.root}>
      {open && (
        <div className={styles.panel} role="dialog" aria-label="Converse com o Codi">
          <header className={styles.header}>
            <span className={styles.avatar}>
              <CodiMascot size={30} />
            </span>
            <div>
              <strong className={styles.name}>Codi</strong>
              <span className={styles.status}>Tira suas dúvidas sobre o Codinhos</span>
            </div>
            <button
              type="button"
              className={styles.close}
              onClick={() => setOpen(false)}
              aria-label="Fechar"
            >
              ×
            </button>
          </header>

          <div className={styles.body} ref={bodyRef} aria-live="polite">
            <div className={styles.bubbleBot}>
              <p>Oi! Eu sou o Codi 👋 Pode perguntar o que quiser sobre o Codinhos.</p>
            </div>

            {messages.map((m) =>
              m.role === 'assistant' ? (
                <TypedBubble
                  key={m.id}
                  content={m.content}
                  animate={m.id === freshId}
                  onProgress={scrollToBottom}
                  onDone={() => setFreshId(null)}
                />
              ) : (
                <div key={m.id} className={styles.bubbleUser}>
                  <p>{m.content}</p>
                </div>
              ),
            )}

            {loading && (
              <div className={styles.bubbleBot}>
                <span className={styles.typing}>
                  <i /> <i /> <i />
                </span>
              </div>
            )}

            {empty && !loading && (
              <div className={styles.chips}>
                {SUGGESTIONS.map((s) => (
                  <button key={s} type="button" className={styles.chip} onClick={() => send(s)}>
                    {s}
                  </button>
                ))}
              </div>
            )}

            {error && (
              <p className={styles.error} role="alert">
                {error}{' '}
                <a className={styles.link} href={CONTACT_HREF} onClick={() => setOpen(false)}>
                  falar com a gente
                </a>
                .
              </p>
            )}
          </div>

          <form className={styles.inputRow} onSubmit={onSubmit}>
            <input
              className={styles.input}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escreva sua pergunta…"
              maxLength={1000}
              aria-label="Sua pergunta para o Codi"
              disabled={loading}
            />
            <button
              type="submit"
              className={styles.send}
              disabled={loading || input.trim().length === 0}
              aria-label="Enviar"
            >
              ↑
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        className={styles.launcher}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? 'Fechar chat do Codi' : 'Abrir chat do Codi'}
      >
        <span className={styles.launcherAvatar}>
          <CodiMascot size={30} />
        </span>
        <span className={styles.launcherText}>Falar com o Codi</span>
      </button>
    </div>
  )
}
