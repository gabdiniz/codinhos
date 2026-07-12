/**
 * Seed da trilha "Python: Recursão de Verdade" no CATÁLOGO GLOBAL (tenant_id
 * = NULL). Trilha 8/10 — pré-requisito de conteúdo: trilhas 1-5. Ver
 * docs/trilha-python-08-recursao-de-verdade.md.
 *
 * Execução: pnpm --filter @codinhos/api db:seed:python-08
 *
 * Idempotente e atualizável, mesmo padrão do seed-trilha-js.ts.
 *
 * IMPORTANTE (G5 do doc mestre, ainda não implementado): o desenho original
 * previa `requireRecursion`/`forbidLoops` (mode: 'ast') pra PROVAR que a
 * solução não usa `for`/`while` escondido — mas o runner Python ainda não
 * implementa verificação estrutural (só function-call/type-check/stdout, ver
 * packages/runner-python/src/run-python-tests.ts). Todos os 12 desafios com
 * regra estrutural aqui usam `function-call` puro por enquanto — funcionam e
 * ensinam recursão de verdade (todas as soluções de referência são recursivas
 * e foram verificadas rodando), só sem o reforço de "reprovar quem trapaceou
 * com loop". Ver nota na P3 do roadmap (docs/motor-python-capacidades.md).
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

const TRAIL_SLUG = 'python-recursao-de-verdade'
const TRAIL_TITLE = 'Python: Recursão de Verdade'
const TRAIL_DESC =
  'Uma função que chama a si mesma: caso base, caso recursivo, cabeça e cauda de lista, e problemas clássicos (fatorial, MDC, busca binária, Torres de Hanói). Pré-requisito: Estruturas de Dados.'

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
    title: 'Recursão: uma função que chama a si mesma',
    concept: 'Na trilha 3 (3.3) uma função já chamava OUTRA função. E se uma função chamasse ELA MESMA? Isso é recursão — resolve um problema quebrando ele num problema IGUAL, só que menor.',
    exampleCode: 'def contar_ate(n):\n    print(n)\n    if n > 0:\n        contar_ate(n - 1)  # chama a si mesma, com um valor menor',
    vocabulary: ['recursão'],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'lesson',
    title: 'Rastro de execução: veja `contagem(3)` passo a passo',
    concept:
      'Pense em bonecas russas: `contagem(3)` chama `contagem(2)`, que chama `contagem(1)`, que chama `contagem(0)` (o CASO BASE, que não chama mais ninguém). Depois, cada chamada "devolve" seu resultado pra quem chamou, de dentro pra fora — como abrir as bonecas de novo, da menor pra maior.',
    exampleCode: 'def soma_ate(n):\n    if n == 0:\n        return 0          # caso base\n    return n + soma_ate(n - 1)  # caso recursivo\n\n# soma_ate(3) = 3 + soma_ate(2)\n#             = 3 + (2 + soma_ate(1))\n#             = 3 + (2 + (1 + soma_ate(0)))\n#             = 3 + (2 + (1 + 0)) = 6',
    vocabulary: ['pilha de chamadas'],
    difficulty: 'medium',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: 'R.1 Contagem regressiva — com recursão de verdade',
    concept: 'Reescreva a contagem regressiva (2.5, que usava `while`) com recursão: caso base quando `n <= 0`, senão retorna `[n] + contagem_regressiva(n - 1)`.',
    exampleCode: 'def listar_ate(n):\n    if n == 0:\n        return []\n    return listar_ate(n - 1) + [n]',
    vocabulary: ['recursão', 'caso base'],
    difficulty: 'medium',
    baseXp: 20,
    description: 'Escreva `contagem_regressiva(n)` (recursiva, sem `while`/`for`): retorna a lista `[n, n-1, ..., 1]` (lista vazia se `n <= 0`).',
    starterCode: 'def contagem_regressiva(n):\n    pass\n',
    targetFn: 'contagem_regressiva',
    testCases: [
      { input: [3], expected: [3, 2, 1], description: 'n=3' },
      { input: [1], expected: [1], description: 'n=1' },
      { input: [0], expected: [], description: 'n=0' },
    ],
  },
  {
    kind: 'lesson',
    title: 'Caso base e caso recursivo',
    concept: 'Toda função recursiva PRECISA de um caso base (condição que PARA a recursão, sem chamar a função de novo). Sem isso, ela chama a si mesma pra sempre e Python desiste com `RecursionError: maximum recursion depth exceeded`.',
    exampleCode: '# PERIGO: sem caso base, nunca para!\ndef contar_para_sempre(n):\n    return contar_para_sempre(n + 1)  # RecursionError',
    vocabulary: ['caso base', 'caso recursivo', 'RecursionError'],
    difficulty: 'medium',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: 'R.2 Soma de 1 até N',
    concept: 'Caso base: `n <= 0` retorna 0. Caso recursivo: `n + soma_ate(n - 1)`.',
    exampleCode: 'def contar_numeros(n):\n    if n <= 0:\n        return 0\n    return 1 + contar_numeros(n - 1)',
    vocabulary: ['caso base', 'caso recursivo'],
    difficulty: 'medium',
    baseXp: 20,
    description: 'Escreva `soma_ate(n)` (recursiva): retorna a soma de 1 até `n`.',
    starterCode: 'def soma_ate(n):\n    pass\n',
    targetFn: 'soma_ate',
    testCases: [
      { input: [5], expected: 15, description: 'n=5' },
      { input: [1], expected: 1, description: 'n=1' },
      { input: [0], expected: 0, description: 'n=0' },
    ],
  },
  {
    kind: 'challenge',
    title: 'R.3 Fatorial',
    concept: 'Caso base: `n <= 1` retorna 1. Caso recursivo: `n * fatorial(n - 1)`.',
    exampleCode: 'def contagem_dupla(n):\n    if n == 0:\n        return 1\n    return 2 * contagem_dupla(n - 1)',
    vocabulary: ['recursão'],
    difficulty: 'medium',
    baseXp: 20,
    description: 'Escreva `fatorial(n)` (recursiva): retorna `n!` (n × (n-1) × ... × 1). `fatorial(0)` é 1.',
    starterCode: 'def fatorial(n):\n    pass\n',
    targetFn: 'fatorial',
    testCases: [
      { input: [5], expected: 120, description: 'n=5' },
      { input: [0], expected: 1, description: 'n=0' },
      { input: [1], expected: 1, description: 'n=1' },
    ],
  },
  {
    kind: 'challenge',
    title: 'R.4 Potência (base elevado a expoente)',
    concept: 'Caso base: `expoente == 0` retorna 1. Caso recursivo: `base * potencia(base, expoente - 1)`.',
    exampleCode: 'def multiplicar_n_vezes(valor, n):\n    if n == 0:\n        return 0\n    return valor + multiplicar_n_vezes(valor, n - 1)',
    vocabulary: ['recursão'],
    difficulty: 'medium',
    baseXp: 20,
    description: 'Escreva `potencia(base, expoente)` (recursiva, sem `**`): retorna `base` elevado a `expoente`.',
    starterCode: 'def potencia(base, expoente):\n    pass\n',
    targetFn: 'potencia',
    testCases: [
      { input: [2, 3], expected: 8, description: '2^3' },
      { input: [5, 0], expected: 1, description: '5^0' },
      { input: [3, 2], expected: 9, description: '3^2' },
    ],
  },
  {
    kind: 'challenge',
    title: 'R.5 Soma dos dígitos de um número',
    concept: 'Reaproveita `%` e `//` (2.9): o último dígito é `n % 10`, o resto do número é `n // 10`.',
    exampleCode: 'def contar_digitos(n):\n    if n < 10:\n        return 1\n    return 1 + contar_digitos(n // 10)',
    vocabulary: ['%', '//', 'recursão'],
    difficulty: 'hard',
    baseXp: 25,
    description: 'Escreva `soma_digitos(n)` (recursiva): retorna a soma dos dígitos de `n` (assuma `n >= 0`).',
    starterCode: 'def soma_digitos(n):\n    pass\n',
    targetFn: 'soma_digitos',
    testCases: [
      { input: [123], expected: 6, description: '1+2+3' },
      { input: [9], expected: 9, description: 'um dígito só' },
      { input: [4567], expected: 22, description: '4+5+6+7' },
    ],
  },
  {
    kind: 'challenge',
    title: 'R.6 Palíndromo — agora com recursão de verdade',
    concept: 'Reescreva o palíndromo (4.12, que usava `[::-1]`) com recursão: compare a primeira e a última letra, e chame de novo com o "miolo" (`palavra[1:-1]`).',
    exampleCode: 'def todas_vogais(palavra):\n    if len(palavra) == 0:\n        return True\n    if palavra[0] not in "aeiou":\n        return False\n    return todas_vogais(palavra[1:])',
    vocabulary: ['recursão em string'],
    difficulty: 'hard',
    baseXp: 25,
    description: 'Escreva `eh_palindromo_recursivo(palavra)` (recursiva, sem `[::-1]`): retorna `True` se a palavra é palíndromo.',
    starterCode: 'def eh_palindromo_recursivo(palavra):\n    pass\n',
    targetFn: 'eh_palindromo_recursivo',
    testCases: [
      { input: ['arara'], expected: true, description: '"arara"' },
      { input: ['python'], expected: false, description: '"python"' },
      { input: ['a'], expected: true, description: '1 letra' },
      { input: [''], expected: true, description: 'vazia' },
    ],
  },
  {
    kind: 'lesson',
    title: 'Recursão sobre listas: cabeça e cauda',
    concept: 'Uma lista pode ser vista como "cabeça" (`lista[0]`, o primeiro item) + "cauda" (`lista[1:]`, o resto). Resolver com a cabeça e chamar recursivamente na cauda é o padrão mais comum de recursão sobre listas.',
    exampleCode: 'def contar_itens(lista):\n    if len(lista) == 0:\n        return 0\n    cabeca = lista[0]\n    cauda = lista[1:]\n    return 1 + contar_itens(cauda)',
    vocabulary: ['cabeça', 'cauda'],
    difficulty: 'medium',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: 'R.7 Maior valor de uma lista (sem `max()`, sem loop)',
    concept: 'Caso base: lista com 1 item, retorna ele mesmo. Senão, compare `lista[0]` com o maior do resto (`lista[1:]`).',
    exampleCode: 'def soma_lista(lista):\n    if len(lista) == 0:\n        return 0\n    return lista[0] + soma_lista(lista[1:])',
    vocabulary: ['cabeça', 'cauda', 'recursão'],
    difficulty: 'hard',
    baseXp: 25,
    description: 'Escreva `maior_valor(lista)` (recursiva, sem `max()`, sem loop): retorna o maior valor da lista (não vazia).',
    starterCode: 'def maior_valor(lista):\n    pass\n',
    targetFn: 'maior_valor',
    testCases: [
      { input: [[3, 7, 2, 9, 4]], expected: 9, description: '5 valores' },
      { input: [[5]], expected: 5, description: '1 valor' },
      { input: [[1, 2]], expected: 2, description: '2 valores' },
    ],
  },
  {
    kind: 'challenge',
    title: 'R.8 Inverter uma string (sem `[::-1]`, sem loop)',
    concept: 'Caso base: string de 0 ou 1 letra é ela mesma invertida. Senão: inverta o resto (`palavra[1:]`) e junte a primeira letra NO FINAL.',
    exampleCode: 'def contar_vogais(palavra):\n    if len(palavra) == 0:\n        return 0\n    resto = contar_vogais(palavra[1:])\n    return resto + 1 if palavra[0] in "aeiou" else resto',
    vocabulary: ['recursão em string'],
    difficulty: 'hard',
    baseXp: 25,
    description: 'Escreva `inverter_string(palavra)` (recursiva, sem `[::-1]`, sem loop): retorna a palavra invertida.',
    starterCode: 'def inverter_string(palavra):\n    pass\n',
    targetFn: 'inverter_string',
    testCases: [
      { input: ['python'], expected: 'nohtyp', description: '"python"' },
      { input: ['a'], expected: 'a', description: '1 letra' },
      { input: [''], expected: '', description: 'vazia' },
    ],
  },
  {
    kind: 'challenge',
    title: 'R.9 MDC de dois números (algoritmo de Euclides)',
    concept: 'Algoritmo de Euclides: `mdc(a, b) = mdc(b, a % b)`, até `b` chegar em 0 (aí a resposta é `a`).',
    exampleCode: 'def resto_ate_zero(a, b):\n    if b == 0:\n        return a\n    return resto_ate_zero(b, a % b)  # (esse já É o mdc, de brinde)',
    vocabulary: ['algoritmo de Euclides'],
    difficulty: 'hard',
    baseXp: 30,
    description: 'Escreva `mdc(a, b)` (recursiva): retorna o Máximo Divisor Comum de `a` e `b`, usando o algoritmo de Euclides (`mdc(a, b) = mdc(b, a % b)`, caso base `b == 0` retorna `a`).',
    starterCode: 'def mdc(a, b):\n    pass\n',
    targetFn: 'mdc',
    testCases: [
      { input: [12, 8], expected: 4, description: 'mdc(12,8)' },
      { input: [17, 5], expected: 1, description: 'mdc(17,5) (coprimos)' },
      { input: [100, 25], expected: 25, description: 'mdc(100,25)' },
    ],
  },
  {
    kind: 'challenge',
    title: 'R.10 Busca binária (recursiva)',
    concept: 'A lista já vem ORDENADA (4.10). Olhe o item do meio: se for o alvo, achou; se o alvo for menor, busque na metade da esquerda; se for maior, na metade da direita.',
    exampleCode: 'def tem_no_meio(lista, alvo):\n    if not lista:\n        return False\n    meio = len(lista) // 2\n    return lista[meio] == alvo',
    vocabulary: ['busca binária', 'lista ordenada'],
    difficulty: 'hard',
    baseXp: 30,
    description: 'Escreva `busca_binaria(lista, alvo)` (recursiva): `lista` já está ordenada. Retorna `True` se `alvo` está na lista, senão `False`, usando busca binária (não percorra item por item).',
    starterCode: 'def busca_binaria(lista, alvo):\n    pass\n',
    targetFn: 'busca_binaria',
    testCases: [
      { input: [[1, 3, 5, 7, 9, 11], 7], expected: true, description: 'encontra 7' },
      { input: [[1, 3, 5, 7, 9, 11], 4], expected: false, description: '4 não está na lista' },
      { input: [[2, 4, 6, 8], 2], expected: true, description: 'encontra o primeiro' },
    ],
  },
  {
    kind: 'lesson',
    title: 'Quando recursão custa caro',
    concept:
      'Python tem um LIMITE de profundidade de chamadas (por padrão, cerca de 1000) — recursão demais estoura com `RecursionError`. E nem todo problema PRECISA ser recursivo: os mesmos problemas de "processar uma lista" que você resolveu com recursão aqui, a trilha 7 resolveu com comprehension — ambos válidos, escolha depende do problema (recursão brilha quando o problema já É naturalmente "menor + menor + menor", como árvores).',
    exampleCode: '# mesma soma, dois estilos:\ndef soma_recursiva(lista):\n    if not lista:\n        return 0\n    return lista[0] + soma_recursiva(lista[1:])\n\ndef soma_comprehension(lista):\n    return sum(x for x in lista)',
    vocabulary: ['RecursionError', 'limite de profundidade'],
    difficulty: 'medium',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: 'R.11 [Bônus] Torres de Hanói',
    concept: 'Mover `n` discos leva: mover `n-1` discos pro pino auxiliar, mover o disco `n` pro destino, mover os `n-1` discos de volta pro destino — por isso `hanoi(n) = 2 * hanoi(n-1) + 1`.',
    exampleCode: '# a fórmula T(n) = 2*T(n-1) + 1 é o coração do problema —\n# não precisa simular os discos pra calcular quantos movimentos são necessários',
    vocabulary: ['Torres de Hanói'],
    difficulty: 'hard',
    baseXp: 35,
    description: 'Escreva `hanoi(n)` (recursiva): retorna quantos movimentos são necessários para resolver a Torre de Hanói com `n` discos (`hanoi(0) = 0`).',
    starterCode: 'def hanoi(n):\n    pass\n',
    targetFn: 'hanoi',
    testCases: [
      { input: [3], expected: 7, description: 'n=3' },
      { input: [1], expected: 1, description: 'n=1' },
      { input: [4], expected: 15, description: 'n=4' },
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
      .values({ slug: TRAIL_SLUG, title: TRAIL_TITLE, description: TRAIL_DESC, language: 'python', order: 170 })
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
