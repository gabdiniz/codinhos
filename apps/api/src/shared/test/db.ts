import { sql } from 'drizzle-orm'
import { db } from '../db/index.js'

/**
 * Trunca todas as tabelas de dados com CASCADE.
 * Use em beforeAll/afterAll nos testes de integração para garantir estado limpo.
 *
 * Não trunca enums nem tabelas de schema — apenas dados.
 */
export async function truncateAll(): Promise<void> {
  await db.execute(sql`
    TRUNCATE
      ai_messages,
      ai_usage,
      ai_conversations,
      xp_events,
      student_badges,
      challenge_submissions,
      module_progress,
      class_weekly_challenges,
      class_students,
      class_trails,
      classes,
      student_stats,
      tenant_trails,
      notifications,
      password_reset_tokens,
      sessions,
      users,
      tenants,
      badges,
      challenges,
      trail_modules,
      trails
    RESTART IDENTITY CASCADE
  `)
}

export { db }
