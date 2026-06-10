import Anthropic from '@anthropic-ai/sdk'
import { NotFoundError, TooManyRequestsError } from '../../shared/errors/index.js'
import {
  findOrCreateConversation,
  listConversationMessages,
  insertMessage,
  getChallengeContext,
  countStudentMessagesToday,
  incrementUsage,
} from './ai-tutor.repository.js'
import type { SendMessageBody } from './ai-tutor.schema.js'

// ─── Constantes ───────────────────────────────────────────────────────────────

/** Número de mensagens do histórico enviadas para a API (5 pares = 10 msgs) */
const HISTORY_LIMIT = 10

/** Limite padrão quando o tenant não configurou um valor */
const DEFAULT_DAILY_LIMIT = 20

const DIFFICULTY_LABEL: Record<string, string> = {
  easy: 'Fácil',
  medium: 'Médio',
  hard: 'Difícil',
}

// Cliente Anthropic singleton — instanciado uma vez por processo
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// ─── System prompt ────────────────────────────────────────────────────────────

function buildSystemPrompt(opts: {
  studentName: string
  tenantName: string
  studentLevel: number
  challengeTitle: string
  challengeDescription: string | null
  difficulty: string
  moduleConcept: string | null
  language: string
  currentCode: string | undefined
}): string {
  const {
    studentName,
    tenantName,
    studentLevel,
    challengeTitle,
    challengeDescription,
    difficulty,
    moduleConcept,
    language,
    currentCode,
  } = opts

  const codeBlock = currentCode
    ? `\n\n## Código atual do aluno\n\`\`\`${language}\n${currentCode}\n\`\`\``
    : ''

  return `Você é o Codi, tutor de programação da plataforma Codinhos.

## Aluno
- Nome: ${studentName}
- Escola: ${tenantName}
- Nível: ${studentLevel}

## Desafio atual
- Título: ${challengeTitle}
- Dificuldade: ${DIFFICULTY_LABEL[difficulty] ?? difficulty}
- Módulo: ${moduleConcept ?? 'Programação'}
- Linguagem: ${language}
${challengeDescription ? `- Enunciado: ${challengeDescription}` : ''}${codeBlock}

## Diretrizes pedagógicas
- Fale de forma simples e amigável, adequada para alunos de 11 a 14 anos
- NUNCA dê a resposta direta — faça perguntas que guiem o raciocínio
- Se o aluno errar, explique o que está errado de forma construtiva, sem dar a solução
- Seja encorajador e paciente
- Respostas curtas e objetivas (máximo 3 parágrafos)
- Se o aluno pedir a resposta diretamente, diga que aprender é mais importante do que resolver rápido e ofereça uma dica
- Use exemplos do mundo real quando possível para tornar o conceito concreto`
}

// ─── getConversation ──────────────────────────────────────────────────────────

export async function getConversation(
  tenantId: string,
  studentId: string,
  challengeId: string,
  dailyLimit: number | null,
) {
  const conversationId = await findOrCreateConversation(tenantId, studentId, challengeId)
  const messages = await listConversationMessages(conversationId, HISTORY_LIMIT)
  const messagesUsedToday = await countStudentMessagesToday(tenantId, studentId)

  return {
    conversationId,
    messages: messages.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      createdAt: m.createdAt.toISOString(),
    })),
    messagesUsedToday,
    dailyLimit,
  }
}

// ─── sendMessage ──────────────────────────────────────────────────────────────

export async function sendMessage(
  tenantId: string,
  studentId: string,
  challengeId: string,
  body: SendMessageBody,
  student: { name: string; level: number },
  tenant: { name: string; aiMessagesPerDay: number | null },
) {
  // 1. Verificar limite diário ANTES de qualquer persistência
  const effectiveLimit = tenant.aiMessagesPerDay ?? DEFAULT_DAILY_LIMIT
  const usedToday = await countStudentMessagesToday(tenantId, studentId)

  if (usedToday >= effectiveLimit) {
    throw new TooManyRequestsError(
      `Você atingiu o limite de ${effectiveLimit} mensagens por dia. Tente novamente amanhã.`,
    )
  }

  // 2. Buscar contexto do desafio para o system prompt
  const context = await getChallengeContext(challengeId)
  if (!context) throw new NotFoundError('Desafio')

  // 3. Conversa (find or create) + histórico atual
  const conversationId = await findOrCreateConversation(tenantId, studentId, challengeId)
  const history = await listConversationMessages(conversationId, HISTORY_LIMIT - 1)

  // 4. Montar messages para a API (histórico anterior + nova mensagem do aluno)
  //    NOTA: user message é persistida SOMENTE após resposta bem-sucedida da API,
  //    para evitar mensagens 'user' órfãs que quebrariam o histórico (Anthropic exige
  //    alternância user/assistant).
  const apiMessages: Anthropic.MessageParam[] = [
    ...history.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
    { role: 'user' as const, content: body.message },
  ]

  // 5. Chamar Anthropic
  const aiResponse = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    system: buildSystemPrompt({
      studentName: student.name,
      tenantName: tenant.name,
      studentLevel: student.level,
      challengeTitle: context.challengeTitle,
      challengeDescription: context.challengeDescription ?? null,
      difficulty: context.difficulty,
      moduleConcept: context.moduleConcept ?? null,
      language: context.language,
      currentCode: body.currentCode,
    }),
    messages: apiMessages,
  })

  const responseText =
    aiResponse.content[0]?.type === 'text' ? aiResponse.content[0].text : ''

  // 6. Persistir ambas as mensagens e incrementar uso somente após API bem-sucedida
  await insertMessage(conversationId, 'user', body.message)
  const assistantMessage = await insertMessage(conversationId, 'assistant', responseText)
  await incrementUsage(tenantId, studentId, challengeId)

  return {
    message: {
      id: assistantMessage.id,
      role: 'assistant' as const,
      content: assistantMessage.content,
      createdAt: assistantMessage.createdAt.toISOString(),
    },
    messagesUsedToday: usedToday + 1,
    dailyLimit: tenant.aiMessagesPerDay,
  }
}
