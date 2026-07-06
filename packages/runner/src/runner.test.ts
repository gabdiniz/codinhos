import { describe, expect, it } from 'vitest'
import { applyMatcher, deepEqual, extractFunctionName, resolveTargetFn } from './index.js'

describe('deepEqual', () => {
  it('ignora a ordem das chaves de objetos (o bug central)', () => {
    expect(deepEqual({ b: 2, a: 1 }, { a: 1, b: 2 })).toBe(true)
  })
  it('compara objetos aninhados sem ordem', () => {
    expect(deepEqual({ x: { q: 1, p: 2 } }, { x: { p: 2, q: 1 } })).toBe(true)
  })
  it('mantém arrays sensíveis à ordem', () => {
    expect(deepEqual([1, 2, 3], [3, 2, 1])).toBe(false)
  })
  it('compara array de objetos', () => {
    expect(deepEqual([{ a: 1 }], [{ a: 1 }])).toBe(true)
  })
  it('diferencia valores e conjuntos de chaves', () => {
    expect(deepEqual({ a: 1 }, { a: 2 })).toBe(false)
    expect(deepEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false)
  })
  it('trata null vs objeto e primitivos', () => {
    expect(deepEqual(null, { a: 1 })).toBe(false)
    expect(deepEqual(3, 3)).toBe(true)
    expect(deepEqual('a', 'b')).toBe(false)
  })
})

describe('applyMatcher', () => {
  it('equal é o default e ignora ordem de chaves', () => {
    expect(applyMatcher({ b: 2, a: 1 }, { a: 1, b: 2 })).toBe(true)
  })
  it('approx resolve ponto flutuante', () => {
    expect(applyMatcher(0.1 + 0.2, 0.3, 'approx')).toBe(true)
    expect(applyMatcher(0.35, 0.3, 'approx', 1e-9)).toBe(false)
    expect(applyMatcher(0.35, 0.3, 'approx', 0.1)).toBe(true)
    expect(applyMatcher('x', 0.3, 'approx')).toBe(false)
  })
  it('contains cobre string e array', () => {
    expect(applyMatcher('abacaxi', 'baca', 'contains')).toBe(true)
    expect(applyMatcher('abc', 'xyz', 'contains')).toBe(false)
    expect(applyMatcher([1, 2, 3], 2, 'contains')).toBe(true)
    expect(applyMatcher([{ a: 1 }, { b: 2 }], { b: 2 }, 'contains')).toBe(true)
  })
  it('regex testa contra String(actual) e não estoura com padrão inválido', () => {
    expect(applyMatcher('codi-123', '^codi-\\d+$', 'regex')).toBe(true)
    expect(applyMatcher('abc', '^\\d+$', 'regex')).toBe(false)
    expect(applyMatcher('abc', '(', 'regex')).toBe(false)
  })
})

describe('extractFunctionName / resolveTargetFn', () => {
  it('extrai function declaration e arrow', () => {
    expect(extractFunctionName('function soma(a,b){return a+b}')).toBe('soma')
    expect(extractFunctionName('const dobro = (n) => n*2')).toBe('dobro')
  })
  it('pega a primeira função declarada e null quando não há', () => {
    expect(extractFunctionName('function ajuda(){}\nfunction principal(){}')).toBe('ajuda')
    expect(extractFunctionName('const x = 5')).toBe(null)
  })
  it('resolveTargetFn prioriza targetFn e cai para a primeira quando ausente', () => {
    expect(resolveTargetFn('function ajuda(){}\nfunction principal(){}', 'principal')).toBe('principal')
    expect(resolveTargetFn('function ajuda(){}', null)).toBe('ajuda')
    expect(resolveTargetFn('function ajuda(){}', '  ')).toBe('ajuda')
  })
})
