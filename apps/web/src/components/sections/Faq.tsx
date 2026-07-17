'use client'

import { useState } from 'react'
import { Reveal } from '../ui/Reveal'
import styles from './Faq.module.css'

const ITEMS = [
  {
    q: 'Para que idade é o Codinhos?',
    a: 'Para crianças e adolescentes de 11 a 14 anos. Todo o conteúdo, a linguagem e os desafios são pensados para essa faixa.',
  },
  {
    q: 'Que linguagens o aluno aprende?',
    a: 'JavaScript e Python — duas das linguagens mais usadas no mundo e excelentes portas de entrada para programar. Além do código de texto, há desafios visuais em que o aluno programa desenhos e animações.',
  },
  {
    q: 'Precisa instalar alguma coisa?',
    a: 'Não. O aluno escreve e roda o código direto no navegador. Basta acesso à internet.',
  },
  {
    q: 'O aluno precisa já saber programar?',
    a: 'Não. As trilhas começam do zero, pelos fundamentos, e evoluem de forma gradual.',
  },
  {
    q: 'Quem monta o conteúdo das aulas?',
    a: 'O conteúdo vem de um catálogo pronto e de qualidade, mantido pela equipe do Codinhos. O gestor só seleciona e ordena os módulos — e, quando quer algo sob medida, pode gerar novos desafios com apoio de IA e revisá-los antes de publicar.',
  },
  {
    q: 'É seguro para crianças?',
    a: 'Sim. Os dados de cada escola ficam separados, seguimos a LGPD e o tutor de IA tem proteções para manter as conversas adequadas à idade e no tema do aprendizado.',
  },
  {
    q: 'Quanto custa?',
    a: 'Os planos são tratados diretamente com a nossa equipe, de acordo com a realidade de cada escola. Fale com a gente para receber uma proposta.',
  },
  {
    q: 'Como levo o Codinhos para a minha escola?',
    a: 'É só entrar em contato pelo formulário do site. A nossa equipe retorna para entender sua necessidade e apresentar o Codinhos em detalhe.',
  },
]

export function Faq() {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <section id="faq" className={styles.section}>
      <div className={styles.container}>
        <Reveal className={styles.head}>
          <span className={styles.eyebrow}>Perguntas frequentes</span>
          <h2 className={styles.title}>Ainda com dúvidas?</h2>
          <p className={styles.lead}>
            As perguntas mais comuns de quem está pensando em levar o Codinhos para a escola.
          </p>
        </Reveal>

        <Reveal className={styles.list}>
          {ITEMS.map((item, i) => {
            const isOpen = open === i
            return (
              <div key={item.q} className={styles.item}>
                <button
                  type="button"
                  className={styles.question}
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? null : i)}
                >
                  <span>{item.q}</span>
                  <span className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`} aria-hidden="true">
                    ⌄
                  </span>
                </button>
                <div className={`${styles.answer} ${isOpen ? styles.answerOpen : ''}`}>
                  <p>{item.a}</p>
                </div>
              </div>
            )
          })}
        </Reveal>
      </div>
    </section>
  )
}
