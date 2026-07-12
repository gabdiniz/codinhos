/**
 * Seed da trilha "Python: Listas e Strings" no CATÁLOGO GLOBAL (tenant_id =
 * NULL). Trilha 4/10 — pré-requisito: trilhas 1-3. Ver
 * docs/trilha-python-04-listas-e-strings.md (desenho módulo a módulo).
 *
 * Execução: pnpm --filter @codinhos/api db:seed:python-04
 *
 * Idempotente e atualizável, mesmo padrão do seed-trilha-js.ts. Regra de
 * `input` herdada de JS: quando a função espera UMA lista como único
 * parâmetro, `input` precisa ser `[[...]]` (lista dentro de lista) — senão o
 * motor espalha os elementos como argumentos separados. Ver [[trilha-js-catalogo]].
 *
 * Nota sobre o módulo 4.6 (pegadinha do parâmetro padrão mutável): o desenho
 * original pedia "function-call chamando a função 2x, resultado não deve
 * vazar entre chamadas" — mas cada RunRequest do runner roda com globals
 * ISOLADOS por execução (ver packages/runner-python/src/python-exec.ts), e
 * function-call chama o alvo só UMA vez por teste, então duas RunRequests
 * separadas nunca veriam o bug (ele só aparece quando o MESMO objeto de
 * função é chamado 2x na mesma execução). Adaptado para `mode:'stdout'`: o
 * próprio código do aluno chama a função duas vezes e imprime os dois
 * resultados — testável de verdade, mesmo efeito pedagógico.
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

const TRAIL_SLUG = 'python-listas-e-strings'
const TRAIL_TITLE = 'Python: Listas e Strings'
const TRAIL_DESC =
  'Guardar várias coisas numa lista, percorrer, indexar, fatiar (slice), métodos comuns (append/remove/sort) e os mesmos conceitos aplicados a strings (indexação, slicing, métodos). Pré-requisito: Funções.'

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
    title: 'Ponte: guardando várias coisas de uma vez',
    concept:
      'Até aqui, cada variável guardava UM valor. Mas e se você precisar guardar os nomes de 30 alunos de uma turma? Criar `nome1`, `nome2`, `nome3`... não escala. Uma **lista** guarda vários valores numa única variável.',
    exampleCode: 'alunos = ["Ana", "Bruno", "Carla"]\nprint(alunos)',
    vocabulary: ['list'],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'lesson',
    title: 'Criar e indexar listas',
    concept: '`lista = [1, 2, 3]` cria uma lista. Acesse um item pelo índice: `lista[0]` é o PRIMEIRO (índices começam em 0!). Índice negativo conta do fim: `lista[-1]` é o ÚLTIMO.',
    exampleCode: 'cores = ["vermelho", "verde", "azul"]\nprint(cores[0])   # vermelho\nprint(cores[-1])  # azul',
    vocabulary: ['list', '[]', 'índice', 'índice negativo'],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: '4.1 Primeiro e último item',
    concept: 'Use `lista[0]` e `lista[-1]`.',
    exampleCode: 'def do_meio(lista):\n    return lista[1]',
    vocabulary: ['índice', 'índice negativo'],
    difficulty: 'easy',
    baseXp: 10,
    description: 'Escreva `primeiro_e_ultimo(lista)` que retorna `[primeiro_item, ultimo_item]` da lista recebida.',
    starterCode: 'def primeiro_e_ultimo(lista):\n    pass\n',
    targetFn: 'primeiro_e_ultimo',
    testCases: [
      { input: [[1, 2, 3, 4]], expected: [1, 4], description: '[1,2,3,4]' },
      { input: [[10, 20, 30]], expected: [10, 30], description: '[10,20,30]' },
      { input: [[5]], expected: [5, 5], description: 'lista de 1 item' },
    ],
  },
  {
    kind: 'lesson',
    title: 'Percorrer lista com `for`',
    concept: '`for item in lista:` passa por cada elemento da lista, um de cada vez — mesmo `for` que você já usa com `range()`, mas agora percorrendo os VALORES da lista direto.',
    exampleCode: 'notas = [8, 9, 7]\nfor nota in notas:\n    print(nota)',
    vocabulary: ['for item in lista'],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: '4.2 Somar todos os valores',
    concept: 'Um acumulador que começa em 0 e soma cada item ao percorrer a lista com `for`.',
    exampleCode: 'def contar_positivos(lista):\n    total = 0\n    for x in lista:\n        if x > 0:\n            total += 1\n    return total',
    vocabulary: ['for item in lista', 'acumulador'],
    difficulty: 'medium',
    baseXp: 15,
    description: 'Escreva `somar(lista)` que retorna a soma de todos os números da lista (0 se a lista for vazia).',
    starterCode: 'def somar(lista):\n    pass\n',
    targetFn: 'somar',
    testCases: [
      { input: [[1, 2, 3]], expected: 6, description: '[1,2,3]' },
      { input: [[]], expected: 0, description: 'lista vazia' },
      { input: [[10, 20, 30, 40]], expected: 100, description: '[10,20,30,40]' },
    ],
  },
  {
    kind: 'lesson',
    title: '`len()`, `in`, `.append()`',
    concept: '`len(lista)` diz quantos itens tem. `valor in lista` pergunta "esse valor está aí dentro?" (retorna `bool`). `lista.append(valor)` ADICIONA um item no final da lista (muda a lista original).',
    exampleCode: 'nomes = ["Ana"]\nnomes.append("Bruno")\nprint(len(nomes))       # 2\nprint("Ana" in nomes)   # True',
    vocabulary: ['len()', 'in', '.append()'],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: '4.3 Quantos itens?',
    concept: 'Use `len(lista)`.',
    exampleCode: 'def esta_vazia(lista):\n    return len(lista) == 0',
    vocabulary: ['len()'],
    difficulty: 'easy',
    baseXp: 10,
    description: 'Escreva `quantidade(lista)` que retorna quantos itens a lista tem.',
    starterCode: 'def quantidade(lista):\n    pass\n',
    targetFn: 'quantidade',
    testCases: [
      { input: [[1, 2, 3]], expected: 3, description: '[1,2,3]' },
      { input: [[]], expected: 0, description: 'lista vazia' },
      { input: [[9, 9]], expected: 2, description: '[9,9]' },
    ],
  },
  {
    kind: 'challenge',
    title: '4.4 Já está na lista?',
    concept: 'Use o operador `in`, que já retorna `True`/`False` sozinho.',
    exampleCode: 'def tem_negativo(lista):\n    for x in lista:\n        if x < 0:\n            return True\n    return False',
    vocabulary: ['in'],
    difficulty: 'easy',
    baseXp: 10,
    description: 'Escreva `contem(lista, valor)` que retorna `True` se `valor` está em `lista`, senão `False`.',
    starterCode: 'def contem(lista, valor):\n    pass\n',
    targetFn: 'contem',
    testCases: [
      { input: [[1, 2, 3], 2], expected: true, description: '2 está em [1,2,3]' },
      { input: [[1, 2, 3], 9], expected: false, description: '9 não está em [1,2,3]' },
      { input: [[], 1], expected: false, description: 'lista vazia' },
    ],
  },
  {
    kind: 'challenge',
    title: '4.5 Monte a lista de pares até N',
    concept: 'Reabre o par/ímpar da trilha 2 (módulo 2.4) — mas em vez de imprimir, GUARDE cada par numa lista nova com `.append()`.',
    exampleCode: 'def multiplos_de_3_ate(n):\n    resultado = []\n    for i in range(1, n + 1):\n        if i % 3 == 0:\n            resultado.append(i)\n    return resultado',
    vocabulary: ['.append()', 'for + if'],
    difficulty: 'medium',
    baseXp: 20,
    description: 'Escreva `pares_ate(n)`: retorna uma lista com todos os números pares de 1 até `n` (incluindo `n`).',
    starterCode: 'def pares_ate(n):\n    pass\n',
    targetFn: 'pares_ate',
    testCases: [
      { input: [10], expected: [2, 4, 6, 8, 10], description: 'n=10' },
      { input: [5], expected: [2, 4], description: 'n=5' },
      { input: [1], expected: [], description: 'n=1 (nenhum par)' },
    ],
  },
  {
    kind: 'lesson',
    title: 'Função + lista: a pegadinha do parâmetro padrão',
    concept:
      '**Cuidado:** `def adicionar(item, historico=[]):` parece inofensivo, mas o `[]` padrão é criado **UMA VEZ SÓ**, quando a função é definida — não a cada chamada! Se você faz `.append()` nele, o resultado "vaza" de uma chamada para a próxima (bug clássico de Python).\n\nA correção: use `historico=None` como padrão, e dentro da função: `if historico is None: historico = []` — assim uma lista NOVA é criada a cada chamada que não recebeu histórico.',
    exampleCode:
      '# ERRADO: def adicionar(item, historico=[]):\n#     historico.append(item)\n#     return historico\n\n# CERTO:\ndef adicionar(item, historico=None):\n    if historico is None:\n        historico = []\n    historico.append(item)\n    return historico',
    vocabulary: ['parâmetro padrão mutável', 'None', 'is None'],
    difficulty: 'medium',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: '4.6 [Pegadinha guiada] Corrija a função com padrão mutável',
    concept: 'Use o padrão `historico=None` + `if historico is None: historico = []` mostrado na lição.',
    exampleCode: 'def marcar(item, vistos=None):\n    if vistos is None:\n        vistos = []\n    vistos.append(item)\n    return vistos',
    vocabulary: ['None', 'is None'],
    difficulty: 'medium',
    baseXp: 20,
    description:
      'Escreva `adicionar_item(item, historico=None)` (corrigida, sem o padrão mutável) e, depois da função, chame-a duas vezes SEM passar `historico` — `print(adicionar_item("a"))` e `print(adicionar_item("b"))`. O segundo resultado não pode conter o item da primeira chamada.',
    starterCode: 'def adicionar_item(item, historico=None):\n    pass\n\nprint(adicionar_item("a"))\nprint(adicionar_item("b"))\n',
    testCases: [
      { input: null, expected: "['a']\n['b']", description: 'duas chamadas seguidas, sem vazar item entre elas', mode: 'stdout' },
    ],
  },
  {
    kind: 'lesson',
    title: 'Slicing: fatias de lista',
    concept: '`lista[inicio:fim]` pega uma FATIA (sem incluir o índice `fim`). `lista[:3]` é "do começo até o índice 3". `lista[::-1]` inverte a lista inteira (passo -1).',
    exampleCode: 'numeros = [10, 20, 30, 40, 50]\nprint(numeros[1:3])   # [20, 30]\nprint(numeros[:2])    # [10, 20]\nprint(numeros[::-1])  # [50, 40, 30, 20, 10]',
    vocabulary: ['slicing', '[:]', '[::-1]'],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: '4.7 Os três primeiros',
    concept: 'Use `lista[:3]`.',
    exampleCode: 'def dois_primeiros(lista):\n    return lista[:2]',
    vocabulary: ['slicing'],
    difficulty: 'easy',
    baseXp: 10,
    description: 'Escreva `tres_primeiros(lista)` que retorna os 3 primeiros itens (ou menos, se a lista for menor).',
    starterCode: 'def tres_primeiros(lista):\n    pass\n',
    targetFn: 'tres_primeiros',
    testCases: [
      { input: [[1, 2, 3, 4, 5]], expected: [1, 2, 3], description: '5 itens' },
      { input: [[1, 2]], expected: [1, 2], description: 'só 2 itens' },
      { input: [[]], expected: [], description: 'lista vazia' },
    ],
  },
  {
    kind: 'challenge',
    title: '4.8 Inverter uma lista (com slice)',
    concept: 'Use `lista[::-1]` — sem `for`, sem `.reverse()`, só slicing.',
    exampleCode: 'def ultimo_para_primeiro(lista):\n    return lista[::-1][0]',
    vocabulary: ['[::-1]'],
    difficulty: 'easy',
    baseXp: 10,
    description: 'Escreva `inverter(lista)` que retorna a lista invertida, usando `[::-1]`.',
    starterCode: 'def inverter(lista):\n    pass\n',
    targetFn: 'inverter',
    testCases: [
      { input: [[1, 2, 3]], expected: [3, 2, 1], description: '[1,2,3]' },
      { input: [[5]], expected: [5], description: '1 item' },
      { input: [[]], expected: [], description: 'lista vazia' },
    ],
  },
  {
    kind: 'lesson',
    title: 'Métodos que modificam vs. que não modificam',
    concept: '`.append()`, `.remove()`, `.sort()` MUDAM a lista original (não retornam uma nova). Já `sorted(lista)` DEVOLVE uma lista nova ordenada, sem mudar a original — útil quando você não quer perder a ordem antiga.',
    exampleCode: 'numeros = [3, 1, 2]\nordenados = sorted(numeros)\nprint(ordenados)  # [1, 2, 3]\nprint(numeros)    # [3, 1, 2] — não mudou!',
    vocabulary: ['mutação', 'sorted()'],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: '4.9 Remover um item',
    concept: '`.remove(valor)` remove a PRIMEIRA ocorrência de `valor` na lista.',
    exampleCode: 'def limpar_zeros(lista):\n    while 0 in lista:\n        lista.remove(0)\n    return lista',
    vocabulary: ['.remove()'],
    difficulty: 'medium',
    baseXp: 15,
    description: 'Escreva `remover(lista, valor)` que remove a primeira ocorrência de `valor` da lista e a retorna.',
    starterCode: 'def remover(lista, valor):\n    pass\n',
    targetFn: 'remover',
    testCases: [
      { input: [[1, 2, 3], 2], expected: [1, 3], description: 'remove o 2' },
      { input: [[5, 5, 5], 5], expected: [5, 5], description: 'remove só a primeira ocorrência' },
      { input: [[1, 2, 3], 3], expected: [1, 2], description: 'remove o último' },
    ],
  },
  {
    kind: 'challenge',
    title: '4.10 Ordenar números',
    concept: 'Use `sorted(lista)` para devolver uma lista nova ordenada.',
    exampleCode: 'def do_menor_pro_maior(lista):\n    return sorted(lista)',
    vocabulary: ['sorted()'],
    difficulty: 'easy',
    baseXp: 10,
    description: 'Escreva `ordenar(lista)` que retorna a lista ordenada do menor para o maior.',
    starterCode: 'def ordenar(lista):\n    pass\n',
    targetFn: 'ordenar',
    testCases: [
      { input: [[3, 1, 2]], expected: [1, 2, 3], description: '[3,1,2]' },
      { input: [[]], expected: [], description: 'lista vazia' },
      { input: [[5, 4, 4, 1]], expected: [1, 4, 4, 5], description: 'com repetidos' },
    ],
  },
  {
    kind: 'lesson',
    title: 'Strings são "quase" listas',
    concept: 'Uma string aceita indexação e slicing igual a uma lista: `palavra[0]`, `palavra[-1]`, `palavra[::-1]`, e até `for letra in palavra:`. A diferença: string é **imutável** (não dá pra fazer `palavra[0] = "X"`).',
    exampleCode: 'palavra = "python"\nprint(palavra[0])     # p\nprint(palavra[::-1])  # nohtyp\nfor letra in palavra:\n    print(letra)',
    vocabulary: ['string imutável'],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: '4.11 Primeira letra maiúscula (sem `.capitalize()`)',
    concept: 'Pegue a primeira letra com `[0]`, deixe maiúscula com `.upper()`, e junte com o resto (`[1:]`) usando `+`.',
    exampleCode: 'def ultima_letra_maiuscula(palavra):\n    return palavra[:-1] + palavra[-1].upper()',
    vocabulary: ['indexação de string', '.upper()'],
    difficulty: 'medium',
    baseXp: 15,
    description: 'Escreva `capitalizar(palavra)` que retorna a palavra com a primeira letra maiúscula (sem usar `.capitalize()` ou `.title()`).',
    starterCode: 'def capitalizar(palavra):\n    pass\n',
    targetFn: 'capitalizar',
    testCases: [
      { input: ['ana'], expected: 'Ana', description: '"ana"' },
      { input: ['python'], expected: 'Python', description: '"python"' },
    ],
  },
  {
    kind: 'challenge',
    title: '4.12 É palíndromo?',
    concept: 'Compare a palavra com ela mesma invertida (`palavra[::-1]`) — se forem iguais, é palíndromo.',
    exampleCode: 'def comeca_e_termina_igual(palavra):\n    return palavra[0] == palavra[-1]',
    vocabulary: ['[::-1]'],
    difficulty: 'medium',
    baseXp: 15,
    description: 'Escreva `eh_palindromo(palavra)` que retorna `True` se a palavra é igual lida de trás para frente, senão `False`.',
    starterCode: 'def eh_palindromo(palavra):\n    pass\n',
    targetFn: 'eh_palindromo',
    testCases: [
      { input: ['arara'], expected: true, description: '"arara"' },
      { input: ['python'], expected: false, description: '"python"' },
      { input: ['ovo'], expected: true, description: '"ovo"' },
    ],
  },
  {
    kind: 'lesson',
    title: 'Métodos de string úteis',
    concept: '`.upper()`/`.lower()` mudam maiúsculas/minúsculas. `.strip()` remove espaços das pontas. `.split()` quebra uma frase em lista de palavras (por espaço, por padrão). `.join()` faz o inverso: junta uma lista de textos com um separador — `"-".join(["a","b"])` vira `"a-b"`.',
    exampleCode: 'frase = "  o gato subiu  "\nprint(frase.strip())          # "o gato subiu"\nprint(frase.strip().split())  # [\'o\', \'gato\', \'subiu\']\nprint("-".join(["a", "b"]))   # "a-b"',
    vocabulary: ['.upper()', '.lower()', '.strip()', '.split()', '.join()'],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: '4.13 Contar palavras de uma frase',
    concept: '`.split()` sem argumento quebra por espaço; `len()` no resultado conta quantas palavras deu.',
    exampleCode: 'def primeira_palavra(frase):\n    return frase.split()[0]',
    vocabulary: ['.split()', 'len()'],
    difficulty: 'medium',
    baseXp: 15,
    description: 'Escreva `contar_palavras(frase)` que retorna quantas palavras a frase tem (separadas por espaço).',
    starterCode: 'def contar_palavras(frase):\n    pass\n',
    targetFn: 'contar_palavras',
    testCases: [
      { input: ['o gato subiu no telhado'], expected: 5, description: '5 palavras' },
      { input: ['ola'], expected: 1, description: '1 palavra' },
      { input: ['um dois'], expected: 2, description: '2 palavras' },
    ],
  },
  {
    kind: 'challenge',
    title: '4.14 [Fecha a trilha] Lista de compras formatada',
    concept: 'Percorra a lista com `for i in range(len(itens))` para ter o índice E o item juntos, e monte cada linha numerada com f-string.',
    exampleCode: 'def imprimir_ranking(nomes):\n    for i in range(len(nomes)):\n        print(f"{i + 1}º lugar: {nomes[i]}")',
    vocabulary: ['for + range(len())', 'f-string'],
    difficulty: 'hard',
    baseXp: 25,
    description: 'Escreva `lista_de_compras(itens)` que imprime cada item numerado, no formato `<numero>. <item>`, um por linha, começando em 1.',
    starterCode: 'def lista_de_compras(itens):\n    pass\n',
    targetFn: 'lista_de_compras',
    testCases: [
      { input: [['maçã', 'pão', 'leite']], expected: '1. maçã\n2. pão\n3. leite', description: '3 itens', mode: 'stdout' },
      { input: [['água']], expected: '1. água', description: '1 item', mode: 'stdout' },
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
      .values({ slug: TRAIL_SLUG, title: TRAIL_TITLE, description: TRAIL_DESC, language: 'python', order: 130 })
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
