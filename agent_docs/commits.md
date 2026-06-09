# Convenção de Commits

Seguimos o padrão **Conventional Commits**.

## Formato

```
<tipo>(<escopo>): <descrição curta em português>

[corpo opcional — explica o porquê, não o quê]

[rodapé opcional — breaking changes, issues fechadas]
```

## Tipos

| Tipo | Quando usar |
|---|---|
| `feat` | Nova funcionalidade |
| `fix` | Correção de bug |
| `refactor` | Mudança de código sem alterar comportamento |
| `test` | Adição ou correção de testes |
| `chore` | Tarefas de manutenção (deps, config, scripts) |
| `docs` | Documentação apenas |
| `style` | Formatação, ponto e vírgula — sem mudança de lógica |
| `perf` | Melhoria de performance |

## Escopos

Usar o nome do app ou pacote afetado:

- `web` — app Next.js
- `app` — app Vite
- `api` — backend Fastify
- `ui` — pacote de componentes
- `types` — pacote de tipos
- `config` — configurações do monorepo

## Exemplos

```
feat(api): adicionar endpoint de login com slug de tenant
fix(app): corrigir carregamento do tema ao trocar de rota
refactor(api): extrair validação de sessão para middleware próprio
test(api): adicionar testes de integração para módulo de auth
chore: atualizar dependências do monorepo
feat(app): implementar ranking de turma na tela de gamificação
```

## Branches

```
main          → produção, protegida — nunca commitar direto
develop       → integração — base para PRs
feat/<nome>   → nova feature         ex: feat/sandbox-autocomplete
fix/<nome>    → correção de bug      ex: fix/session-expiry
chore/<nome>  → manutenção           ex: chore/update-drizzle
```

Sempre criar branch a partir de `develop`. PRs apontam para `develop`. Merge de `develop` para `main` apenas em releases.
