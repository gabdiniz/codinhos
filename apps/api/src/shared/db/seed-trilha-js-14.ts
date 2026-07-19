/**
 * Seed da trilha "JavaScript: Orientação a Objetos (classes)" no CATÁLOGO GLOBAL.
 * Trilha 14/14 (teto) — ver docs/pesquisa-trilhas-js.md e docs/trilha-js-14-orientacao-a-objetos.md.
 * Execução: pnpm --filter @codinhos/api db:seed:js-14
 * Idempotente. Classe não é função-alvo: os desafios usam função-embrulho (function-call,
 * retorno JSON) ou stdout (imprime o estado observável). Verificado.
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

const TRAIL_SLUG = 'js-orientacao-a-objetos'
const TRAIL_TITLE = 'JavaScript: Orientação a Objetos (classes)'
const TRAIL_DESC =
  'Modelar coisas como código: class, constructor, this, métodos, toString, getters, herança e encapsulamento. Teto do currículo. Pré-requisito: Sintaxe Moderna.'
const TRAIL_ORDER = 140

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
  }[]
}

const trilhaModules: Modulo[] = [
  {
    kind: 'lesson',
    title: 'Lição 1 — O que é uma classe',
    concept:
      'Uma **classe** é o molde; cada **objeto** criado a partir dela é uma cópia com seus próprios dados. Pense numa fôrma de bolo: a fôrma é a classe, cada bolo é um objeto (instância).',
    exampleCode: '// class = molde | new = criar um objeto a partir do molde',
    vocabulary: ['classe', 'objeto', 'instância'],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'lesson',
    title: 'Lição 2 — class, constructor, this, new',
    concept:
      'O `constructor` roda ao criar o objeto e guarda os dados em `this`. `new Ponto(2, 3)` cria uma instância. Nesta trilha, como a classe não é a "função testada", você escreve a classe E uma função que a usa e devolve/imprime o resultado.',
    exampleCode: 'class Ponto {\n  constructor(x, y) {\n    this.x = x\n    this.y = y\n  }\n}\nconst p = new Ponto(2, 3)   // p.x = 2',
    vocabulary: ['class', 'constructor', 'this', 'new'],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: '14.1 Criar um ponto',
    concept: 'Defina a classe e uma função que cria o objeto e devolve seus campos.',
    exampleCode: 'class Ponto {\n  constructor(x, y) { this.x = x; this.y = y }\n}',
    vocabulary: ['class', 'constructor', 'this', 'new'],
    difficulty: 'medium',
    baseXp: 15,
    description:
      'Defina `class Ponto` (com `x` e `y`) e a função `criar(x, y)` que cria um Ponto e retorna `{ x: ..., y: ... }`.',
    starterCode:
      'class Ponto {\n  constructor(x, y) {\n    // guarde x e y em this\n  }\n}\n\nfunction criar(x, y) {\n  const p = new Ponto(x, y)\n  return { x: p.x, y: p.y }\n}\n',
    targetFn: 'criar',
    testCases: [
      { input: [2, 3], expected: { x: 2, y: 3 }, description: 'ponto (2,3)' },
      { input: [0, -1], expected: { x: 0, y: -1 }, description: 'ponto (0,-1)' },
    ],
  },
  {
    kind: 'lesson',
    title: 'Lição 3 — Métodos',
    concept: 'Um **método** é uma função dentro da classe: `metodo() { ... }`. Ele usa `this` para ler os campos do próprio objeto.',
    exampleCode: 'class Retangulo {\n  constructor(l, a) { this.l = l; this.a = a }\n  area() { return this.l * this.a }\n}',
    vocabulary: ['método', 'this'],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: '14.2 Retângulo com área',
    concept: 'A função-embrulho cria o retângulo e devolve `.area()`.',
    exampleCode: 'return new Retangulo(l, a).area()',
    vocabulary: ['método'],
    difficulty: 'medium',
    baseXp: 15,
    description: 'Defina `class Retangulo` com o método `area()` e a função `areaDe(l, a)` que retorna a área.',
    starterCode:
      'class Retangulo {\n  constructor(l, a) {\n    // ...\n  }\n  area() {\n    // this.l * this.a\n  }\n}\n\nfunction areaDe(l, a) {\n  return new Retangulo(l, a).area()\n}\n',
    targetFn: 'areaDe',
    testCases: [
      { input: [5, 3], expected: 15, description: '5x3 = 15' },
      { input: [4, 4], expected: 16, description: '4x4 = 16' },
    ],
  },
  {
    kind: 'lesson',
    title: 'Lição 4 — Instanciar e imprimir; toString',
    concept:
      'Ao imprimir um objeto direto, aparece algo estranho. O método `toString()` define como o objeto se apresenta no `console.log` (ou em `String(objeto)`).',
    exampleCode: 'class Produto {\n  constructor(nome) { this.nome = nome }\n  toString() { return `Produto: ${this.nome}` }\n}',
    vocabulary: ['toString', 'console.log'],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: '14.3 toString do produto',
    concept: 'Defina `toString` e imprima o objeto com `console.log(String(p))`.',
    exampleCode: 'console.log(String(new Produto(nome, preco)))',
    vocabulary: ['toString', 'console.log', 'template literal'],
    difficulty: 'medium',
    baseXp: 20,
    description:
      'Defina `class Produto` (nome, preco) com `toString()` que devolve "NOME: R$PRECO", e a função `mostrar(nome, preco)` que imprime o produto. Ex.: mostrar("Bola", 30) imprime "Bola: R$30".',
    starterCode:
      'class Produto {\n  constructor(nome, preco) {\n    // ...\n  }\n  toString() {\n    return `${this.nome}: R$${this.preco}`\n  }\n}\n\nfunction mostrar(nome, preco) {\n  console.log(String(new Produto(nome, preco)))\n}\n',
    targetFn: 'mostrar',
    testCases: [
      { input: ['Bola', 30], expected: 'Bola: R$30', description: 'Bola 30', mode: 'stdout' },
      { input: ['Caderno', 12], expected: 'Caderno: R$12', description: 'Caderno 12', mode: 'stdout' },
    ],
  },
  {
    kind: 'lesson',
    title: 'Lição 5 — Estado que muda entre chamadas',
    concept: 'Um método pode alterar `this` — o objeto "lembra" o novo valor na próxima chamada. É o estado do objeto mudando ao longo do tempo.',
    exampleCode: 'class Contador {\n  constructor() { this.n = 0 }\n  incrementar() { this.n++ }\n}',
    vocabulary: ['estado', 'this'],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: '14.4 Contador',
    concept: 'Chame `incrementar()` várias vezes e veja o estado acumular.',
    exampleCode: 'const c = new Contador()\nfor (let i = 0; i < vezes; i++) c.incrementar()',
    vocabulary: ['estado', 'método'],
    difficulty: 'medium',
    baseXp: 15,
    description: 'Defina `class Contador` (começa em 0) com `incrementar()`, e a função `contarAte(vezes)` que incrementa esse número `vezes` vezes e retorna o total.',
    starterCode:
      'class Contador {\n  constructor() {\n    this.n = 0\n  }\n  incrementar() {\n    // this.n++\n  }\n}\n\nfunction contarAte(vezes) {\n  const c = new Contador()\n  for (let i = 0; i < vezes; i++) c.incrementar()\n  return c.n\n}\n',
    targetFn: 'contarAte',
    testCases: [
      { input: [3], expected: 3, description: '3 incrementos' },
      { input: [0], expected: 0, description: 'nenhum' },
    ],
  },
  {
    kind: 'challenge',
    title: '14.5 Conta bancária',
    concept: 'Faça várias operações em sequência e imprima o saldo final (estado acumulado observável).',
    exampleCode: 'c.depositar(dep); c.sacar(saq); console.log("Saldo: " + c.saldo)',
    vocabulary: ['estado', 'método', 'console.log'],
    difficulty: 'medium',
    baseXp: 20,
    description:
      'Defina `class Conta` (começa com um saldo inicial) com `depositar(v)` e `sacar(v)`, e a função `extrato(inicial, dep, saq)` que deposita, saca e imprime "Saldo: X". Ex.: extrato(100, 50, 30) imprime "Saldo: 120".',
    starterCode:
      'class Conta {\n  constructor(saldo) {\n    this.saldo = saldo\n  }\n  depositar(v) {\n    // this.saldo += v\n  }\n  sacar(v) {\n    // this.saldo -= v\n  }\n}\n\nfunction extrato(inicial, dep, saq) {\n  const c = new Conta(inicial)\n  c.depositar(dep)\n  c.sacar(saq)\n  console.log("Saldo: " + c.saldo)\n}\n',
    targetFn: 'extrato',
    testCases: [
      { input: [100, 50, 30], expected: 'Saldo: 120', description: '100 +50 -30 = 120', mode: 'stdout' },
      { input: [0, 100, 40], expected: 'Saldo: 60', description: '0 +100 -40 = 60', mode: 'stdout' },
    ],
  },
  {
    kind: 'lesson',
    title: 'Lição 6 — getters e membros static',
    concept:
      'Um `get resumo() { ... }` é uma **propriedade calculada**: você lê como `obj.resumo` (sem parênteses). Um método `static` pertence à classe, não à instância (`Classe.metodo()`).',
    exampleCode: 'class Personagem {\n  constructor(nome, nivel) { this.nome = nome; this.nivel = nivel }\n  get status() { return `${this.nome} (${this.nivel})` }\n}',
    vocabulary: ['get', 'getter', 'static'],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: '14.6 Status por getter',
    concept: 'Leia o getter como propriedade (`obj.status`, sem parênteses).',
    exampleCode: 'return new Personagem(nome, nivel).status',
    vocabulary: ['getter', 'template literal'],
    difficulty: 'medium',
    baseXp: 15,
    description:
      'Defina `class Personagem` (nome, nivel) com o getter `status` que devolve "NOME (NIVEL)", e a função `status(nome, nivel)` que retorna esse texto. Ex.: status("Link", 5) = "Link (5)".',
    starterCode:
      'class Personagem {\n  constructor(nome, nivel) {\n    // ...\n  }\n  get status() {\n    return `${this.nome} (${this.nivel})`\n  }\n}\n\nfunction status(nome, nivel) {\n  return new Personagem(nome, nivel).status\n}\n',
    targetFn: 'status',
    testCases: [
      { input: ['Link', 5], expected: 'Link (5)', description: 'Link nível 5' },
      { input: ['Zelda', 9], expected: 'Zelda (9)', description: 'Zelda nível 9' },
    ],
  },
  {
    kind: 'lesson',
    title: 'Lição 7 — Herança',
    concept:
      'Uma classe pode **herdar** de outra com `extends`: ganha os campos e métodos da mãe. `super(...)` chama o constructor da mãe. Você pode **sobrescrever** um método (redefinir na filha).',
    exampleCode: 'class Animal {\n  constructor(nome) { this.nome = nome }\n}\nclass Cachorro extends Animal {\n  som() { return "au au" }\n}',
    vocabulary: ['extends', 'super', 'sobrescrita'],
    difficulty: 'medium',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: '14.7 Animal e Cachorro',
    concept: 'Cachorro herda de Animal (guardando o nome) e define seu próprio som.',
    exampleCode: 'class Cachorro extends Animal {\n  apresentar() { return `${this.nome} faz au au` }\n}',
    vocabulary: ['extends', 'super', 'sobrescrita'],
    difficulty: 'medium',
    baseXp: 20,
    description:
      'Defina `class Animal` (guarda `nome`) e `class Cachorro extends Animal` com `apresentar()` que devolve "NOME faz au au". A função `apresentarCachorro(nome)` retorna esse texto. Ex.: "Rex faz au au".',
    starterCode:
      'class Animal {\n  constructor(nome) {\n    this.nome = nome\n  }\n}\n\nclass Cachorro extends Animal {\n  apresentar() {\n    return `${this.nome} faz au au`\n  }\n}\n\nfunction apresentarCachorro(nome) {\n  return new Cachorro(nome).apresentar()\n}\n',
    targetFn: 'apresentarCachorro',
    testCases: [
      { input: ['Rex'], expected: 'Rex faz au au', description: 'Rex' },
      { input: ['Bob'], expected: 'Bob faz au au', description: 'Bob' },
    ],
  },
  {
    kind: 'lesson',
    title: 'Lição 8 — Encapsulamento',
    concept:
      'Encapsular é proteger os dados do objeto. Por convenção, um `_saldo` sinaliza "não mexa direto de fora". O JS moderno tem campos **privados de verdade** com `#`: `#saldo` só é acessível dentro da classe.',
    exampleCode: 'class Cofre {\n  #saldo = 0\n  depositar(v) { this.#saldo += v }\n  get saldo() { return this.#saldo }\n}',
    vocabulary: ['encapsulamento', '#privado'],
    difficulty: 'medium',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: '14.8 Cofre com campo privado',
    concept: 'Use `#saldo` (privado): só os métodos da classe mexem nele; de fora, só via getter.',
    exampleCode: 'class Cofre {\n  #saldo = 0\n  depositar(v) { this.#saldo += v }\n  get saldo() { return this.#saldo }\n}',
    vocabulary: ['#privado', 'getter'],
    difficulty: 'hard',
    baseXp: 25,
    description:
      'Defina `class Cofre` com `#saldo` privado (começa em 0), `depositar(v)` e um getter `saldo`. A função `usarCofre(a, b)` deposita a e depois b, e retorna o saldo. Ex.: usarCofre(100, 50) = 150.',
    starterCode:
      'class Cofre {\n  #saldo = 0\n  depositar(v) {\n    // this.#saldo += v\n  }\n  get saldo() {\n    return this.#saldo\n  }\n}\n\nfunction usarCofre(a, b) {\n  const c = new Cofre()\n  c.depositar(a)\n  c.depositar(b)\n  return c.saldo\n}\n',
    targetFn: 'usarCofre',
    testCases: [
      { input: [100, 50], expected: 150, description: '100 + 50 = 150' },
      { input: [0, 0], expected: 0, description: 'zero' },
    ],
  },
  {
    kind: 'challenge',
    title: '14.9 [Fecha a trilha] Mini-biblioteca',
    concept: 'Junte tudo: uma classe Livro (com toString) e uma Biblioteca que guarda vários livros e os lista.',
    exampleCode: 'class Biblioteca {\n  constructor() { this.livros = [] }\n  adicionar(l) { this.livros.push(l) }\n}',
    vocabulary: ['class', 'toString', 'lista de objetos'],
    difficulty: 'hard',
    baseXp: 30,
    description:
      'Defina `class Livro` (título, com `toString()` = "- TÍTULO") e `class Biblioteca` (guarda livros, `adicionar(livro)` e `listar()` que imprime cada um). A função `acervo(titulos)` cria a biblioteca, adiciona um Livro por título e lista. Ex.: acervo(["Duna","1984"]) imprime "- Duna" e "- 1984".',
    starterCode:
      'class Livro {\n  constructor(titulo) {\n    this.titulo = titulo\n  }\n  toString() {\n    return "- " + this.titulo\n  }\n}\n\nclass Biblioteca {\n  constructor() {\n    this.livros = []\n  }\n  adicionar(livro) {\n    this.livros.push(livro)\n  }\n  listar() {\n    for (const l of this.livros) console.log(String(l))\n  }\n}\n\nfunction acervo(titulos) {\n  const b = new Biblioteca()\n  for (const t of titulos) b.adicionar(new Livro(t))\n  b.listar()\n}\n',
    targetFn: 'acervo',
    testCases: [
      { input: [['Duna', '1984']], expected: '- Duna\n- 1984', description: 'dois livros', mode: 'stdout' },
      { input: [['Codi']], expected: '- Codi', description: 'um livro', mode: 'stdout' },
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
