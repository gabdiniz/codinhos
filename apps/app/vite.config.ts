import path from 'path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Dentro de container (DOCKER=true) escutamos em todas as interfaces e usamos
// polling — em bind-mounts (sobretudo no Windows/WSL2) os eventos nativos de
// arquivo não chegam, e sem polling o hot-reload não dispara.
const inDocker = process.env.DOCKER === 'true'

export default defineConfig({
  plugins: [react()],
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
