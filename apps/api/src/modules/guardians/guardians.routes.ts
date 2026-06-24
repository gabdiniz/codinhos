import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { resolveTenant } from '../../shared/middlewares/resolve-tenant.js'
import { authenticate } from '../../shared/middlewares/authenticate.js'
import { requireRole } from '../../shared/middlewares/require-role.js'
import {
  getGuardians,
  createGuardian,
  getGuardianStudents,
  linkStudent,
  unlinkStudent,
  getChildren,
  getChildDetail,
} from './guardians.service.js'
import {
  slugParamsSchema,
  guardianParamsSchema,
  guardianStudentParamsSchema,
  childParamsSchema,
  createGuardianBodySchema,
  linkStudentBodySchema,
  listGuardiansResponseSchema,
  guardianResponseSchema,
  listGuardianStudentsResponseSchema,
  guardianStudentResponseSchema,
  listChildrenResponseSchema,
  childDetailResponseSchema,
  messageResponseSchema,
} from './guardians.schema.js'

export async function guardiansRoutes(app: FastifyInstance) {
  const f = app.withTypeProvider<ZodTypeProvider>()
  const managerGuard = [resolveTenant, authenticate, requireRole('manager')]
  const guardianGuard = [resolveTenant, authenticate, requireRole('guardian')]

  // ── Gestor: gerencia responsáveis ──────────────────────────────────────────

  f.get(
    '/:slug/guardians',
    {
      schema: { params: slugParamsSchema, response: { 200: listGuardiansResponseSchema } },
      preHandler: managerGuard,
    },
    async (req, reply) => {
      const result = await getGuardians(req.resolvedTenantId)
      return reply.status(200).send(result)
    },
  )

  f.post(
    '/:slug/guardians',
    {
      schema: {
        params: slugParamsSchema,
        body: createGuardianBodySchema,
        response: { 201: guardianResponseSchema },
      },
      preHandler: managerGuard,
    },
    async (req, reply) => {
      const result = await createGuardian(req.resolvedTenantId, req.params.slug, req.body)
      return reply.status(201).send({ data: result })
    },
  )

  f.get(
    '/:slug/guardians/:guardianId/students',
    {
      schema: { params: guardianParamsSchema, response: { 200: listGuardianStudentsResponseSchema } },
      preHandler: managerGuard,
    },
    async (req, reply) => {
      const result = await getGuardianStudents(req.params.guardianId, req.resolvedTenantId)
      return reply.status(200).send(result)
    },
  )

  f.post(
    '/:slug/guardians/:guardianId/students',
    {
      schema: {
        params: guardianParamsSchema,
        body: linkStudentBodySchema,
        response: { 201: guardianStudentResponseSchema },
      },
      preHandler: managerGuard,
    },
    async (req, reply) => {
      const result = await linkStudent(req.params.guardianId, req.resolvedTenantId, req.body)
      return reply.status(201).send({ data: result })
    },
  )

  f.delete(
    '/:slug/guardians/:guardianId/students/:studentId',
    {
      schema: { params: guardianStudentParamsSchema, response: { 200: messageResponseSchema } },
      preHandler: managerGuard,
    },
    async (req, reply) => {
      await unlinkStudent(req.params.guardianId, req.params.studentId, req.resolvedTenantId)
      return reply.status(200).send({ data: { message: 'Aluno desvinculado do responsável' } })
    },
  )

  // ── Responsável: portal read-only ──────────────────────────────────────────

  f.get(
    '/:slug/guardian/children',
    {
      schema: { params: slugParamsSchema, response: { 200: listChildrenResponseSchema } },
      preHandler: guardianGuard,
    },
    async (req, reply) => {
      const result = await getChildren(req.user.id, req.resolvedTenantId)
      return reply.status(200).send(result)
    },
  )

  f.get(
    '/:slug/guardian/children/:studentId',
    {
      schema: { params: childParamsSchema, response: { 200: childDetailResponseSchema } },
      preHandler: guardianGuard,
    },
    async (req, reply) => {
      const result = await getChildDetail(req.user.id, req.resolvedTenantId, req.params.studentId)
      return reply.status(200).send(result)
    },
  )
}
