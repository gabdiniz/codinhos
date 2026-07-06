/**
 * sandbox.worker.ts
 *
 * Web Worker que executa o código do aluno em contexto isolado do DOM.
 * Usa new Function() — seguro aqui pois o Worker não tem acesso ao DOM.
 *
 * A lógica pura (extração da função, comparação, matchers, lista de globais
 * curados) vem de @codinhos/runner — a MESMA usada pela API na revalidação da
 * nota, para que feedback e nota nunca divirjam. Aqui fica só a execução.
 *
 * Globais web-only (fetch, WebSocket, self...) são sombreados como parâmetros
 * undefined para aproximar o ambiente do sandbox node:vm do backend.
 *
 * Dois tipos de test case:
 *  - input: unknown[] → chama a função-alvo com esses args
 *  - input: null      → executa o código e verifica typeof de uma variável
 */
import {
  DENIED_WORKER_GLOBALS,
  applyMatcher,
  resolveTargetFn,
  type TestCase,
  type TestResult,
} from '@codinhos/runner'

interface InMessage {
  code: string
  testCases: TestCase[]
  /** Função avaliada; ausente = primeira declarada (retrocompatível). */
  targetFn?: string | null
}

// Nomes de globais web-only sombreados na função do aluno (viram undefined).
const DENY = DENIED_WORKER_GLOBALS
const DENY_ARGS = DENY.map(() => undefined)

/**
 * Compila o código do aluno numa função nova, com os globais web-only
 * sombreados, e retorna o valor da expressão `retExpr` (ex.: "nomeFn" ou
 * "typeof x"). O Worker não tem DOM; new Function roda no escopo do worker.
 */
function evalInSandbox(code: string, retExpr: string): unknown {
  const factory = new Function(...DENY, `${code}\nreturn (${retExpr})`)
  return factory(...DENY_ARGS)
}

// ─── Runners ──────────────────────────────────────────────────────────────────

function runFunctionTest(code: string, tc: TestCase, targetFn?: string | null): TestResult {
  const fnName = resolveTargetFn(code, targetFn)
  if (!fnName) {
    return {
      passed: false,
      input: tc.input,
      expected: tc.expected,
      actual: undefined,
      description: tc.description,
      error: 'Nenhuma função encontrada. Declare uma função com function ou arrow function.',
    }
  }

  const args = tc.input as unknown[]
  let actual: unknown
  try {
    const fn = evalInSandbox(code, fnName) as (...a: unknown[]) => unknown
    actual = fn(...args)
  } catch (err) {
    return {
      passed: false,
      input: tc.input,
      expected: tc.expected,
      actual: undefined,
      description: tc.description,
      error: err instanceof Error ? err.message : String(err),
      errorName: err instanceof Error ? err.name : undefined,
    }
  }

  return {
    passed: applyMatcher(actual, tc.expected, tc.matcher, tc.tolerance),
    input: tc.input,
    expected: tc.expected,
    actual,
    description: tc.description,
  }
}

function runTypeCheckTest(code: string, tc: TestCase): TestResult {
  // Extrai nome da variável a partir da description:
  // Ex: "nome deve ser do tipo string" → "nome"
  const varMatch = (tc.description as string).match(/^([a-zA-Z_$][\w$]*)/)
  if (!varMatch) {
    return {
      passed: false,
      input: null,
      expected: tc.expected,
      actual: undefined,
      description: tc.description,
      error: 'Não foi possível identificar a variável no enunciado.',
    }
  }
  const varName = varMatch[1]

  let actual: unknown
  try {
    actual = evalInSandbox(code, `typeof ${varName}`)
  } catch (err) {
    return {
      passed: false,
      input: null,
      expected: tc.expected,
      actual: undefined,
      description: tc.description,
      error: err instanceof Error ? err.message : String(err),
      errorName: err instanceof Error ? err.name : undefined,
    }
  }

  return {
    passed: actual === tc.expected,
    input: null,
    expected: tc.expected,
    actual,
    description: tc.description,
  }
}

// ─── Message handler ──────────────────────────────────────────────────────────

self.addEventListener('message', (e: MessageEvent<InMessage>) => {
  const { code, testCases, targetFn } = e.data

  const results: TestResult[] = testCases.map((tc) => {
    try {
      if (tc.input === null) {
        return runTypeCheckTest(code, tc)
      }
      return runFunctionTest(code, tc, targetFn)
    } catch (err) {
      return {
        passed: false,
        input: tc.input,
        expected: tc.expected,
        actual: undefined,
        description: tc.description,
        error: err instanceof Error ? err.message : String(err),
        errorName: err instanceof Error ? err.name : undefined,
      }
    }
  })

  self.postMessage({ results })
})
