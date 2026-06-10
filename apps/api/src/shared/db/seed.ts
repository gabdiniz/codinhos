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
import { eq } from 'drizzle-orm'
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

const client = postgres(DATABASE_URL, { max: 1 })
const db = drizzle(client, { schema })

// ─── Seed ─────────────────────────────────────────────────────────────────────

async function seed() {
  console.log('🌱  Iniciando seed...')

  // 1. Tenant __system__
  let [systemTenant] = await db
    .select({ id: tenants.id })
    .from(tenants)
    .where(eq(tenants.slug, '__system__'))
    .limit(1)

  if (!systemTenant) {
    const [created] = await db
      .insert(tenants)
      .values({
        slug: '__system__',
        name: 'Sistema',
        plan: 'internal',
        settings: {},
        isActive: true,
      })
      .returning({ id: tenants.id })
    systemTenant = created!
    console.log('  ✅  Tenant __system__ criado:', systemTenant.id)
  } else {
    console.log('  ⏩  Tenant __system__ já existe:', systemTenant.id)
  }

  // 2. Super Admin
  const [existingAdmin] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, SUPER_ADMIN_EMAIL))
    .limit(1)

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(SUPER_ADMIN_PASSWORD, 12)
    const [admin] = await db
      .insert(users)
      .values({
        tenantId: systemTenant.id,
        email: SUPER_ADMIN_EMAIL,
        passwordHash,
        role: 'super_admin',
        name: 'Super Admin',
        isActive: true,
      })
      .returning({ id: users.id })
    console.log('  ✅  Super Admin criado:', admin!.id)
    console.log('      e-mail:', SUPER_ADMIN_EMAIL)
  } else {
    console.log('  ⏩  Super Admin já existe:', existingAdmin.id)
  }

  console.log('🎉  Seed concluído.')
}

seed()
  .catch((err) => {
    console.error('❌  Erro no seed:', err)
    process.exit(1)
  })
  .finally(() => client.end())
