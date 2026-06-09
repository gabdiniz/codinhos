Revise as alterações atuais do projeto contra as regras definidas em CLAUDE.md e agent_docs/.

## O que revisar

Leia os arquivos modificados via `git diff HEAD` ou `git diff --staged` e verifique cada item abaixo. Para cada problema encontrado, aponte o arquivo, a linha e a correção necessária.

### 1. Arquitetura (agent_docs/arquitetura.md)
- `routes` está chamando `repository` diretamente? (não permitido — deve passar pelo `service`)
- `service` está importando `Request` ou `Reply` do Fastify? (não permitido — deve receber dados puros)
- `repository` contém lógica de negócio (if/else de regras)? (não permitido — apenas queries)

### 2. Banco de dados (agent_docs/banco-de-dados.md)
- Alguma query está sem filtro de `tenant_id`? (crítico — risco de vazamento entre tenants)
- Algum campo `email` sendo usado como único identificador sem `tenant_id`? (deve ser composto)
- Migration editando uma migration já existente? (não permitido — criar nova)

### 3. Frontend — Theming (agent_docs/theming.md)
- Alguma cor definida como valor fixo (`#fff`, `blue`, `rgba(...)`)? (proibido — usar `var(--color-*)`)
- Algum estilo inline com cor hardcoded?

### 4. Autenticação (agent_docs/autenticacao.md)
- `tenant_id` sendo lido de body ou query params em vez da sessão? (não permitido)
- Rotas protegidas sem o middleware `authenticate`?
- Rotas que exigem role sem o middleware `requireRole`?

### 5. Commits (agent_docs/commits.md)
- As mensagens de commit seguem Conventional Commits (`tipo(escopo): descrição`)?
- Algum commit direto na `main`?

### 6. TypeScript
- Execute `pnpm typecheck` e reporte qualquer erro encontrado.

## Formato do relatório

Para cada problema: **[CRÍTICO]**, **[AVISO]** ou **[SUGESTÃO]** seguido do arquivo, linha e descrição.
Se nenhum problema for encontrado, confirme explicitamente que a revisão passou em todos os pontos.
