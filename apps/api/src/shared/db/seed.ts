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
