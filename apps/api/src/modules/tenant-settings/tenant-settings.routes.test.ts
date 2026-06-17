import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { getTestApp, closeTestApp, inject } from '../../shared/test/helpers.js'
import { truncateAll } from '../../shared/test/db.js'
import { makeTenant, makeUser, makeSession } from '../../shared/test/factories.js'

// ─── Testes de integração — tenant-settings.routes ────────────────────────────
// Foco: campo aiErrorExplanationEnabled (toggle do gestor para a explicação de
// erro pelo tutor de IA). Demais campos de settings já são cobertos pela
// implementação original do módulo.

describe('tenant-settings.routes (integration)', () => {
  let app: FastifyInstance
  let tenantSlug: string
  let tenantId: string
  let managerSessionId: string

  beforeAll(async () => {
    app = await getTestApp()
    await truncateAll()

    const tenant = await makeTenant({ slug: 'escola-settings' })
    tenantSlug = tenant.slug
    tenantId = tenant.id

    const manager = await makeUser(tenantId, { role: 'manager' })
    managerSessionId = await makeSession(manager.id, tenantId, 'manager')
  })

  afterAll(async () => {
    await closeTestApp()
  })

  // ── GET /:slug/settings ─────────────────────────────────────────────────

  describe('GET /:slug/settings', () => {
    it('deve retornar 401 sem sessão', async () => {
      const res = await inject(app, {
        method: 'GET',
        url: `/api/${tenantSlug}/settings`,
      })

      expect(res.statusCode).toBe(401)
    })

    it('deve retornar aiErrorExplanationEnabled=true por padrão quando o tenant não tem configuração salva', async () => {
      const res = await inject(app, {
        method: 'GET',
        url: `/api/${tenantSlug}/settings`,
        sessionId: managerSessionId,
      })

      expect(res.statusCode).toBe(200)
      expect(res.json().data.settings.aiErrorExplanationEnabled).toBe(true)
    })
  })

  // ── PATCH /:slug/settings ───────────────────────────────────────────────

  describe('PATCH /:slug/settings', () => {
    it('deve persistir aiErrorExplanationEnabled=false e refletir em um GET subsequente', async () => {
      const patchRes = await inject(app, {
        method: 'PATCH',
        url: `/api/${tenantSlug}/settings`,
        sessionId: managerSessionId,
        payload: { aiErrorExplanationEnabled: false },
      })

      expect(patchRes.statusCode).toBe(200)
      expect(patchRes.json().data.settings.aiErrorExplanationEnabled).toBe(false)

      const getRes = await inject(app, {
        method: 'GET',
        url: `/api/${tenantSlug}/settings`,
        sessionId: managerSessionId,
      })

      expect(getRes.json().data.settings.aiErrorExplanationEnabled).toBe(false)
    })

    it('deve permitir reativar aiErrorExplanationEnabled=true', async () => {
      const res = await inject(app, {
        method: 'PATCH',
        url: `/api/${tenantSlug}/settings`,
        sessionId: managerSessionId,
        payload: { aiErrorExplanationEnabled: true },
      })

      expect(res.statusCode).toBe(200)
      expect(res.json().data.settings.aiErrorExplanationEnabled).toBe(true)
    })

    it('não deve alterar aiErrorExplanationEnabled quando o campo não é enviado no body', async () => {
      // Estado atual é true (teste anterior) — um PATCH só de theme não deve mexer no flag
      const res = await inject(app, {
        method: 'PATCH',
        url: `/api/${tenantSlug}/settings`,
        sessionId: managerSessionId,
        payload: { theme: { '--color-primary': '#ff0000' } },
      })

      expect(res.statusCode).toBe(200)
      expect(res.json().data.settings.aiErrorExplanationEnabled).toBe(true)
    })

    it('deve retornar 401 sem sessão', async () => {
      const res = await inject(app, {
        method: 'PATCH',
        url: `/api/${tenantSlug}/settings`,
        payload: { aiErrorExplanationEnabled: false },
      })

      expect(res.statusCode).toBe(401)
    })
  })

  // ── Isolamento de tenant ───────────────────────────────────────────────────

  describe('isolamento de tenant', () => {
    it('alterar aiErrorExplanationEnabled em um tenant não deve afetar outro tenant', async () => {
      const otherTenant = await makeTenant({ slug: 'outra-escola-settings' })
      const otherManager = await makeUser(otherTenant.id, { role: 'manager' })
      const otherSessionId = await makeSession(otherManager.id, otherTenant.id, 'manager')

      // Desabilita a feature no tenant principal
      const patchRes = await inject(app, {
        method: 'PATCH',
        url: `/api/${tenantSlug}/settings`,
        sessionId: managerSessionId,
        payload: { aiErrorExplanationEnabled: false },
      })
      expect(patchRes.statusCode).toBe(200)

      // O outro tenant deve manter o padrão (true), sem nunca ter sido configurado
      const otherRes = await inject(app, {
        method: 'GET',
        url: `/api/${otherTenant.slug}/settings`,
        sessionId: otherSessionId,
      })

      expect(otherRes.statusCode).toBe(200)
      expect(otherRes.json().data.settings.aiErrorExplanationEnabled).toBe(true)
    })

    it('não deve permitir usar sessão de um tenant em outro tenant', async () => {
      const otherTenant = await makeTenant({ slug: 'escola-cross-settings' })
      const otherManager = await makeUser(otherTenant.id, { role: 'manager' })
      const otherSessionId = await makeSession(otherManager.id, otherTenant.id, 'manager')

      const res = await inject(app, {
        method: 'GET',
        url: `/api/${tenantSlug}/settings`,
        sessionId: otherSessionId,
      })

      expect(res.statusCode).toBe(404)
    })
  })
})
