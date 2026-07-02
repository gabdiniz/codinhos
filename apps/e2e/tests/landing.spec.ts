import { expect, test } from '@playwright/test'

// A landing page (apps/web) é pública e roda em :3000 — diferente do baseURL
// (:5173, a SPA interna). Por isso usamos URL absoluta e não as fixtures de login.
// Estes testes não dependem de Anthropic/Resend: exercitam só o front público.
const LP = 'http://localhost:3000/'

test.describe('Landing page', () => {
  test('carrega o hero e a chamada principal', async ({ page }) => {
    await page.goto(LP)
    await expect(page.getByRole('heading', { level: 1, name: /programar/i })).toBeVisible()
    await expect(
      page.getByRole('banner').getByRole('link', { name: 'Falar com a gente' }),
    ).toBeVisible()
  })

  test('alterna entre tema claro e escuro', async ({ page }) => {
    await page.goto(LP)
    const html = page.locator('html')
    await expect(html).toHaveAttribute('data-theme', 'light')

    await page.getByRole('button', { name: /Ativar tema/ }).click()
    await expect(html).toHaveAttribute('data-theme', 'dark')

    await page.getByRole('button', { name: /Ativar tema/ }).click()
    await expect(html).toHaveAttribute('data-theme', 'light')
  })

  test('navega por âncora até a seção da trilha', async ({ page }) => {
    await page.goto(LP)
    await page
      .getByRole('navigation', { name: 'Navegação principal' })
      .getByRole('link', { name: 'Trilha' })
      .click()
    await expect(page).toHaveURL(/#trilha$/)
    await expect(page.locator('#trilha')).toBeVisible()
    await expect(page.locator('#trilha').getByText('JavaScript')).toBeVisible()
  })

  test('expande um item do FAQ', async ({ page }) => {
    await page.goto(LP)
    const question = page.getByRole('button', { name: /Precisa instalar alguma coisa/ })
    await expect(question).toHaveAttribute('aria-expanded', 'false')
    await question.click()
    await expect(question).toHaveAttribute('aria-expanded', 'true')
    await expect(page.getByText('Não. O aluno escreve e roda o código')).toBeVisible()
  })

  test('abre o widget do Codi', async ({ page }) => {
    await page.goto(LP)
    await page.getByRole('button', { name: 'Abrir chat do Codi' }).click()
    const dialog = page.getByRole('dialog', { name: 'Converse com o Codi' })
    await expect(dialog).toBeVisible()
    await expect(dialog.getByLabel('Sua pergunta para o Codi')).toBeVisible()
  })

  test('mostra o formulário de contato com os campos', async ({ page }) => {
    await page.goto(LP)
    const contato = page.locator('#contato')
    await expect(contato.getByLabel('Seu nome')).toBeVisible()
    await expect(contato.getByLabel('Escola')).toBeVisible()
    await expect(contato.getByLabel('E-mail')).toBeVisible()
    await expect(contato.getByLabel('Mensagem')).toBeVisible()
    await expect(contato.getByRole('button', { name: 'Enviar mensagem' })).toBeVisible()
  })
})
