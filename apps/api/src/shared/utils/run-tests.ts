import vm from 'node:vm'
import type { TestCase, TestResult } from '../db/schema.js'

const SAFE_GLOBALS = {
  Math,
  Number,
  String,
  Array,
  Object,
  JSON,
  parseInt,
  parseFloat,
  isNaN,
  isFinite,
  Boolean,
  Date,
  // Silence console output from student code
  console: { log: () => {}, error: () => {}, warn: () => {}, info: () => {} },
}

/**
 * Executa o código do aluno contra os test cases da plataforma.
 *
 * Convenção: o código do aluno deve expor uma variável `solution` (função).
 * Ex.: `let solution = function(arr) { return arr.sort() }`
 *
 * Cada test case tem `input` como array de argumentos para chamar `solution(...input)`.
 * A comparação é feita via JSON.stringify para suportar arrays e objetos.
 */
export function runTests(
  code: string,
  testCases: TestCase[],
): { results: TestResult[]; allPassed: boolean } {
  const results: TestResult[] = []

  for (const tc of testCases) {
    let actual: unknown
    let passed = false

    try {
      const sandbox = { solution: undefined as unknown, ...SAFE_GLOBALS }
      vm.createContext(sandbox)
      vm.runInContext(code, sandbox, { timeout: 3000 })

      if (typeof sandbox.solution !== 'function') {
        results.push({
          passed: false,
          input: tc.input,
          expected: tc.expected,
          actual: 'Erro: função "solution" não encontrada no código',
          description: tc.description,
        })
        continue
      }

      const args = Array.isArray(tc.input) ? tc.input : [tc.input]
      actual = (sandbox.solution as (...a: unknown[]) => unknown)(...args)
      passed = JSON.stringify(actual) === JSON.stringify(tc.expected)
    } catch (err) {
      actual = `Erro: ${err instanceof Error ? err.message : String(err)}`
      passed = false
    }

    results.push({
      passed,
      input: tc.input,
      expected: tc.expected,
      actual,
      description: tc.description,
    })
  }

  return {
    results,
    allPassed: results.length > 0 && results.every((r) => r.passed),
  }
}
