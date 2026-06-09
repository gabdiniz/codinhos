# Variáveis de Ambiente

> Cada app tem seu próprio arquivo `.env`. Nunca commitar `.env` — apenas `.env.example`.
> Copie o `.env.example` do app para `.env` e preencha os valores antes de rodar.

---

## Localização

```
apps/
  api/   → apps/api/.env
  web/   → apps/web/.env
  app/   → apps/app/.env
```

---

## apps/api (Fastify)

### Obrigatórias

| Variável | Exemplo | Descrição |
|---|---|---|
| `DATABASE_URL` | `postgresql://user:pass@localhost:5432/codinhos` | Connection string do PostgreSQL |
| `SESSION_SECRET` | `uma-string-aleatoria-de-32-chars-minimo` | Segredo para assinar cookies de sessão |
| `ANTHROPIC_API_KEY` | `sk-ant-...` | Chave da API da Anthropic (tutor IA) |
| `NODE_ENV` | `development` | `development`, `test` ou `production` |

### Opcionais (têm padrão)

| Variável | Padrão | Descrição |
|---|---|---|
| `PORT` | `3333` | Porta do servidor Fastify |
| `SESSION_TTL_SECONDS` | `604800` | Duração da sessão em segundos (padrão: 7 dias) |
| `CORS_ORIGIN` | `http://localhost:3000,http://localhost:5173` | Origins permitidas pelo CORS, separadas por vírgula |
| `COOKIE_DOMAIN` | *(não definido)* | Domínio do cookie de sessão. Em produção: `.seudominio.com.br` |

### Email transacional

Necessário para convites de primeiro acesso e recuperação de senha.

| Variável | Exemplo | Descrição |
|---|---|---|
| `EMAIL_FROM` | `noreply@codinhos.com.br` | Remetente dos e-mails |
| `RESEND_API_KEY` | `re_...` | Chave da API do Resend (provedor de e-mail) |

> Se nenhum provedor de e-mail estiver configurado, o service deve logar o link no console
> em `development` (evita bloquear o onboarding local).

### `.env.example` — apps/api

```dotenv
# Banco de dados
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/codinhos

# Sessão
SESSION_SECRET=troque-por-string-aleatoria-segura
SESSION_TTL_SECONDS=604800

# IA
ANTHROPIC_API_KEY=sk-ant-substitua-pela-sua-chave

# Servidor
NODE_ENV=development
PORT=3333
CORS_ORIGIN=http://localhost:3000,http://localhost:5173
COOKIE_DOMAIN=

# Email
EMAIL_FROM=noreply@codinhos.com.br
RESEND_API_KEY=re_substitua-pela-sua-chave
```

---

## apps/web (Next.js — páginas públicas)

### Obrigatórias

| Variável | Exemplo | Descrição |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:3333` | URL base da API (exposta ao browser) |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:5173` | URL do SPA autenticado (para redirecionamentos pós-login) |

> Variáveis prefixadas com `NEXT_PUBLIC_` são incluídas no bundle do cliente. **Não colocar segredos aqui.**

### `.env.example` — apps/web

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:3333
NEXT_PUBLIC_APP_URL=http://localhost:5173
```

---

## apps/app (Vite + React — SPA autenticada)

### Obrigatórias

| Variável | Exemplo | Descrição |
|---|---|---|
| `VITE_API_URL` | `http://localhost:3333` | URL base da API (exposta ao browser) |

> Variáveis prefixadas com `VITE_` são incluídas no bundle do cliente. **Não colocar segredos aqui.**

### `.env.example` — apps/app

```dotenv
VITE_API_URL=http://localhost:3333
```

---

## Segredos vs. públicas

| Variável | Escopo | Segredo? |
|---|---|---|
| `DATABASE_URL` | server-only | ✅ Sim |
| `SESSION_SECRET` | server-only | ✅ Sim |
| `ANTHROPIC_API_KEY` | server-only | ✅ Sim |
| `RESEND_API_KEY` | server-only | ✅ Sim |
| `NEXT_PUBLIC_*` | client bundle | ❌ Nunca segredos |
| `VITE_*` | client bundle | ❌ Nunca segredos |

---

## Produção

Em produção, variáveis secretas **não devem** ser arquivos `.env`. Use o mecanismo da plataforma de deploy:
- **Vercel / Railway / Render:** painel de environment variables da plataforma
- **Docker / VPS:** variáveis de ambiente do container ou secrets manager

A variável `COOKIE_DOMAIN` deve ser definida em produção para que o cookie de sessão funcione
em subdomínios (ex: `COOKIE_DOMAIN=.codinhos.com.br`).

---

## V2 — variáveis futuras

| Variável | App | Quando |
|---|---|---|
| `R2_ACCOUNT_ID` | api | Upload de vídeos (Cloudflare R2) |
| `R2_ACCESS_KEY_ID` | api | Upload de vídeos |
| `R2_SECRET_ACCESS_KEY` | api | Upload de vídeos |
| `R2_BUCKET` | api | Upload de vídeos |
| `NEXT_PUBLIC_R2_PUBLIC_URL` | web/app | Leitura pública de vídeos |
