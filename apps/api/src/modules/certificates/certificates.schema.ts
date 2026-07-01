import { z } from 'zod'

export const slugParamsSchema = z.object({ slug: z.string() })

export const templateParamsSchema = z.object({
  slug: z.string(),
  templateId: z.string().uuid('ID de template inválido'),
})

const certificateConfigSchema = z.object({
  accentColor: z.string().max(9).optional(),
  textColor: z.string().max(9).optional(),
  backgroundColor: z.string().max(9).optional(),
  title: z.string().max(80).optional(),
  bodyText: z.string().max(120).optional(),
  message: z.string().max(200).optional(),
  signatureName: z.string().max(80).optional(),
  signatureRole: z.string().max(80).optional(),
  logoDataUrl: z.string().max(700000).optional(),
  showSchoolName: z.boolean().optional(),
})

export const upsertTemplateBodySchema = z.object({
  trailId: z.string().uuid().nullable(),
  enabled: z.boolean(),
  config: certificateConfigSchema,
})

const templateSchema = z.object({
  id: z.string().uuid(),
  trailId: z.string().uuid().nullable(),
  enabled: z.boolean(),
  config: z.any(),
})

export const listTemplatesResponseSchema = z.object({ data: z.array(templateSchema) })
export const templateResponseSchema = z.object({ data: z.object({ template: templateSchema }) })
export const messageResponseSchema = z.object({ data: z.object({ message: z.string() }) })

export type UpsertTemplateBody = z.infer<typeof upsertTemplateBodySchema>
