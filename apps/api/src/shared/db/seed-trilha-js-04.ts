/**
 * Seed da trilha "JavaScript: Listas e Textos" no CATÁLOGO GLOBAL.
 * Trilha 4/14 — ver docs/pesquisa-trilhas-js.md e docs/trilha-js-04-listas-e-strings.md.
 * Execução: pnpm --filter @codinhos/api db:seed:js-04
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

const TRAIL_SLUG = 'js-listas-e-strings'
const TRAIL_TITLE = 'JavaScript: Listas e Textos'
const TRAIL_DESC =
  'Arrays (índice, métodos, spread, alterar vs. copiar) e strings, mais percorrer/construir com laço. Pré-requisito: Funções.'
const TRAIL_ORDER = 40

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
    mode?: 'stdout'
    matcher?: 'equal' | 'approx' | 'contains' | 'regex'
    tolerance?: number
  }[]
}

const trilhaModules: Modulo[] = [
  {
    kind: 'lesson',
    title: 'Lição 1 — Listas: criar e acessar',
    concept:
      'Uma **lista** (array) guarda vários valores em ordem: `[10, 20, 30]`. Cada item tem um índice a partir de 0 (`lista[0]` é o primeiro), e `.length` diz quantos há (o último é `lista[lista.length - 1]`).',
    exampleCode: 'const a = [10, 20, 30]\na[0]        // 10\na.length    // 3',
    vocabulary: ['array', '[i]', '.length'],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: '4.1 Primeiro',
    concept: 'O primeiro item tem índice 0: `lista[0]`.',
    exampleCode: 'function segundo(lista) {\n  return lista[1]\n}',
    vocabulary: ['[0]'],
    difficulty: 'easy',
    baseXp: 10,
    description: 'Escreva `primeiro(lista)` que retorna o primeiro item.',
    starterCode: 'function primeiro(lista) {\n  // escreva seu código aqui\n}\n',
    targetFn: 'primeiro',
    testCases: [
      { input: [[10, 20, 30]], expected: 10, description: 'primeiro = 10' },
      { input: [['a', 'b']], expected: 'a', description: 'primeiro = "a"' },
    ],
  },
  {
    kind: 'challenge',
    title: '4.2 Último',
    concept: 'O último índice é `.length - 1` (porque começa em 0).',
    exampleCode: 'function penultimo(lista) {\n  return lista[lista.length - 2]\n}',
    vocabulary: ['.length', 'índice'],
    difficulty: 'easy',
    baseXp: 10,
    description: 'Escreva `ultimo(lista)` que retorna o último item.',
    starterCode: 'function ultimo(lista) {\n  // escreva seu código aqui\n}\n',
    targetFn: 'ultimo',
    testCases: [
      { input: [[10, 20, 30]], expected: 30, description: 'último = 30' },
      { input: [['a', 'b']], expected: 'b', description: 'último = "b"' },
    ],
  },
  {
    kind: 'lesson',
    title: 'Lição 2 — Buscar e fatiar',
    concept:
      '`.includes(valor)` diz se um valor está na lista. `.indexOf(valor)` dá a posição. `.slice(inicio, fim)` devolve uma **nova** lista com um pedaço. `.join(sep)` transforma a lista em texto, separando pelos caracteres dados.',
    exampleCode: '[1, 2, 3].includes(2)   // true\n[1, 2, 3].slice(1)      // [2, 3]\n[1, 2, 3].join("-")     // "1-2-3"',
    vocabulary: ['.includes()', '.indexOf()', '.slice()', '.join()'],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: '4.3 Contém valor',
    concept: '`.includes(valor)` já devolve o boolean.',
    exampleCode: 'function temZero(lista) {\n  return lista.includes(0)\n}',
    vocabulary: ['.includes()'],
    difficulty: 'easy',
    baseXp: 10,
    description: 'Escreva `contemValor(lista, valor)` que retorna true se o valor está na lista.',
    starterCode: 'function contemValor(lista, valor) {\n  // escreva seu código aqui\n}\n',
    targetFn: 'contemValor',
    testCases: [
      { input: [[1, 2, 3], 2], expected: true, description: 'tem o 2' },
      { input: [[1, 2, 3], 9], expected: false, description: 'não tem 9' },
    ],
  },
  {
    kind: 'challenge',
    title: '4.4 Sem o primeiro',
    concept: '`.slice(1)` devolve uma NOVA lista a partir do índice 1, sem mexer na original.',
    exampleCode: 'function doisPrimeiros(lista) {\n  return lista.slice(0, 2)\n}',
    vocabulary: ['.slice()'],
    difficulty: 'medium',
    baseXp: 15,
    description: 'Escreva `semPrimeiro(lista)` que retorna a lista sem o primeiro item.',
    starterCode: 'function semPrimeiro(lista) {\n  // escreva seu código aqui\n}\n',
    targetFn: 'semPrimeiro',
    testCases: [
      { input: [[1, 2, 3]], expected: [2, 3], description: '[1,2,3] -> [2,3]' },
      { input: [['a']], expected: [], description: '["a"] -> []' },
    ],
  },
  {
    kind: 'challenge',
    title: '4.5 Juntar com vírgula',
    concept: '`.join(", ")` transforma a lista em texto separando por vírgula e espaço.',
    exampleCode: 'function comTraco(lista) {\n  return lista.join("-")\n}',
    vocabulary: ['.join()'],
    difficulty: 'easy',
    baseXp: 10,
    description: 'Escreva `juntar(lista)` que retorna os itens separados por ", " (vírgula e espaço).',
    starterCode: 'function juntar(lista) {\n  // escreva seu código aqui\n}\n',
    targetFn: 'juntar',
    testCases: [
      { input: [['a', 'b', 'c']], expected: 'a, b, c', description: 'junta com vírgula' },
      { input: [[1, 2]], expected: '1, 2', description: 'números viram texto' },
    ],
  },
  {
    kind: 'lesson',
    title: 'Lição 3 — Alterar vs. copiar',
    concept:
      'Regra de ouro: alguns métodos **alteram** a lista original (`.push`, `.reverse`) e outros **devolvem uma nova** (`.slice`, spread `[...lista]`). Para transformar sem estragar a original, **copie antes** com `[...lista]`.',
    exampleCode: 'const a = [1, 2, 3]\nconst b = [...a, 4]     // [1,2,3,4] (a não muda)\nconst c = [...a].reverse()  // copia e inverte',
    vocabulary: ['spread', '...', '.push()', '.reverse()', 'mutação'],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: '4.6 Adicionar sem mutar',
    concept: 'O spread `[...lista, valor]` cria uma NOVA lista com o item no fim.',
    exampleCode: 'function noComeco(lista, valor) {\n  return [valor, ...lista]\n}',
    vocabulary: ['spread', '...'],
    difficulty: 'medium',
    baseXp: 15,
    description: 'Escreva `adicionar(lista, valor)` que retorna uma NOVA lista com o valor no fim.',
    starterCode: 'function adicionar(lista, valor) {\n  // escreva seu código aqui\n}\n',
    targetFn: 'adicionar',
    testCases: [
      { input: [[1, 2], 9], expected: [1, 2, 9], description: 'adiciona 9' },
      { input: [[], 1], expected: [1], description: 'em lista vazia' },
    ],
  },
  {
    kind: 'challenge',
    title: '4.7 Inverter copiando',
    concept: 'CUIDADO: `.reverse()` ALTERA a original. Copie antes com `[...lista]`.',
    exampleCode: 'function copiaInvertida(lista) {\n  return [...lista].reverse()\n}',
    vocabulary: ['.reverse()', 'spread'],
    difficulty: 'medium',
    baseXp: 15,
    description: 'Escreva `inverter(lista)` que retorna uma NOVA lista invertida.',
    starterCode: 'function inverter(lista) {\n  // escreva seu código aqui\n}\n',
    targetFn: 'inverter',
    testCases: [
      { input: [[1, 2, 3]], expected: [3, 2, 1], description: '[1,2,3] -> [3,2,1]' },
      { input: [['a', 'b']], expected: ['b', 'a'], description: '["a","b"] -> ["b","a"]' },
    ],
  },
  {
    kind: 'lesson',
    title: 'Lição 4 — Percorrer e construir com laço',
    concept:
      'O `for...of` percorre cada item de uma lista. Com um acumulador você soma/conta; com `.push()` você vai **construindo** uma lista nova dentro do laço.',
    exampleCode: 'let total = 0\nfor (const x of [1, 2, 3]) total += x   // 6',
    vocabulary: ['for...of', '.push()'],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: '4.8 Somar a lista',
    concept: 'Percorra com `for...of` e some num acumulador.',
    exampleCode: 'function contar(lista) {\n  let n = 0\n  for (const x of lista) n++\n  return n\n}',
    vocabulary: ['for...of', 'acumulador'],
    difficulty: 'easy',
    baseXp: 10,
    description: 'Escreva `somar(lista)` que retorna a soma de todos os números.',
    starterCode: 'function somar(lista) {\n  // escreva seu código aqui\n}\n',
    targetFn: 'somar',
    testCases: [
      { input: [[1, 2, 3]], expected: 6, description: '1+2+3 = 6' },
      { input: [[10, 20]], expected: 30, description: '10+20 = 30' },
      { input: [[]], expected: 0, description: 'lista vazia = 0' },
    ],
  },
  {
    kind: 'challenge',
    title: '4.9 Maior da lista',
    concept: 'Guarde o maior visto até agora, começando pelo primeiro item.',
    exampleCode: 'function somar(lista) {\n  let total = 0\n  for (const x of lista) total += x\n  return total\n}',
    vocabulary: ['for...of'],
    difficulty: 'medium',
    baseXp: 15,
    description: 'Escreva `maiorDaLista(lista)` que retorna o maior número da lista.',
    starterCode: 'function maiorDaLista(lista) {\n  // escreva seu código aqui\n}\n',
    targetFn: 'maiorDaLista',
    testCases: [
      { input: [[3, 7, 2]], expected: 7, description: 'maior de [3,7,2] = 7' },
      { input: [[-5, -1, -9]], expected: -1, description: 'maior de negativos' },
      { input: [[10]], expected: 10, description: 'lista de 1' },
    ],
  },
  {
    kind: 'lesson',
    title: 'Lição 5 — Textos (strings)',
    concept:
      'Strings também têm métodos: `.toUpperCase()`/`.toLowerCase()` mudam a caixa, `.charAt(i)` (ou `[i]`) pega um caractere, `.slice()` fatia, `.split(sep)` quebra em lista, `.join()` junta, `.replace(a, b)` troca, `.includes()` verifica.',
    exampleCode: '"oi".toUpperCase()      // "OI"\n"a,b".split(",")        // ["a", "b"]\n"casa".charAt(0)         // "c"',
    vocabulary: ['.toUpperCase()', '.charAt()', '.split()', '.replace()'],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: '4.10 Gritar',
    concept: '`.toUpperCase()` deixa tudo maiúsculo.',
    exampleCode: 'function sussurrar(texto) {\n  return texto.toLowerCase()\n}',
    vocabulary: ['.toUpperCase()'],
    difficulty: 'easy',
    baseXp: 10,
    description: 'Escreva `gritar(texto)` que retorna o texto todo em MAIÚSCULAS.',
    starterCode: 'function gritar(texto) {\n  // escreva seu código aqui\n}\n',
    targetFn: 'gritar',
    testCases: [
      { input: ['oi'], expected: 'OI', description: 'oi -> OI' },
      { input: ['Codi'], expected: 'CODI', description: 'Codi -> CODI' },
    ],
  },
  {
    kind: 'challenge',
    title: '4.11 Inverter texto',
    concept: 'Quebre em lista com `.split("")`, inverta e junte com `.join("")`.',
    exampleCode: 'function repetir(texto) {\n  return texto + texto\n}',
    vocabulary: ['.split()', '.reverse()', '.join()'],
    difficulty: 'medium',
    baseXp: 15,
    description: 'Escreva `inverterTexto(texto)` que retorna o texto de trás para frente.',
    starterCode: 'function inverterTexto(texto) {\n  // dica: split("") -> reverse() -> join("")\n}\n',
    targetFn: 'inverterTexto',
    testCases: [
      { input: ['abc'], expected: 'cba', description: 'abc -> cba' },
      { input: ['Codi'], expected: 'idoC', description: 'Codi -> idoC' },
    ],
  },
  {
    kind: 'challenge',
    title: '4.12 [Fecha a trilha] Sigla',
    concept: 'Quebre a frase em palavras com `.split(" ")`, percorra com `for...of` pegando a primeira letra de cada, e deixe em maiúsculas.',
    exampleCode: 'function iniciais(frase) {\n  let s = ""\n  for (const p of frase.split(" ")) s += p.charAt(0)\n  return s\n}',
    vocabulary: ['.split()', 'for...of', '.charAt()', '.toUpperCase()'],
    difficulty: 'medium',
    baseXp: 20,
    description: 'Escreva `sigla(frase)` que retorna as iniciais de cada palavra, em maiúsculas. Ex.: sigla("Organização Mundial Saúde") = "OMS".',
    starterCode: 'function sigla(frase) {\n  // escreva seu código aqui\n}\n',
    targetFn: 'sigla',
    testCases: [
      { input: ['Organização Mundial Saúde'], expected: 'OMS', description: 'OMS' },
      { input: ['banco nacional'], expected: 'BN', description: 'BN' },
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
