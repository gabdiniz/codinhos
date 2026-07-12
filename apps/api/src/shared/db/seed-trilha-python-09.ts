/**
 * Seed da trilha "Python: Programação Orientada a Objetos" no CATÁLOGO GLOBAL
 * (tenant_id = NULL). Trilha 9/10 — pré-requisito: trilhas 1-6 (a trilha 6 é
 * pré-requisito de verdade aqui, não só de ordem — ver nota abaixo). Ver
 * docs/trilha-python-09-poo.md. Teto de conteúdo desta rodada P2: o tópico
 * mais avançado que ainda cabe no motor descrito em docs/motor-python-capacidades.md.
 *
 * Execução: pnpm --filter @codinhos/api db:seed:python-09
 *
 * Idempotente e atualizável, mesmo padrão do seed-trilha-js.ts.
 *
 * IMPORTANTE (gap G7 do doc mestre): o motor pega "a primeira função
 * declarada no código" como alvo de function-call — uma `class` não é uma
 * função, e não há modo `mode:'instance-call'` (instanciar + chamar método)
 * implementado. Por isso TODOS os 8 desafios desta trilha são `mode:'stdout'`
 * com `input: null`: o próprio código do aluno instancia o objeto e IMPRIME o
 * resultado observável — mesmo padrão já usado com sucesso na trilha 6, é
 * assim que se testa "efeito colateral observável" sem um modo dedicado.
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

const TRAIL_SLUG = 'python-poo'
const TRAIL_TITLE = 'Python: Programação Orientada a Objetos'
const TRAIL_DESC =
  'Criar classes simples (class, __init__, self), instanciar objetos, métodos que leem e mudam o estado, __str__, herança e sobrescrita. Pré-requisito: Saída e Formatação.'

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
    title: 'O que é uma classe: molde de objetos',
    concept: 'Uma classe é um MOLDE — como a fôrma de um bolo. A fôrma não é o bolo; cada vez que você usa a fôrma, sai um bolo novo. Uma classe define a "forma" de um tipo de objeto (que campos ele tem, o que ele sabe fazer); cada objeto criado a partir dela é uma INSTÂNCIA — parecido com o dicionário de campos fixos que você já viu (5.5), mas com nome próprio e comportamento.',
    exampleCode: '# a classe é o molde:\nclass Cachorro:\n    pass\n\n# cada instância é um "bolo" diferente:\nrex = Cachorro()\nbud = Cachorro()',
    vocabulary: ['classe', 'objeto', 'instância'],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'lesson',
    title: '`class`, `__init__`, `self`',
    concept:
      '`class Cachorro:` cria a classe. `__init__(self, nome)` é o método especial que roda AUTOMATICAMENTE ao criar um objeto novo — é onde você guarda os dados iniciais. `self` é sempre o primeiro parâmetro de um método: representa "este objeto específico". `self.nome = nome` guarda o valor no OBJETO (não numa variável comum).',
    exampleCode: 'class Cachorro:\n    def __init__(self, nome):\n        self.nome = nome\n\nrex = Cachorro("Rex")\nprint(rex.nome)  # Rex',
    vocabulary: ['class', '__init__', 'self'],
    difficulty: 'medium',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: 'P.1 Criar e imprimir um Cachorro',
    concept: 'Crie a classe com `__init__(self, nome)` guardando `self.nome`, depois instancie e acesse `objeto.nome`.',
    exampleCode: 'class Gato:\n    def __init__(self, cor):\n        self.cor = cor\n\nfelix = Gato("preto")\nprint(felix.cor)',
    vocabulary: ['class', '__init__', 'self'],
    difficulty: 'easy',
    baseXp: 15,
    description: 'Crie a classe `Cachorro` com `__init__(self, nome)` guardando `self.nome`. Depois, crie um cachorro chamado `"Rex"` e imprima `rex.nome`.',
    starterCode: 'class Cachorro:\n    def __init__(self, nome):\n        pass\n\n# crie um Cachorro chamado "Rex" e imprima o nome\n',
    testCases: [{ input: null, expected: 'Rex', description: 'imprime o nome do cachorro', mode: 'stdout' }],
  },
  {
    kind: 'lesson',
    title: 'Métodos: função que mora dentro da classe',
    concept: 'Um MÉTODO é uma função definida dentro da classe, com `self` como primeiro parâmetro. Dentro dele, `self.nome` acessa o atributo daquele objeto específico.',
    exampleCode: 'class Cachorro:\n    def __init__(self, nome):\n        self.nome = nome\n    def latir(self):\n        print(f"{self.nome} diz: Au au!")\n\nrex = Cachorro("Rex")\nrex.latir()  # Rex diz: Au au!',
    vocabulary: ['método', 'self'],
    difficulty: 'medium',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: 'P.2 Método que usa o atributo',
    concept: 'Escreva um método `latir(self)` que usa `self.nome` dentro de um `print` com f-string.',
    exampleCode: 'class Gato:\n    def __init__(self, nome):\n        self.nome = nome\n    def miar(self):\n        print(f"{self.nome} diz: Miau!")',
    vocabulary: ['método'],
    difficulty: 'medium',
    baseXp: 20,
    description: 'Na classe `Cachorro` (com `__init__(self, nome)`), adicione o método `latir(self)` que imprime `<nome> diz: Au au!`. Crie um cachorro `"Rex"` e chame `rex.latir()`.',
    starterCode: 'class Cachorro:\n    def __init__(self, nome):\n        self.nome = nome\n    def latir(self):\n        pass\n\n# crie um Cachorro "Rex" e chame .latir()\n',
    testCases: [{ input: null, expected: 'Rex diz: Au au!', description: 'rex.latir()', mode: 'stdout' }],
  },
  {
    kind: 'lesson',
    title: '`__str__`: como o objeto se apresenta no `print`',
    concept: 'Sem ajuda, `print(objeto)` mostra algo tipo `<__main__.Cachorro object at 0x...>` — nada útil. `def __str__(self): return "..."` ensina o Python o que mostrar quando você faz `print(objeto)` ou `str(objeto)`.',
    exampleCode: 'class Cachorro:\n    def __init__(self, nome):\n        self.nome = nome\n    def __str__(self):\n        return f"Cachorro chamado {self.nome}"\n\nprint(Cachorro("Rex"))  # Cachorro chamado Rex',
    vocabulary: ['__str__'],
    difficulty: 'medium',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: 'P.3 Implementar `__str__`',
    concept: 'Escreva `__str__(self)` retornando uma f-string com o nome do cachorro.',
    exampleCode: 'class Gato:\n    def __init__(self, nome):\n        self.nome = nome\n    def __str__(self):\n        return f"Gato chamado {self.nome}"',
    vocabulary: ['__str__'],
    difficulty: 'medium',
    baseXp: 20,
    description: 'Na classe `Cachorro`, implemente `__str__(self)` retornando `Cachorro: <nome>`. Crie um cachorro `"Rex"` e faça `print(rex)`.',
    starterCode: 'class Cachorro:\n    def __init__(self, nome):\n        self.nome = nome\n    def __str__(self):\n        pass\n\n# crie um Cachorro "Rex" e imprima ele (print(rex))\n',
    testCases: [{ input: null, expected: 'Cachorro: Rex', description: 'print(rex)', mode: 'stdout' }],
  },
  {
    kind: 'lesson',
    title: 'Vários objetos, mesma classe',
    concept: 'Uma lista pode guardar VÁRIAS instâncias da mesma classe — igual você já guardou números ou strings numa lista (4.2). `for objeto in lista:` percorre e imprime cada um.',
    exampleCode: 'gatos = [Gato("Felix"), Gato("Mimi")]\nfor g in gatos:\n    print(g)',
    vocabulary: ['lista de objetos'],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: 'P.4 Canil (lista de cachorros)',
    concept: 'Crie uma lista com 2 cachorros e percorra com `for`, imprimindo cada um (usa o `__str__` do módulo anterior).',
    exampleCode: 'gatos = [Gato("Felix"), Gato("Mimi")]\nfor g in gatos:\n    print(g)',
    vocabulary: ['lista de objetos', 'for'],
    difficulty: 'medium',
    baseXp: 20,
    description: 'Na classe `Cachorro` (com `__init__` e `__str__` retornando `Cachorro: <nome>`), crie uma lista com os cachorros `"Rex"` e `"Bud"`, e imprima cada um com `for`.',
    starterCode:
      'class Cachorro:\n    def __init__(self, nome):\n        self.nome = nome\n    def __str__(self):\n        return f"Cachorro: {self.nome}"\n\n# crie a lista [Cachorro("Rex"), Cachorro("Bud")] e imprima cada um com for\n',
    testCases: [{ input: null, expected: 'Cachorro: Rex\nCachorro: Bud', description: 'canil com Rex e Bud', mode: 'stdout' }],
  },
  {
    kind: 'lesson',
    title: 'Métodos que mudam o estado do objeto',
    concept: 'Um método pode MUDAR um atributo (`self.idade = self.idade + 1`) — e essa mudança "gruda" no objeto: se você chamar o método de novo, ele parte do valor JÁ atualizado (o objeto "lembra" entre chamadas, diferente de uma variável local que some ao fim da função).',
    exampleCode: 'class Contador:\n    def __init__(self):\n        self.valor = 0\n    def incrementar(self):\n        self.valor += 1\n\nc = Contador()\nc.incrementar()\nc.incrementar()\nprint(c.valor)  # 2',
    vocabulary: ['estado do objeto'],
    difficulty: 'medium',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: 'P.5 Aniversário (incrementa idade)',
    concept: 'Escreva um método que soma 1 a `self.idade`, chame-o duas vezes seguidas e imprima o resultado final.',
    exampleCode: 'class Contador:\n    def __init__(self):\n        self.valor = 0\n    def incrementar(self):\n        self.valor += 1',
    vocabulary: ['estado do objeto'],
    difficulty: 'medium',
    baseXp: 20,
    description: 'Crie a classe `Pessoa` com `__init__(self, idade)` e o método `aniversario(self)` que soma 1 a `self.idade`. Crie uma pessoa com idade `10`, chame `aniversario()` duas vezes, e imprima `pessoa.idade`.',
    starterCode: 'class Pessoa:\n    def __init__(self, idade):\n        self.idade = idade\n    def aniversario(self):\n        pass\n\n# crie Pessoa(10), chame aniversario() 2x, imprima a idade final\n',
    testCases: [{ input: null, expected: '12', description: 'idade 10 + 2 aniversários = 12', mode: 'stdout' }],
  },
  {
    kind: 'lesson',
    title: 'Herança: uma classe "é um tipo de" outra',
    concept: '`class Cachorro(Animal):` diz "Cachorro É UM tipo de Animal" — herda tudo que `Animal` tem (atributos, métodos), e pode SOBRESCREVER um método pra ter comportamento próprio (mesmo nome, código diferente).',
    exampleCode: 'class Animal:\n    def __init__(self, nome):\n        self.nome = nome\n    def emitir_som(self):\n        return "..."\n\nclass Cachorro(Animal):\n    def emitir_som(self):\n        return "Au au!"  # sobrescreve',
    vocabulary: ['herança', 'sobrescrita'],
    difficulty: 'medium',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: 'P.6 Animal e Cachorro (herança + sobrescrita)',
    concept: '`Animal` define `emitir_som(self)` genérico e `__str__` usando ele. `Cachorro(Animal)` só sobrescreve `emitir_som`, sem repetir `__init__` nem `__str__`.',
    exampleCode: 'class Ave(Animal):\n    def emitir_som(self):\n        return "Piu piu!"',
    vocabulary: ['herança', 'sobrescrita'],
    difficulty: 'hard',
    baseXp: 25,
    description:
      'Crie `Animal` com `__init__(self, nome)`, `emitir_som(self)` retornando `"..."`, e `__str__(self)` retornando `f"{self.nome} faz: {self.emitir_som()}"`. Crie `Cachorro(Animal)` sobrescrevendo `emitir_som` para retornar `"Au au!"`. Crie um cachorro `"Rex"` e imprima ele.',
    starterCode:
      'class Animal:\n    def __init__(self, nome):\n        self.nome = nome\n    def emitir_som(self):\n        return "..."\n    def __str__(self):\n        return f"{self.nome} faz: {self.emitir_som()}"\n\nclass Cachorro(Animal):\n    def emitir_som(self):\n        pass\n\n# crie um Cachorro "Rex" e imprima (print)\n',
    testCases: [{ input: null, expected: 'Rex faz: Au au!', description: 'print(rex)', mode: 'stdout' }],
  },
  {
    kind: 'lesson',
    title: 'Encapsulamento por convenção',
    concept: 'Prefixar um atributo com `_` (ex.: `self._saldo`) é a CONVENÇÃO Python para dizer "não mexa direto de fora, use os métodos" — diferente de outras linguagens, Python não IMPÕE isso (é combinado, não travado), mas todo mundo respeita.',
    exampleCode: 'class ContaSimples:\n    def __init__(self):\n        self._saldo = 0  # convenção: "privado"\n    def depositar(self, valor):\n        self._saldo += valor',
    vocabulary: ['_nome (convenção)'],
    difficulty: 'medium',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: 'P.7 [Fecha a trilha] Conta bancária',
    concept: 'Combine tudo: `__init__` com valor padrão, métodos que mudam estado (`depositar`/`sacar`), `__str__` formatado com `:.2f` (trilha 6), e um atributo por convenção.',
    exampleCode: 'class ContaSimples:\n    def __init__(self):\n        self._saldo = 0\n    def depositar(self, valor):\n        self._saldo += valor\n    def __str__(self):\n        return f"Saldo: {self._saldo:.2f}"',
    vocabulary: ['encapsulamento', '__str__', ':.2f'],
    difficulty: 'hard',
    baseXp: 35,
    description:
      'Crie `ContaBancaria` com `__init__(self, titular, saldo=0)`, métodos `depositar(self, valor)` e `sacar(self, valor)` (mudam `self.saldo`), e `__str__(self)` retornando `f"{titular}: R$ {saldo:.2f}"`. Crie uma conta para `"Ana"`, deposite `100`, saque `30`, e imprima a conta.',
    starterCode:
      'class ContaBancaria:\n    def __init__(self, titular, saldo=0):\n        self.titular = titular\n        self.saldo = saldo\n    def depositar(self, valor):\n        pass\n    def sacar(self, valor):\n        pass\n    def __str__(self):\n        pass\n\n# crie ContaBancaria("Ana"), deposite 100, saque 30, imprima\n',
    testCases: [{ input: null, expected: 'Ana: R$ 70.00', description: 'depósito de 100, saque de 30', mode: 'stdout' }],
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
      .values({ slug: TRAIL_SLUG, title: TRAIL_TITLE, description: TRAIL_DESC, language: 'python', order: 180 })
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
