import { z } from 'zod'

// ─── Params ───────────────────────────────────────────────────────────────────

export const submissionsParamsSchema = z.object({
  slug: z.string(),
  challengeId: z.string().uuid('ID de desafio inválido'),
})

export const submissionDetailParamsSchema = z.object({
  slug: z.string(),
  challengeId: z.string().uuid('ID de desafio inválido'),
  submissionId: z.string().uuid('ID de submissão inválido'),
})

// ─── Query ────────────────────────────────────────────────────────────────────

export const listSubmissionsQuerySchema = z.object({
  classId: z.string().uuid('classId inválido'),
})

// ─── Body ─────────────────────────────────────────────────────────────────────

export const createSubmissionBodySchema = z.object({
  classId: z.string().uuid('classId inválido'),
  code: z.string().min(1, 'Código não pode ser vazio'),
})

export const reviewSubmissionBodySchema = z.object({
  status: z.enum(['passed', 'failed']),
  reviewerNote: z.string().optional(),
})

// ─── Shared fragments ─────────────────────────────────────────────────────────

const submissionStatusSchema = z.enum(['pending', 'passed', 'failed', 'under_review'])

const badgeItemSchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  name: z.string(),
  iconUrl: z.string().nullable(),
})

const testResultSchema = z.object({
  passed: z.boolean(),
  input: z.unknown(),
  expected: z.unknown(),
  actual: z.unknown(),
  description: z.string(),
})

const submissionBaseSchema = z.object({
  id: z.string().uuid(),
  attemptNumber: z.number(),
  code: z.string(),
  status: submissionStatusSchema,
  testResults: z.array(testResultSchema).nullable(),
  score: z.string().nullable(),
  reviewerNote: z.string().nullable(),
  submittedAt: z.string(),
  reviewedAt: z.string().nullable(),
})

const studentInfoSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
})

// ─── Response schemas ─────────────────────────────────────────────────────────

export const createSubmissionResponseSchema = z.object({
  data: z.object({
    submission: submissionBaseSchema,
    xpEarned: z.number(),
    newBadges: z.array(badgeItemSchema),
  }),
})

export const listSubmissionsResponseSchema = z.object({
  data: z.array(
    submissionBaseSchema.extend({
      student: studentInfoSchema.optional(),
    }),
  ),
})

export const submissionDetailResponseSchema = z.object({
  data: submissionBaseSchema.extend({
    student: studentInfoSchema.optional(),
  }),
})

export const reviewSubmissionResponseSchema = z.object({
  data: z.object({
    submission: submissionBaseSchema,
    xpEarned: z.number(),
    newBadges: z.array(badgeItemSchema),
  }),
})

// ─── Inferred types ───────────────────────────────────────────────────────────

export type CreateSubmissionBody = z.infer<typeof createSubmissionBodySchema>
export type ReviewSubmissionBody = z.infer<typeof reviewSubmissionBodySchema>
export type ListSubmissionsQuery = z.infer<typeof listSubmissionsQuerySchema>
