import { Reveal } from '../ui/Reveal'
import { Section } from '../ui/Section'
import styles from './Trilha.module.css'

const TOPICS = [
  { label: 'Lógica básica', hint: 'condicionais e loops' },
  { label: 'Variáveis e tipos', hint: 'guardando informação' },
  { label: 'Funções', hint: 'reaproveitar código' },
  { label: 'Arrays e listas', hint: 'coleções de dados' },
  { label: 'Desafios visuais', hint: 'programar desenhos e animações' },
  { label: 'Mini-projetos', hint: 'um jogo, uma calculadora' },
]

const ANATOMY = [
  { title: 'Conceito', text: 'Uma explicação curta da ideia.' },
  { title: 'Exemplo guiado', text: 'Código pronto e comentado.' },
  { title: 'Desafio', text: 'O aluno escreve ou modifica o código.' },
  { title: 'Validação', text: 'Verificação na hora ou revisão do educador.' },
]

export function Trilha() {
  return (
    <Section
      id="trilha"
      eyebrow="A trilha"
      title={
        <>
          Programação de verdade, em <span className={styles.grad}>JavaScript e Python</span>
        </>
      }
      lead="Duas das linguagens mais usadas no mundo, ensinadas do zero e de forma gradual — sempre praticando."
    >
      <div className={styles.layout}>
        <Reveal className={styles.col}>
          <h3 className={styles.colTitle}>O que o aluno aprende</h3>
          <ul className={styles.topics}>
            {TOPICS.map((t) => (
              <li key={t.label} className={styles.topic}>
                <span className={styles.dot} />
                <span className={styles.topicText}>
                  <span className={styles.topicLabel}>{t.label}</span>
                  <span className={styles.topicHint}>{t.hint}</span>
                </span>
              </li>
            ))}
          </ul>
          <p className={styles.note}>
            A avaliação olha se o código <strong>funciona</strong> — então cada desafio aceita mais
            de uma solução válida. Não existe resposta decorada.
          </p>
          <p className={styles.note}>
            Acolhedor para quem nunca programou: <strong>autocomplete</strong> que sugere só o que o
            aluno já aprendeu, <strong>erros em linguagem amigável</strong> e um{' '}
            <strong>modo de blocos</strong> para montar a lógica antes de digitar.
          </p>
        </Reveal>

        <Reveal className={styles.col} delay={140}>
          <h3 className={styles.colTitle}>Como cada módulo funciona</h3>
          <ol className={styles.anatomy}>
            {ANATOMY.map((step, i) => (
              <li key={step.title} className={styles.step}>
                <span className={styles.stepNum}>{i + 1}</span>
                <div>
                  <strong className={styles.stepTitle}>{step.title}</strong>
                  <span className={styles.stepText}>{step.text}</span>
                </div>
              </li>
            ))}
          </ol>
        </Reveal>
      </div>
    </Section>
  )
}
