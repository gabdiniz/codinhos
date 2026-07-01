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

## Papéis de usuário

| Papel | Acesso | O que faz |
|---|---|---|
| **Super Admin** | global (tenant `__system__`) | Gerencia tenants (escolas), catálogo global de trilhas/módulos/desafios e badges. |
| **Gestor** (`manager`) | tenant | Configura trilhas e turmas, cadastra/importa alunos, vincula professores e responsáveis, conecta o Google Classroom, acompanha o dashboard do tenant. |
| **Professor** (`professor`) | turmas atribuídas | Acompanha só as turmas atribuídas a ele (alunos, progresso) e revisa submissões manuais. Sem acesso a configurações do tenant. |
| **Aluno** (`student`) | próprio progresso | Aprende JavaScript via trilhas/desafios no sandbox, ganha XP/badges, usa o tutor de IA e baixa certificados. |
| **Responsável** (`guardian`) | filhos vinculados | Portal **somente leitura**: acompanha progresso, badges e trilhas dos filhos. Sem sandbox/IA. |

---

## Funcionalidades

**Conteúdo e aprendizado**
- Catálogo global de **trilhas → módulos → desafios** (gerido pelo Super Admin via UI de catálogo), ativado por tenant.
- **Trilha própria da escola** — o gestor pode criar suas próprias trilhas/módulos/desafios (autoria híbrida; `trails.tenant_id`).
- **Trilha embutida "JavaScript: do Fundamento ao Algoritmo"** — 84 desafios do básico ao avançado (`pnpm --filter @codinhos/api db:seed:trilha`).
- **Sandbox JavaScript** com execução segura em Web Worker e editor CodeMirror 6.
- **Autocomplete contextual** — sugere só o vocabulário já ensinado até o módulo atual.
- **Editor de blocos visuais** (Blockly) por trilha (`visualBlocksEnabled`), gerando JS para o mesmo fluxo de submissão.
- **Tutor de IA "Codi"** (Anthropic Claude) com histórico por desafio, limite diário e explicação de erros.
- **Erros de sandbox humanizados** — traduz erros nativos do JS para linguagem acessível à idade.

**Gamificação**
- XP, níveis, **streak** diário, **badges** automáticas e **ranking** de turma. Regras configuráveis por tenant.
- **Desafio da semana** por turma.

**Gestão (escola)**
- Turmas com modos de progressão (livre/sequencial/controlado) e validação (automática/auto+revisão/manual).
- Cadastro individual ou **importação CSV** de alunos; **desbloqueio manual** de módulo no modo controlado.
- **Dashboard** com KPIs e alertas (revisão pendente, inatividade, travamento, possível plágio).
- **Rostering Google Classroom** — importa turma + alunos do Classroom (one-way).

**Papéis e acompanhamento**
- **Professor**: turmas atribuídas, detalhe de turma/aluno e **fila de revisão** de submissões.
- **Portal do responsável**: visão read-only do progresso dos filhos.

**Compliance e integridade**
- **Consentimento parental** (LGPD / ECA Digital) para alunos menores de 12 anos.
- **Detecção de similaridade** entre submissões (possível plágio) no dashboard do gestor.

**Reconhecimento**
- **Certificado em PDF** ao concluir uma trilha, **personalizável por escola** (cores, textos, assinatura, logo; ligável/desligável por curso) + **portfólio** do aluno (trilhas, badges).

**Plataforma**
- Multi-tenant B2B (escola = tenant com `slug` na URL, isolamento por `tenant_id`).
- Notificações in-app; e-mails transacionais (convite, reset de senha) via Resend.

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

## Testes

### Testes de unidade e integração (backend)

```bash
pnpm test                          # todos os testes do monorepo
pnpm --filter @codinhos/api test   # somente backend
```

### Testes E2E (Playwright)

Os testes E2E sobem um browser real contra o ambiente de desenvolvimento. **Antes de rodar**, certifique-se de que a API e a SPA estão no ar (`pnpm dev` ou `pnpm dev:local`) e que o seed foi executado.

**Instalação (primeira vez):**

```bash
pnpm install
pnpm --filter @codinhos/e2e exec playwright install chromium
```

**Rodar os testes:**

```bash
pnpm test:e2e        # headless (CI/terminal)
pnpm test:e2e:ui     # com UI interativa do Playwright
```

**Cobertura dos specs:**

| Arquivo | O que cobre |
|---|---|
| `auth.spec.ts` | Login por role, redirect correto, credencial inválida, logout |
| `student.spec.ts` | Dashboard → trilha → módulo → editor → executar testes → Codi → perfil → ranking |
| `manager.spec.ts` | Dashboard, CRUD de turmas, convidar aluno, filtros, configurações |
| `admin.spec.ts` | Navegação admin, CRUD de tenants, CRUD de badges, listagem de usuários com filtros |

Os testes usam as credenciais do seed. Para alterar, edite `apps/e2e/fixtures/index.ts`.

---

## Comandos úteis

```bash
pnpm build          # build completo do monorepo
pnpm typecheck      # checagem de tipos em todos os pacotes
pnpm lint           # Biome lint em todo o monorepo
pnpm test           # todos os testes (backend)
pnpm test:e2e       # testes E2E (requer dev rodando)
pnpm format         # formata o código com Biome
```

---

## Multi-tenant

Cada escola é um **tenant** com um `slug` único na URL. Todas as rotas autenticadas seguem o padrão `/:slug/recurso` e toda query ao banco filtra por `tenant_id`.

O tenant `__system__` é interno e hospeda apenas o super admin da plataforma.
