/**
 * Lógica de execução de UMA submissão Python contra uma instância Pyodide já
 * carregada. Puro em relação ao transporte: não sabe se está num
 * `worker_thread` (Node/backend, ver python-worker.ts) ou num Web Worker do
 * navegador (front — pyodide expõe a mesma API `PyodideInterface` nos dois
 * ambientes). Isso permite reusar a MESMA lógica de isolamento/wrappers dos
 * dois lados, igual ao resto do @codinhos/runner faz para JS.
 */
import type { PyodideInterface } from 'pyodide'

export type PythonOp = 'function' | 'typecheck' | 'stdout'

export interface RunRequest {
  id: number
  code: string
  op: PythonOp
  targetFn?: string | null
  args?: unknown[] | null
  varName?: string
}

export interface RunResponse {
  id: number
  ok: boolean
  actualJson?: string
  actualRepr?: string
  actualType?: string
  output?: string
  errorMessage?: string
}

/**
 * Contrato mínimo que `run-python-tests.ts` precisa pra despachar um
 * TestCase — uma INTERFACE (não a classe `PyodideWorkerPool`), pra permitir
 * dois adaptadores estruturalmente compatíveis e reusar o MESMO dispatch dos
 * dois lados:
 *  - backend: `PyodideWorkerPool` (pool de worker_threads, ver pool.ts);
 *  - front: um adaptador fino dentro do próprio Web Worker, sem pool (só uma
 *    instância de Pyodide já carregada nesse worker — ver apps/app).
 */
export interface PythonRunner {
  run(req: Omit<RunRequest, 'id'>, timeoutMs?: number): Promise<RunResponse>
}

// Scripts FIXOS, sem interpolação de conteúdo do aluno — parâmetros entram
// via `globals().set(...)` a partir do JS, nunca por concatenação de string.
const FUNCTION_WRAPPER = `
import json as __json

def __safe_json(v):
    try:
        return __json.dumps(v)
    except TypeError:
        return __json.dumps(repr(v))

__fn = globals().get(__target_fn_name__)
if __fn is None or not callable(__fn):
    __error = "not_found"
    __actual_json = "null"
    __actual_repr = ""
    __actual_type = ""
else:
    try:
        __args = __json.loads(__args_json)
        __result = __fn(*__args)
        __actual_json = __safe_json(__result)
        __actual_repr = repr(__result)
        __actual_type = type(__result).__name__
        __error = None
    except Exception as __e:
        __error = type(__e).__name__ + ": " + str(__e)
        __actual_json = "null"
        __actual_repr = ""
        __actual_type = ""
`

const TYPECHECK_WRAPPER = `
if __var_name in globals():
    __actual_type = type(globals()[__var_name]).__name__
    __error = None
else:
    __actual_type = ""
    __error = "not_found"
`

function formatPyError(err: unknown): string {
  if (err instanceof Error) {
    const lines = err.message.trim().split('\n')
    return lines[lines.length - 1] ?? err.message
  }
  return String(err)
}

/** Executa uma RunRequest contra uma instância Pyodide já carregada (quente). */
export function handleRequest(pyodide: PyodideInterface, req: RunRequest): RunResponse {
  const output: string[] = []
  pyodide.setStdout({ batched: (s) => output.push(s) })
  pyodide.setStderr({ batched: () => {} })

  // Namespace isolado por execução — sem isso, globals de uma submissão
  // vazam pra próxima (confirmado em spike).
  const g = pyodide.globals.get('dict')()

  try {
    try {
      pyodide.runPython(req.code, { globals: g })
    } catch (err) {
      return { id: req.id, ok: false, errorMessage: `Erro: ${formatPyError(err)}` }
    }

    if (req.op === 'typecheck') {
      g.set('__var_name', req.varName ?? '')
      pyodide.runPython(TYPECHECK_WRAPPER, { globals: g })
      if (g.get('__error')) {
        return { id: req.id, ok: false, errorMessage: 'Variável não encontrada.' }
      }
      return { id: req.id, ok: true, actualType: g.get('__actual_type') }
    }

    if (req.op === 'stdout') {
      if (Array.isArray(req.args)) {
        const fnName = req.targetFn
        if (!fnName) {
          return {
            id: req.id,
            ok: false,
            errorMessage: 'Nenhuma função encontrada. Declare uma função com def.',
          }
        }
        output.length = 0 // limpa o que foi impresso no topo antes de chamar
        g.set('__target_fn_name__', fnName)
        g.set('__args_json', JSON.stringify(req.args))
        pyodide.runPython(FUNCTION_WRAPPER, { globals: g })
        const error = g.get('__error')
        if (error === 'not_found') {
          return {
            id: req.id,
            ok: false,
            errorMessage: `Função "${fnName}" não encontrada após execução.`,
          }
        }
        if (error) {
          return { id: req.id, ok: false, errorMessage: `Erro: ${error}` }
        }
      }
      return { id: req.id, ok: true, output: output.join('\n') }
    }

    // op === 'function'
    const fnName = req.targetFn
    if (!fnName) {
      return {
        id: req.id,
        ok: false,
        errorMessage: 'Nenhuma função encontrada. Declare uma função com def.',
      }
    }
    g.set('__target_fn_name__', fnName)
    g.set('__args_json', JSON.stringify(req.args ?? []))
    pyodide.runPython(FUNCTION_WRAPPER, { globals: g })
    const error = g.get('__error')
    if (error === 'not_found') {
      return {
        id: req.id,
        ok: false,
        errorMessage: `Função "${fnName}" não encontrada após execução.`,
      }
    }
    if (error) {
      return { id: req.id, ok: false, errorMessage: `Erro: ${error}` }
    }
    return {
      id: req.id,
      ok: true,
      actualJson: g.get('__actual_json'),
      actualRepr: g.get('__actual_repr'),
      actualType: g.get('__actual_type'),
    }
  } finally {
    g.destroy()
  }
}
