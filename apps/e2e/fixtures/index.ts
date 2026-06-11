import { test as base, type Page } from '@playwright/test'

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
  await page.waitForURL(/\/(learn|manager|admin)/)
}

// ─── Fixture: página já autenticada como aluno ────────────────────────────────

interface Fixtures {
  studentPage:  Page
  managerPage:  Page
  adminPage:    Page
}

export const test = base.extend<Fixtures>({
  studentPage: async ({ browser }, use) => {
    const context = await browser.newContext()
    const page    = await context.newPage()
    await loginAs(page, 'student')
    await use(page)
    await context.close()
  },

  managerPage: async ({ browser }, use) => {
    const context = await browser.newContext()
    const page    = await context.newPage()
    await loginAs(page, 'manager')
    await use(page)
    await context.close()
  },

  adminPage: async ({ browser }, use) => {
    const context = await browser.newContext()
    const page    = await context.newPage()
    await loginAs(page, 'superAdmin')
    await use(page)
    await context.close()
  },
})

export { expect } from '@playwright/test'
