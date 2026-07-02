import type { ReactNode } from 'react'
import { Reveal } from '../ui/Reveal'
import { Section } from '../ui/Section'
import styles from './ParaEscolas.module.css'

type Feature = { icon: ReactNode; title: string; text: string }

const FEATURES: Feature[] = [
  {
    icon: <IconPalette />,
    title: 'O ambiente da sua escola',
    text: 'Espaço próprio com as suas cores e a sua logo. Os dados de cada escola ficam isolados.',
  },
  {
    icon: <IconCatalog />,
    title: 'Catálogo pronto',
    text: 'Monte trilhas escolhendo e ordenando módulos de qualidade — nada de criar conteúdo do zero.',
  },
  {
    icon: <IconFlow />,
    title: 'Progressão configurável',
    text: 'Escolha por turma: livre, sequencial ou liberada manualmente pelo educador.',
  },
  {
    icon: <IconCheck />,
    title: 'Avaliação flexível',
    text: 'Automática por testes, automática com revisão, ou totalmente manual para desafios abertos.',
  },
  {
    icon: <IconChart />,
    title: 'Relatórios de progresso',
    text: 'Acompanhe quem completou o quê, por aluno e por turma, e identifique quem precisa de apoio.',
  },
  {
    icon: <IconUsers />,
    title: 'Onboarding simples',
    text: 'Convite por e-mail e cadastro de alunos um a um ou por planilha (CSV), com modelo pronto.',
  },
]

export function ParaEscolas() {
  return (
    <Section
      id="para-escolas"
      alt
      eyebrow="Para escolas"
      title="Controle total, sem trabalho técnico"
      lead="O gestor organiza a experiência a partir de peças prontas. Nada para programar, instalar ou manter."
    >
      <div className={styles.grid}>
        {FEATURES.map((f, i) => (
          <Reveal key={f.title} delay={(i % 3) * 100}>
            <article className={styles.card}>
              <span className={styles.icon}>{f.icon}</span>
              <h3 className={styles.cardTitle}>{f.title}</h3>
              <p className={styles.cardText}>{f.text}</p>
            </article>
          </Reveal>
        ))}
      </div>
    </Section>
  )
}

/* ── ícones (stroke = currentColor, herda a cor do tema) ─────────────────── */

function svgProps() {
  return {
    width: 22,
    height: 22,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }
}

function IconPalette() {
  return (
    <svg {...svgProps()}>
      <circle cx="13.5" cy="6.5" r="1.2" />
      <circle cx="17.5" cy="10.5" r="1.2" />
      <circle cx="8.5" cy="7.5" r="1.2" />
      <circle cx="6.5" cy="12.5" r="1.2" />
      <path d="M12 2a10 10 0 1 0 0 20 2 2 0 0 0 2-2 2 2 0 0 1 2-2h2a4 4 0 0 0 4-4 10 10 0 0 0-12-10z" />
    </svg>
  )
}

function IconCatalog() {
  return (
    <svg {...svgProps()}>
      <path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z" />
      <path d="M9 3v18" />
    </svg>
  )
}

function IconFlow() {
  return (
    <svg {...svgProps()}>
      <rect x="3" y="4" width="6" height="4" rx="1" />
      <rect x="15" y="9" width="6" height="4" rx="1" />
      <rect x="3" y="16" width="6" height="4" rx="1" />
      <path d="M9 6h4a2 2 0 0 1 2 2v3M9 18h4a2 2 0 0 0 2-2v-1" />
    </svg>
  )
}

function IconCheck() {
  return (
    <svg {...svgProps()}>
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  )
}

function IconChart() {
  return (
    <svg {...svgProps()}>
      <path d="M3 3v18h18" />
      <path d="M7 14v3M12 9v8M17 6v11" />
    </svg>
  )
}

function IconUsers() {
  return (
    <svg {...svgProps()}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20a6 6 0 0 1 12 0" />
      <path d="M16 5.5a3 3 0 0 1 0 5.8M21 20a6 6 0 0 0-4-5.6" />
    </svg>
  )
}
