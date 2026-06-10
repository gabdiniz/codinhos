import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { getTestApp, closeTestApp, inject, extractSessionCookie } from '../../shared/test/helpers.js'
import { truncateAll } from '../../shared/test/db.js'
import {
  makeTenant,
  makeUser,
  makeSession,
  TEST_PASSWORD,
} from '../../shared/test/factories.js'

// Evita envio real de e-mail nos testes de integração
vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: { send: vi.fn().mockResolvedValue({ id: 'email-id' }) },
  })),
}))

// ─── Testes de integração — auth.routes ───────────────────────────────────────

describe('auth.routes (integration)', () => {
  let app: FastifyInstance
  let tenantSlug: string
  let tenantId: string
  let studentId: string

  beforeAll(async () => {
    app = await getTestApp()
    await truncateAll()

    // Cria tenant e usuário de teste uma vez para todos os testes do bloco
    const tenant = await makeTenant({ slug: 'escola-teste' })
    tenantSlug = tenant.slug
    tenantId = tenant.id

    const student = await makeUser(tenantId, { role: 'student' })
    studentId = student.id
  })

  afterAll(async () => {
    await closeTestApp()
  })

  // ── POST /:slug/auth/login ─────────────────────────────────────────────────

  describe('POST /:slug/auth/login', () => {
    it('deve retornar 404 quando o tenant não existe', async () => {
      const res = await inject(app, {
        method: 'POST',
        url: '/api/tenant-inexistente/auth/login',
        payload: { email: 'a@b.com', password: '123' },
      })

      expect(res.statusCode).toBe(404)
    })

    it('deve retornar 401 quando credenciais são inválidas', async () => {
      const res = await inject(app, {
        method: 'POST',
        url: `/api/${tenantSlug}/auth/login`,
        payload: { email: 'nao@existe.com', password: 'qualquer' },
      })

      expect(res.statusCode).toBe(401)
    })

    it('deve retornar 401 quando a senha está errada', async () => {
      const { email } = await makeUser(tenantId, { role: 'student' })

      const res = await inject(app, {
        method: 'POST',
        url: `/api/${tenantSlug}/auth/login`,
        payload: { email, password: 'SenhaErrada!1' },
      })

      expect(res.statusCode).toBe(401)
    })

    it('deve retornar 403 quando usuário está inativo', async () => {
      const { email } = await makeUser(tenantId, { role: 'student', isActive: false })

      const res = await inject(app, {
        method: 'POST',
        url: `/api/${tenantSlug}/auth/login`,
        payload: { email, password: TEST_PASSWORD },
      })

      expect(res.statusCode).toBe(403)
    })

    it('deve retornar 200 com dados do usuário e setar cookie de sessão', async () => {
      const { email } = await makeUser(tenantId, { role: 'student' })

      const res = await inject(app, {
        method: 'POST',
        url: `/api/${tenantSlug}/auth/login`,
        payload: { email, password: TEST_PASSWORD },
      })

      expect(res.statusCode).toBe(200)

      const body = res.json()
      expect(body.data.user.email).toBe(email)
      expect(body.data.user.role).toBe('student')
      expect(body.data.redirectTo).toBe(`/${tenantSlug}/learn`)

      // Garante que o cookie de sessão foi setado
      const setCookie = res.headers['set-cookie']
      expect(setCookie).toBeDefined()
      const sessionId = extractSessionCookie(setCookie)
      expect(sessionId).toBeTruthy()
    })

    it('deve retornar redirectTo correto para manager', async () => {
      const { email } = await makeUser(tenantId, { role: 'manager' })

      const res = await inject(app, {
        method: 'POST',
        url: `/api/${tenantSlug}/auth/login`,
        payload: { email, password: TEST_PASSWORD },
      })

      expect(res.statusCode).toBe(200)
      expect(res.json().data.redirectTo).toBe(`/${tenantSlug}/dashboard`)
    })
  })

  // ── GET /:slug/auth/me ─────────────────────────────────────────────────────

  describe('GET /:slug/auth/me', () => {
    it('deve retornar 401 sem cookie de sessão', async () => {
      const res = await inject(app, {
        method: 'GET',
        url: `/api/${tenantSlug}/auth/me`,
      })

      expect(res.statusCode).toBe(401)
    })

    it('deve retornar 401 com sessionId inexistente', async () => {
      const res = await inject(app, {
        method: 'GET',
        url: `/api/${tenantSlug}/auth/me`,
        sessionId: '00000000-0000-0000-0000-000000000000',
      })

      expect(res.statusCode).toBe(401)
    })

    it('deve retornar os dados do usuário autenticado', async () => {
      const sessionId = await makeSession(studentId, tenantId, 'student')

      const res = await inject(app, {
        method: 'GET',
        url: `/api/${tenantSlug}/auth/me`,
        sessionId,
      })

      expect(res.statusCode).toBe(200)

      const body = res.json()
      expect(body.data.user.id).toBe(studentId)
      expect(body.data.user.role).toBe('student')
    })
  })

  // ── POST /:slug/auth/logout ────────────────────────────────────────────────

  describe('POST /:slug/auth/logout', () => {
    it('deve retornar 401 sem sessão', async () => {
      const res = await inject(app, {
        method: 'POST',
        url: `/api/${tenantSlug}/auth/logout`,
      })

      expect(res.statusCode).toBe(401)
    })

    it('deve invalidar a sessão e retornar 200', async () => {
      const sessionId = await makeSession(studentId, tenantId, 'student')

      const logoutRes = await inject(app, {
        method: 'POST',
        url: `/api/${tenantSlug}/auth/logout`,
        sessionId,
      })

      expect(logoutRes.statusCode).toBe(200)

      // Sessão não pode mais ser usada após logout
      const meRes = await inject(app, {
        method: 'GET',
        url: `/api/${tenantSlug}/auth/me`,
        sessionId,
      })

      expect(meRes.statusCode).toBe(401)
    })
  })

  // ── Isolamento de tenant ───────────────────────────────────────────────────

  describe('isolamento de tenant', () => {
    it('não deve permitir usar sessão de um tenant em outro tenant', async () => {
      // Cria segundo tenant com seu próprio usuário e sessão
      const otherTenant = await makeTenant({ slug: 'outra-escola' })
      const otherUser = await makeUser(otherTenant.id, { role: 'student' })
      const otherSessionId = await makeSession(otherUser.id, otherTenant.id, 'student')

      // Tenta usar a sessão do outro tenant no primeiro tenant
      // O middleware detecta cross-tenant e lança NotFoundError (404)
      const res = await inject(app, {
        method: 'GET',
        url: `/api/${tenantSlug}/auth/me`,
        sessionId: otherSessionId,
      })

      expect(res.statusCode).toBe(404)
    })
  })
})
