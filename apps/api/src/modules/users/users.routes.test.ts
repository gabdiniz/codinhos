import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { getTestApp, closeTestApp, inject } from '../../shared/test/helpers.js'
import { truncateAll } from '../../shared/test/db.js'
import { makeTenant, makeUser, makeSession } from '../../shared/test/factories.js'

// Foco: GET /:slug/users/template e POST /:slug/users/import (Sprint 1.1).
// Os demais endpoints de users (CRUD, resend-invite, profile, password) não
// têm cobertura de integração ainda.

function csvFormData(content: string, filename = 'alunos.csv') {
  const form = new FormData()
  form.set('file', new Blob([content], { type: 'text/csv' }), filename)
  return form
}

describe('users.routes — template e import (integration)', () => {
  let app: FastifyInstance
  let tenantSlug: string
  let tenantId: string
  let managerSessionId: string

  beforeAll(async () => {
    app = await getTestApp()
    await truncateAll()

    const tenant = await makeTenant({ slug: 'escola-import' })
    tenantSlug = tenant.slug
    tenantId = tenant.id

    const manager = await makeUser(tenantId, { role: 'manager' })
    managerSessionId = await makeSession(manager.id, tenantId, 'manager')
  })

  afterAll(async () => {
    await closeTestApp()
  })

  describe('GET /:slug/users/template', () => {
    it('deve retornar o CSV-modelo com Content-Type text/csv', async () => {
      const res = await inject(app, {
        method: 'GET',
        url: `/api/${tenantSlug}/users/template`,
        sessionId: managerSessionId,
      })

      expect(res.statusCode).toBe(200)
      expect(res.headers['content-type']).toContain('text/csv')
      expect(res.body.startsWith('name,email')).toBe(true)
    })

    it('deve retornar 401 sem sessão', async () => {
      const res = await inject(app, {
        method: 'GET',
        url: `/api/${tenantSlug}/users/template`,
      })

      expect(res.statusCode).toBe(401)
    })

    it('deve retornar 403 quando o usuário autenticado não é manager', async () => {
      const student = await makeUser(tenantId, { role: 'student' })
      const studentSessionId = await makeSession(student.id, tenantId, 'student')

      const res = await inject(app, {
        method: 'GET',
        url: `/api/${tenantSlug}/users/template`,
        sessionId: studentSessionId,
      })

      expect(res.statusCode).toBe(403)
    })
  })

  describe('POST /:slug/users/import', () => {
    it('deve criar os alunos do CSV com role "student" e retornar created/skipped/errors', async () => {
      const csv = 'name,email\nAna Lima,ana.lima@escola-import.com\nBruno Rocha,bruno.rocha@escola-import.com'

      const res = await inject(app, {
        method: 'POST',
        url: `/api/${tenantSlug}/users/import`,
        sessionId: managerSessionId,
        payload: csvFormData(csv),
      })

      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.data.created).toBe(2)
      expect(body.data.skipped).toBe(0)
      expect(body.data.errors).toEqual([])

      const list = await inject(app, {
        method: 'GET',
        url: `/api/${tenantSlug}/users?role=student`,
        sessionId: managerSessionId,
      })
      const emails = list.json().data.map((u: { email: string }) => u.email)
      expect(emails).toContain('ana.lima@escola-import.com')
    })

    it('deve ignorar (skip) e-mail já cadastrado no tenant, sem sobrescrever o usuário existente', async () => {
      const existing = await makeUser(tenantId, { email: 'existente@escola-import.com', role: 'student' })

      const csv = 'name,email\nNome Novo,existente@escola-import.com'
      const res = await inject(app, {
        method: 'POST',
        url: `/api/${tenantSlug}/users/import`,
        sessionId: managerSessionId,
        payload: csvFormData(csv),
      })

      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.data.created).toBe(0)
      expect(body.data.skipped).toBe(1)

      const detail = await inject(app, {
        method: 'GET',
        url: `/api/${tenantSlug}/users/${existing.id}`,
        sessionId: managerSessionId,
      })
      expect(detail.json().data.user.name).toBe(existing.name) // não foi sobrescrito
    })

    it('deve reportar erros por linha sem interromper o processamento das demais', async () => {
      const csv = [
        'name,email',
        ',sem-nome@escola-import.com',
        'Sem Email Aqui',
        'Email Invalido,nao-e-email',
        'Valida Souza,valida.souza@escola-import.com',
      ].join('\n')

      const res = await inject(app, {
        method: 'POST',
        url: `/api/${tenantSlug}/users/import`,
        sessionId: managerSessionId,
        payload: csvFormData(csv),
      })

      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.data.created).toBe(1)
      expect(body.data.errors).toEqual([
        { row: 2, reason: 'Nome em branco' },
        { row: 3, reason: 'Formato inválido — esperado "name,email"' },
        { row: 4, reason: 'E-mail inválido' },
      ])
    })

    it('deve retornar 400 quando nenhum arquivo é enviado', async () => {
      const form = new FormData()
      form.set('note', 'sem arquivo')

      const res = await inject(app, {
        method: 'POST',
        url: `/api/${tenantSlug}/users/import`,
        sessionId: managerSessionId,
        payload: form,
      })

      expect(res.statusCode).toBe(400)
    })

    it('deve retornar 401 sem sessão', async () => {
      const res = await inject(app, {
        method: 'POST',
        url: `/api/${tenantSlug}/users/import`,
        payload: csvFormData('name,email\nFulano,fulano@escola-import.com'),
      })

      expect(res.statusCode).toBe(401)
    })

    it('deve retornar 403 quando o usuário autenticado não é manager', async () => {
      const student = await makeUser(tenantId, { role: 'student' })
      const studentSessionId = await makeSession(student.id, tenantId, 'student')

      const res = await inject(app, {
        method: 'POST',
        url: `/api/${tenantSlug}/users/import`,
        sessionId: studentSessionId,
        payload: csvFormData('name,email\nFulano,fulano2@escola-import.com'),
      })

      expect(res.statusCode).toBe(403)
    })
  })

  describe('isolamento de tenant', () => {
    it('não deve marcar como skipped um e-mail que existe apenas em outro tenant', async () => {
      const otherTenant = await makeTenant({ slug: 'outra-escola-import' })
      await makeUser(otherTenant.id, { email: 'cruzado@escola-import.com', role: 'student' })

      const csv = 'name,email\nFulano Cruzado,cruzado@escola-import.com'
      const res = await inject(app, {
        method: 'POST',
        url: `/api/${tenantSlug}/users/import`,
        sessionId: managerSessionId,
        payload: csvFormData(csv),
      })

      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.data.created).toBe(1) // criado no tenant principal, não foi tratado como duplicado
      expect(body.data.skipped).toBe(0)
    })
  })
})
