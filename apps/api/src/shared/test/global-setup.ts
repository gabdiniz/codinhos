import { config } from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const envPath = path.resolve(__dirname, '../../../.env.test')

/**
 * Roda uma vez no processo principal antes de qualquer worker ser iniciado.
 * Define DATABASE_URL e demais variáveis de teste antes de o banco ser conectado.
 */
export function setup() {
  config({ path: envPath, override: true })
}
