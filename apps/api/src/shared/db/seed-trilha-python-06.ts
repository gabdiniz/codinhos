/**
 * Seed da trilha "Python: Saída e Formatação" no CATÁLOGO GLOBAL (tenant_id =
 * NULL). Trilha 6/10 — pré-requisito: trilhas 1-5. Ver
 * docs/trilha-python-06-saida-e-formatacao.md (desenho módulo a módulo).
 * Trilha "de aplicação" (não introduz pré-requisito de conteúdo para as
 * trilhas seguintes, mas print formatado é usado dentro da trilha 9/POO).
 *
 * Execução: pnpm --filter @codinhos/api db:seed:python-06
 *
 * Idempotente e atualizável, mesmo padrão do seed-trilha-js.ts. Strings de
 * saída (inclusive espaços de alinhamento) copiadas exatamente do output real
 * do Python (verificado rodando, não só lido) — alinhamento (`:>n`/`:<n`) é
 * fácil de errar de cabeça.
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

const TRAIL_SLUG = 'python-saida-e-formatacao'
const TRAIL_TITLE = 'Python: Saída e Formatação'
const TRAIL_DESC =
  'Formatar saída de forma profissional: sep no print, casas decimais (:.2f), alinhamento de colunas (:<, :>, :^), tabelas e relatórios. Pré-requisito: Estruturas de Dados.'

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
    title: 'Ponte: você já sabe imprimir, agora vamos caprichar',
    concept: 'Você já usa f-string (1.8) e `print(..., end="")` (2.9). Agora vamos além: controlar separador, casas decimais e alinhamento — a diferença entre "funciona" e "parece profissional".',
    exampleCode: 'print("a", "b", end="!\\n")',
    vocabulary: ['formatação'],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: '6.1 `sep` no `print`',
    concept: '`print(a, b, sep=", ")` troca o separador padrão (espaço) por outro texto.',
    exampleCode: 'print(1, 2, 3, sep="-")  # 1-2-3',
    vocabulary: ['sep='],
    difficulty: 'easy',
    baseXp: 10,
    description: 'Escreva `imprimir_dupla(a, b)` que imprime `a` e `b` separados por `", "` (vírgula e espaço), usando `sep=`.',
    starterCode: 'def imprimir_dupla(a, b):\n    pass\n',
    targetFn: 'imprimir_dupla',
    testCases: [
      { input: [1, 2], expected: '1, 2', description: '1, 2', mode: 'stdout' },
      { input: ['a', 'b'], expected: 'a, b', description: '"a", "b"', mode: 'stdout' },
    ],
  },
  {
    kind: 'lesson',
    title: 'Casas decimais com format spec',
    concept: 'Dentro de uma f-string, `{valor:.2f}` formata um número com EXATAMENTE 2 casas decimais (arredondando se precisar).',
    exampleCode: 'preco = 9.5\nprint(f"{preco:.2f}")  # 9.50',
    vocabulary: [':.2f'],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: '6.2 Preço com duas casas',
    concept: 'Use `:.2f` dentro da f-string.',
    exampleCode: 'def formatar_percentual(valor):\n    print(f"{valor:.1f}%")',
    vocabulary: [':.2f'],
    difficulty: 'easy',
    baseXp: 10,
    description: 'Escreva `formatar_preco(valor)` que imprime `R$ <valor com 2 casas decimais>`.',
    starterCode: 'def formatar_preco(valor):\n    pass\n',
    targetFn: 'formatar_preco',
    testCases: [
      { input: [9.5], expected: 'R$ 9.50', description: '9.5', mode: 'stdout' },
      { input: [10], expected: 'R$ 10.00', description: '10 (inteiro vira .00)', mode: 'stdout' },
      { input: [3.14159], expected: 'R$ 3.14', description: '3.14159 (arredonda)', mode: 'stdout' },
    ],
  },
  {
    kind: 'lesson',
    title: 'Alinhamento: `:<`, `:>`, `:^`',
    concept: 'Dentro do format spec, `:>5` alinha à DIREITA numa largura de 5 caracteres (completando com espaços à esquerda). `:<10` alinha à ESQUERDA numa largura de 10. `:^n` centraliza. Equivalente Python ao `padStart`/`padEnd` do JS.',
    exampleCode: 'print(f"{5:>3}")   # "  5" (largura 3, direita)\nprint(f"{"oi":<5}") # "oi   " (largura 5, esquerda)',
    vocabulary: [':<n', ':>n', ':^n'],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: '6.3 Coluna de números alinhada à direita',
    concept: 'Use `:>5` para alinhar cada número numa coluna de largura 5.',
    exampleCode: 'def coluna_esquerda(numeros):\n    for n in numeros:\n        print(f"{n:<5}")',
    vocabulary: [':>n'],
    difficulty: 'medium',
    baseXp: 15,
    description: 'Escreva `coluna_direita(numeros)`: imprime cada número da lista, um por linha, alinhado à direita numa largura de 5 caracteres.',
    starterCode: 'def coluna_direita(numeros):\n    pass\n',
    targetFn: 'coluna_direita',
    testCases: [{ input: [[1, 22, 333]], expected: '    1\n   22\n  333', description: '[1, 22, 333]', mode: 'stdout' }],
  },
  {
    kind: 'challenge',
    title: '6.4 Tabela de nomes e idades',
    concept: 'Percorra uma lista de tuplas `(nome, idade)`, desempacotando com `for nome, idade in pessoas:`. Alinhe o nome à esquerda com `:<10`.',
    exampleCode: 'def imprimir_notas(notas):\n    for nome, nota in notas:\n        print(f"{nome:<8}{nota}")',
    vocabulary: [':<n', 'for + desempacotamento'],
    difficulty: 'medium',
    baseXp: 20,
    description: 'Escreva `tabela(pessoas)`: `pessoas` é uma lista de `(nome, idade)`. Imprima cada linha como `<nome alinhado em 10 colunas><idade>`.',
    starterCode: 'def tabela(pessoas):\n    pass\n',
    targetFn: 'tabela',
    testCases: [
      {
        input: [
          [
            ['Ana', 12],
            ['Bruno', 7],
          ],
        ],
        expected: 'Ana       12\nBruno     7',
        description: 'Ana e Bruno',
        mode: 'stdout',
      },
    ],
  },
  {
    kind: 'lesson',
    title: 'Repetição de caractere e laços aninhados aplicados a desenho',
    concept: '`"-" * n` repete um caractere `n` vezes, sem precisar de `for`. Combine com o padrão de laço aninhado (2.9) para desenhar formas mais elaboradas.',
    exampleCode: 'print("-" * 10)  # ----------',
    vocabulary: ['"texto" * n'],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: '6.5 Linha decorativa',
    concept: 'Use `"=" * n`.',
    exampleCode: 'def linha_de_pontos(n):\n    print("." * n)',
    vocabulary: ['"texto" * n'],
    difficulty: 'easy',
    baseXp: 10,
    description: 'Escreva `linha(n)` que imprime uma linha com `n` sinais de igual (`=`).',
    starterCode: 'def linha(n):\n    pass\n',
    targetFn: 'linha',
    testCases: [
      { input: [5], expected: '=====', description: 'n=5', mode: 'stdout' },
      { input: [1], expected: '=', description: 'n=1', mode: 'stdout' },
    ],
  },
  {
    kind: 'challenge',
    title: '6.6 Triângulo crescente',
    concept: 'Na linha `i`, imprima `i` asteriscos: `"*" * i`.',
    exampleCode: 'def escada_de_tracos(n):\n    for i in range(1, n + 1):\n        print("-" * i)',
    vocabulary: ['for aninhado', '"texto" * n'],
    difficulty: 'medium',
    baseXp: 15,
    description: 'Escreva `triangulo(n)`: imprime um triângulo — linha 1 tem 1 asterisco, linha 2 tem 2, ..., linha n tem n.',
    starterCode: 'def triangulo(n):\n    pass\n',
    targetFn: 'triangulo',
    testCases: [
      { input: [4], expected: '*\n**\n***\n****', description: 'n=4', mode: 'stdout' },
      { input: [1], expected: '*', description: 'n=1', mode: 'stdout' },
    ],
  },
  {
    kind: 'challenge',
    title: '6.7 Pirâmide numérica',
    concept: 'Reaproveite o padrão do triângulo, mas em vez de `*` monte os números de 1 até `i` separados por espaço (`" ".join(...)`, ou concatene com `for`).',
    exampleCode: 'texto = " ".join(str(x) for x in range(1, 4))\nprint(texto)  # "1 2 3"',
    vocabulary: ['.join()'],
    difficulty: 'medium',
    baseXp: 20,
    description: 'Escreva `piramide_numerica(n)`: para cada linha `i` de 1 até `n`, imprime os números de 1 até `i` separados por espaço.',
    starterCode: 'def piramide_numerica(n):\n    pass\n',
    targetFn: 'piramide_numerica',
    testCases: [{ input: [3], expected: '1\n1 2\n1 2 3', description: 'n=3', mode: 'stdout' }],
  },
  {
    kind: 'lesson',
    title: 'Quando a saída pode variar (matcher `contains`)',
    concept: 'Nem todo exercício tem UMA resposta certa — às vezes o que importa é que o resultado CONTENHA uma informação certa (como um número calculado), não o texto inteiro palavra por palavra. Esses desafios usam um jeito de comparar mais flexível: "contém" em vez de "é exatamente igual".',
    exampleCode: '# um relatório livre pode ter o texto que você quiser,\n# desde que o número certo apareça em algum lugar',
    vocabulary: ['matcher contains'],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: '6.8 Relatório de vendas (livre)',
    concept: 'Calcule o total somando os valores do dicionário (`sum(dic.values())`) e imprima um relatório do seu jeito — o importante é o número do total aparecer.',
    exampleCode: 'def media_das_notas(notas):\n    media = sum(notas.values()) / len(notas)\n    print(f"A média é {media}")',
    vocabulary: ['sum()', '.values()'],
    difficulty: 'medium',
    baseXp: 20,
    description: 'Escreva `relatorio_vendas(vendas)`: `vendas` é um dicionário `{dia: valor}`. Imprima um relatório (do seu jeito) que inclua o TOTAL de vendas somado.',
    starterCode: 'def relatorio_vendas(vendas):\n    pass\n',
    targetFn: 'relatorio_vendas',
    testCases: [{ input: [{ segunda: 50, terca: 100 }], expected: '150', description: 'total deve aparecer no relatório', mode: 'stdout', matcher: 'contains' }],
  },
  {
    kind: 'challenge',
    title: '6.9 [Fecha a trilha] Recibo formatado',
    concept: 'Combine tudo: `:<10` para o nome, `:>6.2f` para o preço (alinhado à direita, 2 casas), `for` sobre lista de tuplas, e uma linha de total no final.',
    exampleCode: 'def resumo_carrinho(itens):\n    for nome, qtd in itens:\n        print(f"{nome:<10}{qtd:>4}")',
    vocabulary: [':<n', ':>n.2f', 'for + desempacotamento'],
    difficulty: 'hard',
    baseXp: 30,
    description:
      'Escreva `recibo(itens)`: `itens` é uma lista de `(nome, preco)`. Para cada item, imprima `<nome em 10 colunas à esquerda><preço em 6 colunas à direita com 2 casas>`. No final, imprima uma linha `Total` (mesmo alinhamento) com a soma de todos os preços.',
    starterCode: 'def recibo(itens):\n    pass\n',
    targetFn: 'recibo',
    testCases: [
      {
        input: [
          [
            ['Caneta', 2.5],
            ['Caderno', 15.9],
          ],
        ],
        expected: 'Caneta      2.50\nCaderno    15.90\nTotal      18.40',
        description: 'dois itens + total',
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
      .values({ slug: TRAIL_SLUG, title: TRAIL_TITLE, description: TRAIL_DESC, language: 'python', order: 150 })
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
