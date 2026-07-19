/**
 * Seed da trilha "JavaScript: Sintaxe Moderna (ES6+)" no CATÁLOGO GLOBAL.
 * Trilha 10/14 — ver docs/pesquisa-trilhas-js.md e docs/trilha-js-10-sintaxe-moderna.md.
 * Execução: pnpm --filter @codinhos/api db:seed:js-10
 * Idempotente. Modo: function-call. Sintaxe ES6+ (desestruturação, spread/rest, ?., ??, shorthand).
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

const TRAIL_SLUG = 'js-sintaxe-moderna'
const TRAIL_TITLE = 'JavaScript: Sintaxe Moderna (ES6+)'
const TRAIL_DESC =
  'Escrever JS moderno: desestruturação, spread/rest, optional chaining (?.), nullish (??), atalho de objeto e template multilinha. Pré-requisito: Números e Objetos.'
const TRAIL_ORDER = 100

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
    title: 'Lição 1 — Ponte: você já usa ... e ${}',
    concept:
      'Você já viu o spread `[...lista]` e o template literal `` `${}` ``. Esta trilha adiciona o resto da notação moderna do JS, que deixa o código mais curto e claro — a base para Map/Set e POO mais à frente.',
    exampleCode: 'const a = [1, 2]\nconst b = [...a, 3]     // [1, 2, 3]\nconst msg = `total: ${b.length}`',
    vocabulary: ['spread', 'template literal'],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'lesson',
    title: 'Lição 2 — Desestruturar arrays',
    concept: 'A desestruturação lê itens de uma lista por posição, de uma vez: `const [a, b] = lista`.',
    exampleCode: 'const [primeiro, segundo] = [10, 20]\n// primeiro = 10, segundo = 20',
    vocabulary: ['desestruturação'],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: '10.1 Troca de posição',
    concept: 'Desestruture os dois itens no parâmetro e devolva na ordem trocada.',
    exampleCode: 'function primeiro([a]) {\n  return a\n}',
    vocabulary: ['desestruturação'],
    difficulty: 'easy',
    baseXp: 10,
    description: 'Escreva `troca([a, b])` que recebe uma lista de 2 itens e retorna `[b, a]`.',
    starterCode: 'function troca([a, b]) {\n  // retorne na ordem trocada\n}\n',
    targetFn: 'troca',
    testCases: [
      { input: [[1, 2]], expected: [2, 1], description: '[1,2] -> [2,1]' },
      { input: [['a', 'b']], expected: ['b', 'a'], description: '["a","b"] -> ["b","a"]' },
    ],
  },
  {
    kind: 'challenge',
    title: '10.2 Cabeça e cauda',
    concept: '`const [primeiro, ...resto] = lista` separa o primeiro item do resto (que vira uma lista).',
    exampleCode: 'const [x, ...resto] = [1, 2, 3]\n// x = 1, resto = [2, 3]',
    vocabulary: ['desestruturação', 'rest'],
    difficulty: 'medium',
    baseXp: 15,
    description: 'Escreva `separar(lista)` que retorna `[primeiro, resto]`, onde resto é a lista sem o primeiro.',
    starterCode: 'function separar(lista) {\n  const [primeiro, ...resto] = lista\n  // retorne [primeiro, resto]\n}\n',
    targetFn: 'separar',
    testCases: [
      { input: [[10, 20, 30]], expected: [10, [20, 30]], description: 'cabeça 10, cauda [20,30]' },
      { input: [[5]], expected: [5, []], description: 'cauda vazia' },
    ],
  },
  {
    kind: 'lesson',
    title: 'Lição 3 — Desestruturar objetos e o atalho para montar',
    concept:
      'De objetos, puxe campos pelo nome: `const {nome, idade} = pessoa`. E o **atalho** (shorthand): quando a variável tem o mesmo nome do campo, `{nome, idade}` monta o objeto (em vez de `{nome: nome, idade: idade}`).',
    exampleCode: 'const {nome} = {nome: "Ana", idade: 12}   // nome = "Ana"\nconst idade = 12\nconst p = {idade}                          // {idade: 12}',
    vocabulary: ['desestruturação', 'shorthand'],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: '10.3 Ficha resumida',
    concept: 'Desestruture os campos direto no parâmetro e monte a frase com template literal.',
    exampleCode: 'function nome({nome}) {\n  return nome\n}',
    vocabulary: ['desestruturação', 'template literal'],
    difficulty: 'medium',
    baseXp: 15,
    description: 'Escreva `ficha(pessoa)` que recebe `{ nome, idade }` e retorna "NOME, IDADE" (ex.: "Ana, 12").',
    starterCode: 'function ficha({ nome, idade }) {\n  // use template literal\n}\n',
    targetFn: 'ficha',
    testCases: [
      { input: [{ nome: 'Ana', idade: 12 }], expected: 'Ana, 12', description: 'Ana, 12' },
      { input: [{ nome: 'Rex', idade: 9 }], expected: 'Rex, 9', description: 'Rex, 9' },
    ],
  },
  {
    kind: 'challenge',
    title: '10.4 Campo com padrão',
    concept: 'Na desestruturação, `{cor = "azul"}` usa o padrão quando o campo não existe.',
    exampleCode: 'function tam({tamanho = "M"}) {\n  return tamanho\n}',
    vocabulary: ['desestruturação', 'valor padrão'],
    difficulty: 'medium',
    baseXp: 15,
    description: 'Escreva `corDoItem(item)` que retorna `item.cor`, ou "azul" se não houver cor.',
    starterCode: 'function corDoItem({ cor = "azul" }) {\n  // retorne cor\n}\n',
    targetFn: 'corDoItem',
    testCases: [
      { input: [{ cor: 'verde' }], expected: 'verde', description: 'tem cor' },
      { input: [{}], expected: 'azul', description: 'sem cor -> padrão' },
    ],
  },
  {
    kind: 'lesson',
    title: 'Lição 4 — Rest em parâmetros: ...args',
    concept: 'Um parâmetro `...nums` junta TODOS os argumentos passados num array — a função aceita quantos vierem.',
    exampleCode: 'function quantos(...itens) {\n  return itens.length\n}\n// quantos(1, 2, 3) -> 3',
    vocabulary: ['rest', '...args'],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: '10.5 Somar quantos vierem',
    concept: '`...nums` vira um array; some com `.reduce`.',
    exampleCode: 'function juntar(...partes) {\n  return partes.join("")\n}',
    vocabulary: ['rest', '.reduce()'],
    difficulty: 'medium',
    baseXp: 15,
    description: 'Escreva `somaTudo(...nums)` que soma todos os argumentos. somaTudo(1,2,3) = 6.',
    starterCode: 'function somaTudo(...nums) {\n  // use .reduce()\n}\n',
    targetFn: 'somaTudo',
    testCases: [
      { input: [1, 2, 3], expected: 6, description: '1+2+3 = 6' },
      { input: [10], expected: 10, description: 'um só = 10' },
      { input: [], expected: 0, description: 'nenhum = 0' },
    ],
  },
  {
    kind: 'challenge',
    title: '10.6 Média de quantos vierem',
    concept: 'Rest + `.length` + `.reduce`. A média de nenhum número é 0.',
    exampleCode: 'function contar(...xs) {\n  return xs.length\n}',
    vocabulary: ['rest', '.reduce()', '.length'],
    difficulty: 'medium',
    baseXp: 15,
    description: 'Escreva `media(...nums)` que retorna a média dos argumentos (0 se não vier nenhum).',
    starterCode: 'function media(...nums) {\n  // cuidado com a lista vazia\n}\n',
    targetFn: 'media',
    testCases: [
      { input: [2, 4, 6], expected: 4, description: 'média de 2,4,6 = 4' },
      { input: [10, 20], expected: 15, description: 'média de 10,20 = 15' },
      { input: [], expected: 0, description: 'nenhum = 0' },
    ],
  },
  {
    kind: 'lesson',
    title: 'Lição 5 — Spread para espalhar e juntar',
    concept:
      'O spread `...` espalha itens: `[...a, ...b]` junta duas listas; `{...a, ...b}` junta dois objetos (o segundo sobrescreve campos repetidos); `f(...args)` passa uma lista como argumentos.',
    exampleCode: '[...[1, 2], ...[3, 4]]        // [1, 2, 3, 4]\n{...{a: 1}, ...{a: 9, b: 2}}   // {a: 9, b: 2}',
    vocabulary: ['spread'],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: '10.7 Juntar duas listas',
    concept: '`[...a, ...b]` cria uma nova lista com os itens das duas.',
    exampleCode: 'const c = [...[1], ...[2, 3]]   // [1, 2, 3]',
    vocabulary: ['spread'],
    difficulty: 'easy',
    baseXp: 10,
    description: 'Escreva `juntar(a, b)` que retorna uma nova lista com os itens de a seguidos dos de b.',
    starterCode: 'function juntar(a, b) {\n  // use spread\n}\n',
    targetFn: 'juntar',
    testCases: [
      { input: [[1, 2], [3, 4]], expected: [1, 2, 3, 4], description: 'junta as duas' },
      { input: [[], [9]], expected: [9], description: 'primeira vazia' },
    ],
  },
  {
    kind: 'challenge',
    title: '10.8 Mesclar dois cadastros',
    concept: '`{...base, ...novo}` cria um objeto com os campos dos dois; o `novo` sobrescreve o que repetir.',
    exampleCode: 'const p = {...{a: 1, b: 2}, ...{b: 9}}   // {a: 1, b: 9}',
    vocabulary: ['spread'],
    difficulty: 'medium',
    baseXp: 15,
    description: 'Escreva `mesclar(base, novo)` que retorna um objeto com os campos dos dois (novo tem prioridade).',
    starterCode: 'function mesclar(base, novo) {\n  // use spread de objeto\n}\n',
    targetFn: 'mesclar',
    testCases: [
      { input: [{ nome: 'Ana', idade: 12 }, { idade: 13 }], expected: { nome: 'Ana', idade: 13 }, description: 'novo sobrescreve idade' },
      { input: [{ a: 1 }, { b: 2 }], expected: { a: 1, b: 2 }, description: 'campos diferentes' },
    ],
  },
  {
    kind: 'lesson',
    title: 'Lição 6 — Quando o dado pode faltar: ?. e ??',
    concept:
      'O optional chaining `?.` acessa um campo aninhado sem quebrar se o caminho não existir (`p?.endereco?.cidade` vira `undefined` em vez de erro). O nullish `??` dá um valor padrão quando o lado esquerdo é `null` ou `undefined`.',
    exampleCode: 'const p = {}\np?.endereco?.cidade ?? "desconhecida"   // "desconhecida"',
    vocabulary: ['?.', '??'],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: '10.9 Cidade com segurança',
    concept: 'Use `?.` para descer com segurança e `??` para o padrão.',
    exampleCode: 'return p?.contato?.email ?? "sem email"',
    vocabulary: ['?.', '??'],
    difficulty: 'medium',
    baseXp: 15,
    description: 'Escreva `cidade(pessoa)` que retorna `pessoa.endereco.cidade`, ou "desconhecida" se faltar o endereço ou a cidade.',
    starterCode: 'function cidade(pessoa) {\n  // use ?. e ??\n}\n',
    targetFn: 'cidade',
    testCases: [
      { input: [{ endereco: { cidade: 'Recife' } }], expected: 'Recife', description: 'tem cidade' },
      { input: [{}], expected: 'desconhecida', description: 'sem endereço' },
      { input: [{ endereco: {} }], expected: 'desconhecida', description: 'endereço sem cidade' },
    ],
  },
  {
    kind: 'challenge',
    title: '10.10 [Fecha a trilha] Cartão de visita',
    concept: 'Junte tudo: desestruture com padrão no parâmetro e monte um texto de duas linhas com template multilinha.',
    exampleCode: 'return `Linha 1\nLinha 2`',
    vocabulary: ['desestruturação', '??', 'template multilinha'],
    difficulty: 'hard',
    baseXp: 25,
    description:
      'Escreva `cartao(pessoa)` que recebe `{ nome, cargo }` e retorna DUAS linhas:\nNome: <nome>\nCargo: <cargo>\nSe não houver cargo, use "—".',
    starterCode: 'function cartao({ nome, cargo = "—" }) {\n  // template de duas linhas com \\n\n}\n',
    targetFn: 'cartao',
    testCases: [
      { input: [{ nome: 'Ana', cargo: 'Dev' }], expected: 'Nome: Ana\nCargo: Dev', description: 'com cargo' },
      { input: [{ nome: 'Rex' }], expected: 'Nome: Rex\nCargo: —', description: 'sem cargo -> —' },
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
