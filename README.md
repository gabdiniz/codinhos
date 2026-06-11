# Codinhos

Plataforma B2B de ensino de programação para crianças de 11 a 14 anos. Escolas contratam como tenant; gestores configuram trilhas e turmas; alunos aprendem JavaScript via desafios práticos com sandbox, gamificação e tutor de IA (Codi).

---

## Stack

| Camada | Tecnologia |
|---|---|
| Monorepo | Turborepo + pnpm workspaces |
| API | Fastify v5, Zod, Drizzle ORM, PostgreSQL |
| SPA interna | Vite + React 19, React Router 6, CSS Modules |
| Web pública | Next.js (planejado) |
| Editor de código | CodeMirror 6 |
| Autenticação | Sessions + cookie httpOnly |
| IA | Anthropic Claude Haiku |
| E-mail | Resend |

---

## Pré-requisitos

- Node.js 20+
- pnpm 9+
- Docker + Docker Compose (para o banco de dados)

---

## Instalação

### 1. Clone e instale as dependências

```bash
git clone https://github.com/gabdiniz/codinhos.git
cd codinhos
pnpm install
```

### 2. Suba o banco de dados

O projeto usa Docker para o PostgreSQL:

```bash
docker compose up -d
```

### 3. Configure as variáveis de ambiente

**API** (`apps/api/.env`):
```bash
cp apps/api/.env.example apps/api/.env
```

Edite `apps/api/.env` e preencha:
- `DATABASE_URL` — string de conexão com o PostgreSQL
- `SESSION_SECRET` — string aleatória com mínimo 32 caracteres
- `ANTHROPIC_API_KEY` — chave da API da Anthropic (para o tutor Codi)
- `RESEND_API_KEY` — chave do Resend (para e-mails)
- `SEED_SUPER_ADMIN_PASSWORD` — senha do super admin (usada só no seed)

**SPA** (`apps/app/.env`):
```bash
cp apps/app/.env.example apps/app/.env
```

### 3. Crie o banco de dados e rode as migrations

```bash
# Cria o banco (se ainda não existir)
createdb codinhos

# Aplica todas as migrations
pnpm --filter @codinhos/api db:migrate
```

### 4. Rode o seed

O seed cria o tenant `__system__` com o super admin, e a **Escola Demo** com usuários prontos para teste:

```bash
pnpm --filter @codinhos/api db:seed
```

Credenciais da Escola Demo:

| Perfil | E-mail | Senha |
|---|---|---|
| Gestor | gestor@escola-demo.com | demo1234 |
| Aluno | aluno@escola-demo.com | demo1234 |

O seed é **idempotente** — pode rodar múltiplas vezes sem duplicar dados.

---

## Como rodar

### Opção 1 — Turbo (recomendado)

```bash
pnpm dev
```

Sobe API e SPA em paralelo.

> **Problema com `pnpm dev`?** Alguns processadores não suportam as instruções AVX usadas pelo binário do Turbo (erro: *HW capability requested*). Use a opção 2.

### Opção 2 — Sem Turbo (dois terminais)

```bash
# Terminal 1 — API (http://localhost:3333)
pnpm --filter @codinhos/api dev

# Terminal 2 — SPA (http://localhost:5173)
pnpm --filter @codinhos/app dev
```

### Opção 3 — Concurrently (um terminal, sem Turbo)

```bash
pnpm dev:local
```

### URLs de desenvolvimento

| Serviço | URL |
|---|---|
| API | http://localhost:3333 |
| SPA | http://localhost:5173 |
| Login Escola Demo | http://localhost:5173/escola-demo/login |
| API Health | http://localhost:3333/health |

---

## Banco de dados

### Criar nova migration após alterar o schema

```bash
pnpm --filter @codinhos/api db:generate
pnpm --filter @codinhos/api db:migrate
```

### Abrir o Drizzle Studio (UI do banco)

```bash
pnpm --filter @codinhos/api db:studio
```

---

## Estrutura do monorepo

```
apps/
  api/        → Fastify — backend único (auth, learn, gamification, ai-tutor…)
  app/        → Vite + React — SPA interna autenticada
  web/        → Next.js — landing pública (planejado)
packages/
  ui/         → componentes React compartilhados
  types/      → tipos TypeScript compartilhados (DTOs, entidades)
  config/     → eslint, tsconfig, prettier base
docs/
  api.md      → contratos completos de todos os endpoints
  database.md → schema completo do banco
agent_docs/   → documentação de contexto para o desenvolvimento
```

---

## Comandos úteis

```bash
pnpm build          # build completo do monorepo
pnpm typecheck      # checagem de tipos em todos os pacotes
pnpm lint           # Biome lint em todo o monorepo
pnpm test           # todos os testes
pnpm format         # formata o código com Biome
```

---

## Multi-tenant

Cada escola é um **tenant** com um `slug` único na URL. Todas as rotas autenticadas seguem o padrão `/:slug/recurso` e toda query ao banco filtra por `tenant_id`.

O tenant `__system__` é interno e hospeda apenas o super admin da plataforma.
