/**
 * Seed da trilha "Recursão de Verdade: Pensando Sem Loops" no CATÁLOGO GLOBAL
 * (tenant_id = NULL). Primeira trilha do catálogo a EXIGIR estrutura via
 * `mode: 'ast'` (astRule) — não basta o retorno bater, o código precisa
 * realmente usar recursão (e não usar for/while escondido).
 *
 * Vários desafios revisitam problemas que já existem (iterativos) na trilha
 * "JS: do Fundamento ao Algoritmo" (contagem regressiva, soma até N, fatorial,
 * potência, soma dos dígitos, palíndromo) — de propósito: o aluno já sabe
 * resolver, agora precisa provar que resolve SEM loop, só com recursão. Os
 * demais (maior valor de lista, inverter string, MDC, busca binária, Hanói)
 * são conteúdo novo, sem equivalente no catálogo.
 *
 * Execução: pnpm --filter @codinhos/api db:seed:recursao
 *
 * Idempotente E atualizável, mesmo padrão do seed-trilha-js.ts.
 * Desafios verificados contra o runner real (run-tests.ts) antes de semear,
 * incluindo soluções "erradas de propósito" (com loop) para confirmar que a
 * astRule reprova (evita falso-positivo).
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

const TRAIL_SLUG = 'js-recursao-de-verdade'
const TRAIL_TITLE = 'Recursão de Verdade: Pensando Sem Loops'
const TRAIL_DESC =
  'Trilha dedicada a recursão: os mesmos problemas que você já resolveu com for/while, agora resolvidos SÓ com recursão — e o Codinhos confere de verdade que não tem loop escondido. Termina com problemas novos (busca binária, MDC, Torres de Hanói) e com os métodos de array (map/filter/reduce) como alternativa ao loop.'

type AstRuleKind =
  | 'requireRecursion'
  | 'forbidLoops'
  | 'requireMethod'
  | 'forbidMethod'
  | 'requireCall'
  | 'forbidCall'

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
    astRule?: { kind: AstRuleKind; name?: string }
  }[]
}

const trilhaModules: Modulo[] = [
  {
    kind: 'lesson',
    title: 'Lição — Recursão: funções que chamam a si mesmas',
    concept:
      '**Recursão** é quando uma função chama a si mesma para resolver um problema **menor**. Pense em bonecas russas: para abrir a boneca grande, você abre a de dentro, que tem outra dentro, até chegar na menor — essa é a hora de parar.\n\nToda recursão tem duas partes: o **caso base** (a boneca menor, que já resolve sozinha, sem chamar mais ninguém) e o **passo recursivo** (chama a própria função de novo, com um problema um pouco menor, sempre caminhando em direção ao caso base).\n\nVeja o rastro de execução de `contagem(3)` passo a passo — cada chamada espera a de dentro terminar:',
    exampleCode:
      'function contagem(n) {\n  if (n <= 0) return []          // caso base: já resolve\n  return [n, ...contagem(n - 1)] // passo recursivo: problema menor\n}\n// contagem(3)\n//  = [3, ...contagem(2)]\n//  = [3, ...[2, ...contagem(1)]]\n//  = [3, ...[2, ...[1, ...contagem(0)]]]\n//  = [3, 2, 1]   (contagem(0) bateu no caso base -> [])',
    vocabulary: ['recursão', 'caso base', 'passo recursivo', 'pilha de chamadas'],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: 'R.1 Contagem regressiva — agora com recursão de verdade',
    concept:
      'Você já resolveu contagem regressiva com `for` na trilha de fundamentos. Desta vez, nada de `for`/`while` — só recursão. Toda função recursiva precisa do CASO BASE (para) e do PASSO RECURSIVO (chama a si mesma com um valor menor). Exemplo análogo (lista CRESCENTE 1..n):',
    exampleCode: 'function crescente(n) {\n  if (n <= 0) return []\n  return [...crescente(n - 1), n]\n}\n// crescente(3) -> [1,2,3]',
    vocabulary: ['recursão', 'caso base', 'passo recursivo'],
    difficulty: 'medium',
    baseXp: 20,
    description: 'Escreva `regressiva(n)` (recursiva, SEM for/while) que retorna a lista [n, n-1, ..., 1]. Para n <= 0, retorne [].',
    starterCode: 'function regressiva(n) {\n  // escreva seu código aqui (recursivo, sem for/while)\n}\n',
    targetFn: 'regressiva',
    testCases: [
      { input: [3], expected: [3, 2, 1], description: '3 -> [3,2,1]' },
      { input: [1], expected: [1], description: '1 -> [1]' },
      { input: [0], expected: [], description: '0 -> []' },
      { input: null, expected: '', description: 'usa recursão (chama a si mesma)', mode: 'ast', astRule: { kind: 'requireRecursion' } },
      { input: null, expected: '', description: 'resolve sem for/while/forEach', mode: 'ast', astRule: { kind: 'forbidLoops' } },
    ],
  },
  {
    kind: 'challenge',
    title: 'R.2 Soma de 1 até N — agora com recursão de verdade',
    concept:
      'Mesmo desafio que você já viu, sem `for`/`while`. Identifique o caso base (quando parar) e o passo recursivo (some o valor atual com a chamada para o problema menor). Exemplo análogo (dobrar um número várias vezes):',
    exampleCode: 'function dobraNvezes(x, vezes) {\n  if (vezes <= 0) return x\n  return dobraNvezes(x * 2, vezes - 1)\n}\n// dobraNvezes(1, 3) -> 8',
    vocabulary: ['recursão', 'caso base'],
    difficulty: 'medium',
    baseXp: 20,
    description: 'Escreva `somaAteRec(n)` (recursiva, SEM for/while) que soma 1 + 2 + ... + n. Para n <= 0, retorne 0.',
    starterCode: 'function somaAteRec(n) {\n  // escreva seu código aqui (recursivo, sem for/while)\n}\n',
    targetFn: 'somaAteRec',
    testCases: [
      { input: [5], expected: 15, description: '1..5 = 15' },
      { input: [1], expected: 1, description: '1 = 1' },
      { input: [0], expected: 0, description: '0 = 0' },
      { input: null, expected: '', description: 'usa recursão (chama a si mesma)', mode: 'ast', astRule: { kind: 'requireRecursion' } },
      { input: null, expected: '', description: 'resolve sem for/while/forEach', mode: 'ast', astRule: { kind: 'forbidLoops' } },
    ],
  },
  {
    kind: 'challenge',
    title: 'R.3 Fatorial — agora com recursão de verdade',
    concept:
      'fatorial(n) = n × fatorial(n-1); caso base fatorial(0) = 1. Você já escreveu isso — agora sem `for`/`while`. Exemplo análogo (potência de 2 recursiva):',
    exampleCode: 'function potenciaDe2(exp) {\n  if (exp <= 0) return 1\n  return 2 * potenciaDe2(exp - 1)\n}\n// potenciaDe2(3) -> 8',
    vocabulary: ['recursão', 'caso base'],
    difficulty: 'medium',
    baseXp: 20,
    description: 'Escreva `fatorialRec(n)` (recursiva, SEM for/while). fatorialRec(0) deve ser 1.',
    starterCode: 'function fatorialRec(n) {\n  // escreva seu código aqui (recursivo, sem for/while)\n}\n',
    targetFn: 'fatorialRec',
    testCases: [
      { input: [5], expected: 120, description: '5! = 120' },
      { input: [0], expected: 1, description: '0! = 1' },
      { input: [1], expected: 1, description: '1! = 1' },
      { input: null, expected: '', description: 'usa recursão (chama a si mesma)', mode: 'ast', astRule: { kind: 'requireRecursion' } },
      { input: null, expected: '', description: 'resolve sem for/while/forEach', mode: 'ast', astRule: { kind: 'forbidLoops' } },
    ],
  },
  {
    kind: 'challenge',
    title: 'R.4 Potência — agora com recursão de verdade',
    concept: 'base^exp = base × base^(exp-1); caso base base^0 = 1. Mesma ideia de sempre, agora sem loop.',
    exampleCode: 'function fatorialRec(n) {\n  if (n <= 1) return 1\n  return n * fatorialRec(n - 1)\n}\n// fatorialRec(4) -> 24',
    vocabulary: ['recursão', 'caso base'],
    difficulty: 'medium',
    baseXp: 20,
    description: 'Escreva `potenciaRec(base, exp)` (recursiva, SEM for/while). base^0 deve ser 1.',
    starterCode: 'function potenciaRec(base, exp) {\n  // escreva seu código aqui (recursivo, sem for/while)\n}\n',
    targetFn: 'potenciaRec',
    testCases: [
      { input: [2, 5], expected: 32, description: '2^5 = 32' },
      { input: [3, 0], expected: 1, description: '3^0 = 1' },
      { input: [5, 2], expected: 25, description: '5^2 = 25' },
      { input: null, expected: '', description: 'usa recursão (chama a si mesma)', mode: 'ast', astRule: { kind: 'requireRecursion' } },
      { input: null, expected: '', description: 'resolve sem for/while/forEach', mode: 'ast', astRule: { kind: 'forbidLoops' } },
    ],
  },
  {
    kind: 'lesson',
    title: 'Lição — Por que evitar o for muda o jeito de pensar',
    concept:
      'Quando você não pode usar `for`/`while`, precisa quebrar o problema em uma parte pequena (o caso base) e CONFIAR que a chamada recursiva resolve "o resto" sozinha — sem controlar um contador manualmente.\n\nEssa mudança de raciocínio é útil: repare que não precisamos de nenhuma variável para "guardar o progresso" — cada chamada recursiva já carrega o problema menor.',
    exampleCode: 'function tamanho(lista) {\n  if (lista.length === 0) return 0      // menor problema possível\n  return 1 + tamanho(lista.slice(1))    // confia que o resto se resolve\n}',
    vocabulary: ['decompor problema', 'confiar na recursão'],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: 'R.5 Soma dos dígitos — agora com recursão de verdade',
    concept:
      'Você já somou os dígitos de um número com `.split()` e loop. Agora faça recursivo: o último dígito é `n % 10`, e o resto do número é `Math.floor(n / 10)` — o "problema menor".',
    exampleCode: 'function quantosDigitos(n) {\n  if (n < 10) return 1\n  return 1 + quantosDigitos(Math.floor(n / 10))\n}\n// quantosDigitos(123) -> 3',
    vocabulary: ['recursão', '%', 'Math.floor()'],
    difficulty: 'hard',
    baseXp: 30,
    description: 'Escreva `somaDigitosRec(n)` (recursiva, SEM for/while) que soma os dígitos de n (n é positivo). Ex.: 123 -> 6.',
    starterCode: 'function somaDigitosRec(n) {\n  // escreva seu código aqui (recursivo, sem for/while)\n}\n',
    targetFn: 'somaDigitosRec',
    testCases: [
      { input: [123], expected: 6, description: '1+2+3=6' },
      { input: [99], expected: 18, description: '9+9=18' },
      { input: [5], expected: 5, description: '5 = 5' },
      { input: null, expected: '', description: 'usa recursão (chama a si mesma)', mode: 'ast', astRule: { kind: 'requireRecursion' } },
      { input: null, expected: '', description: 'resolve sem for/while/forEach', mode: 'ast', astRule: { kind: 'forbidLoops' } },
    ],
  },
  {
    kind: 'challenge',
    title: 'R.6 Palíndromo — agora com recursão de verdade',
    concept:
      'Você já verificou palíndromo com `for...of`. Agora pense recursivo: compare a primeira e a última letra; se forem iguais, a resposta depende do MEIO da palavra (problema menor, sem as pontas).',
    exampleCode: 'function primeiraLetra(t) {\n  if (t.length === 0) return ""\n  return t[0]\n}',
    vocabulary: ['recursão', '.slice()', 'comparação'],
    difficulty: 'hard',
    baseXp: 30,
    description:
      'Escreva `ehPalindromoRec(texto)` (recursiva, SEM for/while) que retorna true se `texto` (já em minúsculas, só letras) for palíndromo. Ex.: "arara" -> true, "casa" -> false. Caso base: texto com 0 ou 1 letra é sempre palíndromo.',
    starterCode: 'function ehPalindromoRec(texto) {\n  // escreva seu código aqui (recursivo, sem for/while)\n}\n',
    targetFn: 'ehPalindromoRec',
    testCases: [
      { input: ['arara'], expected: true, description: '"arara" é' },
      { input: ['casa'], expected: false, description: '"casa" não é' },
      { input: ['a'], expected: true, description: '"a" é (1 letra)' },
      { input: [''], expected: true, description: '"" é (vazia)' },
      { input: null, expected: '', description: 'usa recursão (chama a si mesma)', mode: 'ast', astRule: { kind: 'requireRecursion' } },
      { input: null, expected: '', description: 'resolve sem for/while/forEach', mode: 'ast', astRule: { kind: 'forbidLoops' } },
    ],
  },
  {
    kind: 'lesson',
    title: 'Lição — Recursão sobre listas: cabeça e cauda',
    concept:
      'Para listas, o truque de sempre é dividir em CABEÇA (`lista[0]`, o primeiro item) e CAUDA (`lista.slice(1)`, o restante). O caso base normalmente é a lista vazia.\n\nA partir de agora os desafios são NOVOS — não têm equivalente na trilha de fundamentos.',
    exampleCode: 'function contarItens(lista) {\n  if (lista.length === 0) return 0          // caso base: lista vazia\n  return 1 + contarItens(lista.slice(1))    // cabeça + recursão na cauda\n}',
    vocabulary: ['cabeça', 'cauda', '.slice()'],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: 'R.7 Maior valor de uma lista (sem Math.max, sem loop)',
    concept:
      'Compare a cabeça da lista com o maior valor do resto (cauda) e devolva o maior dos dois. Nada de `Math.max` nem `for` — só recursão e comparação. Exemplo análogo (menor valor):',
    exampleCode: 'function menorRec(lista) {\n  if (lista.length === 1) return lista[0]\n  const menorDoResto = menorRec(lista.slice(1))\n  return lista[0] < menorDoResto ? lista[0] : menorDoResto\n}',
    vocabulary: ['recursão', 'cabeça', 'cauda', 'comparação'],
    difficulty: 'hard',
    baseXp: 35,
    description: 'Escreva `maiorRec(lista)` (recursiva, SEM for/while, SEM Math.max) que retorna o maior valor da lista. A lista tem sempre pelo menos 1 item.',
    starterCode: 'function maiorRec(lista) {\n  // escreva seu código aqui (recursivo, sem for/while, sem Math.max)\n}\n',
    targetFn: 'maiorRec',
    testCases: [
      { input: [[3, 7, 2, 9, 4]], expected: 9, description: '[3,7,2,9,4] -> 9' },
      { input: [[5]], expected: 5, description: '[5] -> 5 (1 item)' },
      { input: [[-1, -8, -3]], expected: -1, description: 'negativos -> -1' },
      { input: null, expected: '', description: 'usa recursão (chama a si mesma)', mode: 'ast', astRule: { kind: 'requireRecursion' } },
      { input: null, expected: '', description: 'resolve sem for/while/forEach', mode: 'ast', astRule: { kind: 'forbidLoops' } },
      { input: null, expected: '', description: 'não usa Math.max', mode: 'ast', astRule: { kind: 'forbidMethod', name: 'max' } },
    ],
  },
  {
    kind: 'challenge',
    title: 'R.8 Inverter uma string (sem .reverse(), sem loop)',
    concept:
      'Junte a ÚLTIMA letra com a string invertida do RESTO (tudo menos a última letra). Nada de `.split("").reverse().join("")` nem `for`. Exemplo análogo (primeira metade de uma string):',
    exampleCode: 'function ultimaLetra(t) {\n  if (t.length === 0) return ""\n  return t[t.length - 1]\n}',
    vocabulary: ['recursão', '.slice()', 'concatenação'],
    difficulty: 'hard',
    baseXp: 35,
    description: 'Escreva `inverterRec(texto)` (recursiva, SEM for/while, SEM .reverse()) que retorna o texto invertido. Ex.: "abc" -> "cba".',
    starterCode: 'function inverterRec(texto) {\n  // escreva seu código aqui (recursivo, sem for/while, sem .reverse())\n}\n',
    targetFn: 'inverterRec',
    testCases: [
      { input: ['abc'], expected: 'cba', description: '"abc" -> "cba"' },
      { input: ['Codinhos'], expected: 'sohnidoC', description: '"Codinhos" -> "sohnidoC"' },
      { input: [''], expected: '', description: '"" -> ""' },
      { input: ['x'], expected: 'x', description: '"x" -> "x" (1 letra)' },
      { input: null, expected: '', description: 'usa recursão (chama a si mesma)', mode: 'ast', astRule: { kind: 'requireRecursion' } },
      { input: null, expected: '', description: 'resolve sem for/while/forEach', mode: 'ast', astRule: { kind: 'forbidLoops' } },
      { input: null, expected: '', description: 'não usa .reverse()', mode: 'ast', astRule: { kind: 'forbidMethod', name: 'reverse' } },
    ],
  },
  {
    kind: 'challenge',
    title: 'R.9 MDC de dois números (algoritmo de Euclides)',
    concept:
      'O **máximo divisor comum** (MDC) de dois números pode ser calculado com uma regra simples e antiga (Euclides, ~300 a.C.): `mdc(a, b) = mdc(b, a % b)`, até `b` chegar em 0 — aí o MDC é o `a` daquele momento. É recursão pura, direto da matemática.',
    exampleCode: '// ideia: mdc(12, 8)\n// mdc(12, 8) = mdc(8, 12 % 8) = mdc(8, 4)\n// mdc(8, 4)  = mdc(4, 8 % 4)  = mdc(4, 0)\n// b chegou em 0 -> resposta é a = 4',
    vocabulary: ['recursão', '%', 'algoritmo de Euclides'],
    difficulty: 'hard',
    baseXp: 35,
    description: 'Escreva `mdcRec(a, b)` (recursiva, SEM for/while) usando o algoritmo de Euclides: se b for 0, o MDC é a; senão, mdc(a,b) = mdc(b, a % b).',
    starterCode: 'function mdcRec(a, b) {\n  // escreva seu código aqui (recursivo, sem for/while)\n}\n',
    targetFn: 'mdcRec',
    testCases: [
      { input: [12, 8], expected: 4, description: 'mdc(12,8) = 4' },
      { input: [17, 5], expected: 1, description: 'mdc(17,5) = 1 (primos entre si)' },
      { input: [100, 75], expected: 25, description: 'mdc(100,75) = 25' },
      { input: null, expected: '', description: 'usa recursão (chama a si mesma)', mode: 'ast', astRule: { kind: 'requireRecursion' } },
      { input: null, expected: '', description: 'resolve sem for/while/forEach', mode: 'ast', astRule: { kind: 'forbidLoops' } },
    ],
  },
  {
    kind: 'challenge',
    title: 'R.10 Busca binária (recursiva)',
    concept:
      'Em uma lista JÁ ORDENADA, olhe o item do MEIO: se for o que procura, achou; se o alvo for menor, repita só na metade da esquerda; se for maior, repita só na metade da direita. A cada chamada a lista some pela metade — muito mais rápido que checar item por item.',
    exampleCode: '// buscaBin([10,20,30,40,50], 40)\n// meio = 30 (índice 2). 40 > 30 -> procura só em [40,50]\n// meio = 40 (índice 0 da metade) -> achou! índice original = 3',
    vocabulary: ['recursão', 'busca binária', 'lista ordenada', '.slice()'],
    difficulty: 'hard',
    baseXp: 35,
    description:
      'Escreva `buscaBinRec(lista, alvo)` (recursiva, SEM for/while) que retorna true se `alvo` está na `lista` (já ordenada crescente), ou false se não está.',
    starterCode: 'function buscaBinRec(lista, alvo) {\n  // escreva seu código aqui (recursivo, sem for/while)\n  // dica: se lista.length === 0, não achou\n}\n',
    targetFn: 'buscaBinRec',
    testCases: [
      { input: [[10, 20, 30, 40, 50], 40], expected: true, description: '40 está na lista' },
      { input: [[10, 20, 30, 40, 50], 25], expected: false, description: '25 não está na lista' },
      { input: [[1, 2, 3], 1], expected: true, description: 'primeiro item' },
      { input: [[], 5], expected: false, description: 'lista vazia -> false' },
      { input: null, expected: '', description: 'usa recursão (chama a si mesma)', mode: 'ast', astRule: { kind: 'requireRecursion' } },
      { input: null, expected: '', description: 'resolve sem for/while/forEach', mode: 'ast', astRule: { kind: 'forbidLoops' } },
    ],
  },
  {
    kind: 'lesson',
    title: 'Lição — Métodos de array em vez de loop (map/filter/reduce)',
    concept:
      '"Sem `for`" não significa SÓ recursão. Arrays em JS já têm métodos prontos que fazem a repetição por dentro, sem você escrever o loop:\n\n- `.map(fn)` transforma cada item e devolve uma lista nova.\n- `.filter(fn)` mantém só os itens que passam num teste.\n- `.reduce(fn, inicial)` junta a lista inteira num único valor (soma, produto, etc.).\n\nNos próximos desafios, use esses métodos em vez de `for`.',
    exampleCode: 'const numeros = [1, 2, 3, 4]\nconst dobrados = numeros.map((x) => x * 2)      // [2,4,6,8]\nconst pares = numeros.filter((x) => x % 2 === 0) // [2,4]\nconst soma = numeros.reduce((acc, x) => acc + x, 0) // 10',
    vocabulary: ['.map()', '.filter()', '.reduce()'],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: 'R.11 Dobrar valores com .map (sem for)',
    concept: 'Use `.map(fn)` para transformar cada item da lista, sem escrever nenhum `for`.',
    exampleCode: 'const triplos = [1, 2, 3].map((x) => x * 3) // [3,6,9]',
    vocabulary: ['.map()'],
    difficulty: 'medium',
    baseXp: 20,
    description: 'Escreva `dobrarLista(lista)` que retorna uma nova lista com cada valor dobrado, usando `.map` (sem for/while).',
    starterCode: 'function dobrarLista(lista) {\n  // use .map (sem for/while)\n}\n',
    targetFn: 'dobrarLista',
    testCases: [
      { input: [[1, 2, 3]], expected: [2, 4, 6], description: '[1,2,3] -> [2,4,6]' },
      { input: [[]], expected: [], description: '[] -> []' },
      { input: [[5, -2]], expected: [10, -4], description: '[5,-2] -> [10,-4]' },
      { input: null, expected: '', description: 'usa .map()', mode: 'ast', astRule: { kind: 'requireMethod', name: 'map' } },
      { input: null, expected: '', description: 'resolve sem for/while/forEach', mode: 'ast', astRule: { kind: 'forbidLoops' } },
    ],
  },
  {
    kind: 'challenge',
    title: 'R.12 Filtrar pares com .filter (sem for)',
    concept: 'Use `.filter(fn)` para manter só os itens que passam num teste, sem `for`.',
    exampleCode: 'const positivos = [3, -1, 5, -2].filter((x) => x > 0) // [3,5]',
    vocabulary: ['.filter()'],
    difficulty: 'medium',
    baseXp: 20,
    description: 'Escreva `apenasPares(lista)` que retorna só os números pares, usando `.filter` (sem for/while).',
    starterCode: 'function apenasPares(lista) {\n  // use .filter (sem for/while)\n}\n',
    targetFn: 'apenasPares',
    testCases: [
      { input: [[1, 2, 3, 4, 5, 6]], expected: [2, 4, 6], description: '[1..6] -> [2,4,6]' },
      { input: [[1, 3, 5]], expected: [], description: 'só ímpares -> []' },
      { input: [[]], expected: [], description: '[] -> []' },
      { input: null, expected: '', description: 'usa .filter()', mode: 'ast', astRule: { kind: 'requireMethod', name: 'filter' } },
      { input: null, expected: '', description: 'resolve sem for/while/forEach', mode: 'ast', astRule: { kind: 'forbidLoops' } },
    ],
  },
  {
    kind: 'challenge',
    title: 'R.13 Somar com .reduce (sem for)',
    concept: '`.reduce(fn, inicial)` percorre a lista acumulando um resultado. Cada volta recebe o acumulado até agora e o item atual.',
    exampleCode: 'const produto = [1, 2, 3, 4].reduce((acc, x) => acc * x, 1) // 24',
    vocabulary: ['.reduce()', 'acumulador'],
    difficulty: 'medium',
    baseXp: 25,
    description: 'Escreva `somarLista(lista)` que retorna a soma de todos os valores, usando `.reduce` (sem for/while). Lista vazia soma 0.',
    starterCode: 'function somarLista(lista) {\n  // use .reduce (sem for/while)\n}\n',
    targetFn: 'somarLista',
    testCases: [
      { input: [[1, 2, 3, 4]], expected: 10, description: '[1,2,3,4] -> 10' },
      { input: [[]], expected: 0, description: '[] -> 0' },
      { input: [[-5, 5, 10]], expected: 10, description: '[-5,5,10] -> 10' },
      { input: null, expected: '', description: 'usa .reduce()', mode: 'ast', astRule: { kind: 'requireMethod', name: 'reduce' } },
      { input: null, expected: '', description: 'resolve sem for/while/forEach', mode: 'ast', astRule: { kind: 'forbidLoops' } },
    ],
  },
  {
    kind: 'challenge',
    title: 'R.14 [Bônus] Torres de Hanói',
    concept:
      'Desafio clássico: mova `n` discos de um pino para outro, um de cada vez, sem nunca colocar um disco maior sobre um menor. O número MÍNIMO de movimentos segue uma regra recursiva: para mover `n` discos, primeiro move `n-1` discos para o pino auxiliar, move o maior disco sozinho, depois move os `n-1` de volta sobre ele — daí `hanoi(n) = 2 × hanoi(n-1) + 1`.',
    exampleCode: '// hanoi(1) = 1 (move o disco direto)\n// hanoi(2) = 2*hanoi(1) + 1 = 3\n// hanoi(3) = 2*hanoi(2) + 1 = 7',
    vocabulary: ['recursão', 'Torres de Hanói'],
    difficulty: 'hard',
    baseXp: 40,
    description: 'Escreva `hanoiRec(n)` (recursiva, SEM for/while) que retorna o número mínimo de movimentos para resolver a Torre de Hanói com `n` discos. Caso base: hanoiRec(1) = 1.',
    starterCode: 'function hanoiRec(n) {\n  // escreva seu código aqui (recursivo, sem for/while)\n}\n',
    targetFn: 'hanoiRec',
    testCases: [
      { input: [1], expected: 1, description: '1 disco -> 1 movimento' },
      { input: [3], expected: 7, description: '3 discos -> 7 movimentos' },
      { input: [5], expected: 31, description: '5 discos -> 31 movimentos' },
      { input: null, expected: '', description: 'usa recursão (chama a si mesma)', mode: 'ast', astRule: { kind: 'requireRecursion' } },
      { input: null, expected: '', description: 'resolve sem for/while/forEach', mode: 'ast', astRule: { kind: 'forbidLoops' } },
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
      .values({ slug: TRAIL_SLUG, title: TRAIL_TITLE, description: TRAIL_DESC, language: 'javascript', order: 30 })
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
      // Lição = módulo sem desafio. Remove qualquer desafio que exista neste módulo.
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
