'use client'

import { type FormEvent, useState } from 'react'
import styles from './ContactForm.module.css'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333'
const FALLBACK_EMAIL = 'contato@codinhos.com.br'

type Status = 'idle' | 'sending' | 'ok' | 'error'

export function ContactForm() {
  const [name, setName] = useState('')
  const [school, setSchool] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState<string | null>(null)

  /** Validação no cliente com mensagens amigáveis, espelhando o schema da API. */
  function validate(): string | null {
    if (name.trim().length < 2) return 'Preencha seu nome (mínimo 2 caracteres).'
    if (school.trim().length < 2) return 'Preencha o nome da escola (mínimo 2 caracteres).'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      return 'Informe um e-mail válido (ex.: nome@escola.com.br).'
    if (message.trim().length < 5)
      return 'Sua mensagem está muito curta — escreva pelo menos 5 caracteres.'
    return null
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (status === 'sending') return

    const validationError = validate()
    if (validationError) {
      setStatus('error')
      setError(validationError)
      return
    }

    setStatus('sending')
    setError(null)

    try {
      const res = await fetch(`${API_URL}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          school: school.trim(),
          email: email.trim(),
          message: message.trim(),
        }),
      })

      if (res.status === 429) {
        setStatus('error')
        setError('Você enviou várias mensagens em pouco tempo. Tente de novo daqui a pouco.')
        return
      }
      if (res.status === 400) {
        setStatus('error')
        setError('Confira os campos: algum ficou incompleto ou muito curto.')
        return
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      setStatus('ok')
      setName('')
      setSchool('')
      setEmail('')
      setMessage('')
    } catch {
      setStatus('error')
      setError('Não consegui enviar sua mensagem agora.')
    }
  }

  if (status === 'ok') {
    return (
      <div className={styles.success} role="status">
        <strong className={styles.successTitle}>Mensagem enviada! 🎉</strong>
        <p className={styles.successText}>
          Recebemos seu contato e retornamos em breve. Enquanto isso, o Codi está aqui no cantinho
          pra tirar dúvidas.
        </p>
      </div>
    )
  }

  const sending = status === 'sending'

  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate>
      <div className={styles.row}>
        <label className={styles.field}>
          <span className={styles.label}>Seu nome</span>
          <input
            className={styles.input}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            minLength={2}
            maxLength={120}
            autoComplete="name"
            disabled={sending}
          />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>Escola</span>
          <input
            className={styles.input}
            value={school}
            onChange={(e) => setSchool(e.target.value)}
            required
            minLength={2}
            maxLength={160}
            autoComplete="organization"
            disabled={sending}
          />
        </label>
      </div>

      <label className={styles.field}>
        <span className={styles.label}>E-mail</span>
        <input
          className={styles.input}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          maxLength={200}
          autoComplete="email"
          disabled={sending}
        />
      </label>

      <label className={styles.field}>
        <span className={styles.label}>Mensagem</span>
        <textarea
          className={styles.textarea}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          minLength={5}
          maxLength={2000}
          rows={4}
          placeholder="Conte um pouco sobre a sua escola e o que você procura."
          disabled={sending}
        />
      </label>

      {error && (
        <p className={styles.error} role="alert">
          {error} Se preferir, escreva pra{' '}
          <a className={styles.link} href={`mailto:${FALLBACK_EMAIL}`}>
            {FALLBACK_EMAIL}
          </a>
          .
        </p>
      )}

      <button type="submit" className={styles.submit} disabled={sending}>
        {sending ? 'Enviando…' : 'Enviar mensagem'}
      </button>
    </form>
  )
}
