/**
 * Seed script — cria dados mínimos para o ambiente funcionar.
 *
 * Execução: pnpm --filter @codinhos/api db:seed
 *
 * Idempotente: pode rodar múltiplas vezes sem duplicar dados.
 */

import 'dotenv/config'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import bcrypt from 'bcryptjs'
import { eq, and } from 'drizzle-orm'
import * as schema from './schema.js'
import { tenants, users, classes, classStudents, trails, classTrails, trailModules, challenges } from './schema.js'

// ─── Config ───────────────────────────────────────────────────────────────────

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) {
  console.error('❌  DATABASE_URL não definido')
  process.exit(1)
}

const SUPER_ADMIN_EMAIL = process.env.SEED_SUPER_ADMIN_EMAIL ?? 'admin@codinhos.com.br'
const SUPER_ADMIN_PASSWORD = process.env.SEED_SUPER_ADMIN_PASSWORD
if (!SUPER_ADMIN_PASSWORD) {
  console.error('❌  SEED_SUPER_ADMIN_PASSWORD não definido')
  process.exit(1)
}
const adminPassword: string = SUPER_ADMIN_PASSWORD

const client = postgres(DATABASE_URL, { max: 1 })
const db = drizzle(client, { schema })

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function upsertTenant(slug: string, name: string, plan: string) {
  const [existing] = await db
    .select({ id: tenants.id })
    .from(tenants)
    .where(eq(tenants.slug, slug))
    .limit(1)

  if (existing) {
    console.log(`  ⏩  Tenant '${slug}' já existe:`, existing.id)
    return existing
  }

  const [created] = await db
    .insert(tenants)
    .values({ slug, name, plan, settings: {}, isActive: true })
    .returning({ id: tenants.id })

  console.log(`  ✅  Tenant '${slug}' criado:`, created!.id)
  return created!
}

async function upsertUser(
  tenantId: string,
  email: string,
  password: string,
  role: 'super_admin' | 'manager' | 'professor' | 'student',
  name: string,
) {
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.tenantId, tenantId), eq(users.email, email)))
    .limit(1)

  if (existing) {
    console.log(`  ⏩  Usuário '${email}' já existe:`, existing.id)
    return existing
  }

  const passwordHash = await bcrypt.hash(password, 12)
  const [created] = await db
    .insert(users)
    .values({ tenantId, email, passwordHash, role, name, isActive: true })
    .returning({ id: users.id })

  console.log(`  ✅  Usuário '${email}' (${role}) criado:`, created!.id)
  return created!
}

async function upsertClass(tenantId: string, name: string) {
  const [existing] = await db
    .select({ id: classes.id })
    .from(classes)
    .where(and(eq(classes.tenantId, tenantId), eq(classes.name, name)))
    .limit(1)

  if (existing) {
    console.log(`  ⏩  Turma '${name}' já existe:`, existing.id)
    return existing
  }

  const [created] = await db
    .insert(classes)
    .values({ tenantId, name, progressionMode: 'sequential', validationMode: 'auto', showRanking: true })
    .returning({ id: classes.id })

  console.log(`  ✅  Turma '${name}' criada:`, created!.id)
  return created!
}

async function upsertTrail(slug: string, title: string, description: string) {
  const [existing] = await db
    .select({ id: trails.id })
    .from(trails)
    .where(eq(trails.slug, slug))
    .limit(1)

  if (existing) {
    console.log(`  ⏩  Trilha '${slug}' já existe:`, existing.id)
    return existing
  }

  const [created] = await db
    .insert(trails)
    .values({ slug, title, description, language: 'javascript', order: 1 })
    .returning({ id: trails.id })

  console.log(`  ✅  Trilha '${slug}' criada:`, created!.id)
  return created!
}

async function upsertClassTrail(classId: string, trailId: string) {
  const [existing] = await db
    .select({ id: classTrails.id })
    .from(classTrails)
    .where(and(eq(classTrails.classId, classId), eq(classTrails.trailId, trailId)))
    .limit(1)

  if (existing) {
    console.log(`  ⏩  Trilha já vinculada à turma:`, existing.id)
    return existing
  }

  const [created] = await db
    .insert(classTrails)
    .values({ classId, trailId, order: 1, visualBlocksEnabled: false })
    .returning({ id: classTrails.id })

  console.log(`  ✅  Trilha vinculada à turma:`, created!.id)
  return created!
}

async function upsertTrailModule(trailId: string, order: number, title: string, concept: string, exampleCode: string) {
  const [existing] = await db
    .select({ id: trailModules.id })
    .from(trailModules)
    .where(and(eq(trailModules.trailId, trailId), eq(trailModules.order, order)))
    .limit(1)

  if (existing) {
    console.log(`  ⏩  Módulo ordem ${order} já existe:`, existing.id)
    return existing
  }

  const [created] = await db
    .insert(trailModules)
    .values({ trailId, title, concept, exampleCode, order })
    .returning({ id: trailModules.id })

  console.log(`  ✅  Módulo '${title}' criado:`, created!.id)
  return created!
}

async function upsertChallenge(
  moduleId: string,
  title: string,
  description: string,
  starterCode: string,
  difficulty: 'easy' | 'medium' | 'hard',
  baseXp: number,
  testCases: { input: unknown; expected: unknown; description: string }[],
) {
  const [existing] = await db
    .select({ id: challenges.id })
    .from(challenges)
    .where(eq(challenges.moduleId, moduleId))
    .limit(1)

  if (existing) {
    console.log(`  ⏩  Desafio já existe:`, existing.id)
    return existing
  }

  const [created] = await db
    .insert(challenges)
    .values({ moduleId, title, description, starterCode, difficulty, baseXp, testCases, order: 1 })
    .returning({ id: challenges.id })

  console.log(`  ✅  Desafio '${title}' criado:`, created!.id)
  return created!
}

async function upsertClassStudent(classId: string, studentId: string) {
  const [existing] = await db
    .select({ id: classStudents.id })
    .from(classStudents)
    .where(and(eq(classStudents.classId, classId), eq(classStudents.studentId, studentId)))
    .limit(1)

  if (existing) {
    console.log(`  ⏩  Matrícula já existe:`, existing.id)
    return existing
  }

  const [created] = await db
    .insert(classStudents)
    .values({ classId, studentId })
    .returning({ id: classStudents.id })

  console.log(`  ✅  Aluno matriculado na turma:`, created!.id)
  return created!
}

// ─── Seed ─────────────────────────────────────────────────────────────────────

async function seed() {
  console.log('🌱  Iniciando seed...\n')

  // ── 1. Tenant __system__ + Super Admin ──────────────────────────────────────
  console.log('📦  Sistema')
  const systemTenant = await upsertTenant('__system__', 'Sistema', 'internal')
  await upsertUser(systemTenant.id, SUPER_ADMIN_EMAIL, adminPassword, 'super_admin', 'Super Admin')

  // ── 2. Escola Demo ──────────────────────────────────────────────────────────
  console.log('\n🏫  Escola Demo')
  const demoTenant = await upsertTenant('escola-demo', 'Escola Demo', 'basic')
  await upsertUser(demoTenant.id, 'gestor@escola-demo.com', 'demo1234', 'manager', 'Gestor Demo')
  const demoStudent = await upsertUser(demoTenant.id, 'aluno@escola-demo.com', 'demo1234', 'student', 'Aluno Demo')

  // ── 3. Turma Demo + alunos ──────────────────────────────────────────────────
  console.log('\n🎓  Turma Demo')
  const demoClass = await upsertClass(demoTenant.id, 'Turma Demo')
  const student2 = await upsertUser(demoTenant.id, 'ana@escola-demo.com',    'demo1234', 'student', 'Ana Souza')
  const student3 = await upsertUser(demoTenant.id, 'pedro@escola-demo.com',  'demo1234', 'student', 'Pedro Lima')
  const student4 = await upsertUser(demoTenant.id, 'julia@escola-demo.com',  'demo1234', 'student', 'Julia Costa')
  const student5 = await upsertUser(demoTenant.id, 'lucas@escola-demo.com',  'demo1234', 'student', 'Lucas Moura')
  await upsertClassStudent(demoClass.id, demoStudent.id)
  await upsertClassStudent(demoClass.id, student2.id)
  await upsertClassStudent(demoClass.id, student3.id)
  await upsertClassStudent(demoClass.id, student4.id)
  await upsertClassStudent(demoClass.id, student5.id)

  // ── 4. Trilha Demo ───────────────────────────────────────────────────────────
  console.log('\n🗺️   Trilha Demo')
  const demoTrail = await upsertTrail(
    'javascript-fundamentos',
    'JavaScript: Fundamentos',
    'Aprenda os fundamentos do JavaScript: variáveis, tipos, funções e lógica de programação.',
  )
  await upsertClassTrail(demoClass.id, demoTrail.id)

  // ── 5. Módulos + Desafios da trilha ─────────────────────────────────────────
  console.log('\n📚  Módulos da trilha')

  const mod1 = await upsertTrailModule(
    demoTrail.id,
    1,
    'Variáveis e Tipos',
    `Em JavaScript, variáveis armazenam dados. Use **let** para valores que mudam e **const** para constantes.

Os tipos primitivos são: \`string\`, \`number\`, \`boolean\`, \`null\` e \`undefined\`.

Use \`typeof\` para verificar o tipo de um valor:
\`\`\`js
typeof "olá"   // "string"
typeof 42      // "number"
typeof true    // "boolean"
\`\`\``,
    `// Declarando variáveis
const nome = "Codi"
let pontos = 0

pontos = pontos + 10
console.log(nome, "tem", pontos, "pontos")

// Verificando tipos
console.log(typeof nome)    // "string"
console.log(typeof pontos)  // "number"`,
  )

  await upsertChallenge(
    mod1.id,
    'Apresente-se!',
    `Crie uma variável \`nome\` com o seu primeiro nome e uma variável \`idade\` com a sua idade.

Em seguida, use \`console.log\` para imprimir a mensagem:
**"Meu nome é [nome] e tenho [idade] anos."**`,
    `// Declare suas variáveis aqui
const nome = ""
const idade = 0

// Imprima a mensagem
console.log("Meu nome é", nome, "e tenho", idade, "anos.")`,
    'easy',
    15,
    [
      { input: null, expected: 'string', description: 'nome deve ser do tipo string' },
      { input: null, expected: 'number', description: 'idade deve ser do tipo number' },
    ],
  )

  const mod2 = await upsertTrailModule(
    demoTrail.id,
    2,
    'Funções',
    `Funções são blocos de código reutilizáveis. Defina com \`function\` ou arrow function (\`=>\`):

\`\`\`js
// Declaração de função
function somar(a, b) {
  return a + b
}

// Arrow function
const multiplicar = (a, b) => a * b
\`\`\`

Funções recebem **parâmetros** e retornam um valor com \`return\`.`,
    `// Função que calcula área de um retângulo
function area(largura, altura) {
  return largura * altura
}

console.log(area(5, 3))  // 15
console.log(area(10, 2)) // 20

// Arrow function equivalente
const areaArrow = (l, h) => l * h
console.log(areaArrow(4, 6)) // 24`,
  )

  await upsertChallenge(
    mod2.id,
    'Calculadora de Área',
    `Crie uma função chamada \`calcularArea\` que recebe dois parâmetros: \`largura\` e \`altura\`.

A função deve retornar o produto dos dois valores (largura × altura).

Exemplos:
- \`calcularArea(5, 3)\` → \`15\`
- \`calcularArea(10, 4)\` → \`40\``,
    `// Crie sua função aqui
function calcularArea(largura, altura) {
  // seu código aqui
}

// Teste
console.log(calcularArea(5, 3))   // deve imprimir 15
console.log(calcularArea(10, 4))  // deve imprimir 40`,
    'medium',
    25,
    [
      { input: [5, 3],   expected: 15, description: 'calcularArea(5, 3) deve retornar 15' },
      { input: [10, 4],  expected: 40, description: 'calcularArea(10, 4) deve retornar 40' },
      { input: [7, 7],   expected: 49, description: 'calcularArea(7, 7) deve retornar 49' },
    ],
  )

  const mod3 = await upsertTrailModule(
    demoTrail.id,
    3,
    'Arrays e Loops',
    `Arrays armazenam listas de valores. Acesse elementos pelo índice (começa em 0):

\`\`\`js
const frutas = ["maçã", "banana", "laranja"]
console.log(frutas[0]) // "maçã"
console.log(frutas.length) // 3
\`\`\`

Use \`for...of\` para percorrer todos os elementos:

\`\`\`js
for (const fruta of frutas) {
  console.log(fruta)
}
\`\`\``,
    `// Somando todos os números de um array
const numeros = [1, 2, 3, 4, 5]
let soma = 0

for (const n of numeros) {
  soma = soma + n
}

console.log("Soma:", soma) // Soma: 15

// Usando reduce (forma avançada)
const somaReduce = numeros.reduce((acc, n) => acc + n, 0)
console.log("Soma com reduce:", somaReduce) // 15`,
  )

  await upsertChallenge(
    mod3.id,
    'Soma do Array',
    `Crie uma função chamada \`somarArray\` que recebe um array de números e retorna a soma de todos os seus elementos.

Exemplos:
- \`somarArray([1, 2, 3])\` → \`6\`
- \`somarArray([10, 20, 30])\` → \`60\`
- \`somarArray([])\` → \`0\``,
    `// Crie sua função aqui
function somarArray(numeros) {
  // seu código aqui
}

// Testes
console.log(somarArray([1, 2, 3]))      // deve imprimir 6
console.log(somarArray([10, 20, 30]))   // deve imprimir 60
console.log(somarArray([]))             // deve imprimir 0`,
    'hard',
    40,
    [
      { input: [[1, 2, 3]],      expected: 6,  description: 'somarArray([1, 2, 3]) deve retornar 6' },
      { input: [[10, 20, 30]],   expected: 60, description: 'somarArray([10, 20, 30]) deve retornar 60' },
      { input: [[]],             expected: 0,  description: 'somarArray([]) deve retornar 0' },
      { input: [[5]],            expected: 5,  description: 'somarArray([5]) deve retornar 5' },
    ],
  )

  console.log('\n🎉  Seed concluído.')
  console.log('\n📋  Credenciais de acesso:')
  console.log('   Gestor  → gestor@escola-demo.com / demo1234')
  console.log('   Aluno   → aluno@escola-demo.com  / demo1234')
  console.log('   Alunos extras → ana / pedro / julia / lucas @escola-demo.com / demo1234')
  console.log('   URL     → http://localhost:5173/escola-demo/login')
}

seed()
  .catch((err) => {
    console.error('❌  Erro no seed:', err)
    process.exit(1)
  })
  .finally(() => client.end())
