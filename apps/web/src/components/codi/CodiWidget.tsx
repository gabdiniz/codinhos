'use client'

import { type FormEvent, type ReactNode, useEffect, useRef, useState } from 'react'
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

type Msg = { role: 'user' | 'assistant'; content: string }

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

export function CodiWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bodyRef = useRef<HTMLDivElement | null>(null)

  // Rola para a última mensagem
  // biome-ignore lint/correctness/useExhaustiveDependencies: rola a cada nova msg/loading
  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, loading])

  async function send(text: string) {
    const question = text.trim()
    if (!question || loading) return

    setError(null)
    const history = messages.slice(-8)
    setMessages((m) => [...m, { role: 'user', content: question }])
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

      setMessages((m) => [...m, { role: 'assistant', content: answer }])
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

            {messages.map((m, i) => (
              <div
                key={`${m.role}-${i}`}
                className={m.role === 'user' ? styles.bubbleUser : styles.bubbleBot}
              >
                {m.role === 'assistant' ? <RichText text={m.content} /> : <p>{m.content}</p>}
              </div>
            ))}

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
