/**
 * Seed da trilha "JavaScript: Decisões e Repetições" no CATÁLOGO GLOBAL.
 * Trilha 2/14 — ver docs/pesquisa-trilhas-js.md e docs/trilha-js-02-decisoes-e-repeticoes.md.
 * Execução: pnpm --filter @codinhos/api db:seed:js-02
 * Idempotente. Modo: function-call. Não usa arrays (só acumulador e for...of sobre string).
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

const TRAIL_SLUG = 'js-decisoes-e-repeticoes'
const TRAIL_TITLE = 'JavaScript: Decisões e Repetições'
const TRAIL_DESC =
  'O programa passa a decidir (if/else/switch/ternário) e a repetir (for/while/for...of) com acumuladores. Pré-requisito: Primeiros Passos.'
const TRAIL_ORDER = 20

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
    title: 'Lição 1 — Decisões (if / else if / else)',
    concept:
      'Programas ficam espertos quando **tomam decisões**. O `if` roda um bloco só se a condição for verdadeira; `else if` testa outra; `else` cobre o resto.\n\nA ordem importa: teste do caso mais específico ao mais geral. O `return` dentro de um `if` já encerra a função.',
    exampleCode: 'function faixa(idade) {\n  if (idade < 12) return "criança"\n  if (idade < 18) return "adolescente"\n  return "adulto"\n}',
    vocabulary: ['if', 'else if', 'else'],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: '2.1 Classificar nota',
    concept: 'Encadeie `if`s do caso mais alto ao mais baixo; o último `return` cobre o resto.',
    exampleCode: 'function tamanho(n) {\n  if (n > 100) return "grande"\n  if (n > 10) return "médio"\n  return "pequeno"\n}',
    vocabulary: ['if', 'else if'],
    difficulty: 'easy',
    baseXp: 10,
    description: 'Escreva `classificar(nota)`: "aprovado" se nota >= 7, "recuperação" se >= 5, senão "reprovado".',
    starterCode: 'function classificar(nota) {\n  // escreva seu código aqui\n}\n',
    targetFn: 'classificar',
    testCases: [
      { input: [9], expected: 'aprovado', description: '9 = aprovado' },
      { input: [6], expected: 'recuperação', description: '6 = recuperação' },
      { input: [3], expected: 'reprovado', description: '3 = reprovado' },
      { input: [7], expected: 'aprovado', description: '7 = aprovado (limite)' },
      { input: [5], expected: 'recuperação', description: '5 = recuperação (limite)' },
    ],
  },
  {
    kind: 'challenge',
    title: '2.2 Sinal do número',
    concept: 'Encadeie `if`s para cobrir cada caso.',
    exampleCode: 'function temperatura(t) {\n  if (t > 30) return "quente"\n  if (t < 15) return "frio"\n  return "agradável"\n}',
    vocabulary: ['if', 'return'],
    difficulty: 'easy',
    baseXp: 10,
    description: 'Escreva `sinal(n)`: "positivo", "negativo" ou "zero".',
    starterCode: 'function sinal(n) {\n  // escreva seu código aqui\n}\n',
    targetFn: 'sinal',
    testCases: [
      { input: [5], expected: 'positivo', description: '5 = positivo' },
      { input: [-2], expected: 'negativo', description: '-2 = negativo' },
      { input: [0], expected: 'zero', description: '0 = zero' },
    ],
  },
  {
    kind: 'challenge',
    title: '2.3 Maior de dois',
    concept: 'Compare os dois e devolva o que interessa.',
    exampleCode: 'function menorDeDois(a, b) {\n  if (a <= b) return a\n  return b\n}',
    vocabulary: ['if', 'else'],
    difficulty: 'easy',
    baseXp: 10,
    description: 'Escreva `maiorDeDois(a, b)` que retorna o maior dos dois (se iguais, qualquer um).',
    starterCode: 'function maiorDeDois(a, b) {\n  // escreva seu código aqui\n}\n',
    targetFn: 'maiorDeDois',
    testCases: [
      { input: [3, 7], expected: 7, description: 'maior de 3 e 7 = 7' },
      { input: [9, 2], expected: 9, description: 'maior de 9 e 2 = 9' },
      { input: [4, 4], expected: 4, description: 'iguais = 4' },
    ],
  },
  {
    kind: 'lesson',
    title: 'Lição 2 — switch e ternário',
    concept:
      'O `switch` compara um mesmo valor com vários `case` de forma organizada (use `return` ou `break` em cada, e `default` para o resto).\n\nO **ternário** `condição ? valorSeSim : valorSeNão` é um `if` curtinho que já devolve o valor.',
    exampleCode: 'function nomeDaCor(n) {\n  switch (n) {\n    case 1: return "vermelho"\n    case 2: return "verde"\n    default: return "?"\n  }\n}\nconst dobroOuZero = (n, ok) => ok ? n * 2 : 0',
    vocabulary: ['switch', 'case', 'default', '? :'],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: '2.4 Nome do dia',
    concept: 'O `switch` compara um valor com vários `case`. Coloque `return` em cada caso e um `default`.',
    exampleCode: 'function nomeDaCor(n) {\n  switch (n) {\n    case 1: return "vermelho"\n    default: return "desconhecida"\n  }\n}',
    vocabulary: ['switch', 'case', 'default'],
    difficulty: 'medium',
    baseXp: 20,
    description: 'Escreva `nomeDoDia(n)`: 1="domingo", 2="segunda", 3="terça", 4="quarta", 5="quinta", 6="sexta", 7="sábado".',
    starterCode: 'function nomeDoDia(n) {\n  // escreva seu código aqui\n}\n',
    targetFn: 'nomeDoDia',
    testCases: [
      { input: [1], expected: 'domingo', description: '1 = domingo' },
      { input: [4], expected: 'quarta', description: '4 = quarta' },
      { input: [7], expected: 'sábado', description: '7 = sábado' },
    ],
  },
  {
    kind: 'challenge',
    title: '2.5 Preço VIP',
    concept: 'O ternário `condição ? valorSeSim : valorSeNão` devolve um valor.',
    exampleCode: 'function dobroOuZero(n, dobrar) {\n  return dobrar ? n * 2 : 0\n}',
    vocabulary: ['? :', 'ternário'],
    difficulty: 'easy',
    baseXp: 10,
    description: 'Escreva `preco(valor, ehVip)`: clientes VIP pagam 10% a menos; os demais pagam o valor cheio.',
    starterCode: 'function preco(valor, ehVip) {\n  // escreva seu código aqui\n}\n',
    targetFn: 'preco',
    testCases: [
      { input: [100, true], expected: 90, description: 'VIP paga 90 de 100' },
      { input: [50, false], expected: 50, description: 'não-VIP paga 50' },
      { input: [200, true], expected: 180, description: 'VIP paga 180 de 200' },
    ],
  },
  {
    kind: 'lesson',
    title: 'Lição 3 — Repetição: for e acumulador',
    concept:
      'O `for` repete com um **contador** (início, condição de parada e passo). Muitas vezes usamos um **acumulador**: uma variável que começa em 0 (para somar, com `+=`) ou 1 (para multiplicar, com `*=`) e é atualizada dentro do laço.',
    exampleCode: 'let soma = 0\nfor (let i = 1; i <= 5; i++) {\n  soma += i\n}\n// soma vale 15',
    vocabulary: ['for', 'acumulador', '++', '+=', '*='],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: '2.6 Somar até N',
    concept: 'Use um **acumulador** (começa em 0) e vá somando com `+=` dentro do `for`.',
    exampleCode: 'function quantosAte(n) {\n  let total = 0\n  for (let i = 1; i <= n; i++) total += 1\n  return total\n}',
    vocabulary: ['for', 'acumulador', '+='],
    difficulty: 'easy',
    baseXp: 10,
    description: 'Escreva `somaAte(n)` que soma 1 + 2 + ... + n.',
    starterCode: 'function somaAte(n) {\n  // escreva seu código aqui\n}\n',
    targetFn: 'somaAte',
    testCases: [
      { input: [5], expected: 15, description: '1..5 = 15' },
      { input: [1], expected: 1, description: '1 = 1' },
      { input: [10], expected: 55, description: '1..10 = 55' },
    ],
  },
  {
    kind: 'challenge',
    title: '2.7 Fatorial',
    concept: 'Fatorial = 1×2×...×n. O acumulador de multiplicação começa em 1 e usa `*=`. fatorial(0) = 1.',
    exampleCode: 'function produtoAte(n) {\n  let p = 1\n  for (let i = 1; i <= n; i++) p *= i\n  return p\n}',
    vocabulary: ['for', '*='],
    difficulty: 'medium',
    baseXp: 20,
    description: 'Escreva `fatorial(n)` (use laço). fatorial(0) = 1.',
    starterCode: 'function fatorial(n) {\n  // escreva seu código aqui\n}\n',
    targetFn: 'fatorial',
    testCases: [
      { input: [5], expected: 120, description: '5! = 120' },
      { input: [0], expected: 1, description: '0! = 1' },
      { input: [1], expected: 1, description: '1! = 1' },
    ],
  },
  {
    kind: 'challenge',
    title: '2.8 Contar pares até N',
    concept: 'Conte dentro do laço só quando a condição for verdadeira (use `%` para testar par).',
    exampleCode: 'function contarImpares(ate) {\n  let n = 0\n  for (let i = 1; i <= ate; i++) {\n    if (i % 2 === 1) n++\n  }\n  return n\n}',
    vocabulary: ['for', 'if', '%'],
    difficulty: 'medium',
    baseXp: 20,
    description: 'Escreva `contarPares(ate)` que conta quantos números pares existem de 1 até ate.',
    starterCode: 'function contarPares(ate) {\n  // escreva seu código aqui\n}\n',
    targetFn: 'contarPares',
    testCases: [
      { input: [10], expected: 5, description: '1..10 tem 5 pares' },
      { input: [1], expected: 0, description: '1..1 tem 0' },
      { input: [7], expected: 3, description: '1..7 tem 3 (2,4,6)' },
    ],
  },
  {
    kind: 'lesson',
    title: 'Lição 4 — while e for...of',
    concept:
      'O `while` repete **enquanto** uma condição for verdadeira (cuidado com laços que nunca param). O `for...of` percorre cada item — aqui, **cada caractere de uma string**.',
    exampleCode: 'let n = 0\nwhile (n < 3) n++     // n vira 3\n\nfor (const c of "abc") {\n  // c vale "a", depois "b", depois "c"\n}',
    vocabulary: ['while', 'for...of'],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: '2.9 Contar vogais',
    concept: 'Percorra a string com `for...of` e conte quando o caractere for uma vogal.',
    exampleCode: 'function contarZeros(texto) {\n  let n = 0\n  for (const c of texto) {\n    if (c === "0") n++\n  }\n  return n\n}',
    vocabulary: ['for...of', 'if', '==='],
    difficulty: 'medium',
    baseXp: 20,
    description: 'Escreva `contarVogais(texto)` que conta quantas vogais (a, e, i, o, u minúsculas) há no texto.',
    starterCode: 'function contarVogais(texto) {\n  // escreva seu código aqui\n}\n',
    targetFn: 'contarVogais',
    testCases: [
      { input: ['banana'], expected: 3, description: 'banana tem 3' },
      { input: ['xyz'], expected: 0, description: 'xyz tem 0' },
      { input: ['aeiou'], expected: 5, description: 'aeiou tem 5' },
    ],
  },
  {
    kind: 'challenge',
    title: '2.10 Potência na mão',
    concept: 'Potência é multiplicar a base por ela mesma "exp" vezes (acumulador começa em 1). base^0 = 1.',
    exampleCode: 'function multiplicaSomando(base, vezes) {\n  let r = 0\n  for (let i = 0; i < vezes; i++) r += base\n  return r\n}',
    vocabulary: ['for', '*='],
    difficulty: 'medium',
    baseXp: 20,
    description: 'Escreva `potencia(base, exp)` SEM usar Math.pow. base^0 = 1.',
    starterCode: 'function potencia(base, exp) {\n  // escreva seu código aqui\n}\n',
    targetFn: 'potencia',
    testCases: [
      { input: [2, 3], expected: 8, description: '2^3 = 8' },
      { input: [5, 0], expected: 1, description: '5^0 = 1' },
      { input: [3, 2], expected: 9, description: '3^2 = 9' },
    ],
  },
  {
    kind: 'challenge',
    title: '2.11 [Fecha a trilha] Maior de três',
    concept: 'Combine `if` e `&&` para achar o maior dos três.',
    exampleCode: 'function todosPositivos(a, b, c) {\n  return a > 0 && b > 0 && c > 0\n}',
    vocabulary: ['&&', 'if'],
    difficulty: 'medium',
    baseXp: 20,
    description: 'Escreva `maiorDeTres(a, b, c)` que retorna o maior dos três.',
    starterCode: 'function maiorDeTres(a, b, c) {\n  // escreva seu código aqui\n}\n',
    targetFn: 'maiorDeTres',
    testCases: [
      { input: [1, 2, 3], expected: 3, description: 'maior de 1,2,3 = 3' },
      { input: [9, 2, 5], expected: 9, description: 'maior de 9,2,5 = 9' },
      { input: [4, 8, 8], expected: 8, description: 'maior de 4,8,8 = 8' },
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
