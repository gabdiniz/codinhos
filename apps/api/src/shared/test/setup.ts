import { config } from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const envPath = path.resolve(__dirname, '../../../.env.test')

/**
 * Roda no início de cada worker (antes dos arquivos de teste serem importados).
 * Garante que DATABASE_URL_TEST está em process.env antes da conexão Drizzle ser criada.
 */
config({ path: envPath, override: true })
