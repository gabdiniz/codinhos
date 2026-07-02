import { Reveal } from '../ui/Reveal'
import { Section } from '../ui/Section'
import styles from './ComoFunciona.module.css'

const STEPS = [
  {
    n: '01',
    title: 'A escola contrata',
    text: 'Sua instituição ganha um ambiente próprio no Codinhos, com as suas cores e a sua logo. Os dados de cada escola ficam separados.',
  },
  {
    n: '02',
    title: 'O gestor configura',
    text: 'A partir de um catálogo pronto, o gestor monta as trilhas, cria as turmas e define como cada aluno avança — sem precisar criar conteúdo do zero.',
  },
  {
    n: '03',
    title: 'O aluno aprende praticando',
    text: 'O aluno resolve desafios escrevendo código no navegador, com feedback na hora, ganhando XP e conquistas — e o Codi por perto quando trava.',
  },
]

export function ComoFunciona() {
  return (
    <Section
      id="como-funciona"
      eyebrow="Como funciona"
      title="Do contrato à primeira linha de código, em três passos"
      lead="Sem carga técnica para a escola: o Codinhos entrega as peças prontas, o gestor só organiza."
    >
      <div className={styles.grid}>
        {STEPS.map((step, i) => (
          <Reveal key={step.n} delay={i * 120}>
            <article className={styles.card}>
              <span className={styles.num}>{step.n}</span>
              <h3 className={styles.cardTitle}>{step.title}</h3>
              <p className={styles.cardText}>{step.text}</p>
            </article>
          </Reveal>
        ))}
      </div>
    </Section>
  )
}
