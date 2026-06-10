import { z } from 'zod'

// ─── Params / Query ───────────────────────────────────────────────────────────

export const tenantIdParamsSchema = z.object({
  tenantId: z.string().uuid('ID de tenant inválido'),
})

export const listTenantsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  isActive: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true')),
})

// ─── Request bodies ───────────────────────────────────────────────────────────

export const createTenantBodySchema = z.object({
  slug: z
    .string()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'Slug deve conter apenas letras minúsculas, números e hífens'),
  name: z.string().min(1).max(255),
  plan: z.string().max(50).optional(),
  settings: z.record(z.unknown()).optional(),
  managerName: z.string().min(1).max(255),
  managerEmail: z.string().email('E-mail do gestor inválido'),
})

export const updateTenantBodySchema = z.object({
  name: z.string().min(1).max(255).optional(),
  plan: z.string().max(50).optional(),
  settings: z.record(z.unknown()).optional(),
  theme: z.record(z.string()).optional(),
})

// ─── Response schemas ─────────────────────────────────────────────────────────

const tenantRowSchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  name: z.string(),
  plan: z.string(),
  isActive: z.boolean(),
  createdAt: z.union([z.string(), z.date()]),
})

const tenantDetailSchema = tenantRowSchema.extend({
  settings: z.any(),
  theme: z.any(),
})

export const listTenantsResponseSchema = z.object({
  data: z.array(tenantRowSchema),
  meta: z.object({
    total: z.number(),
    page: z.number(),
    limit: z.number(),
  }),
})

export const tenantResponseSchema = z.object({
  data: z.object({ tenant: tenantDetailSchema }),
})

export const createTenantResponseSchema = z.object({
  data: z.object({
    tenant: tenantDetailSchema,
    manager: z.object({ id: z.string().uuid(), email: z.string().email() }),
    inviteSent: z.boolean(),
  }),
})

export const messageResponseSchema = z.object({
  data: z.object({ message: z.string() }),
})

// ─── Inferred types ───────────────────────────────────────────────────────────

export type ListTenantsQuery = z.infer<typeof listTenantsQuerySchema>
export type CreateTenantBody = z.infer<typeof createTenantBodySchema>
export type UpdateTenantBody = z.infer<typeof updateTenantBodySchema>
