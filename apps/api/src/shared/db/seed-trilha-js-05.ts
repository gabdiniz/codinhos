/**
 * Seed da trilha "JavaScript: Números e Objetos" no CATÁLOGO GLOBAL.
 * Trilha 5/14 — ver docs/pesquisa-trilhas-js.md e docs/trilha-js-05-numeros-e-objetos.md.
 * Execução: pnpm --filter @codinhos/api db:seed:js-05
 * Idempotente. Modo: function-call.
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

const TRAIL_SLUG = 'js-numeros-e-objetos'
const TRAIL_TITLE = 'JavaScript: Números e Objetos'
const TRAIL_DESC =
  'A biblioteca Math e a conversão de números, mais o objeto (dicionário): criar, ler, checar chave e atualizar sem mutar. Pré-requisito: Listas e Textos.'
const TRAIL_ORDER = 50

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
    title: 'Lição 1 — Números e Math',
    concept:
      'A biblioteca `Math` traz contas prontas: `Math.round(n)` arredonda, `Math.floor`/`Math.ceil` arredondam para baixo/cima, `Math.abs(n)` dá o valor absoluto, `Math.max(a, b)`/`Math.min(a, b)` o maior/menor, `Math.sqrt(n)` a raiz quadrada.',
    exampleCode: 'Math.round(4.6)   // 5\nMath.abs(-3)      // 3\nMath.max(2, 9)    // 9',
    vocabulary: ['Math.round', 'Math.abs', 'Math.max', 'Math.min', 'Math.sqrt'],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: '5.1 Arredondar',
    concept: '`Math.round(n)` arredonda para o inteiro mais próximo.',
    exampleCode: 'function paraBaixo(n) {\n  return Math.floor(n)\n}',
    vocabulary: ['Math.round'],
    difficulty: 'easy',
    baseXp: 10,
    description: 'Escreva `arredondar(n)` que retorna n arredondado ao inteiro mais próximo.',
    starterCode: 'function arredondar(n) {\n  // escreva seu código aqui\n}\n',
    targetFn: 'arredondar',
    testCases: [
      { input: [4.6], expected: 5, description: '4.6 -> 5' },
      { input: [4.4], expected: 4, description: '4.4 -> 4' },
      { input: [2.5], expected: 3, description: '2.5 -> 3' },
    ],
  },
  {
    kind: 'challenge',
    title: '5.2 Valor absoluto',
    concept: '`Math.abs(n)` remove o sinal negativo.',
    exampleCode: 'Math.abs(-7)  // 7',
    vocabulary: ['Math.abs'],
    difficulty: 'easy',
    baseXp: 10,
    description: 'Escreva `valorAbsoluto(n)` que retorna o valor absoluto de n.',
    starterCode: 'function valorAbsoluto(n) {\n  // escreva seu código aqui\n}\n',
    targetFn: 'valorAbsoluto',
    testCases: [
      { input: [-5], expected: 5, description: '-5 -> 5' },
      { input: [3], expected: 3, description: '3 -> 3' },
      { input: [0], expected: 0, description: '0 -> 0' },
    ],
  },
  {
    kind: 'challenge',
    title: '5.3 Maior entre dois',
    concept: '`Math.max(a, b)` devolve o maior dos dois.',
    exampleCode: 'Math.min(2, 9)  // 2',
    vocabulary: ['Math.max'],
    difficulty: 'easy',
    baseXp: 10,
    description: 'Escreva `maiorEntreDois(a, b)` usando Math.max.',
    starterCode: 'function maiorEntreDois(a, b) {\n  // escreva seu código aqui\n}\n',
    targetFn: 'maiorEntreDois',
    testCases: [
      { input: [2, 9], expected: 9, description: 'max(2,9) = 9' },
      { input: [5, 1], expected: 5, description: 'max(5,1) = 5' },
      { input: [4, 4], expected: 4, description: 'max(4,4) = 4' },
    ],
  },
  {
    kind: 'lesson',
    title: 'Lição 2 — Precisão e conversão',
    concept:
      '`n.toFixed(2)` deixa o número com 2 casas decimais, mas devolve **texto** — envolva em `Number(...)` para virar número de novo. `Number("5")` converte texto em número; `String(5)` converte número em texto.',
    exampleCode: 'Number((3.14159).toFixed(2))  // 3.14\nNumber("42")                   // 42\nString(42)                     // "42"',
    vocabulary: ['.toFixed()', 'Number()', 'String()'],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: '5.4 Duas casas decimais',
    concept: 'Use `Number(n.toFixed(2))` para arredondar com 2 casas e voltar a ser número.',
    exampleCode: 'Number((1.239).toFixed(2))  // 1.24',
    vocabulary: ['.toFixed()', 'Number()'],
    difficulty: 'medium',
    baseXp: 15,
    description: 'Escreva `duasCasas(n)` que retorna n com no máximo 2 casas decimais (como número).',
    starterCode: 'function duasCasas(n) {\n  // escreva seu código aqui\n}\n',
    targetFn: 'duasCasas',
    testCases: [
      { input: [3.14159], expected: 3.14, description: '3.14159 -> 3.14' },
      { input: [2.5], expected: 2.5, description: '2.5 -> 2.5' },
      { input: [10.999], expected: 11, description: '10.999 -> 11' },
    ],
  },
  {
    kind: 'challenge',
    title: '5.5 Soma dos dígitos',
    concept: 'Transforme o número em texto com `String(n)`, quebre com `.split("")`, e some cada dígito com `Number()` num laço.',
    exampleCode: 'String(123).split("")  // ["1", "2", "3"]',
    vocabulary: ['String()', '.split()', 'Number()', 'for...of'],
    difficulty: 'medium',
    baseXp: 20,
    description: 'Escreva `somaDigitos(n)` que soma os dígitos de um número inteiro positivo. Ex.: somaDigitos(123) = 6.',
    starterCode: 'function somaDigitos(n) {\n  // escreva seu código aqui\n}\n',
    targetFn: 'somaDigitos',
    testCases: [
      { input: [123], expected: 6, description: '1+2+3 = 6' },
      { input: [9], expected: 9, description: '9 = 9' },
      { input: [405], expected: 9, description: '4+0+5 = 9' },
    ],
  },
  {
    kind: 'lesson',
    title: 'Lição 3 — Objetos: campos com nome',
    concept:
      'Um **objeto** guarda campos com nome: `{ nome: "Ana", idade: 12 }`. Acesse com `.campo` (`pessoa.nome`) ou com colchetes `pessoa["nome"]` — útil quando o nome do campo está numa variável.',
    exampleCode: 'const p = { nome: "Ana", idade: 12 }\np.nome        // "Ana"\np["idade"]    // 12',
    vocabulary: ['objeto', '{}', '.prop', '[chave]'],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: '5.6 Criar pessoa',
    concept: 'Monte um objeto com dois campos e devolva.',
    exampleCode: 'function ponto(x, y) {\n  return { x: x, y: y }\n}',
    vocabulary: ['objeto', '{}'],
    difficulty: 'easy',
    baseXp: 10,
    description: 'Escreva `criarPessoa(nome, idade)` que retorna um objeto `{ nome: ..., idade: ... }`.',
    starterCode: 'function criarPessoa(nome, idade) {\n  // escreva seu código aqui\n}\n',
    targetFn: 'criarPessoa',
    testCases: [
      { input: ['Ana', 12], expected: { nome: 'Ana', idade: 12 }, description: 'Ana, 12' },
      { input: ['Rex', 9], expected: { nome: 'Rex', idade: 9 }, description: 'Rex, 9' },
    ],
  },
  {
    kind: 'challenge',
    title: '5.7 Pegar um campo',
    concept: 'Use colchetes `obj[chave]` quando o nome do campo vem de uma variável.',
    exampleCode: 'function pegarNome(p) {\n  return p.nome\n}',
    vocabulary: ['[chave]'],
    difficulty: 'easy',
    baseXp: 10,
    description: 'Escreva `pegarCampo(obj, chave)` que retorna o valor daquele campo.',
    starterCode: 'function pegarCampo(obj, chave) {\n  // escreva seu código aqui\n}\n',
    targetFn: 'pegarCampo',
    testCases: [
      { input: [{ nome: 'Ana', idade: 12 }, 'nome'], expected: 'Ana', description: 'campo nome' },
      { input: [{ nome: 'Ana', idade: 12 }, 'idade'], expected: 12, description: 'campo idade' },
    ],
  },
  {
    kind: 'lesson',
    title: 'Lição 4 — Chaves e valores',
    concept:
      'O operador `in` diz se um campo existe (`"nome" in pessoa`). `Object.keys(obj)` devolve a lista de nomes dos campos e `Object.values(obj)` a lista dos valores.',
    exampleCode: 'const p = { a: 1, b: 2 }\n"a" in p             // true\nObject.keys(p)       // ["a", "b"]\nObject.values(p)     // [1, 2]',
    vocabulary: ['in', 'Object.keys', 'Object.values'],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: '5.8 Tem a chave?',
    concept: 'O operador `in` já devolve o boolean.',
    exampleCode: 'function temNome(p) {\n  return "nome" in p\n}',
    vocabulary: ['in'],
    difficulty: 'easy',
    baseXp: 10,
    description: 'Escreva `temChave(obj, chave)` que retorna true se o objeto tem aquele campo.',
    starterCode: 'function temChave(obj, chave) {\n  // escreva seu código aqui\n}\n',
    targetFn: 'temChave',
    testCases: [
      { input: [{ nome: 'Ana' }, 'nome'], expected: true, description: 'tem nome' },
      { input: [{ nome: 'Ana' }, 'idade'], expected: false, description: 'não tem idade' },
    ],
  },
  {
    kind: 'challenge',
    title: '5.9 Somar valores',
    concept: 'Percorra `Object.values(obj)` com `for...of` e some.',
    exampleCode: 'for (const v of Object.values({ a: 1, b: 2 })) {\n  // v vale 1, depois 2\n}',
    vocabulary: ['Object.values', 'for...of'],
    difficulty: 'medium',
    baseXp: 20,
    description: 'Escreva `somarValores(obj)` que soma todos os valores (números) do objeto.',
    starterCode: 'function somarValores(obj) {\n  // escreva seu código aqui\n}\n',
    targetFn: 'somarValores',
    testCases: [
      { input: [{ a: 1, b: 2, c: 3 }], expected: 6, description: '1+2+3 = 6' },
      { input: [{ x: 10, y: 5 }], expected: 15, description: '10+5 = 15' },
      { input: [{}], expected: 0, description: 'objeto vazio = 0' },
    ],
  },
  {
    kind: 'lesson',
    title: 'Lição 5 — Atualizar sem mutar',
    concept:
      'O spread de objeto `{ ...obj, campo: novo }` cria uma **cópia** do objeto com um campo trocado (ou adicionado), sem mexer no original.',
    exampleCode: 'const p = { nome: "Ana", idade: 12 }\nconst p2 = { ...p, idade: 13 }   // { nome: "Ana", idade: 13 }',
    vocabulary: ['spread', '{...obj}'],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: '5.10 Atualizar idade',
    concept: 'Use `{ ...pessoa, idade: novaIdade }` para devolver uma cópia com a idade trocada.',
    exampleCode: 'function renomear(p, novo) {\n  return { ...p, nome: novo }\n}',
    vocabulary: ['spread', '{...obj}'],
    difficulty: 'medium',
    baseXp: 15,
    description: 'Escreva `atualizarIdade(pessoa, novaIdade)` que retorna uma NOVA pessoa com a idade trocada.',
    starterCode: 'function atualizarIdade(pessoa, novaIdade) {\n  // escreva seu código aqui\n}\n',
    targetFn: 'atualizarIdade',
    testCases: [
      { input: [{ nome: 'Ana', idade: 12 }, 13], expected: { nome: 'Ana', idade: 13 }, description: 'Ana faz 13' },
      { input: [{ nome: 'Rex', idade: 9 }, 10], expected: { nome: 'Rex', idade: 10 }, description: 'Rex faz 10' },
    ],
  },
  {
    kind: 'challenge',
    title: '5.11 [Fecha a trilha] Inverter chave e valor',
    concept: 'Percorra `Object.keys(obj)` e monte um objeto novo onde o valor vira chave.',
    exampleCode: 'const r = {}\nfor (const k of Object.keys({ a: 1 })) {\n  r[1] = "a"\n}',
    vocabulary: ['Object.keys', 'for...of', '[chave]'],
    difficulty: 'medium',
    baseXp: 20,
    description: 'Escreva `inverter(obj)` que troca chaves por valores. Ex.: inverter({ a: 1, b: 2 }) = { "1": "a", "2": "b" }.',
    starterCode: 'function inverter(obj) {\n  // escreva seu código aqui\n}\n',
    targetFn: 'inverter',
    testCases: [
      { input: [{ a: 1, b: 2 }], expected: { '1': 'a', '2': 'b' }, description: 'a:1,b:2 invertido' },
      { input: [{ x: 'y' }], expected: { y: 'x' }, description: 'x:y -> y:x' },
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
