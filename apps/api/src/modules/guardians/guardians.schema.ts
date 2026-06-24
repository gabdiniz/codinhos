import { z } from 'zod'

// ─── Params ───────────────────────────────────────────────────────────────────

export const slugParamsSchema = z.object({ slug: z.string() })

export const guardianParamsSchema = z.object({
  slug: z.string(),
  guardianId: z.string().uuid('ID de responsável inválido'),
})

export const guardianStudentParamsSchema = z.object({
  slug: z.string(),
  guardianId: z.string().uuid('ID de responsável inválido'),
  studentId: z.string().uuid('ID de aluno inválido'),
})

export const childParamsSchema = z.object({
  slug: z.string(),
  studentId: z.string().uuid('ID de aluno inválido'),
})

// ─── Bodies ───────────────────────────────────────────────────────────────────

export const createGuardianBodySchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email('E-mail inválido'),
  studentIds: z.array(z.string().uuid()).optional(),
})

export const linkStudentBodySchema = z.object({
  studentId: z.string().uuid('ID de aluno inválido'),
})

// ─── Response schemas ─────────────────────────────────────────────────────────

const studentSummarySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
  avatarUrl: z.string().nullable(),
  isActive: z.boolean(),
})

const guardianSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
  isActive: z.boolean(),
  studentsCount: z.number(),
  createdAt: z.string().datetime(),
})

const guardianStudentSchema = z.object({
  id: z.string().uuid(),
  guardianId: z.string().uuid(),
  studentId: z.string().uuid(),
  createdAt: z.string().datetime(),
})

const childSummarySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  avatarUrl: z.string().nullable(),
  totalXp: z.number(),
  level: z.number(),
  currentStreak: z.number(),
  lastActivity: z.string().nullable(),
})

const childDetailSchema = z.object({
  student: z.object({
    id: z.string().uuid(),
    name: z.string(),
    avatarUrl: z.string().nullable(),
  }),
  stats: z.object({
    totalXp: z.number(),
    level: z.number(),
    currentStreak: z.number(),
  }),
  badges: z.array(z.object({ slug: z.string(), name: z.string(), earnedAt: z.string() })),
  trails: z.array(
    z.object({
      id: z.string().uuid(),
      title: z.string(),
      progress: z.object({ completed: z.number(), total: z.number() }),
      lastActivity: z.string().nullable(),
    }),
  ),
})

export const listGuardiansResponseSchema = z.object({
  data: z.array(guardianSchema),
  meta: z.object({ total: z.number() }),
})

export const guardianResponseSchema = z.object({
  data: z.object({ guardian: guardianSchema }),
})

export const listGuardianStudentsResponseSchema = z.object({
  data: z.array(studentSummarySchema),
  meta: z.object({ total: z.number() }),
})

export const guardianStudentResponseSchema = z.object({
  data: z.object({ guardianStudent: guardianStudentSchema }),
})

export const listChildrenResponseSchema = z.object({
  data: z.array(childSummarySchema),
})

export const childDetailResponseSchema = z.object({
  data: childDetailSchema,
})

export const messageResponseSchema = z.object({
  data: z.object({ message: z.string() }),
})

// ─── Inferred types ───────────────────────────────────────────────────────────

export type CreateGuardianBody = z.infer<typeof createGuardianBodySchema>
export type LinkStudentBody = z.infer<typeof linkStudentBodySchema>
