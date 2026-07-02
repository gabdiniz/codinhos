import Link from 'next/link'
import { CodiMascot } from '../codi/CodiMascot'
import { ThemeToggle } from '../theme/ThemeToggle'
import styles from './Header.module.css'

const NAV_LINKS = [
  { href: '#como-funciona', label: 'Como funciona' },
  { href: '#para-escolas', label: 'Para escolas' },
  { href: '#trilha', label: 'Trilha' },
  { href: '#gamificacao', label: 'Gamificação' },
  { href: '#faq', label: 'FAQ' },
]

export function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href="/" className={styles.brand} aria-label="Codinhos — início">
          <CodiMascot size={30} />
          <span className={styles.brandName}>Codinhos</span>
        </Link>

        <nav className={styles.nav} aria-label="Navegação principal">
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} className={styles.navLink}>
              {link.label}
            </a>
          ))}
        </nav>

        <div className={styles.actions}>
          <ThemeToggle />
          <a href="#contato" className={styles.cta}>
            Falar com a gente
          </a>
        </div>
      </div>
    </header>
  )
}
