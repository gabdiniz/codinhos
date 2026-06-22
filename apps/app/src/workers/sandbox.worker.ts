/**
 * sandbox.worker.ts
 *
 * Web Worker que executa o código do aluno em contexto isolado do DOM.
 * Usa new Function() — seguro aqui pois o Worker não tem acesso ao DOM.
 *
 * Suporta dois tipos de test case:
 *  - input: unknown[] → chama a primeira função declarada no código com esses args
 *  - input: null      → executa o código e verifica typeof de uma variável
 *                       (nome da variável extraído da description: "nome deve ser ...")
 */

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface TestCase {
  input: unknown
  expected: unknown
  description: string
}

interface TestResult {
  passed: boolean
  input: unknown
  expected: unknown
  actual: unknown
  description: string
  error?: string
  /** err.name (ex.: "TypeError") — usado pra humanizar a mensagem no painel de resultado */
  errorName?: string
}

interface InMessage {
  code: string
  testCases: TestCase[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function deepEqual(a: unknown, b: unknown): boolean {
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

/** Extrai o nome da primeira função declarada no código (function ou arrow). */
function extractFunctionName(code: string): string | null {
  const fnDecl = code.match(/function\s+([a-zA-Z_$][\w$]*)\s*\(/)
  if (fnDecl) return fnDecl[1]
  const arrow = code.match(/(?:const|let)\s+([a-zA-Z_$][\w$]*)\s*=\s*(?:\([^)]*\)|[a-zA-Z_$][\w$]*)\s*=>/)
  if (arrow) return arrow[1]
  return null
}

// ─── Runners ──────────────────────────────────────────────────────────────────

function runFunctionTest(code: string, tc: TestCase): TestResult {
  const fnName = extractFunctionName(code)
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
    // new Function cria uma função nova no escopo do worker (sem acesso ao DOM)
    const getFn = new Function(`${code}\nreturn ${fnName}`) as () => (...a: unknown[]) => unknown
    actual = getFn()(...args)
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
    passed: deepEqual(actual, tc.expected),
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
    const fn = new Function(`${code}\nreturn typeof ${varName}`) as () => string
    actual = fn()
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
  const { code, testCases } = e.data

  const results: TestResult[] = testCases.map((tc) => {
    try {
      if (tc.input === null) {
        return runTypeCheckTest(code, tc)
      }
      return runFunctionTest(code, tc)
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
