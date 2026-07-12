/**
 * Pool de worker_threads com Pyodide quente.
 *
 * Por que um pool e não "um worker por execução": medido em spike, carregar o
 * Pyodide do zero custa ~4s (WASM + stdlib); reexecutar num worker já quente
 * custa ~10ms. Um worker por submissão pagaria 4s em TODA correção — inviável
 * pra revalidação de nota no backend. Por isso o pool mantém `size` workers
 * vivos e reaproveita.
 *
 * Por que mais de um worker: um loop infinito no código do aluno trava a
 * thread inteira (WASM síncrono não é interrompível) — só dá pra recuperar
 * matando o worker (`terminate()`), o que perde a instância quente e faz a
 * PRÓXIMA submissão naquele slot pagar os ~4s de novo enquanto um substituto
 * sobe em background. Com mais de um worker, um travando não trava a fila
 * inteira — os outros seguem atendendo.
 */
import { Worker } from 'node:worker_threads'
import { fileURLToPath } from 'node:url'
import type { RunRequest, RunResponse } from './python-exec.js'

// O worker SEMPRE aponta pro dist/ compilado — nunca spawna a partir do .ts
// (tentei rodar o worker via `tsx`/`--experimental-strip-types` como loader;
// funciona no processo principal, mas empiricamente NÃO propaga de forma
// confiável pra dentro de um worker_thread — MODULE_NOT_FOUND ou resolução
// quebrada de dependência nativa do pyodide, dependendo do mecanismo. Testado
// em spike isolado). Dois casos:
//  - consumido via dist/ (apps/api importa @codinhos/runner-python, resolve
//    pro "default" do package.json -> dist/pool.js -> sibling dist/python-worker.js,
//    caminho normal de produção) — import.meta.url deste arquivo já é dist/.
//  - vitest rodando src/pool.ts direto (esbuild transpila em memória, sem
//    gerar dist/ele mesmo) — import.meta.url aponta pra src/; sobe um nível e
//    desce em dist/python-worker.js. O script "pretest" (tsc) garante que
//    esse dist existe antes do vitest rodar.
const RUNNING_FROM_SOURCE = import.meta.url.endsWith('.ts')
const WORKER_ENTRY = fileURLToPath(
  new URL(
    RUNNING_FROM_SOURCE ? '../dist/python-worker.js' : './python-worker.js',
    import.meta.url,
  ),
)

const DEFAULT_TIMEOUT_MS = 3000
const DEFAULT_POOL_SIZE = 2
// Quanto esperar o Pyodide carregar dentro do worker antes de desistir dele.
// Bem mais folgado que o timeout de execução (~4s medido em spike + margem
// pra máquina lenta/CI) — isto é "o setup falhou", não "loop infinito".
const DEFAULT_READY_TIMEOUT_MS = 20000

let nextRequestId = 1

class WorkerSlot {
  worker: Worker
  ready: Promise<void>

  busy = false

  constructor(readyTimeoutMs: number) {
    this.worker = new Worker(WORKER_ENTRY)
    this.ready = new Promise((resolve, reject) => {
      // Gap corrigido (existia sem timeout aqui): se o Pyodide nunca
      // terminar de carregar (ex.: bug de empacotamento em produção), sem
      // este timeout `run()` ficaria esperando pra sempre em vez de dar
      // erro. Ver docs/motor-python-capacidades.md.
      const timer = setTimeout(() => {
        reject(new Error('Timeout esperando o Pyodide carregar no worker.'))
      }, readyTimeoutMs)
      this.worker.once('message', () => {
        clearTimeout(timer)
        resolve()
      })
    })
    // `this.ready` só é `await`ado dentro de `run()`, que pode acontecer bem
    // depois de o slot rejeitar (ou nunca, se o slot ficar ocioso no pool) —
    // sem um handler "grudado" nele desde já, o Node reporta unhandled
    // rejection no instante da rejeição, mesmo que `run()` fosse tratar o
    // erro mais tarde. Isto NÃO consome a rejeição pra quem faz `await
    // slot.ready` depois (promise pode ter vários handlers).
    this.ready.catch(() => {})
    // Erros não tratados no worker (ex.: falha ao carregar o pyodide) não
    // podem derrubar o processo da API — o slot fica inutilizável até ser
    // substituído (ver `replace`), mas ao menos loga pra observabilidade.
    this.worker.on('error', (err: Error) => {
      console.error('[@codinhos/runner-python] erro no worker Pyodide:', err)
    })
  }

  terminate(): void {
    void this.worker.terminate()
  }
}

export interface PyodideWorkerPoolOptions {
  size?: number
  timeoutMs?: number
  readyTimeoutMs?: number
}

export class PyodideWorkerPool {
  private slots: WorkerSlot[]
  private readonly size: number
  private readonly timeoutMs: number
  private readonly readyTimeoutMs: number
  private queue: Array<() => void> = []

  constructor(opts: PyodideWorkerPoolOptions = {}) {
    this.size = opts.size ?? DEFAULT_POOL_SIZE
    this.timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS
    this.readyTimeoutMs = opts.readyTimeoutMs ?? DEFAULT_READY_TIMEOUT_MS
    this.slots = Array.from({ length: this.size }, () => new WorkerSlot(this.readyTimeoutMs))
  }

  /** Espera algum slot ficar livre e o marca como ocupado. */
  private async acquire(): Promise<WorkerSlot> {
    for (;;) {
      const slot = this.slots.find((s) => !s.busy)
      if (slot) {
        slot.busy = true
        return slot
      }
      await new Promise<void>((resolve) => this.queue.push(resolve))
    }
  }

  private release(slot: WorkerSlot): void {
    slot.busy = false
    const next = this.queue.shift()
    if (next) next()
  }

  /** Descarta um slot morto (timeout de execução OU falha ao carregar) e sobe um substituto. */
  private replace(deadSlot: WorkerSlot): void {
    deadSlot.terminate()
    const idx = this.slots.indexOf(deadSlot)
    if (idx === -1) return
    this.slots[idx] = new WorkerSlot(this.readyTimeoutMs)
    // O slot novo entra ocupado-por-load implicitamente: quem pegar ele em
    // seguida só executa depois do `ready`, tratado em `run`.
    this.release(this.slots[idx])
  }

  async run(req: Omit<RunRequest, 'id'>, timeoutMs = this.timeoutMs): Promise<RunResponse> {
    const slot = await this.acquire()

    try {
      await slot.ready
    } catch {
      // Pyodide não carregou dentro do prazo (bug de deploy/empacotamento,
      // não erro do aluno) — descarta o slot, sobe um substituto em
      // background e devolve erro em vez de travar a requisição pra sempre.
      this.replace(slot)
      return {
        id: nextRequestId++,
        ok: false,
        errorMessage: 'Não foi possível inicializar o ambiente Python. Tente novamente em instantes.',
      }
    }

    const id = nextRequestId++
    return new Promise<RunResponse>((resolve) => {
      let settled = false

      const timer = setTimeout(() => {
        if (settled) return
        settled = true
        this.replace(slot)
        resolve({ id, ok: false, errorMessage: 'Tempo limite excedido (loop infinito?).' })
      }, timeoutMs)

      slot.worker.once('message', (res: RunResponse) => {
        if (settled) return
        settled = true
        clearTimeout(timer)
        this.release(slot)
        resolve(res)
      })

      slot.worker.postMessage({ ...req, id } satisfies RunRequest)
    })
  }

  async destroy(): Promise<void> {
    await Promise.all(this.slots.map((s) => s.worker.terminate()))
  }
}

let sharedPool: PyodideWorkerPool | null = null

/** Pool compartilhado do processo (API ou worker de front, quando aplicável). */
export function getSharedPythonPool(opts?: PyodideWorkerPoolOptions): PyodideWorkerPool {
  if (!sharedPool) sharedPool = new PyodideWorkerPool(opts)
  return sharedPool
}
