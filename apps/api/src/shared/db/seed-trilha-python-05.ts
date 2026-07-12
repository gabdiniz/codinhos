/**
 * Seed da trilha "Python: Estruturas de Dados" no CATÁLOGO GLOBAL (tenant_id
 * = NULL). Trilha 5/10 — pré-requisito: trilhas 1-4. Ver
 * docs/trilha-python-05-estruturas-de-dados.md (desenho módulo a módulo).
 *
 * Execução: pnpm --filter @codinhos/api db:seed:python-05
 *
 * Idempotente e atualizável, mesmo padrão do seed-trilha-js.ts.
 *
 * Duas notas de correção em relação ao desenho original (achadas ao verificar
 * as soluções rodando Python de verdade, não só lidas):
 * 1. G3 do doc mestre (tupla vs. lista se perde no round-trip JSON) — nenhum
 *    teste aqui depende de distinguir tuple de list, `(x, y)` e `[x, y]`
 *    comparam igual, por design.
 * 2. Módulos 5.8/5.9 (`set` para remover duplicados / interseção): a ORDEM de
 *    iteração de um `set` em Python não é garantida — comparar a lista
 *    resultante direto contra uma ordem fixa seria um teste não-determinístico
 *    (poderia reprovar uma solução correta só por causa da ordem). Os dois
 *    desafios exigem explicitamente o resultado ORDENADO (`sorted(set(...))`),
 *    o que resolve o determinismo sem perder o conceito de `set`.
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

const TRAIL_SLUG = 'python-estruturas-de-dados'
const TRAIL_TITLE = 'Python: Estruturas de Dados'
const TRAIL_DESC =
  'Tupla (coleção que não muda), dicionário (chave→valor), set (sem repetição) e uma primeira noção de list comprehension. Pré-requisito: Listas e Strings.'

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
    title: 'Ponte: nem tudo precisa mudar, nem tudo é uma lista',
    concept:
      'Na trilha 4 você viu que listas são mutáveis (`.append()` muda a lista original). Nem sempre isso é o que você quer: às vezes um par de valores (como coordenadas) não deveria mudar depois de criado. E nem tudo é "uma sequência de itens" — às vezes você quer BUSCAR um valor por um NOME, não por posição. Chegou a hora de tupla e dicionário.',
    exampleCode: 'ponto = (3, 4)  # tupla: não muda depois de criada\npessoa = {"nome": "Ana"}  # dicionário: busca por chave',
    vocabulary: ['tuple', 'dict'],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'lesson',
    title: 'Tupla: uma lista que não muda',
    concept:
      '`(1, 2, 3)` cria uma tupla — parece lista (indexa igual: `tupla[0]`), mas é IMUTÁVEL: depois de criada, não dá pra adicionar, remover ou trocar itens. **Desempacotamento** tira os valores de uma vez: `a, b = (1, 2)` guarda `a = 1` e `b = 2`.',
    exampleCode: 'ponto = (3, 4)\nx, y = ponto\nprint(x, y)  # 3 4',
    vocabulary: ['tuple', '()', 'desempacotamento'],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: '5.1 Coordenadas x, y',
    concept: 'Retorne uma tupla com `(x, y)`.',
    exampleCode: 'def par(a, b):\n    return (a, b)',
    vocabulary: ['tuple'],
    difficulty: 'easy',
    baseXp: 10,
    description: 'Escreva `coordenadas(x, y)` que retorna a tupla `(x, y)`.',
    starterCode: 'def coordenadas(x, y):\n    pass\n',
    targetFn: 'coordenadas',
    testCases: [
      { input: [3, 4], expected: [3, 4], description: 'x=3, y=4' },
      { input: [0, 0], expected: [0, 0], description: 'x=0, y=0' },
    ],
  },
  {
    kind: 'challenge',
    title: '5.2 Desempacotar coordenadas',
    concept: 'Receba a tupla/lista de coordenadas e desempacote com `x, y = ponto`.',
    exampleCode: 'def eh_origem(ponto):\n    x, y = ponto\n    return x == 0 and y == 0',
    vocabulary: ['desempacotamento'],
    difficulty: 'medium',
    baseXp: 15,
    description: 'Escreva `soma_coordenadas(ponto)`: recebe uma tupla `(x, y)` e retorna `x + y`, usando desempacotamento.',
    starterCode: 'def soma_coordenadas(ponto):\n    pass\n',
    targetFn: 'soma_coordenadas',
    testCases: [
      { input: [[3, 4]], expected: 7, description: '(3, 4)' },
      { input: [[0, 5]], expected: 5, description: '(0, 5)' },
      { input: [[-2, 2]], expected: 0, description: '(-2, 2)' },
    ],
  },
  {
    kind: 'lesson',
    title: 'Dicionário: chave e valor',
    concept: '`{"nome": "Ana", "idade": 12}` guarda valores associados a CHAVES (não a posições). Acesse com `dic["chave"]`. Se a chave não existir, dá erro (`KeyError`) — `dic.get("chave")` é mais seguro: devolve `None` (ou um padrão que você escolher) em vez de quebrar.',
    exampleCode: 'pessoa = {"nome": "Ana", "idade": 12}\nprint(pessoa["nome"])          # Ana\nprint(pessoa.get("cidade"))    # None (não existe, mas não quebra)',
    vocabulary: ['dict', '{chave: valor}', '.get()'],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: '5.3 Idade da pessoa',
    concept: 'Acesse o valor de uma chave com `dic["chave"]`.',
    exampleCode: 'def nome_da_pessoa(pessoa):\n    return pessoa["nome"]',
    vocabulary: ['dict[chave]'],
    difficulty: 'easy',
    baseXp: 10,
    description: 'Escreva `idade_da_pessoa(pessoa)`: recebe um dicionário com a chave `"idade"` e retorna esse valor.',
    starterCode: 'def idade_da_pessoa(pessoa):\n    pass\n',
    targetFn: 'idade_da_pessoa',
    testCases: [
      { input: { nome: 'Ana', idade: 12 }, expected: 12, description: 'Ana, 12' },
      { input: { nome: 'Bruno', idade: 30 }, expected: 30, description: 'Bruno, 30' },
    ],
  },
  {
    kind: 'challenge',
    title: '5.4 Chave que talvez não exista',
    concept: '`dic.get(chave, padrao)` retorna `padrao` se `chave` não existir, sem quebrar o programa.',
    exampleCode: 'def cidade_ou_padrao(pessoa):\n    return pessoa.get("cidade", "não informada")',
    vocabulary: ['.get()'],
    difficulty: 'medium',
    baseXp: 15,
    description: 'Escreva `buscar_ou_padrao(dic, chave, padrao)`: retorna `dic.get(chave, padrao)`.',
    starterCode: 'def buscar_ou_padrao(dic, chave, padrao):\n    pass\n',
    targetFn: 'buscar_ou_padrao',
    testCases: [
      { input: [{ nome: 'Ana' }, 'nome', 'desconhecido'], expected: 'Ana', description: 'chave existe' },
      { input: [{ nome: 'Ana' }, 'idade', 0], expected: 0, description: 'chave não existe, usa padrão' },
    ],
  },
  {
    kind: 'lesson',
    title: 'Adicionar e percorrer dicionário',
    concept: '`dic["nova"] = valor` adiciona (ou atualiza) uma chave. Para percorrer tudo: `.items()` dá pares chave+valor, `.keys()` só as chaves, `.values()` só os valores.',
    exampleCode: 'pessoa = {"nome": "Ana"}\npessoa["idade"] = 12\nfor chave, valor in pessoa.items():\n    print(chave, valor)',
    vocabulary: ['.items()', '.keys()', '.values()'],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: '5.5 Cadastrar um novo item',
    concept: 'Use `dic[chave] = valor` e retorne o dicionário atualizado.',
    exampleCode: 'def atualizar_nome(pessoa, novo_nome):\n    pessoa["nome"] = novo_nome\n    return pessoa',
    vocabulary: ['dic[chave] = valor'],
    difficulty: 'easy',
    baseXp: 10,
    description: 'Escreva `cadastrar(dic, chave, valor)`: adiciona `chave: valor` ao dicionário e o retorna.',
    starterCode: 'def cadastrar(dic, chave, valor):\n    pass\n',
    targetFn: 'cadastrar',
    testCases: [
      { input: [{ a: 1 }, 'b', 2], expected: { a: 1, b: 2 }, description: 'adiciona b' },
      { input: [{}, 'x', 10], expected: { x: 10 }, description: 'dicionário vazio' },
    ],
  },
  {
    kind: 'challenge',
    title: '5.6 Imprimir cadastro completo',
    concept: 'Use `for chave, valor in dic.items():` e f-string para imprimir cada par, um por linha.',
    exampleCode: 'def imprimir_precos(precos):\n    for item, preco in precos.items():\n        print(f"{item}: R$ {preco}")',
    vocabulary: ['.items()', 'f-string'],
    difficulty: 'medium',
    baseXp: 15,
    description: 'Escreva `imprimir_cadastro(dic)`: para cada chave/valor do dicionário, imprime `<chave>: <valor>`, um por linha (na ordem em que foram inseridos).',
    starterCode: 'def imprimir_cadastro(dic):\n    pass\n',
    targetFn: 'imprimir_cadastro',
    testCases: [
      { input: [{ nome: 'Ana', idade: 12 }], expected: 'nome: Ana\nidade: 12', description: 'nome + idade', mode: 'stdout' },
    ],
  },
  {
    kind: 'lesson',
    title: 'Contar com dicionário',
    concept: 'Padrão clássico "contador": `dic[item] = dic.get(item, 0) + 1` — pega o valor atual (ou 0 se ainda não existir) e soma 1. Repetido dentro de um `for`, conta quantas vezes cada item aparece.',
    exampleCode: 'contagem = {}\nfor letra in "aab":\n    contagem[letra] = contagem.get(letra, 0) + 1\nprint(contagem)  # {\'a\': 2, \'b\': 1}',
    vocabulary: ['padrão contador'],
    difficulty: 'medium',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: '5.7 Contar letras de uma palavra',
    concept: 'Percorra a palavra com `for letra in palavra:` (igual você já fazia com listas) e aplique o padrão contador.',
    exampleCode: 'def contar_vogais_por_tipo(texto):\n    contagem = {}\n    for letra in texto:\n        if letra in "aeiou":\n            contagem[letra] = contagem.get(letra, 0) + 1\n    return contagem',
    vocabulary: ['padrão contador', 'for em string'],
    difficulty: 'medium',
    baseXp: 20,
    description: 'Escreva `contar_letras(palavra)`: retorna um dicionário `{letra: quantidade}` com quantas vezes cada letra aparece.',
    starterCode: 'def contar_letras(palavra):\n    pass\n',
    targetFn: 'contar_letras',
    testCases: [
      { input: ['banana'], expected: { b: 1, a: 3, n: 2 }, description: '"banana"' },
      { input: ['ovo'], expected: { o: 2, v: 1 }, description: '"ovo"' },
    ],
  },
  {
    kind: 'lesson',
    title: 'Set: coleção sem repetição',
    concept: '`{1, 2, 3}` cria um `set` — parecido com dict mas sem `:` (só valores), e nunca tem repetição (cada valor aparece uma vez só). `set(lista)` converte uma lista em set (removendo duplicados); `list(set(...))` volta a virar lista.',
    exampleCode: 'numeros = [1, 2, 2, 3, 3, 3]\nunicos = set(numeros)\nprint(unicos)  # {1, 2, 3} (sem repetição)',
    vocabulary: ['set', '.add()', 'list()/set()'],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: '5.8 Remover duplicados de uma lista',
    concept: 'Converta a lista em `set` (remove duplicados) e de volta em lista com `sorted(...)`, para o resultado vir sempre na mesma ordem (a ordem de um `set` sozinho não é garantida).',
    exampleCode: 'def tem_duplicado(lista):\n    return len(lista) != len(set(lista))',
    vocabulary: ['set()', 'sorted()'],
    difficulty: 'medium',
    baseXp: 20,
    description: 'Escreva `remover_duplicados(lista)`: retorna os valores únicos da lista, SEM repetição, ORDENADOS do menor para o maior.',
    starterCode: 'def remover_duplicados(lista):\n    pass\n',
    targetFn: 'remover_duplicados',
    testCases: [
      { input: [[3, 1, 2, 1, 3]], expected: [1, 2, 3], description: 'com repetidos' },
      { input: [[]], expected: [], description: 'lista vazia' },
      { input: [[5, 5, 5]], expected: [5], description: 'tudo repetido' },
    ],
  },
  {
    kind: 'challenge',
    title: '5.9 Itens em comum entre duas listas',
    concept: 'O operador `&` entre dois sets dá a INTERSEÇÃO (só o que está nos dois): `set(a) & set(b)`. Ordene o resultado com `sorted(...)`.',
    exampleCode: 'def uniao_ordenada(a, b):\n    return sorted(set(a) | set(b))  # | é a união (tudo, sem repetir)',
    vocabulary: ['& (interseção)'],
    difficulty: 'medium',
    baseXp: 20,
    description: 'Escreva `itens_em_comum(lista1, lista2)`: retorna, ORDENADOS, os valores que aparecem nas DUAS listas.',
    starterCode: 'def itens_em_comum(lista1, lista2):\n    pass\n',
    targetFn: 'itens_em_comum',
    testCases: [
      { input: [[1, 2, 3], [2, 3, 4]], expected: [2, 3], description: 'com itens em comum' },
      { input: [[1, 2], [3, 4]], expected: [], description: 'sem nada em comum' },
    ],
  },
  {
    kind: 'lesson',
    title: 'List comprehension: um `for` compacto',
    concept:
      '`[x * 2 for x in lista]` é EXATAMENTE o mesmo que:\n```\nresultado = []\nfor x in lista:\n    resultado.append(x * 2)\n```\n...só que numa linha só. É um jeito compacto de montar uma lista nova a partir de outra.',
    exampleCode: '# equivalente a um for com append:\nquadrados = [n * n for n in [1, 2, 3]]\nprint(quadrados)  # [1, 4, 9]',
    vocabulary: ['list comprehension'],
    difficulty: 'medium',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: '5.10 Dobrar valores (com comprehension)',
    concept: 'Reescreva um `for` + `.append()` como `[x * 2 for x in lista]`.',
    exampleCode: 'def somar_um_a_todos(lista):\n    return [x + 1 for x in lista]',
    vocabulary: ['list comprehension'],
    difficulty: 'medium',
    baseXp: 15,
    description: 'Escreva `dobrar_valores(lista)`: retorna uma lista nova com cada valor dobrado, usando list comprehension.',
    starterCode: 'def dobrar_valores(lista):\n    pass\n',
    targetFn: 'dobrar_valores',
    testCases: [
      { input: [[1, 2, 3]], expected: [2, 4, 6], description: '[1,2,3]' },
      { input: [[]], expected: [], description: 'lista vazia' },
      { input: [[5, 10]], expected: [10, 20], description: '[5,10]' },
    ],
  },
  {
    kind: 'challenge',
    title: '5.11 [Fecha a trilha] Agenda de contatos',
    concept: 'Um dicionário pode guardar outro dicionário como valor (`{"Ana": {"idade": 12, ...}}`) — acesse os dados de dentro com `info["idade"]`.',
    exampleCode: 'def imprimir_estoque(estoque):\n    for produto, dados in estoque.items():\n        print(f"{produto}: {dados[\'quantidade\']} unidades")',
    vocabulary: ['dict de dict', '.items()', 'f-string'],
    difficulty: 'hard',
    baseXp: 30,
    description:
      'Escreva `imprimir_agenda(agenda)`: `agenda` é um dicionário onde cada chave é um nome e o valor é `{"idade": ..., "cidade": ...}`. Imprima, para cada contato: `<nome>: <idade> anos, mora em <cidade>` (um por linha).',
    starterCode: 'def imprimir_agenda(agenda):\n    pass\n',
    targetFn: 'imprimir_agenda',
    testCases: [
      {
        input: [{ Ana: { idade: 12, cidade: 'Recife' }, Bruno: { idade: 13, cidade: 'Natal' } }],
        expected: 'Ana: 12 anos, mora em Recife\nBruno: 13 anos, mora em Natal',
        description: 'dois contatos',
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
      .values({ slug: TRAIL_SLUG, title: TRAIL_TITLE, description: TRAIL_DESC, language: 'python', order: 140 })
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
