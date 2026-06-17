import { test as base, type Page } from '@playwright/test'
import path from 'node:path'

// ─── Credenciais de teste (do seed) ──────────────────────────────────────────

export const CREDENTIALS = {
  superAdmin: {
    slug:     '__system__',
    email:    'admin@codinhos.com.br',
    password: process.env.SEED_SUPER_ADMIN_PASSWORD ?? 'dy9589ASyz7Eftus_E7o7A',
  },
  manager: {
    slug:     'escola-demo',
    email:    'gestor@escola-demo.com',
    password: 'demo1234',
  },
  student: {
    slug:     'escola-demo',
    email:    'aluno@escola-demo.com',
    password: 'demo1234',
  },
} as const

// ─── Helper de login ──────────────────────────────────────────────────────────

export async function loginAs(
  page: Page,
  role: keyof typeof CREDENTIALS,
) {
  const creds = CREDENTIALS[role]
  await page.goto(`/${creds.slug}/login`)
  await page.getByLabel(/e-mail/i).fill(creds.email)
  await page.getByLabel(/senha/i).fill(creds.password)
  await page.getByRole('button', { name: /entrar/i }).click()
  // Aguarda navegação pós-login
  await page.waitForURL(/\/(learn|manager|admin)/, { timeout: 30_000 })
}

// ─── Fixture: página já autenticada via storageState ─────────────────────────
//
// Login acontece uma única vez por role no global-setup.ts. Aqui só
// carregamos o cookie de sessão salvo e navegamos para a landing page do
// role — sem repetir o fluxo de login (bcrypt) em cada teste.

interface Fixtures {
  studentPage:  Page
  managerPage:  Page
  adminPage:    Page
}

const authFile = (role: keyof typeof CREDENTIALS) =>
  path.join(__dirname, '..', '.auth', `${role}.json`)

const LANDING = {
  student:    '/escola-demo/learn',
  manager:    '/escola-demo/manager',
  superAdmin: '/__system__/admin',
} as const satisfies Record<keyof typeof CREDENTIALS, string>

export const test = base.extend<Fixtures>({
  studentPage: async ({ browser }, use) => {
    const context = await browser.newContext({ storageState: authFile('student') })
    const page    = await context.newPage()
    await page.goto(LANDING.student)
    await use(page)
    await context.close()
  },

  managerPage: async ({ browser }, use) => {
    const context = await browser.newContext({ storageState: authFile('manager') })
    const page    = await context.newPage()
    await page.goto(LANDING.manager)
    await use(page)
    await context.close()
  },

  adminPage: async ({ browser }, use) => {
    const context = await browser.newContext({ storageState: authFile('superAdmin') })
    const page    = await context.newPage()
    await page.goto(LANDING.superAdmin)
    await use(page)
    await context.close()
  },
})

export { expect } from '@playwright/test'
