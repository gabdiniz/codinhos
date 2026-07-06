/**
 * @codinhos/runner — lógica pura compartilhada do runner de desafios.
 *
 * Importado tanto pela API (node:vm) quanto pelo Web Worker do front
 * (new Function). Não contém execução — só extração, comparação, matchers
 * e a definição do ambiente curado. A execução em si fica em cada ambiente.
 */
export type { Matcher, TestCase, TestResult } from './types.js'
export { extractFunctionName, resolveTargetFn } from './extract.js'
export { deepEqual, applyMatcher } from './compare.js'
export { SAFE_GLOBALS, DENIED_WORKER_GLOBALS } from './globals.js'
export {
  formatConsoleArg,
  formatConsoleLine,
  createCaptureConsole,
  normalizeOutput,
  type CaptureConsole,
} from './console.js'
