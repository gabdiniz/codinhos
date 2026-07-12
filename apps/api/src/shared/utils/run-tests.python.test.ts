import { describe, expect, it } from 'vitest'
import type { TestCase } from '../db/schema.js'
import { runTests } from './run-tests.js'

/**
 * Confirma o DISPATCH de run-tests.ts pro @codinhos/runner-python quando
 * language === 'python' — cobertura funda dos modos/edge-cases já mora nos
 * testes do próprio pacote (packages/runner-python/src/run-python-tests.test.ts);
 * aqui só garante que o fio entre API e pacote está ligado certo.
 *
 * Lento na primeira chamada (~4s de load do Pyodide) — ver
 * docs/motor-python-capacidades.md. Rodar com `pnpm --filter @codinhos/api test`.
 */
describe('runTests — dispatch Python', () => {
  it(
    'roteia pro runner Python quando language=python',
    async () => {
      const tc: TestCase = { input: [2, 3], expected: 5, description: 'soma(2, 3) deve ser 5' }
      const { results, allPassed } = await runTests(
        'def soma(a, b):\n    return a + b',
        [tc],
        'soma',
        'python',
      )
      expect(allPassed).toBe(true)
      expect(results[0]?.actual).toBe(5)
    },
    20000,
  )

  it(
    'sem language (default) continua rodando como JavaScript',
    async () => {
      const tc: TestCase = { input: [2, 3], expected: 5, description: 'soma(2, 3) deve ser 5' }
      // Código Python de propósito: se o default deslizasse pra 'python' por
      // engano, isso passaria; como o default é 'javascript', deve reprovar
      // (node:vm não entende `def`).
      const { allPassed } = await runTests('def soma(a, b):\n    return a + b', [tc], 'soma')
      expect(allPassed).toBe(false)
    },
    10000,
  )
})
