import { randomBytes, createHash } from 'node:crypto'
import bcrypt from 'bcryptjs'
import { Resend } from 'resend'
import { eq } from 'drizzle-orm'
import { tenants, sessions } from '../../shared/db/schema.js'
import type { TenantSettings } from '../../shared/db/schema.js'
import { db } from '../../shared/db/index.js'
import {
  findTenantBySlug,
  findTenantById,
  listTenants,
  updateTenant,
  createTenantWithManager,
} from './tenants.repository.js'
import { ConflictError, NotFoundError, UnprocessableError } from '../../shared/errors/index.js'
import type { ListTenantsQuery, CreateTenantBody, UpdateTenantBody } from './tenants.schema.js'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SYSTEM_TENANT_SLUG = '__system__'
const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 dias

function hashToken(rawToken: string): string {
  return createHash('sha256').update(rawToken).digest('hex')
}

// ─── List ─────────────────────────────────────────────────────────────────────

export async function getTenants(query: ListTenantsQuery) {
  const { rows, total } = await listTenants({
    page: query.page,
    limit: query.limit,
    isActive: query.isActive,
  })
  return { data: rows, meta: { total, page: query.page, limit: query.limit } }
}

// ─── Get by ID ────────────────────────────────────────────────────────────────

export async function getTenantById(tenantId: string) {
  const tenant = await findTenantById(tenantId)
  if (!tenant) throw new NotFoundError('Tenant')
  return { tenant }
}

// ─── Create ───────────────────────────────────────────────────────────────────

export async function createNewTenant(body: CreateTenantBody) {
  // 1. Slug único
  const existing = await findTenantBySlug(body.slug)
  if (existing) throw new ConflictError('Slug já está em uso')

  // 2-4. Cria tenant + gestor + token em transação (atômico)
  const randomPassword = randomBytes(32).toString('hex')
  const passwordHash = await bcrypt.hash(randomPassword, 12)

  const rawToken = randomBytes(32).toString('hex')
  const tokenHash = hashToken(rawToken)
  const expiresAt = new Date(Date.now() + INVITE_TTL_MS)

  const { tenant, manager } = await db.transaction((tx) =>
    createTenantWithManager(tx, {
      slug: body.slug,
      name: body.name,
      plan: body.plan,
      settings: body.settings as TenantSettings | undefined,
      managerEmail: body.managerEmail,
      managerName: body.managerName,
      passwordHash,
      tokenHash,
      tokenExpiresAt: expiresAt,
    }),
  )

  // 5. Envia e-mail de convite (erro não propaga — inviteSent indica o resultado)
  let inviteSent = false
  const inviteUrl = `${process.env.APP_URL}/${body.slug}/accept-invite?token=${rawToken}`

  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: process.env.EMAIL_FROM ?? 'noreply@codinhos.com.br',
      to: manager.email,
      subject: 'Bem-vindo ao Codinhos — Configure seu acesso',
      html: `
        <p>Olá, ${body.managerName}!</p>
        <p>Sua escola <strong>${body.name}</strong> foi criada no Codinhos.</p>
        <p>
          <a href="${inviteUrl}">Clique aqui para configurar sua senha</a>
        </p>
        <p>O link expira em 7 dias.</p>
      `,
    })
    inviteSent = true
  } catch (err) {
    console.error('[tenants] Falha ao enviar convite:', err)
  }

  return { tenant, manager: { id: manager.id, email: manager.email }, inviteSent }
}

// ─── Update ───────────────────────────────────────────────────────────────────

export async function updateExistingTenant(tenantId: string, body: UpdateTenantBody) {
  const current = await findTenantById(tenantId)
  if (!current) throw new NotFoundError('Tenant')

  // settings é merged (não substituído)
  const mergedSettings = body.settings !== undefined
    ? { ...(current.settings ?? {}), ...body.settings } as TenantSettings
    : undefined

  const tenant = await updateTenant(tenantId, {
    name: body.name,
    plan: body.plan,
    settings: mergedSettings,
    theme: body.theme,
  })

  return { tenant: tenant! }
}

// ─── Deactivate ───────────────────────────────────────────────────────────────

export async function deactivateTenant(tenantId: string) {
  const tenant = await findTenantById(tenantId)
  if (!tenant) throw new NotFoundError('Tenant')

  if (tenant.slug === SYSTEM_TENANT_SLUG) {
    throw new UnprocessableError('Não é possível desativar o tenant do sistema')
  }

  if (!tenant.isActive) {
    throw new UnprocessableError('Tenant já está inativo')
  }

  await db.transaction(async (tx) => {
    await tx.update(tenants).set({ isActive: false }).where(eq(tenants.id, tenantId))
    await tx.delete(sessions).where(eq(sessions.tenantId, tenantId))
  })
}
