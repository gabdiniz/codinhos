import path from 'path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Dentro de container (DOCKER=true) escutamos em todas as interfaces e usamos
// polling — em bind-mounts (sobretudo no Windows/WSL2) os eventos nativos de
// arquivo não chegam, e sem polling o hot-reload não dispara.
const inDocker = process.env.DOCKER === 'true'

export default defineConfig({
  plugins: [react()],
  // O worker do sandbox (sandbox.worker.ts) é um module worker que carrega o
  // Pyodide via import dinâmico (code-splitting). O formato padrão de worker do
  // Vite é 'iife', que não suporta code-splitting e quebra o build de produção.
  // 'es' é compatível e casa com o `new Worker(..., { type: 'module' })`.
  worker: {
    format: 'es',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: inDocker ? true : undefined,
    watch: inDocker ? { usePolling: true } : undefined,
  },
})
