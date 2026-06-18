import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { getTestApp, closeTestApp, inject } from '../../shared/test/helpers.js'
import { truncateAll } from '../../shared/test/db.js'
import {
  makeTenant,
  makeUser,
  makeSession,
  makeTrail,
  makeModule,
  makeClass,
  enrollStudent,
} from '../../shared/test/factories.js'
import { assignTrailToClass } from '../classes/classes.repository.js'

describe('progress.routes (integration)', () => {
  let app: FastifyInstance
  let tenantSlug: string
  let tenantId: string
  let managerId: string
  let managerSessionId: string

  beforeAll(async () => {
    app = await getTestApp()
    await truncateAll()

    const tenant = await makeTenant({ slug: 'escola-progress' })
    tenantSlug = tenant.slug
    tenantId = tenant.id

    const manager = await makeUser(tenantId, { role: 'manager' })
    managerId = manager.id
    managerSessionId = await makeSession(manager.id, tenantId, 'manager')
  })

  afterAll(async () => {
    await closeTestApp()
  })

  describe('PATCH /:slug/progress/modules/:moduleId/unlock', () => {
    it('deve desbloquear o módulo quando a turma está em modo controlled e o módulo pertence a uma trilha atribuída', async () => {
      const trail = await makeTrail()
      const mod = await makeModule(trail.id)
      const cls = await makeClass(tenantId, { progressionMode: 'controlled' })
      const student = await makeUser(tenantId, { role: 'student' })
      await enrollStudent(cls.id, student.id)
      await assignTrailToClass(cls.id, trail.id, 1, false)

      const res = await inject(app, {
        method: 'PATCH',
        url: `/api/${tenantSlug}/progress/modules/${mod.id}/unlock`,
        sessionId: managerSessionId,
        payload: { studentId: student.id, classId: cls.id },
      })

      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.data.moduleProgress.status).toBe('available')
      expect(body.data.moduleProgress.unlockedBy).toBe(managerId)
      expect(body.data.moduleProgress.studentId).toBe(student.id)
      expect(body.data.moduleProgress.moduleId).toBe(mod.id)
    })

    it('deve retornar 400 quando a turma não está no modo de progressão "controlled"', async () => {
      const trail = await makeTrail()
      const mod = await makeModule(trail.id)
      const cls = await makeClass(tenantId, { progressionMode: 'free' })
      const student = await makeUser(tenantId, { role: 'student' })
      await enrollStudent(cls.id, student.id)
      await assignTrailToClass(cls.id, trail.id, 1, false)

      const res = await inject(app, {
        method: 'PATCH',
        url: `/api/${tenantSlug}/progress/modules/${mod.id}/unlock`,
        sessionId: managerSessionId,
        payload: { studentId: student.id, classId: cls.id },
      })

      expect(res.statusCode).toBe(400)
    })

    it('deve retornar 403 quando o módulo não pertence a uma trilha atribuída à turma', async () => {
      const trail = await makeTrail()
      const mod = await makeModule(trail.id)
      const cls = await makeClass(tenantId, { progressionMode: 'controlled' })
      const student = await makeUser(tenantId, { role: 'student' })
      await enrollStudent(cls.id, student.id)
      // Trilha NÃO atribuída a esta turma

      const res = await inject(app, {
        method: 'PATCH',
        url: `/api/${tenantSlug}/progress/modules/${mod.id}/unlock`,
        sessionId: managerSessionId,
        payload: { studentId: student.id, classId: cls.id },
      })

      expect(res.statusCode).toBe(403)
    })

    it('deve retornar 409 quando o módulo já está desbloqueado para o aluno', async () => {
      const trail = await makeTrail()
      const mod = await makeModule(trail.id)
      const cls = await makeClass(tenantId, { progressionMode: 'controlled' })
      const student = await makeUser(tenantId, { role: 'student' })
      await enrollStudent(cls.id, student.id)
      await assignTrailToClass(cls.id, trail.id, 1, false)

      const first = await inject(app, {
        method: 'PATCH',
        url: `/api/${tenantSlug}/progress/modules/${mod.id}/unlock`,
        sessionId: managerSessionId,
        payload: { studentId: student.id, classId: cls.id },
      })
      expect(first.statusCode).toBe(200)

      const second = await inject(app, {
        method: 'PATCH',
        url: `/api/${tenantSlug}/progress/modules/${mod.id}/unlock`,
        sessionId: managerSessionId,
        payload: { studentId: student.id, classId: cls.id },
      })

      expect(second.statusCode).toBe(409)
    })

    it('deve retornar 404 quando a turma não existe no tenant', async () => {
      const trail = await makeTrail()
      const mod = await makeModule(trail.id)
      const student = await makeUser(tenantId, { role: 'student' })

      const res = await inject(app, {
        method: 'PATCH',
        url: `/api/${tenantSlug}/progress/modules/${mod.id}/unlock`,
        sessionId: managerSessionId,
        payload: { studentId: student.id, classId: '00000000-0000-0000-0000-000000000000' },
      })

      expect(res.statusCode).toBe(404)
    })

    it('deve retornar 401 sem sessão', async () => {
      const trail = await makeTrail()
      const mod = await makeModule(trail.id)
      const cls = await makeClass(tenantId, { progressionMode: 'controlled' })
      const student = await makeUser(tenantId, { role: 'student' })

      const res = await inject(app, {
        method: 'PATCH',
        url: `/api/${tenantSlug}/progress/modules/${mod.id}/unlock`,
        payload: { studentId: student.id, classId: cls.id },
      })

      expect(res.statusCode).toBe(401)
    })

    it('deve retornar 403 quando o usuário autenticado não é manager', async () => {
      const trail = await makeTrail()
      const mod = await makeModule(trail.id)
      const cls = await makeClass(tenantId, { progressionMode: 'controlled' })
      const student = await makeUser(tenantId, { role: 'student' })
      const studentSessionId = await makeSession(student.id, tenantId, 'student')

      const res = await inject(app, {
        method: 'PATCH',
        url: `/api/${tenantSlug}/progress/modules/${mod.id}/unlock`,
        sessionId: studentSessionId,
        payload: { studentId: student.id, classId: cls.id },
      })

      expect(res.statusCode).toBe(403)
    })
  })

  describe('isolamento de tenant', () => {
    it('não deve desbloquear módulo usando classId de turma de outro tenant (404)', async () => {
      const otherTenant = await makeTenant({ slug: 'outra-escola-progress' })
      const otherManager = await makeUser(otherTenant.id, { role: 'manager' })
      const otherManagerSessionId = await makeSession(otherManager.id, otherTenant.id, 'manager')

      const trail = await makeTrail()
      const mod = await makeModule(trail.id)
      const cls = await makeClass(tenantId, { progressionMode: 'controlled' }) // turma do tenant principal
      const student = await makeUser(tenantId, { role: 'student' })

      const res = await inject(app, {
        method: 'PATCH',
        url: `/api/${otherTenant.slug}/progress/modules/${mod.id}/unlock`,
        sessionId: otherManagerSessionId,
        payload: { studentId: student.id, classId: cls.id },
      })

      expect(res.statusCode).toBe(404)
    })

    it('não deve permitir usar sessão de um tenant em outro tenant', async () => {
      const otherTenant = await makeTenant({ slug: 'escola-cross-progress' })
      const otherManager = await makeUser(otherTenant.id, { role: 'manager' })
      const otherManagerSessionId = await makeSession(otherManager.id, otherTenant.id, 'manager')

      const trail = await makeTrail()
      const mod = await makeModule(trail.id)
      const cls = await makeClass(tenantId, { progressionMode: 'controlled' })
      const student = await makeUser(tenantId, { role: 'student' })

      const res = await inject(app, {
        method: 'PATCH',
        url: `/api/${tenantSlug}/progress/modules/${mod.id}/unlock`,
        sessionId: otherManagerSessionId,
        payload: { studentId: student.id, classId: cls.id },
      })

      expect(res.statusCode).toBe(404)
    })
  })
})
