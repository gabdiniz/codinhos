/**
 * Cria o banco codinhos_test se não existir.
 * Uso: node scripts/create-test-db.mjs
 */
import postgres from 'postgres'

const sql = postgres('postgresql://postgres:9943@localhost:5432/postgres', {
  max: 1,
  onnotice: () => {},
})

try {
  await sql`CREATE DATABASE codinhos_test`
  console.log('✓ Banco codinhos_test criado com sucesso')
} catch (e) {
  if (e.code === '42P04') {
    console.log('✓ Banco codinhos_test já existe')
  } else {
    console.error('✗ Erro ao criar banco:', e.message)
    process.exit(1)
  }
}

await sql.end()
console.log('Pronto! Agora rode: pnpm drizzle-kit migrate')
