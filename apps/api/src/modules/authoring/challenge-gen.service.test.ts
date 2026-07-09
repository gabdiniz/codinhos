import { beforeEach, describe, expect, it, vi } from 'vitest'
import { UnprocessableError } from '../../shared/errors/index.js'

// Mock do SDK da Anthropic (mockCreate via vi.hoisted, como no ai-tutor).
const { mockCreate } = vi.hoisted(() => ({ mockCreate: vi.fn() }))
vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn().mockImplementation(() => ({ messages: { create: mockCreate } })),
}))

import { generateChallenge } from './challenge-gen.service.js'

/** Faz o modelo "responder" com este JSON (ou texto cru) na PRÓXIMA chamada. */
function modelReturns(json: object | string): void {
  const text = typeof json === 'string' ? json : JSON.stringify(json)
  mockCreate.mockResolvedValueOnce({ content: [{ type: 'text', text }] })
}

const goodDraft = {
  title: 'Soma',
  description: 'Escreva a função soma(a, b) que devolve a + b.',
  starterCode: 'function soma(a, b) {\n  // seu código\n}',
  targetFn: 'soma',
  difficulty: 'easy',
  testMode: 'call',
  testCases: [
    { input: [2, 3], expected: 5, description: '2 + 3' },
    { input: [-1, 1], expected: 0, description: '-1 + 1' },
  ],
  referenceSolution: 'function soma(a, b) { return a + b }',
}
// mesma estrutura, mas a solução está ERRADA (subtrai) — falha na verificação.
const badSolution = { ...goodDraft, referenceSolution: 'function soma(a, b) { return a - b }' }

beforeEach(() => {
  mockCreate.mockReset()
})

describe('generateChallenge', () => {
  it('marca verified=true quando a solução de referência passa em todos os testes', async () => {
    modelReturns(goodDraft)
    const res = await generateChallenge({ topic: 'somar dois números' })
    expect(res.verified).toBe(true)
    expect(res.challenge.title).toBe('Soma')
    expect(res.challenge.targetFn).toBe('soma')
    expect(res.challenge.baseXp).toBe(10)
    expect(res.message).toMatch(/Verificado/)
    expect(mockCreate).toHaveBeenCalledTimes(1) // não precisou retry
  })

  it('extrai o JSON mesmo com crases/markdown ao redor', async () => {
    modelReturns('Aqui está:\n```json\n' + JSON.stringify(goodDraft) + '\n```')
    const res = await generateChallenge({ topic: 'somar' })
    expect(res.verified).toBe(true)
  })

  it('tenta de novo quando a 1ª geração falha na verificação e adota a 2ª (boa)', async () => {
    modelReturns(badSolution)
    modelReturns(goodDraft)
    const res = await generateChallenge({ topic: 'somar' })
    expect(mockCreate).toHaveBeenCalledTimes(2)
    expect(res.verified).toBe(true)
  })

  it('marca verified=false quando nem a retentativa passa', async () => {
    modelReturns(badSolution)
    modelReturns(badSolution)
    const res = await generateChallenge({ topic: 'somar' })
    expect(mockCreate).toHaveBeenCalledTimes(2)
    expect(res.verified).toBe(false)
    expect(res.message).toMatch(/não passou/)
  })

  it('lança UnprocessableError quando a IA não retorna JSON válido', async () => {
    modelReturns('desculpe, não consegui gerar')
    await expect(generateChallenge({ topic: 'x' })).rejects.toThrow(UnprocessableError)
  })
})
