/**
 * Seed da trilha "Python: Módulos, Ferramentas e Algoritmos" no CATÁLOGO
 * GLOBAL (tenant_id = NULL). Trilha 10/10 — CAPSTONE, pré-requisito: trilhas
 * 1-9. Ver docs/trilha-python-10-modulos-e-algoritmos.md.
 *
 * Execução: pnpm --filter @codinhos/api db:seed:python-10
 *
 * Idempotente e atualizável, mesmo padrão do seed-trilha-js.ts.
 *
 * DUAS notas de gap importantes:
 *
 * 1. G6 (allowlist de `import`, doc mestre) — o runner Python ATUAL não
 *    implementa nenhum bloqueio de import (não existe curadoria tipo
 *    SAFE_GLOBALS do runner JS para módulos Python ainda). `math`, `random` e
 *    `string` funcionam hoje sem restrição alguma — o que também significa
 *    que nada IMPEDE um aluno de tentar `import os`/`subprocess` por conta
 *    própria; ficou fora do currículo por design, mas não está tecnicamente
 *    bloqueado. Registrar como pendência de hardening antes de abrir a
 *    plataforma pra fora (fora do escopo desta rodada de conteúdo).
 *
 * 2. Determinismo com `random` (módulo 10.2) — o desenho original
 *    (`docs/trilha-python-10-modulos-e-algoritmos.md`) previa o RUNNER DE
 *    TESTE fixando `random.seed(...)` antes de chamar a função do aluno, sem
 *    o aluno saber disso. O runner atual (`packages/runner-python`) não tem
 *    esse hook — só chama a função com os args do `input`. Adaptado: a
 *    semente vira um PARÂMETRO explícito da função (`dado(a, b, semente)`),
 *    o que também é reproduzível e ainda ensina `random.seed`. Os valores
 *    esperados (`6`, `2`, `15`) foram gerados rodando Python 3.10 local — não
 *    foi possível confirmar contra o Pyodide/CPython 3.14 real (sandbox sem
 *    acesso a Pyodide nesta sessão); o algoritmo do módulo `random`
 *    (Mersenne Twister com a mesma seed) é estável entre versões do CPython,
 *    mas isso fica como ÚNICO ponto de atenção pra validar no navegador.
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

const TRAIL_SLUG = 'python-modulos-e-algoritmos'
const TRAIL_TITLE = 'Python: Módulos, Ferramentas e Algoritmos'
const TRAIL_DESC =
  'Biblioteca padrão curada (math, random, string), busca linear e binária iterativa, bubble sort por dentro, e um projeto livre para fechar. Capstone da sequência Python — pré-requisito: todas as trilhas anteriores.'

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
  validationModeOverride?: 'auto' | 'auto_review' | 'manual'
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
    title: 'Biblioteca padrão: por que não reinventar a roda',
    concept:
      'Python já vem com módulos prontos pra tarefas comuns — você só precisa `import`. O Codinhos libera três nesta trilha: `math` (matemática), `random` (aleatoriedade) e `string` (texto). Lembra de `import functools` (7.8)? É o mesmo mecanismo.',
    exampleCode: 'import math\nprint(math.sqrt(16))  # 4.0',
    vocabulary: ['import', 'biblioteca padrão'],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'lesson',
    title: '`math`: `sqrt`, `floor`, `ceil`, `pi`',
    concept: '`math.sqrt(x)` raiz quadrada. `math.floor(x)` arredonda pra baixo, `math.ceil(x)` pra cima. `math.pi` é o valor de π pronto (mais preciso que digitar 3.14).',
    exampleCode: 'import math\nprint(math.sqrt(9))    # 3.0\nprint(math.floor(4.7)) # 4\nprint(math.ceil(4.1))  # 5',
    vocabulary: ['math.sqrt()', 'math.floor()', 'math.ceil()', 'math.pi'],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: '10.1 Hipotenusa de um triângulo',
    concept: 'Teorema de Pitágoras: `hipotenusa = math.sqrt(a**2 + b**2)`.',
    exampleCode: 'import math\ndef diagonal_quadrado(lado):\n    return math.sqrt(2) * lado',
    vocabulary: ['math.sqrt()'],
    difficulty: 'medium',
    baseXp: 20,
    description: 'Escreva `hipotenusa(a, b)`: retorna a hipotenusa de um triângulo retângulo com catetos `a` e `b`, usando `math.sqrt`.',
    starterCode: 'import math\n\ndef hipotenusa(a, b):\n    pass\n',
    targetFn: 'hipotenusa',
    testCases: [
      { input: [3, 4], expected: 5, description: '3-4-5 (triângulo clássico)' },
      { input: [6, 8], expected: 10, description: '6-8-10' },
      { input: [1, 1], expected: 1.414, description: 'catetos iguais (irracional)', matcher: 'approx', tolerance: 0.001 },
    ],
  },
  {
    kind: 'lesson',
    title: '`random`: números e escolhas aleatórias — e por que testar isso é diferente',
    concept:
      '`random.randint(a, b)` sorteia um inteiro entre `a` e `b` (incluindo os dois). `random.choice(lista)` sorteia um item da lista. Problema: se o resultado é aleatório, como TESTAR automaticamente? A solução é `random.seed(numero)` — fixa o "ponto de partida" do sorteio, tornando o resultado sempre o MESMO pra aquela semente. É só para teste; num programa de verdade você não fixaria a semente.',
    exampleCode: 'import random\nrandom.seed(1)\nprint(random.randint(1, 6))  # sempre o mesmo número, por causa da seed(1)',
    vocabulary: ['random.randint()', 'random.choice()', 'random.seed()'],
    difficulty: 'medium',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: '10.2 Dado sorteado dentro de uma faixa',
    concept: 'Chame `random.seed(semente)` ANTES de sortear, pra o resultado ser reproduzível nos testes.',
    exampleCode: 'import random\ndef moeda(semente):\n    random.seed(semente)\n    return random.choice(["cara", "coroa"])',
    vocabulary: ['random.randint()', 'random.seed()'],
    difficulty: 'medium',
    baseXp: 20,
    description: 'Escreva `dado(a, b, semente)`: chama `random.seed(semente)` e retorna `random.randint(a, b)`.',
    starterCode: 'import random\n\ndef dado(a, b, semente):\n    pass\n',
    targetFn: 'dado',
    testCases: [
      { input: [1, 6, 42], expected: 6, description: 'faixa 1-6, seed 42' },
      { input: [1, 6, 1], expected: 2, description: 'faixa 1-6, seed 1' },
      { input: [10, 20, 7], expected: 15, description: 'faixa 10-20, seed 7' },
    ],
  },
  {
    kind: 'lesson',
    title: '`string`: alfabetos prontos, e convertendo letra ↔ posição',
    concept: '`string.ascii_lowercase` já é a string `"abcdefghijklmnopqrstuvwxyz"` pronta. `ord(letra)` converte uma letra pro código numérico dela (tabela Unicode); `chr(numero)` faz o caminho inverso. Esse par é o que permite "fazer conta" com letras.',
    exampleCode: 'print(ord("a"))   # 97\nprint(chr(97))    # a\nprint(chr(ord("a") + 1))  # b',
    vocabulary: ['string.ascii_lowercase', 'ord()', 'chr()'],
    difficulty: 'medium',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: '10.3 Cifra de César',
    concept:
      'Desloque cada letra `deslocamento` posições no alfabeto: `chr((ord(letra) - base + deslocamento) % 26 + base)`, onde `base` é `ord("a")` ou `ord("A")` dependendo do caso. O `% 26` faz "dar a volta" no fim do alfabeto (de `z` volta pra `a`). Deixe espaços e pontuação como estão.',
    exampleCode: 'letra = "z"\nbase = ord("a")\nnova = chr((ord(letra) - base + 1) % 26 + base)\nprint(nova)  # a (deu a volta)',
    vocabulary: ['ord()', 'chr()', '%'],
    difficulty: 'hard',
    baseXp: 30,
    description: 'Escreva `cifra_cesar(texto, deslocamento)`: desloca cada LETRA de `texto` em `deslocamento` posições no alfabeto (preservando maiúscula/minúscula), mantendo espaços e pontuação inalterados.',
    starterCode: 'def cifra_cesar(texto, deslocamento):\n    pass\n',
    targetFn: 'cifra_cesar',
    testCases: [
      { input: ['abc', 1], expected: 'bcd', description: '"abc" +1' },
      { input: ['xyz', 3], expected: 'abc', description: '"xyz" +3 (dá a volta)' },
      { input: ['Hello, World!', 3], expected: 'Khoor, Zruog!', description: 'com maiúscula e pontuação' },
    ],
  },
  {
    kind: 'lesson',
    title: 'Busca linear: procurando item por item',
    concept: 'A forma mais simples de buscar: percorra a lista item por item até achar (ou chegar ao fim sem achar). Você já sabe fazer isso com `in` (4.4) — aqui, em vez de só `True`/`False`, queremos a POSIÇÃO onde está.',
    exampleCode: 'lista = [10, 20, 30]\nfor i in range(len(lista)):\n    if lista[i] == 20:\n        print(f"achei no índice {i}")',
    vocabulary: ['busca linear'],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: '10.4 Índice de um item na lista (busca linear)',
    concept: 'Percorra com `for i in range(len(lista))`; se `lista[i] == alvo`, retorne `i`. Se o loop terminar sem achar, retorne `-1`.',
    exampleCode: 'def existe(lista, alvo):\n    for i in range(len(lista)):\n        if lista[i] == alvo:\n            return True\n    return False',
    vocabulary: ['busca linear'],
    difficulty: 'medium',
    baseXp: 20,
    description: 'Escreva `indice_linear(lista, alvo)` (sem usar `.index()`): retorna a posição de `alvo` na lista, ou `-1` se não estiver lá.',
    starterCode: 'def indice_linear(lista, alvo):\n    pass\n',
    targetFn: 'indice_linear',
    testCases: [
      { input: [[10, 20, 30], 20], expected: 1, description: 'encontra no meio' },
      { input: [[10, 20, 30], 99], expected: -1, description: 'não encontra' },
      { input: [[5], 5], expected: 0, description: 'lista de 1 item' },
    ],
  },
  {
    kind: 'lesson',
    title: 'Busca binária: dividir para vencer, agora sem recursão',
    concept: 'Você já fez busca binária RECURSIVA na trilha 8 (R.10). O mesmo algoritmo dá pra escrever com `while` e dois "ponteiros" (`inicio`/`fim`) em vez de chamar a função de novo — mesma ideia, outro jeito de repetir.',
    exampleCode: 'inicio, fim = 0, len(lista) - 1\nwhile inicio <= fim:\n    meio = (inicio + fim) // 2\n    # ...',
    vocabulary: ['busca binária', 'while'],
    difficulty: 'medium',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: '10.5 Busca binária iterativa',
    concept: '`inicio = 0`, `fim = len(lista) - 1`. Enquanto `inicio <= fim`: calcule `meio`, compare, e mova `inicio` ou `fim` pra "cortar" a metade errada.',
    exampleCode: 'def contar_ate_achar(lista, alvo):\n    passos = 0\n    inicio, fim = 0, len(lista) - 1\n    while inicio <= fim:\n        passos += 1\n        meio = (inicio + fim) // 2\n        if lista[meio] == alvo:\n            return passos\n        elif lista[meio] < alvo:\n            inicio = meio + 1\n        else:\n            fim = meio - 1\n    return passos',
    vocabulary: ['busca binária', 'while'],
    difficulty: 'hard',
    baseXp: 30,
    description: 'Escreva `busca_binaria_iterativa(lista, alvo)` (com `while`, sem recursão): `lista` já está ordenada. Retorna `True` se `alvo` está na lista, senão `False`.',
    starterCode: 'def busca_binaria_iterativa(lista, alvo):\n    pass\n',
    targetFn: 'busca_binaria_iterativa',
    testCases: [
      { input: [[1, 3, 5, 7, 9, 11], 7], expected: true, description: 'encontra 7' },
      { input: [[1, 3, 5, 7, 9, 11], 4], expected: false, description: '4 não está na lista' },
      { input: [[2, 4, 6, 8], 2], expected: true, description: 'encontra o primeiro' },
    ],
  },
  {
    kind: 'lesson',
    title: 'Ordenação: bubble sort passo a passo',
    concept:
      'Bubble sort compara VIZINHOS: se estão fora de ordem, troca os dois (`lista[i], lista[i+1] = lista[i+1], lista[i]` — o desempacotamento da trilha 5, usado ao contrário, pra trocar). Repete isso várias vezes até não precisar trocar mais nada. É "ingênuo" (existem jeitos mais rápidos — por isso Python já tem `.sort()`/`sorted()` prontos, trilha 4), mas ótimo pra entender como ordenação funciona por dentro.',
    exampleCode: 'a, b = 1, 2\na, b = b, a  # troca os dois: a=2, b=1',
    vocabulary: ['bubble sort', 'troca de vizinhos'],
    difficulty: 'medium',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: '10.6 Bubble sort',
    concept: 'Dois `for` aninhados: o de fora repete várias "passadas"; o de dentro compara cada par de vizinhos e troca se estiverem fora de ordem.',
    exampleCode: 'def tem_par_fora_de_ordem(lista):\n    for i in range(len(lista) - 1):\n        if lista[i] > lista[i + 1]:\n            return True\n    return False',
    vocabulary: ['bubble sort', 'for aninhado'],
    difficulty: 'hard',
    baseXp: 30,
    description: 'Escreva `bubble_sort(lista)` (sem `.sort()`/`sorted()`): ordena a lista do menor pro maior usando o algoritmo bubble sort (comparar e trocar vizinhos), e a retorna.',
    starterCode: 'def bubble_sort(lista):\n    pass\n',
    targetFn: 'bubble_sort',
    testCases: [
      { input: [[5, 3, 8, 1, 2]], expected: [1, 2, 3, 5, 8], description: '5 valores' },
      { input: [[]], expected: [], description: 'lista vazia' },
      { input: [[1]], expected: [1], description: '1 valor' },
    ],
  },
  {
    kind: 'lesson',
    title: 'Pensando em desempenho (sem fórmula, só intuição)',
    concept:
      'Compare os três algoritmos que você acabou de ver: busca linear olha item por item (pode ter que ver a lista inteira); busca binária corta a lista pela metade a cada passo (bem mais rápida numa lista ordenada e grande); bubble sort compara MUITOS pares pra ordenar uma lista (fica lento em listas grandes). Não precisa de fórmula pra perceber: mais itens custam mais passos, mas cada algoritmo "gasta" de um jeito diferente.',
    exampleCode: '# intuição: dobrar o tamanho da lista...\n# busca linear: pode dobrar os passos\n# busca binária: só adiciona ~1 passo a mais\n# bubble sort: fica MUITO mais lento (não só dobra)',
    vocabulary: ['desempenho', 'busca linear vs. binária vs. bubble sort'],
    difficulty: 'medium',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: '10.7 [Fecha a trilha — projeto livre] Seu programa em Python',
    concept: 'Sem gabarito único — combine o que aprendeu nas 10 trilhas do seu jeito. Ideias: uma agenda de contatos (dict, trilha 5), um jogo de adivinhação com `random` (esta trilha), um sistema de cadastro com classes (trilha 9), uma calculadora com menu (trilha 3).',
    exampleCode: '# use o que quiser: função, lista, dict, classe, random, recursão...',
    vocabulary: ['projeto livre'],
    difficulty: 'hard',
    baseXp: 50,
    description:
      'Escreva um programa Python livre que combine pelo menos 3 conceitos vistos nas trilhas anteriores (ex.: função + lista + dict, ou classe + random, ou recursão + string). Capriche — seu(sua) gestor(a) vai revisar e aprovar.',
    starterCode: '# seu programa aqui\n',
    validationModeOverride: 'manual',
    testCases: [],
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
      .values({ slug: TRAIL_SLUG, title: TRAIL_TITLE, description: TRAIL_DESC, language: 'python', order: 190 })
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
        validationModeOverride: m.validationModeOverride ?? null,
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
          validationModeOverride: m.validationModeOverride ?? null,
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
