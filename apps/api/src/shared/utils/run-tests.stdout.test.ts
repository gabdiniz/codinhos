import {
  DENIED_WORKER_GLOBALS,
  applyMatcher,
  createCaptureConsole,
  normalizeOutput,
  resolveTargetFn,
} from '@codinhos/runner'
import { describe, expect, it } from 'vitest'
import type { TestCase } from '../db/schema.js'
import { runTests } from './run-tests.js'

/**
 * Modo 'stdout' (D2): o desafio compara a SAÍDA impressa com console.log.
 * Verifica o comportamento do backend e a concordância com a réplica do worker.
 */

const DENY = DENIED_WORKER_GLOBALS
const DENY_ARGS = DENY.map(() => undefined)

// Réplica fiel do runStdoutTest do sandbox.worker.ts (mesma lógica, em Node).
function workerStdoutPassed(code: string, tc: TestCase, targetFn?: string | null): boolean {
  try {
    const cap = createCaptureConsole()
    if (Array.isArray(tc.input)) {
      const fnName = resolveTargetFn(code, targetFn)
      const factory = new Function(...DENY, 'console', `${code}\nreturn (${fnName ?? 'undefined'})`)
      const fn = factory(...DENY_ARGS, cap.console)
      if (typeof fn === 'function') {
        cap.clear()
        ;(fn as (...a: unknown[]) => unknown)(...(tc.input as unknown[]))
      }
    } else {
      const factory = new Function(...DENY, 'console', `${code}\nreturn (undefined)`)
      factory(...DENY_ARGS, cap.console)
    }
    const actual = normalizeOutput(cap.getOutput())
    const expected = typeof tc.expected === 'string' ? normalizeOutput(tc.expected) : tc.expected
    return applyMatcher(actual, expected, tc.matcher, tc.tolerance)
  } catch {
    return false
  }
}

function backendPassed(code: string, tc: TestCase, targetFn?: string | null): boolean {
  return runTests(code, [tc], targetFn).results[0]!.passed
}

const tabuada =
  'function tabuada(n){\n for(let i=1;i<=3;i++){ console.log(n + " x " + i + " = " + (n*i)) }\n}'

const cases: { name: string; code: string; tc: TestCase; targetFn?: string | null; expectPass: boolean }[] = [
  { name: 'imprime linhas no topo', code: 'console.log("Ola")\nconsole.log("Mundo")', tc: { mode: 'stdout', input: null, expected: 'Ola\nMundo', description: 's' }, expectPass: true },
  { name: 'tabuada via funcao com input', code: tabuada, tc: { mode: 'stdout', input: [3], expected: '3 x 1 = 3\n3 x 2 = 6\n3 x 3 = 9', description: 's' }, targetFn: 'tabuada', expectPass: true },
  { name: 'numeros e argumentos mistos', code: 'console.log(1, "x", 2, "=", 2)', tc: { mode: 'stdout', input: null, expected: '1 x 2 = 2', description: 's' }, expectPass: true },
  { name: 'tolera espacos a direita e linhas em branco no fim', code: 'console.log("A")\nconsole.log("B")', tc: { mode: 'stdout', input: null, expected: 'A\nB   \n\n', description: 's' }, expectPass: true },
  { name: 'preserva indentacao (ASCII art)', code: 'console.log("  *")\nconsole.log(" ***")\nconsole.log("*****")', tc: { mode: 'stdout', input: null, expected: '  *\n ***\n*****', description: 's' }, expectPass: true },
  { name: 'matcher contains na saida', code: 'for(let i=1;i<=5;i++) console.log(i)', tc: { mode: 'stdout', input: null, expected: '3', matcher: 'contains', description: 's' }, expectPass: true },
  { name: 'matcher regex na saida', code: 'console.log("total: 42")', tc: { mode: 'stdout', input: null, expected: 'total: \\d+', matcher: 'regex', description: 's' }, expectPass: true },
  { name: 'objeto impresso como JSON', code: 'console.log({a:1})', tc: { mode: 'stdout', input: null, expected: '{"a":1}', description: 's' }, expectPass: true },
  { name: 'reprova saida errada', code: 'console.log("oi")', tc: { mode: 'stdout', input: null, expected: 'tchau', description: 's' }, expectPass: false },
]

describe('modo stdout: backend', () => {
  for (const c of cases) {
    it(`${c.name} -> ${c.expectPass ? 'passa' : 'reprova'}`, () => {
      expect(backendPassed(c.code, c.tc, c.targetFn)).toBe(c.expectPass)
    })
  }
})

describe('modo stdout: backend x front concordam', () => {
  for (const c of cases) {
    it(`concordam: ${c.name}`, () => {
      expect(backendPassed(c.code, c.tc, c.targetFn)).toBe(workerStdoutPassed(c.code, c.tc, c.targetFn))
    })
  }
})
