import { chromium } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'
import { CREDENTIALS, loginAs } from './fixtures/index.ts'

// ─── Setup global: autentica uma vez por role e salva o storageState ──────────
//
// Problema observado: as fixtures studentPage/managerPage/adminPage faziam
// login do zero em TODO teste. Numa suíte serial (workers: 1) com ~50+ testes,
// isso significa 50+ chamadas a bcrypt.compare sequenciais — o servidor ficava
// progressivamente mais lento ao longo da execução, causando timeouts
// intermitentes nos testes do fim da suíte (fixture timeout, waitForResponse,
// heading que nunca aparece a tempo). Não era race condition de seletor — era
// sobrecarga real do servidor.
//
// Solução: logar uma única vez por role aqui (3 logins no total, ao invés de
// 50+) e reutilizar o cookie de sessão salvo via storageState nas fixtures.
export default async function globalSetup() {
  const authDir = path.join(__dirname, '.auth')
  fs.mkdirSync(authDir, { recursive: true })

  const browser = await chromium.launch()

  const roles = Object.keys(CREDENTIALS) as Array<keyof typeof CREDENTIALS>

  for (const role of roles) {
    const context = await browser.newContext({ baseURL: 'http://localhost:5173' })
    const page = await context.newPage()
    await loginAs(page, role)
    await context.storageState({ path: path.join(authDir, `${role}.json`) })
    await context.close()
  }

  await browser.close()
}
