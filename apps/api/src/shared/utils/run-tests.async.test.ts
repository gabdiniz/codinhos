import {
  DENIED_WORKER_GLOBALS,
  applyMatcher,
  createCaptureConsole,
  normalizeOutput,
  resolveMaybeAsync,
  resolveTargetFn,
} from '@codinhos/runner'
import { describe, expect, it } from 'vitest'
import type { TestCase } from '../db/schema.js'
import { runTests } from './run-tests.js'

/**
 * async/await no motor: o retorno da função pode ser uma Promise; o runner
 * aguarda antes de comparar. Verifica o backend e a concordância com a réplica
 * do worker (que também aguarda), além do timeout de Promise pendente.
 */

const DENY = DENIED_WORKER_GLOBALS
const DENY_ARGS = DENY.map(() => undefined)

function evalIn(code: string, ret: string, cap?: ReturnType<typeof createCaptureConsole>['console']): unknown {
  if (cap) return new Function(...DENY, 'console', `${code}\nreturn (${ret})`)(...DENY_ARGS, cap)
  return new Function(...DENY, `${code}\nreturn (${ret})`)(...DENY_ARGS)
}

// Réplica async do sandbox.worker.ts.
async function workerPassed(code: string, tc: TestCase, targetFn?: string | null): Promise<boolean> {
  try {
    if (tc.mode === 'stdout') {
      const cap = createCaptureConsole()
      if (Array.isArray(tc.input)) {
        const fn = evalIn(code, resolveTargetFn(code, targetFn) ?? 'undefined', cap.console)
        if (typeof fn === 'function') {
          cap.clear()
          await resolveMaybeAsync((fn as (...a: unknown[]) => unknown)(...(tc.input as unknown[])))
        }
      } else {
        evalIn(code, 'undefined', cap.console)
      }
      const actual = normalizeOutput(cap.getOutput())
      const expected = typeof tc.expected === 'string' ? normalizeOutput(tc.expected) : tc.expected
      return applyMatcher(actual, expected, tc.matcher, tc.tolerance)
    }
    const fn = evalIn(code, resolveTargetFn(code, targetFn) ?? 'undefined')
    if (typeof fn !== 'function') return false
    const actual = await resolveMaybeAsync((fn as (...a: unknown[]) => unknown)(...(tc.input as unknown[])))
    return applyMatcher(actual, tc.expected, tc.matcher, tc.tolerance)
  } catch {
    return false
  }
}

async function backendPassed(code: string, tc: TestCase, targetFn?: string | null): Promise<boolean> {
  return (await runTests(code, [tc], targetFn)).results[0]!.passed
}

const cases: { name: string; code: string; tc: TestCase; targetFn?: string | null; expectPass: boolean }[] = [
  { name: 'função async retorna valor', code: 'async function dobro(n){ return n*2 }', tc: { input: [5], expected: 10, description: 'd' }, expectPass: true },
  { name: 'await interno resolve', code: 'async function f(){ const x = await Promise.resolve(7); return x + 1 }', tc: { input: [], expected: 8, description: 'f' }, expectPass: true },
  { name: 'Promise.all', code: 'async function f(arr){ return await Promise.all(arr.map((x) => Promise.resolve(x*2))) }', tc: { input: [[1, 2, 3]], expected: [2, 4, 6], description: 'f' }, expectPass: true },
  { name: 'stdout com função async', code: 'async function p(){ console.log("a"); await Promise.resolve(); console.log("b") }', tc: { mode: 'stdout', input: [], expected: 'a\nb', description: 'p' }, targetFn: 'p', expectPass: true },
  { name: 'função síncrona ainda funciona', code: 'function soma(a,b){ return a+b }', tc: { input: [2, 3], expected: 5, description: 'soma' }, expectPass: true },
  { name: 'Promise rejeitada reprova', code: 'async function f(){ throw new Error("x") }', tc: { input: [], expected: 1, description: 'f' }, expectPass: false },
  { name: 'resultado async errado reprova', code: 'async function dobro(n){ return n*3 }', tc: { input: [5], expected: 10, description: 'd' }, expectPass: false },
]

describe('async: backend', () => {
  for (const c of cases) {
    it(`${c.name} -> ${c.expectPass ? 'passa' : 'reprova'}`, async () => {
      expect(await backendPassed(c.code, c.tc, c.targetFn)).toBe(c.expectPass)
    })
  }
})

describe('async: backend x front concordam', () => {
  for (const c of cases) {
    it(`concordam: ${c.name}`, async () => {
      expect(await backendPassed(c.code, c.tc, c.targetFn)).toBe(await workerPassed(c.code, c.tc, c.targetFn))
    })
  }
})

describe('timeout de Promise pendente', () => {
  it('rejeita uma Promise que não resolve dentro do limite', async () => {
    await expect(resolveMaybeAsync(new Promise(() => {}), 120)).rejects.toThrow(/Tempo limite/)
  })
})
