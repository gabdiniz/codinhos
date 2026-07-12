/**
 * Seed da trilha "Python: Alta Ordem e Estilo Funcional" no CATÁLOGO GLOBAL
 * (tenant_id = NULL). Trilha 7/10 — pré-requisito de conteúdo: trilhas 1-5
 * (trilha 6 não é pré-requisito, só está antes na ordem por ser "aplicação").
 * Ver docs/trilha-python-07-alta-ordem-e-funcional.md.
 *
 * Execução: pnpm --filter @codinhos/api db:seed:python-07
 *
 * Idempotente e atualizável, mesmo padrão do seed-trilha-js.ts.
 *
 * Duas notas técnicas achadas ao verificar (rodando Python de verdade):
 * 1. Módulo 7.1 atribui uma `lambda` a uma variável (`dobro = lambda n: ...`)
 *    em vez de `def dobro(...)`. `extractDefName` (resolução automática de
 *    função-alvo) só reconhece `def` — por isso este e qualquer desafio de
 *    lambda nomeada precisa de `targetFn` explícito (o motor chama
 *    `globals().get(nome)`, que funciona igual para lambda atribuída a nome).
 * 2. `functools.reduce` (7.8/7.9) usa `import functools` — a allowlist de
 *    módulos (G6 do doc mestre) ainda não está implementada como bloqueio no
 *    runner atual (só está identificada como gap futuro, na trilha 10), então
 *    qualquer import da stdlib funciona hoje sem restrição.
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

const TRAIL_SLUG = 'python-alta-ordem-e-funcional'
const TRAIL_TITLE = 'Python: Alta Ordem e Estilo Funcional'
const TRAIL_DESC =
  'Função como valor: lambda, map, filter, sorted(key=), comprehension com condição, dict comprehension e functools.reduce. Pré-requisito: Estruturas de Dados.'

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
    title: 'Ponte: função dentro de função, função como valor',
    concept: 'Na trilha 3 (módulo 3.3) você já chamou uma função de dentro de outra. Agora vai além: uma função pode ser passada como VALOR — argumento de outra função, igual um número ou uma string.',
    exampleCode: 'def dobro(n):\n    return n * 2\n\ndef aplicar(fn, valor):\n    return fn(valor)\n\nprint(aplicar(dobro, 5))  # 10',
    vocabulary: ['função como valor'],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'lesson',
    title: '`lambda`: função de uma linha, sem nome',
    concept: '`lambda x: x * 2` é uma função anônima de UMA expressão só (sem `return` explícito — o valor da expressão já é o retorno). Pode ser guardada numa variável: `dobro = lambda x: x * 2` funciona igual a um `def dobro(x): return x * 2`.',
    exampleCode: 'quadrado = lambda x: x * x\nprint(quadrado(4))  # 16',
    vocabulary: ['lambda'],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: '7.1 Reescreva como lambda',
    concept: 'Troque `def dobro(n): return n * 2` por `dobro = lambda n: n * 2`.',
    exampleCode: 'triplo = lambda n: n * 3',
    vocabulary: ['lambda'],
    difficulty: 'easy',
    baseXp: 10,
    description: 'Crie `dobro` como uma `lambda` que recebe `n` e retorna `n * 2` (sem usar `def`).',
    starterCode: 'dobro = None  # substitua: dobro = lambda n: ...\n',
    targetFn: 'dobro',
    testCases: [
      { input: [5], expected: 10, description: 'n=5' },
      { input: [0], expected: 0, description: 'n=0' },
      { input: [-3], expected: -6, description: 'n=-3' },
    ],
  },
  {
    kind: 'lesson',
    title: '`map()`: aplicar função a cada item',
    concept: '`map(funcao, lista)` aplica `funcao` a CADA item da lista. O resultado não é uma lista pronta — é um "iterador"; envolva com `list(...)` para virar lista de verdade: `list(map(lambda x: x*2, lista))`. É outro jeito de escrever o que uma list comprehension já faz.',
    exampleCode: 'numeros = [1, 2, 3]\ndobrados = list(map(lambda x: x * 2, numeros))\nprint(dobrados)  # [2, 4, 6]',
    vocabulary: ['map()'],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: '7.2 Dobrar valores com `map`',
    concept: 'Mesmo resultado do módulo 5.10 (list comprehension), agora com `map` + `lambda`.',
    exampleCode: 'def somar_um_com_map(lista):\n    return list(map(lambda x: x + 1, lista))',
    vocabulary: ['map()', 'lambda'],
    difficulty: 'medium',
    baseXp: 15,
    description: 'Escreva `dobrar_com_map(lista)`: retorna a lista com cada valor dobrado, usando `map` + `lambda`.',
    starterCode: 'def dobrar_com_map(lista):\n    pass\n',
    targetFn: 'dobrar_com_map',
    testCases: [
      { input: [[1, 2, 3]], expected: [2, 4, 6], description: '[1,2,3]' },
      { input: [[]], expected: [], description: 'lista vazia' },
      { input: [[5, 10]], expected: [10, 20], description: '[5,10]' },
    ],
  },
  {
    kind: 'lesson',
    title: '`filter()`: manter só o que passa no teste',
    concept: '`filter(funcao, lista)` mantém só os itens onde `funcao(item)` retorna `True`. Igual `map`, precisa de `list(...)` para virar lista.',
    exampleCode: 'numeros = [1, 2, 3, 4, 5, 6]\npares = list(filter(lambda x: x % 2 == 0, numeros))\nprint(pares)  # [2, 4, 6]',
    vocabulary: ['filter()'],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: '7.3 Filtrar só os pares',
    concept: 'Use `filter` + `lambda x: x % 2 == 0`.',
    exampleCode: 'def filtrar_positivos(lista):\n    return list(filter(lambda x: x > 0, lista))',
    vocabulary: ['filter()', 'lambda'],
    difficulty: 'medium',
    baseXp: 15,
    description: 'Escreva `filtrar_pares(lista)`: retorna só os números pares da lista, usando `filter` + `lambda`.',
    starterCode: 'def filtrar_pares(lista):\n    pass\n',
    targetFn: 'filtrar_pares',
    testCases: [
      { input: [[1, 2, 3, 4, 5, 6]], expected: [2, 4, 6], description: 'mistura de pares e ímpares' },
      { input: [[1, 3, 5]], expected: [], description: 'só ímpares' },
    ],
  },
  {
    kind: 'lesson',
    title: '`sorted(key=...)`: ordenar por um critério',
    concept: '`sorted(lista, key=lambda x: x[1])` ordena pelo que a `lambda` retorna para cada item (não pelo item inteiro). `reverse=True` inverte para decrescente.',
    exampleCode: 'pessoas = [("Ana", 30), ("Bruno", 12)]\npor_idade = sorted(pessoas, key=lambda p: p[1])\nprint(por_idade)  # [(\'Bruno\', 12), (\'Ana\', 30)]',
    vocabulary: ['sorted(key=)', 'reverse='],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: '7.4 Ordenar por idade (lista de tuplas)',
    concept: 'Cada item é `(nome, idade)` — a chave de ordenação é `p[1]` (a idade).',
    exampleCode: 'def ordenar_por_preco(produtos):\n    return sorted(produtos, key=lambda p: p[1])',
    vocabulary: ['sorted(key=)'],
    difficulty: 'medium',
    baseXp: 20,
    description: 'Escreva `ordenar_por_idade(pessoas)`: `pessoas` é uma lista de `(nome, idade)`. Retorne ordenada por idade, crescente.',
    starterCode: 'def ordenar_por_idade(pessoas):\n    pass\n',
    targetFn: 'ordenar_por_idade',
    testCases: [
      {
        input: [
          [
            ['Ana', 30],
            ['Bruno', 12],
            ['Carla', 20],
          ],
        ],
        expected: [
          ['Bruno', 12],
          ['Carla', 20],
          ['Ana', 30],
        ],
        description: '3 pessoas',
      },
    ],
  },
  {
    kind: 'challenge',
    title: '7.5 Top 3 maiores valores',
    concept: '`sorted(lista, reverse=True)` ordena do MAIOR pro menor; `[:3]` pega os 3 primeiros.',
    exampleCode: 'def dois_menores(lista):\n    return sorted(lista)[:2]',
    vocabulary: ['sorted(reverse=)', 'slicing'],
    difficulty: 'medium',
    baseXp: 20,
    description: 'Escreva `top_3(lista)`: retorna os 3 maiores valores da lista, do maior para o menor.',
    starterCode: 'def top_3(lista):\n    pass\n',
    targetFn: 'top_3',
    testCases: [
      { input: [[5, 1, 9, 3, 7, 2]], expected: [9, 7, 5], description: '6 valores' },
      { input: [[1, 2]], expected: [2, 1], description: 'menos de 3 valores' },
    ],
  },
  {
    kind: 'lesson',
    title: 'Comprehension com condição',
    concept: '`[x for x in lista if x % 2 == 0]` é o mesmo `filter` do módulo 7, só que no ESTILO comprehension — muitos(as) programadores(as) Python preferem esse jeito.',
    exampleCode: 'numeros = [1, 2, 3, 4, 5, 6]\npares = [x for x in numeros if x % 2 == 0]\nprint(pares)  # [2, 4, 6]',
    vocabulary: ['comprehension com if'],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: '7.6 Filtrar (agora com comprehension)',
    concept: 'Mesmo problema do módulo 7.3, reescrito como `[x for x in lista if ...]`.',
    exampleCode: 'def positivos_comprehension(lista):\n    return [x for x in lista if x > 0]',
    vocabulary: ['comprehension com if'],
    difficulty: 'medium',
    baseXp: 15,
    description: 'Escreva `filtrar_pares_comprehension(lista)`: retorna só os números pares, usando list comprehension com `if` (sem `filter`).',
    starterCode: 'def filtrar_pares_comprehension(lista):\n    pass\n',
    targetFn: 'filtrar_pares_comprehension',
    testCases: [
      { input: [[1, 2, 3, 4, 5, 6]], expected: [2, 4, 6], description: 'mistura de pares e ímpares' },
      { input: [[1, 3, 5]], expected: [], description: 'só ímpares' },
    ],
  },
  {
    kind: 'lesson',
    title: 'Dict comprehension',
    concept: 'Igual list comprehension, mas monta um DICIONÁRIO: `{chave: valor for chave, valor in dic.items()}`. Pode transformar os valores no meio do caminho.',
    exampleCode: 'precos = {"maçã": 2, "pão": 5}\ncom_desconto = {k: v * 0.9 for k, v in precos.items()}\nprint(com_desconto)',
    vocabulary: ['dict comprehension'],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: '7.7 Dobrar todos os valores de um dicionário',
    concept: 'Use `{k: v * 2 for k, v in dic.items()}`.',
    exampleCode: 'def somar_um_a_valores(dic):\n    return {k: v + 1 for k, v in dic.items()}',
    vocabulary: ['dict comprehension'],
    difficulty: 'medium',
    baseXp: 20,
    description: 'Escreva `dobrar_valores_dict(dic)`: retorna um dicionário novo com os mesmos chaves, mas cada valor dobrado.',
    starterCode: 'def dobrar_valores_dict(dic):\n    pass\n',
    targetFn: 'dobrar_valores_dict',
    testCases: [{ input: { a: 1, b: 2 }, expected: { a: 2, b: 4 }, description: 'a:1, b:2' }],
  },
  {
    kind: 'lesson',
    title: '`functools.reduce`: combinar tudo numa coisa só',
    concept:
      '`reduce(funcao, lista, inicial)` combina os itens da lista dois a dois, acumulando um resultado — igual o acumulador manual que você já escreveu com `for` (módulo 4.5), só que numa chamada só. Precisa de `import functools` primeiro.',
    exampleCode: 'import functools\nnumeros = [1, 2, 3, 4]\ntotal = functools.reduce(lambda acc, x: acc + x, numeros, 0)\nprint(total)  # 10',
    vocabulary: ['functools.reduce', 'import'],
    difficulty: 'medium',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: '7.8 Soma com `reduce`',
    concept: 'Igual ao módulo 4.5 (acumulador com `for`), mas com `functools.reduce` — use `0` como valor inicial (funciona até com lista vazia).',
    exampleCode: 'import functools\ndef produto_com_reduce(lista):\n    return functools.reduce(lambda acc, x: acc * x, lista, 1)',
    vocabulary: ['functools.reduce'],
    difficulty: 'medium',
    baseXp: 20,
    description: 'Escreva `soma_com_reduce(lista)`: soma todos os valores usando `functools.reduce` (valor inicial `0`).',
    starterCode: 'import functools\n\ndef soma_com_reduce(lista):\n    pass\n',
    targetFn: 'soma_com_reduce',
    testCases: [
      { input: [[1, 2, 3]], expected: 6, description: '[1,2,3]' },
      { input: [[]], expected: 0, description: 'lista vazia' },
      { input: [[10, 20, 30, 40]], expected: 100, description: '[10,20,30,40]' },
    ],
  },
  {
    kind: 'challenge',
    title: '7.9 Maior valor com `reduce` (sem `max()`)',
    concept: 'A cada passo, compare o acumulador com o item atual e fique com o maior: `lambda acc, x: x if x > acc else acc`.',
    exampleCode: 'import functools\ndef menor_com_reduce(lista):\n    return functools.reduce(lambda acc, x: x if x < acc else acc, lista)',
    vocabulary: ['functools.reduce'],
    difficulty: 'medium',
    baseXp: 20,
    description: 'Escreva `maior_com_reduce(lista)`: retorna o maior valor da lista (não vazia), usando `functools.reduce` (sem usar `max()`).',
    starterCode: 'import functools\n\ndef maior_com_reduce(lista):\n    pass\n',
    targetFn: 'maior_com_reduce',
    testCases: [
      { input: [[3, 7, 2, 9, 4]], expected: 9, description: '5 valores' },
      { input: [[5]], expected: 5, description: '1 valor' },
    ],
  },
  {
    kind: 'lesson',
    title: 'Qual estilo usar?',
    concept: 'Na comunidade Python, list/dict comprehension costuma ser preferida no dia a dia (mais legível pra maioria dos casos). `map`/`filter`/`reduce` existem, valem a pena entender (aparecem em código de outras pessoas), mas não são "mais certas" — é escolha de estilo, não regra técnica.',
    exampleCode: '# as duas formas abaixo fazem a mesma coisa:\n[x * 2 for x in lista]\nlist(map(lambda x: x * 2, lista))',
    vocabulary: ['estilo de código'],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: '7.10 [Fecha a trilha] Boletim da turma',
    concept: 'Combine tudo: calcule a média de cada aluno, filtre quem tem média >= 7, e ordene os aprovados da maior média para a menor.',
    exampleCode: 'def media_geral(alunos):\n    total = sum(sum(a["notas"]) / len(a["notas"]) for a in alunos)\n    return total / len(alunos)',
    vocabulary: ['comprehension', 'filter/if', 'sorted(key=)'],
    difficulty: 'hard',
    baseXp: 35,
    description:
      'Escreva `boletim(alunos)`: `alunos` é uma lista de `{"nome": ..., "notas": [...]}`. Calcule a média de cada um, filtre só os aprovados (média >= 7) e retorne uma lista de `{"nome": ..., "media": ...}` ordenada da maior média para a menor.',
    starterCode: 'def boletim(alunos):\n    pass\n',
    targetFn: 'boletim',
    testCases: [
      {
        input: [
          [
            { nome: 'Ana', notas: [8, 9, 7] },
            { nome: 'Bruno', notas: [5, 6, 4] },
            { nome: 'Carla', notas: [10, 9, 8] },
          ],
        ],
        expected: [
          { nome: 'Carla', media: 9 },
          { nome: 'Ana', media: 8 },
        ],
        description: 'Ana e Carla aprovados, Bruno reprovado',
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
      .values({ slug: TRAIL_SLUG, title: TRAIL_TITLE, description: TRAIL_DESC, language: 'python', order: 160 })
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
