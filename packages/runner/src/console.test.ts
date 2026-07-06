import { describe, expect, it } from 'vitest'
import { createCaptureConsole, formatConsoleArg, formatConsoleLine, normalizeOutput } from './index.js'

describe('formatConsoleArg / formatConsoleLine', () => {
  it('formata primitivos como o console (sem aspas em string)', () => {
    expect(formatConsoleArg('oi')).toBe('oi')
    expect(formatConsoleArg(42)).toBe('42')
    expect(formatConsoleArg(true)).toBe('true')
    expect(formatConsoleArg(null)).toBe('null')
    expect(formatConsoleArg(undefined)).toBe('undefined')
  })
  it('formata objetos/arrays como JSON determinístico', () => {
    expect(formatConsoleArg({ a: 1 })).toBe('{"a":1}')
    expect(formatConsoleArg([1, 2])).toBe('[1,2]')
  })
  it('junta múltiplos argumentos com espaço', () => {
    expect(formatConsoleLine([1, 'x', 2, '=', 2])).toBe('1 x 2 = 2')
  })
})

describe('createCaptureConsole', () => {
  it('acumula uma linha por console.log e ignora warn/error/info', () => {
    const cap = createCaptureConsole()
    cap.console.log('a')
    cap.console.warn('ignorado')
    cap.console.log('b', 'c')
    expect(cap.getOutput()).toBe('a\nb c')
  })
  it('clear zera a saída acumulada', () => {
    const cap = createCaptureConsole()
    cap.console.log('x')
    cap.clear()
    cap.console.log('y')
    expect(cap.getOutput()).toBe('y')
  })
})

describe('normalizeOutput', () => {
  it('apara espaços à direita e linhas em branco no início/fim', () => {
    expect(normalizeOutput('  A  \nB\n\n')).toBe('  A\nB')
  })
  it('preserva indentação à esquerda (ASCII art) e linhas internas', () => {
    expect(normalizeOutput('  *\n ***\n*****')).toBe('  *\n ***\n*****')
  })
  it('normaliza CRLF para LF', () => {
    expect(normalizeOutput('a\r\nb')).toBe('a\nb')
  })
})
