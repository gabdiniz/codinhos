import { z } from 'zod'

// ─── Params ───────────────────────────────────────────────────────────────────

export const classParamsSchema = z.object({
  slug: z.string(),
  classId: z.string().uuid(),
})

export const leaderboardParamsSchema = z.object({
  slug: z.string(),
  classId: z.string().uuid(),
  weeklyId: z.string().uuid(),
})

// ─── Body ─────────────────────────────────────────────────────────────────────

export const createWeeklyChallengeBodySchema = z.object({
  challengeId: z.string().uuid(),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
})

// ─── Response — GET /:classId (desafio ativo) ─────────────────────────────────

const activeChallengeSchema = z.object({
  id: z.string().uuid(),
  challenge: z.object({
    id: z.string().uuid(),
    title: z.string(),
    description: z.string().nullable(),
    difficulty: z.string(),
  }),
  startsAt: z.string(),
  endsAt: z.string(),
  mySubmission: z
    .object({
      status: z.string(),
      attemptNumber: z.number(),
    })
    .nullable(),
})

export const activeWeeklyChallengeResponseSchema = z.object({
  data: z.object({
    weeklyChallenge: activeChallengeSchema.nullable(),
  }),
})

// ─── Response — POST /:classId ────────────────────────────────────────────────

export const createWeeklyChallengeResponseSchema = z.object({
  data: z.object({
    weeklyChallenge: z.object({
      id: z.string().uuid(),
      challengeId: z.string().uuid(),
      classId: z.string().uuid(),
      startsAt: z.string(),
      endsAt: z.string(),
      createdAt: z.string(),
    }),
  }),
})

// ─── Response — GET /:classId/history ────────────────────────────────────────

const historyEntrySchema = z.object({
  id: z.string().uuid(),
  challenge: z.object({
    id: z.string().uuid(),
    title: z.string(),
  }),
  startsAt: z.string(),
  endsAt: z.string(),
  topStudents: z.array(
    z.object({
      name: z.string(),
      xp: z.number(),
    }),
  ),
})

export const historyResponseSchema = z.object({
  data: z.object({
    history: z.array(historyEntrySchema),
  }),
})

// ─── Response — GET /:classId/:weeklyId/leaderboard ──────────────────────────

const leaderboardEntrySchema = z.object({
  position: z.number(),
  student: z.object({
    id: z.string().uuid(),
    name: z.string(),
    avatarUrl: z.string().nullable(),
  }),
  submittedAt: z.string().nullable(),
  status: z.string().nullable(),
})

export const leaderboardResponseSchema = z.object({
  data: z.object({
    leaderboard: z.array(leaderboardEntrySchema),
    myPosition: z.number().nullable(),
  }),
})
