import { randomBytes, createHash } from 'node:crypto'
import bcrypt from 'bcryptjs'
import { Resend } from 'resend'
import {
  listGuardians,
  findGuardianById,
  listGuardianStudents,
  findGuardianStudentLink,
  insertGuardianStudent,
  deleteGuardianStudent,
  listChildrenWithStats,
} from './guardians.repository.js'
import {
  findUserByEmailInTenant,
  createUser,
  createInviteToken,
  findUserById,
} from '../users/users.repository.js'
import {
  findStudentForDashboard,
  findStudentStatsForDashboard,
  findStudentEarnedBadges,
  findStudentTrailProgress,
} from '../dashboard/dashboard.repository.js'
import { ConflictError, NotFoundError } from '../../shared/errors/index.js'
import type { CreateGuardianBody, LinkStudentBody } from './guardians.schema.js'

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 dias

function hashToken(rawToken: string): string {
  return createHash('sha256').update(rawToken).digest('hex')
}

async function sendGuardianInviteEmail(opts: {
  to: string
  name: string
  slug: string
  token: string
}) {
  const inviteUrl = `${process.env.APP_URL}/${opts.slug}/accept-invite?token=${opts.token}`
  if (process.env.NODE_ENV !== 'production') {
    // Em dev não há entrega real de e-mail; logamos o link com o token cru.
    console.log(`[dev] Convite (responsável) para ${opts.to}: ${inviteUrl}`)
  }
  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: process.env.EMAIL_FROM ?? 'noreply@codinhos.com.br',
      to: opts.to,
      subject: 'Codinhos — Acompanhe o progresso do seu filho(a)',
      html: `
        <p>Olá, ${opts.name}!</p>
        <p>Você foi convidado a acompanhar o progresso de aprendizado no Codinhos.</p>
        <p>
          <a href="${inviteUrl}">Clique aqui para configurar sua senha</a>
        </p>
        <p>O link expira em 7 dias.</p>
      `,
    })
    return true
  } catch (err) {
    console.error('[guardians] Falha ao enviar convite:', err)
    return false
  }
}

/** Garante que o studentId é um aluno ativo do tenant. */
async function assertIsStudent(studentId: string, tenantId: string) {
  const student = await findUserById(studentId, tenantId)
  if (!student || student.role !== 'student') throw new NotFoundError('Aluno')
  return student
}

// ─── Gestor: gerenciamento de responsáveis ────────────────────────────────────

export async function getGuardians(tenantId: string) {
  const rows = await listGuardians(tenantId)
  return { data: rows, meta: { total: rows.length } }
}

export async function createGuardian(tenantId: string, slug: string, body: CreateGuardianBody) {
  const existing = await findUserByEmailInTenant(body.email, tenantId)
  if (existing) throw new ConflictError('Já existe um usuário com este e-mail neste tenant')

  // Valida todos os alunos ANTES de criar o responsável (evita usuário órfão)
  const studentIds = body.studentIds ?? []
  for (const studentId of studentIds) {
    await assertIsStudent(studentId, tenantId)
  }

  const passwordHash = await bcrypt.hash(randomBytes(16).toString('hex'), 12)
  const guardian = await createUser({
    tenantId,
    name: body.name,
    email: body.email,
    passwordHash,
    role: 'guardian',
  })

  // Convite reaproveita o fluxo de accept-invite (mesmo type 'invite')
  const rawToken = randomBytes(32).toString('hex')
  await createInviteToken(guardian.id, hashToken(rawToken), new Date(Date.now() + INVITE_TTL_MS))
  await sendGuardianInviteEmail({ to: guardian.email, name: guardian.name, slug, token: rawToken })

  for (const studentId of studentIds) {
    await insertGuardianStudent(tenantId, guardian.id, studentId)
  }

  return {
    guardian: {
      id: guardian.id,
      name: guardian.name,
      email: guardian.email,
      isActive: true,
      studentsCount: studentIds.length,
      createdAt: new Date().toISOString(),
    },
  }
}

export async function getGuardianStudents(guardianId: string, tenantId: string) {
  const guardian = await findGuardianById(guardianId, tenantId)
  if (!guardian) throw new NotFoundError('Responsável')

  const rows = await listGuardianStudents(guardianId, tenantId)
  return { data: rows, meta: { total: rows.length } }
}

export async function linkStudent(guardianId: string, tenantId: string, body: LinkStudentBody) {
  const guardian = await findGuardianById(guardianId, tenantId)
  if (!guardian) throw new NotFoundError('Responsável')

  await assertIsStudent(body.studentId, tenantId)

  const existing = await findGuardianStudentLink(tenantId, guardianId, body.studentId)
  if (existing) throw new ConflictError('Aluno já vinculado a este responsável')

  const guardianStudent = await insertGuardianStudent(tenantId, guardianId, body.studentId)
  return { guardianStudent }
}

export async function unlinkStudent(guardianId: string, studentId: string, tenantId: string) {
  const guardian = await findGuardianById(guardianId, tenantId)
  if (!guardian) throw new NotFoundError('Responsável')

  const existing = await findGuardianStudentLink(tenantId, guardianId, studentId)
  if (!existing) throw new NotFoundError('Vínculo')

  await deleteGuardianStudent(tenantId, guardianId, studentId)
}

// ─── Portal do responsável (read-only) ────────────────────────────────────────

export async function getChildren(guardianId: string, tenantId: string) {
  const rows = await listChildrenWithStats(guardianId, tenantId)
  return {
    data: rows.map((c) => ({
      id: c.id,
      name: c.name,
      avatarUrl: c.avatarUrl ?? null,
      totalXp: c.totalXp ?? 0,
      level: c.level ?? 1,
      currentStreak: c.currentStreak ?? 0,
      lastActivity: c.lastActivity ?? null,
    })),
  }
}

export async function getChildDetail(guardianId: string, tenantId: string, studentId: string) {
  // Só pode ver filhos vinculados a ele — fora do escopo → 404
  const link = await findGuardianStudentLink(tenantId, guardianId, studentId)
  if (!link) throw new NotFoundError('Aluno')

  const student = await findStudentForDashboard(studentId, tenantId)
  if (!student) throw new NotFoundError('Aluno')

  const [stats, earnedBadges, trailProgress] = await Promise.all([
    findStudentStatsForDashboard(studentId, tenantId),
    findStudentEarnedBadges(studentId, tenantId),
    findStudentTrailProgress(studentId, tenantId),
  ])

  return {
    data: {
      student: {
        id: student.id,
        name: student.name,
        avatarUrl: student.avatarUrl ?? null,
      },
      stats: {
        totalXp: stats?.totalXp ?? 0,
        level: stats?.level ?? 1,
        currentStreak: stats?.currentStreak ?? 0,
      },
      badges: earnedBadges.map((b) => ({
        slug: b.slug,
        name: b.name,
        earnedAt: b.earnedAt.toISOString(),
      })),
      trails: trailProgress.map((t) => ({
        id: t.trailId,
        title: t.trailTitle,
        progress: {
          completed: Number(t.completedModules),
          total: Number(t.totalModules),
        },
        lastActivity: t.lastActivity ? new Date(t.lastActivity).toISOString() : null,
      })),
    },
  }
}
