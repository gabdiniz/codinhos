# Testes

## Comandos

```bash
pnpm test                        # todos os testes do monorepo
pnpm --filter api test           # testes do backend apenas
pnpm --filter api test:watch     # modo watch
pnpm --filter api test:coverage  # com relatório de cobertura
pnpm --filter @codinhos/runner test   # testes da lógica pura de correção
```

> **Ordem importa:** os testes da API resolvem `@codinhos/runner` pelo **dist** compilado. Ao
> mudar/adicionar export no runner, rodar `pnpm --filter @codinhos/runner build` **antes** dos
> testes da API. Testes de integração da API rodam no **host** (não dentro do container), pois
> conectam no Postgres local.

## Estratégia

### Backend (api)

- **Testes unitários** — `service.ts` de cada módulo. Mockam o repository. Testam regras de negócio isoladas.
- **Testes de integração** — `routes.ts` de cada módulo. Sobem o Fastify com banco de teste real (PostgreSQL em memória ou container Docker). Testam o fluxo completo de request → response.

Não testar `repository.ts` isoladamente — a cobertura vem dos testes de integração.

### Runner de correção (`@codinhos/runner` + `run-tests`)

O motor de correção tem cobertura própria, porque backend e frontend precisam dar **o mesmo
veredito** (back≡front):

- **Testes unitários do runner** — `extractFunctionName`, `deepEqual`, matchers, `checkAstRule`
  (regras estruturais), async.
- **Testes diferenciais** — em `apps/api/.../run-tests.*.test.ts`: rodam o mesmo caso no backend
  (`node:vm`) e na lógica do worker e conferem que **concordam** (`differential`, `stdout`,
  `async`, `ast`). Foi assim que se pegou o bug antigo de ordem de chaves de objeto.

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
| `submissions` | Validação de submissões, cálculo de XP, status por modo de validação |
| `@codinhos/runner` + `run-tests` | Correção (function/type-check/stdout/ast), matchers, async, back≡front |
| `authoring` | Geração de desafio por IA: parse + verificação da solução no runner |
| `gamification` | Cálculo de nível, concessão de badges |
| `ai-tutor` | Rate limiting, sanitização de input, `intent` (dica/review) no prompt |
