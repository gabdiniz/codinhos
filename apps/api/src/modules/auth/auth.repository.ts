import { and, eq, gt, lt, isNull } from 'drizzle-orm'
import { db } from '../../shared/db/index.js'
import { tenants, users, sessions, passwordResetTokens } from '../../shared/db/schema.js'

// ─── Tenant ───────────────────────────────────────────────────────────────────

export async function findTenantBySlug(slug: string) {
  const [tenant] = await db
    .select({ id: tenants.id, isActive: tenants.isActive })
    .from(tenants)
    .where(eq(tenants.slug, slug))
    .limit(1)
  return tenant ?? null
}

// ─── User ─────────────────────────────────────────────────────────────────────

export async function findUserByEmailAndTenant(
  email: string,
  tenantId: string,
): Promise<{
  id: string
  email: string
  name: string
  role: 'super_admin' | 'manager' | 'professor' | 'student'
  passwordHash: string
  isActive: boolean
  tenantId: string
} | null> {
  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      passwordHash: users.passwordHash,
      isActive: users.isActive,
      tenantId: users.tenantId,
    })
    .from(users)
    .where(and(eq(users.email, email), eq(users.tenantId, tenantId)))
    .limit(1)
  // Anotação explícita acima: sem ela o TS prova (incorretamente) que `user` nunca
  // é undefined e descarta o ramo `null`, quebrando o caso "usuário não existe".
  return user ?? null
}

export async function findUserByEmailAndRole(
  email: string,
  role: 'super_admin',
) {
  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      passwordHash: users.passwordHash,
      isActive: users.isActive,
      tenantId: users.tenantId,
    })
    .from(users)
    .where(and(eq(users.email, email), eq(users.role, role)))
    .limit(1)
  return user ?? null
}

export async function findUserById(id: string): Promise<{
  id: string
  email: string
  name: string
  role: 'super_admin' | 'manager' | 'professor' | 'student'
  avatarUrl: string | null
  isActive: boolean
  tenantId: string
} | null> {
  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      avatarUrl: users.avatarUrl,
      isActive: users.isActive,
      tenantId: users.tenantId,
    })
    .from(users)
    .where(eq(users.id, id))
    .limit(1)
  // Mesmo padrão: anotação explícita pra TS não descartar o ramo `null`.
  return user ?? null
}

// ─── Session ──────────────────────────────────────────────────────────────────

type CreateSessionInput = {
  userId: string
  tenantId: string
  role: 'super_admin' | 'manager' | 'professor' | 'student'
  expiresAt: Date
}

export async function createSession(input: CreateSessionInput) {
  const [session] = await db
    .insert(sessions)
    .values(input)
    .returning({ id: sessions.id })
  return session!
}

export async function deleteSession(sessionId: string) {
  await db.delete(sessions).where(eq(sessions.id, sessionId))
}

export async function deleteExpiredSessions(userId: string) {
  await db
    .delete(sessions)
    .where(and(eq(sessions.userId, userId), lt(sessions.expiresAt, new Date())))
}

export async function deleteSessionsByUserId(userId: string) {
  await db.delete(sessions).where(eq(sessions.userId, userId))
}

// ─── Password Reset Token ─────────────────────────────────────────────────────

type CreateTokenInput = {
  userId: string
  tokenHash: string
  type: 'invite' | 'reset'
  expiresAt: Date
}

export async function createPasswordResetToken(input: CreateTokenInput) {
  const [token] = await db
    .insert(passwordResetTokens)
    .values(input)
    .returning({ id: passwordResetTokens.id })
  return token!
}

export async function findValidPasswordResetToken(tokenHash: string) {
  const [token] = await db
    .select({
      id: passwordResetTokens.id,
      userId: passwordResetTokens.userId,
      type: passwordResetTokens.type,
      expiresAt: passwordResetTokens.expiresAt,
    })
    .from(passwordResetTokens)
    .where(
      and(
        eq(passwordResetTokens.tokenHash, tokenHash),
        gt(passwordResetTokens.expiresAt, new Date()),
        isNull(passwordResetTokens.usedAt),
      ),
    )
    .limit(1)
  return token ?? null
}
