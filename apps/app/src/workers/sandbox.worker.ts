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
  type CaptureConsole,
  DENIED_WORKER_GLOBALS,
  applyMatcher,
  checkAstRule,
  createCaptureConsole,
  normalizeOutput,
  resolveMaybeAsync,
  resolveTargetFn,
  type TestCase,
  type TestResult,
} from '@codinhos/runner'
import { handleRequest, type PythonRunner, type RunRequest } from '@codinhos/runner-python/python-exec'
import { runPythonTests } from '@codinhos/runner-python/run-python-tests'
import type { PyodideInterface } from 'pyodide'

interface InMessage {
  code: string
  testCases: TestCase[]
  /** Função avaliada; ausente = primeira declarada (retrocompatível). */
  targetFn?: string | null
  /** 'python' roteia pro Pyodide (ver runPython abaixo); ausente/'javascript' = caminho de sempre. */
  language?: 'javascript' | 'python'
}

// Nomes de globais web-only sombreados na função do aluno (viram undefined).
const DENY = DENIED_WORKER_GLOBALS
const DENY_ARGS = DENY.map(() => undefined)

// ─── Python (Pyodide) ───────────────────────────────────────────────────────
//
// Carregado sob demanda (import dinâmico) — desafios em JS (a maioria, hoje
// 100%) nunca pagam o custo de sequer baixar o módulo `pyodide`. Uma vez
// carregada, a instância fica viva no ESCOPO DESTE WORKER (módulo, não por
// mensagem) — o app (ChallengePage.tsx) mantém o worker vivo entre cliques em
// "Executar" quando o desafio é Python, exatamente pra reaproveitar esse load
// (medido em spike no backend: ~4s frio, ~10ms já quente — mesma lógica que
// justifica o pool de worker_threads da API, ver docs/motor-python-capacidades.md).
//
// Isolamento entre execuções: cada RunRequest usa um globals novo dentro de
// `handleRequest` (packages/runner-python/src/python-exec.ts) — a MESMA
// função usada pelo backend, então uma variável de uma rodada não vaza pra
// próxima mesmo reaproveitando a instância.
let pyodidePromise: Promise<PyodideInterface> | null = null

function getPyodide(): Promise<PyodideInterface> {
  if (!pyodidePromise) {
    pyodidePromise = import('pyodide')
      .then(({ loadPyodide }) =>
        loadPyodide({
          // Assets self-hosted (copiados de node_modules/pyodide em
          // postinstall, ver apps/app/scripts/copy-pyodide-assets.mjs) — sem
          // CDN, mesmo princípio do p5.js embarcado no modo visual.
          indexURL: new URL('/pyodide/', self.location.origin).toString(),
        }),
      )
      .catch((err) => {
        // Sem isso, uma falha de load (ex.: 404 nos assets por esquecer o
        // postinstall) ficaria cacheada pra sempre — nenhum "Executar"
        // seguinte tentaria de novo, nem depois do problema ser corrigido.
        pyodidePromise = null
        throw err
      })
  }
  return pyodidePromise
}

let nextPyRequestId = 1

/** Roda os testCases de um desafio Python — reusa o MESMO dispatch do backend. */
async function runPython(
  code: string,
  testCases: TestCase[],
  targetFn: string | null | undefined,
): Promise<TestResult[]> {
  const pyodide = await getPyodide()
  // Adaptador em processo: satisfaz PythonRunner sem precisar de um pool de
  // worker_threads (não existe no navegador) — só chama handleRequest direto
  // na instância já carregada deste worker.
  const runner: PythonRunner = {
    run: async (req: Omit<RunRequest, 'id'>) => handleRequest(pyodide, { ...req, id: nextPyRequestId++ }),
  }
  const { results } = await runPythonTests(code, testCases, targetFn, runner)
  return results
}

/**
 * Compila o código do aluno numa função nova, com os globais web-only
 * sombreados, e retorna o valor da expressão `retExpr` (ex.: "nomeFn" ou
 * "typeof x"). O Worker não tem DOM; new Function roda no escopo do worker.
 */
function evalInSandbox(
  code: string,
  retExpr: string,
  captureConsole?: CaptureConsole['console'],
): unknown {
  if (captureConsole) {
    // console vira parâmetro (sombreia o global) -> console.log do aluno é capturado
    const factory = new Function(...DENY, 'console', `${code}\nreturn (${retExpr})`)
    return factory(...DENY_ARGS, captureConsole)
  }
  const factory = new Function(...DENY, `${code}\nreturn (${retExpr})`)
  return factory(...DENY_ARGS)
}

// ─── Runners ──────────────────────────────────────────────────────────────────

async function runFunctionTest(code: string, tc: TestCase, targetFn?: string | null): Promise<TestResult> {
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
    actual = await resolveMaybeAsync(fn(...args))
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

async function runStdoutTest(code: string, tc: TestCase, targetFn?: string | null): Promise<TestResult> {
  let actual: unknown
  try {
    const cap = createCaptureConsole()
    if (Array.isArray(tc.input)) {
      const fnName = resolveTargetFn(code, targetFn)
      const fn = evalInSandbox(code, fnName ?? 'undefined', cap.console)
      if (typeof fn === 'function') {
        cap.clear()
        await resolveMaybeAsync((fn as (...a: unknown[]) => unknown)(...(tc.input as unknown[])))
      }
    } else {
      evalInSandbox(code, 'undefined', cap.console)
    }
    actual = normalizeOutput(cap.getOutput())
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

  const expected = typeof tc.expected === 'string' ? normalizeOutput(tc.expected) : tc.expected
  return {
    passed: applyMatcher(actual, expected, tc.matcher, tc.tolerance),
    input: tc.input,
    expected: tc.expected,
    actual,
    description: tc.description,
  }
}

function runAstTest(code: string, tc: TestCase, targetFn?: string | null): TestResult {
  if (!tc.astRule) {
    return {
      passed: false,
      input: tc.input,
      expected: tc.expected,
      actual: undefined,
      description: tc.description,
      error: 'Regra de estrutura não configurada.',
    }
  }
  const { passed, message } = checkAstRule(code, targetFn, tc.astRule)
  return {
    passed,
    input: tc.input,
    expected: tc.expected,
    actual: message,
    description: tc.description,
  }
}

// ─── Message handler ──────────────────────────────────────────────────────────

self.addEventListener('message', async (e: MessageEvent<InMessage>) => {
  const { code, testCases, targetFn, language } = e.data

  if (language === 'python') {
    try {
      const results = await runPython(code, testCases, targetFn)
      self.postMessage({ results })
    } catch (err) {
      self.postMessage({
        results: [
          {
            passed: false,
            input: null,
            expected: null,
            actual: undefined,
            description: 'Erro ao inicializar o ambiente Python.',
            error: err instanceof Error ? err.message : String(err),
          },
        ],
      })
    }
    return
  }

  const results: TestResult[] = await Promise.all(
    testCases.map(async (tc): Promise<TestResult> => {
      try {
        if (tc.mode === 'ast') {
          return runAstTest(code, tc, targetFn)
        }
        if (tc.mode === 'stdout') {
          return await runStdoutTest(code, tc, targetFn)
        }
        if (tc.input === null) {
          return runTypeCheckTest(code, tc)
        }
        return await runFunctionTest(code, tc, targetFn)
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
    }),
  )

  self.postMessage({ results })
})
