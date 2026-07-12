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
