import { NavLink, Outlet, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.tsx'
import { api } from '../lib/api.ts'
import { NotificationBell } from '../components/NotificationBell/NotificationBell.tsx'
import styles from './AdminShell.module.css'

// ─── Ícones ───────────────────────────────────────────────────────────────────

function IconBuilding() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  )
}

function IconAward() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="8" r="6" />
      <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
    </svg>
  )
}

function IconUsers() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function IconBook() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
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

// ─── AdminShell ───────────────────────────────────────────────────────────────

export function AdminShell() {
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
    { to: `/${slug}/admin/tenants`, label: 'Escolas',   icon: <IconBuilding />, end: false },
    { to: `/${slug}/admin/badges`,  label: 'Badges',    icon: <IconAward />,    end: false },
    { to: `/${slug}/admin/catalog`, label: 'Catálogo',  icon: <IconBook />,     end: false },
    { to: `/${slug}/admin/users`,   label: 'Usuários',  icon: <IconUsers />,    end: false },
  ]

  return (
    <div className={styles.root}>
      {/* ── Sidebar (desktop) ── */}
      <aside className={styles.sidebar}>
        <div className={styles.logo} aria-label="Codinhos Admin">
          <span className={styles.bracket} aria-hidden="true">{'{'}</span>
          <span className={styles.brand}>cod</span>
          <span className={styles.bracket} aria-hidden="true">{'}'}</span>
          <span className={styles.adminTag}>admin</span>
        </div>

        <nav className={styles.nav} aria-label="Navegação do admin">
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
            <span className={styles.userRole}>Super Admin</span>
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
