import { z } from 'zod'

// ─── Params ───────────────────────────────────────────────────────────────────

export const slugParamsSchema = z.object({
  slug: z.string().min(1),
})

export const userParamsSchema = z.object({
  slug: z.string().min(1),
  userId: z.string().uuid('ID de usuário inválido'),
})

// ─── Query ────────────────────────────────────────────────────────────────────

export const listUsersQuerySchema = z.object({
  role: z.enum(['student', 'manager', 'professor']).optional(),
  // Busca textual por nome ou e-mail (ILIKE)
  search: z.string().trim().min(1).max(255).optional(),
  // z.coerce.boolean() trataria "false" como true — por isso o enum explícito
  isActive: z.enum(['true', 'false']).transform((v) => v === 'true').optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

// ─── Request bodies ───────────────────────────────────────────────────────────

export const createUserBodySchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email('E-mail inválido'),
  role: z.enum(['student', 'manager']),
})

export const updateUserBodySchema = z.object({
  name: z.string().min(1).max(255).optional(),
  email: z.string().email('E-mail inválido').optional(),
  avatarUrl: z.string().url('URL de avatar inválida').nullable().optional(),
  classId: z.string().uuid('ID de turma inválido').nullable().optional(),
  birthDate: z.string().date('Data de nascimento inválida').nullable().optional(),
})

export const updateProfileBodySchema = z.object({
  name: z.string().min(1).max(255).optional(),
  avatarUrl: z.string().url('URL de avatar inválida').nullable().optional(),
})

export const updatePasswordBodySchema = z.object({
  currentPassword: z.string().min(1, 'Senha atual obrigatória'),
  newPassword: z
    .string()
    .min(8, 'Nova senha deve ter no mínimo 8 caracteres')
    .max(100, 'Nova senha deve ter no máximo 100 caracteres'),
})

// ─── Response schemas ─────────────────────────────────────────────────────────

const roleEnum = z.enum(['super_admin', 'manager', 'professor', 'student'])

export const userRowSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
  role: roleEnum,
  isActive: z.boolean(),
  createdAt: z.union([z.string(), z.date()]),
})

export const userDetailSchema = userRowSchema.extend({
  avatarUrl: z.string().nullable(),
  birthDate: z.string().nullable().optional(),
  // Turma atual do aluno (turma única por aluno) — null se não-aluno ou sem turma
  classId: z.string().uuid().nullable().optional(),
  className: z.string().nullable().optional(),
})

export const listUsersResponseSchema = z.object({
  data: z.array(userRowSchema),
  meta: z.object({ total: z.number(), page: z.number(), limit: z.number() }),
})

export const userResponseSchema = z.object({
  data: z.object({ user: userDetailSchema }),
})

export const messageResponseSchema = z.object({
  data: z.object({ message: z.string() }),
})

// ─── Inferred types ────────────────────────────────────────────────────────

export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>
export type CreateUserBody = z.infer<typeof createUserBodySchema>
export type UpdateUserBody = z.infer<typeof updateUserBodySchema>
export type UpdateProfileBody = z.infer<typeof updateProfileBodySchema>
export type UpdatePasswordBody = z.infer<typeof updatePasswordBodySchema>
