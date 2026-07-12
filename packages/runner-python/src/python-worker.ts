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
import { fileURLToPath } from 'node:url'
import { loadPyodide } from 'pyodide'
import { handleRequest, type RunRequest } from './python-exec.js'

/**
 * O `pyodide.mjs` tenta se auto-localizar lendo o stack trace de um erro
 * forjado (heurística frágil, documentada no próprio pacote como fallback:
 * "Could not extract indexURL path... Please pass the indexURL explicitly").
 * Essa heurística quebra quando o pacote roda a partir de um `worker_thread`
 * gerado por um `dist/` compilado (confirmado rodando de verdade em Docker —
 * ver pyodide-falha-no-docker na memória do projeto): o erro
 * `ERR_MODULE_NOT_FOUND` pra `.../node_modules/src/js/pyodide.asm.mjs` é essa
 * detecção calculando o diretório errado. Resolvendo o próprio pacote via
 * `import.meta.resolve` (resolução real do Node, não adivinhação por stack
 * trace) e passando `indexURL` explícito contorna o bug de vez.
 */
async function resolvePyodideIndexUrl(): Promise<string> {
  const entryUrl = await import.meta.resolve('pyodide/pyodide.mjs')
  return fileURLToPath(new URL('.', entryUrl))
}

async function main() {
  const indexURL = await resolvePyodideIndexUrl()
  const pyodide = await loadPyodide({ indexURL })
  parentPort?.postMessage({ ready: true })

  parentPort?.on('message', (req: RunRequest) => {
    const response = handleRequest(pyodide, req)
    parentPort?.postMessage(response)
  })
}

main()
