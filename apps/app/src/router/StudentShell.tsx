import { NavLink, Outlet, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.tsx'
import { api } from '../lib/api.ts'
import styles from './StudentShell.module.css'

// ─── Ícones (inline SVG — sem dependência externa) ────────────────────────────

function IconBook() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  )
}

function IconUser() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

function IconTrophy() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2z" />
    </svg>
  )
}

function IconLogout() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  )
}

// ─── Avatar com iniciais ──────────────────────────────────────────────────────

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()

  return (
    <div className={styles.avatar} aria-hidden="true">
      {initials}
    </div>
  )
}

// ─── StudentShell ─────────────────────────────────────────────────────────────

export function StudentShell() {
  const { slug } = useParams<{ slug: string }>()
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    try {
      await api.post(`/api/${slug}/auth/logout`)
    } finally {
      // Garante logout local mesmo se a chamada falhar
      logout()
      navigate(`/${slug}/login`, { replace: true })
    }
  }

  const navItems = [
    { to: `/${slug}/learn`,   label: 'Trilhas',  icon: <IconBook /> },
    { to: `/${slug}/profile`, label: 'Perfil',   icon: <IconUser /> },
    { to: `/${slug}/ranking`, label: 'Ranking',  icon: <IconTrophy /> },
  ]

  return (
    <div className={styles.root}>
      {/* ── Sidebar (desktop) ── */}
      <aside className={styles.sidebar}>
        {/* Logo */}
        <div className={styles.logo} aria-label="Codinhos">
          <span className={styles.bracket} aria-hidden="true">{'{'}</span>
          <span className={styles.brand}>cod</span>
          <span className={styles.bracket} aria-hidden="true">{'}'}</span>
        </div>

        {/* Navegação */}
        <nav className={styles.nav} aria-label="Navegação principal">
          {navItems.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                isActive
                  ? `${styles.navItem} ${styles.navItemActive}`
                  : styles.navItem
              }
            >
              <span className={styles.navIcon}>{icon}</span>
              <span className={styles.navLabel}>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Área do usuário */}
        <div className={styles.userArea}>
          {user && <Avatar name={user.name} />}
          <div className={styles.userInfo}>
            <span className={styles.userName}>{user?.name}</span>
            <span className={styles.userRole}>Aluno</span>
          </div>
          <button
            className={styles.logoutBtn}
            onClick={handleLogout}
            aria-label="Sair da conta"
            title="Sair"
          >
            <IconLogout />
          </button>
        </div>
      </aside>

      {/* ── Conteúdo da página ── */}
      <main className={styles.main}>
        <Outlet />
      </main>

      {/* ── Bottom nav (mobile) ── */}
      <nav className={styles.bottomNav} aria-label="Navegação mobile">
        {navItems.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              isActive
                ? `${styles.bottomNavItem} ${styles.bottomNavItemActive}`
                : styles.bottomNavItem
            }
          >
            <span className={styles.bottomNavIcon}>{icon}</span>
            <span className={styles.bottomNavLabel}>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
