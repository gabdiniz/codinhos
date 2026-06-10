import { z } from 'zod'

// ─── Params ───────────────────────────────────────────────────────────────────

export const slugParamsSchema = z.object({
  slug: z.string(),
})

export const notificationParamsSchema = z.object({
  slug: z.string(),
  notificationId: z.string().uuid(),
})

// ─── Query ────────────────────────────────────────────────────────────────────

export const listNotificationsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  read: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
})

// ─── Response — GET / ────────────────────────────────────────────────────────

const notificationSchema = z.object({
  id: z.string().uuid(),
  type: z.string(),
  title: z.string(),
  body: z.string().nullable(),
  readAt: z.string().nullable(),
  createdAt: z.string(),
})

export const listNotificationsResponseSchema = z.object({
  data: z.array(notificationSchema),
  meta: z.object({
    total: z.number(),
    page: z.number(),
    limit: z.number(),
  }),
})

// ─── Response — GET /unread-count ────────────────────────────────────────────

export const unreadCountResponseSchema = z.object({
  data: z.object({
    count: z.number(),
  }),
})

// ─── Response — PATCH /:notificationId/read ──────────────────────────────────

export const markReadResponseSchema = z.object({
  data: z.object({
    notification: z.object({
      id: z.string().uuid(),
      readAt: z.string(),
    }),
  }),
})

// ─── Response — PATCH /read-all ──────────────────────────────────────────────

export const readAllResponseSchema = z.object({
  data: z.object({
    updated: z.number(),
  }),
})
