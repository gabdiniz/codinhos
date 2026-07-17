import { Reveal } from '../ui/Reveal'
import { Section } from '../ui/Section'
import styles from './Gamificacao.module.css'

const PILLARS = [
  {
    emoji: '⚡',
    title: 'XP e níveis',
    text: 'Pontos a cada desafio, com bônus por poucas tentativas e conceitos novos. Níveis com títulos que marcam a evolução.',
  },
  {
    emoji: '🏅',
    title: 'Conquistas',
    text: 'Badges por marcos (primeira trilha, resolver sem dicas) e conquistas raras que dão aquele senso de "quero também".',
  },
  {
    emoji: '🏆',
    title: 'Ranking por turma',
    text: 'Competição saudável dentro da turma — nunca global — para motivar sem desanimar quem está começando.',
  },
  {
    emoji: '🔥',
    title: 'Sequência diária',
    text: 'A missão do dia mantém o hábito. Praticar todo dia vira streak, e streak vira constância.',
  },
  {
    emoji: '🎨',
    title: 'Avatar que evolui',
    text: 'Cada aluno monta seu avatar num estúdio próprio. Penteados, acessórios e fundos especiais desbloqueiam conforme ele sobe de nível — recompensa visível, sem pedir foto da criança.',
  },
]

export function Gamificacao() {
  return (
    <Section
      id="gamificacao"
      alt
      eyebrow="Gamificação"
      title="Aprender que parece jogo — e engaja de verdade"
      lead="Gamificação não é enfeite: é parte do método, calibrada para o aluno sentir progresso e querer continuar."
    >
      <div className={styles.grid}>
        {PILLARS.map((p, i) => (
          <Reveal key={p.title} delay={(i % 2) * 110}>
            <article className={styles.card}>
              <span className={styles.emoji} aria-hidden="true">
                {p.emoji}
              </span>
              <h3 className={styles.cardTitle}>{p.title}</h3>
              <p className={styles.cardText}>{p.text}</p>
            </article>
          </Reveal>
        ))}
      </div>
    </Section>
  )
}
