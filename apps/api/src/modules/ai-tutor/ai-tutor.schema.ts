import { z } from 'zod'

// ─── Params ───────────────────────────────────────────────────────────────────

export const slugChallengeParamsSchema = z.object({
  slug: z.string(),
  challengeId: z.string().uuid(),
})

// ─── Body ─────────────────────────────────────────────────────────────────────

/** Contexto de um teste que falhou — enviado quando o aluno pede ajuda sobre o erro */
const failedTestSchema = z.object({
  description: z.string().max(500),
  expected: z.string().max(500).optional(),
  actual: z.string().max(500).optional(),
  error: z.string().max(1000).optional(),
})

export const sendMessageBodySchema = z.object({
  /** Mensagem do aluno */
  message: z.string().min(1).max(2000),
  /** Código atual do aluno no editor (enviado a cada mensagem para o system prompt) */
  currentCode: z.string().max(10000).optional(),
  /** Contexto do teste que falhou — só é usado se o tenant tiver a feature habilitada */
  failedTest: failedTestSchema.optional(),
  /**
   * Intenção da mensagem. 'hint' aciona o modo de dica progressiva (dica do nível
   * pedido, sem entregar a solução). 'review' aciona o code review pós-acerto.
   * Ausente = conversa normal.
   */
  intent: z.enum(['chat', 'hint', 'review']).optional(),
  /** Nível da dica progressiva (1 = conceitual, 2 = onde olhar, 3 = passo concreto). */
  hintLevel: z.number().int().min(1).max(3).optional(),
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
    aiErrorExplanationEnabled: z.boolean(),
  }),
})

export const sendMessageResponseSchema = z.object({
  data: z.object({
    message: messageSchema,
    messagesUsedToday: z.number(),
    dailyLimit: z.number().nullable(),
  }),
})

// ─── Lições (Codi por módulo, sem persistência) ───────────────────────────────

export const slugModuleParamsSchema = z.object({
  slug: z.string(),
  moduleId: z.string().uuid('ID de módulo inválido'),
})

export const sendLessonMessageBodySchema = z.object({
  message: z.string().min(1).max(2000),
  history: z
    .array(z.object({ role: z.enum(['user', 'assistant']), content: z.string().max(4000) }))
    .max(20)
    .optional(),
})

export const lessonMessageResponseSchema = z.object({
  data: z.object({
    reply: z.string(),
    messagesUsedToday: z.number(),
    dailyLimit: z.number().nullable(),
  }),
})

export type SendLessonMessageBody = z.infer<typeof sendLessonMessageBodySchema>
