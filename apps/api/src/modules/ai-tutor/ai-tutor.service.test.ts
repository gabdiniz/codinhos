import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getConversation, sendMessage } from './ai-tutor.service.js'
import {
  findOrCreateConversation,
  listConversationMessages,
  insertMessage,
  getChallengeContext,
  countStudentMessagesToday,
  incrementUsage,
} from './ai-tutor.repository.js'
import { AiServiceError, NotFoundError, TooManyRequestsError } from '../../shared/errors/index.js'

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('./ai-tutor.repository.js', () => ({
  findOrCreateConversation: vi.fn(),
  listConversationMessages: vi.fn(),
  insertMessage: vi.fn(),
  getChallengeContext: vi.fn(),
  countStudentMessagesToday: vi.fn(),
  incrementUsage: vi.fn(),
}))

// Mock do SDK da Anthropic — evita chamada real à API em testes unitários.
// `mockCreate` precisa ser criado via vi.hoisted pois vi.mock é hoisted para o
// topo do arquivo e não pode referenciar variáveis declaradas normalmente.
const { mockCreate } = vi.hoisted(() => ({ mockCreate: vi.fn() }))

vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn().mockImplementation(() => ({
    messages: { create: mockCreate },
  })),
}))

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const student = { name: 'Aluno Teste', level: 3 }

const tenantEnabled = {
  name: 'Escola Teste',
  aiMessagesPerDay: 5,
  aiErrorExplanationEnabled: true,
}

const tenantDisabled = {
  ...tenantEnabled,
  aiErrorExplanationEnabled: false,
}

const challengeContext = {
  challengeTitle: 'Soma de dois números',
  challengeDescription: 'Escreva uma função que soma dois números.',
  difficulty: 'easy',
  moduleConcept: 'Variáveis',
  moduleTitle: 'Introdução',
  language: 'javascript',
} satisfies NonNullable<Awaited<ReturnType<typeof getChallengeContext>>>

const failedTest = {
  description: 'soma(2, 3) deveria retornar 5',
  expected: '5',
  actual: '4',
}

function mockAnthropicSuccess(text = 'Resposta do tutor') {
  mockCreate.mockResolvedValue({ content: [{ type: 'text', text }] })
}

// ─── Testes ───────────────────────────────────────────────────────────────────

describe('ai-tutor.service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(findOrCreateConversation).mockResolvedValue('conversation-uuid')
    vi.mocked(listConversationMessages).mockResolvedValue([])
    vi.mocked(getChallengeContext).mockResolvedValue(challengeContext)
    vi.mocked(insertMessage).mockImplementation(
      async (conversationId, role, content) =>
        ({ id: `msg-${role}`, conversationId, role, content, createdAt: new Date() }) as any,
    )
    vi.mocked(incrementUsage).mockResolvedValue(undefined)
    mockAnthropicSuccess()
  })

  // ── getConversation ───────────────────────────────────────────────────────

  describe('getConversation', () => {
    it('deve repassar aiErrorExplanationEnabled recebido como parâmetro', async () => {
      vi.mocked(countStudentMessagesToday).mockResolvedValue(2)

      const result = await getConversation('tenant-id', 'student-id', 'challenge-id', 10, true)

      expect(result.aiErrorExplanationEnabled).toBe(true)
      expect(result.dailyLimit).toBe(10)
      expect(result.messagesUsedToday).toBe(2)
    })

    it('deve repassar aiErrorExplanationEnabled=false quando a feature está desabilitada', async () => {
      vi.mocked(countStudentMessagesToday).mockResolvedValue(0)

      const result = await getConversation('tenant-id', 'student-id', 'challenge-id', null, false)

      expect(result.aiErrorExplanationEnabled).toBe(false)
    })
  })

  // ── sendMessage — limite diário ─────────────────────────────────────────

  describe('sendMessage — limite diário', () => {
    it('deve lançar TooManyRequestsError quando o limite foi atingido, sem chamar a API', async () => {
      vi.mocked(countStudentMessagesToday).mockResolvedValue(5) // == aiMessagesPerDay

      await expect(
        sendMessage(
          'tenant-id',
          'student-id',
          'challenge-id',
          { message: 'Pode me ajudar?' },
          student,
          tenantEnabled,
        ),
      ).rejects.toBeInstanceOf(TooManyRequestsError)

      expect(mockCreate).not.toHaveBeenCalled()
      expect(insertMessage).not.toHaveBeenCalled()
    })

    it('deve usar o limite padrão (20) quando o tenant não configurou aiMessagesPerDay', async () => {
      vi.mocked(countStudentMessagesToday).mockResolvedValue(20)

      await expect(
        sendMessage(
          'tenant-id',
          'student-id',
          'challenge-id',
          { message: 'Pode me ajudar?' },
          student,
          { ...tenantEnabled, aiMessagesPerDay: null },
        ),
      ).rejects.toBeInstanceOf(TooManyRequestsError)

      expect(mockCreate).not.toHaveBeenCalled()
    })
  })

  // ── sendMessage — desafio inexistente ───────────────────────────────────

  describe('sendMessage — desafio inexistente', () => {
    it('deve lançar NotFoundError quando o desafio não existe', async () => {
      vi.mocked(countStudentMessagesToday).mockResolvedValue(0)
      vi.mocked(getChallengeContext).mockResolvedValue(null)

      await expect(
        sendMessage(
          'tenant-id',
          'student-id',
          'challenge-id',
          { message: 'Pode me ajudar?' },
          student,
          tenantEnabled,
        ),
      ).rejects.toBeInstanceOf(NotFoundError)
    })
  })

  // ── sendMessage — failedTest no system prompt ───────────────────────────

  describe('sendMessage — failedTest no system prompt', () => {
    it('deve incluir a seção "Teste que falhou" quando a feature está habilitada e failedTest é enviado', async () => {
      vi.mocked(countStudentMessagesToday).mockResolvedValue(0)

      await sendMessage(
        'tenant-id',
        'student-id',
        'challenge-id',
        { message: 'Por que meu código não funciona?', failedTest },
        student,
        tenantEnabled,
      )

      const callArgs = mockCreate.mock.calls[0]![0]
      expect(callArgs.system).toContain('## Teste que falhou')
      expect(callArgs.system).toContain(failedTest.description)
      expect(callArgs.system).toContain('Esperado: 5')
      expect(callArgs.system).toContain('Obtido: 4')
      expect(callArgs.system).toContain('sem reescrever o código corrigido')
    })

    it('NÃO deve incluir a seção "Teste que falhou" quando failedTest não é enviado', async () => {
      vi.mocked(countStudentMessagesToday).mockResolvedValue(0)

      await sendMessage(
        'tenant-id',
        'student-id',
        'challenge-id',
        { message: 'Pode me ajudar?' },
        student,
        tenantEnabled,
      )

      const callArgs = mockCreate.mock.calls[0]![0]
      expect(callArgs.system).not.toContain('## Teste que falhou')
    })

    it('deve ignorar failedTest (defesa em profundidade) quando o tenant tem a feature desabilitada', async () => {
      vi.mocked(countStudentMessagesToday).mockResolvedValue(0)

      await sendMessage(
        'tenant-id',
        'student-id',
        'challenge-id',
        { message: 'Por que meu código não funciona?', failedTest },
        student,
        tenantDisabled,
      )

      const callArgs = mockCreate.mock.calls[0]![0]
      expect(callArgs.system).not.toContain('## Teste que falhou')
    })
  })

  // ── sendMessage — modo dica progressiva (D3) ────────────────────────────

  describe('sendMessage — modo dica progressiva', () => {
    it('inclui o bloco de dica do nível pedido quando intent=hint', async () => {
      vi.mocked(countStudentMessagesToday).mockResolvedValue(0)

      await sendMessage(
        'tenant-id',
        'student-id',
        'challenge-id',
        { message: 'Pode me dar uma dica?', intent: 'hint', hintLevel: 2 },
        student,
        tenantEnabled,
      )

      const callArgs = mockCreate.mock.calls[0]![0]
      expect(callArgs.system).toContain('## Modo DICA (nível 2 de 3)')
      expect(callArgs.system).toContain('SEM escrever a correção')
      expect(callArgs.system).toContain('SEM escrever o código pronto')
    })

    it('NÃO inclui o bloco de dica numa conversa normal', async () => {
      vi.mocked(countStudentMessagesToday).mockResolvedValue(0)

      await sendMessage(
        'tenant-id',
        'student-id',
        'challenge-id',
        { message: 'oi' },
        student,
        tenantEnabled,
      )

      const callArgs = mockCreate.mock.calls[0]![0]
      expect(callArgs.system).not.toContain('## Modo DICA')
    })

    it('ignora hintLevel quando intent não é hint', async () => {
      vi.mocked(countStudentMessagesToday).mockResolvedValue(0)

      await sendMessage(
        'tenant-id',
        'student-id',
        'challenge-id',
        { message: 'oi', hintLevel: 3 },
        student,
        tenantEnabled,
      )

      const callArgs = mockCreate.mock.calls[0]![0]
      expect(callArgs.system).not.toContain('## Modo DICA')
    })
  })

  // ── sendMessage — modo review (code review, D3 2ª leva) ─────────────────

  describe('sendMessage — modo review', () => {
    it('inclui o bloco de review quando intent=review', async () => {
      vi.mocked(countStudentMessagesToday).mockResolvedValue(0)

      await sendMessage(
        'tenant-id',
        'student-id',
        'challenge-id',
        { message: 'Pode revisar meu código?', intent: 'review' },
        student,
        tenantEnabled,
      )

      const callArgs = mockCreate.mock.calls[0]![0]
      expect(callArgs.system).toContain('## Modo REVIEW')
      expect(callArgs.system).toContain('NÃO reescreva o código pronto')
    })

    it('NÃO inclui o bloco de review numa conversa normal', async () => {
      vi.mocked(countStudentMessagesToday).mockResolvedValue(0)

      await sendMessage(
        'tenant-id',
        'student-id',
        'challenge-id',
        { message: 'oi' },
        student,
        tenantEnabled,
      )

      const callArgs = mockCreate.mock.calls[0]![0]
      expect(callArgs.system).not.toContain('## Modo REVIEW')
    })
  })

  // ── sendMessage — persistência ──────────────────────────────────────────

  describe('sendMessage — persistência', () => {
    it('deve persistir mensagem do aluno e do tutor somente após resposta bem-sucedida da API', async () => {
      vi.mocked(countStudentMessagesToday).mockResolvedValue(0)

      await sendMessage(
        'tenant-id',
        'student-id',
        'challenge-id',
        { message: 'Pode me ajudar?' },
        student,
        tenantEnabled,
      )

      expect(insertMessage).toHaveBeenCalledTimes(2)
      expect(insertMessage).toHaveBeenNthCalledWith(1, 'conversation-uuid', 'user', 'Pode me ajudar?')
      expect(insertMessage).toHaveBeenNthCalledWith(2, 'conversation-uuid', 'assistant', 'Resposta do tutor')
      expect(incrementUsage).toHaveBeenCalledWith('tenant-id', 'student-id', 'challenge-id')

      // Garante que a API foi chamada ANTES de qualquer persistência
      const createOrder = mockCreate.mock.invocationCallOrder[0]!
      const insertOrder = vi.mocked(insertMessage).mock.invocationCallOrder[0]!
      expect(createOrder).toBeLessThan(insertOrder)
    })

    it('NÃO deve persistir mensagens quando a chamada à API falha', async () => {
      vi.mocked(countStudentMessagesToday).mockResolvedValue(0)
      mockCreate.mockRejectedValue(new Error('Anthropic API indisponível'))

      // O service mapeia qualquer falha do provedor para AiServiceError (503) com
      // mensagem amigável — o erro original é apenas logado, não repassado ao aluno.
      await expect(
        sendMessage(
          'tenant-id',
          'student-id',
          'challenge-id',
          { message: 'Pode me ajudar?' },
          student,
          tenantEnabled,
        ),
      ).rejects.toThrow(AiServiceError)

      expect(insertMessage).not.toHaveBeenCalled()
      expect(incrementUsage).not.toHaveBeenCalled()
    })

    it('deve retornar messagesUsedToday incrementado em 1 em relação ao uso atual', async () => {
      vi.mocked(countStudentMessagesToday).mockResolvedValue(3)

      const result = await sendMessage(
        'tenant-id',
        'student-id',
        'challenge-id',
        { message: 'Pode me ajudar?' },
        student,
        tenantEnabled,
      )

      expect(result.messagesUsedToday).toBe(4)
      expect(result.dailyLimit).toBe(tenantEnabled.aiMessagesPerDay)
    })
  })
})
