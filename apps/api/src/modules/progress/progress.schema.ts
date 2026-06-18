import { z } from 'zod'

// ─── Params ───────────────────────────────────────────────────────────────────

export const unlockModuleParamsSchema = z.object({
  slug: z.string().min(1),
  moduleId: z.string().uuid('ID de módulo inválido'),
})

// ─── Request bodies ───────────────────────────────────────────────────────────

export const unlockModuleBodySchema = z.object({
  studentId: z.string().uuid('ID de aluno inválido'),
  classId: z.string().uuid('ID de turma inválido'),
})

// ─── Response schemas ─────────────────────────────────────────────────────────

const moduleProgressStatusEnum = z.enum(['locked', 'available', 'completed'])

export const moduleProgressSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  studentId: z.string().uuid(),
  moduleId: z.string().uuid(),
  status: moduleProgressStatusEnum,
  unlockedBy: z.string().uuid().nullable(),
  unlockedAt: z.union([z.string(), z.date()]).nullable(),
  completedAt: z.union([z.string(), z.date()]).nullable(),
})

export const unlockModuleResponseSchema = z.object({
  data: z.object({ moduleProgress: moduleProgressSchema }),
})

// ─── Inferred types ────────────────────────────────────────────────────────

export type UnlockModuleBody = z.infer<typeof unlockModuleBodySchema>
