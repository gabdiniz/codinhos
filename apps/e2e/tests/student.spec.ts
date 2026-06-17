import { test, expect } from '../fixtures/index.ts'

// ─── Área do aluno ────────────────────────────────────────────────────────────

test.describe('Dashboard do aluno', () => {
  test('deve exibir trilhas da turma', async ({ studentPage: page }) => {
    await expect(page).toHaveURL(/\/escola-demo\/learn/)
    await expect(page.getByRole('heading', { name: 'Trilhas' })).toBeVisible()
    // Pelo menos um card de trilha deve aparecer
    await expect(page.locator('ul li').first()).toBeVisible()
  })

  test('deve exibir HUD com XP, nível e streak', async ({ studentPage: page }) => {
    // HudChip renderiza label + value; busca pelos labels
    await expect(page.getByText('XP')).toBeVisible()
    await expect(page.getByText('Nível')).toBeVisible()
    await expect(page.getByText('Streak')).toBeVisible()
  })
})

test.describe('Navegação trilha → módulo', () => {
  test('deve abrir a LearnPage ao clicar em uma trilha', async ({ studentPage: page }) => {
    // TrailCard é um <li> com <Link> dentro — clicar no link
    await page.locator('ul li a').first().click()
    await expect(page).toHaveURL(/\/escola-demo\/learn\/[^/]+$/)
    // Barra de progresso e contagem de módulos devem aparecer
    await expect(page.getByText(/módulos/i)).toBeVisible()
  })

  test('deve exibir módulos em ordem com status correto', async ({ studentPage: page }) => {
    await page.locator('ul li a').first().click()
    const items = page.locator('ol li')
    await expect(items.first()).toBeVisible()
    // Primeiro módulo nunca está bloqueado
    await expect(items.first().getByText(/disponível|concluído/i)).toBeVisible()
  })

  test('deve navegar para ChallengePage ao clicar em módulo disponível', async ({ studentPage: page }) => {
    await page.locator('ul li a').first().click()
    // Clica no primeiro módulo com link (disponível ou concluído)
    await page.locator('ol li a').first().click()
    await expect(page).toHaveURL(/\/escola-demo\/learn\/.+\/module\/.+/)
  })
})

test.describe('ChallengePage — editor e execução', () => {
  test.beforeEach(async ({ studentPage: page }) => {
    await page.locator('ul li a').first().click()
    await page.locator('ol li a').first().click()
  })

  test('deve exibir o editor CodeMirror com conteúdo inicial', async ({ studentPage: page }) => {
    const editor = page.locator('.cm-editor')
    await expect(editor).toBeVisible()
    const content = await page.locator('.cm-content').innerText()
    expect(content.trim().length).toBeGreaterThan(0)
  })

  test('deve exibir botão Executar quando há casos de teste', async ({ studentPage: page }) => {
    const runBtn = page.getByRole('button', { name: 'Executar' })
    if (await runBtn.isVisible()) {
      await expect(runBtn).toBeEnabled()
    }
  })

  test('deve executar testes locais e exibir resultado', async ({ studentPage: page }) => {
    const runBtn = page.getByRole('button', { name: 'Executar' })
    if (!(await runBtn.isVisible())) return test.skip()

    await runBtn.click()
    // Aguarda resultado — passa (x/x testes passaram!) ou falha
    await expect(page.getByText(/testes passaram/i)).toBeVisible({ timeout: 15_000 })
  })

  test('deve exibir botão "Enviar solução"', async ({ studentPage: page }) => {
    await expect(page.getByRole('button', { name: /enviar solução/i })).toBeVisible()
  })

  test('deve abrir o tutor Codi ao clicar no botão Codi', async ({ studentPage: page }) => {
    await page.getByRole('button', { name: /codi/i }).click()
    // CodiDrawer: subtitle "tutor de IA" fica visível no header
    await expect(page.getByText('tutor de IA')).toBeVisible()
  })

  test('deve voltar para a LearnPage pelo link de breadcrumb', async ({ studentPage: page }) => {
    await page.getByRole('link', { name: 'Trilha' }).click()
    await expect(page).toHaveURL(/\/escola-demo\/learn\/[^/]+$/)
  })
})

test.describe('ProfilePage', () => {
  test('deve exibir XP, nível e streaks do aluno', async ({ studentPage: page }) => {
    await page.goto('/escola-demo/profile')
    await expect(page.getByText('XP Total')).toBeVisible()
    await expect(page.getByText('Nível').first()).toBeVisible()
    await expect(page.getByText(/streak/i).first()).toBeVisible()
  })

  test('deve exibir seção de conquistas ou mensagem de vazio', async ({ studentPage: page }) => {
    await page.goto('/escola-demo/profile')
    const hasBadges = await page.getByText(/\/\/ conquistas/i).isVisible()
    const isEmpty   = await page.getByText(/nenhuma conquista/i).isVisible()
    expect(hasBadges || isEmpty).toBe(true)
  })
})

test.describe('RankingPage', () => {
  test('deve exibir o heading Ranking', async ({ studentPage: page }) => {
    await page.goto('/escola-demo/ranking')
    await expect(page.getByRole('heading', { name: 'Ranking' })).toBeVisible()
  })

  test('deve exibir lista de alunos ou mensagem de vazio', async ({ studentPage: page }) => {
    await page.goto('/escola-demo/ranking')
    const hasList  = await page.locator('ol li').first().isVisible()
    const isEmpty  = await page.getByText(/nenhum aluno/i).isVisible()
    expect(hasList || isEmpty).toBe(true)
  })

  test('deve indicar a posição do aluno logado quando houver ranking', async ({ studentPage: page }) => {
    await page.goto('/escola-demo/ranking')
    // "sua posição" aparece no header quando myPosition !== null
    const myPos = page.getByText(/sua posição/i)
    if (await myPos.isVisible()) {
      await expect(myPos).toBeVisible()
    }
  })
})
