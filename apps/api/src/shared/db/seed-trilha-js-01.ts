/**
 * Seed da trilha "JavaScript: Primeiros Passos" no CATÁLOGO GLOBAL (tenant_id = NULL).
 * Trilha 1/14 do currículo JS — ver docs/pesquisa-trilhas-js.md (mapa geral) e
 * docs/trilha-js-01-primeiros-passos.md (desenho módulo a módulo).
 *
 * Execução: pnpm --filter @codinhos/api db:seed:js-01
 *
 * Idempotente e atualizável, mesmo padrão dos seeds de Python. Modos usados:
 * type-check, function-call e stdout. Desafios verificados contra o runner.
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

const TRAIL_SLUG = 'js-primeiros-passos'
const TRAIL_TITLE = 'JavaScript: Primeiros Passos'
const TRAIL_DESC =
  'Porta de entrada do currículo: variáveis e tipos (string/number/boolean), sua primeira função com return, operadores aritméticos e de comparação, e console.log. Sem pré-requisito.'
const TRAIL_ORDER = 10

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
    title: 'Lição 1 — Valores e variáveis',
    concept:
      'O computador precisa **guardar informação** — e fazemos isso com **variáveis**, como caixinhas com um nome. Use `let` quando o valor pode mudar e `const` quando é fixo.\n\nTodo valor tem um **tipo**: texto é `string` (entre aspas), número é `number` (sem aspas) e verdadeiro/falso é `boolean` (`true`/`false`).',
    exampleCode: 'let nome = "Ana"      // string\nconst idade = 12       // number\nconst ativo = true     // boolean',
    vocabulary: ['let', 'const', 'string', 'number', 'boolean'],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: '1.1 Declare seu nome',
    concept: 'Uma variável guarda um valor com um nome. Texto é do tipo `string` e fica entre aspas.',
    exampleCode: 'let cidade = "Recife"\nconst pais = "Brasil"',
    vocabulary: ['let', 'const', 'string'],
    difficulty: 'easy',
    baseXp: 10,
    description: 'Declare uma variável chamada `nome` e guarde o seu nome (um texto, entre aspas).',
    starterCode: '// Declare aqui a variável nome com o seu nome entre aspas\n',
    testCases: [{ input: null, expected: 'string', description: 'nome deve ser do tipo string' }],
  },
  {
    kind: 'challenge',
    title: '1.2 Idade e status',
    concept: 'Número (`number`) NÃO leva aspas. Verdadeiro/falso é `boolean`: vale `true` ou `false`.',
    exampleCode: 'let pontos = 10       // number\nlet venceu = false    // boolean',
    vocabulary: ['number', 'boolean', 'true', 'false'],
    difficulty: 'easy',
    baseXp: 10,
    description: 'Declare `idade` (um número) e `ativo` (um booleano: true ou false).',
    starterCode: '// Declare idade (número) e ativo (true ou false)\n',
    testCases: [
      { input: null, expected: 'number', description: 'idade deve ser do tipo number' },
      { input: null, expected: 'boolean', description: 'ativo deve ser do tipo boolean' },
    ],
  },
  {
    kind: 'lesson',
    title: 'Lição 2 — Funções e return',
    concept:
      'Uma **função** é um bloco de código com nome. Ela pode receber **parâmetros** (entradas) e **devolve** um resultado com `return`.\n\nDepois de escrita, você a **chama** pelo nome: `dobro(4)` executa a função com `n = 4`.',
    exampleCode: 'function triplo(n) {\n  return n * 3\n}\n// triplo(2) devolve 6',
    vocabulary: ['function', 'return', 'parâmetro'],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: '1.3 Apresente-se',
    concept: 'O `return` devolve um valor. Aqui a função não recebe parâmetro e devolve um texto fixo.',
    exampleCode: 'function corFavorita() {\n  return "azul"\n}',
    vocabulary: ['function', 'return'],
    difficulty: 'easy',
    baseXp: 10,
    description: 'Escreva a função `apresentar()` que retorna exatamente o texto "Olá, eu sou o Codi".',
    starterCode: 'function apresentar() {\n  // escreva seu código aqui\n}\n',
    targetFn: 'apresentar',
    testCases: [{ input: [], expected: 'Olá, eu sou o Codi', description: 'retorna a apresentação' }],
  },
  {
    kind: 'challenge',
    title: '1.4 O dobro',
    concept: 'Uma função recebe **parâmetros** e usa no `return`. O `*` multiplica.',
    exampleCode: 'function triplo(n) {\n  return n * 3\n}\n// triplo(2) devolve 6',
    vocabulary: ['parâmetro', '*'],
    difficulty: 'easy',
    baseXp: 10,
    description: 'Escreva `dobro(n)` que retorna o dobro de n.',
    starterCode: 'function dobro(n) {\n  // escreva seu código aqui\n}\n',
    targetFn: 'dobro',
    testCases: [
      { input: [4], expected: 8, description: 'dobro(4) = 8' },
      { input: [0], expected: 0, description: 'dobro(0) = 0' },
      { input: [-3], expected: -6, description: 'dobro(-3) = -6' },
    ],
  },
  {
    kind: 'lesson',
    title: 'Lição 3 — Mostrando na tela: console.log',
    concept:
      'Para **mostrar** algo na tela usamos `console.log(valor)`. Isso é diferente de `return`: `return` devolve o valor para quem chamou a função; `console.log` imprime para a pessoa ver.\n\nAlguns desafios pedem para **imprimir** (o teste olha a saída) e outros para **retornar** (o teste olha o valor devolvido).',
    exampleCode: 'console.log("Olá!")   // aparece na tela\nconsole.log(2 + 2)     // aparece: 4',
    vocabulary: ['console.log'],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: '1.5 Olá na tela',
    concept: 'Use `console.log("texto")` para imprimir um texto exatamente como pedido.',
    exampleCode: 'console.log("Bem-vindo!")',
    vocabulary: ['console.log'],
    difficulty: 'easy',
    baseXp: 10,
    description: 'Imprima exatamente: Olá, mundo!',
    starterCode: '// escreva seu código aqui\n',
    testCases: [{ input: null, expected: 'Olá, mundo!', description: 'imprime a saudação', mode: 'stdout' }],
  },
  {
    kind: 'lesson',
    title: 'Lição 4 — Operadores aritméticos',
    concept:
      'Para fazer contas: `+` soma, `-` subtrai, `*` multiplica, `/` divide e `%` dá o **resto** da divisão (ótimo para saber se um número é par).\n\nUse **parênteses** para controlar a ordem: `(a + b) / 2` soma primeiro e divide depois.',
    exampleCode: '10 % 3        // 1 (resto)\n(2 + 4) / 2   // 3',
    vocabulary: ['+', '-', '*', '/', '%', 'parênteses'],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: '1.6 Soma',
    concept: 'Some dois números com `+` e devolva com `return`.',
    exampleCode: 'function diferenca(a, b) {\n  return a - b\n}',
    vocabulary: ['+'],
    difficulty: 'easy',
    baseXp: 10,
    description: 'Escreva `soma(a, b)` que retorna a soma dos dois números.',
    starterCode: 'function soma(a, b) {\n  // escreva seu código aqui\n}\n',
    targetFn: 'soma',
    testCases: [
      { input: [2, 3], expected: 5, description: 'soma(2, 3) = 5' },
      { input: [-1, 1], expected: 0, description: 'soma(-1, 1) = 0' },
      { input: [10, 25], expected: 35, description: 'soma(10, 25) = 35' },
    ],
  },
  {
    kind: 'challenge',
    title: '1.7 É par?',
    concept: 'O `%` dá o RESTO da divisão. Um número é par quando `n % 2 === 0`. A comparação já devolve `true`/`false`.',
    exampleCode: 'function ehMultiploDe3(n) {\n  return n % 3 === 0\n}',
    vocabulary: ['%', '==='],
    difficulty: 'easy',
    baseXp: 10,
    description: 'Escreva `ehPar(n)` que retorna true se n for par, senão false.',
    starterCode: 'function ehPar(n) {\n  // escreva seu código aqui\n}\n',
    targetFn: 'ehPar',
    testCases: [
      { input: [4], expected: true, description: 'ehPar(4) = true' },
      { input: [7], expected: false, description: 'ehPar(7) = false' },
      { input: [0], expected: true, description: 'ehPar(0) = true' },
    ],
  },
  {
    kind: 'challenge',
    title: '1.8 Média de três',
    concept: 'Some os três e divida por 3. Use parênteses para somar ANTES de dividir.',
    exampleCode: 'function mediaDeDois(a, b) {\n  return (a + b) / 2\n}',
    vocabulary: ['+', '/', 'parênteses'],
    difficulty: 'easy',
    baseXp: 10,
    description: 'Escreva `mediaTres(a, b, c)` que retorna a média dos três números.',
    starterCode: 'function mediaTres(a, b, c) {\n  // escreva seu código aqui\n}\n',
    targetFn: 'mediaTres',
    testCases: [
      { input: [3, 3, 3], expected: 3, description: 'média de 3,3,3 = 3' },
      { input: [1, 2, 3], expected: 2, description: 'média de 1,2,3 = 2' },
      { input: [2, 2, 5], expected: 3, description: 'média de 2,2,5 = 3' },
    ],
  },
  {
    kind: 'lesson',
    title: 'Lição 5 — Comparação e lógica',
    concept:
      'Para comparar use `>`, `<`, `>=`, `<=` e, para igualdade, sempre `===` (compara valor **e** tipo — `1 === "1"` é `false`). Comparações devolvem `boolean`.\n\nVocê combina condições com `&&` (E — só true se os dois lados forem true), `||` (OU) e `!` (não). `typeof x` diz o tipo de um valor.',
    exampleCode: 'idade >= 12          // true/false\nn > 0 && n < 10      // entre 1 e 9\n5 === "5"            // false (tipo diferente)',
    vocabulary: ['===', '!==', '>', '<', '>=', '<=', '&&', '||', '!', 'typeof'],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: '1.9 Maior de idade',
    concept: '`>=` significa "maior ou igual". O resultado da comparação já é o boolean que você deve devolver.',
    exampleCode: 'function ehAdolescente(idade) {\n  return idade >= 12\n}',
    vocabulary: ['>='],
    difficulty: 'easy',
    baseXp: 10,
    description: 'Escreva `maiorDeIdade(idade)` que retorna true se idade for 18 ou mais.',
    starterCode: 'function maiorDeIdade(idade) {\n  // escreva seu código aqui\n}\n',
    targetFn: 'maiorDeIdade',
    testCases: [
      { input: [18], expected: true, description: '18 é maior de idade' },
      { input: [17], expected: false, description: '17 não é' },
      { input: [40], expected: true, description: '40 é' },
    ],
  },
  {
    kind: 'challenge',
    title: '1.10 Está na faixa?',
    concept: 'O `&&` (E) só é true quando os DOIS lados são true. Combine duas comparações.',
    exampleCode: 'function notaValida(n) {\n  return n >= 0 && n <= 10\n}',
    vocabulary: ['&&', '>=', '<='],
    difficulty: 'medium',
    baseXp: 20,
    description: 'Escreva `naFaixa(n, min, max)` que retorna true se n estiver entre min e max (incluindo as pontas).',
    starterCode: 'function naFaixa(n, min, max) {\n  // escreva seu código aqui\n}\n',
    targetFn: 'naFaixa',
    testCases: [
      { input: [5, 1, 10], expected: true, description: '5 está entre 1 e 10' },
      { input: [0, 1, 10], expected: false, description: '0 não está' },
      { input: [10, 1, 10], expected: true, description: '10 está (ponta)' },
    ],
  },
  {
    kind: 'challenge',
    title: '1.11 [Fecha a trilha] Ficha na tela',
    concept: 'Junte texto e valores com `+` num `console.log`. Números viram texto automaticamente ao juntar com `+`.',
    exampleCode: 'function linha(cidade) {\n  console.log("Cidade: " + cidade)\n}',
    vocabulary: ['console.log', '+'],
    difficulty: 'medium',
    baseXp: 20,
    description: 'Escreva `ficha(nome, idade)` que imprime EXATAMENTE: Nome: <nome>, Idade: <idade>',
    starterCode: 'function ficha(nome, idade) {\n  // use console.log e + para juntar\n}\n',
    targetFn: 'ficha',
    testCases: [
      { input: ['Ana', 12], expected: 'Nome: Ana, Idade: 12', description: 'Ana, 12', mode: 'stdout' },
      { input: ['Rex', 9], expected: 'Nome: Rex, Idade: 9', description: 'Rex, 9', mode: 'stdout' },
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
