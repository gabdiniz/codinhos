import { z } from 'zod'

// ─── Params ───────────────────────────────────────────────────────────────────

export const avatarParamsSchema = z.object({
  slug: z.string(),
})

// ─── Config (body do PUT) ─────────────────────────────────────────────────────
//
// Todos os campos são obrigatórios: o front sempre envia o config completo.
// A validação de valor/nível (existe no catálogo? desbloqueado?) é feita no
// service, não aqui — o Zod só garante o formato.

export const avatarConfigSchema = z.object({
  skinColor: z.string().min(1).max(20),
  hair: z.string().min(1).max(20),
  hairColor: z.string().min(1).max(20),
  eyes: z.string().min(1).max(20),
  eyebrows: z.string().min(1).max(20),
  mouth: z.string().min(1).max(20),
  glasses: z.string().min(1).max(20),
  earrings: z.string().min(1).max(20),
  features: z.string().min(1).max(20),
  backgroundColor: z.string().min(1).max(20),
})

// ─── Response ─────────────────────────────────────────────────────────────────

const avatarOptionSchema = z.object({
  value: z.string(),
  label: z.string(),
  requiredLevel: z.number(),
  swatch: z.string().optional(),
  unlocked: z.boolean(),
})

const avatarCategorySchema = z.object({
  key: z.string(),
  label: z.string(),
  kind: z.enum(['color', 'style', 'toggle']),
  options: z.array(avatarOptionSchema),
})

export const avatarStudioResponseSchema = z.object({
  data: z.object({
    config: avatarConfigSchema,
    level: z.number(),
    categories: z.array(avatarCategorySchema),
  }),
})

export const avatarSaveResponseSchema = z.object({
  data: z.object({
    config: avatarConfigSchema,
  }),
})

// ─── Tipos inferidos ──────────────────────────────────────────────────────────

export type AvatarParams = z.infer<typeof avatarParamsSchema>
export type AvatarConfigBody = z.infer<typeof avatarConfigSchema>
