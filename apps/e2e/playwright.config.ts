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
  // Login único por role, salvo em apps/e2e/.auth/*.json (ver global-setup.ts).
  // Evita 50+ logins bcrypt sequenciais que sobrecarregavam o servidor durante a suíte.
  globalSetup: './global-setup.ts',
  fullyParallel: false,       // testes compartilham estado de sessão — serial é mais seguro
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,  // 1 retry local para absorver fixture timeout intermitente
  workers: 1,
  reporter: [['html', { open: 'never' }], ['list']],

  // Timeouts folgados: a suíte roda em série contra o stack de dev, que lenteia
  // sob carga (bcrypt no login). Timeouts curtos geravam flakiness intermitente.
  timeout: 60_000,
  expect: { timeout: 15_000 },

  use: {
    baseURL: 'http://localhost:5173',
    // Cada fixture (studentPage/managerPage/adminPage) carrega o storageState
    // do role correspondente — ver fixtures/index.ts e global-setup.ts
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'off',
    actionTimeout: 20_000,
    navigationTimeout: 30_000,
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
