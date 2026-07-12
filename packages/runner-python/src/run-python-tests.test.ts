/**
 * Testes de integração REAIS (Pyodide de verdade, sem mock) — mesma disciplina
 * do run-tests.differential.test.ts do motor JS. Lentos na primeira execução
 * (~4s de load do Pyodide, medido em spike) porque compartilham UM pool pro
 * arquivo inteiro; os demais casos usam a instância já quente (~10ms cada).
 *
 * IMPORTANTE (ver mensagem do chat): este arquivo não pôde ser executado no
 * sandbox do Cowork (mount local não roda pnpm/vitest) — rodar
 * `pnpm --filter @codinhos/runner-python test` na sua máquina pra confirmar.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { PyodideWorkerPool } from './pool.js'
import { runPythonTests } from './run-python-tests.js'

describe('runPythonTests', () => {
  let pool: PyodideWorkerPool

  beforeAll(() => {
    pool = new PyodideWorkerPool({ size: 1, timeoutMs: 3000 })
  })

  afterAll(async () => {
    await pool.destroy()
  })

  it(
    'function-call: soma dois números',
    async () => {
      const { results, allPassed } = await runPythonTests(
        'def soma(a, b):\n    return a + b',
        [{ input: [2, 3], expected: 5, description: 'soma(2, 3) deve ser 5' }],
        'soma',
        pool,
      )
      expect(allPassed).toBe(true)
      expect(results[0]?.actual).toBe(5)
    },
    20000,
  )

  it(
    'function-call: targetFn ausente cai pra primeira def de topo',
    async () => {
      const { allPassed } = await runPythonTests(
        'def dobro(n):\n    return n * 2',
        [{ input: [4], expected: 8, description: 'dobro(4) deve ser 8' }],
        null,
        pool,
      )
      expect(allPassed).toBe(true)
    },
    20000,
  )

  it(
    'function-call: tupla comparada como lista (matcher equal padrão)',
    async () => {
      const { results, allPassed } = await runPythonTests(
        'def par(a, b):\n    return (a, b)',
        [{ input: [1, 2], expected: [1, 2], description: 'par(1, 2) deve ser (1, 2)' }],
        'par',
        pool,
      )
      expect(allPassed).toBe(true)
      // JSON não distingue tuple de list — grading trata como equivalentes
      // por design (ver G3 em docs/motor-python-capacidades.md).
      expect(results[0]?.actual).toEqual([1, 2])
    },
    20000,
  )

  it(
    'expectedType (G3 completo): tuple de verdade passa quando exigido',
    async () => {
      const { results, allPassed } = await runPythonTests(
        'def par(a, b):\n    return (a, b)',
        [{ input: [1, 2], expected: [1, 2], expectedType: 'tuple', description: 'par(1, 2) deve devolver uma tuple' }],
        'par',
        pool,
      )
      expect(allPassed).toBe(true)
      expect(results[0]?.error).toBeUndefined()
    },
    20000,
  )

  it(
    'expectedType (G3 completo): valor certo mas tipo errado (list em vez de tuple) reprova com mensagem',
    async () => {
      const { results, allPassed } = await runPythonTests(
        'def par(a, b):\n    return [a, b]',
        [{ input: [1, 2], expected: [1, 2], expectedType: 'tuple', description: 'par(1, 2) deve devolver uma tuple' }],
        'par',
        pool,
      )
      expect(allPassed).toBe(false)
      expect(results[0]?.error).toMatch(/tipo.*"tuple".*"list"/i)
      expect(results[0]?.errorName).toBe('TypeError')
      // o valor em si (JSON round-trip) continua exposto, só a nota que reprova
      expect(results[0]?.actual).toEqual([1, 2])
    },
    20000,
  )

  it(
    'expectedType (G3 completo): sem o campo, list é aceita normalmente (retrocompatível)',
    async () => {
      const { results, allPassed } = await runPythonTests(
        'def par(a, b):\n    return [a, b]',
        [{ input: [1, 2], expected: [1, 2], description: 'par(1, 2) deve ser [1, 2]' }],
        'par',
        pool,
      )
      expect(allPassed).toBe(true)
      expect(results[0]?.error).toBeUndefined()
    },
    20000,
  )

  it(
    'expectedType (G3 completo): valor E tipo errados reprovam sem a nota extra de tipo (mensagem de valor já basta)',
    async () => {
      const { results, allPassed } = await runPythonTests(
        'def par(a, b):\n    return [a, b]',
        [{ input: [1, 2], expected: [9, 9], expectedType: 'tuple', description: 'par(1, 2) não deveria ser [9, 9]' }],
        'par',
        pool,
      )
      expect(allPassed).toBe(false)
      expect(results[0]?.error).toBeUndefined() // valor já errado, sem nota de tipo redundante
    },
    20000,
  )

  it(
    'expectedType (G3 completo): funciona também em instance-call',
    async () => {
      const { results, allPassed } = await runPythonTests(
        'class Ponto:\n    def __init__(self, x, y):\n        self.x = x\n        self.y = y\n    def coords_tupla(self):\n        return (self.x, self.y)\n    def coords_lista(self):\n        return [self.x, self.y]',
        [
          {
            input: [],
            expected: [3, 4],
            expectedType: 'tuple',
            description: 'coords_tupla() deve devolver uma tuple',
            mode: 'instance-call',
            constructorArgs: [3, 4],
            methodName: 'coords_tupla',
          },
        ],
        null,
        pool,
      )
      expect(allPassed).toBe(true)

      const comLista = await runPythonTests(
        'class Ponto:\n    def __init__(self, x, y):\n        self.x = x\n        self.y = y\n    def coords_lista(self):\n        return [self.x, self.y]',
        [
          {
            input: [],
            expected: [3, 4],
            expectedType: 'tuple',
            description: 'coords_lista() não é tuple',
            mode: 'instance-call',
            constructorArgs: [3, 4],
            methodName: 'coords_lista',
          },
        ],
        null,
        pool,
      )
      expect(comLista.allPassed).toBe(false)
      expect(comLista.results[0]?.error).toMatch(/tipo/i)
    },
    20000,
  )

  it(
    'function-call: exceção do aluno reprova com mensagem',
    async () => {
      const { results, allPassed } = await runPythonTests(
        'def divide(a, b):\n    return a / b',
        [{ input: [10, 0], expected: 5, description: 'divide(10, 0)' }],
        'divide',
        pool,
      )
      expect(allPassed).toBe(false)
      expect(String(results[0]?.actual)).toContain('ZeroDivisionError')
    },
    20000,
  )

  it(
    'type-check: variável do tipo certo',
    async () => {
      const { allPassed } = await runPythonTests(
        'nome = "Ana"',
        [{ input: null, expected: 'str', description: 'nome deve ser do tipo str' }],
        null,
        pool,
      )
      expect(allPassed).toBe(true)
    },
    20000,
  )

  it(
    'stdout: captura só a saída da função-alvo (limpa o topo)',
    async () => {
      const { results, allPassed } = await runPythonTests(
        'print("nao deveria contar")\ndef ola():\n    print("ola mundo")',
        [{ input: [], expected: 'ola mundo', description: 'ola() imprime', mode: 'stdout' }],
        'ola',
        pool,
      )
      expect(allPassed).toBe(true)
      expect(results[0]?.actual).toBe('ola mundo')
    },
    20000,
  )

  it(
    'isolamento: variável de uma submissão não vaza pra próxima',
    async () => {
      await runPythonTests(
        'x = 999',
        [{ input: null, expected: 'int', description: 'x deve ser do tipo int' }],
        null,
        pool,
      )
      const { results } = await runPythonTests(
        '# nao declara x',
        [{ input: null, expected: 'int', description: 'x deve ser do tipo int' }],
        null,
        pool,
      )
      expect(results[0]?.passed).toBe(false) // x não deve existir nesta execução
    },
    20000,
  )

  it(
    'instance-call: método simples usa atributo do __init__',
    async () => {
      const { results, allPassed } = await runPythonTests(
        'class Retangulo:\n    def __init__(self, largura, altura):\n        self.largura = largura\n        self.altura = altura\n    def area(self):\n        return self.largura * self.altura',
        [
          {
            input: [],
            expected: 12,
            description: 'area() de um retângulo 4x3',
            mode: 'instance-call',
            constructorArgs: [4, 3],
            methodName: 'area',
          },
        ],
        null,
        pool,
      )
      expect(allPassed).toBe(true)
      expect(results[0]?.actual).toBe(12)
    },
    20000,
  )

  it(
    'instance-call: className explícito + método que muda e lê o estado',
    async () => {
      const { results, allPassed } = await runPythonTests(
        'class Contador:\n    def __init__(self):\n        self.valor = 0\n    def incrementar(self):\n        self.valor += 1\n        return self.valor',
        [
          {
            input: [],
            expected: 1,
            description: 'primeiro incrementar() deve retornar 1',
            mode: 'instance-call',
            className: 'Contador',
            constructorArgs: [],
            methodName: 'incrementar',
          },
        ],
        null,
        pool,
      )
      expect(allPassed).toBe(true)
      expect(results[0]?.actual).toBe(1)
    },
    20000,
  )

  it(
    'instance-call: método com argumento próprio (além do construtor)',
    async () => {
      const { results, allPassed } = await runPythonTests(
        'class ContaBancaria:\n    def __init__(self, saldo):\n        self.saldo = saldo\n    def depositar(self, valor):\n        self.saldo += valor\n        return self.saldo',
        [
          {
            input: [50],
            expected: 150,
            description: 'depositar(50) numa conta com saldo 100',
            mode: 'instance-call',
            constructorArgs: [100],
            methodName: 'depositar',
          },
        ],
        null,
        pool,
      )
      expect(allPassed).toBe(true)
      expect(results[0]?.actual).toBe(150)
    },
    20000,
  )

  it(
    'instance-call: classe inexistente reprova com mensagem clara',
    async () => {
      const { results, allPassed } = await runPythonTests(
        'def nao_e_uma_classe():\n    pass',
        [{ input: [], expected: 1, description: 'não há classe aqui', mode: 'instance-call', methodName: 'algo' }],
        null,
        pool,
      )
      expect(allPassed).toBe(false)
      expect(String(results[0]?.actual)).toMatch(/nenhuma classe encontrada/i)
    },
    20000,
  )

  it(
    'instance-call: método inexistente na classe reprova com mensagem clara',
    async () => {
      const { results, allPassed } = await runPythonTests(
        'class Vazia:\n    def __init__(self):\n        pass',
        [
          {
            input: [],
            expected: 1,
            description: 'método que não existe',
            mode: 'instance-call',
            methodName: 'metodo_que_nao_existe',
          },
        ],
        null,
        pool,
      )
      expect(allPassed).toBe(false)
      expect(String(results[0]?.actual)).toMatch(/método.*não encontrado/i)
    },
    20000,
  )

  it(
    'ast: forbidLoops passa numa solução recursiva de verdade',
    async () => {
      const { results, allPassed } = await runPythonTests(
        'def fatorial(n):\n    if n <= 1:\n        return 1\n    return n * fatorial(n - 1)',
        [{ input: null, expected: null, description: 'sem laços', mode: 'ast', astRule: { kind: 'forbidLoops' } }],
        'fatorial',
        pool,
      )
      expect(allPassed).toBe(true)
      expect(results[0]?.actual).toMatch(/nenhum laço usado/i)
    },
    20000,
  )

  it(
    'ast: forbidLoops reprova com for, while E list comprehension (fecha o loophole)',
    async () => {
      const casos = [
        'def f(n):\n    r = 1\n    for i in range(1, n+1):\n        r *= i\n    return r',
        'def f(n):\n    r = 1\n    while n > 1:\n        r *= n\n        n -= 1\n    return r',
        'def f(lista):\n    return sum([x for x in lista])',
      ]
      for (const code of casos) {
        const { allPassed } = await runPythonTests(
          code,
          [{ input: null, expected: null, description: 'sem laços', mode: 'ast', astRule: { kind: 'forbidLoops' } }],
          'f',
          pool,
        )
        expect(allPassed).toBe(false)
      }
    },
    20000,
  )

  it(
    'ast: requireRecursion passa quando a função chama a si mesma',
    async () => {
      const { allPassed } = await runPythonTests(
        'def soma_ate(n):\n    if n <= 0:\n        return 0\n    return n + soma_ate(n - 1)',
        [{ input: null, expected: null, description: 'usa recursão', mode: 'ast', astRule: { kind: 'requireRecursion' } }],
        'soma_ate',
        pool,
      )
      expect(allPassed).toBe(true)
    },
    20000,
  )

  it(
    'ast: requireRecursion reprova solução iterativa (mesmo resultado, sem recursão)',
    async () => {
      const { results, allPassed } = await runPythonTests(
        'def soma_ate(n):\n    total = 0\n    for i in range(1, n + 1):\n        total += i\n    return total',
        [{ input: null, expected: null, description: 'usa recursão', mode: 'ast', astRule: { kind: 'requireRecursion' } }],
        'soma_ate',
        pool,
      )
      expect(allPassed).toBe(false)
      expect(String(results[0]?.actual)).toMatch(/precisa chamar a si mesma/i)
    },
    20000,
  )

  it(
    'ast: requireMethod/forbidMethod distinguem .sort() de sorted()',
    async () => {
      const comMetodo = await runPythonTests(
        'def f(lista):\n    lista.sort()\n    return lista',
        [{ input: null, expected: null, description: 'usa .sort()', mode: 'ast', astRule: { kind: 'requireMethod', name: 'sort' } }],
        'f',
        pool,
      )
      expect(comMetodo.allPassed).toBe(true)

      const semMetodo = await runPythonTests(
        'def f(lista):\n    return sorted(lista)',
        [{ input: null, expected: null, description: 'usa .sort()', mode: 'ast', astRule: { kind: 'requireMethod', name: 'sort' } }],
        'f',
        pool,
      )
      expect(semMetodo.allPassed).toBe(false)
    },
    20000,
  )

  it(
    'ast: código com erro de sintaxe reprova sem quebrar o teste',
    async () => {
      const { results, allPassed } = await runPythonTests(
        'def f(:\n    pass',
        [{ input: null, expected: null, description: 'sem laços', mode: 'ast', astRule: { kind: 'forbidLoops' } }],
        'f',
        pool,
      )
      expect(allPassed).toBe(false)
      expect(String(results[0]?.actual)).toMatch(/erro de sintaxe/i)
    },
    20000,
  )

  it(
    'import: módulo liberado (math) roda normalmente',
    async () => {
      const { results, allPassed } = await runPythonTests(
        'import math\ndef raiz(n):\n    return math.sqrt(n)',
        [{ input: [16], expected: 4, description: 'raiz(16) deve ser 4' }],
        'raiz',
        pool,
      )
      expect(allPassed).toBe(true)
      expect(results[0]?.actual).toBe(4)
    },
    20000,
  )

  it(
    'import: functools (usado na trilha 7) está liberado',
    async () => {
      const { allPassed } = await runPythonTests(
        'import functools\ndef soma_com_reduce(lista):\n    return functools.reduce(lambda acc, x: acc + x, lista, 0)',
        [{ input: [[1, 2, 3, 4]], expected: 10, description: 'soma_com_reduce([1,2,3,4]) deve ser 10' }],
        'soma_com_reduce',
        pool,
      )
      expect(allPassed).toBe(true)
    },
    20000,
  )

  it(
    'import: módulo fora da allowlist (os) reprova com mensagem clara, sem executar',
    async () => {
      const { results, allPassed } = await runPythonTests(
        'import os\ndef f():\n    return os.getcwd()',
        [{ input: [], expected: 1, description: 'f() não deveria nem rodar' }],
        'f',
        pool,
      )
      expect(allPassed).toBe(false)
      expect(String(results[0]?.actual)).toMatch(/módulo.*"os".*não é permitido/i)
    },
    20000,
  )

  it(
    'import: from-import (from os import path) também é bloqueado',
    async () => {
      const { results, allPassed } = await runPythonTests(
        'from os import path\ndef f():\n    return 1',
        [{ input: [], expected: 1, description: 'f()' }],
        'f',
        pool,
      )
      expect(allPassed).toBe(false)
      expect(String(results[0]?.actual)).toMatch(/"os"/)
    },
    20000,
  )

  it(
    'import: submódulo (import os.path) é bloqueado pela raiz (os)',
    async () => {
      const { results, allPassed } = await runPythonTests(
        'import os.path\ndef f():\n    return 1',
        [{ input: [], expected: 1, description: 'f()' }],
        'f',
        pool,
      )
      expect(allPassed).toBe(false)
      expect(String(results[0]?.actual)).toMatch(/"os"/)
    },
    20000,
  )

  it(
    'import: sys, subprocess e socket (defesa em profundidade) reprovam',
    async () => {
      const modulos = ['sys', 'subprocess', 'socket']
      for (const mod of modulos) {
        const { results, allPassed } = await runPythonTests(
          `import ${mod}\ndef f():\n    return 1`,
          [{ input: [], expected: 1, description: 'f()' }],
          'f',
          pool,
        )
        expect(allPassed).toBe(false)
        expect(String(results[0]?.actual)).toContain(`"${mod}"`)
      }
    },
    20000,
  )

  it(
    'import: import relativo (from . import x) reprova com mensagem própria',
    async () => {
      const { results, allPassed } = await runPythonTests(
        'from . import alguma_coisa\ndef f():\n    return 1',
        [{ input: [], expected: 1, description: 'f()' }],
        'f',
        pool,
      )
      expect(allPassed).toBe(false)
      expect(String(results[0]?.actual)).toMatch(/import relativo/i)
    },
    20000,
  )

  it(
    'import: import proibido dentro de função (não só no topo) também é pego',
    async () => {
      const { results, allPassed } = await runPythonTests(
        'def f():\n    import os\n    return os.getcwd()',
        [{ input: [], expected: 1, description: 'f()' }],
        'f',
        pool,
      )
      expect(allPassed).toBe(false)
      expect(String(results[0]?.actual)).toMatch(/"os"/)
    },
    20000,
  )

  it(
    'stdin: input() simulado via fila, valor de retorno confere (function-call)',
    async () => {
      const { results, allPassed } = await runPythonTests(
        'def saudacao():\n    nome = input()\n    idade = input()\n    return f"Ola {nome}, {idade} anos"',
        [
          {
            input: [],
            expected: 'Ola Ana, 13 anos',
            description: 'saudacao() lê nome e idade via input()',
            stdin: ['Ana', '13'],
          },
        ],
        'saudacao',
        pool,
      )
      expect(allPassed).toBe(true)
      expect(results[0]?.actual).toBe('Ola Ana, 13 anos')
    },
    20000,
  )

  it(
    'stdin: fila esgotada reprova com EOFError, sem travar o worker',
    async () => {
      const { results, allPassed } = await runPythonTests(
        'def f():\n    a = input()\n    b = input()\n    return a + b',
        [{ input: [], expected: 'x', description: 'f() pede 2 inputs, só 1 na fila', stdin: ['so-um'] }],
        'f',
        pool,
      )
      expect(allPassed).toBe(false)
      expect(String(results[0]?.actual)).toMatch(/EOFError/)
    },
    20000,
  )

  it(
    'stdin: input() sem stdin nenhum configurado reprova (nunca trava esperando stdin real)',
    async () => {
      const { results, allPassed } = await runPythonTests(
        'def f():\n    return input()',
        [{ input: [], expected: 'x', description: 'f() chama input() sem stdin no testCase' }],
        'f',
        pool,
      )
      expect(allPassed).toBe(false)
      expect(String(results[0]?.actual)).toMatch(/EOFError/)
    },
    20000,
  )

  it(
    'stdin: isolamento — fila de uma submissão não vaza pra próxima',
    async () => {
      const primeira = await runPythonTests(
        'x = input()',
        [{ input: null, expected: 'str', description: 'x deve ser do tipo str', stdin: ['ola'] }],
        null,
        pool,
      )
      expect(primeira.allPassed).toBe(true)

      const segunda = await runPythonTests(
        'x = input()',
        [{ input: null, expected: 'str', description: 'x deve ser do tipo str' }], // sem stdin
        null,
        pool,
      )
      expect(segunda.results[0]?.passed).toBe(false) // sem fila própria, deve dar EOFError, não reusar a "ola" da execução anterior
    },
    20000,
  )

  it(
    'timeout: loop infinito reprova em vez de travar o teste',
    async () => {
      const { results, allPassed } = await runPythonTests(
        'def trava():\n    while True:\n        pass',
        [{ input: [], expected: 1, description: 'trava()' }],
        'trava',
        pool,
      )
      expect(allPassed).toBe(false)
      expect(String(results[0]?.actual)).toMatch(/tempo limite/i)
    },
    10000,
  )
})
