import styles from './CodiMascot.module.css'

type CodiVariant = 'robo' | 'robo2' | 'terminal' | 'terminal2'

type CodiMascotProps = {
  size?: number
  /**
   * Estilo do mascote:
   * - 'robo'      → robozinho fofo
   * - 'robo2'     → robô redondo com fones e brilho
   * - 'terminal'  → janela de terminal com 3 pontinhos (padrão)
   * - 'terminal2' → balão de chat com prompt
   */
  variant?: CodiVariant
  /** Liga as micro-animações idle (piscar, flutuar, pulsar). Padrão: true. */
  animated?: boolean
  className?: string
}

/**
 * Mascote Codi. Quatro variantes de arte, mesma identidade de cor (tokens do tema).
 * Animações são 100% CSS (ver CodiMascot.module.css) e respeitam prefers-reduced-motion.
 */
export function CodiMascot({
  size = 40,
  variant = 'terminal',
  animated = true,
  className,
}: CodiMascotProps) {
  const cls = [styles.mascot, animated ? styles.animated : null, className]
    .filter(Boolean)
    .join(' ')

  switch (variant) {
    case 'robo2':
      return <RoboCodi2 size={size} className={cls} />
    case 'terminal':
      return <TerminalCodi size={size} className={cls} />
    case 'terminal2':
      return <TerminalCodi2 size={size} className={cls} />
    default:
      return <RoboCodi size={size} className={cls} />
  }
}

/* ── A · robô fofo (v1) ──────────────────────────────────────────────────── */

function RoboCodi({ size, className }: { size: number; className: string }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      role="img"
      aria-label="Codi, o mascote do Codinhos"
    >
      <line x1="24" y1="5" x2="24" y2="11" stroke="var(--color-accent)" strokeWidth="2.5" strokeLinecap="round" />
      <circle className={styles.pulse} cx="24" cy="4.5" r="2.6" fill="var(--color-accent)" />
      <rect x="4.5" y="20" width="4" height="8" rx="2" fill="var(--color-secondary)" />
      <rect x="39.5" y="20" width="4" height="8" rx="2" fill="var(--color-secondary)" />
      <rect x="8" y="11" width="32" height="26" rx="10" fill="var(--color-primary)" />
      <rect x="12" y="15" width="24" height="17" rx="6" fill="var(--color-surface)" />
      <circle className={styles.eye} cx="19" cy="22" r="2.7" fill="var(--color-primary)" />
      <circle className={`${styles.eye} ${styles.eye2}`} cx="29" cy="22" r="2.7" fill="var(--color-primary)" />
      <circle cx="20" cy="21" r="0.8" fill="var(--color-surface)" />
      <circle cx="30" cy="21" r="0.8" fill="var(--color-surface)" />
      <circle className={styles.cheek} cx="14.8" cy="27" r="1.7" fill="var(--color-pop)" opacity="0.7" />
      <circle className={styles.cheek} cx="33.2" cy="27" r="1.7" fill="var(--color-pop)" opacity="0.7" />
      <path className={styles.mouth} d="M18.5 27 Q24 30.5 29.5 27" stroke="var(--color-accent)" strokeWidth="2.2" strokeLinecap="round" fill="none" />
      <rect x="16" y="38" width="16" height="5" rx="2.5" fill="var(--color-secondary)" />
    </svg>
  )
}

/* ── A2 · robô redondo com fones (v2) ────────────────────────────────────── */

function RoboCodi2({ size, className }: { size: number; className: string }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      role="img"
      aria-label="Codi, o mascote do Codinhos"
    >
      {/* antena + brilho (sparkle) */}
      <line x1="24" y1="9" x2="24" y2="6" stroke="var(--color-accent)" strokeWidth="2.4" strokeLinecap="round" />
      <path className={styles.pulse} d="M24 1.5 L25.1 3.7 L27.3 4.8 L25.1 5.9 L24 8.1 L22.9 5.9 L20.7 4.8 L22.9 3.7 Z" fill="var(--color-accent)" />
      {/* arco dos fones */}
      <path d="M9 19 A16 16 0 0 1 39 19" stroke="var(--color-secondary)" strokeWidth="2.6" strokeLinecap="round" fill="none" />
      {/* cabeça redonda */}
      <circle cx="24" cy="25" r="14" fill="var(--color-primary)" />
      {/* conchas dos fones */}
      <rect x="4.5" y="21" width="6" height="9" rx="3" fill="var(--color-secondary)" />
      <rect x="37.5" y="21" width="6" height="9" rx="3" fill="var(--color-secondary)" />
      {/* visor / rosto */}
      <ellipse cx="24" cy="25.5" rx="11" ry="8.5" fill="var(--color-surface)" />
      {/* olhos grandes (piscam) */}
      <ellipse className={styles.eye} cx="19.5" cy="24" rx="2.3" ry="3" fill="var(--color-primary)" />
      <ellipse className={`${styles.eye} ${styles.eye2}`} cx="28.5" cy="24" rx="2.3" ry="3" fill="var(--color-primary)" />
      <circle cx="20.4" cy="23" r="0.85" fill="var(--color-surface)" />
      <circle cx="29.4" cy="23" r="0.85" fill="var(--color-surface)" />
      {/* bochechas */}
      <circle className={styles.cheek} cx="15" cy="28.5" r="1.9" fill="var(--color-pop)" opacity="0.75" />
      <circle className={styles.cheek} cx="33" cy="28.5" r="1.9" fill="var(--color-pop)" opacity="0.75" />
      {/* sorriso */}
      <path className={styles.mouth} d="M20.5 29 Q24 32.2 27.5 29" stroke="var(--color-accent)" strokeWidth="2.2" strokeLinecap="round" fill="none" />
    </svg>
  )
}

/* ── C · terminal (v1) ───────────────────────────────────────────────────── */

function TerminalCodi({ size, className }: { size: number; className: string }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      role="img"
      aria-label="Codi, o mascote do Codinhos"
    >
      <rect x="6" y="9" width="36" height="30" rx="7" fill="var(--color-primary)" />
      <circle cx="13" cy="15" r="1.7" fill="var(--color-pop)" />
      <circle cx="18.5" cy="15" r="1.7" fill="var(--color-warning)" />
      <circle cx="24" cy="15" r="1.7" fill="var(--color-accent)" />
      <rect x="10" y="20" width="28" height="15" rx="4" fill="var(--neutral-900)" />
      <circle className={styles.eye} cx="19" cy="26.5" r="2.4" fill="var(--color-accent)" />
      <circle className={`${styles.eye} ${styles.eye2}`} cx="29" cy="26.5" r="2.4" fill="var(--color-accent)" />
      <path className={styles.mouth} d="M19 31 Q24 33.6 29 31" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" fill="none" />
      <rect className={styles.caret} x="33" y="24.5" width="2.2" height="5.5" rx="1" fill="var(--color-accent)" />
    </svg>
  )
}

/* ── C2 · balão de chat com prompt (v2) ──────────────────────────────────── */

function TerminalCodi2({ size, className }: { size: number; className: string }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      role="img"
      aria-label="Codi, o mascote do Codinhos"
    >
      {/* balão de chat */}
      <rect x="6" y="8" width="36" height="27" rx="9" fill="var(--color-primary)" />
      {/* rabinho do balão */}
      <path d="M13 33 L13 41 L20 33 Z" fill="var(--color-primary)" />
      {/* tela escura */}
      <rect x="10" y="13" width="28" height="17" rx="5" fill="var(--neutral-900)" />
      {/* prompt > no canto */}
      <path d="M13 16.5 L15.2 18.4 L13 20.3" stroke="var(--color-accent)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {/* olhos (piscam) */}
      <circle className={styles.eye} cx="20" cy="22.5" r="2.4" fill="var(--color-accent)" />
      <circle className={`${styles.eye} ${styles.eye2}`} cx="29" cy="22.5" r="2.4" fill="var(--color-accent)" />
      {/* sorriso */}
      <path className={styles.mouth} d="M20 27 Q24.5 29.4 29 27" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" fill="none" />
      {/* cursor piscando */}
      <rect className={styles.caret} x="33.2" y="20.3" width="2.2" height="5" rx="1" fill="var(--color-accent)" />
    </svg>
  )
}
