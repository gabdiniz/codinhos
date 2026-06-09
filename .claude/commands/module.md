Crie um novo módulo no backend seguindo a arquitetura modular definida em agent_docs/arquitetura.md.

Nome do módulo: $ARGUMENTS

## O que criar

Crie os quatro arquivos abaixo em `apps/api/src/modules/$ARGUMENTS/`:

### `schema.ts`
- Defina os tipos TypeScript da entidade principal do módulo
- Defina os schemas de validação de input/output usando Zod compatível com Fastify
- Inclua os DTOs de criação, atualização e resposta
- Todos os tipos devem incluir `tenantId: string`

### `repository.ts`
- Importe a conexão do banco de `../../shared/db`
- Implemente funções de query usando Drizzle
- Toda query deve receber e filtrar por `tenantId` — sem exceção
- Sem lógica de negócio — apenas queries

### `service.ts`
- Importe o repository do módulo
- Implemente a lógica de negócio
- Receba e passe `tenantId` em todas as operações
- Não importe `Request` ou `Reply` do Fastify — receba apenas dados puros

### `routes.ts`
- Registre as rotas usando o padrão Fastify plugin
- Use o middleware `authenticate` em todas as rotas protegidas
- Use `requireRole` onde aplicável
- Chame apenas o `service` — nunca o `repository` diretamente
- Valide inputs com os schemas definidos em `schema.ts`

## Após criar os arquivos

Informe que o módulo precisa ser registrado manualmente em `apps/api/src/app.ts` e mostre o trecho de código necessário para fazer isso.
