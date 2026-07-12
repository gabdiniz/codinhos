import { z } from 'zod'

// ─── Params ───────────────────────────────────────────────────────────────────

export const trailParamsSchema = z.object({
  trailId: z.string().uuid('ID de trilha inválido'),
})

export const moduleParamsSchema = z.object({
  moduleId: z.string().uuid('ID de módulo inválido'),
})

export const challengeParamsSchema = z.object({
  challengeId: z.string().uuid('ID de desafio inválido'),
})

// ─── Query ────────────────────────────────────────────────────────────────────

export const listTrailsQuerySchema = z.object({
  language: z.enum(['javascript', 'python']).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

// ─── Trail bodies ─────────────────────────────────────────────────────────────

export const createTrailBodySchema = z.object({
  slug: z
    .string()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'Slug deve conter apenas letras minúsculas, números e hífens'),
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  language: z.enum(['javascript', 'python']),
  order: z.number().int().nonnegative().optional(),
})

export const updateTrailBodySchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().nullable().optional(),
  order: z.number().int().nonnegative().optional(),
})

// ─── Module bodies ────────────────────────────────────────────────────────────

export const createModuleBodySchema = z.object({
  title: z.string().min(1).max(255),
  concept: z.string().optional(),
  exampleCode: z.string().optional(),
  vocabulary: z.array(z.string().min(1).max(100)).optional(),
  order: z.number().int().nonnegative().optional(),
})

export const updateModuleBodySchema = z.object({
  title: z.string().min(1).max(255).optional(),
  concept: z.string().nullable().optional(),
  exampleCode: z.string().nullable().optional(),
  vocabulary: z.array(z.string().min(1).max(100)).nullable().optional(),
  order: z.number().int().nonnegative().optional(),
})

// ─── Challenge bodies ─────────────────────────────────────────────────────────

const testCaseSchema = z.object({
  input: z.unknown(),
  expected: z.unknown(),
  description: z.string(),
  matcher: z.enum(['equal', 'approx', 'contains', 'regex']).optional(),
  tolerance: z.number().optional(),
  mode: z.enum(['stdout', 'ast', 'instance-call']).optional(),
  astRule: z
    .object({
      kind: z.enum([
        'requireRecursion',
        'forbidLoops',
        'requireMethod',
        'forbidMethod',
        'requireCall',
        'forbidCall',
      ]),
      name: z.string().max(50).optional(),
    })
    .optional(),
})

export const createChallengeBodySchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  starterCode: z.string().optional(),
  testCases: z.array(testCaseSchema).optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  order: z.number().int().nonnegative().optional(),
  baseXp: z.number().int().positive().optional(),
  validationModeOverride: z.enum(['auto', 'auto_review', 'manual']).nullable().optional(),
  targetFn: z.string().nullable().optional(),
  renderMode: z.enum(['js', 'p5']).nullable().optional(),
})

export const updateChallengeBodySchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().nullable().optional(),
  starterCode: z.string().nullable().optional(),
  testCases: z.array(testCaseSchema).nullable().optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  order: z.number().int().nonnegative().optional(),
  baseXp: z.number().int().positive().optional(),
  validationModeOverride: z.enum(['auto', 'auto_review', 'manual']).nullable().optional(),
  targetFn: z.string().nullable().optional(),
  renderMode: z.enum(['js', 'p5']).nullable().optional(),
})

// ─── Response schemas ─────────────────────────────────────────────────────────

const trailSchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  language: z.enum(['javascript', 'python']),
  order: z.number(),
})

const challengeSummarySchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable(),
  starterCode: z.string().nullable(),
  testCases: z.any(),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  order: z.number(),
  baseXp: z.number(),
  targetFn: z.string().nullable(),
  renderMode: z.enum(['js', 'p5']).nullable(),
})

const moduleWithChallengesSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  order: z.number(),
  challenges: z.array(challengeSummarySchema),
})

const moduleSchema = z.object({
  id: z.string().uuid(),
  trailId: z.string().uuid(),
  title: z.string(),
  concept: z.string().nullable(),
  exampleCode: z.string().nullable(),
  vocabulary: z.array(z.string()).nullable(),
  order: z.number(),
})

const challengeSchema = z.object({
  id: z.string().uuid(),
  moduleId: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable(),
  starterCode: z.string().nullable(),
  testCases: z.any(),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  order: z.number(),
  baseXp: z.number(),
  validationModeOverride: z.enum(['auto', 'auto_review', 'manual']).nullable(),
  targetFn: z.string().nullable(),
  renderMode: z.enum(['js', 'p5']).nullable(),
})

export const listTrailsResponseSchema = z.object({
  data: z.array(trailSchema),
  meta: z.object({ total: z.number(), page: z.number(), limit: z.number() }),
})

export const trailResponseSchema = z.object({
  data: z.object({ trail: trailSchema }),
})

export const trailDetailResponseSchema = z.object({
  data: z.object({
    trail: trailSchema,
    modules: z.array(moduleWithChallengesSchema),
  }),
})

export const moduleResponseSchema = z.object({
  data: z.object({ module: moduleSchema }),
})

export const challengeResponseSchema = z.object({
  data: z.object({ challenge: challengeSchema }),
})

export const messageResponseSchema = z.object({
  data: z.object({ message: z.string() }),
})

// ─── Inferred types ───────────────────────────────────────────────────────────

export type ListTrailsQuery = z.infer<typeof listTrailsQuerySchema>
export type CreateTrailBody = z.infer<typeof createTrailBodySchema>
export type UpdateTrailBody = z.infer<typeof updateTrailBodySchema>
export type CreateModuleBody = z.infer<typeof createModuleBodySchema>
export type UpdateModuleBody = z.infer<typeof updateModuleBodySchema>
export type CreateChallengeBody = z.infer<typeof createChallengeBodySchema>
export type UpdateChallengeBody = z.infer<typeof updateChallengeBodySchema>
