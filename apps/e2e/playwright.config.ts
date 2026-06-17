import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright E2E — Codinhos
 *
 * Pré-requisito: api e app devem estar rodando antes de executar os testes.
 * Use `pnpm dev` na raiz do monorepo ou `pnpm dev:local`.
 *
 * URLs:
 *   app  → http://localhost:5173
 *   api  → http://localhost:3000
 *
 * Tenants de teste (criados pelo seed):
 *   __system__   → super admin
 *   escola-demo  → gestor + alunos
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: false,       // testes compartilham estado de sessão — serial é mais seguro
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [['html', { open: 'never' }], ['list']],

  use: {
    baseURL: 'http://localhost:5173',
    // Cookie de sessão persiste entre steps — não usar storageState global
    // pois cada describe loga com role diferente
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'off',
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Não usa webServer pois assume que `pnpm dev` já está rodando.
  // Para CI, adicionar webServer aqui apontando para os dois processos.
})
