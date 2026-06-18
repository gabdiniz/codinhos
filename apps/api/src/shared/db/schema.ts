import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  boolean,
  timestamp,
  date,
  integer,
  text,
  jsonb,
  numeric,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core'

// ─── Types para colunas jsonb ─────────────────────────────────────────────────

export type TenantSettings = {
  ai_messages_per_day?: number
  max_students?: number
  ai_error_explanation_enabled?: boolean
  allow_student_profile_view?: boolean
  gamification?: {
    xp_per_level?: number
    first_attempt_bonus_multiplier?: number
    streak_bonus_xp?: number
    streak_bonus_max_xp?: number
    streak_milestone_days?: number[]
  }
}

export type TenantTheme = Record<string, string>

export type TestCase = {
  input: unknown
  expected: unknown
  description: string
}

export type TestResult = {
  passed: boolean
  input: unknown
  expected: unknown
  actual: unknown
  description: string
}

// ─── Enums ────────────────────────────────────────────────────────────────────

export const roleEnum = pgEnum('role', ['super_admin', 'manager', 'professor', 'student'])
export const tokenTypeEnum = pgEnum('token_type', ['invite', 'reset'])
export const languageEnum = pgEnum('language', ['javascript', 'python'])
export const progressionModeEnum = pgEnum('progression_mode', ['free', 'sequential', 'controlled'])
export const validationModeEnum = pgEnum('validation_mode', ['auto', 'auto_review', 'manual'])
export const difficultyEnum = pgEnum('difficulty', ['easy', 'medium', 'hard'])
export const moduleStatusEnum = pgEnum('module_status', ['locked', 'available', 'completed'])
export const submissionStatusEnum = pgEnum('submission_status', ['pending', 'passed', 'failed', 'under_review'])
export const aiMessageRoleEnum = pgEnum('ai_message_role', ['user', 'assistant'])

// ─── 1. Tenants e Usuários ────────────────────────────────────────────────────

export const tenants = pgTable('tenants', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: varchar('slug', { length: 100 }).unique().notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  theme: jsonb('theme').$type<TenantTheme>(),
  plan: varchar('plan', { length: 50 }).default('free').notNull(),
  settings: jsonb('settings').$type<TenantSettings>().default({}).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()).notNull(),
})

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  role: roleEnum('role').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  avatarUrl: varchar('avatar_url', { length: 500 }),
  birthDate: date('birth_date'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()).notNull(),
}, (t) => [
  uniqueIndex('users_tenant_email_idx').on(t.tenantId, t.email),
])

export const sessions = pgTable('sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  role: roleEnum('role').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => [
  index('sessions_user_id_idx').on(t.userId),
  index('sessions_expires_at_idx').on(t.expiresAt),
])

export const passwordResetTokens = pgTable('password_reset_tokens', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  tokenHash: varchar('token_hash', { length: 255 }).unique().notNull(),
  type: tokenTypeEnum('type').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  usedAt: timestamp('used_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// ─── 2. Catálogo de Conteúdo (sem tenant_id — gerenciado pelo Super Admin) ────

export const trails = pgTable('trails', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: varchar('slug', { length: 100 }).unique().notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  language: languageEnum('language').notNull(),
  order: integer('order').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()).notNull(),
})

export const trailModules = pgTable('trail_modules', {
  id: uuid('id').defaultRandom().primaryKey(),
  trailId: uuid('trail_id').references(() => trails.id).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  concept: text('concept'),
  exampleCode: text('example_code'),
  order: integer('order').notNull(),
  // V2
  videoUrl: varchar('video_url', { length: 500 }),
  videoStorageKey: varchar('video_storage_key', { length: 500 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()).notNull(),
}, (t) => [
  index('trail_modules_trail_id_idx').on(t.trailId),
])

export const challenges = pgTable('challenges', {
  id: uuid('id').defaultRandom().primaryKey(),
  moduleId: uuid('module_id').references(() => trailModules.id).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  starterCode: text('starter_code'),
  testCases: jsonb('test_cases').$type<TestCase[]>(),
  difficulty: difficultyEnum('difficulty').notNull(),
  order: integer('order').notNull(),
  baseXp: integer('base_xp').default(10).notNull(),
  validationModeOverride: validationModeEnum('validation_mode_override'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()).notNull(),
}, (t) => [
  index('challenges_module_id_idx').on(t.moduleId),
])

// ─── 3. Configuração por Tenant ───────────────────────────────────────────────

export const tenantTrails = pgTable('tenant_trails', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  trailId: uuid('trail_id').references(() => trails.id).notNull(),
  order: integer('order').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => [
  uniqueIndex('tenant_trails_tenant_trail_idx').on(t.tenantId, t.trailId),
])

export const classes = pgTable('classes', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  progressionMode: progressionModeEnum('progression_mode').default('sequential').notNull(),
  validationMode: validationModeEnum('validation_mode').default('auto').notNull(),
  showRanking: boolean('show_ranking').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()).notNull(),
})

export const classStudents = pgTable('class_students', {
  id: uuid('id').defaultRandom().primaryKey(),
  classId: uuid('class_id').references(() => classes.id).notNull(),
  studentId: uuid('student_id').references(() => users.id).notNull(),
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
}, (t) => [
  uniqueIndex('class_students_class_student_idx').on(t.classId, t.studentId),
])

export const classTrails = pgTable('class_trails', {
  id: uuid('id').defaultRandom().primaryKey(),
  classId: uuid('class_id').references(() => classes.id).notNull(),
  trailId: uuid('trail_id').references(() => trails.id).notNull(),
  order: integer('order').notNull(),
  visualBlocksEnabled: boolean('visual_blocks_enabled').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => [
  uniqueIndex('class_trails_class_trail_idx').on(t.classId, t.trailId),
])

// ─── 4. Progresso do Aluno ────────────────────────────────────────────────────

export const moduleProgress = pgTable('module_progress', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  studentId: uuid('student_id').references(() => users.id).notNull(),
  moduleId: uuid('module_id').references(() => trailModules.id).notNull(),
  status: moduleStatusEnum('status').default('locked').notNull(),
  unlockedBy: uuid('unlocked_by').references(() => users.id),
  unlockedAt: timestamp('unlocked_at'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()).notNull(),
}, (t) => [
  uniqueIndex('module_progress_tenant_student_module_idx').on(t.tenantId, t.studentId, t.moduleId),
  index('module_progress_tenant_student_idx').on(t.tenantId, t.studentId),
])

export const challengeSubmissions = pgTable('challenge_submissions', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  studentId: uuid('student_id').references(() => users.id).notNull(),
  challengeId: uuid('challenge_id').references(() => challenges.id).notNull(),
  classId: uuid('class_id').references(() => classes.id).notNull(),
  attemptNumber: integer('attempt_number').notNull(),
  code: text('code').notNull(),
  status: submissionStatusEnum('status').notNull(),
  testResults: jsonb('test_results').$type<TestResult[]>(),
  score: numeric('score', { precision: 5, scale: 2 }),
  reviewerId: uuid('reviewer_id').references(() => users.id),
  reviewerNote: text('reviewer_note'),
  submittedAt: timestamp('submitted_at').defaultNow().notNull(),
  reviewedAt: timestamp('reviewed_at'),
}, (t) => [
  index('challenge_submissions_tenant_student_challenge_idx').on(t.tenantId, t.studentId, t.challengeId),
  index('challenge_submissions_tenant_class_challenge_submitted_idx').on(t.tenantId, t.classId, t.challengeId, t.submittedAt),
])

// ─── 5. Gamificação ───────────────────────────────────────────────────────────

export const xpEvents = pgTable('xp_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  studentId: uuid('student_id').references(() => users.id).notNull(),
  amount: integer('amount').notNull(),
  reason: varchar('reason', { length: 100 }).notNull(),
  refId: uuid('ref_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => [
  index('xp_events_tenant_student_idx').on(t.tenantId, t.studentId),
])

export const studentStats = pgTable('student_stats', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  studentId: uuid('student_id').references(() => users.id).notNull(),
  totalXp: integer('total_xp').default(0).notNull(),
  level: integer('level').default(1).notNull(),
  currentStreak: integer('current_streak').default(0).notNull(),
  longestStreak: integer('longest_streak').default(0).notNull(),
  lastActivity: date('last_activity'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()).notNull(),
}, (t) => [
  uniqueIndex('student_stats_tenant_student_idx').on(t.tenantId, t.studentId),
])

export const badges = pgTable('badges', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: varchar('slug', { length: 100 }).unique().notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  iconUrl: varchar('icon_url', { length: 500 }),
  triggerType: varchar('trigger_type', { length: 100 }).notNull(),
  triggerValue: integer('trigger_value').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const studentBadges = pgTable('student_badges', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  studentId: uuid('student_id').references(() => users.id).notNull(),
  badgeId: uuid('badge_id').references(() => badges.id).notNull(),
  earnedAt: timestamp('earned_at').defaultNow().notNull(),
}, (t) => [
  uniqueIndex('student_badges_tenant_student_badge_idx').on(t.tenantId, t.studentId, t.badgeId),
])

export const classWeeklyChallenges = pgTable('class_weekly_challenges', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  classId: uuid('class_id').references(() => classes.id).notNull(),
  challengeId: uuid('challenge_id').references(() => challenges.id).notNull(),
  startsAt: timestamp('starts_at').notNull(),
  endsAt: timestamp('ends_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => [
  index('class_weekly_challenges_tenant_class_idx').on(t.tenantId, t.classId),
])

// ─── 6. Tutor de IA ───────────────────────────────────────────────────────────

export const aiConversations = pgTable('ai_conversations', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  studentId: uuid('student_id').references(() => users.id).notNull(),
  challengeId: uuid('challenge_id').references(() => challenges.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => [
  index('ai_conversations_tenant_student_challenge_idx').on(t.tenantId, t.studentId, t.challengeId),
])

export const aiMessages = pgTable('ai_messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  conversationId: uuid('conversation_id').references(() => aiConversations.id).notNull(),
  role: aiMessageRoleEnum('role').notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const aiUsage = pgTable('ai_usage', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  studentId: uuid('student_id').references(() => users.id).notNull(),
  challengeId: uuid('challenge_id').references(() => challenges.id).notNull(),
  messageCount: integer('message_count').default(0).notNull(),
  date: date('date').notNull(),
}, (t) => [
  uniqueIndex('ai_usage_tenant_student_challenge_date_idx').on(t.tenantId, t.studentId, t.challengeId, t.date),
])

// ─── 7. Notificações ──────────────────────────────────────────────────────────

export const notifications = pgTable('notifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  type: varchar('type', { length: 100 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  body: text('body'),
  readAt: timestamp('read_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => [
  index('notifications_tenant_user_read_idx').on(t.tenantId, t.userId, t.readAt),
])
