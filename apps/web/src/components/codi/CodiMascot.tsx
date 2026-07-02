type CodiMascotProps = {
  size?: number
  className?: string
}

/**
 * Primeiro rascunho do mascote Codi — um robozinho amigável com carinha de
 * terminal ({ });. Usa currentColor + tokens para se adaptar ao tema.
 * A arte definitiva do personagem ainda será feita (ver docs/pesquisa-lp-vendas.md).
 */
export function CodiMascot({ size = 40, className }: CodiMascotProps) {
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
      {/* antena */}
      <line x1="24" y1="4" x2="24" y2="10" stroke="var(--color-accent)" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="24" cy="4" r="2.5" fill="var(--color-accent)" />
      {/* cabeça */}
      <rect x="8" y="10" width="32" height="26" rx="9" fill="var(--color-primary)" />
      {/* rosto */}
      <rect x="12" y="14" width="24" height="18" rx="6" fill="var(--color-surface)" />
      {/* olhos */}
      <circle cx="19" cy="22" r="2.4" fill="var(--color-primary)" />
      <circle cx="29" cy="22" r="2.4" fill="var(--color-primary)" />
      {/* boca sorrindo tipo código */}
      <path d="M18 27 Q24 30 30 27" stroke="var(--color-accent)" strokeWidth="2.2" strokeLinecap="round" fill="none" />
      {/* bochechas */}
      <circle cx="14.5" cy="26" r="1.6" fill="var(--color-pop)" opacity="0.7" />
      <circle cx="33.5" cy="26" r="1.6" fill="var(--color-pop)" opacity="0.7" />
      {/* corpo/base */}
      <rect x="16" y="37" width="16" height="6" rx="3" fill="var(--color-secondary)" />
    </svg>
  )
}
