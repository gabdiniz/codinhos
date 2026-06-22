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

// ─── Response schemas ─────────────────────────────────────────────────────────

const roleEnum = z.enum(['super_admin', 'manager', 'professor', 'student'])

// Usuário retornado no login (sem avatarUrl — não necessário no momento do login)
export const authUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string(),
  role: roleEnum,
})

// Usuário retornado no /me (completo)
export const meUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string(),
  role: roleEnum,
  avatarUrl: z.string().nullable(),
  tenantId: z.string().uuid(),
})

export const loginSuccessResponseSchema = z.object({
  data: z.object({
    user: authUserSchema,
    redirectTo: z.string(),
  }),
})

// Resposta quando o aluno (<12 anos) ainda não tem consentimento parental
// registrado — login fica pendente até /:slug/auth/parental-consent.
export const parentalConsentRequiredResponseSchema = z.object({
  data: z.object({
    requiresParentalConsent: z.literal(true),
    consentToken: z.string(),
    studentName: z.string(),
  }),
})

export const loginResponseSchema = z.union([
  loginSuccessResponseSchema,
  parentalConsentRequiredResponseSchema,
])

export const submitParentalConsentBodySchema = z.object({
  consentToken: z.string().min(1, 'Token obrigatório'),
  guardianName: z.string().min(1, 'Nome do responsável obrigatório').max(255),
  guardianEmail: z.string().email('E-mail do responsável inválido'),
})

export const meResponseSchema = z.object({
  data: z.object({
    user: meUserSchema,
  }),
})

export const messageResponseSchema = z.object({
  data: z.object({
    message: z.string(),
  }),
})

// ─── Inferred types ───────────────────────────────────────────────────────────

export type LoginBody = z.infer<typeof loginBodySchema>
export type AdminLoginBody = z.infer<typeof adminLoginBodySchema>
export type ForgotPasswordBody = z.infer<typeof forgotPasswordBodySchema>
export type ResetPasswordBody = z.infer<typeof resetPasswordBodySchema>
export type AuthUser = z.infer<typeof authUserSchema>
export type SubmitParentalConsentBody = z.infer<typeof submitParentalConsentBodySchema>
