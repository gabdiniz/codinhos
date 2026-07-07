import { describe, expect, it } from 'vitest'
import { isThenable, resolveMaybeAsync } from './index.js'

describe('isThenable', () => {
  it('detecta Promises e objetos com .then', () => {
    expect(isThenable(Promise.resolve(1))).toBe(true)
    expect(isThenable({ then: () => {} })).toBe(true)
    expect(isThenable(42)).toBe(false)
    expect(isThenable(null)).toBe(false)
    expect(isThenable('oi')).toBe(false)
  })
})

describe('resolveMaybeAsync', () => {
  it('retorna valores síncronos direto', async () => {
    expect(await resolveMaybeAsync(10)).toBe(10)
    expect(await resolveMaybeAsync('x')).toBe('x')
  })
  it('aguarda uma Promise que resolve', async () => {
    expect(await resolveMaybeAsync(Promise.resolve(7))).toBe(7)
  })
  it('propaga rejeição', async () => {
    await expect(resolveMaybeAsync(Promise.reject(new Error('nope')))).rejects.toThrow('nope')
  })
  it('estoura timeout numa Promise pendente', async () => {
    await expect(resolveMaybeAsync(new Promise(() => {}), 100)).rejects.toThrow(/Tempo limite/)
  })
})
