/**
 * Seed da trilha "JavaScript: Funções" no CATÁLOGO GLOBAL.
 * Trilha 3/14 — ver docs/pesquisa-trilhas-js.md e docs/trilha-js-03-funcoes.md.
 * Execução: pnpm --filter @codinhos/api db:seed:js-03
 * Idempotente. Modo: function-call. Desafios com helper usam targetFn.
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

const TRAIL_SLUG = 'js-funcoes'
const TRAIL_TITLE = 'JavaScript: Funções'
const TRAIL_DESC =
  'Aprofunda funções: template literal, parâmetro padrão, arrow functions, composição (uma função chama outra) e escopo. Pré-requisito: Decisões e Repetições.'
const TRAIL_ORDER = 30

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
    title: 'Lição 1 — Template literal',
    concept:
      'O **template literal** usa crases `` ` `` (não aspas) e `${...}` para misturar texto e valores sem precisar somar com `+`.',
    exampleCode: 'const nome = "Ana"\nconst msg = `Olá, ${nome}!`   // "Olá, Ana!"',
    vocabulary: ['template literal', '${}'],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: '3.1 Etiqueta',
    concept: 'Monte o texto com crases e `${nome}` no meio.',
    exampleCode: 'function saudacao(nome) {\n  return `Oi, ${nome}`\n}',
    vocabulary: ['template literal'],
    difficulty: 'easy',
    baseXp: 10,
    description: 'Escreva `etiqueta(nome)` que retorna "Produto: NOME" (ex.: etiqueta("Bola") = "Produto: Bola").',
    starterCode: 'function etiqueta(nome) {\n  // use template literal\n}\n',
    targetFn: 'etiqueta',
    testCases: [
      { input: ['Bola'], expected: 'Produto: Bola', description: 'Bola' },
      { input: ['Caderno'], expected: 'Produto: Caderno', description: 'Caderno' },
    ],
  },
  {
    kind: 'challenge',
    title: '3.2 Cartão',
    concept: 'Um template pode ter vários `${}` no mesmo texto.',
    exampleCode: 'function linha(a, b) {\n  return `${a} / ${b}`\n}',
    vocabulary: ['template literal'],
    difficulty: 'easy',
    baseXp: 10,
    description: 'Escreva `cartao(nome, cargo)` que retorna "NOME, CARGO" (ex.: cartao("Ana", "Dev") = "Ana, Dev").',
    starterCode: 'function cartao(nome, cargo) {\n  // use template literal\n}\n',
    targetFn: 'cartao',
    testCases: [
      { input: ['Ana', 'Dev'], expected: 'Ana, Dev', description: 'Ana, Dev' },
      { input: ['Rex', 'Chefe'], expected: 'Rex, Chefe', description: 'Rex, Chefe' },
    ],
  },
  {
    kind: 'lesson',
    title: 'Lição 2 — Parâmetro padrão',
    concept:
      'Um parâmetro pode ter **valor padrão** com `=`: se ninguém passar aquele argumento, a função usa o padrão.',
    exampleCode: 'function multiplica(a, b = 2) {\n  return a * b\n}\n// multiplica(5) usa b = 2 -> 10',
    vocabulary: ['parâmetro padrão'],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: '3.3 Saudação com padrão',
    concept: 'Combine parâmetro padrão + template literal.',
    exampleCode: 'function convite(nome, festa = "aniversário") {\n  return `${nome} veio para o ${festa}`\n}',
    vocabulary: ['parâmetro padrão', 'template literal'],
    difficulty: 'medium',
    baseXp: 15,
    description:
      'Escreva `saudar(nome, saudacao)` que retorna "SAUDACAO, NOME!". O padrão de `saudacao` é "Olá". Ex.: saudar("Ana") = "Olá, Ana!"; saudar("Rex", "Oi") = "Oi, Rex!".',
    starterCode: 'function saudar(nome, saudacao = "Olá") {\n  // use template literal\n}\n',
    targetFn: 'saudar',
    testCases: [
      { input: ['Ana'], expected: 'Olá, Ana!', description: 'usa o padrão' },
      { input: ['Rex', 'Oi'], expected: 'Oi, Rex!', description: 'saudação própria' },
    ],
  },
  {
    kind: 'lesson',
    title: 'Lição 3 — Arrow functions',
    concept:
      'A **arrow function** é uma forma curta de escrever funções: `const dobro = (n) => n * 2`. Sem chaves nem `return` quando é uma expressão só.',
    exampleCode: 'const quadrado = (n) => n * n\n// quadrado(3) devolve 9',
    vocabulary: ['arrow function', '=>'],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: '3.4 Dobro como arrow',
    concept: 'Escreva a função na forma curta com `=>`.',
    exampleCode: 'const triplo = (n) => n * 3',
    vocabulary: ['arrow function'],
    difficulty: 'easy',
    baseXp: 10,
    description: 'Escreva `dobro` como uma arrow function que retorna o dobro de n.',
    starterCode: 'const dobro = (n) => // complete\n',
    targetFn: 'dobro',
    testCases: [
      { input: [4], expected: 8, description: 'dobro(4) = 8' },
      { input: [0], expected: 0, description: 'dobro(0) = 0' },
      { input: [-5], expected: -10, description: 'dobro(-5) = -10' },
    ],
  },
  {
    kind: 'challenge',
    title: '3.5 Aplicar desconto',
    concept: 'Porcentagem: `(valor * pct) / 100`. Multiplique antes de dividir.',
    exampleCode: 'const comAumento = (preco, pct) => preco + (preco * pct) / 100',
    vocabulary: ['arrow function', 'porcentagem'],
    difficulty: 'medium',
    baseXp: 15,
    description: 'Escreva `comDesconto(preco, pct)` (arrow) que retorna o preço com pct% de desconto.',
    starterCode: 'const comDesconto = (preco, pct) => // complete\n',
    targetFn: 'comDesconto',
    testCases: [
      { input: [100, 20], expected: 80, description: '100 com 20% = 80' },
      { input: [250, 10], expected: 225, description: '250 com 10% = 225' },
      { input: [40, 0], expected: 40, description: '40 com 0% = 40' },
    ],
  },
  {
    kind: 'lesson',
    title: 'Lição 4 — Funções que usam funções',
    concept:
      'Uma função pode **chamar** outra. Isso deixa o código em blocos menores e reutilizáveis. A função "principal" usa uma "auxiliar" (helper).',
    exampleCode: 'function soma(a, b) {\n  return a + b\n}\nfunction media(a, b) {\n  return soma(a, b) / 2\n}',
    vocabulary: ['função auxiliar', 'composição'],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: '3.6 Média com helper',
    concept: 'Escreva uma função `soma(a, b)` e use-a dentro de `media(a, b)`.',
    exampleCode: 'function dobro(n) { return n * 2 }\nfunction quadruplo(n) { return dobro(dobro(n)) }',
    vocabulary: ['função auxiliar'],
    difficulty: 'medium',
    baseXp: 15,
    description: 'Escreva `soma(a, b)` e `media(a, b)` que usa `soma` para retornar a média dos dois.',
    starterCode: 'function soma(a, b) {\n  // ...\n}\n\nfunction media(a, b) {\n  // use soma(a, b)\n}\n',
    targetFn: 'media',
    testCases: [
      { input: [4, 6], expected: 5, description: 'media(4, 6) = 5' },
      { input: [10, 10], expected: 10, description: 'media(10, 10) = 10' },
      { input: [0, 8], expected: 4, description: 'media(0, 8) = 4' },
    ],
  },
  {
    kind: 'lesson',
    title: 'Lição 5 — Escopo',
    concept:
      'Uma variável declarada **dentro** de uma função só existe lá dentro — não vaza para fora. Cada função tem seu próprio espaço.',
    exampleCode: 'function f() {\n  const x = 10   // x só existe dentro de f\n  return x\n}',
    vocabulary: ['escopo', 'local'],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: '3.7 Preço com imposto',
    concept: 'Um helper calcula o imposto; a função principal soma ao preço.',
    exampleCode: 'function taxa(v) { return v * 0.1 }\nfunction total(v) { return v + taxa(v) }',
    vocabulary: ['função auxiliar', 'escopo'],
    difficulty: 'medium',
    baseXp: 15,
    description:
      'Escreva `imposto(valor)` que retorna 10% do valor, e `precoFinal(valor)` que retorna o valor + imposto. Ex.: precoFinal(100) = 110.',
    starterCode: 'function imposto(valor) {\n  // 10% do valor\n}\n\nfunction precoFinal(valor) {\n  // valor + imposto(valor)\n}\n',
    targetFn: 'precoFinal',
    testCases: [
      { input: [100], expected: 110, description: 'precoFinal(100) = 110' },
      { input: [50], expected: 55, description: 'precoFinal(50) = 55' },
      { input: [0], expected: 0, description: 'precoFinal(0) = 0' },
    ],
  },
  {
    kind: 'challenge',
    title: '3.8 [Fecha a trilha] Cálculo de frete',
    concept: 'Junte tudo: um helper para a taxa por região, parâmetro padrão e o cálculo final.',
    exampleCode: 'function taxa(regiao) {\n  return regiao === "sudeste" ? 5 : 8\n}',
    vocabulary: ['função auxiliar', 'parâmetro padrão'],
    difficulty: 'medium',
    baseXp: 20,
    description:
      'Escreva `taxaPorKg(regiao)` (retorna 5 se "sudeste", senão 8) e `calcularFrete(peso, regiao)` que retorna peso × taxa. O padrão de `regiao` é "sudeste". Ex.: calcularFrete(2) = 10; calcularFrete(2, "norte") = 16.',
    starterCode:
      'function taxaPorKg(regiao) {\n  // 5 para "sudeste", 8 para o resto\n}\n\nfunction calcularFrete(peso, regiao = "sudeste") {\n  // peso * taxaPorKg(regiao)\n}\n',
    targetFn: 'calcularFrete',
    testCases: [
      { input: [2], expected: 10, description: 'sudeste por padrão: 2 x 5 = 10' },
      { input: [2, 'norte'], expected: 16, description: 'norte: 2 x 8 = 16' },
      { input: [3, 'sudeste'], expected: 15, description: 'sudeste: 3 x 5 = 15' },
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
