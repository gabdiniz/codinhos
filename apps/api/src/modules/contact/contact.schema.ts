import { z } from 'zod'

export const contactBodySchema = z.object({
  name: z.string().min(2).max(120),
  school: z.string().min(2).max(160),
  email: z.string().email().max(200),
  message: z.string().min(5).max(2000),
})

export type ContactBody = z.infer<typeof contactBodySchema>

export const contactResponseSchema = z.object({
  data: z.object({ ok: z.literal(true) }),
})
