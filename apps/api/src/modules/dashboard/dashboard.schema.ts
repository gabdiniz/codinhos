import { z } from 'zod'

// ─── Params ───────────────────────────────────────────────────────────────────

export const slugParamsSchema = z.object({
  slug: z.string(),
})

export const studentDetailParamsSchema = z.object({
  slug: z.string(),
  studentId: z.string().uuid(),
})

export const classDetailParamsSchema = z.object({
  slug: z.string(),
  classId: z.string().uuid(),
})

// ─── Response — GET / ─────────────────────────────────────────────────────────

const alertSchema = z.object({
  type: z.enum(['pending_review', 'no_activity_7d', 'stuck_on_module', 'possible_plagiarism']),
  studentId: z.string().uuid(),
  studentName: z.string(),
  classId: z.string().uuid(),
  message: z.string(),
})

export const overviewResponseSchema = z.object({
  data: z.object({
    totalStudents: z.number(),
    activeToday: z.number(),
    totalClasses: z.number(),
    alerts: z.array(alertSchema),
  }),
})

// ─── Response — GET /students/:studentId ─────────────────────────────────────

const studentBadgeSchema = z.object({
  slug: z.string(),
  name: z.string(),
  earnedAt: z.string(),
})

const trailProgressSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  progress: z.object({
    completed: z.number(),
    total: z.number(),
  }),
  lastActivity: z.string().nullable(),
})

export const studentDetailResponseSchema = z.object({
  data: z.object({
    student: z.object({
      id: z.string().uuid(),
      name: z.string(),
      avatarUrl: z.string().nullable(),
    }),
    stats: z.object({
      totalXp: z.number(),
      level: z.number(),
      currentStreak: z.number(),
    }),
    badges: z.array(studentBadgeSchema),
    trails: z.array(trailProgressSchema),
  }),
})

// ─── Response — GET /classes/:classId ────────────────────────────────────────

const classStudentRowSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  avatarUrl: z.string().nullable(),
  totalXp: z.number(),
  level: z.number(),
  lastActivity: z.string().nullable(),
  pendingReview: z.number(),
})

export const classDetailResponseSchema = z.object({
  data: z.object({
    class: z.object({
      id: z.string().uuid(),
      name: z.string(),
      progressionMode: z.string(),
      validationMode: z.string(),
    }),
    stats: z.object({
      totalStudents: z.number(),
      activeToday: z.number(),
      avgXp: z.number(),
    }),
    students: z.array(classStudentRowSchema),
  }),
})

// ─── Response — GET /review-queue ─────────────────────────────────────────────

export const reviewQueueResponseSchema = z.object({
  data: z.array(
    z.object({
      submissionId: z.string().uuid(),
      challengeId: z.string().uuid(),
      challengeTitle: z.string(),
      studentId: z.string().uuid(),
      studentName: z.string(),
      classId: z.string().uuid(),
      className: z.string(),
      attemptNumber: z.number(),
      submittedAt: z.string().datetime(),
    }),
  ),
})
