# Testes

## Comandos

```bash
pnpm test                        # todos os testes do monorepo
pnpm --filter api test           # testes do backend apenas
pnpm --filter api test:watch     # modo watch
pnpm --filter api test:coverage  # com relatório de cobertura
```

## Estratégia

### Backend (api)

- **Testes unitários** — `service.ts` de cada módulo. Mockam o repository. Testam regras de negócio isoladas.
- **Testes de integração** — `routes.ts` de cada módulo. Sobem o Fastify com banco de teste real (PostgreSQL em memória ou container Docker). Testam o fluxo completo de request → response.

Não testar `repository.ts` isoladamente — a cobertura vem dos testes de integração.

### Frontend (app / web)

- **Testes de componente** — componentes críticos (formulários, sandbox, gamificação). Usar Vitest + Testing Library.
- Não testar componentes puramente visuais — focar em comportamento e interação.

## Convenções

- Arquivo de teste ao lado do arquivo testado: `auth.service.test.ts` junto de `auth.service.ts`
- Nome dos testes em português, descritivos:
  ```typescript
  it('deve retornar erro 401 quando a senha estiver incorreta', ...)
  it('deve criar sessão válida após login bem-sucedido', ...)
  ```
- Cada teste deve ser independente — sem dependência de ordem de execução
- Usar factories para criar dados de teste, não fixtures estáticas

## O que sempre testar

| Módulo | Prioridade |
|---|---|
| `auth` | Login, logout, reset de senha, expiração de sessão |
| `tenants` | Isolamento de dados entre tenants (crítico) |
| `challenges` | Validação de submissões, cálculo de XP |
| `gamification` | Cálculo de nível, concessão de badges |
| `ai-tutor` | Rate limiting, sanitização de input |
