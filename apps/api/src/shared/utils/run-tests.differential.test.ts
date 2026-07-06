import { DENIED_WORKER_GLOBALS, applyMatcher, resolveTargetFn } from '@codinhos/runner'
import { describe, expect, it } from 'vitest'
import type { TestCase } from '../db/schema.js'
import { runTests } from './run-tests.js'

/**
 * Verificação DIFERENCIAL do motor: garante que o runner do backend (node:vm,
 * via runTests) e o runner do front (Web Worker, new Function) chegam ao MESMO
 * veredito. Como o worker roda no navegador, replicamos aqui a sua execução
 * usando as mesmas funções puras de @codinhos/runner que o worker usa.
 */

const DENY = DENIED_WORKER_GLOBALS
const DENY_ARGS = DENY.map(() => undefined)

/** Réplica fiel do sandbox.worker.ts (mesma lógica, ambiente Node). */
function workerPassed(code: string, tc: TestCase, targetFn?: string | null): boolean {
  try {
    if (tc.input === null) {
      const varName = (tc.description as string).match(/^([a-zA-Z_$][\w$]*)/)?.[1]
      const factory = new Function(...DENY, `${code}\nreturn (typeof ${varName})`)
      return factory(...DENY_ARGS) === tc.expected
    }
    const fnName = resolveTargetFn(code, targetFn)
    if (!fnName) return false
    const factory = new Function(...DENY, `${code}\nreturn (${fnName})`)
    const fn = factory(...DENY_ARGS) as (...a: unknown[]) => unknown
    if (typeof fn !== 'function') return false
    const actual = fn(...(tc.input as unknown[]))
    return applyMatcher(actual, tc.expected, tc.matcher, tc.tolerance)
  } catch {
    return false
  }
}

function backendPassed(code: string, tc: TestCase, targetFn?: string | null): boolean {
  return runTests(code, [tc], targetFn).results[0]!.passed
}

type Case = { name: string; code: string; tc: TestCase; targetFn?: string | null }

const cases: Case[] = [
  { name: 'igualdade simples', code: 'function soma(a,b){return a+b}', tc: { input: [2, 3], expected: 5, description: 'soma' } },
  { name: 'objeto com chaves fora de ordem (bug antigo)', code: 'function p(){return {b:2,a:1}}', tc: { input: [], expected: { a: 1, b: 2 }, description: 'p' } },
  { name: 'array de objetos fora de ordem', code: 'function l(){return [{y:2,x:1}]}', tc: { input: [], expected: [{ x: 1, y: 2 }], description: 'l' } },
  { name: 'arrow via const (bug antigo do backend)', code: 'const dobro = (n) => n*2', tc: { input: [4], expected: 8, description: 'dobro' } },
  { name: 'targetFn com helper antes da principal', code: 'function ajuda(n){return n*2}\nfunction principal(n){return ajuda(n)+1}', tc: { input: [5], expected: 11, description: 'principal' }, targetFn: 'principal' },
  { name: 'fallback pega a primeira função', code: 'function ajuda(n){return n*2}\nfunction principal(n){return ajuda(n)+1}', tc: { input: [5], expected: 10, description: 'ajuda' } },
  { name: 'matcher approx (ponto flutuante)', code: 'function m(){return 0.1+0.2}', tc: { input: [], expected: 0.3, description: 'm', matcher: 'approx' } },
  { name: 'matcher contains em array', code: 'function n(){return [1,2,3]}', tc: { input: [], expected: 2, description: 'n', matcher: 'contains' } },
  { name: 'matcher regex', code: 'function id(){return "codi-42"}', tc: { input: [], expected: '^codi-\\d+$', description: 'id', matcher: 'regex' } },
  { name: 'type-check de variável', code: 'const nome = "Ana"', tc: { input: null, expected: 'string', description: 'nome deve ser string' } },
  { name: 'reprova nos dois quando resultado errado', code: 'function soma(a,b){return a-b}', tc: { input: [2, 3], expected: 5, description: 'soma' } },
]

describe('runner diferencial: backend (node:vm) x front (worker)', () => {
  for (const c of cases) {
    it(`concordam: ${c.name}`, () => {
      const back = backendPassed(c.code, c.tc, c.targetFn)
      const front = workerPassed(c.code, c.tc, c.targetFn)
      expect(back).toBe(front)
    })
  }

  it('objeto fora de ordem agora PASSA nos dois (falso-vermelho corrigido)', () => {
    const c = cases[1]!
    expect(backendPassed(c.code, c.tc)).toBe(true)
    expect(workerPassed(c.code, c.tc)).toBe(true)
  })

  it('arrow via const agora PASSA no backend (antes falhava)', () => {
    const c = cases[3]!
    expect(backendPassed(c.code, c.tc)).toBe(true)
  })
})
