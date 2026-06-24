import { z } from 'zod'

// ─── Params ───────────────────────────────────────────────────────────────────

export const slugParamsSchema = z.object({
  slug: z.string(),
})

export const classParamsSchema = z.object({
  slug: z.string(),
  classId: z.string().uuid('ID de turma inválido'),
})

export const studentParamsSchema = z.object({
  slug: z.string(),
  classId: z.string().uuid('ID de turma inválido'),
  studentId: z.string().uuid('ID de aluno inválido'),
})

export const classTrailParamsSchema = z.object({
  slug: z.string(),
  classId: z.string().uuid('ID de turma inválido'),
  trailId: z.string().uuid('ID de trilha inválido'),
})

export const teacherParamsSchema = z.object({
  slug: z.string(),
  classId: z.string().uuid('ID de turma inválido'),
  teacherId: z.string().uuid('ID de professor inválido'),
})

// ─── Bodies ───────────────────────────────────────────────────────────────────

export const createClassBodySchema = z.object({
  name: z.string().min(1).max(255),
  progressionMode: z.enum(['free', 'sequential', 'controlled']).optional(),
  validationMode: z.enum(['auto', 'auto_review', 'manual']).optional(),
  showRanking: z.boolean().optional(),
})

export const updateClassBodySchema = z.object({
  name: z.string().min(1).max(255).optional(),
  progressionMode: z.enum(['free', 'sequential', 'controlled']).optional(),
  validationMode: z.enum(['auto', 'auto_review', 'manual']).optional(),
  showRanking: z.boolean().optional(),
})

export const addStudentBodySchema = z.object({
  studentId: z.string().uuid('ID de aluno inválido'),
})

export const assignTeacherBodySchema = z.object({
  teacherId: z.string().uuid('ID de professor inválido'),
})

export const assignTrailBodySchema = z.object({
  trailId: z.string().uuid('ID de trilha inválido'),
  order: z.number().int().nonnegative(),
  visualBlocksEnabled: z.boolean().optional(),
})

export const updateClassTrailBodySchema = z.object({
  order: z.number().int().nonnegative().optional(),
  visualBlocksEnabled: z.boolean().optional(),
})

// ─── Response schemas ─────────────────────────────────────────────────────────

const classSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  name: z.string(),
  progressionMode: z.enum(['free', 'sequential', 'controlled']),
  validationMode: z.enum(['auto', 'auto_review', 'manual']),
  showRanking: z.boolean(),
  createdAt: z.string().datetime(),
})

const classDetailSchema = z.object({
  class: z.object({
    id: z.string().uuid(),
    name: z.string(),
    progressionMode: z.enum(['free', 'sequential', 'controlled']),
    validationMode: z.enum(['auto', 'auto_review', 'manual']),
    showRanking: z.boolean(),
    createdAt: z.string().datetime(),
  }),
  studentsCount: z.number(),
  trailsCount: z.number(),
})

const studentSummarySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
  avatarUrl: z.string().nullable(),
  isActive: z.boolean(),
})

const classTrailSchema = z.object({
  id: z.string().uuid(),
  classId: z.string().uuid(),
  trailId: z.string().uuid(),
  order: z.number(),
  visualBlocksEnabled: z.boolean(),
})

const classTrailSummarySchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  title: z.string(),
  order: z.number(),
  visualBlocksEnabled: z.boolean(),
})

const classStudentSchema = z.object({
  id: z.string().uuid(),
  classId: z.string().uuid(),
  studentId: z.string().uuid(),
  joinedAt: z.string().datetime(),
})

const teacherSummarySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
  avatarUrl: z.string().nullable(),
  isActive: z.boolean(),
})

const classTeacherSchema = z.object({
  id: z.string().uuid(),
  classId: z.string().uuid(),
  teacherId: z.string().uuid(),
  assignedAt: z.string().datetime(),
})

export const listClassesResponseSchema = z.object({
  data: z.array(
    z.object({
      id: z.string().uuid(),
      name: z.string(),
      progressionMode: z.enum(['free', 'sequential', 'controlled']),
      validationMode: z.enum(['auto', 'auto_review', 'manual']),
      showRanking: z.boolean(),
      studentsCount: z.number(),
      createdAt: z.string().datetime(),
    }),
  ),
})

export const classResponseSchema = z.object({
  data: z.object({ class: classSchema }),
})

export const classDetailResponseSchema = z.object({
  data: classDetailSchema,
})

export const listStudentsResponseSchema = z.object({
  data: z.array(studentSummarySchema),
  meta: z.object({ total: z.number() }),
})

export const classStudentResponseSchema = z.object({
  data: z.object({ classStudent: classStudentSchema }),
})

export const listClassTrailsResponseSchema = z.object({
  data: z.array(classTrailSummarySchema),
})

export const classTrailResponseSchema = z.object({
  data: z.object({ classTrail: classTrailSchema }),
})

export const listTeachersResponseSchema = z.object({
  data: z.array(teacherSummarySchema),
  meta: z.object({ total: z.number() }),
})

export const classTeacherResponseSchema = z.object({
  data: z.object({ classTeacher: classTeacherSchema }),
})

export const messageResponseSchema = z.object({
  data: z.object({ message: z.string() }),
})

// ─── Inferred types ───────────────────────────────────────────────────────────

export type CreateClassBody = z.infer<typeof createClassBodySchema>
export type UpdateClassBody = z.infer<typeof updateClassBodySchema>
export type AddStudentBody = z.infer<typeof addStudentBodySchema>
export type AssignTeacherBody = z.infer<typeof assignTeacherBodySchema>
export type AssignTrailBody = z.infer<typeof assignTrailBodySchema>
export type UpdateClassTrailBody = z.infer<typeof updateClassTrailBodySchema>
