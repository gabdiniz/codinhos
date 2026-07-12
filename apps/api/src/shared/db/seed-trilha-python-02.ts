/**
 * Seed da trilha "Python: Decisões e Repetições" no CATÁLOGO GLOBAL (tenant_id
 * = NULL). Trilha 2/10 — pré-requisito: python-primeiros-passos (trilha 1).
 * Ver docs/trilha-python-02-decisoes-e-repeticoes.md (desenho módulo a módulo).
 *
 * Execução: pnpm --filter @codinhos/api db:seed:python-02
 *
 * Idempotente e atualizável, mesmo padrão do seed-trilha-js.ts. Soluções de
 * referência verificadas rodando Python de verdade (não só lidas) antes de
 * escrever os testCases — saídas de `stdout` copiadas exatamente do output real.
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

const TRAIL_SLUG = 'python-decisoes-e-repeticoes'
const TRAIL_TITLE = 'Python: Decisões e Repetições'
const TRAIL_DESC =
  'Tomar decisões com if/elif/else e repetir ações com while e for/range, incluindo laços aninhados, break/continue e o clássico FizzBuzz. Pré-requisito: Python: Primeiros Passos.'

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
    title: 'Ponte: de calcular para decidir',
    concept:
      'Na trilha 1 você guardou valores e fez contas. Agora o código vai **decidir** sozinho o que fazer, dependendo de uma condição — igual você comparou números com `>` lá atrás (módulo 1.7). É a mesma comparação, só que agora ela controla o que o programa faz.',
    exampleCode: 'idade = 20\nprint(idade >= 18)',
    vocabulary: ['decisão'],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'lesson',
    title: '`if` / `else`',
    concept:
      'Um bloco `if` roda só quando a condição é `True`. `else` roda quando é `False`. Igual `for`/função, o bloco é marcado por **indentação**, depois de `:`.',
    exampleCode: 'idade = 15\nif idade >= 18:\n    print("pode dirigir")\nelse:\n    print("não pode dirigir")',
    vocabulary: ['if', 'else', ':'],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: '2.1 Maior de idade?',
    concept: 'Compare a idade com 18 usando `>=` dentro de um `if/else`.',
    exampleCode: 'def pode_votar(idade):\n    if idade >= 16:\n        return "pode votar"\n    else:\n        return "não pode votar"',
    vocabulary: ['if', 'else'],
    difficulty: 'easy',
    baseXp: 10,
    description: 'Escreva `maior_de_idade(idade)` que retorna `"maior de idade"` se `idade >= 18`, senão `"menor de idade"`.',
    starterCode: 'def maior_de_idade(idade):\n    pass\n',
    targetFn: 'maior_de_idade',
    testCases: [
      { input: [20], expected: 'maior de idade', description: 'idade=20' },
      { input: [15], expected: 'menor de idade', description: 'idade=15' },
      { input: [18], expected: 'maior de idade', description: 'idade=18 (limite inclui)' },
    ],
  },
  {
    kind: 'lesson',
    title: '`elif` e condições encadeadas',
    concept: '`elif` (contração de "else if") testa outra condição quando a de cima é falsa. Pode encadear vários — a primeira condição verdadeira "ganha", as de baixo nem são checadas.',
    exampleCode: 'nota = 75\nif nota >= 90:\n    print("A")\nelif nota >= 70:\n    print("B")\nelse:\n    print("C")',
    vocabulary: ['elif'],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: '2.2 Classificar nota (A/B/C/D)',
    concept: 'Encadeie `if/elif/elif/else` — sempre da maior faixa para a menor.',
    exampleCode: 'def conceito(pontos):\n    if pontos >= 100:\n        return "ótimo"\n    elif pontos >= 50:\n        return "bom"\n    else:\n        return "regular"',
    vocabulary: ['elif'],
    difficulty: 'medium',
    baseXp: 15,
    description: 'Escreva `classificar(nota)`: retorna `"A"` se nota >= 90, `"B"` se >= 70, `"C"` se >= 50, senão `"D"`.',
    starterCode: 'def classificar(nota):\n    pass\n',
    targetFn: 'classificar',
    testCases: [
      { input: [95], expected: 'A', description: 'nota=95' },
      { input: [75], expected: 'B', description: 'nota=75' },
      { input: [55], expected: 'C', description: 'nota=55' },
      { input: [30], expected: 'D', description: 'nota=30' },
      { input: [90], expected: 'A', description: 'nota=90 (limite)' },
    ],
  },
  {
    kind: 'lesson',
    title: 'Operadores lógicos: `and`, `or`, `not`',
    concept: 'Combine condições: `and` (as duas precisam ser verdade), `or` (basta uma), `not` (inverte). Em Python são palavras (`and`/`or`/`not`), não símbolos (`&&`/`||`/`!` como em JS).',
    exampleCode: 'idade = 20\ntem_carteira = True\nprint(idade >= 18 and tem_carteira)',
    vocabulary: ['and', 'or', 'not'],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: '2.3 Pode entrar no parque? (idade e altura)',
    concept: 'Combine `and`/`or`: acima de 1,4m entra sempre; entre 1,2m e 1,4m só entra se tiver pelo menos 10 anos.',
    exampleCode: 'def pode_jogar(idade, tem_bola):\n    return idade >= 5 and tem_bola',
    vocabulary: ['and', 'or'],
    difficulty: 'medium',
    baseXp: 15,
    description: 'Escreva `pode_entrar(altura, idade)`: retorna `True` se `altura >= 1.4`, OU se `altura >= 1.2 and idade >= 10`. Senão `False`.',
    starterCode: 'def pode_entrar(altura, idade):\n    pass\n',
    targetFn: 'pode_entrar',
    testCases: [
      { input: [1.5, 8], expected: true, description: 'alto o bastante, qualquer idade' },
      { input: [1.3, 12], expected: true, description: 'médio + idade suficiente' },
      { input: [1.3, 7], expected: false, description: 'médio + idade insuficiente' },
      { input: [1.0, 20], expected: false, description: 'baixo demais mesmo mais velho' },
    ],
  },
  {
    kind: 'lesson',
    title: 'Par ou ímpar com `%`',
    concept: 'Lembra do `%` (resto da divisão) da trilha 1? `n % 2 == 0` é par; `n % 2 != 0` (ou `== 1` para positivos) é ímpar.',
    exampleCode: 'n = 7\nprint(n % 2 == 0)  # False -> ímpar',
    vocabulary: ['%'],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: '2.4 Par ou ímpar',
    concept: 'Combine `%` com `if/else` para decidir entre duas strings.',
    exampleCode: 'def eh_multiplo_de_3(n):\n    if n % 3 == 0:\n        return True\n    return False',
    vocabulary: ['%', 'if'],
    difficulty: 'easy',
    baseXp: 10,
    description: 'Escreva `par_ou_impar(n)` que retorna `"par"` se `n` for par, senão `"ímpar"`.',
    starterCode: 'def par_ou_impar(n):\n    pass\n',
    targetFn: 'par_ou_impar',
    testCases: [
      { input: [4], expected: 'par', description: 'n=4' },
      { input: [7], expected: 'ímpar', description: 'n=7' },
      { input: [0], expected: 'par', description: 'n=0' },
    ],
  },
  {
    kind: 'lesson',
    title: '`while`: repetir enquanto for verdade',
    concept: '`while condição:` repete o bloco ENQUANTO a condição for `True`. Cuidado: se a condição nunca virar `False`, o laço nunca para (loop infinito) — sempre mude algo dentro do `while` que aproxime o fim.',
    exampleCode: 'n = 3\nwhile n > 0:\n    print(n)\n    n = n - 1',
    vocabulary: ['while'],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: '2.5 Contagem regressiva com while',
    concept: 'Repita `print` e diminua a variável em 1 a cada volta, até chegar em 0.',
    exampleCode: 'n = 3\nwhile n > 0:\n    print(n)\n    n -= 1',
    vocabulary: ['while', '-='],
    difficulty: 'medium',
    baseXp: 15,
    description: 'Escreva `contagem_regressiva(n)`: imprime de `n` até `1` (um por linha, decrescente) e por último imprime `Fim!`.',
    starterCode: 'def contagem_regressiva(n):\n    pass\n',
    targetFn: 'contagem_regressiva',
    testCases: [
      { input: [3], expected: '3\n2\n1\nFim!', description: 'n=3', mode: 'stdout' },
      { input: [1], expected: '1\nFim!', description: 'n=1', mode: 'stdout' },
    ],
  },
  {
    kind: 'lesson',
    title: '`for` e `range()`',
    concept: '`for variavel in range(n):` repete o bloco `n` vezes, com `variavel` valendo `0, 1, 2, ..., n-1`. `range(inicio, fim)` começa em `inicio` e vai até `fim - 1`. `range(inicio, fim, passo)` pula de `passo` em `passo`.',
    exampleCode: 'for i in range(3):\n    print(i)   # 0, 1, 2\nfor i in range(1, 4):\n    print(i)   # 1, 2, 3',
    vocabulary: ['for', 'in', 'range()'],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: '2.6 Conte de 1 a 10',
    concept: 'Use `for i in range(1, 11)` — lembre que `range` NÃO inclui o número final.',
    exampleCode: 'for i in range(1, 6):\n    print(i)  # 1, 2, 3, 4, 5',
    vocabulary: ['for', 'range()'],
    difficulty: 'easy',
    baseXp: 10,
    description: 'Escreva um programa que imprime os números de 1 a 10, um por linha, usando `for` e `range`.',
    starterCode: '# use for i in range(...)\n',
    testCases: [{ input: null, expected: '1\n2\n3\n4\n5\n6\n7\n8\n9\n10', description: 'conta de 1 a 10', mode: 'stdout' }],
  },
  {
    kind: 'challenge',
    title: '2.7 Tabuada do 5',
    concept: 'Combine `for`/`range` com a f-string da trilha 1 para montar cada linha da tabuada.',
    exampleCode: 'for i in range(1, 11):\n    print(f"3 x {i} = {3 * i}")',
    vocabulary: ['for', 'range()', 'f-string'],
    difficulty: 'medium',
    baseXp: 15,
    description: 'Escreva `tabuada(numero)`: imprime a tabuada de `numero` de 1 a 10, cada linha no formato `<numero> x <i> = <resultado>`.',
    starterCode: 'def tabuada(numero):\n    pass\n',
    targetFn: 'tabuada',
    testCases: [
      {
        input: [5],
        expected: '5 x 1 = 5\n5 x 2 = 10\n5 x 3 = 15\n5 x 4 = 20\n5 x 5 = 25\n5 x 6 = 30\n5 x 7 = 35\n5 x 8 = 40\n5 x 9 = 45\n5 x 10 = 50',
        description: 'tabuada do 5',
        mode: 'stdout',
      },
      { input: [2], expected: '2 x 1 = 2\n2 x 2 = 4\n2 x 3 = 6\n2 x 4 = 8\n2 x 5 = 10\n2 x 6 = 12\n2 x 7 = 14\n2 x 8 = 16\n2 x 9 = 18\n2 x 10 = 20', description: 'tabuada do 2', mode: 'stdout' },
    ],
  },
  {
    kind: 'lesson',
    title: '`break` e `continue`',
    concept: '`break` interrompe o laço IMEDIATAMENTE (sai de vez). `continue` pula só a volta atual e segue pra próxima.',
    exampleCode: 'for i in range(10):\n    if i == 3:\n        break\n    print(i)  # 0, 1, 2',
    vocabulary: ['break', 'continue'],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: '2.8 Pare no primeiro múltiplo de 7',
    concept: 'Percorra de 1 até `n`; quando achar um múltiplo de 7, imprima `Achei: <numero>` e pare com `break` (não continue depois).',
    exampleCode: 'for i in range(1, 20):\n    if i % 5 == 0:\n        print(f"Achei: {i}")\n        break\n    print(i)',
    vocabulary: ['break'],
    difficulty: 'medium',
    baseXp: 20,
    description: 'Escreva `buscar_multiplo_de_7(n)`: para `i` de 1 até `n`, imprime `i` normalmente; ao encontrar o primeiro múltiplo de 7, imprime `Achei: <i>` e para (break).',
    starterCode: 'def buscar_multiplo_de_7(n):\n    pass\n',
    targetFn: 'buscar_multiplo_de_7',
    testCases: [
      { input: [10], expected: '1\n2\n3\n4\n5\n6\nAchei: 7', description: 'encontra o 7 e para', mode: 'stdout' },
      { input: [6], expected: '1\n2\n3\n4\n5\n6', description: 'não encontra, imprime tudo', mode: 'stdout' },
    ],
  },
  {
    kind: 'lesson',
    title: 'Laços aninhados: `for` dentro de `for`',
    concept: 'Para desenhar em DUAS dimensões (linhas e colunas), coloque um `for` DENTRO de outro: o de fora controla a linha, o de dentro controla o que aparece em cada linha.',
    exampleCode: 'for linha in range(3):\n    for coluna in range(3):\n        print("#", end="")\n    print()',
    vocabulary: ['for aninhado'],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: '2.9 Quadrado de asteriscos',
    concept: 'Use `print("*", end="")` no laço de dentro (sem pular linha) e um `print()` vazio no fim de cada linha do laço de fora.',
    exampleCode: 'for l in range(2):\n    for c in range(4):\n        print("#", end="")\n    print()',
    vocabulary: ['for aninhado', 'end='],
    difficulty: 'medium',
    baseXp: 20,
    description: 'Escreva `quadrado(n)`: imprime um quadrado de asteriscos `n x n` (n linhas, cada uma com n asteriscos, sem espaço entre eles).',
    starterCode: 'def quadrado(n):\n    pass\n',
    targetFn: 'quadrado',
    testCases: [
      { input: [3], expected: '***\n***\n***', description: 'n=3', mode: 'stdout' },
      { input: [1], expected: '*', description: 'n=1', mode: 'stdout' },
      { input: [5], expected: '*****\n*****\n*****\n*****\n*****', description: 'n=5', mode: 'stdout' },
    ],
  },
  {
    kind: 'challenge',
    title: '2.10 [Fecha a trilha] FizzBuzz',
    concept: 'O clássico: combine `for`, `if/elif/else` e `%` — múltiplos de 3 E 5 (ou seja, de 15) vêm PRIMEIRO na checagem, senão o "Fizz" ou "Buzz" sozinho nunca dá vez ao "FizzBuzz".',
    exampleCode: 'for i in range(1, 6):\n    if i % 2 == 0:\n        print("par")\n    else:\n        print("ímpar")',
    vocabulary: ['for', 'elif', '%'],
    difficulty: 'hard',
    baseXp: 30,
    description:
      'Escreva `fizzbuzz(n)`: para cada número de 1 até `n`, imprime `"Fizz"` se for múltiplo de 3, `"Buzz"` se for múltiplo de 5, `"FizzBuzz"` se for múltiplo de 3 E 5, senão o próprio número.',
    starterCode: 'def fizzbuzz(n):\n    pass\n',
    targetFn: 'fizzbuzz',
    testCases: [
      {
        input: [15],
        expected: '1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz',
        description: 'n=15 (cobre Fizz, Buzz e FizzBuzz)',
        mode: 'stdout',
      },
      { input: [5], expected: '1\n2\nFizz\n4\nBuzz', description: 'n=5', mode: 'stdout' },
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
      .values({ slug: TRAIL_SLUG, title: TRAIL_TITLE, description: TRAIL_DESC, language: 'python', order: 110 })
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
