import { z } from 'zod'

// ─── Params ───────────────────────────────────────────────────────────────────

export const slugParamsSchema = z.object({
  slug: z.string(),
})

export const trailParamsSchema = z.object({
  slug: z.string(),
  trailId: z.string().uuid('ID de trilha inválido'),
})

// ─── Bodies ───────────────────────────────────────────────────────────────────

export const activateTrailBodySchema = z.object({
  trailId: z.string().uuid('ID de trilha inválido'),
  order: z.number().int().nonnegative().optional(),
})

export const reorderTrailBodySchema = z.object({
  order: z.number().int().nonnegative(),
})

// ─── Response schemas ─────────────────────────────────────────────────────────

const trailSummarySchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  language: z.enum(['javascript', 'python']),
  order: z.number(),
})

const tenantTrailSchema = z.object({
  id: z.string().uuid(),
  trailId: z.string().uuid(),
  order: z.number(),
  trail: z.object({
    id: z.string().uuid(),
    slug: z.string(),
    title: z.string(),
    description: z.string().nullable(),
    language: z.enum(['javascript', 'python']),
  }),
})

export const listTenantTrailsResponseSchema = z.object({
  data: z.array(trailSummarySchema),
})

export const tenantTrailResponseSchema = z.object({
  data: z.object({ tenantTrail: tenantTrailSchema }),
})

export const messageResponseSchema = z.object({
  data: z.object({ message: z.string() }),
})

// ─── Inferred types ───────────────────────────────────────────────────────────

export type ActivateTrailBody = z.infer<typeof activateTrailBodySchema>
export type ReorderTrailBody = z.infer<typeof reorderTrailBodySchema>
