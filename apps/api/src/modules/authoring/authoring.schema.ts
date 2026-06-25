import { z } from 'zod'

export const slugParamsSchema = z.object({ slug: z.string() })
export const trailParamsSchema = z.object({ slug: z.string(), trailId: z.string().uuid() })
export const moduleParamsSchema = z.object({ slug: z.string(), moduleId: z.string().uuid() })
export const challengeParamsSchema = z.object({ slug: z.string(), challengeId: z.string().uuid() })

// ─── Bodies ───────────────────────────────────────────────────────────────────

export const createTrailBodySchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  language: z.enum(['javascript', 'python']).default('javascript'),
})

export const updateTrailBodySchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(2000).nullable().optional(),
})

export const createModuleBodySchema = z.object({
  title: z.string().min(1).max(255),
  concept: z.string().optional(),
  exampleCode: z.string().optional(),
  vocabulary: z.array(z.string().min(1).max(100)).optional(),
})

export const updateModuleBodySchema = z.object({
  title: z.string().min(1).max(255).optional(),
  concept: z.string().nullable().optional(),
  exampleCode: z.string().nullable().optional(),
  vocabulary: z.array(z.string().min(1).max(100)).nullable().optional(),
})

const testCaseSchema = z.object({
  input: z.unknown(),
  expected: z.unknown(),
  description: z.string(),
})

export const createChallengeBodySchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  starterCode: z.string().optional(),
  testCases: z.array(testCaseSchema).optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('easy'),
  baseXp: z.number().int().positive().optional(),
})

export const updateChallengeBodySchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().nullable().optional(),
  starterCode: z.string().nullable().optional(),
  testCases: z.array(testCaseSchema).nullable().optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  baseXp: z.number().int().positive().optional(),
})

// ─── Responses ────────────────────────────────────────────────────────────────

const trailSchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  language: z.enum(['javascript', 'python']),
  order: z.number(),
})

const challengeSchema = z.object({
  id: z.string().uuid(),
  moduleId: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable(),
  starterCode: z.string().nullable(),
  testCases: z.array(testCaseSchema).nullable(),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  baseXp: z.number(),
  order: z.number(),
})

const moduleSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  concept: z.string().nullable(),
  exampleCode: z.string().nullable(),
  vocabulary: z.array(z.string()),
  order: z.number(),
  challenges: z.array(challengeSchema),
})

export const listTrailsResponseSchema = z.object({ data: z.array(trailSchema) })
export const trailResponseSchema = z.object({ data: z.object({ trail: trailSchema }) })
export const trailDetailResponseSchema = z.object({
  data: z.object({ trail: trailSchema, modules: z.array(moduleSchema) }),
})
export const moduleResponseSchema = z.object({
  data: z.object({ module: moduleSchema.omit({ challenges: true }) }),
})
export const challengeResponseSchema = z.object({ data: z.object({ challenge: challengeSchema }) })
export const messageResponseSchema = z.object({ data: z.object({ message: z.string() }) })

export type CreateTrailBody = z.infer<typeof createTrailBodySchema>
export type UpdateTrailBody = z.infer<typeof updateTrailBodySchema>
export type CreateModuleBody = z.infer<typeof createModuleBodySchema>
export type UpdateModuleBody = z.infer<typeof updateModuleBodySchema>
export type CreateChallengeBody = z.infer<typeof createChallengeBodySchema>
export type UpdateChallengeBody = z.infer<typeof updateChallengeBodySchema>
