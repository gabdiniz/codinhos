import { z } from 'zod'

// ─── Params ───────────────────────────────────────────────────────────────────

export const slugParamsSchema = z.object({
  slug: z.string(),
})

// ─── Body — PATCH /:slug/settings ─────────────────────────────────────────────

const gamificationSettingsSchema = z.object({
  xpPerLevel: z.number().int().positive().optional(),
  firstAttemptBonusMultiplier: z.number().positive().optional(),
  streakBonusXp: z.number().int().nonnegative().optional(),
  streakBonusMaxXp: z.number().int().nonnegative().optional(),
  streakMilestoneDays: z.array(z.number().int().positive()).optional(),
})

export const updateSettingsBodySchema = z.object({
  theme: z.record(z.string()).optional(),
  gamification: gamificationSettingsSchema.optional(),
  aiErrorExplanationEnabled: z.boolean().optional(),
  allowStudentProfileView: z.boolean().optional(),
})

// ─── Response ─────────────────────────────────────────────────────────────────

const gamificationResponseSchema = z.object({
  xpPerLevel: z.number(),
  firstAttemptBonusMultiplier: z.number(),
  streakBonusXp: z.number(),
  streakBonusMaxXp: z.number(),
  streakMilestoneDays: z.array(z.number()),
})

export const settingsResponseSchema = z.object({
  data: z.object({
    settings: z.object({
      name: z.string(),
      plan: z.string(),
      theme: z.record(z.string()).nullable(),
      gamification: gamificationResponseSchema.nullable(),
      aiMessagesPerDay: z.number().nullable(),
      maxStudents: z.number().nullable(),
      aiErrorExplanationEnabled: z.boolean(),
      allowStudentProfileView: z.boolean(),
    }),
  }),
})

// ─── Response — GET /:slug/theme (público) ────────────────────────────────────

export const themeResponseSchema = z.object({
  data: z.object({
    theme: z.record(z.string()).nullable(),
  }),
})

// ─── Inferred types ────────────────────────────────────────────────────�