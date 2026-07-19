/**
 * Seed da trilha "JavaScript: Async/await e Promises" no CATÁLOGO GLOBAL.
 * Trilha 13/14 — ver docs/pesquisa-trilhas-js.md e docs/trilha-js-13-async-await.md.
 * Execução: pnpm --filter @codinhos/api db:seed:js-13
 * Idempotente. Modo: function-call (async) — o runner aguarda a Promise; expected é o
 * valor resolvido. Sem I/O real (fetch bloqueado): espera simulada com resolve/setTimeout.
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

const TRAIL_SLUG = 'js-async-await'
const TRAIL_TITLE = 'JavaScript: Async/await e Promises'
const TRAIL_DESC =
  'O mecanismo do JS assíncrono: Promise, .then, async/await e Promise.all (espera simulada, sem rede). Pré-requisito: Tratamento de Erros.'
const TRAIL_ORDER = 130

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
    title: 'Lição 1 — Por que existe código assíncrono',
    concept:
      'Algumas tarefas demoram (esperar um tempo, buscar dados). O JS não fica travado esperando — trabalha com "valores que chegam depois". Aqui a espera é **simulada** (não buscamos dados de rede de verdade).',
    exampleCode: '// "vai chegar depois" em vez de "já está pronto"',
    vocabulary: ['assíncrono'],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'lesson',
    title: 'Lição 2 — Promise e Promise.resolve',
    concept:
      'Uma `Promise` representa um valor que **vai chegar**. `Promise.resolve(x)` cria uma promessa já cumprida com o valor `x`. Nos desafios, o Codinhos **aguarda** a Promise e compara o valor resolvido.',
    exampleCode: 'Promise.resolve(42)   // uma promessa que já vale 42',
    vocabulary: ['Promise', 'Promise.resolve'],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: '13.1 Promessa pronta',
    concept: 'Devolva uma promessa já cumprida com o valor recebido.',
    exampleCode: 'function pronta(v) {\n  return Promise.resolve(v)\n}',
    vocabulary: ['Promise.resolve'],
    difficulty: 'easy',
    baseXp: 10,
    description: 'Escreva `jaResolvida(x)` que retorna uma Promise que resolve para x.',
    starterCode: 'function jaResolvida(x) {\n  // return Promise.resolve(...)\n}\n',
    targetFn: 'jaResolvida',
    testCases: [
      { input: [42], expected: 42, description: 'resolve para 42' },
      { input: ['oi'], expected: 'oi', description: 'resolve para "oi"' },
    ],
  },
  {
    kind: 'lesson',
    title: 'Lição 3 — .then e .catch',
    concept: '`p.then(valor => ...)` reage quando a promessa cumpre; `.catch(e => ...)` quando ela falha. O `.then` devolve uma nova promessa.',
    exampleCode: 'Promise.resolve(5).then((n) => n + 1)   // promessa que vale 6',
    vocabulary: ['.then', '.catch'],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: '13.2 Dobrar quando chegar',
    concept: 'Use `.then` para transformar o valor quando a promessa cumpre.',
    exampleCode: 'return Promise.resolve(x).then((n) => n + 1)',
    vocabulary: ['.then'],
    difficulty: 'medium',
    baseXp: 15,
    description: 'Escreva `dobroFuturo(x)` que retorna uma Promise que resolve para o dobro de x, usando `.then`.',
    starterCode: 'function dobroFuturo(x) {\n  // Promise.resolve(x).then(...)\n}\n',
    targetFn: 'dobroFuturo',
    testCases: [
      { input: [5], expected: 10, description: 'resolve para 10' },
      { input: [0], expected: 0, description: 'resolve para 0' },
    ],
  },
  {
    kind: 'lesson',
    title: 'Lição 4 — async / await',
    concept:
      'Uma `async function` pode usar `await`: `const n = await p` pausa até a promessa cumprir e entrega o valor — deixa o código assíncrono parecer sequencial. A função `async` sempre devolve uma Promise.',
    exampleCode: 'async function pega() {\n  const n = await Promise.resolve(7)\n  return n * 2\n}',
    vocabulary: ['async', 'await'],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: '13.3 Reescreva com await',
    concept: 'Mesmo resultado do .then, agora com async/await.',
    exampleCode: 'async function f(x) {\n  const n = await Promise.resolve(x)\n  return n + 1\n}',
    vocabulary: ['async', 'await'],
    difficulty: 'medium',
    baseXp: 15,
    description: 'Escreva `dobro(x)` (async) que espera `Promise.resolve(x)` e retorna o dobro.',
    starterCode: 'async function dobro(x) {\n  // use await\n}\n',
    targetFn: 'dobro',
    testCases: [
      { input: [5], expected: 10, description: 'resolve para 10' },
      { input: [-3], expected: -6, description: 'resolve para -6' },
    ],
  },
  {
    kind: 'challenge',
    title: '13.4 Somar dois futuros',
    concept: 'Use dois `await` em sequência e some os valores.',
    exampleCode: 'const x = await Promise.resolve(a)\nconst y = await Promise.resolve(b)',
    vocabulary: ['async', 'await'],
    difficulty: 'medium',
    baseXp: 15,
    description: 'Escreva `somar(a, b)` (async) que espera duas promessas (a e b) e retorna a soma.',
    starterCode: 'async function somar(a, b) {\n  // dois await\n}\n',
    targetFn: 'somar',
    testCases: [
      { input: [2, 3], expected: 5, description: 'resolve para 5' },
      { input: [10, -4], expected: 6, description: 'resolve para 6' },
    ],
  },
  {
    kind: 'lesson',
    title: 'Lição 5 — Promise.all: esperar várias',
    concept: '`await Promise.all([p1, p2, ...])` espera TODAS as promessas juntas e devolve um array com os resultados, na mesma ordem.',
    exampleCode: 'const [a, b] = await Promise.all([Promise.resolve(1), Promise.resolve(2)])',
    vocabulary: ['Promise.all'],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: '13.5 Esperar todas',
    concept: 'Transforme a lista em promessas com `.map` e espere todas com `Promise.all`.',
    exampleCode: 'await Promise.all(lista.map((x) => Promise.resolve(x)))',
    vocabulary: ['Promise.all', '.map()'],
    difficulty: 'medium',
    baseXp: 20,
    description: 'Escreva `todas(lista)` (async) que retorna uma lista com o quadrado de cada número, esperando todas as promessas.',
    starterCode: 'async function todas(lista) {\n  // Promise.all + map\n}\n',
    targetFn: 'todas',
    testCases: [
      { input: [[1, 2, 3]], expected: [1, 4, 9], description: 'quadrados' },
      { input: [[5]], expected: [25], description: 'um só' },
    ],
  },
  {
    kind: 'lesson',
    title: 'Lição 6 — Esperar um tempo e tratar falhas',
    concept:
      '`new Promise(r => setTimeout(() => r(valor), ms))` simula uma tarefa demorada. Um `try/catch` em volta de um `await` captura falhas assíncronas (uma promessa rejeitada).',
    exampleCode: 'try {\n  const dado = await buscar()\n} catch (e) {\n  // falhou\n}',
    vocabulary: ['setTimeout', 'try', 'catch', 'await'],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: '13.6 await protegido',
    concept: 'Envolva o `await` num try/catch e devolva um valor de fallback se falhar.',
    exampleCode: 'try {\n  return await algo()\n} catch (e) {\n  return "falhou"\n}',
    vocabulary: ['async', 'await', 'try', 'catch'],
    difficulty: 'medium',
    baseXp: 20,
    description:
      'Escreva `buscar(ok)` (async): se `ok` for true, retorna "dado" (de uma Promise); se for false, lança um erro e retorna "falhou" no catch.',
    starterCode: 'async function buscar(ok) {\n  try {\n    // if (!ok) throw ...\n  } catch (e) {\n    return "falhou"\n  }\n}\n',
    targetFn: 'buscar',
    testCases: [
      { input: [true], expected: 'dado', description: 'ok -> dado' },
      { input: [false], expected: 'falhou', description: 'falha tratada' },
    ],
  },
  {
    kind: 'challenge',
    title: '13.7 [Fecha a trilha] Corrida de tarefas',
    concept: 'Crie uma promessa com setTimeout para cada item e espere todas com Promise.all.',
    exampleCode: 'new Promise((r) => setTimeout(() => r(v * 2), 5))',
    vocabulary: ['setTimeout', 'Promise.all', '.map()', 'await'],
    difficulty: 'hard',
    baseXp: 25,
    description:
      'Escreva `corrida(valores)` (async) que, para cada valor, cria uma Promise (com setTimeout) que resolve para o dobro; retorna a lista de todos os dobros (Promise.all).',
    starterCode: 'async function corrida(valores) {\n  // map -> Promise com setTimeout -> Promise.all\n}\n',
    targetFn: 'corrida',
    testCases: [
      { input: [[1, 2, 3]], expected: [2, 4, 6], description: 'dobros' },
      { input: [[10]], expected: [20], description: 'um só' },
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
