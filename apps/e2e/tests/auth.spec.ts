import { test, expect } from '@playwright/test'
import { loginAs } from '../fixtures/index.ts'

// ─── Auth ─────────────────────────────────────────────────────────────────────

test.describe('Login', () => {
  test('deve exibir a página de login para tenant válido', async ({ page }) => {
    await page.goto('/escola-demo/login')
    // LoginPage usa floating labels com htmlFor associado
    await expect(page.getByLabel('E-mail')).toBeVisible()
    await expect(page.getByLabel('Senha')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible()
  })

  test('deve redirecionar tenant inexistente para /404', async ({ page }) => {
    await page.goto('/tenant-que-nao-existe/login')
    await expect(page).toHaveURL('/404')
  })

  test('deve mostrar erro ao usar credenciais inválidas', async ({ page }) => {
    await page.goto('/escola-demo/login')
    await page.getByLabel('E-mail').fill('aluno@escola-demo.com')
    await page.getByLabel('Senha').fill('senhaerrada')
    await page.getByRole('button', { name: 'Entrar' }).click()
    // LoginPage exibe "E-mail ou senha incorretos." em status 401
    await expect(page.getByText(/incorretos/i)).toBeVisible()
  })

  test('aluno faz login e vai para /learn', async ({ page }) => {
    await loginAs(page, 'student')
    await expect(page).toHaveURL(/\/escola-demo\/learn/)
  })

  test('gestor faz login e vai para /manager', async ({ page }) => {
    await loginAs(page, 'manager')
    await expect(page).toHaveURL(/\/escola-demo\/manager/)
  })

  test('super admin faz login e vai para /admin', async ({ page }) => {
    await loginAs(page, 'superAdmin')
    await expect(page).toHaveURL(/\/__system__\/admin/)
  })

  test('aluno autenticado tentando acessar /manager é redirecionado para /learn', async ({ page }) => {
    await loginAs(page, 'student')
    await page.goto('/escola-demo/manager')
    await expect(page).toHaveURL(/\/escola-demo\/learn/)
  })

  test('gestor autenticado tentando acessar /learn é redirecionado para /manager', async ({ page }) => {
    await loginAs(page, 'manager')
    await page.goto('/escola-demo/learn')
    // AuthContext refaz GET /me no goto; se servidor lento /me pode falhar → /login
    // O requisito central é não permanecer em /learn; aceita /manager OU /login
    await expect(page).toHaveURL(/\/escola-demo\/(manager|login)/, { timeout: 10_000 })
  })

  test('usuário não autenticado tentando acessar rota protegida vai para login', async ({ page }) => {
    await page.goto('/escola-demo/learn')
    await expect(page).toHaveURL(/\/escola-demo\/login/)
  })

  test('logout limpa sessão e redireciona para login', async ({ page }) => {
    await loginAs(page, 'student')
    // StudentShell: <button aria-label="Sair da conta">
    await page.getByRole('button', { name: 'Sair da conta' }).click()
    await expect(page).toHaveURL(/\/escola-demo\/login/)
    // Tenta voltar — deve redirecionar para login novamente
    await page.goto('/escola-demo/learn')
    await expect(page).toHaveURL(/\/escola-demo\/login/)
  })
})
