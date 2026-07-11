/**
 * Seed da trilha "Imprimindo e Formatando Saídas" no CATÁLOGO GLOBAL
 * (tenant_id = NULL). Aprofunda o `mode: 'stdout'` além do básico (C.1-C.4 já
 * existentes na trilha "JS: do Fundamento ao Algoritmo"): laços aninhados p/
 * padrões visuais, alinhamento de texto (padStart/padEnd), matcher `contains`
 * para respostas livres e ASCII art multi-linha.
 *
 * Execução: pnpm --filter @codinhos/api db:seed:console
 *
 * Idempotente E atualizável, mesmo padrão do seed-trilha-js.ts.
 * Desafios verificados contra o runner real (run-tests.ts) — strings de saída
 * conferidas com uma implementação de referência antes de semear.
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
const TRAIL_TITLE = 'Imprimindo e Formatando Saídas'
const TRAIL_DESC =
  'Trilha dedicada a imprimir na tela: laços aninhados para desenhar padrões, alinhamento de texto (padStart/padEnd) para tabelas, respostas livres com matcher "contains" e arte em ASCII. Aprofunda o console.log além do básico.'

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
    title: 'Lição — Recapitulando console.log e template strings',
    concept:
      'Você já usa `console.log` para mostrar texto na tela. Agora vamos além: com uma **template string** (entre crases `` ` ``), você mistura texto fixo com variáveis usando `${variavel}`, sem precisar do `+`.',
    exampleCode: 'const nome = "Ana"\nconsole.log(`Oi, ${nome}!`)\n// imprime: Oi, Ana!',
    vocabulary: ['template string', '`', '${}'],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: 'S.1 Cartão de apresentação',
    concept: 'Use template string com `${}` para montar uma frase a partir de parâmetros.',
    exampleCode: 'function saudacao(nome) {\n  console.log(`Bem-vindo(a), ${nome}!`)\n}',
    vocabulary: ['template string', 'console.log'],
    difficulty: 'easy',
    baseXp: 10,
    description: 'Escreva `cartao(nome, idade)` que imprime EXATAMENTE: `Nome: <nome> | Idade: <idade>` (uma linha).',
    starterCode: 'function cartao(nome, idade) {\n  // use template string e console.log\n}\n',
    targetFn: 'cartao',
    testCases: [
      { input: ['Ana', 12], expected: 'Nome: Ana | Idade: 12', description: 'Ana, 12', mode: 'stdout' },
      { input: ['Rex', 7], expected: 'Nome: Rex | Idade: 7', description: 'Rex, 7', mode: 'stdout' },
    ],
  },
  {
    kind: 'challenge',
    title: 'S.2 Linha decorativa',
    concept: '`"-".repeat(n)` repete um caractere n vezes — útil para linhas decorativas sem laço.',
    exampleCode: 'console.log("=".repeat(5)) // =====',
    vocabulary: ['.repeat()'],
    difficulty: 'easy',
    baseXp: 10,
    description: 'Escreva `linha(n)` que imprime uma linha com n travessões (`-`). Ex.: linha(4) -> `----`.',
    starterCode: 'function linha(n) {\n  // use .repeat\n}\n',
    targetFn: 'linha',
    testCases: [
      { input: [4], expected: '----', description: 'n=4', mode: 'stdout' },
      { input: [8], expected: '--------', description: 'n=8', mode: 'stdout' },
      { input: [1], expected: '-', description: 'n=1', mode: 'stdout' },
    ],
  },
  {
    kind: 'lesson',
    title: 'Lição — Laços aninhados (for dentro de for)',
    concept:
      'Para desenhar em duas dimensões (linhas E colunas), usamos um `for` DENTRO de outro. O laço de fora controla a LINHA; o de dentro controla o que aparece em cada linha.\n\nMonte a linha inteira numa variável de texto e só imprima no final do laço de dentro.',
    exampleCode: 'for (let linha = 1; linha <= 3; linha++) {\n  let texto = ""\n  for (let col = 1; col <= 3; col++) {\n    texto += "*"\n  }\n  console.log(texto)\n}\n// imprime *** três vezes (uma por linha)',
    vocabulary: ['for aninhado', 'acumular texto'],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: 'S.3 Quadrado de asteriscos',
    concept: 'Um for de fora para as LINHAS, um de dentro para as COLUNAS. Exemplo análogo (retângulo com # em vez de *):',
    exampleCode: 'function retangulo(altura, largura) {\n  for (let l = 0; l < altura; l++) {\n    let linha = ""\n    for (let c = 0; c < largura; c++) linha += "#"\n    console.log(linha)\n  }\n}',
    vocabulary: ['for aninhado'],
    difficulty: 'medium',
    baseXp: 15,
    description: 'Escreva `quadrado(n)` que imprime um quadrado de asteriscos n x n (n linhas, cada uma com n asteriscos).',
    starterCode: 'function quadrado(n) {\n  // for de fora (linhas) + for de dentro (colunas)\n}\n',
    targetFn: 'quadrado',
    testCases: [
      { input: [3], expected: '***\n***\n***', description: 'n=3', mode: 'stdout' },
      { input: [1], expected: '*', description: 'n=1', mode: 'stdout' },
      { input: [5], expected: '*****\n*****\n*****\n*****\n*****', description: 'n=5', mode: 'stdout' },
    ],
  },
  {
    kind: 'challenge',
    title: 'S.4 Triângulo crescente',
    concept: 'Na linha `i`, imprima `i` asteriscos — o for de dentro vai até `i`, não até um número fixo. Exemplo análogo (com #):',
    exampleCode: 'function escada(n) {\n  for (let i = 1; i <= n; i++) {\n    let linha = ""\n    for (let j = 0; j < i; j++) linha += "#"\n    console.log(linha)\n  }\n}\n// escada(3) -> #, ##, ###',
    vocabulary: ['for aninhado'],
    difficulty: 'medium',
    baseXp: 15,
    description: 'Escreva `triangulo(n)` que imprime um triângulo: linha 1 tem 1 asterisco, linha 2 tem 2, ..., linha n tem n.',
    starterCode: 'function triangulo(n) {\n  // o for de dentro depende do i do for de fora\n}\n',
    targetFn: 'triangulo',
    testCases: [
      { input: [4], expected: '*\n**\n***\n****', description: 'n=4', mode: 'stdout' },
      { input: [1], expected: '*', description: 'n=1', mode: 'stdout' },
    ],
  },
  {
    kind: 'challenge',
    title: 'S.5 Pirâmide numérica',
    concept: 'Reaproveite o padrão do triângulo, mas em vez de `*` imprima os NÚMEROS de 1 até i, separados por espaço.',
    exampleCode: 'let texto = ""\nfor (let j = 1; j <= 3; j++) texto += j + " "\nconsole.log(texto.trim()) // "1 2 3"',
    vocabulary: ['for aninhado', '.trim()'],
    difficulty: 'medium',
    baseXp: 20,
    description: 'Escreva `piramideNumerica(n)` que imprime, para cada linha i de 1 até n, os números de 1 até i separados por espaço (sem espaço sobrando no fim da linha).',
    starterCode: 'function piramideNumerica(n) {\n  // monte cada linha com os números 1..i separados por espaço\n}\n',
    targetFn: 'piramideNumerica',
    testCases: [
      { input: [3], expected: '1\n1 2\n1 2 3', description: 'n=3', mode: 'stdout' },
      { input: [1], expected: '1', description: 'n=1', mode: 'stdout' },
    ],
  },
  {
    kind: 'lesson',
    title: 'Lição — Alinhando texto (padStart/padEnd)',
    concept:
      '`.padEnd(tamanho)` completa uma string com espaços à DIREITA até o tamanho pedido (bom para colunas de texto); `.padStart(tamanho, char)` completa à ESQUERDA (bom para números alinhados).',
    exampleCode: 'console.log("Ana".padEnd(8) + "|")       // "Ana     |"\nconsole.log("7".padStart(3, "0") + "|") // "007|"',
    vocabulary: ['.padEnd()', '.padStart()'],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: 'S.6 Tabela de nomes e idades',
    concept: 'Use `.padEnd` para alinhar a coluna do nome, para todas as linhas ficarem com a mesma largura.',
    exampleCode: 'function linhaTabela(chave, valor) {\n  console.log(chave.padEnd(10) + valor)\n}\n// linhaTabela("Cidade", "Recife") -> "Cidade    Recife"',
    vocabulary: ['.padEnd()', 'for'],
    difficulty: 'medium',
    baseXp: 20,
    description: 'Escreva `tabela(nomes, idades)` (duas listas do mesmo tamanho) que imprime uma linha por pessoa: nome com `.padEnd(10)` seguido da idade.',
    starterCode: 'function tabela(nomes, idades) {\n  // uma linha por pessoa: nomes[i].padEnd(10) + idades[i]\n}\n',
    targetFn: 'tabela',
    testCases: [
      { input: [['Ana', 'Bia'], [12, 13]], expected: 'Ana       12\nBia       13', description: 'Ana e Bia', mode: 'stdout' },
    ],
  },
  {
    kind: 'challenge',
    title: 'S.7 Calendário da semana',
    concept: 'Combine uma lista de dias com um número de linhas, igual à tabela anterior.',
    exampleCode: 'const dias = ["Seg", "Ter"]\nfor (const d of dias) console.log(d.padEnd(5) + "OK")',
    vocabulary: ['.padEnd()', 'for...of'],
    difficulty: 'medium',
    baseXp: 20,
    description:
      'Escreva `calendario(horas)` que recebe uma lista de 5 números (horas de estudo de segunda a sexta) e imprime uma linha por dia: `dias[i].padEnd(10)` + horas[i] + `"h"`. Os dias, em ordem: Segunda, Terça, Quarta, Quinta, Sexta.',
    starterCode: 'function calendario(horas) {\n  const dias = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"]\n  // para cada dia, imprima dias[i].padEnd(10) + horas[i] + "h"\n}\n',
    targetFn: 'calendario',
    testCases: [
      {
        input: [[2, 3, 1, 4, 2]],
        expected: 'Segunda   2h\nTerça     3h\nQuarta    1h\nQuinta    4h\nSexta     2h',
        description: '5 dias de horas',
        mode: 'stdout',
      },
    ],
  },
  {
    kind: 'lesson',
    title: 'Lição — Quando a saída pode variar (matcher contains)',
    concept:
      'Nem todo desafio tem UMA resposta certa. Quando o enunciado permite respostas diferentes (como um relatório com suas próprias palavras), o Codinhos pode conferir se a saída CONTÉM um trecho, em vez de bater exatamente.',
    exampleCode: '// Com matcher "contains", sua saída só precisa CONTER o texto pedido.\n// Ex.: a saída "Total: 42 pontos" contém "42".',
    vocabulary: ['matcher', 'contains'],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: 'S.8 Relatório livre',
    concept: 'Escreva um pequeno relatório (2 ou mais linhas), do seu jeito — mas ele PRECISA conter certas informações.',
    exampleCode: 'function relatorio(nome, pontos) {\n  console.log(`Relatório de ${nome}`)\n  console.log(`Pontuação: ${pontos} pontos`)\n}',
    vocabulary: ['template string', 'matcher contains'],
    difficulty: 'medium',
    baseXp: 15,
    description: 'Escreva `relatorio(nome, pontos)` que imprime um pequeno relatório (2+ linhas, do seu jeito) que precisa CONTER o nome e o número de pontos em algum lugar.',
    starterCode: 'function relatorio(nome, pontos) {\n  // escreva 2 ou mais linhas com console.log\n  // precisa mencionar o nome e o número de pontos\n}\n',
    targetFn: 'relatorio',
    testCases: [
      { input: ['Ana', 42], expected: 'Ana', description: 'menciona o nome', mode: 'stdout', matcher: 'contains' },
      { input: ['Ana', 42], expected: '42', description: 'menciona a pontuação', mode: 'stdout', matcher: 'contains' },
    ],
  },
  {
    kind: 'challenge',
    title: 'S.9 Arte em ASCII (arvorezinha)',
    concept: 'Em ASCII art, os espaços à ESQUERDA fazem parte do desenho (centralizam cada linha) — por isso a indentação é conferida.',
    exampleCode: '// cada linha começa com espaços diferentes para "centralizar":\nconsole.log("  *")\nconsole.log(" ***")',
    vocabulary: ['console.log', 'indentação'],
    difficulty: 'hard',
    baseXp: 25,
    description:
      'Escreva `arvoreDeNatal()` que imprime exatamente esta arvorezinha (os espaços à esquerda importam):\n```\n   *\n  ***\n *****\n*******\n   |\n```',
    starterCode: 'function arvoreDeNatal() {\n  // use console.log, uma linha por vez, com os espaços certos à esquerda\n}\n',
    targetFn: 'arvoreDeNatal',
    testCases: [
      { input: [], expected: '   *\n  ***\n *****\n*******\n   |', description: 'árvore completa', mode: 'stdout' },
    ],
  },
  {
    kind: 'challenge',
    title: 'S.10 [Hard] Painel de placar',
    concept: 'Combine tudo: função, `.padEnd`, laço e uma comparação para achar o maior valor.',
    exampleCode: 'function maiorIndice(lista) {\n  let m = 0\n  for (let i = 1; i < lista.length; i++) if (lista[i] > lista[m]) m = i\n  return m\n}',
    vocabulary: ['.padEnd()', 'for', 'comparação'],
    difficulty: 'hard',
    baseXp: 35,
    description:
      'Escreva `placar(times, pontos)` (duas listas de mesmo tamanho) que imprime uma linha por time (`times[i].padEnd(12)` + pontos[i]) e, na última linha, `Vencedor: <nome do time com mais pontos>`.',
    starterCode: 'function placar(times, pontos) {\n  // 1) imprima uma linha por time (padEnd(12) + pontos)\n  // 2) ache o índice do maior valor em pontos\n  // 3) imprima "Vencedor: " + times[índice]\n}\n',
    targetFn: 'placar',
    testCases: [
      {
        input: [['Falcões', 'Águias', 'Lobos'], [10, 15, 8]],
        expected: 'Falcões     10\nÁguias      15\nLobos       8\nVencedor: Águias',
        description: 'Águias vence',
        mode: 'stdout',
      },
      {
        input: [['A', 'BB', 'CCC'], [5, 5, 9]],
        expected: 'A           5\nBB          5\nCCC         9\nVencedor: CCC',
        description: 'CCC vence',
        mode: 'stdout',
      },
    ],
  },
]

async function seedTrilha() {
  console.log('🌱  Semeando/atualizando trilha:', TRAIL_TITLE)

  let [trail] = await db
    .select({ id: trails.id })
    .from(trails)
    .where(eq(trails.slug, TRAIL_SLUG))
    .limit(1)

  if (!trail) {
    ;[trail] = await db
      .insert(trails)
      .values({ slug: TRAIL_SLUG, title: TRAIL_TITLE, description: TRAIL_DESC, language: 'javascript', order: 20 })
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

    const [ch] = await db
      .select({ id: challenges.id })
      .from(challenges)
      .where(eq(challenges.moduleId, mod!.id))
      .limit(1)

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
