import { randomBytes, createHash } from 'node:crypto'
import bcrypt from 'bcryptjs'
import { Resend } from 'resend'
import {
  findUserById,
  findUserByIdOnly,
  findUserByEmailInTenant,
  listUsers,
  createUser,
  updateUser,
  setUserActive,
  invalidatePendingInviteTokens,
  findPendingInviteToken,
  createInviteToken,
  deleteOtherSessions,
  deleteAllSessions,
} from './users.repository.js'
import {
  findClassById,
  findStudentCurrentClass,
  addStudentToClass,
  removeStudentFromClass,
} from '../classes/classes.repository.js'
import {
  ConflictError,
  NotFoundError,
  UnprocessableError,
  ForbiddenError,
  InvalidCredentialsError,
} from '../../shared/errors/index.js'
import type {
  ListUsersQuery,
  CreateUserBody,
  UpdateUserBody,
  UpdateProfileBody,
  UpdatePasswordBody,
} from './users.schema.js'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 dias

function hashToken(rawToken: string): string {
  return createHash('sha256').update(rawToken).digest('hex')
}

async function sendInviteEmail(opts: {
  to: string
  name: string
  slug: string
  token: string
}) {
  const inviteUrl = `${process.env.APP_URL}/${opts.slug}/accept-invite?token=${opts.token}`
  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: process.env.EMAIL_FROM ?? 'noreply@codinhos.com.br',
      to: opts.to,
      subject: 'Bem-vindo ao Codinhos — Configure seu acesso',
      html: `
        <p>Olá, ${opts.name}!</p>
        <p>Você foi adicionado à plataforma Codinhos.</p>
        <p>
          <a href="${inviteUrl}">Clique aqui para configurar sua senha</a>
        </p>
        <p>O link expira em 7 dias.</p>
      `,
    })
    return true
  } catch (err) {
    console.error('[users] Falha ao enviar convite:', err)
    return false
  }
}

// ─── List ─────────────────────────────────────────────────────────────────────

export async function getUsers(tenantId: string, query: ListUsersQuery) {
  const { rows, total } = await listUsers({
    tenantId,
    role: query.role,
    page: query.page,
    limit: query.limit,
  })
  return { data: rows, meta: { total, page: query.page, limit: query.limit } }
}

// ─── Get by ID ────────────────────────────────────────────────────────────────

export async function getUserById(userId: string, tenantId: string) {
  const user = await findUserById(userId, tenantId)
  if (!user) throw new NotFoundError('Usuário')

  if (user.role === 'student') {
    const classInfo = await findStudentCurrentClass(userId, tenantId)
    return { user: { ...user, classId: classInfo?.id ?? null, className: classInfo?.name ?? null } }
  }

  return { user }
}

// ─── Create ───────────────────────────────────────────────────────────────────

export async function createNewUser(tenantId: string, slug: string, body: CreateUserBody) {
  const existing = await findUserByEmailInTenant(body.email, tenantId)
  if (existing) throw new ConflictError('E-mail já cadastrado neste tenant')

  // Senha aleatória — substituída pelo fluxo de convite
  const randomPassword = randomBytes(32).toString('hex')
  const passwordHash = await bcrypt.hash(randomPassword, 12)

  const user = await createUser({ tenantId, ...body, passwordHash })

  // Token de convite
  const rawToken = randomBytes(32).toString('hex')
  const tokenHash = hashToken(rawToken)
  const expiresAt = new Date(Date.now() + INVITE_TTL_MS)
  await createInviteToken(user.id, tokenHash, expiresAt)

  await sendInviteEmail({ to: user.email, name: user.name, slug, token: rawToken })

  return { user }
}

// ─── Update (manager atualizando outro usuário) ───────────────────────────────

export async function updateExistingUser(
  userId: string,
  tenantId: string,
  body: UpdateUserBody,
) {
  const existing = await findUserById(userId, tenantId)
  if (!existing) throw new NotFoundError('Usuário')

  if (body.email !== undefined && body.email !== existing.email) {
    const emailOwner = await findUserByEmailInTenant(body.email, tenantId)
    if (emailOwner && emailOwner.id !== userId) {
      throw new ConflictError('E-mail já cadastrado neste tenant')
    }
  }

  if (body.classId !== undefined && existing.role !== 'student') {
    throw new UnprocessableError('Apenas alunos podem ser associados a uma turma')
  }

  const user = await updateUser(userId, tenantId, {
    name: body.name,
    email: body.email,
    avatarUrl: body.avatarUrl,
  })

  if (body.classId !== undefined) {
    await reassignStudentClass(userId, tenantId, body.classId)
  }

  if (existing.role === 'student') {
    const classInfo = await findStudentCurrentClass(userId, tenantId)
    return { user: { ...user!, classId: classInfo?.id ?? null, className: classInfo?.name ?? null } }
  }

  return { user: user! }
}

/** Move o aluno para a turma informada (ou remove de qualquer turma, se null) — turma única por aluno */
async function reassignStudentClass(studentId: string, tenantId: string, classId: string | null) {
  if (classId !== null) {
    const cls = await findClassById(classId, tenantId)
    if (!cls) throw new NotFoundError('Turma')
  }

  const current = await findStudentCurrentClass(studentId, tenantId)
  if (current && current.id === classId) return // já está na turma certa

  if (current) {
    await removeStudentFromClass(current.id, studentId)
  }
  if (classId !== null) {
    await addStudentToClass(classId, studentId)
  }
}

// ─── Deactivate ───────────────────────────────────────────────────────────────

export async function deactivateUser(
  targetUserId: string,
  tenantId: string,
  requesterId: string,
) {
  if (targetUserId === requesterId) {
    throw new UnprocessableError('Não é possível desativar a própria conta')
  }

  const target = await findUserById(targetUserId, tenantId)
  if (!target) throw new NotFoundError('Usuário')

  // Gestor não pode desativar outro manager ou superior
  const protectedRoles = ['manager', 'super_admin']
  if (protectedRoles.includes(target.role)) {
    throw new ForbiddenError()
  }

  await setUserActive(targetUserId, false)
  await deleteAllSessions(targetUserId)
}

// ─── Resend invite ────────────────────────────────────────────────────────────

export async function resendInvite(userId: string, tenantId: string, slug: string) {
  const user = await findUserById(userId, tenantId)
  if (!user) throw new NotFoundError('Usuário')

  // 400 se não existe token de convite pendente (usuário já definiu senha)
  const pending = await findPendingInviteToken(userId)
  if (!pending) {
    throw new UnprocessableError('Usuário já configurou o acesso — nenhum convite pendente')
  }

  // Invalida tokens anteriores e cria novo
  await invalidatePendingInviteTokens(userId)

  const rawToken = randomBytes(32).toString('hex')
  const tokenHash = hashToken(rawToken)
  const expiresAt = new Date(Date.now() + INVITE_TTL_MS)
  await createInviteToken(userId, tokenHash, expiresAt)

  await sendInviteEmail({ to: user.email, name: user.name, slug, token: rawToken })
}

// ─── Profile (usuário atualizando os próprios dados) ─────────────────────────

export async function updateProfile(userId: string, tenantId: string, body: UpdateProfileBody) {
  const existing = await findUserByIdOnly(userId)
  if (!existing) throw new NotFoundError('Usuário')

  const user = await updateUser(userId, tenantId, {
    name: body.name,
    avatarUrl: body.avatarUrl,
  })

  return { user: user! }
}

// ─── Password (troca autenticada) ─────────────────────────────────────────────

export async function updatePassword(
  userId: string,
  tenantId: string,
  currentSessionId: string,
  body: UpdatePasswordBody,
) {
  const user = await findUserByIdOnly(userId)
  if (!user) throw new NotFoundError('Usuário')

  const passwordMatch = await bcrypt.compare(body.currentPassword, user.passwordHash)
  if (!passwordMatch) throw new InvalidCredentialsError()

  const newHash = await bcrypt.hash(body.newPassword, 12)
  await updateUser(userId, tenantId, { passwordHash: newHash })

  // Invalida todas as outras sessões — a sessão atual permanece
  await deleteOtherSessions(userId, currentSessionId)
}
