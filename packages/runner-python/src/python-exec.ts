/**
 * Lógica de execução de UMA submissão Python contra uma instância Pyodide já
 * carregada. Puro em relação ao transporte: não sabe se está num
 * `worker_thread` (Node/backend, ver python-worker.ts) ou num Web Worker do
 * navegador (front — pyodide expõe a mesma API `PyodideInterface` nos dois
 * ambientes). Isso permite reusar a MESMA lógica de isolamento/wrappers dos
 * dois lados, igual ao resto do @codinhos/runner faz para JS.
 */
import type { PyodideInterface } from 'pyodide'

export type PythonOp = 'function' | 'typecheck' | 'stdout' | 'instance' | 'ast'

export interface RunRequest {
  id: number
  code: string
  op: PythonOp
  targetFn?: string | null
  args?: unknown[] | null
  varName?: string
  /** Usados só quando op === 'instance' (G7 — instanciar classe + chamar método). */
  className?: string | null
  constructorArgs?: unknown[] | null
  methodName?: string | null
  /** Usados só quando op === 'ast' (G5 — verificação estrutural). Ver AstRuleKind em @codinhos/runner. */
  astRuleKind?: string | null
  astRuleName?: string | null
  /**
   * G2 — fila de respostas simuladas pra `input()`, na ordem de consumo.
   * Vale para QUALQUER op que executa código de verdade (function/typecheck/
   * stdout/instance) — não é um op próprio, é um parâmetro extra da
   * execução. Ausente/vazio = qualquer `input()` reprova com `EOFError`,
   * nunca trava a thread esperando um stdin real que não existe no worker.
   */
  stdin?: string[] | null
}

export interface RunResponse {
  id: number
  ok: boolean
  actualJson?: string
  actualRepr?: string
  actualType?: string
  output?: string
  errorMessage?: string
  /** Usados só quando op === 'ast'. */
  astPassed?: boolean
  astMessage?: string
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

// G7 — instancia __class_name__ com __ctor_args_json, chama __method_name__
// nela com __method_args_json, compara o RETORNO do método (não print). Erros
// possíveis, sinalizados via __error pra handleRequest traduzir em mensagem:
// "class_not_found" (nome não existe ou não é uma classe), "method_not_found"
// (existe a classe, mas não o método pedido — cobre erro de digitação no
// enunciado e classe incompleta do aluno), ou o nome da exceção Python (ex.:
// erro dentro do __init__ ou do método).
const INSTANCE_WRAPPER = `
import json as __json

def __safe_json(v):
    try:
        return __json.dumps(v)
    except TypeError:
        return __json.dumps(repr(v))

__cls = globals().get(__class_name__)
if __cls is None or not isinstance(__cls, type):
    __error = "class_not_found"
    __actual_json = "null"
    __actual_repr = ""
    __actual_type = ""
else:
    try:
        __ctor_args = __json.loads(__ctor_args_json)
        __instance = __cls(*__ctor_args)
        __method = getattr(__instance, __method_name__, None)
        if __method is None or not callable(__method):
            __error = "method_not_found"
            __actual_json = "null"
            __actual_repr = ""
            __actual_type = ""
        else:
            __method_args = __json.loads(__method_args_json)
            __result = __method(*__method_args)
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

// G5 — verificação ESTRUTURAL, sem executar o código do aluno (só `ast.parse`,
// nunca `runPython(__ast_code)`): mais seguro (zero risco de loop infinito
// numa checagem que nem deveria rodar código) e mais simples que a heurística
// de texto usada em JS (`packages/runner/src/ast.ts`), porque Python já tem
// um parser de AST nativo — sem dependência nova.
//
// `forbidLoops` também conta comprehension (`ListComp`/`SetComp`/`DictComp`/
// `GeneratorExp`) como laço — um jeito de "trapacear" que a heurística de
// texto do JS não cobre (comprehension não usa a palavra `for` fora de um
// contexto óbvio de texto... na verdade usa, mas aqui vale registrar que a
// versão Python fecha esse buraco de propósito, com uma verificação real de
// árvore em vez de regex).
const AST_CHECK_WRAPPER = `
import ast as __ast_module

try:
    __tree = __ast_module.parse(__ast_code)
except SyntaxError as __e:
    __passed = False
    __message = "Erro de sintaxe no código: " + str(__e)
else:
    __LOOP_TYPES = (__ast_module.For, __ast_module.While, __ast_module.ListComp, __ast_module.SetComp, __ast_module.DictComp, __ast_module.GeneratorExp)

    def __has_loop(node):
        for __n in __ast_module.walk(node):
            if isinstance(__n, __LOOP_TYPES):
                return True
        return False

    def __find_funcdef(tree, name):
        for __n in __ast_module.walk(tree):
            if isinstance(__n, __ast_module.FunctionDef) and __n.name == name:
                return __n
        return None

    def __calls_itself(funcdef, name):
        for __n in __ast_module.walk(funcdef):
            if isinstance(__n, __ast_module.Call) and isinstance(__n.func, __ast_module.Name) and __n.func.id == name:
                return True
        return False

    def __uses_method(tree, name):
        for __n in __ast_module.walk(tree):
            if isinstance(__n, __ast_module.Call) and isinstance(__n.func, __ast_module.Attribute) and __n.func.attr == name:
                return True
        return False

    def __uses_call(tree, name):
        for __n in __ast_module.walk(tree):
            if isinstance(__n, __ast_module.Call) and isinstance(__n.func, __ast_module.Name) and __n.func.id == name:
                return True
        return False

    __kind = __ast_rule_kind
    __name = __ast_rule_name

    if __kind == "forbidLoops":
        __has = __has_loop(__tree)
        __passed = not __has
        __message = "Este desafio pede para resolver SEM laços (for/while/comprehension)." if __has else "Nenhum laço usado."
    elif __kind == "requireRecursion":
        __funcdef = __find_funcdef(__tree, __ast_target_fn) if __ast_target_fn else None
        if __funcdef is None:
            __passed = False
            __message = "Declare uma função para poder usar recursão." if not __ast_target_fn else ("Função \\"" + __ast_target_fn + "\\" não encontrada.")
        else:
            __calls = __calls_itself(__funcdef, __ast_target_fn)
            __passed = __calls
            __message = ("A função \\"" + __ast_target_fn + "\\" usa recursão (chama a si mesma).") if __calls else ("A função \\"" + __ast_target_fn + "\\" precisa chamar a si mesma (recursão).")
    elif __kind == "requireMethod":
        __has = __uses_method(__tree, __name)
        __passed = __has
        __message = ("Usa ." + __name + "() como pedido.") if __has else ("Você precisa usar ." + __name + "() neste desafio.")
    elif __kind == "forbidMethod":
        __has = __uses_method(__tree, __name)
        __passed = not __has
        __message = ("Não use ." + __name + "() neste desafio.") if __has else ("Não usou ." + __name + "().")
    elif __kind == "requireCall":
        __has = __uses_call(__tree, __name)
        __passed = __has
        __message = ("Usa " + __name + "() como pedido.") if __has else ("Você precisa usar " + __name + "() neste desafio.")
    elif __kind == "forbidCall":
        __has = __uses_call(__tree, __name)
        __passed = not __has
        __message = ("Não use " + __name + "() neste desafio.") if __has else ("Não usou " + __name + "().")
    else:
        __passed = False
        __message = "Regra de estrutura desconhecida."
`

// G6 — allowlist de módulos que um aluno pode `import`: curadoria explícita,
// defesa em profundidade além do sandbox WASM (que já não dá acesso real a
// filesystem/rede/processo — ver docs/motor-python-capacidades.md §1 "Por que
// Pyodide nos dois lados"). Lista fechada, não um bloqueio de nomes perigosos:
// só os módulos que o currículo de fato usa entram. `math`/`random`/`string`
// (trilha 10) e `functools` (trilha 7, `functools.reduce` — achado ao revisar
// o seed já escrito; não estava na lista original do doc mestre, que citava só
// math/random/string). Estender esta lista é o único passo pra liberar um novo
// módulo pra alguma trilha futura.
const IMPORT_ALLOWLIST = ['math', 'random', 'string', 'functools']

// Checagem ESTÁTICA (ast.parse, nunca executa `req.code`) — mesmo espírito do
// G5 (`handleAstCheck`), mas roda para TODOS os ops que de fato executam
// código (function/typecheck/stdout/instance), como um portão ANTES de
// `pyodide.runPython(req.code, ...)`: um `import os` nem chega a rodar. Cobre
// `import x`, `import x.y` (raiz `x`), `from x import y` e `import x as y`
// (raiz do módulo, sem depender do alias) — e reprova `from . import x`
// (import relativo) direto, já que não faz sentido em um script avulso do
// aluno. NÃO cobre import dinâmico (`__import__('os')`, `importlib`) — esses
// ficam por conta do isolamento do WASM em si (mesmo raciocínio de "defesa em
// profundidade, não confiar só nisso" já registrado no doc mestre).
const IMPORT_CHECK_WRAPPER = `
import ast as __ic_ast

__ic_allowed = set(__ic_allowed_csv.split(","))
__ic_blocked = None

try:
    __ic_tree = __ic_ast.parse(__ic_code)
except SyntaxError:
    # erro de sintaxe é responsabilidade da execução normal logo depois (
    # mensagem melhor, com o traceback de verdade) — esta checagem só cuida
    # de import.
    pass
else:
    for __ic_node in __ic_ast.walk(__ic_tree):
        if __ic_blocked:
            break
        if isinstance(__ic_node, __ic_ast.Import):
            for __ic_alias in __ic_node.names:
                __ic_top = __ic_alias.name.split(".")[0]
                if __ic_top not in __ic_allowed:
                    __ic_blocked = __ic_top
                    break
        elif isinstance(__ic_node, __ic_ast.ImportFrom):
            if __ic_node.level and __ic_node.level > 0:
                __ic_blocked = "import relativo"
            else:
                __ic_top = (__ic_node.module or "").split(".")[0]
                if __ic_top not in __ic_allowed:
                    __ic_blocked = __ic_top
`

/**
 * G6 — devolve o nome do módulo bloqueado (ou "import relativo"), ou `null`
 * se não há nenhum import fora da allowlist. Usa um dict de globals PRÓPRIO
 * (descartado no final), separado do `g` da execução real — mesma disciplina
 * de isolamento do resto do arquivo, evita que variáveis internas desta
 * checagem (`__ic_*`) apareçam no namespace que o código do aluno vai rodar.
 */
function checkImportAllowlist(pyodide: PyodideInterface, code: string): string | null {
  const g = pyodide.globals.get('dict')()
  try {
    g.set('__ic_code', code)
    g.set('__ic_allowed_csv', IMPORT_ALLOWLIST.join(','))
    pyodide.runPython(IMPORT_CHECK_WRAPPER, { globals: g })
    return g.get('__ic_blocked') ?? null
  } finally {
    g.destroy()
  }
}

// G2 — simula `input()` sem depender de stdin real (não existe stdin
// interativo dentro de um worker_thread/Web Worker). Roda ANTES de
// `req.code`, no MESMO `g` que `req.code` vai usar como globals — por isso
// não precisa mexer no módulo `builtins` (que seria uma mutação
// PROCESS-WIDE, vazando entre execuções que reusam a mesma instância quente
// de Pyodide): basta definir `input` dentro do próprio dict `g`, porque
// `exec(code, g)` resolve um nome global primeiro em `g`, só cai pro
// `__builtins__` de verdade se não achar ali. Isso preserva a MESMA
// disciplina de isolamento por execução que o resto do arquivo já segue
// (dict novo por chamada).
//
// Fiel ao Python real: escreve o prompt no stdout (`print(prompt, end="")`,
// vai pro mesmo buffer capturado por `pyodide.setStdout`) mas NÃO ecoa a
// resposta (o terminal real ecoa por conta própria, não é o Python que
// escreve o que o usuário digitou). Fila esgotada = `EOFError` (mesmo erro
// que um `input()` real dá quando o stdin acaba) — propaga pro catch já
// existente em volta de `pyodide.runPython(req.code, ...)`, sem precisar de
// tratamento especial.
const STDIN_SETUP_WRAPPER = `
import json as __stdin_json_module

__stdin_queue = __stdin_json_module.loads(__stdin_lines_json)

def input(prompt=""):
    print(prompt, end="")
    if not __stdin_queue:
        raise EOFError("EOF when reading a line")
    return __stdin_queue.pop(0)
`

function formatPyError(err: unknown): string {
  if (err instanceof Error) {
    const lines = err.message.trim().split('\n')
    return lines[lines.length - 1] ?? err.message
  }
  return String(err)
}

/**
 * G5 — checagem estrutural pura: NUNCA executa `req.code` como Python (só
 * `ast.parse`), por isso tem seu próprio caminho, sem passar pelo
 * `pyodide.runPython(req.code, ...)` do `handleRequest` normal (que roda
 * TODOS os outros ops). Isso também significa que um `while True` no código
 * do aluno não trava esta checagem — nem chega a rodar.
 */
function handleAstCheck(pyodide: PyodideInterface, req: RunRequest): RunResponse {
  const g = pyodide.globals.get('dict')()
  try {
    g.set('__ast_code', req.code)
    g.set('__ast_rule_kind', req.astRuleKind ?? '')
    g.set('__ast_rule_name', req.astRuleName ?? '')
    g.set('__ast_target_fn', req.targetFn ?? '')
    pyodide.runPython(AST_CHECK_WRAPPER, { globals: g })
    return {
      id: req.id,
      ok: true,
      astPassed: g.get('__passed'),
      astMessage: g.get('__message'),
    }
  } catch (err) {
    return { id: req.id, ok: false, errorMessage: `Erro: ${formatPyError(err)}` }
  } finally {
    g.destroy()
  }
}

/** Executa uma RunRequest contra uma instância Pyodide já carregada (quente). */
export function handleRequest(pyodide: PyodideInterface, req: RunRequest): RunResponse {
  if (req.op === 'ast') {
    return handleAstCheck(pyodide, req)
  }

  // G6 — portão de allowlist, antes de QUALQUER execução real do código do
  // aluno (ver IMPORT_CHECK_WRAPPER acima).
  const blockedModule = checkImportAllowlist(pyodide, req.code)
  if (blockedModule) {
    const detail =
      blockedModule === 'import relativo'
        ? 'Import relativo não é permitido nesta plataforma.'
        : `O módulo "${blockedModule}" não é permitido nesta plataforma. Módulos liberados: ${IMPORT_ALLOWLIST.join(', ')}.`
    return { id: req.id, ok: false, errorMessage: detail }
  }

  const output: string[] = []
  pyodide.setStdout({ batched: (s) => output.push(s) })
  pyodide.setStderr({ batched: () => {} })

  // Namespace isolado por execução — sem isso, globals de uma submissão
  // vazam pra próxima (confirmado em spike).
  const g = pyodide.globals.get('dict')()

  try {
    // G2 — `input()` simulado, configurado ANTES de req.code no MESMO `g`
    // (ver STDIN_SETUP_WRAPPER acima) — precisa rodar cedo pra cobrir
    // `input()` chamado direto no nível de módulo, não só dentro de função.
    g.set('__stdin_lines_json', JSON.stringify(req.stdin ?? []))
    pyodide.runPython(STDIN_SETUP_WRAPPER, { globals: g })

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

    if (req.op === 'instance') {
      const className = req.className
      if (!className) {
        return {
          id: req.id,
          ok: false,
          errorMessage: 'Nenhuma classe encontrada. Declare uma classe com class.',
        }
      }
      g.set('__class_name__', className)
      g.set('__ctor_args_json', JSON.stringify(req.constructorArgs ?? []))
      g.set('__method_name__', req.methodName ?? '')
      g.set('__method_args_json', JSON.stringify(req.args ?? []))
      pyodide.runPython(INSTANCE_WRAPPER, { globals: g })
      const instanceError = g.get('__error')
      if (instanceError === 'class_not_found') {
        return { id: req.id, ok: false, errorMessage: `Classe "${className}" não encontrada.` }
      }
      if (instanceError === 'method_not_found') {
        return {
          id: req.id,
          ok: false,
          errorMessage: `Método "${req.methodName}" não encontrado na classe "${className}".`,
        }
      }
      if (instanceError) {
        return { id: req.id, ok: false, errorMessage: `Erro: ${instanceError}` }
      }
      return {
        id: req.id,
        ok: true,
        actualJson: g.get('__actual_json'),
        actualRepr: g.get('__actual_repr'),
        actualType: g.get('__actual_type'),
      }
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
