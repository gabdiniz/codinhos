import { z } from 'zod'

// ─── Params ───────────────────────────────────────────────────────────────────

export const rankingParamsSchema = z.object({
  slug: z.string(),
  classId: z.string().uuid(),
})

export const slugParamsSchema = z.object({
  slug: z.string(),
})

// ─── Query ────────────────────────────────────────────────────────────────────

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

// ─── Response — /me ───────────────────────────────────────────────────────────

const earnedBadgeSchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  name: z.string(),
  earnedAt: z.string(),
})

export const myStatsResponseSchema = z.object({
  data: z.object({
    totalXp: z.number(),
    level: z.number(),
    currentStreak: z.number(),
    longestStreak: z.number(),
    badges: z.array(earnedBadgeSchema),
  }),
})

// ─── Response — /ranking/:classId ─────────────────────────────────────────────

const rankingEntrySchema = z.object({
  position: z.number(),
  student: z.object({
    id: z.string().uuid(),
    name: z.string(),
    avatarUrl: z.string().nullable(),
  }),
  totalXp: z.number(),
  level: z.number(),
})

export const rankingResponseSchema = z.object({
  data: z.object({
    ranking: z.array(rankingEntrySchema),
    myPosition: z.number().nullable(),
  }),
})

// ─── Response — /badges ───────────────────────────────────────────────────────

const badgeCatalogEntrySchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  name: z.string(),
  description: z.string(),
  iconUrl: z.string().nullable(),
  triggerType: z.string(),
  triggerValue: z.number().nullable(),
  earned: z.boolean(),
  earnedAt: z.string().nullable(),
})

export const badgesResponseSchema = z.object({
  data: z.array(badgeCatalogEntrySchema),
})

// ─── Response — /xp-events ────────────────────────────────────────────────────

const xpEventSchema = z.object({
  id: z.string().uuid(),
  amount: z.number(),
  reason: z.string(),
  refId: z.string().uuid().nullable(),
  createdAt: z.string(),
})

export const xpEventsResponseSchema = z.object({
  data: z.array(xpEventSchema),
  meta: z.object({
    total: z.number(),
    page: z.number(),
    limit: z.number(),
  }),
})
