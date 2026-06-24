import { and, count, eq, ilike, isNull, ne, or } from 'drizzle-orm'
import { db } from '../../shared/db/index.js'
import { users, passwordResetTokens, sessions } from '../../shared/db/schema.js'

// ─── Leitura ──────────────────────────────────────────────────────────────────

type UserCoreRow = {
  id: string
  tenantId: string
  name: string
  email: string
  role: 'super_admin' | 'manager' | 'professor' | 'student'
  avatarUrl: string | null
  birthDate: string | null
  isActive: boolean
  createdAt: Date
  passwordHash: string
}

// Anotação explícita: sem ela o TS prova (incorretamente) que o resultado da
// destructuring de array nunca é undefined e descarta o ramo `null` do `?? null`.
export async function findUserById(id: string, tenantId: string): Promise<UserCoreRow | null> {
  const [user] = await db
    .select({
      id: users.id,
      tenantId: users.tenantId,
      name: users.name,
      email: users.email,
      role: users.role,
      avatarUrl: users.avatarUrl,
      birthDate: users.birthDate,
      isActive: users.isActive,
      createdAt: users.createdAt,
      passwordHash: users.passwordHash,
    })
    .from(users)
    .where(and(eq(users.id, id), eq(users.tenantId, tenantId)))
    .limit(1)
  return user ?? null
}

export async function findUserByIdOnly(id: string): Promise<UserCoreRow | null> {
  const [user] = await db
    .select({
      id: users.id,
      tenantId: users.tenantId,
      name: users.name,
      email: users.email,
      role: users.role,
      avatarUrl: users.avatarUrl,
      birthDate: users.birthDate,
      isActive: users.isActive,
      createdAt: users.createdAt,
      passwordHash: users.passwordHash,
    })
    .from(users)
    .where(eq(users.id, id))
    .limit(1)
  return user ?? null
}

export async function findUserByEmailInTenant(
  email: string,
  tenantId: string,
): Promise<{ id: string } | null> {
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.email, email), eq(users.tenantId, tenantId)))
    .limit(1)
  return user ?? null
}

type ListUsersOptions = {
  tenantId: string
  role?: 'student' | 'manager' | 'professor'
  search?: string
  isActive?: boolean
  page: number
  limit: number
}

export async function listUsers({ tenantId, role, search, isActive, page, limit }: ListUsersOptions) {
  const conditions = [eq(users.tenantId, tenantId)]
  if (role !== undefined) conditions.push(eq(users.role, role))
  if (isActive !== undefined) conditions.push(eq(users.isActive, isActive))
  if (search !== undefined) {
    conditions.push(or(ilike(users.name, `%${search}%`), ilike(users.email, `%${search}%`))!)
  }
  const where = and(...conditions)

  const [rows, [{ value: total }]] = await Promise.all([
    db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        isActive: users.isActive,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(where)
      .orderBy(users.createdAt)
      .limit(limit)
      .offset((page - 1) * limit),
    db.select({ value: count() }).from(users).where(where),
  ])

  return { rows, total: Number(total) }
}

// ─── Escrita ──────────────────────────────────────────────────────────────────

type CreateUserInput = {
  tenantId: string
  name: string
  email: string
  passwordHash: string
  role: 'student' | 'manager'
}

export async function createUser(input: CreateUserInput) {
  const [user] = await db
    .insert(users)
    .values({ ...input, isActive: true })
    .returning({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      avatarUrl: users.avatarUrl,
      isActive: users.isActive,
      createdAt: users.createdAt,
    })
  return user!
}

type UpdateUserInput = {
  name?: string
  email?: string
  avatarUrl?: string | null
  birthDate?: string | null
  passwordHash?: string
}

export async function updateUser(id: string, tenantId: string, input: UpdateUserInput) {
  const [user] = await db
    .update(users)
    .set({
      ...(input.name !== undefined && { name: input.name }),
      ...(input.email !== undefined && { email: input.email }),
      ...(input.avatarUrl !== undefined && { avatarUrl: input.avatarUrl }),
      ...(input.birthDate !== undefined && { birthDate: input.birthDate }),
      ...(input.passwordHash !== undefined && { passwordHash: input.passwordHash }),
    })
    .where(and(eq(users.id, id), eq(users.tenantId, tenantId)))
    .returning({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      avatarUrl: users.avatarUrl,
      birthDate: users.birthDate,
      isActive: users.isActive,
      createdAt: users.createdAt,
    })
  return user ?? null
}

export async function setUserActive(id: string, isActive: boolean) {
  await db.update(users).set({ isActive }).where(eq(users.id, id))
}

// ─── Tokens de convite ────────────────────────────────────────────────────────

/** Invalida todos os tokens de convite não-usados do usuário (marca usedAt = agora) */
export async function invalidatePendingInviteTokens(userId: string) {
  await db
    .update(passwordResetTokens)
    .set({ usedAt: new Date() })
    .where(
      and(
        eq(passwordResetTokens.userId, userId),
        eq(passwordResetTokens.type, 'invite'),
        isNull(passwordResetTokens.usedAt),
      ),
    )
}

/** Verifica se existe algum token de convite não-usado para o usuário */
export async function findPendingInviteToken(userId: string) {
  const [token] = await db
    .select({ id: passwordResetTokens.id })
    .from(passwordResetTokens)
    .where(
      and(
        eq(passwordResetTokens.userId, userId),
        eq(passwordResetTokens.type, 'invite'),
        isNull(passwordResetTokens.usedAt),
      ),
    )
    .limit(1)
  return token ?? null
}

export async function createInviteToken(userId: string, tokenHash: string, expiresAt: Date) {
  await db.insert(passwordResetTokens).values({
    userId,
    tokenHash,
    type: 'invite',
    expiresAt,
  })
}

// ─── Sessões ──────────────────────────────────────────────────────────────────

/** Deleta todas as sessões do usuário exceto a sessão atual */
export async function deleteOtherSessions(userId: string, currentSessionId: string) {
  await db
    .delete(sessions)
    .where(and(eq(sessions.userId, userId), ne(sessions.id, currentSessionId)))
}

/** Deleta todas as sessões do usuário */
export async function deleteAllSessions(userId: string) {
  await db.delete(sessions).where(eq(sessions.userId, userId))
}
