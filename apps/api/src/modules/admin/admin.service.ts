import { randomBytes, createHash } from 'node:crypto'
import { Resend } from 'resend'
import { ConflictError, NotFoundError } from '../../shared/errors/index.js'
import {
  findAllBadges,
  findBadgeById,
  findBadgeBySlug,
  countStudentBadgesByBadgeId,
  insertBadge,
  updateBadge,
  deleteBadgeById,
  listAdminUsers,
  findUserWithTenantForReset,
  invalidateActiveResetTokens,
  createResetToken,
} from './admin.repository.js'
import type { CreateBadgeBody, UpdateBadgeBody, ListAdminUsersQuery } from './admin.schema.js'

// ─── GET /admin/badges ────────────────────────────────────────────────────────

export async function getBadges() {
  const rows = await findAllBadges()
  return { data: rows }
}

// ─── POST /admin/badges ───────────────────────────────────────────────────────

export async function createBadge(body: CreateBadgeBody) {
  const existing = await findBadgeBySlug(body.slug)
  if (existing) throw new ConflictError('Slug de badge já está em uso')

  const badge = await insertBadge(body)
  return { data: { badge } }
}

// ─── PATCH /admin/badges/:badgeId ─────────────────────────────────────────────

export async function editBadge(badgeId: string, body: UpdateBadgeBody) {
  const current = await findBadgeById(badgeId)
  if (!current) throw new NotFoundError('Badge')

  // Sem campos a atualizar — retorna badge atual sem write
  const hasUpdates = Object.values(body).some((v) => v !== undefined)
  if (!hasUpdates) return { data: { badge: current } }

  const badge = await updateBadge(badgeId, body)
  if (!badge) throw new NotFoundError('Badge')

  return { data: { badge } }
}

// ─── DELETE /admin/badges/:badgeId ────────────────────────────────────────────

export async function removeBadge(badgeId: string) {
  const current = await findBadgeById(badgeId)
  if (!current) throw new NotFoundError('Badge')

  const inUse = await countStudentBadgesByBadgeId(badgeId)
  if (inUse > 0) throw new ConflictError('Badge já foi concedido a alunos e não pode ser removido')

  await deleteBadgeById(badgeId)
  return { data: { message: 'Badge removido com sucesso' } }
}

// ─── GET /admin/users ─────────────────────────────────────────────────────────

export async function getAdminUsers(query: ListAdminUsersQuery) {
  const { rows, total } = await listAdminUsers({
    tenantId: query.tenantId,
    role: query.role,
    isActive: query.isActive,
    page: query.page,
    limit: query.limit,
  })
  return {
    data: rows,
    meta: { total, page: query.page, limit: query.limit },
  }
}

// ─── POST /admin/users/:userId/reset-password ─────────────────────────────────
// Super admin dispara redefinição de senha para qualquer usuário (mesmo que já
// tenha configurado o acesso). Gera token de reset, envia e-mail e devolve o
// link para o admin repassar manualmente se necessário.

const ADMIN_RESET_TTL_MS = 24 * 60 * 60 * 1000 // 24h

function hashResetToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex')
}

export async function adminResetPassword(userId: string) {
  const user = await findUserWithTenantForReset(userId)
  if (!user) throw new NotFoundError('Usuário')

  // Invalida resets pendentes e cria um novo
  await invalidateActiveResetTokens(userId)
  const rawToken = randomBytes(32).toString('hex')
  await createResetToken({
    userId,
    tokenHash: hashResetToken(rawToken),
    expiresAt: new Date(Date.now() + ADMIN_RESET_TTL_MS),
  })

  const resetUrl = `${process.env.APP_URL}/${user.slug}/reset-password?token=${rawToken}`

  if (process.env.NODE_ENV !== 'production') {
    console.log(`[dev] Reset de senha para ${user.email}: ${resetUrl}`)
  }

  // Envio não-fatal: o link é devolvido na resposta de qualquer forma.
  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: process.env.EMAIL_FROM ?? 'noreply@codinhos.com.br',
      to: user.email,
      subject: 'Redefinir senha — Codinhos',
      html: `
        <p>Olá, ${user.name}!</p>
        <p>Um administrador iniciou a redefinição da sua senha.</p>
        <p>
          <a href="${resetUrl}">Clique aqui para definir uma nova senha</a>
        </p>
        <p>O link expira em 24 horas.</p>
      `,
    })
  } catch (err) {
    console.error('[admin] Falha ao enviar e-mail de reset:', err)
  }

  return { message: 'Reset de senha disparado.', resetUrl }
}
