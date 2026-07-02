import type { ReactNode } from 'react'
import { Reveal } from './Reveal'
import styles from './Section.module.css'

type SectionProps = {
  id: string
  eyebrow?: string
  title: ReactNode
  lead?: ReactNode
  /** Fundo levemente tingido para criar ritmo entre seções */
  alt?: boolean
  children: ReactNode
}

/** Casca visual consistente para as seções da landing. */
export function Section({ id, eyebrow, title, lead, alt = false, children }: SectionProps) {
  return (
    <section id={id} className={`${styles.section} ${alt ? styles.alt : ''}`}>
      <div className={styles.container}>
        <Reveal className={styles.head}>
          {eyebrow && <span className={styles.eyebrow}>{eyebrow}</span>}
          <h2 className={styles.title}>{title}</h2>
          {lead && <p className={styles.lead}>{lead}</p>}
        </Reveal>
        {children}
      </div>
    </section>
  )
}
