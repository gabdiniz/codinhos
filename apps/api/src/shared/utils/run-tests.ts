import vm from 'node:vm'
import {
  SAFE_GLOBALS,
  applyMatcher,
  checkAstRule,
  createCaptureConsole,
  normalizeOutput,
  resolveMaybeAsync,
  resolveTargetFn,
} from '@codinhos/runner'
import { getSharedPythonPool, runPythonTests } from '@codinhos/runner-python'
import type { TestCase, TestResult } from '../db/schema.js'

/**
 * Executa o código do aluno contra os test cases (revalidação de nota).
 *
 * Dispatch por linguagem (P1, ver docs/motor-python-capacidades.md): Python
 * roteia pro @codinhos/runner-python (Pyodide); o caminho JS abaixo
 * (runJavaScriptTests) é o de sempre, intocado. `language` é opcional e
 * default 'javascript' — retrocompatível com todo chamador/teste existente
 * que não passa esse argumento.
 */
export async function runTests(
  code: string,
  testCases: TestCase[],
  targetFn?: string | null,
  language: 'javascript' | 'python' = 'javascript',
): Promise<{ results: TestResult[]; allPassed: boolean }> {
  if (language === 'python') {
    return runPythonTests(code, testCases, targetFn, getSharedPythonPool())
  }
  return runJavaScriptTests(code, testCases, targetFn)
}

/**
 * A lógica pura (extração da função, comparação, matchers, globais curados)
 * vem de @codinhos/runner — a MESMA usada pelo Web Worker do front, para que
 * feedback e nota nunca divirjam. Aqui fica só a execução em node:vm.
 *
 * Dois modos:
 *  - input: unknown[] → chama a função-alvo com esses args e compara o retorno
 *  - input: null      → executa o código e verifica typeof de uma variável
 *                       (nome extraído da description: "varName deve ser ...")
 */
async function runJavaScriptTests(
  code: string,
  testCases: TestCase[],
  targetFn?: string | null,
): Promise<{ results: TestResult[]; allPassed: boolean }> {
  const results: TestResult[] = []

  for (const tc of testCases) {
    if (tc.mode === 'ast') {
      // ── AST test (verificação estrutural, sem execução) ───────────────────
      if (!tc.astRule) {
        results.push({
          passed: false,
          input: tc.input,
          expected: tc.expected,
          actual: 'Regra de estrutura não configurada.',
          description: tc.description,
        })
        continue
      }
      const { passed, message } = checkAstRule(code, targetFn, tc.astRule)
      results.push({
        passed,
        input: tc.input,
        expected: tc.expected,
        actual: message,
        description: tc.description,
      })
    } else if (tc.mode === 'stdout') {
      // ── Console-output test ───────────────────────────────────────────────
      // Executa o código capturando console.log e compara a SAÍDA impressa.
      let actual: unknown
      try {
        const cap = createCaptureConsole()
        const sandbox = { ...SAFE_GLOBALS, console: cap.console }
        vm.createContext(sandbox)
        vm.runInContext(code, sandbox, { timeout: 3000 })
        // Se houver input (array), roda a função-alvo e considera só a saída
        // dela (limpa o que foi impresso no topo do código antes de chamar).
        if (Array.isArray(tc.input)) {
          const fnName = resolveTargetFn(code, targetFn)
          const fn = fnName ? vm.runInContext(fnName, sandbox, { timeout: 500 }) : undefined
          if (typeof fn === 'function') {
            cap.clear()
            await resolveMaybeAsync((fn as (...a: unknown[]) => unknown)(...tc.input))
          }
        }
        actual = normalizeOutput(cap.getOutput())
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

      const expected =
        typeof tc.expected === 'string' ? normalizeOutput(tc.expected) : tc.expected
      results.push({
        passed: applyMatcher(actual, expected, tc.matcher, tc.tolerance),
        input: tc.input,
        expected: tc.expected,
        actual,
        description: tc.description,
      })
    } else if (tc.input === null) {
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
      const fnName = resolveTargetFn(code, targetFn)
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

        // Avalia o nome como expressão no contexto (não como propriedade do
        // sandbox): assim acha tanto `function nome()` quanto arrows via
        // const/let — que NÃO viram propriedade do global no node:vm. Alinha
        // ao worker do front, que resolve pela closure do new Function.
        const fn = vm.runInContext(fnName, sandbox, { timeout: 500 })
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
        actual = await resolveMaybeAsync((fn as (...a: unknown[]) => unknown)(...args))
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
        passed: applyMatcher(actual, tc.expected, tc.matcher, tc.tolerance),
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
