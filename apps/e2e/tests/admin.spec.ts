import { test, expect } from '../fixtures/index.ts'

// ─── Área super admin ─────────────────────────────────────────────────────────

test.describe('AdminShell — navegação', () => {
  test('deve exibir os links do menu admin', async ({ adminPage: page }) => {
    await expect(page).toHaveURL(/\/__system__\/admin/)
    // AdminShell usa labels: 'Escolas', 'Badges', 'Usuários'
    await expect(page.getByRole('link', { name: 'Escolas' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Badges' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Usuários' })).toBeVisible()
  })
})

test.describe('TenantsPage — CRUD de escolas', () => {
  test.beforeEach(async ({ adminPage: page }) => {
    await page.goto('/__system__/admin/tenants')
  })

  test('deve listar tenants existentes', async ({ adminPage: page }) => {
    // escola-demo foi criada pelo seed
    await expect(page.getByText('escola-demo')).toBeVisible()
  })

  test('deve abrir modal "Nova escola" com campos obrigatórios', async ({ adminPage: page }) => {
    await page.getByRole('button', { name: 'Nova escola' }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    // TenantsPage usa <label> sem htmlFor — busca por placeholder
    await expect(page.getByPlaceholder('escola-demo')).toBeVisible()          // Slug
    await expect(page.getByPlaceholder('Escola Municipal João da Silva')).toBeVisible() // Nome
    await expect(page.getByPlaceholder('Ana Lima')).toBeVisible()              // Gestor nome
    await expect(page.getByPlaceholder('gestor@escola.edu.br')).toBeVisible() // Gestor email
  })

  test('deve criar um novo tenant com gestor inicial', async ({ adminPage: page }) => {
    await page.getByRole('button', { name: 'Nova escola' }).click()

    const ts   = Date.now()
    const slug = `e2e-escola-${ts}`

    await page.getByPlaceholder('escola-demo').fill(slug)
    await page.getByPlaceholder('Escola Municipal João da Silva').fill(`Escola E2E ${ts}`)
    await page.getByPlaceholder('Ana Lima').fill('Gestor E2E')
    await page.getByPlaceholder('gestor@escola.edu.br').fill(`gestor-${ts}@e2e.com`)

    await page.getByRole('button', { name: 'Criar escola' }).click()

    // Modal fecha e tenant aparece na lista
    await expect(page.getByRole('dialog')).not.toBeVisible()
    await expect(page.getByText(slug)).toBeVisible()
  })

  test('deve abrir modal de editar ao clicar no botão editar', async ({ adminPage: page }) => {
    // Botão de editar: aria-label="Editar <nome>"
    await page.locator('[class*="actionBtn"]').first().click()
    await expect(page.getByRole('dialog')).toBeVisible()
  })

  test('deve cancelar criação ao fechar o modal', async ({ adminPage: page }) => {
    await page.getByRole('button', { name: 'Nova escola' }).click()
    // Botão X: aria-label="Fechar"
    await page.getByRole('button', { name: 'Fechar' }).click()
    await expect(page.getByRole('dialog')).not.toBeVisible()
  })
})

test.describe('BadgesPage — CRUD de badges', () => {
  test.beforeEach(async ({ adminPage: page }) => {
    await page.goto('/__system__/admin/badges')
    // Botão "Novo badge" só aparece após loading=false (API call)
    await page.waitForLoadState('networkidle')
  })

  test('deve listar badges ou exibir estado vazio', async ({ adminPage: page }) => {
    // Empty state: "Nenhum badge" | Com dados: cards com class cardName
    const cards = page.locator('[class*="cardName"]').first()
    const empty = page.getByText('Nenhum badge')
    await expect(cards.or(empty)).toBeVisible()
  })

  test('deve abrir modal "Novo badge" com campos corretos', async ({ adminPage: page }) => {
    await page.getByRole('button', { name: 'Novo badge' }).first().click()
    await expect(page.getByRole('dialog')).toBeVisible()
    // BadgesPage usa <label> sem htmlFor — busca por placeholder
    await expect(page.getByPlaceholder('primeiro-desafio')).toBeVisible() // Slug
    await expect(page.getByPlaceholder('Primeiro Passo')).toBeVisible()   // Nome
  })

  test('deve criar um novo badge', async ({ adminPage: page }) => {
    await page.getByRole('button', { name: 'Novo badge' }).first().click()

    const ts = Date.now()
    await page.getByPlaceholder('primeiro-desafio').fill(`badge-e2e-${ts}`)
    await page.getByPlaceholder('Primeiro Passo').fill(`Badge E2E ${ts}`)

    // Seleciona trigger: o único <select> no form
    await page.locator('[class*="modalForm"] select').first().selectOption({ index: 1 })

    await page.getByRole('button', { name: 'Criar badge' }).click()

    await expect(page.getByRole('dialog')).not.toBeVisible()
    await expect(page.getByText(`Badge E2E ${ts}`)).toBeVisible()
  })

  test('deve abrir confirmação de exclusão ao clicar no botão de deletar', async ({ adminPage: page }) => {
    const dangerBtn = page.locator('[class*="actionBtnDanger"]').first()
    if (!(await dangerBtn.isVisible())) return test.skip()

    await dangerBtn.click()
    await expect(page.getByRole('dialog')).toBeVisible()
    // Modal de confirmação tem heading "Remover badge" — .first() evita strict mode com múltiplos matches
    await expect(page.getByText(/remover|excluir/i).first()).toBeVisible()
  })
})

test.describe('UsersPage — listagem global', () => {
  test.beforeEach(async ({ adminPage: page }) => {
    await page.goto('/__system__/admin/users')
  })

  test('deve listar usuários e exibir o admin no topo', async ({ adminPage: page }) => {
    await expect(page.getByRole('heading', { name: 'Usuários' })).toBeVisible()
    // Super admin criado pelo seed
    await expect(page.getByText('admin@codinhos.com.br')).toBeVisible()
  })

  test('deve filtrar por role "Gestor"', async ({ adminPage: page }) => {
    // UsersPage usa aria-label="Filtrar por role" no <select>
    await page.getByLabel('Filtrar por role').selectOption('manager')
    await expect(page.getByText('gestor@escola-demo.com')).toBeVisible()
  })

  test('deve filtrar por status ativo sem quebrar', async ({ adminPage: page }) => {
    await page.getByLabel('Filtrar por status').selectOption('true')
    await expect(page.locator('[class*="tableRow"]').first()).toBeVisible()
  })

  test('deve filtrar por status inativo e exibir vazio ou resultados', async ({ adminPage: page }) => {
    await page.getByLabel('Filtrar por status').selectOption('false')
    // Espera a lista recarregar: ou aparece uma linha, ou o estado vazio.
    const rows  = page.locator('[class*="tableRow"]').first()
    const empty = page.getByText(/nenhum usuário/i)
    await expect(rows.or(empty)).toBeVisible()
  })
})
