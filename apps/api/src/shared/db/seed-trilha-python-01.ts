/**
 * Seed da trilha "Python: Primeiros Passos" no CATÁLOGO GLOBAL (tenant_id = NULL).
 * Trilha 1/10 da sequência Python (P2) — ver docs/pesquisa-trilhas-python.md
 * (mapa geral) e docs/trilha-python-01-primeiros-passos.md (desenho módulo a
 * módulo desta trilha). `language: 'python'` — primeira trilha do catálogo
 * nessa língua, roda no runner novo (packages/runner-python, ver
 * docs/motor-python-capacidades.md).
 *
 * Execução: pnpm --filter @codinhos/api db:seed:python-01
 *
 * Idempotente e atualizável, mesmo padrão do seed-trilha-js.ts. Só usa os 3
 * modos já suportados pelo runner Python (function-call, type-check, stdout)
 * — nenhum `mode:'ast'` (G5, ainda não implementado para Python).
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

const TRAIL_SLUG = 'python-primeiros-passos'
const TRAIL_TITLE = 'Python: Primeiros Passos'
const TRAIL_DESC =
  'Primeira trilha de Python: variáveis, tipos (str/int/float/bool), operadores aritméticos e de comparação, e print/f-string. Sem pré-requisito — pode ser seu primeiro contato com programação.'

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
    title: 'Python é diferente: sem chaves, com indentação',
    concept:
      'Bem-vindo(a) ao Python! Se você já viu JavaScript no Codinhos, repare nas diferenças logo de cara: Python **não usa `{ }`** para marcar blocos de código — usa **indentação** (espaços no início da linha). Também não tem `;` no fim da linha, e não existe `let`/`const` — toda atribuição é só `nome = valor`.\n\n`#` inicia um comentário (equivalente ao `//` do JS). `print()` mostra algo na tela — é o `console.log` do Python.',
    exampleCode: '# isto é um comentário\nprint("Olá, Python!")',
    vocabulary: ['#', 'print()', 'indentação'],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: '1.1 Sua primeira mensagem',
    concept: 'Use `print("texto")` para mostrar um texto na tela, entre aspas.',
    exampleCode: 'print("Bem-vindo!")',
    vocabulary: ['print()'],
    difficulty: 'easy',
    baseXp: 10,
    description: 'Escreva um programa que imprime exatamente: Olá, Codinhos!',
    starterCode: '# escreva seu código aqui\n',
    testCases: [{ input: null, expected: 'Olá, Codinhos!', description: 'imprime a mensagem', mode: 'stdout' }],
  },
  {
    kind: 'lesson',
    title: 'Variáveis: caixinhas com nome',
    concept:
      'Uma variável guarda um valor com um nome, para usar depois: `nome = valor`. Não existe `let`/`const` em Python — é sempre assim. Convenção de nomes em Python: `snake_case` (palavras separadas por `_`, tudo minúsculo), diferente do `camelCase` do JS.',
    exampleCode: 'idade_do_gato = 3\nprint(idade_do_gato)',
    vocabulary: ['variável', '=', 'snake_case'],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: '1.2 Guarde seu nome',
    concept: 'Crie uma variável e guarde um texto nela, entre aspas (aspas simples ou duplas, tanto faz).',
    exampleCode: 'cor_favorita = "azul"',
    vocabulary: ['variável', 'str'],
    difficulty: 'easy',
    baseXp: 10,
    description: 'Crie uma variável chamada `nome` e guarde um texto (o seu nome, ou qualquer nome) nela, entre aspas.',
    starterCode: 'nome = ""\n',
    testCases: [{ input: null, expected: 'str', description: 'nome (deve ser um texto, tipo str)' }],
  },
  {
    kind: 'challenge',
    title: '1.3 Combine texto',
    concept: 'Em Python, `+` também junta textos (concatenação), igual no JS: `print("Oi, " + nome)`.',
    exampleCode: 'saudacao = "Bem-vindo(a), " + "Ana" + "!"\nprint(saudacao)',
    vocabulary: ['+', 'concatenação'],
    difficulty: 'easy',
    baseXp: 10,
    description: 'Escreva a função `saudacao(nome)` que imprime, usando `+`, exatamente: Olá, <nome>!',
    starterCode: 'def saudacao(nome):\n    # use + para juntar texto e print para mostrar\n    pass\n',
    targetFn: 'saudacao',
    testCases: [
      { input: ['Ana'], expected: 'Olá, Ana!', description: 'nome Ana', mode: 'stdout' },
      { input: ['Rex'], expected: 'Olá, Rex!', description: 'nome Rex', mode: 'stdout' },
    ],
  },
  {
    kind: 'lesson',
    title: 'Números: int e float',
    concept:
      'Python tem dois tipos de número: `int` (inteiro, sem casas decimais: `5`, `-3`) e `float` (com casas decimais: `3.14`, `2.0`). Use `type(valor)` para descobrir o tipo de algo.',
    exampleCode: 'a = 5       # int\nb = 5.0     # float\nprint(type(a))\nprint(type(b))',
    vocabulary: ['int', 'float', 'type()'],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: '1.4 Sua idade',
    concept: 'Crie uma variável numérica SEM casas decimais — isso é um `int`.',
    exampleCode: 'ano_de_nascimento = 2012',
    vocabulary: ['int'],
    difficulty: 'easy',
    baseXp: 10,
    description: 'Crie uma variável chamada `idade` e guarde um número inteiro nela (sua idade, ou qualquer idade).',
    starterCode: 'idade = 0\n',
    testCases: [{ input: null, expected: 'int', description: 'idade (deve ser um número inteiro, tipo int)' }],
  },
  {
    kind: 'lesson',
    title: 'Operadores aritméticos',
    concept:
      '`+ - *` funcionam como no JS. As diferenças ficam nos operadores de divisão: `/` SEMPRE retorna `float` (mesmo 10 / 2 vira 5.0), `//` é a **divisão inteira** (arredonda para baixo, descarta o resto) e `%` é o **resto** da divisão. `**` é potência (`2 ** 3` = 8).',
    exampleCode: 'print(7 / 2)   # 3.5 (float)\nprint(7 // 2)  # 3   (divisão inteira)\nprint(7 % 2)   # 1   (resto)\nprint(2 ** 3)  # 8   (potência)',
    vocabulary: ['+', '-', '*', '/', '//', '%', '**'],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: '1.5 Dobro e metade',
    concept: 'Use `*` para dobrar e `/` para dividir ao meio.',
    exampleCode: 'def triplo(n):\n    return n * 3',
    vocabulary: ['*', '/'],
    difficulty: 'easy',
    baseXp: 10,
    description: 'Escreva `dobro_e_metade(n)` que retorna uma lista com `[dobro, metade]` de `n`. Ex.: `dobro_e_metade(10)` deve retornar `[20, 5.0]`.',
    starterCode: 'def dobro_e_metade(n):\n    # retorne [n * 2, n / 2]\n    pass\n',
    targetFn: 'dobro_e_metade',
    testCases: [
      { input: [10], expected: [20, 5], description: 'n=10' },
      { input: [7], expected: [14, 3.5], description: 'n=7' },
      { input: [4], expected: [8, 2], description: 'n=4' },
    ],
  },
  {
    kind: 'challenge',
    title: '1.6 Resto da divisão',
    concept: 'O operador `%` retorna o resto de uma divisão — útil, por exemplo, para descobrir se um número é par (resto 0 ao dividir por 2).',
    exampleCode: 'print(10 % 3)  # 1',
    vocabulary: ['%'],
    difficulty: 'easy',
    baseXp: 10,
    description: 'Escreva `resto(a, b)` que retorna o resto da divisão de `a` por `b`, usando `%`.',
    starterCode: 'def resto(a, b):\n    pass\n',
    targetFn: 'resto',
    testCases: [
      { input: [10, 3], expected: 1, description: '10 % 3' },
      { input: [9, 3], expected: 0, description: '9 % 3' },
      { input: [7, 2], expected: 1, description: '7 % 2' },
    ],
  },
  {
    kind: 'lesson',
    title: 'bool, comparação e f-string',
    concept:
      'Python tem `True`/`False` (com maiúscula — diferente do `true`/`false` do JS). Comparações (`== != > < >= <=`) funcionam igual ao JS e retornam um `bool`.\n\n**f-string** é a forma moderna de misturar texto com variáveis: `f"Olá, {nome}!"` — coloque um `f` antes das aspas e use `{variavel}` dentro do texto.',
    exampleCode: 'idade = 12\nprint(idade >= 10)          # True\nprint(f"Tenho {idade} anos")  # Tenho 12 anos',
    vocabulary: ['True', 'False', '==', '!=', '>', '<', '>=', '<=', 'f-string'],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: '1.7 Maior que',
    concept: 'Use `>` para comparar dois números — o resultado já é o `bool` que a função deve retornar.',
    exampleCode: 'def menor_que(a, b):\n    return a < b',
    vocabulary: ['>', 'bool'],
    difficulty: 'easy',
    baseXp: 10,
    description: 'Escreva `maior_que(a, b)` que retorna `True` se `a` é maior que `b`, senão `False`.',
    starterCode: 'def maior_que(a, b):\n    pass\n',
    targetFn: 'maior_que',
    testCases: [
      { input: [5, 3], expected: true, description: '5 > 3' },
      { input: [2, 8], expected: false, description: '2 > 8' },
      { input: [4, 4], expected: false, description: '4 > 4 (igual não é maior)' },
    ],
  },
  {
    kind: 'challenge',
    title: '1.8 Cartão de apresentação (f-string)',
    concept: 'Monte uma frase com f-string, misturando texto fixo e variáveis entre `{}`.',
    exampleCode: 'def linha(cidade):\n    print(f"Moro em {cidade}")',
    vocabulary: ['f-string'],
    difficulty: 'medium',
    baseXp: 15,
    description: 'Escreva `cartao(nome, idade)` que imprime EXATAMENTE: Nome: <nome>, idade: <idade>',
    starterCode: 'def cartao(nome, idade):\n    # use f-string e print\n    pass\n',
    targetFn: 'cartao',
    testCases: [
      { input: ['Ana', 12], expected: 'Nome: Ana, idade: 12', description: 'Ana, 12', mode: 'stdout' },
      { input: ['Rex', 7], expected: 'Nome: Rex, idade: 7', description: 'Rex, 7', mode: 'stdout' },
    ],
  },
  {
    kind: 'challenge',
    title: '1.9 [Fecha a trilha] Calculadora de retângulo',
    concept: 'Combine variável, aritmética e f-string: calcule a área e o perímetro de um retângulo e imprima os dois.',
    exampleCode: 'def dados_do_quadrado(lado):\n    area = lado * lado\n    print(f"Área do quadrado: {area}")',
    vocabulary: ['f-string', 'aritmética'],
    difficulty: 'medium',
    baseXp: 20,
    description:
      'Escreva `retangulo(largura, altura)` que imprime EXATAMENTE: Área: <area>, Perímetro: <perimetro> (área = largura × altura; perímetro = 2 × (largura + altura)).',
    starterCode: 'def retangulo(largura, altura):\n    # calcule area e perimetro, depois print com f-string\n    pass\n',
    targetFn: 'retangulo',
    testCases: [
      { input: [4, 3], expected: 'Área: 12, Perímetro: 14', description: '4 x 3', mode: 'stdout' },
      { input: [5, 5], expected: 'Área: 25, Perímetro: 20', description: '5 x 5', mode: 'stdout' },
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
      .values({ slug: TRAIL_SLUG, title: TRAIL_TITLE, description: TRAIL_DESC, language: 'python', order: 100 })
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
