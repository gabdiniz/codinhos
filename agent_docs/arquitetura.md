# Arquitetura do Backend

O backend segue o padrão **Monólito Modular**: organizado por domínio/feature, com camadas claras dentro de cada módulo.

## Estrutura de pastas

```
api/src/
  modules/
    auth/
    tenants/
    users/
    trails/
    challenges/
    gamification/
    ai-tutor/
  shared/
    db/              ← conexão Drizzle + migrations
    middlewares/     ← autenticação, rate limit, tenant injection
    errors/          ← classes de erro padronizadas
    utils/
  app.ts             ← bootstrap: registra plugins e módulos no Fastify
  server.ts          ← entry point: inicia o servidor
```

## Camadas de cada módulo

Cada módulo tem exatamente estas camadas, nesta ordem de responsabilidade:

```
routes.ts      → recebe request HTTP, valida schema, chama service, retorna response
service.ts     → lógica de negócio; orquestra chamadas a repositories e outros services
repository.ts  → queries ao banco via Drizzle; sem lógica de negócio
schema.ts      → tipos TypeScript + validação de input/output (Fastify schema + Zod)
```

### Regras de camada

- `routes` nunca importa `repository` diretamente — passa sempre pelo `service`
- `repository` nunca contém `if/else` de regra de negócio — apenas queries
- `service` não conhece `Request`/`Reply` do Fastify — recebe dados puros, retorna dados puros
- `schema` é a fonte de verdade dos tipos — DTOs gerados a partir dele

## Criando um novo módulo

1. Criar pasta `modules/nome-do-modulo/`
2. Criar os quatro arquivos: `routes.ts`, `service.ts`, `repository.ts`, `schema.ts`
3. Registrar as rotas do módulo em `app.ts`

## Módulos existentes e suas responsabilidades

| Módulo | Responsabilidade |
|---|---|
| `auth` | Login, logout, sessões, reset de senha |
| `tenants` | CRUD de tenants, configurações, theming |
| `users` | CRUD de usuários (gestor, aluno), importação CSV |
| `trails` | Trilhas, módulos, conteúdo de desafios |
| `challenges` | Submissões, validação por testes, histórico |
| `gamification` | XP, níveis, badges, ranking, streaks |
| `ai-tutor` | Chat com IA, histórico de conversa, rate limiting |
