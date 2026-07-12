#!/usr/bin/env node
/**
 * Copia os assets de runtime do Pyodide (node_modules/pyodide) para
 * public/pyodide/, pra serem servidos como arquivos estáticos pelo Vite.
 *
 * Por quê: o pacote npm `pyodide` resolve seus arquivos (o .wasm, o zip da
 * stdlib, etc.) por caminho de disco quando roda no Node — não existe
 * "disco" no navegador. `loadPyodide({ indexURL })` no sandbox.worker.ts
 * aponta pra esta pasta pública, servida pelo próprio app (autocontido,
 * sem CDN — mesmo princípio já usado pro p5.js embarcado, ver D5-p5 em
 * docs/motor-desafios-capacidades.md).
 *
 * Roda automaticamente no `pnpm install` (script "postinstall"). Não falha
 * o install se o pyodide ainda não estiver presente (ex.: primeira
 * instalação, ordem de resolução do workspace) — só avisa.
 */
import { existsSync, mkdirSync, readdirSync, copyFileSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SRC = join(__dirname, '..', 'node_modules', 'pyodide')
const DEST = join(__dirname, '..', 'public', 'pyodide')

// Não precisa dos arquivos de doc/console/tipos — só o que é carregado em
// runtime (wasm, glue JS, stdlib empacotada, lockfile de versões).
const SKIP = new Set([
  'README.md',
  'console.html',
  'console-v2.html',
  'package.json',
  'pyodide.d.ts',
  'ffi.d.ts',
])

function main() {
  if (!existsSync(SRC)) {
    console.warn(
      '[copy-pyodide-assets] node_modules/pyodide não encontrado — pulando ' +
        '(normal se o pnpm install ainda não terminou de resolver o workspace).',
    )
    return
  }

  mkdirSync(DEST, { recursive: true })

  const files = readdirSync(SRC).filter((f) => !SKIP.has(f) && statSync(join(SRC, f)).isFile())
  for (const file of files) {
    copyFileSync(join(SRC, file), join(DEST, file))
  }

  console.log(`[copy-pyodide-assets] ${files.length} arquivo(s) copiado(s) pra public/pyodide/.`)
}

main()
