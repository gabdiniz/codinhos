import Link from 'next/link'
import styles from './page.module.css'

export default function HomePage() {
  return (
    <main className={styles.main}>
      <section className={styles.hero}>
        <h1 className={styles.title}>Codinhos</h1>
        <p className={styles.subtitle}>
          Programação de verdade para alunos de 11 a 14 anos — desafios práticos, sandbox no
          navegador e tutor de IA, direto na sua escola.
        </p>
        <div className={styles.actions}>
          <Link className={styles.primaryButton} href="/login">
            Entrar
          </Link>
          <Link className={styles.secondaryButton} href="/cadastro">
            Levar para minha escola
          </Link>
        </div>
      </section>
    </main>
  )
}
