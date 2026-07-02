import { z } from 'zod'

// ─── Body ─────────────────────────────────────────────────────────────────────

const turnSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1).max(2000),
})

export const codiAskBodySchema = z.object({
  /** Pergunta do visitante */
  message: z.string().min(1).max(1000),
  /** Histórico recente da conversa (turnos anteriores), para dar contexto */
  history: z.array(turnSchema).max(8).optional(),
})

export type CodiAskBody = z.infer<typeof codiAskBodySchema>

// ─── Response ───────────────────────────────────────────────────────────────

export const codiAskResponseSchema = z.object({
  data: z.object({
    answer: z.string(),
  }),
})
