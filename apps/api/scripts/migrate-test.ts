// Aplica as migrations no banco de TESTE (codinhos_test), nunca no de desenvolvimento.
// drizzle-kit carrega .env do cwd por padrão — este script força .env.test antes de rodar.
// Uso: pnpm --filter api db:migrate:test
import { config } from 'dotenv'
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const envPath = path.resolve(__dirname, '../.env.test')

config({ path: envPath, override: true })

if (!process.env.DATABASE_URL?.includes('codinhos_test')) {
  console.error(
    `DATABASE_URL não aponta para codinhos_test (valor atual: ${process.env.DATABASE_URL}). Abortando por segurança.`
  )
  process.exit(1)
}

const result = spawnSync('drizzle-kit', ['migrate'], {
  stdio: 'inherit',
  shell: true,
  env: process.env,
})

process.exit(result.status ?? 1)
