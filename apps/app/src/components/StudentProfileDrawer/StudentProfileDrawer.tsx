import { useEffect, useState } from 'react'
import { api, ApiError } from '../../lib/api.ts'
import type { AvatarConfig } from '@codinhos/types'
import { Avatar } from '../Avatar/Avatar.tsx'
import styles from './StudentProfileDrawer.module.css'

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface EarnedBadge {
  id: string
  slug: string
  name: string
  earnedAt: string
}

interface StudentProfileData {
  id: string
  name: string
  avatarUrl: string | null
  avatarConfig: AvatarConfig | null
  age: number | null
  className: string | null
  totalXp: number
  level: number
  currentStreak: number
  longestStreak: number
  badges: EarnedBadge[]
  // Exclusivos do gestor — vêm null quando quem está vendo é outro aluno
  email: string | null
  birthDate: string | null
  createdAt: string | null
}

interface StudentProfileDrawerProps {
  open: boolean
  onClose: () => void
  slug: string
  /** ID do aluno cujo perfil será exibido — null fecha/limpa o drawer */
  studentId: string | null
}

// ─── Ícones inline ────────────────────────────────────────────────────────────

function IconClose() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

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

// ─── Componente principal ─────────────────────────────────────────────────────

export default function StudentProfileDrawer({
  open, onClose, slug, studentId,
}: StudentProfileDrawerProps) {
  const [profile, setProfile] = useState<StudentProfileData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !studentId) return

    setLoading(true)
    setError(null)
    setProfile(null)

    api.get<{ data: StudentProfileData }>(`/api/${slug}/students/${studentId}/profile`)
      .then((res) => setProfile(res.data))
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : 'Erro ao carregar perfil.')
      })
      .finally(() => setLoading(false))
  }, [open, studentId, slug])

  const isManagerView = profile?.email !== null && profile?.email !== undefined
  const { earned: xpEarned, needed: xpNeeded, pct: xpPct } = profile
    ? xpProgress(profile.totalXp, profile.level)
    : { earned: 0, needed: 100, pct: 0 }

  return (
    <>
      {open && <div className={styles.overlay} onClick={onClose} aria-hidden="true" />}
      <div className={`${styles.drawer} ${open ? styles.drawerOpen : ''}`} aria-label="Perfil do aluno">
        <div className={styles.header}>
          <span className={styles.headerTitle}>// perfil do aluno</span>
          <button className={styles.close} onClick={onClose} aria-label="Fechar perfil">
            <IconClose />
          </button>
        </div>

        <div className={styles.body}>
          {loading && (
            <div className={styles.state}>
              <span className={styles.stateText}>// carregando...</span>
            </div>
          )}

          {!loading && error && (
            <div className={styles.state}>
              <span className={styles.stateError}>{error}</span>
            </div>
          )}

          {!loading && !error && profile && (
            <>
              {/* ── Hero ── */}
              <section className={styles.hero}>
                <div className={styles.avatarWrap}>
                  <Avatar name={profile.name} config={profile.avatarConfig ?? null} size={72} />
                  <div className={styles.levelBadge}>
                    <span className={styles.levelBadgeLabel}>Nível</span>
                    <span className={styles.levelBadgeValue}>{profile.level}</span>
                  </div>
                </div>

                <h2 className={styles.name}>{profile.name}</h2>
                <p className={styles.subtitle}>
                  {[
                    profile.age !== null ? `${profile.age} anos` : null,
                    profile.className,
                  ].filter(Boolean).join(' · ') || ' '}
                </p>

                <div className={styles.xpBarWrap}>
                  <div className={styles.xpBarTrack}>
                    <div className={styles.xpBarFill} style={{ width: `${xpPct}%` }} />
                  </div>
                  <div className={styles.xpBarMeta}>
                    <span className={styles.xpBarLabel}>{xpEarned} / {xpNeeded} XP para nível {profile.level + 1}</span>
                    <span className={styles.xpBarPct}>{xpPct}%</span>
                  </div>
                </div>
              </section>

              {/* ── Stats ── */}
              <section className={styles.statsGrid}>
                <StatCard icon={<IconStar />}   label="XP Total"     value={profile.totalXp.toLocaleString('pt-BR')} colorVar="--color-xp" />
                <StatCard icon={<IconShield />} label="Nível"         value={String(profile.level)}                   colorVar="--color-level" />
                <StatCard icon={<IconFlame />}  label="Streak atual"  value={`${profile.currentStreak}d`}             colorVar="--color-accent" />
                <StatCard icon={<IconZap />}    label="Maior streak"  value={`${profile.longestStreak}d`}             colorVar="--color-primary" />
              </section>

              {/* ── Dados do gestor (apenas quando o backend libera) ── */}
              {isManagerView && (
                <section className={styles.section}>
                  <h3 className={styles.sectionTitle}>// dados pessoais</h3>
                  <dl className={styles.infoList}>
                    <div className={styles.infoRow}>
                      <dt className={styles.infoLabel}>E-mail</dt>
                      <dd className={styles.infoValue}>{profile.email}</dd>
                    </div>
                    {profile.birthDate && (
                      <div className={styles.infoRow}>
                        <dt className={styles.infoLabel}>Nascimento</dt>
                        <dd className={styles.infoValue}>{formatDate(profile.birthDate)}</dd>
                      </div>
                    )}
                    {profile.createdAt && (
                      <div className={styles.infoRow}>
                        <dt className={styles.infoLabel}>Na plataforma desde</dt>
                        <dd className={styles.infoValue}>{formatDate(profile.createdAt)}</dd>
                      </div>
                    )}
                  </dl>
                </section>
              )}

              {/* ── Conquistas ── */}
              <section className={styles.section}>
                <h3 className={styles.sectionTitle}>// conquistas</h3>
                {profile.badges.length === 0 ? (
                  <p className={styles.empty}>// ainda sem conquistas.</p>
                ) : (
                  <div className={styles.badgeGrid}>
                    {profile.badges.map((badge) => (
                      <div key={badge.id} className={styles.badgeCard}>
                        <span className={styles.badgeEmoji} aria-hidden="true">🎖️</span>
                        <div className={styles.badgeInfo}>
                          <span className={styles.badgeName}>{badge.name}</span>
                          <span className={styles.badgeDate}>{formatDate(badge.earnedAt)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </div>
    </>
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
