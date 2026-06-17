import { z } from 'zod'

// ─── Params ───────────────────────────────────────────────────────────────────

export const studentProfileParamsSchema = z.object({
  slug: z.string(),
  studentId: z.string().uuid('ID de aluno inválido'),
})

// ─── Response ─────────────────────────────────────────────────────────────────

const earnedBadgeSchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  name: z.string(),
  earnedAt: z.string(),
})

export const studentProfileResponseSchema = z.object({
  data: z.object({
    id: z.string().uuid(),
    name: z.string(),
    avatarUrl: z.string().nullable(),
    age: z.number().nullable(),
    className: z.string().nullable(),
    // Ranking/gamificação — visível para gestor e para aluno
    totalXp: z.number(),
    level: z.number(),
    currentStreak: z.number(),
    longestStreak: z.number(),
    badges: z.array(earnedBadgeSchema),
    // Dados pessoais completos — exclusivos do gestor; null quando quem vê é outro aluno
    email: z.string().email().nullable(),
    birthDate: z.string().nullable(),
    createdAt: z.string().nullable(),
  }),
})

// ─── Inferred types ───────────────────────────────────────────────────────────

export type StudentProfileParams = z.infer<typeof studentProfileParamsSchema>
