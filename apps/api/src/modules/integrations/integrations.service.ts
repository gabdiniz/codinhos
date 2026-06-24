import { randomBytes, createHash } from 'node:crypto'
import bcrypt from 'bcryptjs'
import { Resend } from 'resend'
import {
  buildAuthUrl,
  exchangeCodeForTokens,
  refreshAccessToken,
  fetchGoogleEmail,
  listCourses,
  listCourseStudents,
} from '../../shared/integrations/google-classroom.js'
import {
  findGoogleIntegration,
  upsertGoogleIntegration,
  updateGoogleAccessToken,
  deleteGoogleIntegration,
} from './integrations.repository.js'
import { createClass, addStudentToClass, findClassStudent } from '../classes/classes.repository.js'
import { findUserByEmailInTenant, createUser, createInviteToken } from '../users/users.repository.js'
import { AiServiceError, UnprocessableError } from '../../shared/errors/index.js'
import type { ImportCourseBody } from './integrations.schema.js'

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000
const EXPIRY_SKEW_MS = 60 * 1000 // renova 1 min antes de expirar

function hashToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex')
}

async function sendStudentInvite(opts: { to: string; name: string; slug: string; token: string }) {
  const inviteUrl = `${process.env.APP_URL}/${opts.slug}/accept-invite?token=${opts.token}`
  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: process.env.EMAIL_FROM ?? 'noreply@codinhos.com.br',
      to: opts.to,
      subject: 'Bem-vindo ao Codinhos — Configure seu acesso',
      html: `<p>Olá, ${opts.name}!</p><p>Sua turma foi importada do Google Classroom.</p>
             <p><a href="${inviteUrl}">Clique aqui para configurar sua senha</a></p><p>O link expira em 7 dias.</p>`,
    })
  } catch (err) {
    console.error('[integrations] Falha ao enviar convite:', err)
  }
}

// ─── Status / conexão ─────────────────────────────────────────────────────────

export async function getStatus(tenantId: string) {
  const integ = await findGoogleIntegration(tenantId)
  return { data: { connected: !!integ, googleEmail: integ?.googleEmail ?? null } }
}

/** Gera a URL de consentimento. O `state` (CSRF) é guardado em cookie pela rota. */
export function getAuthUrl(slug: string) {
  const nonce = randomBytes(16).toString('hex')
  const state = `${nonce}:${slug}`
  return { url: buildAuthUrl(state), state }
}

export async function handleCallback(tenantId: string, userId: string, code: string) {
  const tokens = await exchangeCodeForTokens(code)
  if (!tokens.refreshToken) {
    throw new AiServiceError(
      'Google não retornou refresh token. Remova o acesso em myaccount.google.com/permissions e reconecte.',
    )
  }
  const googleEmail = await fetchGoogleEmail(tokens.accessToken)
  await upsertGoogleIntegration({
    tenantId,
    connectedBy: userId,
    googleEmail,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    tokenExpiry: new Date(Date.now() + tokens.expiresInSec * 1000),
    scope: tokens.scope,
  })
  return { googleEmail }
}

export async function disconnect(tenantId: string) {
  await deleteGoogleIntegration(tenantId)
}

/** Garante um access token válido, renovando via refresh_token se necessário. */
async function getValidAccessToken(tenantId: string): Promise<string> {
  const integ = await findGoogleIntegration(tenantId)
  if (!integ) throw new UnprocessableError('Conta Google não conectada')
  if (integ.tokenExpiry.getTime() > Date.now() + EXPIRY_SKEW_MS) return integ.accessToken

  const refreshed = await refreshAccessToken(integ.refreshToken)
  const newExpiry = new Date(Date.now() + refreshed.expiresInSec * 1000)
  await updateGoogleAccessToken(tenantId, refreshed.accessToken, newExpiry)
  return refreshed.accessToken
}

// ─── Rostering ────────────────────────────────────────────────────────────────

export async function listGoogleCourses(tenantId: string) {
  const accessToken = await getValidAccessToken(tenantId)
  const courses = await listCourses(accessToken)
  return { data: courses.map((c) => ({ id: c.id, name: c.name, section: c.section })) }
}

/**
 * Importação one-way: cria uma turma no Codinhos a partir de um curso do Classroom,
 * cria/reaproveita os alunos (por e-mail) e os matricula. Idempotente por aluno
 * (não duplica matrícula nem usuário), mas re-importar cria uma nova turma.
 */
export async function importCourse(tenantId: string, slug: string, body: ImportCourseBody) {
  const accessToken = await getValidAccessToken(tenantId)
  const students = await listCourseStudents(accessToken, body.courseId)

  const cls = await createClass({ tenantId, name: body.courseName })

  let created = 0
  let reused = 0
  for (const st of students) {
    const existing = await findUserByEmailInTenant(st.email, tenantId)
    let studentId: string
    if (existing) {
      studentId = existing.id
      reused++
    } else {
      const passwordHash = await bcrypt.hash(randomBytes(16).toString('hex'), 12)
      const user = await createUser({
        tenantId,
        name: st.name,
        email: st.email,
        passwordHash,
        role: 'student',
      })
      studentId = user.id
      const rawToken = randomBytes(32).toString('hex')
      await createInviteToken(user.id, hashToken(rawToken), new Date(Date.now() + INVITE_TTL_MS))
      await sendStudentInvite({ to: user.email, name: user.name, slug, token: rawToken })
      created++
    }

    const link = await findClassStudent(cls.id, studentId)
    if (!link) await addStudentToClass(cls.id, studentId)
  }

  return {
    data: {
      classId: cls.id,
      className: cls.name,
      total: students.length,
      created,
      reused,
    },
  }
}
