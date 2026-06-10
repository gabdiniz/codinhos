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
import { tenants, users } from './schema.js'

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
  await upsertUser(demoTenant.id, 'aluno@escola-demo.com',  'demo1234', 'student', 'Aluno Demo')

  console.log('\n🎉  Seed concluído.')
  console.log('\n📋  Credenciais de acesso:')
  console.log('   Gestor  → gestor@escola-demo.com / demo1234')
  console.log('   Aluno   → aluno@escola-demo.com  / demo1234')
  console.log('   URL     → http://localhost:5173/escola-demo/login')
}

seed()
  .catch((err) => {
    console.error('❌  Erro no seed:', err)
    process.exit(1)
  })
  .finally(() => client.end())
