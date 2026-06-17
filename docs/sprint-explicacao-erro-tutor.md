# Sprint Plan — Tutor explica erro ao falhar um teste

> Funcionalidade opcional (configurável pelo Gestor): quando um teste do desafio
> falha, o aluno pode pedir ao Codi para explicar o erro. Não é automático —
> o aluno clica em um botão. Detalhes de produto em `planejamento.md` (seção
> "Chat IA — Tutor"), schema em `database.md` (seção 6) e contratos em `api.md`.

Este documento quebra a implementação em tarefas pequenas e sequenciais.
Cada tarefa = 1 PR (branch a partir de `develop`, conforme `agent_docs/commits.md`).
Peça para eu executar uma tarefa por vez.

---

## Decisões de design (já fechadas)

| Decisão | Escolha | Motivo |
|---|---|---|
| Disparo | Manual (botão), nunca automático | preserva luta produtiva + quota diária de mensagens |
| Onde mora o toggle | `tenants.settings.ai_error_explanation_enabled` (boolean, default `true`) | é escolha pedagógica do Gestor, não limite de custo (diferente de `ai_messages_per_day`, que é do Super Admin) |
| Nova tabela? | Não | `failedTest` é contexto efêmero, só entra no system prompt da chamada; a resposta da IA é salva em `ai_messages` como qualquer mensagem |
| Guardrail contra resposta pronta | Reaproveita o já existente em `buildSystemPrompt` | "explicar o erro" já cai na regra "explique o que está errado, sem dar a solução" |
| Defesa em profundidade | Backend ignora `failedTest` se `aiErrorExplanationEnabled = false`, mesmo que o front envie | evita inconsistência se o front estiver com cache desatualizado |

---

## Sprint 1 — Backend: schema e contexto do erro

### Tarefa 1.1 — `tenant-settings`: novo campo (Task #86)
**Arquivos:** `tenant-settings.schema.ts`, `tenant-settings.service.ts`

- `updateSettingsBodySchema`: adicionar `aiErrorExplanationEnabled: z.boolean().optional()`
- `settingsResponseSchema`: adicionar `aiErrorExplanationEnabled: z.boolean()` (não nullable — sempre resolvido com default)
- `mapSettings()`: `aiErrorExplanationEnabled: tenant.settings?.ai_error_explanation_enabled ?? true`
- `updateSettings()`: incluir o campo no merge de `newSettings` (mesmo padrão de `gamification`, mas direto — não é objeto nested)

### Tarefa 1.2 — `ai-tutor.schema.ts`: campo `failedTest` (Task #87)
**Arquivo:** `ai-tutor.schema.ts`

```typescript
const failedTestSchema = z.object({
  description: z.string().max(500),
  expected: z.string().max(500).optional(),
  actual: z.string().max(500).optional(),
  error: z.string().max(1000).optional(),
})

export const sendMessageBodySchema = z.object({
  message: z.string().min(1).max(2000),
  currentCode: z.string().max(10000).optional(),
  failedTest: failedTestSchema.optional(),
})
```

> Nota: `TestResult.expected`/`actual` no frontend são `unknown` — o front precisa
> serializar (`JSON.stringify` ou `String()`) antes de enviar.

### Tarefa 1.3 — `ai-tutor.repository.ts`: expor o flag (Task #88)
**Arquivo:** `ai-tutor.repository.ts`

- `getTenantAiConfig()`: incluir `aiErrorExplanationEnabled: row.settings?.ai_error_explanation_enabled ?? true` no retorno
- `getConversation()` (em `ai-tutor.service.ts`) e a rota `GET /conversation` já devolvem `dailyLimit` lendo de `tenantConfig` — adicionar `aiErrorExplanationEnabled` no mesmo objeto de resposta, pra o frontend saber se deve mostrar o botão sem round-trip extra

### Tarefa 1.4 — `ai-tutor.service.ts`: usar o contexto no prompt (Task #89)
**Arquivo:** `ai-tutor.service.ts`

- `buildSystemPrompt()`: aceitar `failedTest` opcional; se presente, adicionar seção:
  ```
  ## Teste que falhou
  - Caso: {description}
  - Esperado: {expected}
  - Obtido: {actual}
  - Erro: {error}

  O aluno pediu ajuda especificamente sobre esse erro. Explique a causa de forma
  construtiva, sem reescrever o código corrigido.
  ```
- `sendMessage()`: só passar `body.failedTest` pro prompt se `tenant.aiErrorExplanationEnabled` for `true` (defesa em profundidade — ver tabela de decisões)

---

## Sprint 2 — Backend: testes

> O módulo `ai-tutor` hoje não tem nenhum teste (confirmado — só existe nos
> outros módulos). `agent_docs/testes.md` já lista `ai-tutor` como prioridade
> ("rate limiting, sanitização de input"), então este sprint fecha uma lacuna
> que já existia, não só testa a feature nova.

### Tarefa 2.1 — `ai-tutor.service.test.ts` (Task #90)
Mockar o repository. Cobrir:
- prompt inclui a seção de erro quando `failedTest` é enviado e a feature está habilitada
- `failedTest` é ignorado quando `aiErrorExplanationEnabled = false` (mesmo enviado pelo body)
- comportamento atual preservado quando `failedTest` não é enviado
- `TooManyRequestsError` ainda é lançado antes de qualquer chamada à Anthropic
- mensagens só são persistidas após resposta bem-sucedida da API (regra já existente, mas sem teste hoje)

### Tarefa 2.2 — testes de `tenant-settings` para o novo campo (Task #91)
Estender o teste de integração de `PATCH /:slug/settings` (ou criar, se não existir):
- `GET /settings` retorna `aiErrorExplanationEnabled: true` quando o tenant nunca configurou
- `PATCH /settings { aiErrorExplanationEnabled: false }` persiste e reflete no próximo `GET`
- isolamento entre tenants (um tenant desabilitar não afeta outro — checar `tenant_id`)

---

## Sprint 3 — Frontend: UI do aluno

### Tarefa 3.1 — botão no painel de testes (Task #92)
**Arquivo:** `ChallengePage.tsx` (`TestResultsPanel`)

- Em cada `TestResult` com `passed === false`, renderizar botão "Pedir ajuda ao Codi"
- Clique: abre o `CodiDrawer` (se fechado) e passa o `TestResult` correspondente como contexto inicial

### Tarefa 3.2 — `CodiDrawer` aceita contexto pré-carregado (Task #93)
**Arquivo:** `ChallengePage.tsx` (`CodiDrawer`)

- Novo prop opcional (ex.: `initialFailedTest`)
- Ao receber, pré-popula o campo de mensagem (ex.: "Por que esse teste falhou?") **sem enviar automaticamente** — o aluno confirma o envio
- `handleSend()`: inclui `failedTest` (serializado) no `POST /messages` quando presente; limpa o contexto após o envio para não vazar pra próxima mensagem livre

### Tarefa 3.3 — esconder o botão quando a feature está desligada (Task #94)
**Arquivo:** `ChallengePage.tsx`

- Ler `aiErrorExplanationEnabled` do retorno de `GET /conversation` (já carregado ao abrir o desafio — ver Tarefa 1.3)
- Não renderizar o botão "Pedir ajuda ao Codi" quando `false`

---

## Sprint 4 — Frontend: configuração do gestor

### Tarefa 4 — toggle na `SettingsPage` (Task #95)
**Arquivos:** `SettingsPage.tsx`, `SettingsPage.module.css` (se precisar de estilo novo)

- Nova seção "Tutor de IA", seguindo o padrão visual das seções de Tema/Gamificação já existentes (título, descrição, controle, botão salvar, mensagem de feedback com auto-dismiss)
- Toggle (checkbox ou switch) ligado a `aiErrorExplanationEnabled`
- `PATCH /api/:slug/settings` com `{ aiErrorExplanationEnabled }`
- Cores via `var(--color-*)` — nenhuma cor fixa (regra do projeto)

---

## Sprint 5 — E2E

### Tarefa 5 — cenário completo (Task #96)
**Arquivo:** `student.spec.ts`

- Submeter código que falha um teste conhecido do desafio
- Clicar em "Pedir ajuda ao Codi" no teste falho
- Validar que o `CodiDrawer` abre com a mensagem pré-carregada
- **Não enviar de fato** (evita custo/latência de chamar a Anthropic real e quota de mensagens do dia no E2E) — o teste para na validação do estado da UI antes do envio

---

## Ordem recomendada

```
1.1 → 1.3 → 1.2 → 1.4 → 2.1
1.1 → 2.2
1.4 → 3.1 → 3.2 → 3.3 → 5
1.1 → 4
```

1.1, 1.2 e 1.3 podem ser feitas em qualquer ordem entre si, mas 1.4 depende das três.
