import { randomBytes, createHash } from 'node:crypto'
import bcrypt from 'bcryptjs'
import { Resend } from 'resend'
import { eq } from 'drizzle-orm'
import type { FastifyReply } from 'fastify'
import { db } from '../../shared/db/index.js'
import { users, passwordResetTokens, sessions } from '../../shared/db/schema.js'
import {
  findUserByEmailAndTenant,
  findUserByEmailAndRole,
  findUserById,
  createSession,
  deleteSession,
  createPasswordResetToken,
  findValidPasswordResetToken,
  deleteExpiredSessions,
} from './auth.repository.js'
import {
  NotFoundError,
  InvalidCredentialsError,
  AccountDisabledError,
  UnprocessableError,
} from '../../shared/errors/index.js'
import type { LoginBody, AdminLoginBody, ForgotPasswordBody, ResetPasswordBody } from './auth.schema.js'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SESSION_TTL_MS = parseInt(process.env.SESSION_TTL_SECONDS ?? '604800', 10) * 1000

function hashToken(rawToken: string): string {
  return createHash('sha256').update(rawToken).digest('hex')
}

function generateRawToken(): string {
  return randomBytes(32).toString('hex')
}

function setCookieSession(reply: FastifyReply, sessionId: string, expiresAt: Date): void {
  reply.setCookie('sessionId', sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    domain: process.env.COOKIE_DOMAIN || undefined,
    path: '/',
    expires: expiresAt,
  })
}

function clearCookieSession(reply: FastifyReply): void {
  reply.clearCookie('sessionId', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    domain: process.env.COOKIE_DOMAIN || undefined,
    path: '/',
  })
}

// ─── Login (usuário de tenant) ────────────────────────────────────────────────

/**
 * Login de usuário do tenant.
 * @param tenantId — já validado pelo middleware resolveTenant (req.resolvedTenantId)
 */
export async function login(
  tenantId: string,
  body: LoginBody,
  reply: FastifyReply,
) {
  const user = await findUserByEmailAndTenant(body.email, tenantId)

  // Erro genérico para não revelar existência do e-mail
  if (!user) {
    throw new InvalidCredentialsError()
  }

  if (!user.isActive) {
    throw new AccountDisabledError()
  }

  const passwordMatch = await bcrypt.compare(body.password, user.passwordHash)
  if (!passwordMatch) {
    throw new InvalidCredentialsError()
  }

  // Limpa sessões expiradas silenciosamente (housekeeping)
  await deleteExpiredSessions(user.id)

  const expiresAt = new Date(Date.now() + SESSION_TTL_MS)
  const session = await createSession({
    userId: user.id,
    tenantId,
    role: user.role,
    expiresAt,
  })

  setCookieSession(reply, session.id, expiresAt)

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  }
}

// ─── Login (Super Admin) ──────────────────────────────────────────────────────

export async function loginSuperAdmin(body: AdminLoginBody, reply: FastifyReply) {
  const user = await findUserByEmailAndRole(body.email, 'super_admin')

  if (!user) {
    throw new InvalidCredentialsError()
  }

  if (!user.isActive) {
    throw new AccountDisabledError()
  }

  const passwordMatch = await bcrypt.compare(body.password, user.passwordHash)
  if (!passwordMatch) {
    throw new InvalidCredentialsError()
  }

  await deleteExpiredSessions(user.id)

  const expiresAt = new Date(Date.now() + SESSION_TTL_MS)
  const session = await createSession({
    userId: user.id,
    tenantId: user.tenantId,
    role: 'super_admin',
    expiresAt,
  })

  setCookieSession(reply, session.id, expiresAt)

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  }
}

// ─── Logout ───────────────────────────────────────────────────────────────────

export async function logout(sessionId: string, reply: FastifyReply) {
  await deleteSession(sessionId)
  clearCookieSession(reply)
}

// ─── Me ───────────────────────────────────────────────────────────────────────

export async function getMe(userId: string) {
  const user = await findUserById(userId)
  if (!user) throw new NotFoundError('Usuário')
  return { user }
}

// ─── Forgot Password ──────────────────────────────────────────────────────────

/**
 * Disparo de e-mail de redefinição de senha.
 * @param slug — necessário para construir a URL do link no e-mail
 * @param tenantId — já validado pelo middleware resolveTenant
 */
export async function forgotPassword(slug: string, tenantId: string, body: ForgotPasswordBody) {
  const user = await findUserByEmailAndTenant(body.email, tenantId)

  // Resposta sempre a mesma: não revelar se o e-mail existe
  if (!user || !user.isActive) return

  const rawToken = generateRawToken()
  const tokenHash = hashToken(rawToken)
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1h

  await createPasswordResetToken({
    userId: user.id,
    tokenHash,
    type: 'reset',
    expiresAt,
  })

  const resetUrl = `${process.env.APP_URL}/${slug}/reset-password?token=${rawToken}`

  // Erro de envio não propaga: resposta ao cliente é sempre 200 para não revelar existência
  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: process.env.EMAIL_FROM ?? 'noreply@codinhos.com.br',
      to: user.email,
      subject: 'Redefinir senha — Codinhos',
      html: `
        <p>Olá, ${user.name}!</p>
        <p>Recebemos um pedido para redefinir sua senha.</p>
        <p>
          <a href="${resetUrl}">Clique aqui para redefinir sua senha</a>
        </p>
        <p>O link expira em 1 hora. Se não foi você, ignore este e-mail.</p>
      `,
    })
  } catch (err) {
    // Loga para observabilidade mas não expõe ao cliente
    console.error('[auth] Falha ao enviar e-mail de reset:', err)
  }
}

// ─── Reset Password ───────────────────────────────────────────────────────────

export async function resetPassword(body: ResetPasswordBody) {
  const tokenHash = hashToken(body.token)
  const tokenRecord = await findValidPasswordResetToken(tokenHash)

  if (!tokenRecord) {
    throw new UnprocessableError('Token inválido ou expirado')
  }

  const passwordHash = await bcrypt.hash(body.newPassword, 12)
  const now = new Date()

  // Transação garante atomicidade: se um falha, o outro reverte
  await db.transaction(async (tx) => {
    await tx
      .update(users)
      .set({ passwordHash, updatedAt: now })
      .where(eq(users.id, tokenRecord.userId))

    await tx
      .update(passwordResetTokens)
      .set({ usedAt: now })
      .where(eq(passwordResetTokens.id, tokenRecord.id))

    // Invalida todas as sessões ativas do usuário
    await tx.delete(sessions).where(eq(sessions.userId, tokenRecord.userId))
  })
}
