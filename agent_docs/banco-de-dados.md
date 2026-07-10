# Banco de Dados

**PostgreSQL** com ORM **Drizzle**. Estratégia multi-tenant: **row-level isolation**.

## Regra fundamental

**Toda query deve ser filtrada por `tenant_id`.** Sem exceção.

O `tenant_id` vem sempre da sessão autenticada — nunca do body da request ou de parâmetros de URL não verificados. O middleware de autenticação injeta `req.tenantId` em toda requisição autenticada.

```typescript
// CORRETO
const alunos = await db
  .select()
  .from(users)
  .where(and(eq(users.tenantId, req.tenantId), eq(users.role, 'student')))

// ERRADO — jamais buscar sem filtro de tenant
const alunos = await db.select().from(users)
```

## Unicidade de e-mail

E-mails são únicos **por tenant**, não globalmente. O mesmo e-mail pode existir em tenants diferentes.

```typescript
// Constraint composta na tabela users
uniqueIndex('users_tenant_email_idx').on(users.tenantId, users.email)
```

## Convenções de schema (Drizzle)

- Nomes de tabela: `snake_case` no plural (`users`, `course_modules`, `challenge_submissions`)
- Toda tabela relevante ao tenant tem coluna `tenant_id` com FK para `tenants.id`
- Timestamps padrão: `created_at` e `updated_at` em toda tabela
- IDs: UUID v4

```typescript
// Exemplo de tabela
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  email: varchar('email', { length: 255 }).notNull(),
  role: roleEnum('role').notNull(), // 'admin' | 'manager' | 'student'
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  tenantEmailIdx: uniqueIndex('users_tenant_email_idx').on(t.tenantId, t.email),
}))
```

## Desafios: colunas do motor e `testCases`

A tabela `challenges` guarda os casos de teste como **jsonb** (`test_cases`) e tem duas colunas
nullable ligadas ao motor:

- `target_fn` (text) — nome da função avaliada. Null = usa a primeira função declarada
  (retrocompatível). Permite que o aluno escreva funções auxiliares.
- `render_mode` (text) — `null`/`'js'` = desafio normal; `'p5'` = desafio **visual** (o front
  mostra uma prévia do sketch num iframe; a nota vem dos `testCases`/validação manual).

Cada item de `test_cases` pode ter: `input`, `expected`, `description`, `matcher`
(`equal`/`approx`/`contains`/`regex`) + `tolerance`, `mode` (`'stdout'`/`'ast'`) e `astRule`
(`{ kind, name? }`). **Atenção (lição da D2):** ao adicionar um campo em `TestCase`, atualizar
o schema Zod de resposta de **todos** os módulos que devolvem desafio (`authoring`, `catalog` e
principalmente `learn` — o do aluno), senão o fastify-zod **remove** o campo desconhecido da
resposta. Ver `docs/motor-desafios-capacidades.md` e `docs/database.md`.

## Migrations

```bash
pnpm --filter api db:generate   # gerar migration a partir das mudanças no schema
pnpm --filter api db:migrate    # aplicar migrations pendentes
pnpm --filter api db:studio     # abrir Drizzle Studio (visualização do banco)
```

Migrations ficam em `api/src/shared/db/migrations/`. Nunca editar uma migration já aplicada — criar uma nova.
