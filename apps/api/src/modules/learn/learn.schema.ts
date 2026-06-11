import { z } from 'zod'

// ─── Params ───────────────────────────────────────────────────────────────────

export const slugParamsSchema = z.object({
  slug: z.string(),
})

export const trailParamsSchema = z.object({
  slug: z.string(),
  trailId: z.string().uuid('ID de trilha inválido'),
})

export const moduleParamsSchema = z.object({
  slug: z.string(),
  moduleId: z.string().uuid('ID de módulo inválido'),
})

export const challengeParamsSchema = z.object({
  slug: z.string(),
  challengeId: z.string().uuid('ID de desafio inválido'),
})

// ─── Query ────────────────────────────────────────────────────────────────────

export const classIdQuerySchema = z.object({
  classId: z.string().uuid('classId inválido').optional(),
})

// ─── Response schemas ─────────────────────────────────────────────────────────

const trailStatusSchema = z.enum(['not_started', 'in_progress', 'completed'])
const moduleStatusSchema = z.enum(['locked', 'available', 'completed'])
const difficultySchema = z.enum(['easy', 'medium', 'hard'])
const submissionStatusSchema = z.enum(['pending', 'passed', 'failed', 'under_review'])

export const dashboardResponseSchema = z.object({
  data: z.object({
    class: z.object({
      id: z.string().uuid(),
      name: z.string(),
    }),
    trails: z.array(
      z.object({
        id: z.string().uuid(),
        title: z.string(),
        progress: z.object({ completed: z.number(), total: z.number() }),
        status: trailStatusSchema,
      }),
    ),
    stats: z.object({
      xp: z.number(),
      level: z.number(),
      streak: z.number(),
    }),
  }),
})

export const trailDetailResponseSchema = z.object({
  data: z.object({
    trail: z.object({
      id: z.string().uuid(),
      title: z.string(),
      description: z.string().nullable(),
    }),
    visualBlocksEnabled: z.boolean(),
    modules: z.array(
      z.object({
        id: z.string().uuid(),
        title: z.string(),
        order: z.number(),
        status: moduleStatusSchema,
        challenge: z
          .object({
            id: z.string().uuid(),
            title: z.string(),
            difficulty: difficultySchema,
          })
          .nullable(),
      }),
    ),
  }),
})

export const moduleDetailResponseSchema = z.object({
  data: z.object({
    module: z.object({
      id: z.string().uuid(),
      title: z.string(),
      concept: z.string().nullable(),
      exampleCode: z.string().nullable(),
    }),
    challenge: z
      .object({
        id: z.string().uuid(),
        title: z.string(),
        description: z.string().nullable(),
        starterCode: z.string().nullable(),
        testCases: z
          .array(
            z.object({
              input: z.unknown(),
              expected: z.unknown(),
              description: z.string(),
            }),
          )
          .nullable(),
        difficulty: difficultySchema,
        baseXp: z.number(),
      })
      .nullable(),
    progress: z.object({
      status: moduleStatusSchema,
      attempts: z.number(),
    }),
    visualBlocksEnabled: z.boolean(),
  }),
})

export const challengeDetailResponseSchema = z.object({
  data: z.object({
    challenge: z.object({
      id: z.string().uuid(),
      title: z.string(),
      description: z.string().nullable(),
      starterCode: z.string().nullable(),
      difficulty: difficultySchema,
      baseXp: z.number(),
    }),
    visualBlocksEnabled: z.boolean(),
    myLastSubmission: z
      .object({
        id: z.string().uuid(),
        code: z.string(),
        status: submissionStatusSchema,
        testResults: z.unknown().nullable(),
      })
      .nullable(),
  }),
})

// ─── Inferred types ───────────────────────────────────────────────────────────

export type ClassIdQuery = z.infer<typeof classIdQuerySchema>
