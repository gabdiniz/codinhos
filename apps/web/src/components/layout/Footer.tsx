import Link from 'next/link'
import { CodiMascot } from '../codi/CodiMascot'
import styles from './Footer.module.css'

const LINKS = [
  { href: '#como-funciona', label: 'Como funciona' },
  { href: '#para-escolas', label: 'Para escolas' },
  { href: '#trilha', label: 'Trilha' },
  { href: '#gamificacao', label: 'Gamificação' },
  { href: '#faq', label: 'FAQ' },
  { href: 'mailto:contato@codinhos.com.br', label: 'Contato' },
]

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brandCol}>
          <Link href="/" className={styles.brand} aria-label="Codinhos — início">
            <CodiMascot size={28} />
            <span className={styles.brandName}>Codinhos</span>
          </Link>
          <p className={styles.tagline}>
            Programação para escolas, do jeito que criança de 11 a 14 anos aprende: praticando.
          </p>
        </div>

        <nav className={styles.nav} aria-label="Navegação do rodapé">
          {LINKS.map((link) => (
            <a key={link.href} href={link.href} className={styles.link}>
              {link.label}
            </a>
          ))}
        </nav>
      </div>

      <div className={styles.bottom}>
        <span>© {year} Codinhos</span>
        <span>Feito para a sala de aula</span>
      </div>
    </footer>
  )
}
