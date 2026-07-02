'use client'

import { useState } from 'react'
import { CodiMascot } from './CodiMascot'
import styles from './CodiWidget.module.css'

/**
 * Widget do Codi na LP — assistente de dúvidas sobre o produto (pré-venda).
 *
 * PLACEHOLDER: por enquanto responde com resumos estáticos da base de
 * conhecimento pública (docs/codi-kb). O próximo passo é ligar a um endpoint
 * público de IA (RAG sobre a docs/codi-kb) — ver docs/planejamento.md,
 * seção "Codi na Landing Page". Fora do escopo do produto, o Codi encaminha
 * para o contato por e-mail.
 */

type Topic = {
  id: string
  chip: string
  question: string
  answer: string
}

const TOPICS: Topic[] = [
  {
    id: 'sobre',
    chip: 'O que é o Codinhos?',
    question: 'O que é o Codinhos?',
    answer:
      'É uma plataforma onde crianças de 11 a 14 anos aprendem a programar de verdade, escrevendo código no navegador. O foco inicial é JavaScript, por desafios práticos, com gamificação e um tutor de IA (esse sou eu!). É feito para escolas.',
  },
  {
    id: 'escolas',
    chip: 'Como funciona pra escola?',
    question: 'Como funciona para a escola?',
    answer:
      'A escola ganha um ambiente próprio, com suas cores e logo. O gestor monta trilhas a partir de um catálogo pronto, cria turmas, define como o aluno avança e acompanha o progresso por relatórios — sem precisar criar conteúdo do zero.',
  },
  {
    id: 'trilha',
    chip: 'O que o aluno aprende?',
    question: 'O que o aluno aprende?',
    answer:
      'Os fundamentos da programação em JavaScript: lógica (condicionais e loops), variáveis, funções, arrays e mini-projetos como um joguinho ou uma calculadora. Cada módulo tem conceito, exemplo guiado e desafio.',
  },
  {
    id: 'gamificacao',
    chip: 'Tem gamificação?',
    question: 'Como funciona a gamificação?',
    answer:
      'Bastante! XP a cada desafio, níveis com títulos, conquistas (badges), ranking por turma e sequência diária. Tudo calibrado para o aluno sentir progresso e querer continuar.',
  },
  {
    id: 'privacidade',
    chip: 'É seguro pra crianças?',
    question: 'É seguro para crianças?',
    answer:
      'Sim. Os dados de cada escola ficam separados, seguimos a LGPD e eu (o tutor de IA) tenho proteções para manter as conversas no tema do aprendizado e adequadas à idade.',
  },
]

const CONTACT_HREF = '#contato'

export function CodiWidget() {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState<Topic | null>(null)

  return (
    <div className={styles.root}>
      {open && (
        <div className={styles.panel} role="dialog" aria-label="Converse com o Codi">
          <header className={styles.header}>
            <CodiMascot size={36} />
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

          <div className={styles.body}>
            {active ? (
              <div className={styles.bubbleBot}>
                <p>{active.answer}</p>
              </div>
            ) : (
              <div className={styles.bubbleBot}>
                <p>Oi! Eu sou o Codi 👋 Sobre o que você quer saber?</p>
              </div>
            )}

            <div className={styles.chips}>
              {TOPICS.map((topic) => (
                <button
                  key={topic.id}
                  type="button"
                  className={styles.chip}
                  onClick={() => setActive(topic)}
                >
                  {topic.chip}
                </button>
              ))}
            </div>

            <p className={styles.note}>
              Em breve vou responder qualquer pergunta ao vivo. Por enquanto, para falar com uma
              pessoa,{' '}
              <a className={styles.link} href={CONTACT_HREF} onClick={() => setOpen(false)}>
                deixe seu contato
              </a>
              .
            </p>
          </div>
        </div>
      )}

      <button
        type="button"
        className={styles.launcher}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? 'Fechar chat do Codi' : 'Abrir chat do Codi'}
      >
        <CodiMascot size={34} />
        <span className={styles.launcherText}>Falar com o Codi</span>
      </button>
    </div>
  )
}
