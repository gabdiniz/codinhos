/**
 * Entry point do worker_thread (Node/backend) que roda Pyodide.
 *
 * Compilado para dist/python-worker.js e carregado via `new Worker(url)` — não
 * é importado por ninguém em código normal (por isso não reexportado em
 * index.ts). Só a plumbing de transporte (parentPort) mora aqui; a lógica de
 * execução em si é `handleRequest`, em python-exec.ts (compartilhável com uma
 * futura versão para Web Worker do front — mesma API PyodideInterface).
 *
 * Carrega o Pyodide UMA vez (custo medido em spike: ~4s) e fica vivo
 * atendendo requests, uma de cada vez — ver pool.ts para o porquê do pool.
 */
import { parentPort } from 'node:worker_threads'
import { loadPyodide } from 'pyodide'
import { handleRequest, type RunRequest } from './python-exec.js'

async function main() {
  const pyodide = await loadPyodide()
  parentPort?.postMessage({ ready: true })

  parentPort?.on('message', (req: RunRequest) => {
    const response = handleRequest(pyodide, req)
    parentPort?.postMessage(response)
  })
}

main()
