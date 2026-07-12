/**
 * @codinhos/runner-python — runner de desafios Python (Pyodide/CPython-WASM).
 *
 * Só o lado backend (Node worker_threads) mora aqui por enquanto — ver P1 em
 * docs/motor-python-capacidades.md. A execução em si (python-exec.ts) é
 * agnóstica de transporte e pensada para ser reaproveitada por uma versão
 * futura em Web Worker do front (mesma API PyodideInterface do pyodide nos
 * dois ambientes).
 */
export { PyodideWorkerPool, getSharedPythonPool, type PyodideWorkerPoolOptions } from './pool.js'
export { runPythonTests } from './run-python-tests.js'
export { extractDefName, resolveTargetFnPython } from './extract.js'
export type { PythonOp, RunRequest, RunResponse } from './python-exec.js'
