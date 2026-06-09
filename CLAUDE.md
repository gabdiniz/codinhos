# CLAUDE.md

Plataforma B2B de ensino de programação para crianças (11–14 anos). Escolas contratam como tenant; gestores configuram trilhas e turmas; alunos aprendem JS via desafios práticos com sandbox, gamificação e tutor de IA.

---

## Monorepo

Gerenciado com Turborepo.

```
apps/
  web/        → Next.js — páginas públicas (landing, login, cadastro)
  app/        → Vite + React — SPA interna autenticada (dashboard, sandbox, chat)
  api/        → Fastify — backend único para web e app
packages/
  ui/         → componentes React compartilhados
  types/      → tipos TypeScript compartilhados (DTOs, entidades)
  config/     → eslint, tsconfig, prettier base
```

---

## Comandos essenciais

```bash
pnpm install          # instalar dependências
pnpm dev              # rodar todos os apps em paralelo
pnpm build            # build completo do monorepo
pnpm typecheck        # checar tipos em todos os pacotes
pnpm lint             # Biome lint em todo o monorepo
pnpm test             # rodar todos os testes
```

---

## Regras não-negociáveis

1. **CSS variables obrigatórias** — nenhuma cor pode ser valor fixo no código. Sempre `var(--color-*)`. Ver `agent_docs/theming.md`.
2. **tenant_id em toda query** — toda query ao banco deve filtrar por `tenant_id`. Nunca buscar dados sem escopo de tenant. Ver `agent_docs/banco-de-dados.md`.
3. **Nunca commitar direto na `main`** — sempre branch + PR. Ver `agent_docs/commits.md`.
4. **Camadas respeitadas** — `routes` nunca acessa o banco diretamente; `repository` não contém lógica de negócio. Ver `agent_docs/arquitetura.md`.

---

## Documentação de contexto (ler quando relevante)

| Arquivo | Quando ler |
|---|---|
| `agent_docs/arquitetura.md` | Criar ou modificar módulos do backend |
| `agent_docs/banco-de-dados.md` | Qualquer operação com banco, migrations, queries |
| `agent_docs/theming.md` | Qualquer trabalho no frontend (web ou app) |
| `agent_docs/autenticacao.md` | Auth, sessões, rotas protegidas, slug de tenant |
| `agent_docs/gamificacao.md` | XP, nível, streak, badges — qualquer lógica de gamificação |
| `agent_docs/commits.md` | Antes de commitar ou criar branches |
| `agent_docs/testes.md` | Criar, rodar ou corrigir testes |
| `agent_docs/variaveis-de-ambiente.md` | Configurar ambiente local, CI/CD ou deploy |
