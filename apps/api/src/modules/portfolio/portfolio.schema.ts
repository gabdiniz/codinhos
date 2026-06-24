import { z } from 'zod'

export const slugParamsSchema = z.object({ slug: z.string() })

export const certificateParamsSchema = z.object({
  slug: z.string(),
  trailId: z.string().uuid('ID de trilha inválido'),
})

export const portfolioResponseSchema = z.object({
  data: z.object({
    stats: z.object({
      totalXp: z.number(),
      level: z.number(),
      currentStreak: z.number(),
    }),
    completedTrails: z.array(
      z.object({
        id: z.string().uuid(),
        title: z.string(),
        completedAt: z.string().nullable(),
      }),
    ),
    inProgressTrails: z.array(
      z.object({
        id: z.string().uuid(),
        title: z.string(),
        progress: z.object({ completed: z.number(), total: z.number() }),
      }),
    ),
    badges: z.array(z.object({ slug: z.string(), name: z.string(), earnedAt: z.string() })),
  }),
})
