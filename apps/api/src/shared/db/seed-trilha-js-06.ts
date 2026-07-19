/**
 * Seed da trilha "JavaScript: Alta Ordem e Estilo Funcional" no CATÁLOGO GLOBAL.
 * Trilha 6/14 — ver docs/pesquisa-trilhas-js.md e docs/trilha-js-06-alta-ordem-e-funcional.md.
 * Execução: pnpm --filter @codinhos/api db:seed:js-06
 * Idempotente. Modo: function-call.
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

const TRAIL_SLUG = 'js-alta-ordem-e-funcional'
const TRAIL_TITLE = 'JavaScript: Alta Ordem e Estilo Funcional'
const TRAIL_DESC =
  'Funções como valor e os métodos que substituem o for: map, filter, reduce, find, some, every, sort. Pré-requisito: Listas e Textos.'
const TRAIL_ORDER = 60

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
  }[]
}

const trilhaModules: Modulo[] = [
  {
    kind: 'lesson',
    title: 'Lição 1 — Função como valor e map',
    concept:
      'Uma função pode ser **passada como valor** para outra função. `.map(fn)` cria uma NOVA lista aplicando `fn` a cada item — o jeito declarativo de transformar uma lista sem `for`.',
    exampleCode: '[1, 2, 3].map((x) => x * 10)   // [10, 20, 30]',
    vocabulary: ['.map()', 'arrow function'],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: '6.1 Dobrar todos',
    concept: '`.map(x => x * 2)` devolve uma nova lista com cada item dobrado.',
    exampleCode: 'function maisUm(lista) {\n  return lista.map((x) => x + 1)\n}',
    vocabulary: ['.map()'],
    difficulty: 'easy',
    baseXp: 10,
    description: 'Escreva `dobrarTodos(lista)` que retorna uma nova lista com cada número dobrado.',
    starterCode: 'function dobrarTodos(lista) {\n  // use .map()\n}\n',
    targetFn: 'dobrarTodos',
    testCases: [
      { input: [[1, 2, 3]], expected: [2, 4, 6], description: '[1,2,3] -> [2,4,6]' },
      { input: [[0, 5]], expected: [0, 10], description: '[0,5] -> [0,10]' },
      { input: [[]], expected: [], description: 'lista vazia' },
    ],
  },
  {
    kind: 'challenge',
    title: '6.2 Nomes em maiúsculo',
    concept: 'Dentro do `.map` você pode chamar um método de string em cada item.',
    exampleCode: 'function menores(nomes) {\n  return nomes.map((n) => n.toLowerCase())\n}',
    vocabulary: ['.map()', '.toUpperCase()'],
    difficulty: 'easy',
    baseXp: 10,
    description: 'Escreva `maiusculas(nomes)` que retorna a lista com cada nome em MAIÚSCULAS.',
    starterCode: 'function maiusculas(nomes) {\n  // use .map()\n}\n',
    targetFn: 'maiusculas',
    testCases: [
      { input: [['ana', 'rex']], expected: ['ANA', 'REX'], description: 'ana, rex' },
      { input: [['codi']], expected: ['CODI'], description: 'codi' },
    ],
  },
  {
    kind: 'lesson',
    title: 'Lição 2 — filter',
    concept: '`.filter(fn)` devolve uma nova lista só com os itens em que `fn` retorna `true`.',
    exampleCode: '[1, 2, 3, 4].filter((x) => x > 2)   // [3, 4]',
    vocabulary: ['.filter()'],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: '6.3 Só os pares',
    concept: '`.filter(x => x % 2 === 0)` mantém só os pares.',
    exampleCode: 'function positivos(lista) {\n  return lista.filter((x) => x > 0)\n}',
    vocabulary: ['.filter()', '%'],
    difficulty: 'easy',
    baseXp: 10,
    description: 'Escreva `soPares(lista)` que retorna só os números pares.',
    starterCode: 'function soPares(lista) {\n  // use .filter()\n}\n',
    targetFn: 'soPares',
    testCases: [
      { input: [[1, 2, 3, 4]], expected: [2, 4], description: 'pares de 1..4' },
      { input: [[1, 3, 5]], expected: [], description: 'nenhum par' },
    ],
  },
  {
    kind: 'challenge',
    title: '6.4 Quantos maiores que N',
    concept: 'Filtre e conte com `.length`.',
    exampleCode: 'function quantosZeros(lista) {\n  return lista.filter((x) => x === 0).length\n}',
    vocabulary: ['.filter()', '.length'],
    difficulty: 'medium',
    baseXp: 15,
    description: 'Escreva `quantosMaiores(lista, n)` que retorna quantos itens são maiores que n.',
    starterCode: 'function quantosMaiores(lista, n) {\n  // use .filter().length\n}\n',
    targetFn: 'quantosMaiores',
    testCases: [
      { input: [[1, 5, 8, 2], 3], expected: 2, description: '5 e 8 são > 3' },
      { input: [[1, 2], 10], expected: 0, description: 'nenhum > 10' },
    ],
  },
  {
    kind: 'lesson',
    title: 'Lição 3 — reduce',
    concept:
      '`.reduce((acc, x) => ..., inicial)` combina a lista inteira num único valor. `acc` é o acumulador (começa em `inicial`) e vai sendo atualizado a cada item.',
    exampleCode: '[1, 2, 3].reduce((acc, x) => acc + x, 0)   // 6',
    vocabulary: ['.reduce()', 'acumulador'],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: '6.5 Somar tudo',
    concept: '`.reduce((a, b) => a + b, 0)` soma a lista.',
    exampleCode: 'function multiplicarTudo(lista) {\n  return lista.reduce((a, b) => a * b, 1)\n}',
    vocabulary: ['.reduce()'],
    difficulty: 'medium',
    baseXp: 15,
    description: 'Escreva `somarTudo(lista)` usando .reduce.',
    starterCode: 'function somarTudo(lista) {\n  // use .reduce()\n}\n',
    targetFn: 'somarTudo',
    testCases: [
      { input: [[1, 2, 3]], expected: 6, description: '1+2+3 = 6' },
      { input: [[10, 20]], expected: 30, description: '10+20 = 30' },
      { input: [[]], expected: 0, description: 'vazia = 0' },
    ],
  },
  {
    kind: 'challenge',
    title: '6.6 Média da lista',
    concept: 'Some com `.reduce` e divida por `.length`.',
    exampleCode: 'const total = [2, 4].reduce((a, b) => a + b, 0)  // 6',
    vocabulary: ['.reduce()', '.length'],
    difficulty: 'medium',
    baseXp: 15,
    description: 'Escreva `media(lista)` que retorna a média dos números (a lista nunca é vazia).',
    starterCode: 'function media(lista) {\n  // reduce / length\n}\n',
    targetFn: 'media',
    testCases: [
      { input: [[2, 4, 6]], expected: 4, description: 'média de 2,4,6 = 4' },
      { input: [[10]], expected: 10, description: 'média de um só' },
      { input: [[1, 2, 3, 4]], expected: 2.5, description: 'média de 1..4 = 2.5' },
    ],
  },
  {
    kind: 'lesson',
    title: 'Lição 4 — find, some e every',
    concept:
      '`.find(fn)` devolve o **primeiro** item que passa no teste. `.some(fn)` diz se **algum** passa (boolean). `.every(fn)` diz se **todos** passam (boolean).',
    exampleCode: '[1, 2, 3].find((x) => x > 1)     // 2\n[1, 2, 3].some((x) => x > 2)     // true\n[1, 2, 3].every((x) => x > 0)    // true',
    vocabulary: ['.find()', '.some()', '.every()'],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: '6.7 Achar o primeiro maior que N',
    concept: '`.find(x => x > n)` devolve o primeiro que passa.',
    exampleCode: 'function primeiroPar(lista) {\n  return lista.find((x) => x % 2 === 0)\n}',
    vocabulary: ['.find()'],
    difficulty: 'medium',
    baseXp: 15,
    description: 'Escreva `primeiroMaior(lista, n)` que retorna o primeiro item maior que n.',
    starterCode: 'function primeiroMaior(lista, n) {\n  // use .find()\n}\n',
    targetFn: 'primeiroMaior',
    testCases: [
      { input: [[1, 5, 3, 8], 4], expected: 5, description: 'primeiro > 4 é 5' },
      { input: [[2, 4, 6], 3], expected: 4, description: 'primeiro > 3 é 4' },
    ],
  },
  {
    kind: 'challenge',
    title: '6.8 Todos positivos?',
    concept: '`.every(x => x > 0)` já devolve o boolean.',
    exampleCode: 'function todosPares(lista) {\n  return lista.every((x) => x % 2 === 0)\n}',
    vocabulary: ['.every()'],
    difficulty: 'easy',
    baseXp: 10,
    description: 'Escreva `todosPositivos(lista)` que retorna true se todos os itens forem maiores que 0.',
    starterCode: 'function todosPositivos(lista) {\n  // use .every()\n}\n',
    targetFn: 'todosPositivos',
    testCases: [
      { input: [[1, 2, 3]], expected: true, description: 'todos positivos' },
      { input: [[1, -2, 3]], expected: false, description: 'tem um negativo' },
      { input: [[]], expected: true, description: 'lista vazia = true' },
    ],
  },
  {
    kind: 'challenge',
    title: '6.9 Algum negativo?',
    concept: '`.some(x => x < 0)` já devolve o boolean.',
    exampleCode: 'function temZero(lista) {\n  return lista.some((x) => x === 0)\n}',
    vocabulary: ['.some()'],
    difficulty: 'easy',
    baseXp: 10,
    description: 'Escreva `algumNegativo(lista)` que retorna true se houver algum número negativo.',
    starterCode: 'function algumNegativo(lista) {\n  // use .some()\n}\n',
    targetFn: 'algumNegativo',
    testCases: [
      { input: [[1, -2, 3]], expected: true, description: 'tem -2' },
      { input: [[1, 2, 3]], expected: false, description: 'nenhum negativo' },
    ],
  },
  {
    kind: 'lesson',
    title: 'Lição 5 — sort com comparador',
    concept:
      '`.sort((a, b) => a - b)` ordena números em ordem crescente. CUIDADO: `.sort` **altera** a lista original — copie antes com `[...lista]`.',
    exampleCode: '[...[3, 1, 2]].sort((a, b) => a - b)   // [1, 2, 3]',
    vocabulary: ['.sort()', 'comparador', 'spread'],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: '6.10 Ordenar crescente',
    concept: 'Copie com `[...lista]` e ordene com `.sort((a, b) => a - b)`.',
    exampleCode: 'function decrescente(lista) {\n  return [...lista].sort((a, b) => b - a)\n}',
    vocabulary: ['.sort()', 'spread'],
    difficulty: 'medium',
    baseXp: 15,
    description: 'Escreva `ordenar(lista)` que retorna uma NOVA lista em ordem crescente.',
    starterCode: 'function ordenar(lista) {\n  // copie e ordene\n}\n',
    targetFn: 'ordenar',
    testCases: [
      { input: [[3, 1, 2]], expected: [1, 2, 3], description: '[3,1,2] -> [1,2,3]' },
      { input: [[10, -5, 0]], expected: [-5, 0, 10], description: 'com negativo' },
    ],
  },
  {
    kind: 'challenge',
    title: '6.11 [Fecha a trilha] Boletim da turma',
    concept: 'Junte `.filter`, `.sort` e `.map`: filtre aprovados, ordene por nota (maior primeiro) e devolva só os nomes.',
    exampleCode: 'const nomes = alunos.map((a) => a.nome)',
    vocabulary: ['.filter()', '.sort()', '.map()'],
    difficulty: 'hard',
    baseXp: 25,
    description:
      'Recebe uma lista de `{ nome, nota }`. Escreva `aprovados(alunos)` que retorna os NOMES dos alunos com nota >= 7, do maior para o menor.',
    starterCode: 'function aprovados(alunos) {\n  // filter (nota >= 7) -> sort (nota desc) -> map (nome)\n}\n',
    targetFn: 'aprovados',
    testCases: [
      {
        input: [[{ nome: 'Ana', nota: 9 }, { nome: 'Rex', nota: 5 }, { nome: 'Bia', nota: 7 }]],
        expected: ['Ana', 'Bia'],
        description: 'Ana(9) e Bia(7), Rex reprovado',
      },
      {
        input: [[{ nome: 'Léo', nota: 4 }, { nome: 'Duda', nota: 10 }]],
        expected: ['Duda'],
        description: 'só Duda passa',
      },
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
