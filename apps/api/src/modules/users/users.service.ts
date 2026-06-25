import { randomBytes, createHash } from 'node:crypto'
import bcrypt from 'bcryptjs'
import { Resend } from 'resend'
import { z } from 'zod'
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
  ImportError,
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
  if (process.env.NODE_ENV !== 'production') {
    // Em dev não há entrega real de e-mail (Resend); logamos o link com o
    // token cru para permitir testar o fluxo de convite localmente.
    console.log(`[dev] Convite para ${opts.to}: ${inviteUrl}`)
  }
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
    search: query.search,
    isActive: query.isActive,
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
    birthDate: body.birthDate,
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

  // Invalida todas as outras sessões
  await deleteOtherSessions(userId, currentSessionId)
}

// ─── Importação CSV ───────────────────────────────────────────────────────────

const emailSchema = z.string().email()

/** Gera o CSV-modelo para importação em massa de alunos (colunas: name,email) */
export function generateUsersCsvTemplate(): string {
  return 'name,email\nJoão Silva,joao@escola.com\n'
}

/**
 * Importa alunos a partir do conteúdo de um CSV (linha a linha).
 * Todos os usuários criados recebem role: 'student'. E-mails já cadastrados
 * no tenant são ignorados (skipped), sem sobrescrever. Erros por linha não
 * interrompem o processamento — o import roda até o fim e reporta tudo.
 */
export async function importUsersFromCsv(tenantId: string, slug: string, csvContent: string) {
  // Remove BOM (UTF-8) — comum em CSVs exportados do Excel no Windows, faria a
  // validação de cabeçalho falhar mesmo com o conteúdo correto.
  const cleanContent = csvContent.replace(/^﻿/, '')
  const lines = cleanContent.split(/\r?\n/).filter((line) => line.trim().length > 0)

  if (lines.length === 0) {
    throw new UnprocessableError('Arquivo CSV vazio')
  }

  const header = lines[0]!.trim().toLowerCase()
  if (header !== 'name,email') {
    throw new UnprocessableError('Cabeçalho do CSV inválido — esperado "name,email"')
  }

  let created = 0
  let skipped = 0
  const errors: ImportError[] = []

  for (let i = 1; i < lines.length; i++) {
    const row = i + 1 // linha 1 é o cabeçalho — mantém numeração igual à da planilha
    const parts = lines[i]!.split(',')

    if (parts.length < 2) {
      errors.push({ row, reason: 'Formato inválido — esperado "name,email"' })
      continue
    }

    const name = parts[0]!.trim()
    const email = parts[1]!.trim().toLowerCase()

    if (!name) {
      errors.push({ row, reason: 'Nome em branco' })
      continue
    }

    if (!emailSchema.safeParse(email).success) {
      errors.push({ row, reason: 'E-mail inválido' })
      continue
    }

    const existing = await findUserByEmailInTenant(email, tenantId)
    if (existing) {
      skipped++
      continue
    }

    try {
      const randomPassword = randomBytes(32).toString('hex')
      const passwordHash = await bcrypt.hash(randomPassword, 12)
      const user = await createUser({ tenantId, name, email, passwordHash, role: 'student' })

      const rawToken = randomBytes(32).toString('hex')
      const tokenHash = hashToken(rawToken)
      const expiresAt = new Date(Date.now() + INVITE_TTL_MS)
      await createInviteToken(user.id, tokenHash, expiresAt)
      await sendInviteEmail({ to: user.email, name: user.name, slug, token: rawToken })

      created++
    } catch (err) {
      console.error('[users] Falha ao importar linha do CSV:', err)
      errors.push({ row, reason: 'Erro ao criar usuário' })
    }
  }

  return { data: { created, skipped, errors } }
}
