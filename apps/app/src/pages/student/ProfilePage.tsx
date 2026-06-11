import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api, ApiError } from '../../lib/api.ts'
import { useAuth } from '../../contexts/AuthContext.tsx'
import styles from './ProfilePage.module.css'

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface MyStats {
  totalXp: number
  level: number
  currentStreak: number
  longestStreak: number
  badges: EarnedBadge[]
}

interface EarnedBadge {
  id: string
  slug: string
  name: string
  earnedAt: string
}

interface BadgeCatalogEntry {
  id: string
  slug: string
  name: string
  description: string
  iconUrl: string | null
  triggerType: string
  triggerValue: number | null
  earned: boolean
  earnedAt: string | null
}

// ─── Ícones inline ────────────────────────────────────────────────────────────

function IconStar() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
}

function IconShield() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  )
}

function IconFlame() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </svg>
  )
}

function IconZap() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  )
}

function IconLock() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function xpForLevel(level: number): number {
  return level * 100
}

function xpProgress(totalXp: number, level: number) {
  const currentLevelXp = xpForLevel(level - 1)
  const nextLevelXp = xpForLevel(level)
  const earned = totalXp - currentLevelXp
  const needed = nextLevelXp - currentLevelXp
  return { earned, needed, pct: Math.min(100, Math.round((earned / needed) * 100)) }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function triggerLabel(type: string, value: number | null): string {
  const v = value ?? 0
  const map: Record<string, string> = {
    xp_total:          `${v.toLocaleString('pt-BR')} XP`,
    challenges_solved: `${v} desafio${v !== 1 ? 's' : ''}`,
    streak_days:       `${v} dia${v !== 1 ? 's' : ''} de streak`,
    level_reached:     `Nível ${v}`,
  }
  return map[type] ?? type
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function ProfilePage() {
  const { slug } = useParams<{ slug: string }>()
  const { user } = useAuth()

  const [stats, setStats] = useState<MyStats | null>(null)
  const [badges, setBadges] = useState<BadgeCatalogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!slug) return

    Promise.all([
      api.get<{ data: MyStats }>(`/api/${slug}/gamification/me`),
      api.get<{ data: BadgeCatalogEntry[] }>(`/api/${slug}/gamification/badges`),
    ])
      .then(([statsRes, badgesRes]) => {
        setStats(statsRes.data)
        setBadges(badgesRes.data)
      })
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : 'Erro ao carregar perfil.')
      })
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) {
    return (
      <div className={styles.state}>
        <span className={styles.stateText}>// carregando perfil...</span>
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className={styles.state}>
        <span className={styles.stateError}>{error ?? 'Erro desconhecido.'}</span>
      </div>
    )
  }

  const initials = (user?.name ?? 'A')
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()

  const { earned: xpEarned, needed: xpNeeded, pct: xpPct } = xpProgress(stats.totalXp, stats.level)
  const earnedBadges = badges.filter((b) => b.earned)
  const lockedBadges = badges.filter((b) => !b.earned)

  return (
    <div className={styles.root}>

      {/* ── Hero ── */}
      <section className={styles.hero}>
        <div className={styles.avatarWrap}>
          <div className={styles.avatar}>{initials}</div>
          <div className={styles.levelBadge}>
            <span className={styles.levelBadgeLabel}>Nível</span>
            <span className={styles.levelBadgeValue}>{stats.level}</span>
          </div>
        </div>

        <div className={styles.heroInfo}>
          <h1 className={styles.name}>{user?.name}</h1>
          <p className={styles.subtitle}>// {stats.totalXp.toLocaleString('pt-BR')} XP acumulado</p>

          <div className={styles.xpBarWrap}>
            <div className={styles.xpBarTrack}>
              <div className={styles.xpBarFill} style={{ width: `${xpPct}%` }} />
            </div>
            <div className={styles.xpBarMeta}>
              <span className={styles.xpBarLabel}>{xpEarned} / {xpNeeded} XP para nível {stats.level + 1}</span>
              <span className={styles.xpBarPct}>{xpPct}%</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className={styles.statsGrid}>
        <StatCard icon={<IconStar />}   label="XP Total"     value={stats.totalXp.toLocaleString('pt-BR')} colorVar="--color-xp" />
        <StatCard icon={<IconShield />} label="Nível"         value={String(stats.level)}                   colorVar="--color-level" />
        <StatCard icon={<IconFlame />}  label="Streak atual"  value={`${stats.currentStreak}d`}             colorVar="--color-accent" />
        <StatCard icon={<IconZap />}    label="Maior streak"  value={`${stats.longestStreak}d`}             colorVar="--color-primary" />
      </section>

      {/* ── Badges conquistadas ── */}
      {earnedBadges.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>// conquistas</h2>
          <div className={styles.badgeGrid}>
            {earnedBadges.map((badge) => (
              <BadgeCard key={badge.id} badge={badge} />
            ))}
          </div>
        </section>
      )}

      {/* ── Badges bloqueadas ── */}
      {lockedBadges.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>// bloqueadas</h2>
          <div className={styles.badgeGrid}>
            {lockedBadges.map((badge) => (
              <BadgeCard key={badge.id} badge={badge} locked />
            ))}
          </div>
        </section>
      )}

      {badges.length === 0 && (
        <p className={styles.empty}>// nenhuma conquista cadastrada ainda.</p>
      )}
    </div>
  )
}

// ─── StatCard ─────────────────────────────────────────────────────────────────

function StatCard({
  icon, label, value, colorVar,
}: {
  icon: React.ReactNode
  label: string
  value: string
  colorVar: string
}) {
  return (
    <div
      className={styles.statCard}
      style={{ '--stat-color': `var(${colorVar})` } as React.CSSProperties}
    >
      <span className={styles.statIcon}>{icon}</span>
      <span className={styles.statValue}>{value}</span>
      <span className={styles.statLabel}>{label}</span>
    </div>
  )
}

// ─── BadgeCard ────────────────────────────────────────────────────────────────

function BadgeCard({ badge, locked = false }: { badge: BadgeCatalogEntry; locked?: boolean }) {
  const emojiMap: Record<string, string> = {
    xp_total:          '⭐',
    challenges_solved: '🏆',
    streak_days:       '🔥',
    level_reached:     '🛡️',
  }
  const emoji = emojiMap[badge.triggerType] ?? '🎖️'

  return (
    <div className={`${styles.badgeCard} ${locked ? styles.badgeLocked : styles.badgeEarned}`}>
      <div className={styles.badgeIconWrap}>
        {badge.iconUrl
          ? <img src={badge.iconUrl} alt={badge.name} className={styles.badgeImg} />
          : <span className={styles.badgeEmoji} aria-hidden="true">{emoji}</span>
        }
        {locked && (
          <span className={styles.badgeLockOverlay}>
            <IconLock />
          </span>
        )}
      </div>

      <div className={styles.badgeInfo}>
        <span className={styles.badgeName}>{badge.name}</span>
        <span className={styles.badgeDesc}>
          {locked ? triggerLabel(badge.triggerType, badge.triggerValue) : badge.description}
        </span>
        {!locked && badge.earnedAt && (
          <span className={styles.badgeDate}>{formatDate(badge.earnedAt)}</span>
        )}
      </div>
    </div>
  )
}
