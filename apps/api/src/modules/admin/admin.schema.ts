import { z } from 'zod'

// ─── Params ───────────────────────────────────────────────────────────────────

export const badgeIdParamsSchema = z.object({
  badgeId: z.string().uuid(),
})

// ─── Badges — request bodies ──────────────────────────────────────────────────

export const createBadgeBodySchema = z.object({
  slug: z
    .string()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'Slug deve conter apenas letras minúsculas, números e hífens'),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  iconUrl: z.string().url().optional(),
  triggerType: z.string().min(1).max(100),
  triggerValue: z.number().int().nonnegative(),
})

export const updateBadgeBodySchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  iconUrl: z.string().url().optional(),
  triggerType: z.string().min(1).max(100).optional(),
  triggerValue: z.number().int().nonnegative().optional(),
})

// ─── Users — query ────────────────────────────────────────────────────────────

export const listAdminUsersQuerySchema = z.object({
  tenantId: z.string().uuid().optional(),
  role: z.enum(['super_admin', 'manager', 'professor', 'student']).optional(),
  isActive: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true')),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

// ─── Response schemas ─────────────────────────────────────────────────────────

const badgeSchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  iconUrl: z.string().nullable(),
  triggerType: z.string(),
  triggerValue: z.number(),
  createdAt: z.union([z.string(), z.date()]),
})

export const listBadgesResponseSchema = z.object({
  data: z.array(badgeSchema),
})

export const badgeResponseSchema = z.object({
  data: z.object({ badge: badgeSchema }),
})

export const messageResponseSchema = z.object({
  data: z.object({ message: z.string() }),
})

const adminUserSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string(),
  role: z.string(),
  isActive: z.boolean(),
  tenantId: z.string().uuid(),
  createdAt: z.union([z.string(), z.date()]),
})

export const listAdminUsersResponseSchema = z.object({
  data: z.array(adminUserSchema),
  meta: z.object({
    total: z.number(),
    page: z.number(),
    limit: z.number(),
  }),
})

// ─── Inferred types ───────────────────────────────────────────────────────────

export type CreateBadgeBody = z.infer<typeof createBadgeBodySchema>
export type UpdateBadgeBody = z.infer<typeof updateBadgeBodySchema>
export type ListAdminUsersQuery = z.infer<typeof listAdminUsersQuerySchema>
