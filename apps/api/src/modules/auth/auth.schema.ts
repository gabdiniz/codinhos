import { z } from 'zod'

// ─── URL params ───────────────────────────────────────────────────────────────

export const slugParamsSchema = z.object({
  slug: z.string().min(1),
})

// ─── Request bodies ───────────────────────────────────────────────────────────

export const loginBodySchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(1, 'Senha obrigatória'),
})

export const adminLoginBodySchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(1, 'Senha obrigatória'),
})

export const forgotPasswordBodySchema = z.object({
  email: z.string().email('E-mail inválido'),
})

export const resetPasswordBodySchema = z.object({
  token: z.string().min(1, 'Token obrigatório'),
  newPassword: z
    .string()
    .min(8, 'Senha deve ter no mínimo 8 caracteres')
    .max(100, 'Senha deve ter no máximo 100 caracteres'),
})

// ─── Response bodies ──────────────────────────────────────────────────────────

export const authUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string(),
  role: z.enum(['super_admin', 'manager', 'professor', 'student']),
})

export const loginResponseSchema = z.object({
  user: authUserSchema,
})

export const meResponseSchema = z.object({
  user: authUserSchema,
})

export const messageResponseSchema = z.object({
  message: z.string(),
})

// ─── Inferred types ───────────────────────────────────────────────────────────

export type LoginBody = z.infer<typeof loginBodySchema>
export type AdminLoginBody = z.infer<typeof adminLoginBodySchema>
export type ForgotPasswordBody = z.infer<typeof forgotPasswordBodySchema>
export type ResetPasswordBody = z.infer<typeof resetPasswordBodySchema>
export type AuthUser = z.infer<typeof authUserSchema>
