import { eq, and, sql, desc } from 'drizzle-orm'
import { db } from '../../shared/db/index.js'
import {
  aiConversations,
  aiMessages,
  aiUsage,
  challenges,
  trailModules,
  trails,
  tenants,
  studentStats,
} from '../../shared/db/schema.js'

// ─── Conversa ─────────────────────────────────────────────────────────────────

/**
 * Retorna a conversa existente para (tenant, aluno, desafio) ou cria uma nova.
 * A conversa é única por desafio — reinicia se o aluno voltar ao mesmo desafio
 * depois de já ter uma conversa (retorna a existente).
 */
export async function findOrCreateConversation(
  tenantId: string,
  studentId: string,
  challengeId: string,
): Promise<string> {
  const [existing] = await db
    .select({ id: aiConversations.id })
    .from(aiConversations)
    .where(
      and(
        eq(aiConversations.tenantId, tenantId),
        eq(aiConversations.studentId, studentId),
        eq(aiConversations.challengeId, challengeId),
      ),
    )
    .orderBy(desc(aiConversations.createdAt))
    .limit(1)

  if (existing) return existing.id

  const [created] = await db
    .insert(aiConversations)
    .values({ tenantId, studentId, challengeId })
    .returning({ id: aiConversations.id })

  return created!.id
}

// ─── Mensagens ────────────────────────────────────────────────────────────────

/** Retorna as últimas `limit` mensagens da conversa em ordem cronológica */
export async function listConversationMessages(conversationId: string, limit: number) {
  // Subquery para pegar os últimos N e retornar em ordem crescente
  const rows = await db
    .select({
      id: aiMessages.id,
      role: aiMessages.role,
      content: aiMessages.content,
      createdAt: aiMessages.createdAt,
    })
    .from(aiMessages)
    .where(eq(aiMessages.conversationId, conversationId))
    .orderBy(desc(aiMessages.createdAt))
    .limit(limit)

  // Inverte para ordem cronológica (mais antigas primeiro)
  return rows.reverse()
}

export async function insertMessage(
  conversationId: string,
  role: 'user' | 'assistant',
  content: string,
) {
  const [msg] = await db
    .insert(aiMessages)
    .values({ conversationId, role, content })
    .returning()

  return msg!
}

// ─── Contexto do desafio ──────────────────────────────────────────────────────

/**
 * Busca dados do desafio para compor o system prompt.
 * Não precisa de tenant_id — desafios são do catálogo global.
 */
export async function getChallengeContext(challengeId: string): Promise<{
  challengeTitle: string
  challengeDescription: string | null
  difficulty: 'easy' | 'medium' | 'hard'
  moduleConcept: string | null
  moduleTitle: string
  language: 'javascript' | 'python'
} | null> {
  const [row] = await db
    .select({
      challengeTitle: challenges.title,
      challengeDescription: challenges.description,
      difficulty: challenges.difficulty,
      moduleConcept: trailModules.concept,
      moduleTitle: trailModules.title,
      language: trails.language,
    })
    .from(challenges)
    .innerJoin(trailModules, eq(challenges.moduleId, trailModules.id))
    .innerJoin(trails, eq(trailModules.trailId, trails.id))
    .where(eq(challenges.id, challengeId))
    .limit(1)

  // Anotação explícita acima: sem ela o TS prova (incorretamente) que `row` nunca
  // é undefined e descarta o ramo `null`, quebrando o caso "desafio não existe".
  return row ?? null
}

// ─── Contagem de uso diário ───────────────────────────────────────────────────

/**
 * Soma o total de mensagens enviadas pelo aluno hoje (todos os desafios).
 * Usado para verificar o limite `ai_messages_per_day` do tenant.
 */
export async function countStudentMessagesToday(
  tenantId: string,
  studentId: string,
): Promise<number> {
  const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD

  const [row] = await db
    .select({ total: sql<number>`coalesce(sum(${aiUsage.messageCount}), 0)` })
    .from(aiUsage)
    .where(
      and(
        eq(aiUsage.tenantId, tenantId),
        eq(aiUsage.studentId, studentId),
        eq(aiUsage.date, today),
      ),
    )

  return Number(row?.total ?? 0)
}

// ─── Dados de contexto para o service ────────────────────────────────────────

/** Retorna nome e limite de mensagens do tenant */
export async function getTenantAiConfig(tenantId: string) {
  const [row] = await db
    .select({ name: tenants.name, settings: tenants.settings })
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1)

  return row
    ? {
        name: row.name,
        aiMessagesPerDay: row.settings?.ai_messages_per_day ?? null,
        aiErrorExplanationEnabled: row.settings?.ai_error_explanation_enabled ?? true,
      }
    : null
}

/** Retorna o nível atual do aluno (para o system prompt) */
export async function getStudentLevel(tenantId: string, studentId: string): Promise<number> {
  const [row] = await db
    .select({ level: studentStats.level })
    .from(studentStats)
    .where(
      and(
        eq(studentStats.tenantId, tenantId),
        eq(studentStats.studentId, studentId),
      ),
    )
    .limit(1)

  return row?.level ?? 1
}

/**
 * Incrementa o contador de mensagens do dia para (tenant, aluno, desafio).
 * Usa upsert para criar ou atualizar a linha.
 */
export async function incrementUsage(
  tenantId: string,
  studentId: string,
  challengeId: string,
): Promise<void> {
  const today = new Date().toISOString().slice(0, 10)

  await db
    .insert(aiUsage)
    .values({ tenantId, studentId, challengeId, date: today, messageCount: 1 })
    .onConflictDoUpdate({
      target: [aiUsage.tenantId, aiUsage.studentId, aiUsage.challengeId, aiUsage.date],
      set: { messageCount: sql`${aiUsage.messageCount} + 1` },
    })
}

/** Contexto de uma LIÇÃO (módulo sem desafio) para o system prompt do Codi. */
export async function getModuleContext(moduleId: string): Promise<{
  moduleTitle: string
  moduleConcept: string | null
  exampleCode: string | null
} | null> {
  const [row] = await db
    .select({
      moduleTitle: trailModules.title,
      moduleConcept: trailModules.concept,
      exampleCode: trailModules.exampleCode,
    })
    .from(trailModules)
    .where(eq(trailModules.id, moduleId))
    .limit(1)
  return row ?? null
}
