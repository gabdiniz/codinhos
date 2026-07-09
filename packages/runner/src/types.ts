import type { AstRule } from './ast.js'
/**
 * Tipos compartilhados do runner de desafios.
 *
 * Fonte única usada tanto pelo backend (node:vm) quanto pelo Web Worker do
 * front (new Function). Só define contratos puros — nada de execução aqui.
 */

/** Estratégia de comparação entre o retorno do aluno e o esperado. */
export type Matcher = 'equal' | 'approx' | 'contains' | 'regex'

export interface TestCase {
  input: unknown
  expected: unknown
  description: string
  /** Estratégia de comparação. Ausente = 'equal' (retrocompatível). */
  matcher?: Matcher
  /** Tolerância para o matcher 'approx' (default 1e-9). */
  tolerance?: number
  /**
   * Modo de teste. Ausente = comportamento clássico (chamada de função quando
   * input é array; type-check quando input é null). 'stdout' compara a SAÍDA
   * impressa com console.log. 'ast' verifica a ESTRUTURA do código (ver astRule).
   */
  mode?: 'stdout' | 'ast'
  /** Regra estrutural, usada quando mode === 'ast' (ex.: exigir recursão). */
  astRule?: AstRule
}

export interface TestResult {
  passed: boolean
  input: unknown
  expected: unknown
  actual: unknown
  description: string
  error?: string
  /** err.name (ex.: "TypeError") — usado para humanizar a mensagem no front. */
  errorName?: string
}
