Execute o fluxo completo de migration do Drizzle com checklist de segurança.

## Passo 1 — Gerar a migration

Execute:
```
pnpm --filter api db:generate
```

Leia o SQL gerado em `apps/api/src/shared/db/migrations/` e exiba-o na íntegra.

## Passo 2 — Checklist de segurança

Analise o SQL gerado e verifique cada item:

- [ ] Há `DROP TABLE` ou `DROP COLUMN`? → **BLOQUEANTE** — confirmar explicitamente com o usuário antes de continuar
- [ ] Há `ALTER COLUMN` mudando tipo de dado? → **BLOQUEANTE** — pode causar perda de dados
- [ ] Há adição de coluna `NOT NULL` sem `DEFAULT`? → **AVISO** — vai falhar se a tabela tiver dados existentes
- [ ] A migration adiciona índices em tabelas grandes? → **AVISO** — pode travar o banco em produção
- [ ] As novas tabelas com dados de tenant têm coluna `tenant_id`? → obrigatório
- [ ] O constraint único em `(tenant_id, email)` está presente onde necessário?

Se houver itens **BLOQUEANTES**, pare e aguarde confirmação explícita do usuário antes do Passo 3.

## Passo 3 — Aplicar a migration

Após checklist aprovado, execute:
```
pnpm --filter api db:migrate
```

Confirme que a migration foi aplicada com sucesso e informe o nome do arquivo gerado.
