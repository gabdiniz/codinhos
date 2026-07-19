/**
 * Seed da trilha "JavaScript: Coleções — Map e Set" no CATÁLOGO GLOBAL.
 * Trilha 11/14 — ver docs/pesquisa-trilhas-js.md e docs/trilha-js-11-colecoes-map-set.md.
 * Execução: pnpm --filter @codinhos/api db:seed:js-11
 * Idempotente. Modo: function-call + ast (requireCall Map/Set). Map/Set nunca são
 * retorno — sempre convertidos (Object.fromEntries, [...set], .size). Verificado.
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

const TRAIL_SLUG = 'js-colecoes-map-set'
const TRAIL_TITLE = 'JavaScript: Coleções — Map e Set'
const TRAIL_DESC =
  'As estruturas que o objeto e o array não resolvem bem: Set (sem repetição) e Map (dicionário de verdade). Pré-requisito: Sintaxe Moderna.'
const TRAIL_ORDER = 110

type AstRule = { kind: 'requireCall'; name: string }

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

const USECALL = (name: string) => ({
  input: null as null,
  expected: true as const,
  description: `usa ${name}() como pedido`,
  mode: 'ast' as const,
  astRule: { kind: 'requireCall' as const, name },
})

const trilhaModules: Modulo[] = [
  {
    kind: 'lesson',
    title: 'Lição 1 — Onde objeto e array não bastam',
    concept:
      'O objeto-dicionário só aceita chave de texto e não tem `.size`; verificar "tem esse valor?" num array é verboso. Duas estruturas resolvem isso melhor: `Set` (coleção sem repetição) e `Map` (dicionário de verdade).',
    exampleCode: '// array: achar duplicados/pertencimento é trabalhoso\n// objeto: chave sempre vira texto, sem .size',
    vocabulary: ['Set', 'Map'],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'lesson',
    title: 'Lição 2 — Set: coleção sem repetição',
    concept:
      '`new Set()` guarda valores únicos. `.add(x)` adiciona, `.has(x)` verifica, `.size` conta. `new Set(lista)` já remove os duplicados. Para voltar a ser array: `[...meuSet]`.',
    exampleCode: 'const s = new Set([1, 1, 2])\ns.size          // 2\n[...s]          // [1, 2]',
    vocabulary: ['Set', '.add', '.has', '.size'],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: '11.1 Remover duplicados',
    concept: '`new Set(lista)` deduplica; `[...set]` converte de volta para array.',
    exampleCode: 'const s = new Set([1, 1, 2])   // {1, 2}',
    vocabulary: ['Set', 'spread'],
    difficulty: 'medium',
    baseXp: 15,
    description: 'Escreva `unicos(lista)` que retorna uma lista sem valores repetidos (use Set).',
    starterCode: 'function unicos(lista) {\n  // use new Set e spread\n}\n',
    targetFn: 'unicos',
    testCases: [
      { input: [[1, 1, 2, 3, 3]], expected: [1, 2, 3], description: 'remove repetidos' },
      { input: [['a', 'a']], expected: ['a'], description: 'só um a' },
      USECALL('Set'),
    ],
  },
  {
    kind: 'challenge',
    title: '11.2 Quantos valores distintos',
    concept: '`.size` de um Set conta os valores únicos.',
    exampleCode: 'new Set([1, 1, 2]).size   // 2',
    vocabulary: ['Set', '.size'],
    difficulty: 'easy',
    baseXp: 10,
    description: 'Escreva `distintos(lista)` que retorna quantos valores diferentes existem.',
    starterCode: 'function distintos(lista) {\n  // new Set(...).size\n}\n',
    targetFn: 'distintos',
    testCases: [
      { input: [[1, 1, 2, 3]], expected: 3, description: '3 distintos' },
      { input: [['a', 'a', 'a']], expected: 1, description: '1 distinto' },
    ],
  },
  {
    kind: 'challenge',
    title: '11.3 Tem algum repetido?',
    concept: 'Se o Set tiver menos itens que a lista, houve repetição.',
    exampleCode: 'lista.length !== new Set(lista).size',
    vocabulary: ['Set', '.size', '.length'],
    difficulty: 'medium',
    baseXp: 15,
    description: 'Escreva `temRepetido(lista)` que retorna true se houver algum valor repetido.',
    starterCode: 'function temRepetido(lista) {\n  // compare length com size\n}\n',
    targetFn: 'temRepetido',
    testCases: [
      { input: [[1, 2, 2]], expected: true, description: 'tem repetido' },
      { input: [[1, 2, 3]], expected: false, description: 'todos únicos' },
    ],
  },
  {
    kind: 'lesson',
    title: 'Lição 3 — Set para pertencimento rápido',
    concept: '`set.has(x)` responde na hora "esse valor está na coleção?" — mais direto que procurar num array.',
    exampleCode: 'const permitidos = new Set(["a", "b"])\npermitidos.has("a")   // true',
    vocabulary: ['Set', '.has'],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: '11.4 Manter só os permitidos',
    concept: 'Monte um Set com os permitidos e filtre com `.has`.',
    exampleCode: 'const ok = new Set(permitidos)\nlista.filter((x) => ok.has(x))',
    vocabulary: ['Set', '.has', '.filter()'],
    difficulty: 'medium',
    baseXp: 15,
    description: 'Escreva `filtrarPermitidos(lista, permitidos)` que retorna só os itens que estão em permitidos.',
    starterCode: 'function filtrarPermitidos(lista, permitidos) {\n  // Set + filter + has\n}\n',
    targetFn: 'filtrarPermitidos',
    testCases: [
      { input: [[1, 2, 3, 4], [2, 4]], expected: [2, 4], description: 'mantém 2 e 4' },
      { input: [['a', 'x'], ['a']], expected: ['a'], description: 'só a permitido' },
    ],
  },
  {
    kind: 'lesson',
    title: 'Lição 4 — Map: o dicionário de verdade',
    concept:
      '`new Map()` guarda pares chave→valor. `.set(k, v)` grava, `.get(k)` lê, `.has(k)` verifica, `.size` conta. Tem ordem de inserção e aceita chave de qualquer tipo. Para devolver como objeto: `Object.fromEntries(map)`.',
    exampleCode: 'const m = new Map()\nm.set("a", 1)\nm.get("a")                 // 1\nObject.fromEntries(m)      // {a: 1}',
    vocabulary: ['Map', '.set', '.get', 'Object.fromEntries'],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: '11.5 Contador de frequência (com Map)',
    concept: 'Percorra a lista com `m.set(x, (m.get(x) ?? 0) + 1)` e devolva `Object.fromEntries(m)`.',
    exampleCode: 'm.set(x, (m.get(x) ?? 0) + 1)',
    vocabulary: ['Map', '.set', '.get', 'Object.fromEntries'],
    difficulty: 'medium',
    baseXp: 20,
    description: 'Escreva `frequencia(lista)` que retorna um objeto com quantas vezes cada item aparece (use Map).',
    starterCode: 'function frequencia(lista) {\n  // Map + Object.fromEntries\n}\n',
    targetFn: 'frequencia',
    testCases: [
      { input: [['a', 'b', 'a']], expected: { a: 2, b: 1 }, description: 'a:2, b:1' },
      { input: [['x', 'x', 'x']], expected: { x: 3 }, description: 'x:3' },
      USECALL('Map'),
    ],
  },
  {
    kind: 'challenge',
    title: '11.6 Somar estoque por produto',
    concept: 'Acumule as quantidades por produto num Map e devolva como objeto.',
    exampleCode: 'm.set(it.produto, (m.get(it.produto) ?? 0) + it.qtd)',
    vocabulary: ['Map', 'Object.fromEntries'],
    difficulty: 'medium',
    baseXp: 20,
    description: 'Recebe uma lista de `{ produto, qtd }`. Escreva `somarEstoque(itens)` que retorna um objeto produto->quantidade total.',
    starterCode: 'function somarEstoque(itens) {\n  // Map acumulando por produto\n}\n',
    targetFn: 'somarEstoque',
    testCases: [
      {
        input: [[{ produto: 'x', qtd: 2 }, { produto: 'x', qtd: 3 }, { produto: 'y', qtd: 1 }]],
        expected: { x: 5, y: 1 },
        description: 'x:5, y:1',
      },
    ],
  },
  {
    kind: 'lesson',
    title: 'Lição 5 — Percorrer um Map',
    concept:
      '`for (const [chave, valor] of map)` percorre os pares (desestruturando cada um). `new Map(Object.entries(obj))` transforma um objeto num Map.',
    exampleCode: 'const m = new Map(Object.entries({a: 1, b: 2}))\nfor (const [k, v] of m) { /* k, v */ }',
    vocabulary: ['Map', 'for...of', 'Object.entries'],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: '11.7 Chave de maior valor',
    concept: 'Transforme o objeto em Map, percorra com `[k, v]` e guarde a chave do maior valor.',
    exampleCode: 'for (const [k, v] of m) { if (v > max) { max = v; melhor = k } }',
    vocabulary: ['Map', 'for...of', 'Object.entries'],
    difficulty: 'medium',
    baseXp: 20,
    description: 'Escreva `chaveMaiorValor(obj)` que retorna a chave com o maior valor (se empatar, a primeira).',
    starterCode: 'function chaveMaiorValor(obj) {\n  // Map + for...of [k, v]\n}\n',
    targetFn: 'chaveMaiorValor',
    testCases: [
      { input: [{ a: 1, b: 3, c: 2 }], expected: 'b', description: 'b tem 3' },
      { input: [{ x: 5 }], expected: 'x', description: 'só x' },
    ],
  },
  {
    kind: 'challenge',
    title: '11.8 Inverter dicionário',
    concept: 'Percorra os pares e monte um Map novo onde o valor vira chave.',
    exampleCode: 'for (const [k, v] of Object.entries(obj)) m.set(v, k)',
    vocabulary: ['Map', 'Object.entries', 'Object.fromEntries'],
    difficulty: 'medium',
    baseXp: 20,
    description: 'Escreva `inverterDic(obj)` que troca chaves por valores. Ex.: { a: 1, b: 2 } -> { "1": "a", "2": "b" }.',
    starterCode: 'function inverterDic(obj) {\n  // Map (valor -> chave) + Object.fromEntries\n}\n',
    targetFn: 'inverterDic',
    testCases: [
      { input: [{ a: 1, b: 2 }], expected: { '1': 'a', '2': 'b' }, description: 'invertido' },
      { input: [{ x: 'y' }], expected: { y: 'x' }, description: 'x:y -> y:x' },
    ],
  },
  {
    kind: 'lesson',
    title: 'Lição 6 — Objeto, Map ou Set?',
    concept:
      'Use `Set` para unicidade/pertencimento; `Map` para contagem, ordem ou chave que não é texto; e o objeto simples para um registro de campos fixos e conhecidos.',
    exampleCode: '// Set: valores únicos | Map: contar/ordenar | objeto: {nome, idade}',
    vocabulary: ['Set', 'Map', 'objeto'],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: '11.9 [Fecha a trilha] Apuração de votos',
    concept: 'Junte tudo: um Set filtra os votos válidos, um Map conta, e `[k, v]` acha o vencedor.',
    exampleCode: 'const validos = new Set(candidatos)',
    vocabulary: ['Set', 'Map', 'Object.fromEntries'],
    difficulty: 'hard',
    baseXp: 30,
    description:
      'Escreva `apurar(votos, candidatos)`: conte só os votos cujo nome está em `candidatos` (use Set) e retorne `{ vencedor, apuracao }`, onde apuracao é o objeto nome->contagem.',
    starterCode: 'function apurar(votos, candidatos) {\n  // Set de válidos + Map de contagem + achar o vencedor\n}\n',
    targetFn: 'apurar',
    testCases: [
      {
        input: [['a', 'b', 'a', 'x', 'a', 'b'], ['a', 'b']],
        expected: { vencedor: 'a', apuracao: { a: 3, b: 2 } },
        description: 'a vence, x é inválido',
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
