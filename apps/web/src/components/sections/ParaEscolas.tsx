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
    title: 'Catálogo pronto ou trilha própria',
    text: 'Monte trilhas escolhendo módulos de qualidade — ou crie percursos sob medida para a sua escola.',
  },
  {
    icon: <IconSparkles />,
    title: 'Geração de desafios com IA',
    text: 'Descreva o tema e receba um rascunho de desafio pronto para revisar — com a solução já testada automaticamente antes de chegar até você.',
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
    icon: <IconRoles />,
    title: 'Professores e responsáveis',
    text: 'Professores acompanham só as suas turmas e revisam entregas. Responsáveis acompanham os filhos em modo leitura.',
  },
  {
    icon: <IconChart />,
    title: 'Relatórios de progresso',
    text: 'Acompanhe quem completou o quê, por aluno e por turma, e identifique quem precisa de apoio.',
  },
  {
    icon: <IconShield />,
    title: 'Integridade acadêmica',
    text: 'Receba um alerta quando duas entregas do mesmo desafio ficam muito parecidas, ajudando a identificar possíveis cópias.',
  },
  {
    icon: <IconUsers />,
    title: 'Cadastro sem trabalho',
    text: 'Convite por e-mail e cadastro de alunos um a um ou por planilha (CSV), com modelo pronto.',
  },
  {
    icon: <IconImport />,
    title: 'Integração com Google Classroom',
    text: 'Importe turmas e alunos direto de um curso do Classroom, sem cadastrar aluno por aluno.',
  },
  {
    icon: <IconAward />,
    title: 'Certificados com a sua marca',
    text: 'O aluno baixa um certificado em PDF ao concluir uma trilha, com a identidade da escola.',
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
    // Ícones decorativos (o título ao lado já dá o significado)
    'aria-hidden': true,
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

function IconSparkles() {
  return (
    <svg {...svgProps()}>
      <path d="M12 3l1.8 4.7L18.5 9.5 13.8 11.3 12 16l-1.8-4.7L5.5 9.5l4.7-1.8z" />
      <path d="M18 15l.7 1.8L20.5 17.5l-1.8.7L18 20l-.7-1.8L15.5 17.5l1.8-.7z" />
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

function IconRoles() {
  return (
    <svg {...svgProps()}>
      <path d="M12 3 2 8l10 5 10-5z" />
      <path d="M6 10.5V15c0 1.5 2.7 3 6 3s6-1.5 6-3v-4.5" />
      <path d="M22 8v5" />
    </svg>
  )
}

function IconImport() {
  return (
    <svg {...svgProps()}>
      <path d="M12 3v11" />
      <path d="M8 11l4 4 4-4" />
      <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
    </svg>
  )
}

function IconShield() {
  return (
    <svg {...svgProps()}>
      <path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  )
}

function IconAward() {
  return (
    <svg {...svgProps()}>
      <circle cx="12" cy="9" r="5" />
      <path d="M9 13.5 7.5 22 12 19.5 16.5 22 15 13.5" />
    </svg>
  )
}
