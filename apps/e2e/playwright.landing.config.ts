import { defineConfig, devices } from '@playwright/test'

/**
 * Config dedicada à LANDING PAGE (apps/web, http://localhost:3000, pública).
 * NÃO usa globalSetup — a LP não precisa de login, então rodamos os testes da
 * landing desacoplados da suíte do app (que faz login de super admin/gestor).
 *
 *   pnpm exec playwright test -c playwright.landing.config.ts
 *
 * Pré-requisito: o web (:3000) precisa estar rodando (docker compose up).
 */
export default defineConfig({
  testDir: './tests',
  testMatch: /landing\.spec\.ts/,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'off',
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
})
