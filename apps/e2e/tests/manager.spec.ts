import { test, expect } from '../fixtures/index.ts'

// ─── Área do gestor ───────────────────────────────────────────────────────────

test.describe('Dashboard do gestor', () => {
  test('deve exibir KPIs principais', async ({ managerPage: page }) => {
    await expect(page).toHaveURL(/\/escola-demo\/manager/)
    // Pelo menos um card de estatística deve ser visível
    // ManagerDashboardPage usa kpiCard, não statCard
    await expect(page.locator('[class*="kpiCard"]').first()).toBeVisible()
  })

  test('deve exibir navegação com links para turmas, alunos e configurações', async ({ managerPage: page }) => {
    // ManagerShell renderiza NavLinks com esses labels
    await expect(page.getByRole('link', { name: 'Turmas' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Alunos' })).toBeVisible()
    // "Config." é o label abreviado no shell
    await expect(page.getByRole('link', { name: /config/i })).toBeVisible()
  })
})

test.describe('ClassesPage — turmas', () => {
  test.beforeEach(async ({ managerPage: page }) => {
    await page.goto('/escola-demo/manager/classes')
  })

  test('deve listar turmas ou exibir estado vazio', async ({ managerPage: page }) => {
    const rows  = page.locator('[class*="tableRow"]').first()
    const empty = page.getByText(/nenhuma turma/i)
    await expect(rows.or(empty)).toBeVisible()
  })

  test('deve abrir modal "Nova turma" com campos corretos', async ({ managerPage: page }) => {
    await page.getByRole('button', { name: 'Nova turma' }).click()
    // Modal abre com role="dialog"
    await expect(page.getByRole('dialog')).toBeVisible()
    // ClassesPage usa htmlFor="class-name" → getByLabel funciona
    await expect(page.getByLabel('Nome da turma')).toBeVisible()
  })

  test('deve criar uma nova turma', async ({ managerPage: page }) => {
    await page.getByRole('button', { name: 'Nova turma' }).click()

    const nomeTurma = `Turma E2E ${Date.now()}`
    await page.getByLabel('Nome da turma').fill(nomeTurma)

    // Botão de submit: "Criar turma"
    await page.getByRole('button', { name: 'Criar turma' }).click()

    // Modal fecha e turma aparece na lista
    await expect(page.getByRole('dialog')).not.toBeVisible()
    await expect(page.getByText(nomeTurma)).toBeVisible()
  })

  test('deve cancelar criação ao clicar em Cancelar', async ({ managerPage: page }) => {
    await page.getByRole('button', { name: 'Nova turma' }).click()
    await page.getByRole('button', { name: 'Cancelar' }).click()
    await expect(page.getByRole('dialog')).not.toBeVisible()
  })
})

test.describe('StudentsPage — alunos', () => {
  test.beforeEach(async ({ managerPage: page }) => {
    await page.goto('/escola-demo/manager/students')
    // <h1>Alunos</h1> só aparece quando loading=false e loadError=null
    // É o indicador mais confiável do estado final da página
    await expect(page.getByRole('heading', { name: 'Alunos' })).toBeVisible({ timeout: 20_000 })
  })

  test('deve listar alunos ou exibir estado vazio', async ({ managerPage: page }) => {
    const rows  = page.locator('[class*="tableRow"]').first()
    const empty = page.getByText(/nenhum aluno/i)
    // Assertion timeout padrão é 5s; API pode demorar mais após muitos logins
    await expect(rows.or(empty)).toBeVisible({ timeout: 15_000 })
  })

  test('deve abrir modal de convidar aluno', async ({ managerPage: page }) => {
    await page.getByRole('button', { name: 'Convidar aluno' }).first().click()
    await expect(page.getByRole('dialog')).toBeVisible()
    // InviteModal usa <label> sem htmlFor — busca por placeholder
    await expect(page.getByPlaceholder('Ana Lima')).toBeVisible()
    await expect(page.getByPlaceholder('ana@escola.edu.br')).toBeVisible()
  })

  test('deve filtrar alunos por status usando tabs', async ({ managerPage: page }) => {
    // StudentsPage usa tablist com role="tab", não <select>
    const tabAtivos = page.getByRole('tab', { name: 'Ativos', exact: true })
    await expect(tabAtivos).toBeVisible({ timeout: 15_000 })
    await tabAtivos.click()
    // Tab deve ficar selecionada após click — confirma que não houve crash
    await expect(tabAtivos).toHaveAttribute('aria-selected', 'true')
  })

  test('deve buscar aluno por nome via campo de busca', async ({ managerPage: page }) => {
    // input type="search" tem role searchbox (não textbox)
    const search = page.getByRole('searchbox', { name: 'Buscar alunos' })
    await expect(search).toBeVisible()
    await search.fill('Ana')
    // Campo continua visível após filtrar — confirma que não houve crash
    await expect(search).toBeVisible()
  })
})

test.describe('SettingsPage — configurações', () => {
  test.beforeEach(async ({ managerPage: page }) => {
    await page.goto('/escola-demo/manager/settings')
  })

  test('deve exibir seção de informações da escola', async ({ managerPage: page }) => {
    await expect(page.getByRole('heading', { name: /informações da escola/i })).toBeVisible()
  })

  test('deve exibir seção de tema visual', async ({ managerPage: page }) => {
    await expect(page.getByRole('heading', { name: /tema visual/i })).toBeVisible()
    // Pelo menos um color input deve estar presente
    await expect(page.locator('input[type="color"]').first()).toBeVisible()
  })

  test('deve exibir seção de gamificação', async ({ managerPage: page }) => {
    await expect(page.getByRole('heading', { name: /gamificação/i })).toBeVisible()
  })
})
