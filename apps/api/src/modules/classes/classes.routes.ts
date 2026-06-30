import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { resolveTenant } from '../../shared/middlewares/resolve-tenant.js'
import { authenticate } from '../../shared/middlewares/authenticate.js'
import { requireRole } from '../../shared/middlewares/require-role.js'
import {
  getClasses,
  getClassDetail,
  createNewClass,
  updateExistingClass,
  removeClass,
  getClassStudents,
  addStudent,
  removeStudent,
  getClassTeachers,
  assignTeacher,
  getTeacherClasses,
  removeTeacher,
  getClassTrails,
  assignTrail,
  updateExistingClassTrail,
  removeClassTrail,
} from './classes.service.js'
import {
  slugParamsSchema,
  classParamsSchema,
  studentParamsSchema,
  teacherParamsSchema,
  teacherClassesParamsSchema,
  classTrailParamsSchema,
  createClassBodySchema,
  updateClassBodySchema,
  addStudentBodySchema,
  assignTeacherBodySchema,
  assignTrailBodySchema,
  updateClassTrailBodySchema,
  listClassesResponseSchema,
  classResponseSchema,
  classDetailResponseSchema,
  listStudentsResponseSchema,
  classStudentResponseSchema,
  listTeachersResponseSchema,
  teacherClassesResponseSchema,
  classTeacherResponseSchema,
  listClassTrailsResponseSchema,
  classTrailResponseSchema,
  messageResponseSchema,
} from './classes.schema.js'

export async function classesRoutes(app: FastifyInstance) {
  const f = app.withTypeProvider<ZodTypeProvider>()
  // Leitura: gestor e professor. Escrita (CRUD, vínculos): apenas gestor.
  // O escopo do professor às suas turmas é aplicado na camada de service.
  const readGuard = [resolveTenant, authenticate, requireRole('manager', 'professor')]
  const guard = [resolveTenant, authenticate, requireRole('manager')]

  // ── Classes ───────────────────────────────────────────────────────────────

  f.get(
    '/:slug/classes',
    {
      schema: {
        params: slugParamsSchema,
        response: { 200: listClassesResponseSchema },
      },
      preHandler: readGuard,
    },
    async (req, reply) => {
      const result = await getClasses(req.resolvedTenantId, {
        role: req.user.role,
        userId: req.user.id,
      })
      return reply.status(200).send(result)
    },
  )

  f.post(
    '/:slug/classes',
    {
      schema: {
        params: slugParamsSchema,
        body: createClassBodySchema,
        response: { 201: classResponseSchema },
      },
      preHandler: guard,
    },
    async (req, reply) => {
      const result = await createNewClass(req.resolvedTenantId, req.body)
      return reply.status(201).send({ data: result })
    },
  )

  f.get(
    '/:slug/classes/:classId',
    {
      schema: {
        params: classParamsSchema,
        response: { 200: classDetailResponseSchema },
      },
      preHandler: readGuard,
    },
    async (req, reply) => {
      const result = await getClassDetail(req.params.classId, req.resolvedTenantId, {
        role: req.user.role,
        userId: req.user.id,
      })
      return reply.status(200).send({ data: result })
    },
  )

  f.patch(
    '/:slug/classes/:classId',
    {
      schema: {
        params: classParamsSchema,
        body: updateClassBodySchema,
        response: { 200: classResponseSchema },
      },
      preHandler: guard,
    },
    async (req, reply) => {
      const result = await updateExistingClass(
        req.params.classId,
        req.resolvedTenantId,
        req.body,
      )
      return reply.status(200).send({ data: result })
    },
  )

  f.delete(
    '/:slug/classes/:classId',
    {
      schema: {
        params: classParamsSchema,
        response: { 200: messageResponseSchema },
      },
      preHandler: guard,
    },
    async (req, reply) => {
      await removeClass(req.params.classId, req.resolvedTenantId)
      return reply.status(200).send({ data: { message: 'Turma removida' } })
    },
  )

  // ── Students ──────────────────────────────────────────────────────────────

  f.get(
    '/:slug/classes/:classId/students',
    {
      schema: {
        params: classParamsSchema,
        response: { 200: listStudentsResponseSchema },
      },
      preHandler: readGuard,
    },
    async (req, reply) => {
      const result = await getClassStudents(req.params.classId, req.resolvedTenantId, {
        role: req.user.role,
        userId: req.user.id,
      })
      return reply.status(200).send(result)
    },
  )

  f.post(
    '/:slug/classes/:classId/students',
    {
      schema: {
        params: classParamsSchema,
        body: addStudentBodySchema,
        response: { 201: classStudentResponseSchema },
      },
      preHandler: guard,
    },
    async (req, reply) => {
      const result = await addStudent(req.params.classId, req.resolvedTenantId, req.body)
      return reply.status(201).send({ data: result })
    },
  )

  f.delete(
    '/:slug/classes/:classId/students/:studentId',
    {
      schema: {
        params: studentParamsSchema,
        response: { 200: messageResponseSchema },
      },
      preHandler: guard,
    },
    async (req, reply) => {
      await removeStudent(req.params.classId, req.params.studentId, req.resolvedTenantId)
      return reply.status(200).send({ data: { message: 'Aluno removido da turma' } })
    },
  )

  // ── Teachers (vínculo professor↔turma) ──────────────────────────────────────

  f.get(
    '/:slug/classes/:classId/teachers',
    {
      schema: {
        params: classParamsSchema,
        response: { 200: listTeachersResponseSchema },
      },
      preHandler: readGuard,
    },
    async (req, reply) => {
      const result = await getClassTeachers(req.params.classId, req.resolvedTenantId, {
        role: req.user.role,
        userId: req.user.id,
      })
      return reply.status(200).send(result)
    },
  )

  f.post(
    '/:slug/classes/:classId/teachers',
    {
      schema: {
        params: classParamsSchema,
        body: assignTeacherBodySchema,
        response: { 201: classTeacherResponseSchema },
      },
      preHandler: guard,
    },
    async (req, reply) => {
      const result = await assignTeacher(req.params.classId, req.resolvedTenantId, req.body)
      return reply.status(201).send({ data: result })
    },
  )

  f.delete(
    '/:slug/classes/:classId/teachers/:teacherId',
    {
      schema: {
        params: teacherParamsSchema,
        response: { 200: messageResponseSchema },
      },
      preHandler: guard,
    },
    async (req, reply) => {
      await removeTeacher(req.params.classId, req.params.teacherId, req.resolvedTenantId)
      return reply.status(200).send({ data: { message: 'Professor desvinculado da turma' } })
    },
  )

  // Turmas atribuídas a um professor (para a tela de professores do gestor)
  f.get(
    '/:slug/teachers/:teacherId/classes',
    {
      schema: {
        params: teacherClassesParamsSchema,
        response: { 200: teacherClassesResponseSchema },
      },
      preHandler: guard,
    },
    async (req, reply) => {
      const result = await getTeacherClasses(req.params.teacherId, req.resolvedTenantId)
      return reply.status(200).send(result)
    },
  )

  // ── Trails ────────────────────────────────────────────────────────────────

  f.get(
    '/:slug/classes/:classId/trails',
    {
      schema: {
        params: classParamsSchema,
        response: { 200: listClassTrailsResponseSchema },
      },
      preHandler: readGuard,
    },
    async (req, reply) => {
      const result = await getClassTrails(req.params.classId, req.resolvedTenantId, {
        role: req.user.role,
        userId: req.user.id,
      })
      return reply.status(200).send(result)
    },
  )

  f.post(
    '/:slug/classes/:classId/trails',
    {
      schema: {
        params: classParamsSchema,
        body: assignTrailBodySchema,
        response: { 201: classTrailResponseSchema },
      },
      preHandler: guard,
    },
    async (req, reply) => {
      const result = await assignTrail(req.params.classId, req.resolvedTenantId, req.body)
      return reply.status(201).send({ data: result })
    },
  )

  f.patch(
    '/:slug/classes/:classId/trails/:trailId',
    {
      schema: {
        params: classTrailParamsSchema,
        body: updateClassTrailBodySchema,
        response: { 200: classTrailResponseSchema },
      },
      preHandler: guard,
    },
    async (req, reply) => {
      const result = await updateExistingClassTrail(
        req.params.classId,
        req.params.trailId,
        req.resolvedTenantId,
        req.body,
      )
      return reply.status(200).send({ data: result })
    },
  )

  f.delete(
    '/:slug/classes/:classId/trails/:trailId',
    {
      schema: {
        params: classTrailParamsSchema,
        response: { 200: messageResponseSchema },
      },
      preHandler: guard,
    },
    async (req, reply) => {
      await removeClassTrail(req.params.classId, req.params.trailId, req.resolvedTenantId)
      return reply.status(200).send({ data: { message: 'Trilha removida da turma' } })
    },
  )
}
