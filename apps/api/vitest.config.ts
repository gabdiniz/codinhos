import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    // Carrega .env.test antes dos workers iniciarem
    globalSetup: './src/shared/test/global-setup.ts',
    // Garante que vars de ambiente estão disponíveis no worker
    setupFiles: ['./src/shared/test/setup.ts'],
    // forks = processos separados, melhor compatibilidade com ESM
    pool: 'forks',
    poolOptions: {
      forks: {
        // Single fork: testes rodam em série no mesmo processo
        // Evita conflitos de estado no banco de testes
        singleFork: true,
      },
    },
    // Timeout maior para queries de banco
    testTimeout: 15000,
    hookTimeout: 15000,
    // Relatório legível no terminal
    reporter: 'verbose',
  },
})
