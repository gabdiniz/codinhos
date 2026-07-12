/**
 * Dispatch de alto nível: roda os testCases de um desafio Python contra o
 * pool de Pyodide e devolve TestResult[] — equivalente Python do runTests de
 * apps/api/src/shared/utils/run-tests.ts, reusando os MESMOS tipos e a MESMA
 * lógica de matcher/normalização de @codinhos/runner (fonte única de
 * comparação, igual ao motor JS já garante entre front/back).
 *
 * Escopo (ver docs/motor-python-capacidades.md): function-call, type-check
 * (input null), stdout, instance-call (G7 — instancia uma classe e chama um
 * método nela, comparando o RETORNO do método) e ast (G5 — verificação
 * estrutural via `ast.parse` real do Python, nunca executa o código do aluno).
 */
import { applyMatcher, normalizeOutput, type TestCase, type TestResult } from '@codinhos/runner'
import { resolveTargetClassPython, resolveTargetFnPython } from './extract.js'
import type { PythonRunner } from './python-exec.js'

/**
 * Dispatch puro em relação ao transporte — recebe qualquer `PythonRunner`
 * (o pool de worker_threads do backend, ou o adaptador em processo do Web
 * Worker do front). Por isso este arquivo não importa `pool.ts` (Node-only);
 * quem quiser rodar isso no navegador importa só
 * `@codinhos/runner-python/run-python-tests` (subpath), sem puxar `node:worker_threads`.
 */
export async function runPythonTests(
  code: string,
  testCases: TestCase[],
  targetFn: string | null | undefined,
  pool: PythonRunner,
): Promise<{ results: TestResult[]; allPassed: boolean }> {
  const results: TestResult[] = []

  for (const tc of testCases) {
    if (tc.mode === 'ast') {
      results.push(await runAstCase(code, tc, targetFn, pool))
      continue
    }

    if (tc.mode === 'stdout') {
      results.push(await runStdoutCase(code, tc, targetFn, pool))
      continue
    }

    if (tc.mode === 'instance-call') {
      results.push(await runInstanceCase(code, tc, pool))
      continue
    }

    if (tc.input === null) {
      results.push(await runTypeCheckCase(code, tc, pool))
      continue
    }

    results.push(await runFunctionCase(code, tc, targetFn, pool))
  }

  return {
    results,
    allPassed: results.length > 0 && results.every((r) => r.passed),
  }
}

async function runStdoutCase(
  code: string,
  tc: TestCase,
  targetFn: string | null | undefined,
  pool: PythonRunner,
): Promise<TestResult> {
  const args = Array.isArray(tc.input) ? tc.input : null
  const fnName = args ? resolveTargetFnPython(code, targetFn) : null
  const res = await pool.run({ code, op: 'stdout', targetFn: fnName, args })

  if (!res.ok) {
    return {
      passed: false,
      input: tc.input,
      expected: tc.expected,
      actual: res.errorMessage ?? 'Erro desconhecido.',
      description: tc.description,
    }
  }

  const actual = normalizeOutput(res.output ?? '')
  const expected = typeof tc.expected === 'string' ? normalizeOutput(tc.expected) : tc.expected
  return {
    passed: applyMatcher(actual, expected, tc.matcher, tc.tolerance),
    input: tc.input,
    expected: tc.expected,
    actual,
    description: tc.description,
  }
}

async function runTypeCheckCase(
  code: string,
  tc: TestCase,
  pool: PythonRunner,
): Promise<TestResult> {
  const varMatch = (tc.description as string).match(/^([a-zA-Z_]\w*)/)
  if (!varMatch) {
    return {
      passed: false,
      input: null,
      expected: tc.expected,
      actual: 'Não foi possível identificar a variável no enunciado.',
      description: tc.description,
    }
  }

  const res = await pool.run({ code, op: 'typecheck', varName: varMatch[1] })
  if (!res.ok) {
    return {
      passed: false,
      input: null,
      expected: tc.expected,
      actual: res.errorMessage ?? 'Erro desconhecido.',
      description: tc.description,
    }
  }

  return {
    passed: res.actualType === tc.expected,
    input: null,
    expected: tc.expected,
    actual: res.actualType,
    description: tc.description,
  }
}

async function runFunctionCase(
  code: string,
  tc: TestCase,
  targetFn: string | null | undefined,
  pool: PythonRunner,
): Promise<TestResult> {
  const fnName = resolveTargetFnPython(code, targetFn)
  if (!fnName) {
    return {
      passed: false,
      input: tc.input,
      expected: tc.expected,
      actual: 'Nenhuma função encontrada. Declare uma função com def.',
      description: tc.description,
    }
  }

  const args = Array.isArray(tc.input) ? tc.input : [tc.input]
  const res = await pool.run({ code, op: 'function', targetFn: fnName, args })
  if (!res.ok) {
    return {
      passed: false,
      input: tc.input,
      expected: tc.expected,
      actual: res.errorMessage ?? 'Erro desconhecido.',
      description: tc.description,
    }
  }

  // actualJson vem de json.dumps no lado Python — round-trip seguro pro
  // applyMatcher (mesma comparação usada em JS). actualRepr/actualType (não
  // usados aqui) ficam disponíveis em `res` pra quem quiser exibir com mais
  // fidelidade (ex.: distinguir tuple de list na UI) sem afetar a nota.
  const actual = res.actualJson ? JSON.parse(res.actualJson) : null
  return {
    passed: applyMatcher(actual, tc.expected, tc.matcher, tc.tolerance),
    input: tc.input,
    expected: tc.expected,
    actual,
    description: tc.description,
  }
}

/**
 * G5 — verificação estrutural (recursão/laços/método/chamada). NUNCA executa
 * `code`, só `ast.parse` do lado do worker (ver `handleAstCheck` em
 * python-exec.ts) — por isso não passa pelo `op: 'function'`/`'stdout'`
 * normal. `targetFn` é resolvido aqui (mesma convenção de runFunctionCase)
 * pra `requireRecursion` conseguir achar a função certa mesmo quando o
 * desafio não passa um alvo explícito.
 */
async function runAstCase(
  code: string,
  tc: TestCase,
  targetFn: string | null | undefined,
  pool: PythonRunner,
): Promise<TestResult> {
  const fnName = resolveTargetFnPython(code, targetFn)
  const res = await pool.run({
    code,
    op: 'ast',
    astRuleKind: tc.astRule?.kind ?? null,
    astRuleName: tc.astRule?.name ?? null,
    targetFn: fnName,
  })

  if (!res.ok) {
    return {
      passed: false,
      input: tc.input,
      expected: tc.expected,
      actual: res.errorMessage ?? 'Erro desconhecido.',
      description: tc.description,
    }
  }

  return {
    passed: res.astPassed ?? false,
    input: tc.input,
    expected: tc.expected,
    actual: res.astMessage ?? '',
    description: tc.description,
  }
}

/**
 * G7 — instancia a classe (className do desafio, ou a primeira `class` do
 * código) com `constructorArgs`, chama `methodName` nela com `input` (os
 * argumentos do MÉTODO — mesma convenção de array/valor único do
 * function-call), e compara o RETORNO do método. Diferente da trilha 9 atual
 * (100% stdout, print), isso permite testar o VALOR de volta de um método,
 * sem depender do aluno imprimir nada.
 */
async function runInstanceCase(code: string, tc: TestCase, pool: PythonRunner): Promise<TestResult> {
  const className = resolveTargetClassPython(code, tc.className)
  if (!className) {
    return {
      passed: false,
      input: tc.input,
      expected: tc.expected,
      actual: 'Nenhuma classe encontrada. Declare uma classe com class.',
      description: tc.description,
    }
  }

  if (!tc.methodName) {
    return {
      passed: false,
      input: tc.input,
      expected: tc.expected,
      actual: 'Nenhum método especificado no desafio (methodName ausente).',
      description: tc.description,
    }
  }

  const methodArgs = Array.isArray(tc.input) ? tc.input : [tc.input]
  const res = await pool.run({
    code,
    op: 'instance',
    className,
    constructorArgs: tc.constructorArgs ?? [],
    methodName: tc.methodName,
    args: methodArgs,
  })

  if (!res.ok) {
    return {
      passed: false,
      input: tc.input,
      expected: tc.expected,
      actual: res.errorMessage ?? 'Erro desconhecido.',
      description: tc.description,
    }
  }

  const actual = res.actualJson ? JSON.parse(res.actualJson) : null
  return {
    passed: applyMatcher(actual, tc.expected, tc.matcher, tc.tolerance),
    input: tc.input,
    expected: tc.expected,
    actual,
    description: tc.description,
  }
}
