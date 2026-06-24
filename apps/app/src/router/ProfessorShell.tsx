import { NavLink, Outlet, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.tsx'
import { api } from '../lib/api.ts'
import { NotificationBell } from '../components/NotificationBell/NotificationBell.tsx'
import styles from './ProfessorShell.module.css'

// ─── Ícones (inline SVG) ──────────────────────────────────────────────────────

function IconLayers() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  )
}

function IconClipboard() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 2h6a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z" />
      <path d="M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2" />
      <path d="m9 14 2 2 4-4" />
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

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
  return <div className={styles.avatar} aria-hidden="true">{initials}</div>
}

// ─── ProfessorShell ───────────────────────────────────────────────────────────

export function ProfessorShell() {
  const { slug } = useParams<{ slug: string }>()
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    try {
      await api.post(`/api/${slug}/auth/logout`)
    } finally {
      logout()
      navigate(`/${slug}/login`, { replace: true })
    }
  }

  const navItems = [
    { to: `/${slug}/professor`,        label: 'Turmas',   icon: <IconLayers />,    end: true },
    { to: `/${slug}/professor/review`, label: 'Revisões', icon: <IconClipboard />, end: false },
  ]

  return (
    <div className={styles.root}>
      {/* ── Sidebar (desktop) ── */}
      <aside className={styles.sidebar}>
        <div className={styles.logo} aria-label="Codinhos">
          <span className={styles.bracket} aria-hidden="true">{'{'}</span>
          <span className={styles.brand}>cod</span>
          <span className={styles.bracket} aria-hidden="true">{'}'}</span>
        </div>

        <nav className={styles.nav} aria-label="Navegação do professor">
          {navItems.map(({ to, label, icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                isActive ? `${styles.navItem} ${styles.navItemActive}` : styles.navItem
              }
            >
              <span className={styles.navIcon}>{icon}</span>
              <span className={styles.navLabel}>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className={styles.userArea}>
          {user && <Avatar name={user.name} />}
          <div className={styles.userInfo}>
            <span className={styles.userName}>{user?.name}</span>
            <span className={styles.userRole}>Professor</span>
          </div>
          <NotificationBell />
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

      {/* ── Conteúdo ── */}
      <main className={styles.main}>
        <Outlet />
      </main>

      {/* ── Bottom nav (mobile) ── */}
      <nav className={styles.bottomNav} aria-label="Navegação mobile">
        {navItems.map(({ to, label, icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
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
