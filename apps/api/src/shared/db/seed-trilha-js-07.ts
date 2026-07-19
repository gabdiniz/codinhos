/**
 * Seed da trilha "JavaScript: Imprimindo e Formatando Saídas" no CATÁLOGO GLOBAL.
 * Trilha 7/14 — ver docs/pesquisa-trilhas-js.md e docs/trilha-js-07-saida-e-formatacao.md.
 * Execução: pnpm --filter @codinhos/api db:seed:js-07
 * Idempotente. Modo dominante: stdout (saída exata) + um caso com matcher 'contains'.
 * Saídas esperadas conferidas char a char contra o runner real.
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

const TRAIL_SLUG = 'js-saida-e-formatacao'
const TRAIL_TITLE = 'JavaScript: Imprimindo e Formatando Saídas'
const TRAIL_DESC =
  'Imprimir com capricho: template, repeat, laços aninhados, padStart/padEnd e arte em texto. Pré-requisito: Funções.'
const TRAIL_ORDER = 70

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
    title: 'Lição 1 — console.log e template para saída',
    concept:
      'Para montar a linha impressa, o template literal `` `${}` `` é mais limpo que somar com `+`. Cada `console.log` imprime uma linha.',
    exampleCode: 'const nome = "Ana"\nconsole.log(`Olá, ${nome}!`)   // Olá, Ana!',
    vocabulary: ['console.log', 'template literal'],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: '7.1 Cartão de apresentação',
    concept: 'Imprima duas linhas com template literal.',
    exampleCode: 'function saudar(nome) {\n  console.log(`Oi, ${nome}`)\n}',
    vocabulary: ['console.log', 'template literal'],
    difficulty: 'easy',
    baseXp: 10,
    description: 'Escreva `cartao(nome, idade)` que imprime duas linhas:\nNome: <nome>\nIdade: <idade>',
    starterCode: 'function cartao(nome, idade) {\n  // dois console.log\n}\n',
    targetFn: 'cartao',
    testCases: [
      { input: ['Ana', 12], expected: 'Nome: Ana\nIdade: 12', description: 'Ana, 12', mode: 'stdout' },
      { input: ['Rex', 9], expected: 'Nome: Rex\nIdade: 9', description: 'Rex, 9', mode: 'stdout' },
    ],
  },
  {
    kind: 'challenge',
    title: '7.2 Linha decorativa',
    concept: '`"-".repeat(n)` repete o traço n vezes.',
    exampleCode: '"=".repeat(3)   // "==="',
    vocabulary: ['.repeat()'],
    difficulty: 'easy',
    baseXp: 10,
    description: 'Escreva `linha(n)` que imprime n traços "-" numa linha só.',
    starterCode: 'function linha(n) {\n  // use "-".repeat(n)\n}\n',
    targetFn: 'linha',
    testCases: [
      { input: [5], expected: '-----', description: '5 traços', mode: 'stdout' },
      { input: [3], expected: '---', description: '3 traços', mode: 'stdout' },
    ],
  },
  {
    kind: 'lesson',
    title: 'Lição 2 — Laços aninhados',
    concept:
      'Um `for` dentro de outro `for` permite desenhar em 2D: o de fora controla as linhas, o de dentro monta cada linha. Monte a linha numa variável e imprima ao fim de cada volta do laço de fora.',
    exampleCode: 'for (let i = 0; i < 2; i++) {\n  let linha = ""\n  for (let j = 0; j < 3; j++) linha += "*"\n  console.log(linha)\n}',
    vocabulary: ['for aninhado'],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: '7.3 Quadrado de asteriscos',
    concept: 'n linhas, cada uma com n asteriscos.',
    exampleCode: '// use um for para as linhas e outro para as colunas',
    vocabulary: ['for aninhado'],
    difficulty: 'medium',
    baseXp: 15,
    description: 'Escreva `quadrado(n)` que imprime um quadrado n×n de "*".',
    starterCode: 'function quadrado(n) {\n  // for de linhas + for de colunas\n}\n',
    targetFn: 'quadrado',
    testCases: [
      { input: [3], expected: '***\n***\n***', description: '3x3', mode: 'stdout' },
      { input: [2], expected: '**\n**', description: '2x2', mode: 'stdout' },
    ],
  },
  {
    kind: 'challenge',
    title: '7.4 Triângulo crescente',
    concept: 'A linha `i` tem `i` asteriscos — dá para usar `"*".repeat(i)`.',
    exampleCode: 'for (let i = 1; i <= n; i++) console.log("*".repeat(i))',
    vocabulary: ['.repeat()', 'for'],
    difficulty: 'medium',
    baseXp: 15,
    description: 'Escreva `triangulo(n)`: linha 1 tem 1 "*", linha 2 tem 2, ... até n.',
    starterCode: 'function triangulo(n) {\n  // escreva seu código aqui\n}\n',
    targetFn: 'triangulo',
    testCases: [
      { input: [3], expected: '*\n**\n***', description: 'até 3', mode: 'stdout' },
      { input: [4], expected: '*\n**\n***\n****', description: 'até 4', mode: 'stdout' },
    ],
  },
  {
    kind: 'challenge',
    title: '7.5 Pirâmide numérica',
    concept: 'Mesmo padrão do triângulo, mas cada linha mostra os números de 1 até i.',
    exampleCode: '// linha 3 deve mostrar: 123',
    vocabulary: ['for aninhado'],
    difficulty: 'medium',
    baseXp: 15,
    description: 'Escreva `piramide(n)`: linha i mostra os números de 1 até i grudados. Ex.: n=3 -> 1 / 12 / 123.',
    starterCode: 'function piramide(n) {\n  // escreva seu código aqui\n}\n',
    targetFn: 'piramide',
    testCases: [
      { input: [3], expected: '1\n12\n123', description: 'n=3', mode: 'stdout' },
      { input: [4], expected: '1\n12\n123\n1234', description: 'n=4', mode: 'stdout' },
    ],
  },
  {
    kind: 'lesson',
    title: 'Lição 3 — Alinhando texto',
    concept:
      '`.padEnd(n)` completa o texto com espaços à DIREITA até ter tamanho n (bom para colunas); `.padStart(n)` completa à esquerda. Ex.: `"Ana".padEnd(6)` vira `"Ana   "`.',
    exampleCode: '"Ana".padEnd(6) + "12"   // "Ana   12"',
    vocabulary: ['.padEnd()', '.padStart()'],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: '7.6 Tabela de nomes e idades',
    concept: 'Alinhe a coluna do nome com `.padEnd(8)` e cole a idade depois.',
    exampleCode: 'console.log(nome.padEnd(8) + idade)',
    vocabulary: ['.padEnd()', 'for...of'],
    difficulty: 'medium',
    baseXp: 20,
    description:
      'Recebe uma lista de `{ nome, idade }`. Escreva `tabela(pessoas)` que imprime uma linha por pessoa: o nome com padEnd(8) seguido da idade.',
    starterCode: 'function tabela(pessoas) {\n  // for...of + padEnd(8)\n}\n',
    targetFn: 'tabela',
    testCases: [
      {
        input: [[{ nome: 'Ana', idade: 12 }, { nome: 'Bob', idade: 9 }]],
        expected: 'Ana     12\nBob     9',
        description: 'duas pessoas',
        mode: 'stdout',
      },
    ],
  },
  {
    kind: 'challenge',
    title: '7.7 Lista numerada',
    concept: 'Percorra com índice e imprima "posição - item".',
    exampleCode: 'console.log(`${i + 1} - ${item}`)',
    vocabulary: ['for', 'template literal'],
    difficulty: 'medium',
    baseXp: 15,
    description: 'Escreva `numerada(itens)` que imprime cada item numa linha "N - item" (N começa em 1).',
    starterCode: 'function numerada(itens) {\n  // escreva seu código aqui\n}\n',
    targetFn: 'numerada',
    testCases: [
      { input: [['seg', 'ter', 'qua']], expected: '1 - seg\n2 - ter\n3 - qua', description: 'três itens', mode: 'stdout' },
    ],
  },
  {
    kind: 'lesson',
    title: 'Lição 4 — Quando a saída pode variar',
    concept:
      'Nem todo exercício tem uma resposta única. O matcher **`contains`** aceita qualquer saída que **contenha** um trecho esperado — dá liberdade no resto do texto.',
    exampleCode: '// a saída só precisa conter "total: 15", o resto é livre',
    vocabulary: ['matcher contains'],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: '7.8 Relatório livre',
    concept: 'A saída pode ter o texto que você quiser, desde que contenha o total pedido.',
    exampleCode: 'console.log(`Cliente ${nome} — itens: ${total}`)',
    vocabulary: ['matcher contains', 'template literal'],
    difficulty: 'medium',
    baseXp: 15,
    description:
      'Escreva `relatorio(nome, total)` que imprime uma frase livre, mas que CONTENHA o texto "itens: <total>". Ex.: para total 15, a saída deve conter "itens: 15".',
    starterCode: 'function relatorio(nome, total) {\n  // a saída precisa conter `itens: ${total}`\n}\n',
    targetFn: 'relatorio',
    testCases: [
      { input: ['Ana', 15], expected: 'itens: 15', description: 'contém itens: 15', mode: 'stdout', matcher: 'contains' },
      { input: ['Rex', 3], expected: 'itens: 3', description: 'contém itens: 3', mode: 'stdout', matcher: 'contains' },
    ],
  },
  {
    kind: 'challenge',
    title: '7.9 Arte em ASCII',
    concept: 'Imprima cada linha exatamente, incluindo os espaços à esquerda (a indentação é preservada).',
    exampleCode: 'console.log("  *")\nconsole.log(" ***")',
    vocabulary: ['console.log', 'indentação'],
    difficulty: 'medium',
    baseXp: 15,
    description: 'Escreva `arvore()` (sem parâmetros) que imprime EXATAMENTE:\n  *\n ***\n*****\n  |',
    starterCode: 'function arvore() {\n  // quatro console.log\n}\n',
    targetFn: 'arvore',
    testCases: [{ input: [], expected: '  *\n ***\n*****\n  |', description: 'arvorezinha', mode: 'stdout' }],
  },
  {
    kind: 'challenge',
    title: '7.10 [Fecha a trilha] Painel de placar',
    concept: 'Junte função + padEnd + laço + comparação: imprima cada jogador alinhado e, no fim, o líder.',
    exampleCode: 'console.log(nome.padEnd(6) + pontos)',
    vocabulary: ['.padEnd()', 'for...of', 'comparação'],
    difficulty: 'hard',
    baseXp: 25,
    description:
      'Recebe uma lista de `{ nome, pontos }`. Escreva `placar(jogadores)` que imprime cada jogador (nome com padEnd(6) + pontos) e, na última linha, "Lider: <nome do maior>".',
    starterCode: 'function placar(jogadores) {\n  // imprima cada um e depois o líder\n}\n',
    targetFn: 'placar',
    testCases: [
      {
        input: [[{ nome: 'Ana', pontos: 30 }, { nome: 'Bia', pontos: 50 }]],
        expected: 'Ana   30\nBia   50\nLider: Bia',
        description: 'Bia lidera',
        mode: 'stdout',
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
