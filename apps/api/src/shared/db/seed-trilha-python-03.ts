/**
 * Seed da trilha "Python: Funções" no CATÁLOGO GLOBAL (tenant_id = NULL).
 * Trilha 3/10 — pré-requisito: trilhas 1-2. Ver docs/trilha-python-03-funcoes.md
 * (desenho módulo a módulo).
 *
 * Execução: pnpm --filter @codinhos/api db:seed:python-03
 *
 * Idempotente e atualizável, mesmo padrão do seed-trilha-js.ts. Soluções de
 * referência verificadas rodando Python de verdade antes de escrever os
 * testCases.
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

const TRAIL_SLUG = 'python-funcoes'
const TRAIL_TITLE = 'Python: Funções'
const TRAIL_DESC =
  'Criar suas próprias funções com def, parâmetros (incluindo valor padrão e *args), return, funções chamando funções, e uma primeira noção de escopo local vs. global. Pré-requisito: Decisões e Repetições.'

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
    title: 'Ponte: de escrever código solto para empacotar em função',
    concept:
      'Todos os desafios de 1-2 já rodavam DENTRO de uma função por baixo dos panos (é assim que o Codinhos testa seu código). Agora você mesmo(a) vai escrever o `def` — empacotar um pedaço de lógica com nome, para reusar quando quiser.',
    exampleCode: 'def dobro(n):\n    return n * 2\n\nprint(dobro(5))  # 10',
    vocabulary: ['def'],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'lesson',
    title: '`def` e `return`',
    concept: 'Uma função começa com `def nome(parametros):`, corpo indentado. `return valor` devolve um resultado para quem chamou — sem `return`, a função devolve `None`.',
    exampleCode: 'def triplo(n):\n    return n * 3\n\nresultado = triplo(4)\nprint(resultado)  # 12',
    vocabulary: ['def', 'return'],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: '3.1 Dobrar um número',
    concept: 'Uma função com 1 parâmetro: recebe `n`, retorna `n * 2`.',
    exampleCode: 'def metade(n):\n    return n / 2',
    vocabulary: ['def', 'return'],
    difficulty: 'easy',
    baseXp: 10,
    description: 'Escreva `dobro(n)` que retorna o dobro de `n`.',
    starterCode: 'def dobro(n):\n    pass\n',
    targetFn: 'dobro',
    testCases: [
      { input: [5], expected: 10, description: 'n=5' },
      { input: [0], expected: 0, description: 'n=0' },
      { input: [-3], expected: -6, description: 'n=-3' },
    ],
  },
  {
    kind: 'lesson',
    title: 'Vários parâmetros',
    concept: 'Uma função pode receber mais de um parâmetro, separados por vírgula: `def soma(a, b):`.',
    exampleCode: 'def multiplica(a, b):\n    return a * b',
    vocabulary: ['parâmetro'],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: '3.2 Soma de dois números',
    concept: 'Dois parâmetros, um `return` com a soma.',
    exampleCode: 'def subtrai(a, b):\n    return a - b',
    vocabulary: ['parâmetro'],
    difficulty: 'easy',
    baseXp: 10,
    description: 'Escreva `soma(a, b)` que retorna `a + b`.',
    starterCode: 'def soma(a, b):\n    pass\n',
    targetFn: 'soma',
    testCases: [
      { input: [2, 3], expected: 5, description: '2 + 3' },
      { input: [-1, 1], expected: 0, description: '-1 + 1' },
      { input: [10, 20], expected: 30, description: '10 + 20' },
    ],
  },
  {
    kind: 'lesson',
    title: 'Chamar função dentro de função',
    concept: 'Uma função pode chamar outra já pronta, reaproveitando lógica — evita repetir código.',
    exampleCode: 'def dobro(n):\n    return n * 2\n\ndef quadruplo(n):\n    return dobro(dobro(n))  # chama dobro duas vezes',
    vocabulary: ['chamada de função'],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: '3.3 Área e perímetro de um retângulo',
    concept: 'Escreva `perimetro` primeiro, depois `dados_retangulo` CHAMA `perimetro` por dentro (não recalcula a fórmula de novo).',
    exampleCode: 'def dobro(n):\n    return n * 2\n\ndef soma_dobrada(a, b):\n    return dobro(a) + dobro(b)',
    vocabulary: ['chamada de função'],
    difficulty: 'medium',
    baseXp: 20,
    description:
      'Escreva duas funções: `perimetro(largura, altura)` retornando `2 * (largura + altura)`, e `dados_retangulo(largura, altura)` que CHAMA `perimetro` e retorna a lista `[area, perimetro]` (area = largura × altura).',
    starterCode: 'def perimetro(largura, altura):\n    pass\n\n\ndef dados_retangulo(largura, altura):\n    # chame perimetro(...) aqui dentro\n    pass\n',
    targetFn: 'dados_retangulo',
    testCases: [
      { input: [4, 3], expected: [12, 14], description: '4 x 3' },
      { input: [5, 5], expected: [25, 20], description: '5 x 5' },
    ],
  },
  {
    kind: 'lesson',
    title: 'Parâmetro com valor padrão',
    concept: '`def saudacao(nome, cumprimento="Olá"):` — se quem chama não passar `cumprimento`, o padrão `"Olá"` é usado. Só funciona bem com valores simples (texto, número) por enquanto.',
    exampleCode: 'def apresentar(nome, titulo="Sr(a)."):\n    return f"{titulo} {nome}"\n\nprint(apresentar("Silva"))          # Sr(a). Silva\nprint(apresentar("Silva", "Dr."))   # Dr. Silva',
    vocabulary: ['parâmetro padrão'],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: '3.4 Saudação personalizável',
    concept: 'Dê um valor padrão ao segundo parâmetro — a função deve funcionar chamada com 1 ou 2 argumentos.',
    exampleCode: 'def cumprimentar(nome, emoji="👋"):\n    return f"{emoji} {nome}"',
    vocabulary: ['parâmetro padrão'],
    difficulty: 'medium',
    baseXp: 15,
    description:
      'Escreva `saudacao(nome, cumprimento="Olá")` que retorna `"<cumprimento>, <nome>!"`. Chamada só com `nome`, deve usar `"Olá"` como padrão.',
    starterCode: 'def saudacao(nome, cumprimento="Olá"):\n    pass\n',
    targetFn: 'saudacao',
    testCases: [
      { input: ['Ana'], expected: 'Olá, Ana!', description: 'sem cumprimento (usa padrão)' },
      { input: ['Ana', 'Oi'], expected: 'Oi, Ana!', description: 'com cumprimento explícito' },
    ],
  },
  {
    kind: 'lesson',
    title: 'Função + decisão, função + repetição',
    concept: 'Uma função pode ter `if` ou `for` dentro do corpo, igual qualquer outro bloco — é só mais uma indentação.',
    exampleCode: 'def eh_par(n):\n    if n % 2 == 0:\n        return True\n    return False',
    vocabulary: ['if dentro de função', 'for dentro de função'],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: '3.5 É primo?',
    concept: 'Um número é primo se só é divisível por 1 e por ele mesmo. Percorra de 2 até `n - 1` procurando algum divisor.',
    exampleCode: 'def tem_divisor_par(n):\n    for i in range(2, n):\n        if n % i == 0 and i % 2 == 0:\n            return True\n    return False',
    vocabulary: ['for dentro de função'],
    difficulty: 'hard',
    baseXp: 25,
    description: 'Escreva `eh_primo(n)`: retorna `True` se `n` for primo (maior que 1 e sem divisores entre 2 e n-1), senão `False`.',
    starterCode: 'def eh_primo(n):\n    pass\n',
    targetFn: 'eh_primo',
    testCases: [
      { input: [7], expected: true, description: 'n=7 (primo)' },
      { input: [8], expected: false, description: 'n=8 (não primo)' },
      { input: [2], expected: true, description: 'n=2 (menor primo)' },
      { input: [1], expected: false, description: 'n=1 (não é primo por definição)' },
      { input: [9], expected: false, description: 'n=9 (3x3, não primo)' },
    ],
  },
  {
    kind: 'challenge',
    title: '3.6 Contar múltiplos de 3 até N',
    concept: 'Use um contador (acumulador numérico) que soma 1 toda vez que encontra um múltiplo de 3 — igual reaproveitando a ideia da tabuada, mas contando em vez de imprimir.',
    exampleCode: 'def contar_pares_ate(n):\n    total = 0\n    for i in range(1, n + 1):\n        if i % 2 == 0:\n            total += 1\n    return total',
    vocabulary: ['acumulador'],
    difficulty: 'medium',
    baseXp: 20,
    description: 'Escreva `contar_multiplos_de_3(n)`: retorna quantos números de 1 até `n` (incluindo `n`) são múltiplos de 3.',
    starterCode: 'def contar_multiplos_de_3(n):\n    pass\n',
    targetFn: 'contar_multiplos_de_3',
    testCases: [
      { input: [10], expected: 3, description: 'n=10 (3, 6, 9)' },
      { input: [9], expected: 3, description: 'n=9 (3, 6, 9)' },
      { input: [2], expected: 0, description: 'n=2 (nenhum)' },
    ],
  },
  {
    kind: 'lesson',
    title: 'Escopo: variável de dentro não existe fora',
    concept:
      'Uma variável criada DENTRO de uma função (escopo local) só existe enquanto a função está rodando — some depois. Tentar usá-la de fora dá `NameError: name \'x\' is not defined`. Para "tirar" um valor de dentro da função, use `return` e guarde o resultado numa variável de fora.',
    exampleCode: 'def calcular():\n    x = 10\n    return x\n\nresultado = calcular()  # certo: pega o valor via return\nprint(resultado)',
    vocabulary: ['escopo local', 'escopo global', 'NameError'],
    difficulty: 'medium',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: '3.7 [Pegadinha guiada] Por que isso não funciona?',
    concept:
      'O código abaixo dá `NameError: name \'total\' is not defined` na última linha — `total` foi criado DENTRO de `calcular_total` e não existe fora dela.',
    exampleCode: '# ERRADO (não funciona):\ndef calcular_total(preco, quantidade):\n    total = preco * quantidade\n\nprint(total)  # NameError!',
    vocabulary: ['NameError', 'escopo'],
    difficulty: 'medium',
    baseXp: 15,
    description:
      'Corrija o código: adicione `return total` dentro de `calcular_total`, e crie uma variável global chamada `total` recebendo o resultado de `calcular_total(3, 4)`.',
    starterCode:
      'def calcular_total(preco, quantidade):\n    total = preco * quantidade\n    # adicione o return aqui\n\n# crie uma variável "total" chamando calcular_total(3, 4)\n',
    testCases: [
      { input: null, expected: 'int', description: 'total (resultado global de calcular_total(3, 4), depois do fix)' },
    ],
  },
  {
    kind: 'lesson',
    title: '`*args`: função com quantidade variável de argumentos',
    concept: '`def soma(*numeros):` aceita QUALQUER quantidade de argumentos — dentro da função, `numeros` vira uma tupla com todos eles. `sum(tupla)` soma tudo de uma vez.',
    exampleCode: 'def conta(*itens):\n    return len(itens)\n\nprint(conta(1, 2, 3))  # 3\nprint(conta("a"))      # 1',
    vocabulary: ['*args'],
    difficulty: 'medium',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: '3.8 Soma de quantos números vierem',
    concept: 'Use `*numeros` no parâmetro e `sum(numeros)` para somar tudo, seja 1, 3 ou nenhum número.',
    exampleCode: 'def maior_de_todos(*numeros):\n    return max(numeros) if numeros else None',
    vocabulary: ['*args', 'sum()'],
    difficulty: 'medium',
    baseXp: 20,
    description: 'Escreva `soma_tudo(*numeros)` que retorna a soma de todos os números recebidos (0 se nenhum for passado).',
    starterCode: 'def soma_tudo(*numeros):\n    pass\n',
    targetFn: 'soma_tudo',
    testCases: [
      { input: [1, 2, 3], expected: 6, description: 'três números' },
      { input: [5], expected: 5, description: 'um número' },
      { input: [], expected: 0, description: 'nenhum número' },
      { input: [10, 20, 30, 40], expected: 100, description: 'quatro números' },
    ],
  },
  {
    kind: 'challenge',
    title: '3.9 [Fecha a trilha] Calculadora com operação por nome',
    concept: 'Combine parâmetro padrão + `if/elif` para decidir qual conta fazer, a partir de um texto que descreve a operação.',
    exampleCode: 'def aplicar(a, b, op="soma"):\n    if op == "soma":\n        return a + b\n    elif op == "subtrai":\n        return a - b\n    return None',
    vocabulary: ['parâmetro padrão', 'elif'],
    difficulty: 'hard',
    baseXp: 30,
    description:
      'Escreva `calculadora(a, b, operacao="soma")`: se `operacao` for `"soma"` retorna `a + b`; `"subtrai"` retorna `a - b`; `"multiplica"` retorna `a * b`; `"divide"` retorna `a / b`. Sem `operacao`, usa `"soma"` como padrão.',
    starterCode: 'def calculadora(a, b, operacao="soma"):\n    pass\n',
    targetFn: 'calculadora',
    testCases: [
      { input: [4, 2], expected: 6, description: 'padrão (soma)' },
      { input: [4, 2, 'subtrai'], expected: 2, description: 'subtrai' },
      { input: [4, 2, 'multiplica'], expected: 8, description: 'multiplica' },
      { input: [4, 2, 'divide'], expected: 2, description: 'divide' },
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
      .values({ slug: TRAIL_SLUG, title: TRAIL_TITLE, description: TRAIL_DESC, language: 'python', order: 120 })
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
