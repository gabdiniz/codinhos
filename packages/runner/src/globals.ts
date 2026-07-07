/**
 * Ambiente de execução curado — fonte única para os dois runners.
 *
 * O backend (node:vm) usa SAFE_GLOBALS como sandbox: só esses nomes ficam
 * disponíveis como globais (mais os intrínsecos de JS do próprio contexto vm).
 *
 * O Web Worker do front executa via new Function e, por padrão, enxerga TODOS
 * os globais do Worker (fetch, WebSocket, importScripts...). Para alinhar ao
 * backend, esses nomes web-only são sombreados como parâmetros undefined —
 * ver DENIED_WORKER_GLOBALS. Não sombreamos intrínsecos de JS (Object, Array,
 * Function, eval...) porque o contexto vm do backend também os expõe.
 */

/** Console silencioso — a saída do aluno não é comparada (hoje). */
const silentConsole = {
  log: () => {},
  error: () => {},
  warn: () => {},
  info: () => {},
}

// setTimeout/clearTimeout (do Node no backend) — necessários para desafios
// async ("espere e então..."). O worker do front já os expõe nativamente, então
// incluí-los aqui mantém os dois lados iguais. Pegamos do globalThis para não
// exigir as libs DOM/node no tsconfig do pacote.
const timers = globalThis as unknown as {
  setTimeout: (cb: (...a: unknown[]) => void, ms?: number) => unknown
  clearTimeout: (id: unknown) => void
}

/** Whitelist de globais para o sandbox do backend (node:vm). */
export const SAFE_GLOBALS = {
  Math,
  Number,
  String,
  Array,
  Object,
  JSON,
  parseInt,
  parseFloat,
  isNaN,
  isFinite,
  Boolean,
  Date,
  setTimeout: timers.setTimeout,
  clearTimeout: timers.clearTimeout,
  console: silentConsole,
} as const

/**
 * Globais web-only que o Worker expõe mas o backend não — sombreados como
 * parâmetros undefined na função do aluno para manter os dois lados iguais.
 */
export const DENIED_WORKER_GLOBALS = [
  'self',
  'fetch',
  'XMLHttpRequest',
  'WebSocket',
  'importScripts',
  'postMessage',
  'addEventListener',
  'removeEventListener',
  'indexedDB',
  'caches',
  'navigator',
  'location',
] as const
