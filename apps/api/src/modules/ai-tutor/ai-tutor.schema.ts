import { z } from 'zod'

// ─── Params ───────────────────────────────────────────────────────────────────

export const slugChallengeParamsSchema = z.object({
  slug: z.string(),
  challengeId: z.string().uuid(),
})

// ─── Body ─────────────────────────────────────────────────────────────────────

export const sendMessageBodySchema = z.object({
  /** Mensagem do aluno */
  message: z.string().min(1).max(2000),
  /** Código atual do aluno no editor (enviado a cada mensagem para o system prompt) */
  currentCode: z.string().max(10000).optional(),
})

export type SendMessageBody = z.infer<typeof sendMessageBodySchema>

// ─── Response schemas ─────────────────────────────────────────────────────────

const messageSchema = z.object({
  id: z.string(),
  role: z.enum(['user', 'assistant']),
  content: z.string(),
  createdAt: z.string(),
})

export const conversationResponseSchema = z.object({
  data: z.object({
    conversationId: z.string(),
    messages: z.array(messageSchema),
    messagesUsedToday: z.number(),
    dailyLimit: z.number().nullable(),
  }),
})

export const sendMessageResponseSchema = z.object({
  data: z.object({
    message: messageSchema,
    messagesUsedToday: z.number(),
    dailyLimit: z.number().nullable(),
  }),
})
