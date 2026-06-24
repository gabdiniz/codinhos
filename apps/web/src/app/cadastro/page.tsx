import styles from './page.module.css'

export default function CadastroPage() {
  return (
    <main className={styles.main}>
      <div className={styles.card}>
        <h1 className={styles.title}>Leve o Codinhos para sua escola</h1>
        <p className={styles.subtitle}>
          Conte um pouco sobre sua escola e nossa equipe entra em contato para configurar uma
          turma piloto.
        </p>
        <a className={styles.button} href="mailto:contato@codinhos.com.br">
          Falar com a equipe
        </a>
      </div>
    </main>
  )
}
