/**
 * Captura e formatação de saída de console para o modo de teste 'stdout'.
 *
 * Fundamental: a formatação é PURA e compartilhada entre o backend (node:vm) e
 * o Web Worker do front (new Function). Não usamos o console nativo de cada
 * ambiente (o util.inspect do Node difere do console do navegador) — injetamos
 * este console em ambos, garantindo saída idêntica e, portanto, veredito igual.
 */

/** Formata um argumento de console.log de forma determinística e cross-ambiente. */
export function formatConsoleArg(v: unknown): string {
  if (typeof v === 'string') return v
  if (v === null) return 'null'
  if (v === undefined) return 'undefined'
  if (typeof v === 'number' || typeof v === 'boolean' || typeof v === 'bigint') {
    return String(v)
  }
  try {
    return JSON.stringify(v)
  } catch {
    return String(v)
  }
}

/** Junta os argumentos de uma chamada console.log com espaço (como o console real). */
export function formatConsoleLine(args: unknown[]): string {
  return args.map(formatConsoleArg).join(' ')
}

export interface CaptureConsole {
  /** Console a injetar no sandbox. Só log acumula saída; error/warn/info são no-op. */
  console: {
    log: (...args: unknown[]) => void
    error: (...args: unknown[]) => void
    warn: (...args: unknown[]) => void
    info: (...args: unknown[]) => void
  }
  /** Saída acumulada, uma linha por chamada de console.log, juntadas por \n. */
  getOutput: () => string
  /** Limpa a saída acumulada (usado para isolar a saída de uma chamada de função). */
  clear: () => void
}

export function createCaptureConsole(): CaptureConsole {
  let lines: string[] = []
  return {
    console: {
      log: (...args: unknown[]) => {
        lines.push(formatConsoleLine(args))
      },
      error: () => {},
      warn: () => {},
      info: () => {},
    },
    getOutput: () => lines.join('\n'),
    clear: () => {
      lines = []
    },
  }
}

/**
 * Normaliza a saída para comparação: normaliza quebras de linha, remove espaços
 * ao fim de cada linha e linhas em branco no início/fim. Torna a correção
 * tolerante a diferenças cosméticas de espaçamento.
 */
export function normalizeOutput(s: string): string {
  return s
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map((line) => line.replace(/[ \t]+$/, ''))
    .join('\n')
    .replace(/^\n+/, '')
    .replace(/\n+$/, '')
}
