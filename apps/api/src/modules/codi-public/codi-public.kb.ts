import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'

// Base de conhecimento pública do Codi (docs/codi-kb). Em dev, o cwd da API é
// apps/api, então a base fica em ../../docs/codi-kb. Em produção, o Dockerfile
// copia a pasta e aponta CODI_KB_DIR para ela.
const KB_DIR = process.env.CODI_KB_DIR ?? path.resolve(process.cwd(), '../../docs/codi-kb')

let cached: string | null = null

/**
 * Carrega e concatena os arquivos da base curada (ignora o README, que é
 * curadoria interna). Cacheia em memória — reiniciar a API recarrega.
 */
export function loadCodiKnowledge(): string {
  if (cached !== null) return cached

  try {
    const files = readdirSync(KB_DIR)
      .filter((f) => f.endsWith('.md') && f.toLowerCase() !== 'readme.md')
      .sort()

    const parts = files.map((f) => readFileSync(path.join(KB_DIR, f), 'utf8').trim())
    cached = parts.join('\n\n---\n\n')

    if (cached.length === 0) {
      console.warn('[codi-public] Base de conhecimento vazia em', KB_DIR)
    }
  } catch (err) {
    console.error('[codi-public] Não foi possível carregar a base em', KB_DIR, err)
    cached = ''
  }

  return cached
}
