/**
 * Seed da trilha "JavaScript: Tratamento de Erros e Robustez" no CATÁLOGO GLOBAL.
 * Trilha 12/14 — ver docs/pesquisa-trilhas-js.md e docs/trilha-js-12-erros-e-robustez.md.
 * Execução: pnpm --filter @codinhos/api db:seed:js-12
 * Idempotente. Modo: function-call (sempre testa o caminho TRATADO, que retorna valor).
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

const TRAIL_SLUG = 'js-erros-e-robustez'
const TRAIL_TITLE = 'JavaScript: Tratamento de Erros e Robustez'
const TRAIL_DESC =
  'Parar de quebrar no primeiro imprevisto: try/catch/finally, throw, e código defensivo (validação, ?. e ??). Pré-requisito: Sintaxe Moderna.'
const TRAIL_ORDER = 120

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
    title: 'Lição 1 — Operações que quebram o programa',
    concept:
      'Algumas operações **lançam um erro** e param tudo: `JSON.parse("xyz")` com texto inválido, ou acessar um campo de algo que é `undefined`. Precisamos lidar com isso para o programa não morrer.',
    exampleCode: 'JSON.parse("{ isso não é json }")   // lança erro',
    vocabulary: ['erro', 'JSON.parse'],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'lesson',
    title: 'Lição 2 — try / catch: tentar com plano B',
    concept:
      'O `try { ... }` tenta rodar um trecho arriscado; se der erro, o `catch (e) { ... }` assume com um plano B, sem quebrar o programa.',
    exampleCode: 'try {\n  arriscado()\n} catch (e) {\n  // plano B\n}',
    vocabulary: ['try', 'catch'],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: '12.1 Parse seguro',
    concept: 'Tente `JSON.parse`; se falhar, devolva `null`.',
    exampleCode: 'try {\n  return JSON.parse(txt)\n} catch (e) {\n  return null\n}',
    vocabulary: ['try', 'catch', 'JSON.parse'],
    difficulty: 'medium',
    baseXp: 15,
    description: 'Escreva `parseSeguro(txt)` que retorna o objeto do JSON, ou `null` se o texto for inválido.',
    starterCode: 'function parseSeguro(txt) {\n  // try/catch em volta de JSON.parse\n}\n',
    targetFn: 'parseSeguro',
    testCases: [
      { input: ['{"x":5}'], expected: { x: 5 }, description: 'json válido' },
      { input: ['abc'], expected: null, description: 'json inválido -> null' },
    ],
  },
  {
    kind: 'challenge',
    title: '12.2 Divisão protegida',
    concept: 'Trate a divisão por zero devolvendo `null`.',
    exampleCode: 'if (b === 0) return null',
    vocabulary: ['try', 'catch'],
    difficulty: 'medium',
    baseXp: 15,
    description: 'Escreva `dividir(a, b)` que retorna a/b, ou `null` se b for 0.',
    starterCode: 'function dividir(a, b) {\n  // proteja a divisão por zero\n}\n',
    targetFn: 'dividir',
    testCases: [
      { input: [10, 2], expected: 5, description: '10/2 = 5' },
      { input: [10, 0], expected: null, description: '10/0 -> null' },
    ],
  },
  {
    kind: 'lesson',
    title: 'Lição 3 — throw: criar o próprio erro',
    concept:
      '`throw new Error("mensagem")` sinaliza que algo deu errado. Dentro do `catch (e)`, a mensagem fica em `e.message`.',
    exampleCode: 'try {\n  throw new Error("deu ruim")\n} catch (e) {\n  e.message   // "deu ruim"\n}',
    vocabulary: ['throw', 'Error', 'e.message'],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: '12.3 Saque com mensagem',
    concept: 'Lance um erro quando o valor passar do saldo, e devolva a mensagem no catch.',
    exampleCode: 'if (valor > saldo) throw new Error("saldo insuficiente")',
    vocabulary: ['throw', 'e.message'],
    difficulty: 'medium',
    baseXp: 20,
    description:
      'Escreva `sacar(saldo, valor)`: retorna o novo saldo (saldo - valor); mas se valor > saldo, retorna a mensagem "saldo insuficiente".',
    starterCode: 'function sacar(saldo, valor) {\n  try {\n    // throw se valor > saldo\n  } catch (e) {\n    return e.message\n  }\n}\n',
    targetFn: 'sacar',
    testCases: [
      { input: [100, 30], expected: 70, description: 'saque ok' },
      { input: [100, 200], expected: 'saldo insuficiente', description: 'saldo insuficiente' },
    ],
  },
  {
    kind: 'lesson',
    title: 'Lição 4 — finally: roda de qualquer jeito',
    concept: 'O bloco `finally { ... }` executa sempre — com erro ou sem erro. Bom para "encerrar" ou "registrar" algo ao fim.',
    exampleCode: 'try { ... } catch (e) { ... } finally {\n  // sempre roda\n}',
    vocabulary: ['finally'],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: '12.4 Registro do processamento',
    concept: 'Empurre num array: "ok" no try, "erro" no catch e "fim" no finally.',
    exampleCode: 'const log = []\ntry { ... log.push("ok") } catch { log.push("erro") } finally { log.push("fim") }',
    vocabulary: ['try', 'catch', 'finally', '.push()'],
    difficulty: 'medium',
    baseXp: 20,
    description:
      'Escreva `processar(x)` que retorna um log: se x < 0, lança erro (log recebe "erro"), senão "ok"; e sempre "fim" no final. Ex.: processar(5) = ["ok","fim"]; processar(-1) = ["erro","fim"].',
    starterCode: 'function processar(x) {\n  const log = []\n  // try / catch / finally empurrando no log\n  return log\n}\n',
    targetFn: 'processar',
    testCases: [
      { input: [5], expected: ['ok', 'fim'], description: 'sucesso' },
      { input: [-1], expected: ['erro', 'fim'], description: 'erro tratado' },
    ],
  },
  {
    kind: 'lesson',
    title: 'Lição 5 — Prevenir em vez de remediar',
    concept:
      'Muitos erros dá para evitar validando a entrada (`Array.isArray(x)`, checar tipos) e usando acesso seguro (`?.` e `??`) — sem nem precisar de try/catch.',
    exampleCode: 'if (!Array.isArray(lista)) return 0\nconst tema = config?.preferencias?.tema ?? "claro"',
    vocabulary: ['Array.isArray', '?.', '??'],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: '12.5 Configuração com padrão',
    concept: 'Use `?.` para descer com segurança e `??` para o padrão.',
    exampleCode: 'return config?.preferencias?.tema ?? "claro"',
    vocabulary: ['?.', '??'],
    difficulty: 'medium',
    baseXp: 15,
    description: 'Escreva `tema(config)` que retorna `config.preferencias.tema`, ou "claro" se faltar qualquer parte.',
    starterCode: 'function tema(config) {\n  // ?. e ??\n}\n',
    targetFn: 'tema',
    testCases: [
      { input: [{ preferencias: { tema: 'escuro' } }], expected: 'escuro', description: 'tem tema' },
      { input: [{}], expected: 'claro', description: 'sem preferências -> claro' },
    ],
  },
  {
    kind: 'challenge',
    title: '12.6 Média que não quebra',
    concept: 'Valide a entrada antes de calcular: se não for uma lista com itens, devolva 0.',
    exampleCode: 'if (!Array.isArray(lista) || lista.length === 0) return 0',
    vocabulary: ['Array.isArray', 'guarda de entrada'],
    difficulty: 'medium',
    baseXp: 20,
    description: 'Escreva `media(lista)` que retorna a média dos números — mas 0 se não for uma lista ou se estiver vazia.',
    starterCode: 'function media(lista) {\n  // guard clause + cálculo\n}\n',
    targetFn: 'media',
    testCases: [
      { input: [[2, 4]], expected: 3, description: 'média de 2,4 = 3' },
      { input: [[]], expected: 0, description: 'vazia -> 0' },
      { input: ['abc'], expected: 0, description: 'não é lista -> 0' },
    ],
  },
  {
    kind: 'lesson',
    title: 'Lição 6 — Previsível vs. inesperado',
    concept:
      'Valide o que você controla (guard clauses); use `try/catch` para o que foge do seu controle (parse de texto, conversões de fontes externas).',
    exampleCode: '// guard: if (b === 0) return ...\n// try/catch: JSON.parse, parseInt de texto sujo',
    vocabulary: ['guard clause', 'try', 'catch'],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: '12.7 Conversão robusta para inteiro',
    concept: 'Tente converter; se não for um número, lance erro e caia no catch com 0.',
    exampleCode: 'const n = parseInt(txt, 10)\nif (isNaN(n)) throw new Error("nan")',
    vocabulary: ['parseInt', 'isNaN', 'try', 'catch'],
    difficulty: 'medium',
    baseXp: 20,
    description: 'Escreva `paraInteiro(txt)` que retorna o inteiro do texto, ou 0 se não der para converter.',
    starterCode: 'function paraInteiro(txt) {\n  // parseInt + isNaN + try/catch\n}\n',
    targetFn: 'paraInteiro',
    testCases: [
      { input: ['42'], expected: 42, description: '"42" -> 42' },
      { input: ['abc'], expected: 0, description: '"abc" -> 0' },
      { input: ['7x'], expected: 7, description: '"7x" -> 7 (parseInt lê o começo)' },
    ],
  },
  {
    kind: 'challenge',
    title: '12.8 [Fecha a trilha] Carrinho robusto',
    concept: 'Junte tudo: valide a lista, use `?.`/`??` para campos que podem faltar e `try/catch` em volta do cálculo.',
    exampleCode: 'const preco = item?.preco ?? 0',
    vocabulary: ['Array.isArray', '?.', '??', 'try', 'catch'],
    difficulty: 'hard',
    baseXp: 25,
    description:
      'Recebe uma lista de itens `{ preco, qtd }` (campos podem faltar). Escreva `total(itens)` que soma preco×qtd de cada item (preco padrão 0, qtd padrão 1); retorna 0 se a entrada não for uma lista.',
    starterCode: 'function total(itens) {\n  // valide + ?./?? + try/catch\n}\n',
    targetFn: 'total',
    testCases: [
      { input: [[{ preco: 10, qtd: 2 }, { preco: 5 }]], expected: 25, description: '10*2 + 5*1 = 25' },
      { input: [[{ qtd: 3 }]], expected: 0, description: 'sem preço -> 0*3 = 0' },
      { input: ['x'], expected: 0, description: 'não é lista -> 0' },
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
