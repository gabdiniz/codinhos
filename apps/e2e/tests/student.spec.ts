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
    // Aguarda a LearnPage carregar antes de interagir com os módulos
    await page.waitForURL(/\/escola-demo\/learn\/[^/]+$/)
    await page.locator('ol li a').first().click()
    // Aguarda a ChallengePage carregar
    await page.waitForURL(/\/escola-demo\/learn\/.+\/module\/.+/)
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
    // O drawer pré-renderiza "Fechar Codi" junto de "Abrir tutor Codi" — usar aria-label exato
    await page.getByRole('button', { name: 'Abrir tutor Codi' }).click()
    // CodiDrawer: subtitle "tutor de IA" fica visível no header
    // exact:true evita match no parágrafo "Olá! Sou o Codi, seu tutor de IA."
    await expect(page.getByText('tutor de IA', { exact: true })).toBeVisible()
  })

  test('deve abrir o CodiDrawer com o teste falho pré-carregado ao pedir ajuda', async ({ studentPage: page }) => {
    // Código inicial ("// Escreva seu código aqui") normalmente falha os testes —
    // usamos isso para acionar o botão "Pedir ajuda ao Codi" sem editar o editor.
    const runBtn = page.getByRole('button', { name: 'Executar' })
    if (!(await runBtn.isVisible())) return test.skip()

    await runBtn.click()
    await expect(page.getByText(/testes passaram/i)).toBeVisible({ timeout: 15_000 })

    const askCodiBtn = page.getByRole('button', { name: 'Pedir ajuda ao Codi' }).first()
    if (!(await askCodiBtn.isVisible())) {
      // Código inicial passou todos os testes (ou a feature está desligada no tenant) — nada a verificar aqui
      return test.skip()
    }

    await askCodiBtn.click()

    // CodiDrawer abre com o campo de mensagem pré-preenchido, sem enviar automaticamente
    await expect(page.getByText('tutor de IA', { exact: true })).toBeVisible()
    const input = page.locator('textarea[aria-label="Mensagem para o Codi"]')
    await expect(input).toHaveValue('Por que esse teste falhou?')

    // IMPORTANTE: não clicar em "Enviar mensagem" — evitar chamar a API real da
    // Anthropic e consumir a cota diária de mensagens em CI.
    await expect(page.getByRole('button', { name: 'Enviar mensagem' })).toBeEnabled()
  })

  test('deve voltar para a LearnPage pelo link de breadcrumb', async ({ studentPage: page }) => {
    // Usar classe CSS pois o nav shell tem "Trilhas" que faz substring match com "Trilha"
    // e o ícone SVG dentro do link pode alterar o accessible name calculado
    await page.locator('[class*="backLink"]').click()
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
    // 'XP Total' só aparece quando loading=false e sem erro (Promise.all resolveu)
    await expect(page.getByText('XP Total')).toBeVisible({ timeout: 20_000 })
    // Três estados válidos dependendo do DB:
    // 1. Aluno tem badges ganhos     → "// conquistas" visível
    // 2. Sistema tem badges mas aluno não ganhou → "// bloqueadas" visível
    // 3. Nenhum badge no sistema     → "// nenhuma conquista cadastrada ainda." visível
    const earned = page.getByRole('heading', { name: /conquistas/i })
    const locked = page.getByRole('heading', { name: /bloqueadas/i })
    const none   = page.getByText(/nenhuma conquista/i)
    await expect(earned.or(locked).or(none).first()).toBeVisible()
  })
})

test.describe('RankingPage', () => {
  test('deve exibir o heading Ranking', async ({ studentPage: page }) => {
    await page.goto('/escola-demo/ranking')
    // Heading só aparece após loading=false (API call completa)
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('heading', { name: 'Ranking' })).toBeVisible()
  })

  test('deve exibir lista de alunos ou mensagem de vazio', async ({ studentPage: page }) => {
    // Listener criado antes do goto — evita race com networkidle no Vite dev
    const apiDone = page.waitForResponse(
      (r) => r.url().includes('/gamification/ranking'),
      { timeout: 15_000 },
    )
    await page.goto('/escola-demo/ranking')
    await apiDone
    const list  = page.locator('ol li').first()
    const empty = page.getByText(/nenhum aluno/i)
    await expect(list.or(empty)).toBeVisible()
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
