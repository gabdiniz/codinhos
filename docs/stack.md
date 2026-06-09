# Stack Técnica

> Decisões técnicas do projeto. Separado do planejamento de produto.

---

## Estrutura do Monorepo

Gerenciado com **Turborepo** — build unificado, cache inteligente, pipelines configuráveis.

```
apps/
  web/          → Next.js (páginas públicas: landing, pricing, login, cadastro)
  app/          → Vite + React (SPA interna: dashboard, sandbox, chat IA)
  api/          → Fastify (backend único para web e app)
packages/
  ui/           → componentes React compartilhados entre web e app
  types/        → tipos TypeScript compartilhados (DTOs, entidades)
  config/       → eslint, tsconfig e prettier base
```

---

## Frontend

### Web — Next.js
Apenas páginas públicas. SSR para SEO e performance nas páginas de marketing.

### App — Vite + React
SPA interna para tudo que requer autenticação. Separado do Next.js intencionalmente — contextos diferentes, sem mistura.

Ambos consomem a mesma `api`.

### Theming por Tenant — CSS Variables

**Regra obrigatória:** nenhuma cor pode ser definida como valor fixo no código em `web` ou `app`. Toda cor deve referenciar uma variável CSS.

```css
/* Correto */
color: var(--color-primary);
background: var(--color-surface);

/* Proibido */
color: #3b82f6;
background: white;
```

Na inicialização do app, o frontend busca o tema do tenant pelo slug e injeta as variáveis no `:root`. O Super Admin define o tema padrão; o Gestor pode sobrescrever dentro dos limites permitidos.

**Variáveis mínimas:**
- `--color-primary`, `--color-secondary`, `--color-accent`
- `--color-background`, `--color-surface`
- `--color-text`, `--color-text-muted`
- `--color-success`, `--color-error`, `--color-warning`

---

## Backend — Fastify (Node.js)

Performático, schema validation nativo, leve. Backend único servindo `web` e `app`.

### Arquitetura: Monólito Modular

Organizado por domínio/feature, com camadas claras dentro de cada módulo.

```
api/src/
  modules/
    auth/
      auth.routes.ts
      auth.service.ts
      auth.repository.ts
      auth.schema.ts
    tenants/
    users/
    trails/
    challenges/
    gamification/
    ai-tutor/
  shared/
    db/                ← conexão Drizzle + migrations
    middlewares/
    errors/
    utils/
  app.ts               ← bootstrap do Fastify
  server.ts            ← entry point
```

### Camadas dentro de cada módulo

| Camada | Responsabilidade |
|---|---|
| `routes` | Recebe request, valida schema, chama service |
| `service` | Lógica de negócio, orquestra repositórios |
| `repository` | Queries no banco via Drizzle, sem lógica |
| `schema` | Tipos TypeScript + validação de input/output |

### Princípios

- Cada feature está 100% contida em sua pasta
- Módulos são independentes — podem ser extraídos para microsserviço no futuro
- Camadas com responsabilidades claras facilitam manutenção humana e por IA

---

## Banco de Dados — PostgreSQL

Relacional, robusto, adequado para o modelo multi-tenant com turmas, alunos e progresso.

### ORM — Drizzle

Type-safe, leve, gera SQL legível, bom suporte a migrations.

### Multi-tenant — Row-level Isolation

Todos os tenants compartilham as mesmas tabelas. Cada tabela relevante tem uma coluna `tenant_id`. Uma camada automática no Drizzle injeta o filtro `tenant_id` em todas as queries, eliminando o risco de vazamento de dados por esquecimento.

```sql
-- Unicidade de email por tenant, não global
UNIQUE (tenant_id, email)
```

---

## Autenticação — Sessions

Sessões armazenadas no banco. Revogação imediata ao remover um usuário ou alterar permissões.

```
session_id → { user_id, tenant_id, role, expires_at }
```

O `tenant_id` na sessão é a fonte de verdade para o isolamento de dados em toda requisição autenticada.

---

## Slugs e Roteamento

Cada tenant tem um slug único (ex: `escola-alpha`).

**URLs do app (path-based):**
```
app.com/:slug/login
app.com/:slug/dashboard
app.com/:slug/trilhas
```

O frontend identifica o tenant pelo slug na URL. O formulário de login já conhece o tenant antes de qualquer input do usuário.

**Login:** `email + senha + slug` → backend busca o usuário filtrando por `tenant_id` + `email`.

> Subdomínio (`escola-alpha.app.com`) considerado para o futuro, fora do escopo atual.

**Endpoints da API:**
```
/api/:slug/courses
/api/:slug/users
```

---

## Hospedagem

Desenvolvimento local até o produto estar funcional. Hospedar apenas ao avançar significativamente.

**Escolha:** Hetzner VPS (Linux puro)

| Prós | Contras |
|---|---|
| Melhor custo-benefício do mercado | Sem managed services — configuração manual (nginx, SSL, deploy) |
| Hardware bom, confiável | — |
| Controle total sobre o ambiente | — |

Migração para AWS (RDS, S3, CloudFront) avaliada quando o negócio escalar e demandar serviços gerenciados.

---

## Provedor de IA

**Anthropic — Claude Haiku** (modelo mais recente da família Haiku). Escolhido pelo custo-benefício em chamadas de alta frequência (uma por mensagem do aluno) e pela qualidade para tarefas de tutoria guiada.

O modelo é referenciado via variável de ambiente `ANTHROPIC_API_KEY` + constante `AI_MODEL` no código — troca de modelo sem alteração de lógica.

---

## Serviço de E-mail

**Resend** — free tier permanente (3.000 e-mails/mês, 100/dia), suficiente para desenvolvimento e uso inicial. API simples, suporte a templates React.

Usado no MVP para: convite de primeiro acesso e recuperação de senha.

---

## Sandbox JS — Execução Segura no Browser

JavaScript do aluno roda em um **iframe sandboxado** — isolado do DOM principal, sem acesso ao `window` da aplicação. A comunicação entre o app e o iframe ocorre via `postMessage`.

Isso evita que código malicioso (ou acidental) de um aluno interfira na plataforma. Quando Python for adicionado (V2), usa Pyodide via WebAssembly no mesmo modelo.

---

## Rate Limiting

Aplicado na camada do Fastify via `@fastify/rate-limit`. Duas camadas:

- **Global:** proteção contra abuso por IP
- **Por usuário autenticado:** limite de mensagens ao chat IA por sessão/desafio (configurável pelo Super Admin por plano de tenant)

---

## V2 — Decisões Técnicas Futuras

### Sandbox Colaborativo — WebSocket Nativo
Fastify via `@fastify/websocket`. Canal persistente para sincronização em tempo real entre duplas. Lógica de sala simples o suficiente para não justificar Socket.io.

### Upload de Vídeo — Cloudflare R2
Object storage para aulas gravadas. Zero egress fee (assistir ao vídeo não gera custo extra), CDN global incluso, API compatível com S3 (reversível sem reescrita de código).
