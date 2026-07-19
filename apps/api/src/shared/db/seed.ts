/**
 * Seed script — cria dados mínimos para o ambiente funcionar.
 *
 * Execução: pnpm --filter @codinhos/api db:seed
 *
 * Idempotente: pode rodar múltiplas vezes sem duplicar dados.
 *
 * As TRILHAS do catálogo vêm de seeds próprios (db:seed:js-* e db:seed:python-*).
 * Este seed só cria o tenant demo, as turmas e os alunos, e ASSOCIA as trilhas
 * já semeadas a cada turma, em ordem. Rode assim para um ambiente completo:
 *   pnpm --filter @codinhos/api db:seed:js       # trilhas 01-05 de JS
 *   pnpm --filter @codinhos/api db:seed:python-01 ... db:seed:python-10
 *   pnpm --filter @codinhos/api db:seed           # tenant + turmas + vínculos
 * (a ordem não importa; re-rodar o db:seed depois de semear trilhas completa os vínculos.)
 */

import 'dotenv/config'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import bcrypt from 'bcryptjs'
import { eq, and } from 'drizzle-orm'
import * as schema from './schema.js'
import { tenants, users, classes, classStudents, trails, classTrails } from './schema.js'

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
  const [existing] = await db.select({ id: tenants.id }).from(tenants).where(eq(tenants.slug, slug)).limit(1)

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
  role: 'super_admin' | 'manager' | 'professor' | 'student' | 'guardian',
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

async function upsertClassTrail(classId: string, trailId: string, order: number) {
  const [existing] = await db
    .select({ id: classTrails.id })
    .from(classTrails)
    .where(and(eq(classTrails.classId, classId), eq(classTrails.trailId, trailId)))
    .limit(1)

  if (existing) {
    // Mantém a ordem em dia mesmo em re-execuções.
    await db.update(classTrails).set({ order }).where(eq(classTrails.id, existing.id))
    return existing
  }

  const [created] = await db
    .insert(classTrails)
    .values({ classId, trailId, order, visualBlocksEnabled: false })
    .returning({ id: classTrails.id })

  return created!
}

/**
 * Associa uma trilha do catálogo (por slug) a uma turma, na ordem dada.
 * Se a trilha ainda não foi semeada (rode os db:seed:js-* / db:seed:python-*),
 * apenas registra um aviso e segue — o seed é idempotente e pega as trilhas que
 * existirem; re-rodar depois de semeá-las completa o vínculo.
 */
async function linkTrailBySlug(classId: string, slug: string, order: number) {
  const [trail] = await db.select({ id: trails.id }).from(trails).where(eq(trails.slug, slug)).limit(1)
  if (!trail) {
    console.log(`  ⚠️   Trilha '${slug}' ainda não semeada — pulando (rode os seeds de trilha e re-execute).`)
    return
  }
  await upsertClassTrail(classId, trail.id, order)
  console.log(`  ✅  #${order} '${slug}' vinculada à turma`)
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

  const [created] = await db.insert(classStudents).values({ classId, studentId }).returning({ id: classStudents.id })

  console.log(`  ✅  Aluno matriculado na turma:`, created!.id)
  return created!
}

// ─── Ordem das trilhas do catálogo por idioma ─────────────────────────────────

const JS_TRAILS = [
  'js-primeiros-passos',
  'js-decisoes-e-repeticoes',
  'js-funcoes',
  'js-listas-e-strings',
  'js-numeros-e-objetos',
  'js-alta-ordem-e-funcional',
  'js-saida-e-formatacao',
  'js-recursao',
  'js-algoritmos',
  'js-sintaxe-moderna',
  'js-colecoes-map-set',
  'js-erros-e-robustez',
  'js-async-await',
  'js-orientacao-a-objetos',
  'js-programacao-visual-p5', // opcional (visual)
]

const PYTHON_TRAILS = [
  'python-primeiros-passos',
  'python-decisoes-e-repeticoes',
  'python-funcoes',
  'python-listas-e-strings',
  'python-estruturas-de-dados',
  'python-saida-e-formatacao',
  'python-alta-ordem-e-funcional',
  'python-recursao-de-verdade',
  'python-poo',
  'python-modulos-e-algoritmos',
]

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
  const alunoDemo = await upsertUser(demoTenant.id, 'aluno@escola-demo.com', 'demo1234', 'student', 'Aluno Demo')

  // ── 3. Duas turmas (JavaScript e Python), 3 alunos cada ─────────────────────
  console.log('\n🎓  Turmas')
  const jsClass = await upsertClass(demoTenant.id, 'Turma JavaScript')
  const pyClass = await upsertClass(demoTenant.id, 'Turma Python')

  // Alunos da Turma JavaScript (3)
  const anaJs = await upsertUser(demoTenant.id, 'ana@escola-demo.com', 'demo1234', 'student', 'Ana Souza')
  const pedroJs = await upsertUser(demoTenant.id, 'pedro@escola-demo.com', 'demo1234', 'student', 'Pedro Lima')
  await upsertClassStudent(jsClass.id, alunoDemo.id)
  await upsertClassStudent(jsClass.id, anaJs.id)
  await upsertClassStudent(jsClass.id, pedroJs.id)

  // Alunos da Turma Python (3)
  const juliaPy = await upsertUser(demoTenant.id, 'julia@escola-demo.com', 'demo1234', 'student', 'Julia Costa')
  const lucasPy = await upsertUser(demoTenant.id, 'lucas@escola-demo.com', 'demo1234', 'student', 'Lucas Moura')
  const marinaPy = await upsertUser(demoTenant.id, 'marina@escola-demo.com', 'demo1234', 'student', 'Marina Alves')
  await upsertClassStudent(pyClass.id, juliaPy.id)
  await upsertClassStudent(pyClass.id, lucasPy.id)
  await upsertClassStudent(pyClass.id, marinaPy.id)

  // ── 4. Trilhas associadas a cada turma, em ordem ────────────────────────────
  console.log('\n🗺️   Trilhas da Turma JavaScript')
  for (let i = 0; i < JS_TRAILS.length; i++) {
    await linkTrailBySlug(jsClass.id, JS_TRAILS[i]!, i + 1)
  }

  console.log('\n🗺️   Trilhas da Turma Python')
  for (let i = 0; i < PYTHON_TRAILS.length; i++) {
    await linkTrailBySlug(pyClass.id, PYTHON_TRAILS[i]!, i + 1)
  }

  console.log('\n🎉  Seed concluído.')
  console.log('\n📋  Credenciais de acesso:')
  console.log('   Gestor        → gestor@escola-demo.com / demo1234')
  console.log('   Turma JS      → aluno@ / ana@ / pedro@ escola-demo.com / demo1234')
  console.log('   Turma Python  → julia@ / lucas@ / marina@ escola-demo.com / demo1234')
  console.log('   URL           → http://localhost:5173/escola-demo/login')
}

seed()
  .catch((err) => {
    console.error('❌  Erro no seed:', err)
    process.exit(1)
  })
  .finally(() => client.end())
