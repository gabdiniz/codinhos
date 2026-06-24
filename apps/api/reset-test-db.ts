// Script temporário — recria o banco de testes do zero.
// Uso: pnpm --filter api exec tsx reset-test-db.ts
// Depois de usar, pode apagar este arquivo (não faz parte da aplicação).
import postgres from 'postgres'

const ADMIN_URL = 'postgresql://postgres:9943@localhost:5432/postgres'

async function main() {
  const sql = postgres(ADMIN_URL, { max: 1 })

  await sql`
    SELECT pg_terminate_backend(pid)
    FROM pg_stat_activity
    WHERE datname = 'codinhos_test' AND pid <> pg_backend_pid()
  `
  await sql`DROP DATABASE IF EXISTS codinhos_test`
  await sql`CREATE DATABASE codinhos_test`

  console.log('codinhos_test recriado com sucesso.')
  await sql.end()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
