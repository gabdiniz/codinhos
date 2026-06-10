import bcrypt from 'bcryptjs'
import { db } from '../db/index.js'
import {
  tenants,
  users,
  sessions,
  trails,
  trailModules,
  challenges,
  tenantTrails,
  classes,
  classStudents,
  badges,
  studentStats,
  challengeSubmissions,
} from '../db/schema.js'
import type { TenantSettings } from '../db/schema.js'

// ─── Contador sequencial para dados únicos ────────────────────────────────────

let seq = 0
function next() {
  return ++seq
}

// ─── Senha padrão dos usuários de teste ───────────────────────────────────────

export const TEST_PASSWORD = 'Senha@123'

// rounds=1 para velocidade nos testes
async function hashPassword(plain: string) {
  return bcrypt.hash(plain, 1)
}

// ─── Tenant ───────────────────────────────────────────────────────────────────

type MakeTenantOverrides = {
  slug?: string
  name?: string
  plan?: string
  settings?: TenantSettings
  isActive?: boolean
}

export async function makeTenant(overrides: MakeTenantOverrides = {}) {
  const n = next()
  const [tenant] = await db
    .insert(tenants)
    .values({
      slug: overrides.slug ?? `test-tenant-${n}`,
      name: overrides.name ?? `Test Tenant ${n}`,
      plan: overrides.plan ?? 'free',
      settings: overrides.settings ?? {},
      isActive: overrides.isActive ?? true,
    })
    .returning()
  return tenant!
}

// ─── User ─────────────────────────────────────────────────────────────────────

type MakeUserOverrides = {
  email?: string
  name?: string
  role?: 'manager' | 'professor' | 'student'
  password?: string
  isActive?: boolean
}

export async function makeUser(
  tenantId: string,
  overrides: MakeUserOverrides = {},
) {
  const n = next()
  const role = overrides.role ?? 'student'
  const passwordHash = await hashPassword(overrides.password ?? TEST_PASSWORD)

  const [user] = await db
    .insert(users)
    .values({
      tenantId,
      email: overrides.email ?? `user-${n}@test.com`,
      name: overrides.name ?? `User ${n}`,
      role,
      passwordHash,
      isActive: overrides.isActive ?? true,
    })
    .returning({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      isActive: users.isActive,
      tenantId: users.tenantId,
    })
  return user!
}

// ─── Session ──────────────────────────────────────────────────────────────────

export async function makeSession(
  userId: string,
  tenantId: string,
  role: 'super_admin' | 'manager' | 'professor' | 'student',
) {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 dias

  const [session] = await db
    .insert(sessions)
    .values({ userId, tenantId, role, expiresAt })
    .returning({ id: sessions.id })
  return session!.id // retorna o sessionId para usar como cookie
}

// ─── Trail + Module + Challenge ───────────────────────────────────────────────

type MakeTrailOverrides = {
  slug?: string
  title?: string
  language?: 'javascript' | 'python'
  order?: number
}

export async function makeTrail(overrides: MakeTrailOverrides = {}) {
  const n = next()
  const [trail] = await db
    .insert(trails)
    .values({
      slug: overrides.slug ?? `trail-${n}`,
      title: overrides.title ?? `Trail ${n}`,
      language: overrides.language ?? 'javascript',
      order: overrides.order ?? n,
    })
    .returning()
  return trail!
}

type MakeModuleOverrides = {
  title?: string
  order?: number
  concept?: string
}

export async function makeModule(trailId: string, overrides: MakeModuleOverrides = {}) {
  const n = next()
  const [mod] = await db
    .insert(trailModules)
    .values({
      trailId,
      title: overrides.title ?? `Module ${n}`,
      order: overrides.order ?? n,
      concept: overrides.concept ?? `Conceito ${n}`,
    })
    .returning()
  return mod!
}

type MakeChallengeOverrides = {
  title?: string
  difficulty?: 'easy' | 'medium' | 'hard'
  order?: number
  baseXp?: number
  validationModeOverride?: 'auto' | 'auto_review' | 'manual'
}

export async function makeChallenge(moduleId: string, overrides: MakeChallengeOverrides = {}) {
  const n = next()
  const [challenge] = await db
    .insert(challenges)
    .values({
      moduleId,
      title: overrides.title ?? `Challenge ${n}`,
      difficulty: overrides.difficulty ?? 'easy',
      order: overrides.order ?? n,
      baseXp: overrides.baseXp ?? 10,
      validationModeOverride: overrides.validationModeOverride,
      testCases: [],
    })
    .returning()
  return challenge!
}

// ─── Class ────────────────────────────────────────────────────────────────────

type MakeClassOverrides = {
  name?: string
  progressionMode?: 'free' | 'sequential' | 'controlled'
  validationMode?: 'auto' | 'auto_review' | 'manual'
  showRanking?: boolean
}

export async function makeClass(tenantId: string, overrides: MakeClassOverrides = {}) {
  const n = next()
  const [cls] = await db
    .insert(classes)
    .values({
      tenantId,
      name: overrides.name ?? `Class ${n}`,
      progressionMode: overrides.progressionMode ?? 'free',
      validationMode: overrides.validationMode ?? 'auto',
      showRanking: overrides.showRanking ?? true,
    })
    .returning()
  return cls!
}

// ─── Enrollment (aluno em turma) ──────────────────────────────────────────────

export async function enrollStudent(classId: string, studentId: string) {
  const [enrollment] = await db
    .insert(classStudents)
    .values({ classId, studentId })
    .returning()
  return enrollment!
}

// ─── Tenant Trail ─────────────────────────────────────────────────────────────

export async function assignTrailToTenant(tenantId: string, trailId: string, order = 1) {
  const [tt] = await db
    .insert(tenantTrails)
    .values({ tenantId, trailId, order })
    .returning()
  return tt!
}

// ─── Badge ────────────────────────────────────────────────────────────────────

type MakeBadgeOverrides = {
  slug?: string
  name?: string
  triggerType?: string
  triggerValue?: number
}

export async function makeBadge(overrides: MakeBadgeOverrides = {}) {
  const n = next()
  const [badge] = await db
    .insert(badges)
    .values({
      slug: overrides.slug ?? `badge-${n}`,
      name: overrides.name ?? `Badge ${n}`,
      triggerType: overrides.triggerType ?? 'xp_total',
      triggerValue: overrides.triggerValue ?? 100,
    })
    .returning()
  return badge!
}

// ─── Student Stats ────────────────────────────────────────────────────────────

type MakeStudentStatsOverrides = {
  totalXp?: number
  level?: number
  currentStreak?: number
  longestStreak?: number
}

export async function makeStudentStats(
  tenantId: string,
  studentId: string,
  overrides: MakeStudentStatsOverrides = {},
) {
  const [stats] = await db
    .insert(studentStats)
    .values({
      tenantId,
      studentId,
      totalXp: overrides.totalXp ?? 0,
      level: overrides.level ?? 1,
      currentStreak: overrides.currentStreak ?? 0,
      longestStreak: overrides.longestStreak ?? 0,
    })
    .returning()
  return stats!
}

// ─── Challenge Submission ─────────────────────────────────────────────────────

type MakeSubmissionOverrides = {
  status?: 'pending' | 'passed' | 'failed' | 'under_review'
  attemptNumber?: number
  code?: string
}

export async function makeSubmission(
  tenantId: string,
  studentId: string,
  challengeId: string,
  classId: string,
  overrides: MakeSubmissionOverrides = {},
) {
  const [submission] = await db
    .insert(challengeSubmissions)
    .values({
      tenantId,
      studentId,
      challengeId,
      classId,
      attemptNumber: overrides.attemptNumber ?? 1,
      code: overrides.code ?? 'console.log("hello")',
      status: overrides.status ?? 'passed',
    })
    .returning()
  return submission!
}
