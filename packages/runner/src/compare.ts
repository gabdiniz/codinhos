import type { Matcher } from './types.js'

/**
 * Igualdade estrutural profunda, INSENSÍVEL à ordem das chaves de objetos.
 *
 * Esta é a semântica canônica de comparação do Codinhos: o backend foi
 * alinhado a ela (antes usava JSON.stringify, sensível à ordem, o que
 * divergia do front e podia reprovar um aluno que via "verde" na tela).
 */
export function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (typeof a !== typeof b) return false
  if (a === null || b === null) return a === b
  if (typeof a !== 'object') return false
  if (Array.isArray(a) !== Array.isArray(b)) return false
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false
    return a.every((v, i) => deepEqual(v, (b as unknown[])[i]))
  }
  const ka = Object.keys(a as object).sort()
  const kb = Object.keys(b as object).sort()
  if (ka.join() !== kb.join()) return false
  return ka.every((k) =>
    deepEqual((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k]),
  )
}

const DEFAULT_TOLERANCE = 1e-9

/**
 * Aplica a estratégia de comparação de um test case.
 *
 *  - equal (default): igualdade estrutural (deepEqual).
 *  - approx: numérico, |actual - expected| <= tolerance. Abre exercícios de
 *    ponto flutuante (0.1 + 0.2). Não-números reprovam.
 *  - contains: expected contido em actual. String em string (includes) ou
 *    elemento em array (deepEqual em algum item).
 *  - regex: expected é o corpo de uma RegExp; testa contra String(actual).
 */
export function applyMatcher(
  actual: unknown,
  expected: unknown,
  matcher: Matcher = 'equal',
  tolerance: number = DEFAULT_TOLERANCE,
): boolean {
  switch (matcher) {
    case 'equal':
      return deepEqual(actual, expected)

    case 'approx': {
      if (typeof actual !== 'number' || typeof expected !== 'number') return false
      if (Number.isNaN(actual) || Number.isNaN(expected)) return false
      return Math.abs(actual - expected) <= tolerance
    }

    case 'contains': {
      if (typeof actual === 'string' && typeof expected === 'string') {
        return actual.includes(expected)
      }
      if (Array.isArray(actual)) {
        return actual.some((item) => deepEqual(item, expected))
      }
      return false
    }

    case 'regex': {
      try {
        return new RegExp(String(expected)).test(String(actual))
      } catch {
        return false
      }
    }

    default:
      return deepEqual(actual, expected)
  }
}
