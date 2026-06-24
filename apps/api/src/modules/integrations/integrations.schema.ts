import { z } from 'zod'

export const slugParamsSchema = z.object({ slug: z.string() })

export const importCourseBodySchema = z.object({
  courseId: z.string().min(1),
  courseName: z.string().min(1).max(255),
})

// ─── Responses ────────────────────────────────────────────────────────────────

export const statusResponseSchema = z.object({
  data: z.object({
    connected: z.boolean(),
    googleEmail: z.string().nullable(),
  }),
})

export const authUrlResponseSchema = z.object({
  data: z.object({ url: z.string().url() }),
})

export const coursesResponseSchema = z.object({
  data: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      section: z.string().nullable(),
    }),
  ),
})

export const importResponseSchema = z.object({
  data: z.object({
    classId: z.string().uuid(),
    className: z.string(),
    total: z.number(),
    created: z.number(),
    reused: z.number(),
  }),
})

export const messageResponseSchema = z.object({
  data: z.object({ message: z.string() }),
})

export type ImportCourseBody = z.infer<typeof importCourseBodySchema>
