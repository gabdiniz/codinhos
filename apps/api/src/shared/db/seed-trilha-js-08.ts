/**
 * Seed da trilha "JavaScript: Recursão de Verdade" no CATÁLOGO GLOBAL.
 * Trilha 8/14 — ver docs/pesquisa-trilhas-js.md e docs/trilha-js-08-recursao.md.
 * Execução: pnpm --filter @codinhos/api db:seed:js-08
 * Idempotente. Modos: function-call (resultado) + ast (estrutura: requireRecursion,
 * forbidLoops, forbidMethod, requireMethod). Verificado: solução boa passa; solução
 * com laço reprova pela astRule.
 */

import 'dotenv/config'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { eq, and } from 'drizzle-orm'
import { trails, trailModules, challenges } from './schema.js'

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) {
  console.error('❌  DATABASE_URL não definida.')
  process.exit(1)
}

const client = postgres(DATABASE_URL, { max: 5 })
const db = drizzle(client)

const TRAIL_SLUG = 'js-recursao'
const TRAIL_TITLE = 'JavaScript: Recursão de Verdade'
const TRAIL_DESC =
  'Recursão como redução do problema (caso base + passo), provando resolver sem for — com verificação estrutural (astRule). Pré-requisito: Listas e Textos.'
const TRAIL_ORDER = 80

type AstRule = { kind: 'requireRecursion' | 'forbidLoops' | 'requireMethod' | 'forbidMethod'; name?: string }

type Modulo = {
  kind: 'lesson' | 'challenge'
  title: string
  concept: string
  exampleCode: string
  vocabulary: string[]
  difficulty: 'easy' | 'medium' | 'hard'
  baseXp: number
  description: string
  starterCode: string
  targetFn?: string
  testCases: {
    input: unknown
    expected: unknown
    description: string
    mode?: 'stdout' | 'ast'
    matcher?: 'equal' | 'approx' | 'contains' | 'regex'
    tolerance?: number
    astRule?: AstRule
  }[]
}

// atalhos p/ os casos de estrutura
const REC = (): { input: null; expected: true; description: string; mode: 'ast'; astRule: AstRule } => ({
  input: null,
  expected: true,
  description: 'usa recursão (a função chama a si mesma)',
  mode: 'ast',
  astRule: { kind: 'requireRecursion' },
})
const NOLOOP = (): { input: null; expected: true; description: string; mode: 'ast'; astRule: AstRule } => ({
  input: null,
  expected: true,
  description: 'resolve sem laços (for/while/forEach)',
  mode: 'ast',
  astRule: { kind: 'forbidLoops' },
})
const NOMETHOD = (name: string) => ({
  input: null as null,
  expected: true as const,
  description: `resolve sem usar .${name}()`,
  mode: 'ast' as const,
  astRule: { kind: 'forbidMethod' as const, name },
})
const USEMETHOD = (name: string) => ({
  input: null as null,
  expected: true as const,
  description: `usa .${name}() como pedido`,
  mode: 'ast' as const,
  astRule: { kind: 'requireMethod' as const, name },
})

const trilhaModules: Modulo[] = [
  {
    kind: 'lesson',
    title: 'Lição 1 — Funções que chamam a si mesmas',
    concept:
      'Recursão é uma função que **chama a si mesma** com um problema menor, até chegar no **caso base** (o menor caso, que já sabemos responder sem recursão). Pense em bonecas russas: abrir uma revela outra menor, até a última que não abre.',
    exampleCode:
      'function contagem(n) {\n  if (n < 1) return        // caso base\n  console.log(n)\n  contagem(n - 1)          // passo recursivo\n}\n// contagem(3) mostra 3, 2, 1',
    vocabulary: ['recursão', 'caso base', 'passo recursivo'],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: '8.1 Contagem regressiva',
    concept: 'Devolva uma lista de n até 1. Caso base: n < 1 devolve `[]`. Passo: `[n, ...contagem(n - 1)]`.',
    exampleCode: 'function ate(n) {\n  if (n < 1) return []\n  return [n, ...ate(n - 1)]\n}',
    vocabulary: ['recursão', 'caso base'],
    difficulty: 'medium',
    baseXp: 20,
    description: 'Escreva `contagem(n)` que retorna a lista de n até 1. Use recursão (sem laço).',
    starterCode: 'function contagem(n) {\n  // caso base + passo recursivo\n}\n',
    targetFn: 'contagem',
    testCases: [
      { input: [3], expected: [3, 2, 1], description: 'contagem(3)' },
      { input: [1], expected: [1], description: 'contagem(1)' },
      { input: [0], expected: [], description: 'contagem(0) = []' },
      REC(),
      NOLOOP(),
    ],
  },
  {
    kind: 'challenge',
    title: '8.2 Soma de 1 até N',
    concept: 'Caso base: n <= 0 devolve 0. Passo: `n + somaAte(n - 1)`.',
    exampleCode: 'function somaAte(n) {\n  if (n <= 0) return 0\n  return n + somaAte(n - 1)\n}',
    vocabulary: ['recursão'],
    difficulty: 'medium',
    baseXp: 20,
    description: 'Escreva `somaAte(n)` que soma 1 + 2 + ... + n usando recursão (sem laço).',
    starterCode: 'function somaAte(n) {\n  // recursão\n}\n',
    targetFn: 'somaAte',
    testCases: [
      { input: [5], expected: 15, description: '1..5 = 15' },
      { input: [1], expected: 1, description: '1 = 1' },
      { input: [0], expected: 0, description: '0 = 0' },
      REC(),
      NOLOOP(),
    ],
  },
  {
    kind: 'lesson',
    title: 'Lição 2 — O caso base vem primeiro',
    concept:
      'Sempre comece pelo **caso base** — sem ele, a recursão nunca para (estoura). Depois escreva o passo, sempre chamando a si mesma com um problema **menor** (mais perto do caso base).',
    exampleCode: 'function f(n) {\n  if (n === 0) return 1   // 1º: caso base\n  return n * f(n - 1)     // 2º: passo (n menor)\n}',
    vocabulary: ['caso base'],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: '8.3 Fatorial recursivo',
    concept: 'Caso base: n <= 1 devolve 1. Passo: `n * fatorial(n - 1)`.',
    exampleCode: 'function fatorial(n) {\n  if (n <= 1) return 1\n  return n * fatorial(n - 1)\n}',
    vocabulary: ['recursão'],
    difficulty: 'medium',
    baseXp: 20,
    description: 'Escreva `fatorial(n)` usando recursão (sem laço). fatorial(0) = 1.',
    starterCode: 'function fatorial(n) {\n  // recursão\n}\n',
    targetFn: 'fatorial',
    testCases: [
      { input: [5], expected: 120, description: '5! = 120' },
      { input: [0], expected: 1, description: '0! = 1' },
      { input: [1], expected: 1, description: '1! = 1' },
      REC(),
      NOLOOP(),
    ],
  },
  {
    kind: 'challenge',
    title: '8.4 Potência recursiva',
    concept: 'Caso base: exp === 0 devolve 1. Passo: `base * potencia(base, exp - 1)`.',
    exampleCode: 'function potencia(base, exp) {\n  if (exp === 0) return 1\n  return base * potencia(base, exp - 1)\n}',
    vocabulary: ['recursão'],
    difficulty: 'medium',
    baseXp: 20,
    description: 'Escreva `potencia(base, exp)` usando recursão (sem laço). base^0 = 1.',
    starterCode: 'function potencia(base, exp) {\n  // recursão\n}\n',
    targetFn: 'potencia',
    testCases: [
      { input: [2, 3], expected: 8, description: '2^3 = 8' },
      { input: [5, 0], expected: 1, description: '5^0 = 1' },
      { input: [3, 2], expected: 9, description: '3^2 = 9' },
      REC(),
      NOLOOP(),
    ],
  },
  {
    kind: 'challenge',
    title: '8.5 Soma dos dígitos',
    concept: 'Caso base: n < 10 devolve n. Passo: `n % 10 + somaDigitos(Math.floor(n / 10))`.',
    exampleCode: 'function somaDigitos(n) {\n  if (n < 10) return n\n  return (n % 10) + somaDigitos(Math.floor(n / 10))\n}',
    vocabulary: ['recursão', '%'],
    difficulty: 'medium',
    baseXp: 20,
    description: 'Escreva `somaDigitos(n)` (inteiro positivo) usando recursão (sem laço). Ex.: 123 -> 6.',
    starterCode: 'function somaDigitos(n) {\n  // recursão\n}\n',
    targetFn: 'somaDigitos',
    testCases: [
      { input: [123], expected: 6, description: '1+2+3 = 6' },
      { input: [9], expected: 9, description: '9 = 9' },
      { input: [405], expected: 9, description: '4+0+5 = 9' },
      REC(),
      NOLOOP(),
    ],
  },
  {
    kind: 'challenge',
    title: '8.6 Palíndromo recursivo',
    concept: 'Compare a primeira e a última letra; se iguais, resolva o miolo. Caso base: 0 ou 1 letra é palíndromo.',
    exampleCode: 'function ehPal(s) {\n  if (s.length <= 1) return true\n  if (s[0] !== s[s.length - 1]) return false\n  return ehPal(s.slice(1, -1))\n}',
    vocabulary: ['recursão', '.slice()'],
    difficulty: 'hard',
    baseXp: 25,
    description: 'Escreva `ehPalindromo(texto)` usando recursão (sem laço): true se o texto é igual de trás para frente.',
    starterCode: 'function ehPalindromo(texto) {\n  // recursão\n}\n',
    targetFn: 'ehPalindromo',
    testCases: [
      { input: ['arara'], expected: true, description: 'arara é palíndromo' },
      { input: ['casa'], expected: false, description: 'casa não é' },
      { input: ['a'], expected: true, description: 'uma letra é' },
      REC(),
      NOLOOP(),
    ],
  },
  {
    kind: 'lesson',
    title: 'Lição 3 — Recursão sobre listas: cabeça e cauda',
    concept:
      'Uma lista pode ser vista como **cabeça** (`lista[0]`) + **cauda** (`lista.slice(1)`, o resto). A recursão resolve a cabeça e chama a si mesma com a cauda, até a lista ficar vazia (caso base).',
    exampleCode: 'function soma(lista) {\n  if (lista.length === 0) return 0\n  return lista[0] + soma(lista.slice(1))\n}',
    vocabulary: ['cabeça', 'cauda', '.slice()'],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: '8.7 Maior da lista (sem loop, sem Math.max)',
    concept: 'Compare a cabeça com o maior da cauda. Caso base: lista de 1 item devolve ele mesmo.',
    exampleCode: 'function maior(l) {\n  if (l.length === 1) return l[0]\n  const r = maior(l.slice(1))\n  return l[0] > r ? l[0] : r\n}',
    vocabulary: ['recursão', 'cabeça', 'cauda'],
    difficulty: 'hard',
    baseXp: 25,
    description: 'Escreva `maiorDaLista(lista)` usando recursão, SEM laço e SEM Math.max. A lista nunca é vazia.',
    starterCode: 'function maiorDaLista(lista) {\n  // recursão sobre cabeça e cauda\n}\n',
    targetFn: 'maiorDaLista',
    testCases: [
      { input: [[3, 7, 2]], expected: 7, description: 'maior = 7' },
      { input: [[-5, -1, -9]], expected: -1, description: 'maior dos negativos' },
      { input: [[10]], expected: 10, description: 'um item' },
      REC(),
      NOLOOP(),
      NOMETHOD('max'),
    ],
  },
  {
    kind: 'challenge',
    title: '8.8 Inverter string (sem .reverse, sem loop)',
    concept: 'Inverta a cauda e cole a cabeça no fim. Caso base: string vazia devolve "".',
    exampleCode: 'function inv(s) {\n  if (s === "") return ""\n  return inv(s.slice(1)) + s[0]\n}',
    vocabulary: ['recursão', '.slice()'],
    difficulty: 'hard',
    baseXp: 25,
    description: 'Escreva `inverterTexto(texto)` usando recursão, SEM laço e SEM .reverse().',
    starterCode: 'function inverterTexto(texto) {\n  // recursão\n}\n',
    targetFn: 'inverterTexto',
    testCases: [
      { input: ['abc'], expected: 'cba', description: 'abc -> cba' },
      { input: ['Codi'], expected: 'idoC', description: 'Codi -> idoC' },
      { input: [''], expected: '', description: 'vazio' },
      REC(),
      NOLOOP(),
      NOMETHOD('reverse'),
    ],
  },
  {
    kind: 'challenge',
    title: '8.9 MDC (algoritmo de Euclides)',
    concept: 'MDC(a, b) = MDC(b, a % b), até b ser 0 (aí o MDC é a). Recursão pura.',
    exampleCode: 'function mdc(a, b) {\n  if (b === 0) return a\n  return mdc(b, a % b)\n}',
    vocabulary: ['recursão', '%'],
    difficulty: 'hard',
    baseXp: 25,
    description: 'Escreva `mdc(a, b)` (máximo divisor comum) usando o algoritmo de Euclides, com recursão (sem laço).',
    starterCode: 'function mdc(a, b) {\n  // Euclides recursivo\n}\n',
    targetFn: 'mdc',
    testCases: [
      { input: [12, 8], expected: 4, description: 'mdc(12,8) = 4' },
      { input: [48, 36], expected: 12, description: 'mdc(48,36) = 12' },
      { input: [7, 0], expected: 7, description: 'mdc(7,0) = 7' },
      REC(),
      NOLOOP(),
    ],
  },
  {
    kind: 'challenge',
    title: '8.10 Busca binária recursiva',
    concept: 'Numa lista ORDENADA, olhe o meio: se for o alvo, achou; se o alvo é menor, busque na metade esquerda; senão na direita.',
    exampleCode: 'const meio = Math.floor(lista.length / 2)',
    vocabulary: ['recursão', 'busca binária', '.slice()'],
    difficulty: 'hard',
    baseXp: 25,
    description:
      'Escreva `buscaBinaria(lista, alvo)` (lista ordenada) que retorna true se o alvo está na lista, usando recursão (sem laço).',
    starterCode: 'function buscaBinaria(lista, alvo) {\n  // divida no meio e busque no lado certo\n}\n',
    targetFn: 'buscaBinaria',
    testCases: [
      { input: [[1, 3, 5, 7, 9], 7], expected: true, description: 'acha 7' },
      { input: [[1, 3, 5, 7, 9], 4], expected: false, description: 'não acha 4' },
      { input: [[2, 4, 6], 2], expected: true, description: 'acha o primeiro' },
      REC(),
      NOLOOP(),
    ],
  },
  {
    kind: 'lesson',
    title: 'Lição 4 — Métodos de array em vez de loop',
    concept:
      '"Sem for" nem sempre é recursão: `map`, `filter` e `reduce` (trilha de Alta Ordem) também resolvem sem laço explícito, de forma declarativa.',
    exampleCode: '[1, 2, 3].map((x) => x * 2)   // [2, 4, 6] — sem for',
    vocabulary: ['.map()', '.filter()'],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: '8.11 Dobrar com .map (sem for)',
    concept: 'Resolva com `.map`, sem nenhum laço.',
    exampleCode: 'lista.map((x) => x + 1)',
    vocabulary: ['.map()'],
    difficulty: 'medium',
    baseXp: 15,
    description: 'Escreva `dobrar(lista)` que dobra cada item usando `.map` (sem laço).',
    starterCode: 'function dobrar(lista) {\n  // use .map, sem for\n}\n',
    targetFn: 'dobrar',
    testCases: [
      { input: [[1, 2, 3]], expected: [2, 4, 6], description: '[1,2,3] -> [2,4,6]' },
      { input: [[0, 5]], expected: [0, 10], description: '[0,5] -> [0,10]' },
      USEMETHOD('map'),
      NOLOOP(),
    ],
  },
  {
    kind: 'challenge',
    title: '8.12 Filtrar com .filter (sem for)',
    concept: 'Resolva com `.filter`, sem nenhum laço.',
    exampleCode: 'lista.filter((x) => x > 0)',
    vocabulary: ['.filter()'],
    difficulty: 'medium',
    baseXp: 15,
    description: 'Escreva `pares(lista)` que devolve só os pares usando `.filter` (sem laço).',
    starterCode: 'function pares(lista) {\n  // use .filter, sem for\n}\n',
    targetFn: 'pares',
    testCases: [
      { input: [[1, 2, 3, 4]], expected: [2, 4], description: 'pares de 1..4' },
      { input: [[1, 3]], expected: [], description: 'nenhum par' },
      USEMETHOD('filter'),
      NOLOOP(),
    ],
  },
  {
    kind: 'challenge',
    title: '8.13 [Fecha a trilha] Torres de Hanói',
    concept: 'Mover n discos = mover (n-1), mover o maior, mover (n-1) de novo. O número de movimentos segue: hanoi(n) = 2 × hanoi(n-1) + 1.',
    exampleCode: 'function hanoi(n) {\n  if (n === 0) return 0\n  return 2 * hanoi(n - 1) + 1\n}',
    vocabulary: ['recursão'],
    difficulty: 'hard',
    baseXp: 30,
    description: 'Escreva `hanoi(n)` que retorna o número mínimo de movimentos para n discos, usando recursão (sem laço).',
    starterCode: 'function hanoi(n) {\n  // recursão\n}\n',
    targetFn: 'hanoi',
    testCases: [
      { input: [3], expected: 7, description: '3 discos = 7' },
      { input: [1], expected: 1, description: '1 disco = 1' },
      { input: [0], expected: 0, description: '0 discos = 0' },
      REC(),
      NOLOOP(),
    ],
  },
]

async function seedTrilha() {
  console.log('🌱  Semeando/atualizando trilha:', TRAIL_TITLE)

  let [trail] = await db.select({ id: trails.id }).from(trails).where(eq(trails.slug, TRAIL_SLUG)).limit(1)

  if (!trail) {
    ;[trail] = await db
      .insert(trails)
      .values({ slug: TRAIL_SLUG, title: TRAIL_TITLE, description: TRAIL_DESC, language: 'javascript', order: TRAIL_ORDER })
      .returning({ id: trails.id })
    console.log('  ✅  Trilha criada:', trail!.id)
  } else {
    console.log('  ⏩  Trilha já existe:', trail.id)
  }

  let licoes = 0
  let desafios = 0
  for (let i = 0; i < trilhaModules.length; i++) {
    const m = trilhaModules[i]!
    const order = i + 1

    let [mod] = await db
      .select({ id: trailModules.id })
      .from(trailModules)
      .where(and(eq(trailModules.trailId, trail!.id), eq(trailModules.order, order)))
      .limit(1)

    if (!mod) {
      ;[mod] = await db
        .insert(trailModules)
        .values({ trailId: trail!.id, title: m.title, concept: m.concept, exampleCode: m.exampleCode, vocabulary: m.vocabulary, order })
        .returning({ id: trailModules.id })
    } else {
      await db
        .update(trailModules)
        .set({ title: m.title, concept: m.concept, exampleCode: m.exampleCode, vocabulary: m.vocabulary })
        .where(eq(trailModules.id, mod.id))
    }

    if (m.kind === 'lesson') {
      await db.delete(challenges).where(eq(challenges.moduleId, mod!.id))
      licoes++
      continue
    }

    const [ch] = await db.select({ id: challenges.id }).from(challenges).where(eq(challenges.moduleId, mod!.id)).limit(1)

    if (!ch) {
      await db.insert(challenges).values({
        moduleId: mod!.id,
        title: m.title,
        description: m.description,
        starterCode: m.starterCode,
        testCases: m.testCases,
        difficulty: m.difficulty,
        baseXp: m.baseXp,
        targetFn: m.targetFn ?? null,
        order: 1,
      })
    } else {
      await db
        .update(challenges)
        .set({
          title: m.title,
          description: m.description,
          starterCode: m.starterCode,
          testCases: m.testCases,
          difficulty: m.difficulty,
          baseXp: m.baseXp,
          targetFn: m.targetFn ?? null,
        })
        .where(eq(challenges.id, ch.id))
    }
    desafios++
  }

  console.log(`  ✅  ${trilhaModules.length} módulos (${licoes} lições, ${desafios} desafios)`)
  await client.end()
}

seedTrilha().catch((err) => {
  console.error('❌  Erro ao semear:', err)
  process.exit(1)
})
