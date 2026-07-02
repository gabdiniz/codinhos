import styles from './Hero.module.css'

export function Hero() {
  return (
    <section className={styles.hero}>
      <div className={styles.glow} aria-hidden="true" />

      <div className={styles.inner}>
        <div className={styles.copy}>
          <span className={`${styles.tag} ${styles.reveal}`}>
            Programação para escolas · 11–14 anos
          </span>

          <h1 className={`${styles.title} ${styles.reveal}`}>
            Aprenda a <span className={styles.gradient}>programar</span> brincando
          </h1>

          <p className={`${styles.subtitle} ${styles.reveal}`}>
            JavaScript na prática, com desafios no navegador, gamificação e o Codi, um tutor de IA
            que ajuda sem entregar a resposta. Tudo dentro do ambiente da sua escola.
          </p>

          <div className={`${styles.actions} ${styles.reveal}`}>
            <a href="#contato" className={styles.primary}>
              Falar com a gente
            </a>
            <a href="#trilha" className={styles.secondary}>
              Ver a trilha ▸
            </a>
          </div>

          <p className={`${styles.trust} ${styles.reveal}`}>
            Feito para a sala de aula · Sem instalar nada · Conteúdo pronto e de qualidade
          </p>
        </div>

        <div className={`${styles.demo} ${styles.reveal}`}>
          <div className={styles.codeCard}>
            <div className={styles.codeBar}>
              <span className={styles.dot} data-c="r" />
              <span className={styles.dot} data-c="y" />
              <span className={styles.dot} data-c="g" />
              <span className={styles.codeFile}>desafio.js</span>
            </div>
            <pre className={styles.code}>
              <code>
                <span className={styles.line}>
                  <span className={styles.kw}>function</span>{' '}
                  <span className={styles.fn}>saudar</span>(nome) {'{'}
                </span>
                <span className={styles.line}>
                  {'  '}
                  <span className={styles.kw}>return</span>{' '}
                  <span className={styles.str}>{'`Olá, ${nome}! 🚀`'}</span>
                </span>
                <span className={styles.line}>{'}'}</span>
                <span className={styles.line} />
                <span className={styles.line}>
                  <span className={styles.fn}>saudar</span>(<span className={styles.str}>'Ana'</span>)
                  <span className={styles.caret} />
                </span>
                <span className={`${styles.line} ${styles.comment}`}>{'// ▸ "Olá, Ana! 🚀"'}</span>
              </code>
            </pre>
          </div>

          <div className={`${styles.badge} ${styles.badgeXp}`}>+120 XP</div>
          <div className={`${styles.badge} ${styles.badgeStreak}`}>🔥 7 dias seguidos</div>
        </div>
      </div>
    </section>
  )
}
