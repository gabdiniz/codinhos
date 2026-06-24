'use client'

import { type FormEvent, useState } from 'react'
import styles from './page.module.css'

// URL do app autenticado (Vite). O login de fato acontece em /:slug/login —
// ver agent_docs/autenticacao.md. Esta página só resolve o slug da escola.
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:5173'

export default function LoginPage() {
  const [slug, setSlug] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmed = slug.trim()
    if (!trimmed) return
    window.location.href = `${APP_URL}/${trimmed}/login`
  }

  return (
    <main className={styles.main}>
      <div className={styles.card}>
        <h1 className={styles.title}>Entrar</h1>
        <p className={styles.subtitle}>
          Informe o identificador (slug) da sua escola para acessar a plataforma.
        </p>
        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.label} htmlFor="slug">
            Slug da escola
          </label>
          <input
            id="slug"
            className={styles.input}
            type="text"
            placeholder="ex: escola-modelo"
            value={slug}
            onChange={(event) => setSlug(event.target.value)}
            autoComplete="off"
            required
          />
          <button className={styles.button} type="submit">
            Continuar
          </button>
        </form>
      </div>
    </main>
  )
}
