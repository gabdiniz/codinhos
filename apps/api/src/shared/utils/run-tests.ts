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
 * Extrai o nome da primeira função declarada no código (function ou arrow).
 * Mesma lógica do sandbox.worker.ts do frontend.
 */
function extractFunctionName(code: string): string | null {
  const fnDecl = code.match(/function\s+([a-zA-Z_$][\w$]*)\s*\(/)
  if (fnDecl) return fnDecl[1]
  const arrow = code.match(/(?:const|let)\s+([a-zA-Z_$][\w$]*)\s*=\s*(?:\([^)]*\)|[a-zA-Z_$][\w$]*)\s*=>/)
  if (arrow) return arrow[1]
  return null
}

/**
 * Executa o código do aluno contra os test cases.
 *
 * Suporta dois modos:
 *  - input: unknown[] → chama a primeira função encontrada no código com esses args
 *  - input: null      → executa o código e verifica typeof de uma variável
 *                       (nome extraído da description: "varName deve ser do tipo ...")
 *
 * Comparação para function tests: JSON.stringify (suporta arrays e objetos).
 * Comparação para type-check tests: igualdade estrita de string.
 */
export function runTests(
  code: string,
  testCases: TestCase[],
): { results: TestResult[]; allPassed: boolean } {
  const results: TestResult[] = []

  for (const tc of testCases) {
    if (tc.input === null) {
      // ── Type-check test ───────────────────────────────────────────────────
      const varMatch = (tc.description as string).match(/^([a-zA-Z_$][\w$]*)/)
      if (!varMatch) {
        results.push({
          passed: false,
          input: null,
          expected: tc.expected,
          actual: 'Não foi possível identificar a variável no enunciado.',
          description: tc.description,
        })
        continue
      }

      const varName = varMatch[1]
      let actual: unknown

      try {
        const sandbox = { ...SAFE_GLOBALS }
        vm.createContext(sandbox)
        vm.runInContext(code, sandbox, { timeout: 3000 })
        const typeCode = `typeof ${varName}`
        actual = vm.runInContext(typeCode, sandbox, { timeout: 500 })
      } catch (err) {
        results.push({
          passed: false,
          input: null,
          expected: tc.expected,
          actual: `Erro: ${err instanceof Error ? err.message : String(err)}`,
          description: tc.description,
        })
        continue
      }

      results.push({
        passed: actual === tc.expected,
        input: null,
        expected: tc.expected,
        actual,
        description: tc.description,
      })
    } else {
      // ── Function-call test ────────────────────────────────────────────────
      const fnName = extractFunctionName(code)
      if (!fnName) {
        results.push({
          passed: false,
          input: tc.input,
          expected: tc.expected,
          actual: 'Nenhuma função encontrada. Declare uma função com function ou arrow function.',
          description: tc.description,
        })
        continue
      }

      let actual: unknown
      try {
        const sandbox = { ...SAFE_GLOBALS }
        vm.createContext(sandbox)
        vm.runInContext(code, sandbox, { timeout: 3000 })

        const fn = (sandbox as Record<string, unknown>)[fnName]
        if (typeof fn !== 'function') {
          results.push({
            passed: false,
            input: tc.input,
            expected: tc.expected,
            actual: `Função "${fnName}" não encontrada após execução.`,
            description: tc.description,
          })
          continue
        }

        const args = Array.isArray(tc.input) ? tc.input : [tc.input]
        actual = (fn as (...a: unknown[]) => unknown)(...args)
      } catch (err) {
        results.push({
          passed: false,
          input: tc.input,
          expected: tc.expected,
          actual: `Erro: ${err instanceof Error ? err.message : String(err)}`,
          description: tc.description,
        })
        continue
      }

      results.push({
        passed: JSON.stringify(actual) === JSON.stringify(tc.expected),
        input: tc.input,
        expected: tc.expected,
        actual,
        description: tc.description,
      })
    }
  }

  return {
    results,
    allPassed: results.length > 0 && results.every((r) => r.passed),
  }
}
