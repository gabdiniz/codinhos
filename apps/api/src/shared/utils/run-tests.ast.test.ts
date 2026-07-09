import { describe, expect, it } from 'vitest'
import type { TestCase } from '../db/schema.js'
import { runTests } from './run-tests.js'

/** Modo 'ast' (verificação estrutural) via runTests. checkAstRule é puro e
 * compartilhado com o worker, então back e front dão o mesmo veredito. */
async function passed(code: string, tc: TestCase, targetFn?: string | null): Promise<boolean> {
  return (await runTests(code, [tc], targetFn)).results[0]!.passed
}

const recursao = (): TestCase => ({ input: null, expected: '', description: 'usa recursão', mode: 'ast', astRule: { kind: 'requireRecursion' } })
const semLoop = (): TestCase => ({ input: null, expected: '', description: 'sem laço', mode: 'ast', astRule: { kind: 'forbidLoops' } })

describe('runTests — modo ast', () => {
  it('requireRecursion passa na solução recursiva e reprova na iterativa', async () => {
    expect(await passed('function fat(n){ return n<=1?1:n*fat(n-1) }', recursao(), 'fat')).toBe(true)
    expect(await passed('function fat(n){ let r=1; for(let i=2;i<=n;i++) r*=i; return r }', recursao(), 'fat')).toBe(false)
  })
  it('forbidLoops reprova for e não falseia com comentário contendo "for"', async () => {
    expect(await passed('function f(){ for(let i=0;i<3;i++){} }', semLoop(), 'f')).toBe(false)
    expect(await passed('function fat(n){ // resolva sem for\n return n<=1?1:n*fat(n-1) }', semLoop(), 'fat')).toBe(true)
  })
  it('astRule ausente reprova (não trava)', async () => {
    const r = (await runTests('function f(){}', [{ input: null, expected: '', description: 'x', mode: 'ast' }], 'f')).results[0]!
    expect(r.passed).toBe(false)
  })
})
