/**
 * Seed da trilha "JavaScript: Algoritmos Clássicos" no CATÁLOGO GLOBAL.
 * Trilha 9/14 — ver docs/pesquisa-trilhas-js.md e docs/trilha-js-09-algoritmos.md.
 * Execução: pnpm --filter @codinhos/api db:seed:js-09
 * Idempotente. Modo: function-call. Introduz RegExp.test e charCodeAt/fromCharCode.
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

const TRAIL_SLUG = 'js-algoritmos'
const TRAIL_TITLE = 'JavaScript: Algoritmos Clássicos'
const TRAIL_DESC =
  'Aplica tudo em problemas clássicos: FizzBuzz, frequência, regex, anagramas, cifra de César, mediana e romano. Pré-requisito: Alta Ordem e Estilo Funcional.'
const TRAIL_ORDER = 90

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
    title: 'Lição 1 — O que é um algoritmo',
    concept:
      'Um **algoritmo** é uma receita de passos para resolver um problema. Aqui você junta as ferramentas das trilhas anteriores (laços, objetos, HOF, strings) e treina o olhar para **casos de borda** (lista vazia, empate, limites).',
    exampleCode: '// dividir o problema em passos claros antes de codar',
    vocabulary: ['algoritmo', 'caso de borda'],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: '9.1 FizzBuzz',
    concept: 'Para cada número de 1 a n: múltiplo de 3 e 5 → "FizzBuzz"; de 3 → "Fizz"; de 5 → "Buzz"; senão o próprio número (como texto).',
    exampleCode: 'if (i % 15 === 0) r.push("FizzBuzz")',
    vocabulary: ['for', '%', '.push()'],
    difficulty: 'medium',
    baseXp: 20,
    description: 'Escreva `fizzBuzz(n)` que retorna uma lista de 1 a n aplicando a regra do FizzBuzz (números viram texto).',
    starterCode: 'function fizzBuzz(n) {\n  // escreva seu código aqui\n}\n',
    targetFn: 'fizzBuzz',
    testCases: [
      { input: [5], expected: ['1', '2', 'Fizz', '4', 'Buzz'], description: '1..5' },
      {
        input: [15],
        expected: ['1', '2', 'Fizz', '4', 'Buzz', 'Fizz', '7', '8', 'Fizz', 'Buzz', '11', 'Fizz', '13', '14', 'FizzBuzz'],
        description: '1..15',
      },
    ],
  },
  {
    kind: 'lesson',
    title: 'Lição 2 — Objeto como contador',
    concept:
      'Um padrão clássico: usar um objeto para **contar** ocorrências. Para cada item, `c[item] = (c[item] || 0) + 1` — se ainda não existe, começa do 0.',
    exampleCode: 'const c = {}\nfor (const x of ["a", "b", "a"]) c[x] = (c[x] || 0) + 1\n// c = { a: 2, b: 1 }',
    vocabulary: ['objeto', 'contador'],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: '9.2 Frequência',
    concept: 'Monte um objeto-contador percorrendo a lista.',
    exampleCode: 'c[x] = (c[x] || 0) + 1',
    vocabulary: ['objeto', 'contador', 'for...of'],
    difficulty: 'medium',
    baseXp: 20,
    description: 'Escreva `frequencia(lista)` que retorna um objeto com quantas vezes cada item aparece.',
    starterCode: 'function frequencia(lista) {\n  // objeto-contador\n}\n',
    targetFn: 'frequencia',
    testCases: [
      { input: [['a', 'b', 'a']], expected: { a: 2, b: 1 }, description: 'a:2, b:1' },
      { input: [['x']], expected: { x: 1 }, description: 'x:1' },
    ],
  },
  {
    kind: 'challenge',
    title: '9.3 Moda',
    concept: 'Conte a frequência e devolva o item que mais aparece.',
    exampleCode: '// use um objeto-contador e guarde o de maior contagem',
    vocabulary: ['objeto', 'contador'],
    difficulty: 'medium',
    baseXp: 20,
    description: 'Escreva `moda(lista)` que retorna o item que mais se repete (a lista nunca é vazia; se houver empate, vale o que aparece primeiro).',
    starterCode: 'function moda(lista) {\n  // conte e ache o mais frequente\n}\n',
    targetFn: 'moda',
    testCases: [
      { input: [[1, 2, 2, 3, 2]], expected: 2, description: '2 é a moda' },
      { input: [['a', 'b', 'a']], expected: 'a', description: 'a é a moda' },
    ],
  },
  {
    kind: 'lesson',
    title: 'Lição 3 — Trabalhando com sublistas',
    concept:
      'Uma lista pode conter outras listas (lista de listas). Com `.map` você transforma cada sublista; `Math.max(...sub)` pega o maior de uma sublista (o spread espalha os itens como argumentos).',
    exampleCode: '[[1, 5], [9, 2]].map((sub) => Math.max(...sub))   // [5, 9]',
    vocabulary: ['.map()', 'Math.max', 'spread'],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: '9.4 Maior de cada sublista',
    concept: '`.map` sobre as sublistas + `Math.max(...sub)`.',
    exampleCode: 'listas.map((sub) => Math.max(...sub))',
    vocabulary: ['.map()', 'Math.max', 'spread'],
    difficulty: 'medium',
    baseXp: 20,
    description: 'Escreva `maioresDeCada(listas)` que retorna uma lista com o maior de cada sublista.',
    starterCode: 'function maioresDeCada(listas) {\n  // use .map e Math.max(...sub)\n}\n',
    targetFn: 'maioresDeCada',
    testCases: [
      { input: [[[1, 5], [9, 2, 7]]], expected: [5, 9], description: '[5, 9]' },
      { input: [[[3], [-1, -5]]], expected: [3, -1], description: 'com negativos' },
    ],
  },
  {
    kind: 'challenge',
    title: '9.5 Agrupar por paridade',
    concept: 'Monte um objeto com duas listas e vá empurrando cada número na certa.',
    exampleCode: 'const r = { pares: [], impares: [] }',
    vocabulary: ['objeto', '.push()', '%'],
    difficulty: 'medium',
    baseXp: 20,
    description: 'Escreva `agrupar(lista)` que retorna `{ pares: [...], impares: [...] }`.',
    starterCode: 'function agrupar(lista) {\n  // separe pares e ímpares\n}\n',
    targetFn: 'agrupar',
    testCases: [
      { input: [[1, 2, 3, 4]], expected: { pares: [2, 4], impares: [1, 3] }, description: '1..4' },
      { input: [[2, 4]], expected: { pares: [2, 4], impares: [] }, description: 'só pares' },
    ],
  },
  {
    kind: 'lesson',
    title: 'Lição 4 — Texto e padrões: regex',
    concept:
      'Uma **expressão regular** (regex) descreve um padrão de texto. `/^\\d{4}-\\d{4}$/.test(txt)` verifica se o texto tem exatamente 4 dígitos, um traço e mais 4 dígitos (`\\d` = dígito, `{4}` = quatro vezes, `^`/`$` = início/fim).',
    exampleCode: '/^\\d{4}-\\d{4}$/.test("1234-5678")   // true',
    vocabulary: ['regex', '.test()'],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: '9.6 Validar telefone',
    concept: 'Use `/^\\d{4}-\\d{4}$/.test(...)` para validar o formato 0000-0000.',
    exampleCode: '/^\\d{4}-\\d{4}$/.test(s)',
    vocabulary: ['regex', '.test()'],
    difficulty: 'medium',
    baseXp: 20,
    description: 'Escreva `validarTelefone(s)` que retorna true se s tem o formato "0000-0000" (4 dígitos, traço, 4 dígitos).',
    starterCode: 'function validarTelefone(s) {\n  // use uma regex com .test()\n}\n',
    targetFn: 'validarTelefone',
    testCases: [
      { input: ['1234-5678'], expected: true, description: 'formato certo' },
      { input: ['12-34'], expected: false, description: 'formato errado' },
      { input: ['12345678'], expected: false, description: 'sem traço' },
    ],
  },
  {
    kind: 'challenge',
    title: '9.7 São anagramas?',
    concept: 'Duas palavras são anagramas se, ordenando as letras, ficam iguais.',
    exampleCode: 'const ordena = (s) => s.split("").sort().join("")',
    vocabulary: ['.split()', '.sort()', '.join()'],
    difficulty: 'medium',
    baseXp: 20,
    description: 'Escreva `saoAnagramas(a, b)` que retorna true se as duas palavras têm exatamente as mesmas letras.',
    starterCode: 'function saoAnagramas(a, b) {\n  // ordene as letras das duas e compare\n}\n',
    targetFn: 'saoAnagramas',
    testCases: [
      { input: ['amor', 'roma'], expected: true, description: 'amor/roma' },
      { input: ['abc', 'abd'], expected: false, description: 'letras diferentes' },
    ],
  },
  {
    kind: 'lesson',
    title: 'Lição 5 — Códigos de caractere',
    concept:
      'Cada letra tem um número (código Unicode). `"a".charCodeAt(0)` é 97; `String.fromCharCode(97)` é "a". Somando ao código dá para "andar" no alfabeto — a base de cifras.',
    exampleCode: '"a".charCodeAt(0)          // 97\nString.fromCharCode(98)    // "b"',
    vocabulary: ['.charCodeAt()', 'String.fromCharCode'],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: '9.8 Cifra de César',
    concept: 'Some n ao código de cada letra minúscula, dando a volta no alfabeto com `% 26` (base em 97).',
    exampleCode: 'const novo = ((c.charCodeAt(0) - 97 + n) % 26) + 97',
    vocabulary: ['.charCodeAt()', 'String.fromCharCode', '%'],
    difficulty: 'hard',
    baseXp: 25,
    description: 'Escreva `cifra(texto, n)` que desloca cada letra minúscula (a-z) em n posições, dando a volta (z+1 = a). O texto só tem letras minúsculas.',
    starterCode: 'function cifra(texto, n) {\n  // charCodeAt + fromCharCode + % 26\n}\n',
    targetFn: 'cifra',
    testCases: [
      { input: ['abc', 1], expected: 'bcd', description: 'abc +1 = bcd' },
      { input: ['xyz', 3], expected: 'abc', description: 'xyz +3 = abc (dá a volta)' },
      { input: ['codi', 0], expected: 'codi', description: '+0 não muda' },
    ],
  },
  {
    kind: 'challenge',
    title: '9.9 Mediana',
    concept: 'Ordene uma cópia; se a quantidade é ímpar, a mediana é o do meio; se é par, é a média dos dois do meio.',
    exampleCode: 'const s = [...lista].sort((a, b) => a - b)',
    vocabulary: ['.sort()', 'spread', 'mediana'],
    difficulty: 'hard',
    baseXp: 25,
    description: 'Escreva `mediana(lista)` (nunca vazia) que retorna a mediana dos números.',
    starterCode: 'function mediana(lista) {\n  // ordene e pegue o(s) do meio\n}\n',
    targetFn: 'mediana',
    testCases: [
      { input: [[3, 1, 2]], expected: 2, description: 'ímpar: meio = 2' },
      { input: [[1, 2, 3, 4]], expected: 2.5, description: 'par: (2+3)/2 = 2.5' },
      { input: [[5]], expected: 5, description: 'um só' },
    ],
  },
  {
    kind: 'challenge',
    title: '9.10 [Fecha a trilha] Inteiro para romano',
    concept: 'Use uma lista de pares (valor, símbolo) do maior para o menor; enquanto o número comporta o valor, cole o símbolo e subtraia.',
    exampleCode: 'const pares = [[10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]]',
    vocabulary: ['array', 'while', 'algoritmo'],
    difficulty: 'hard',
    baseXp: 30,
    description: 'Escreva `intParaRomano(n)` (1 a 3999) que retorna o número romano correspondente. Ex.: 4 -> "IV", 9 -> "IX", 58 -> "LVIII".',
    starterCode: 'function intParaRomano(n) {\n  // lista de pares valor->símbolo + while\n}\n',
    targetFn: 'intParaRomano',
    testCases: [
      { input: [4], expected: 'IV', description: '4 = IV' },
      { input: [9], expected: 'IX', description: '9 = IX' },
      { input: [58], expected: 'LVIII', description: '58 = LVIII' },
      { input: [1994], expected: 'MCMXCIV', description: '1994 = MCMXCIV' },
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
