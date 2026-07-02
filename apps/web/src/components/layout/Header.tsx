'use client'

import Link from 'next/link'
import { useState } from 'react'
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
  const [open, setOpen] = useState(false)

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href="/" className={styles.brand} aria-label="Codinhos — início">
          <CodiMascot size={30} />
          <span className={styles.brandName}>Codinhos</span>
        </Link>

        {/* Navegação desktop */}
        <nav className={styles.nav} aria-label="Navegação principal">
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} className={styles.navLink}>
              {link.label}
            </a>
          ))}
        </nav>

        {/* Ações desktop */}
        <div className={styles.actions}>
          <ThemeToggle />
          <a href="#contato" className={styles.cta}>
            Falar com a gente
          </a>
        </div>

        {/* Ações mobile: tema + hambúrguer */}
        <div className={styles.mobileActions}>
          <ThemeToggle />
          <button
            type="button"
            className={styles.burger}
            aria-label={open ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((v) => !v)}
          >
            <span className={styles.burgerBar} data-open={open} />
            <span className={styles.burgerBar} data-open={open} />
            <span className={styles.burgerBar} data-open={open} />
          </button>
        </div>
      </div>

      {/* Painel mobile */}
      {open && (
        <nav id="mobile-menu" className={styles.mobilePanel} aria-label="Navegação principal">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={styles.mobileLink}
              onClick={() => setOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <a href="#contato" className={styles.mobileCta} onClick={() => setOpen(false)}>
            Falar com a gente
          </a>
        </nav>
      )}
    </header>
  )
}
