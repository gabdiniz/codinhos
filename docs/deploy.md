# Deploy de produção

Runbook do deploy do Codinhos num VPS Linux (Hetzner x86) com Docker, Caddy
(TLS automático) e Postgres em container. Roteamento **single-origin por app**:
cada domínio serve seu app e o Caddy encaminha `/api/*` para a API — sem CORS,
cookies de sessão first-party.

```
codinhos.com.br         → landing (Next.js)   +  /api/* → API
app.codinhos.com.br     → SPA interna (Vite)  +  /api/* → API
www.codinhos.com.br     → redirect 301 → apex
```

Serviços do `docker-compose.prod.yml`: `caddy` (única porta pública: 80/443),
`web`, `app`, `api`, `db`, `migrate` (one-shot), `backup` (cron diário).

---

## 1. Provisionar o servidor (Hetzner)

1. Crie um servidor **x86** (ex.: CX22, Ubuntu 24.04 LTS).
2. Aponte o DNS no **Registro.br** para o IP do servidor:

   | Tipo | Nome | Valor |
   |---|---|---|
   | A | `@` | IP do servidor |
   | A | `app` | IP do servidor |
   | A | `www` | IP do servidor |

   (Se o e-mail Resend já usa `send.codinhos.com.br`, não mexa nesses registros.)

3. Acesse por SSH e faça o hardening básico + instale Docker:

   ```bash
   # como root
   apt update && apt upgrade -y
   adduser deploy && usermod -aG sudo deploy
   # copie sua chave pública para o novo usuário
   rsync --archive --chown=deploy:deploy ~/.ssh /home/deploy

   # Docker Engine + compose plugin
   curl -fsSL https://get.docker.com | sh
   usermod -aG docker deploy

   # Firewall: só SSH + HTTP + HTTPS
   ufw allow OpenSSH && ufw allow 80 && ufw allow 443 && ufw enable
   ```

   Desabilite login por senha/root no `sshd_config` (`PasswordAuthentication no`,
   `PermitRootLogin no`) e `systemctl restart ssh`.

---

## 2. Primeiro deploy (manual)

Como usuário `deploy`:

```bash
sudo mkdir -p /opt/codinhos && sudo chown deploy:deploy /opt/codinhos
git clone <URL-do-repo> /opt/codinhos
cd /opt/codinhos

cp .env.docker.example .env
# Edite o .env: DOMAIN, APP_DOMAIN, ACME_EMAIL, POSTGRES_PASSWORD,
# SESSION_SECRET (openssl rand -base64 48), ANTHROPIC_API_KEY, RESEND_API_KEY,
# GOOGLE_* etc. NUNCA use os defaults em produção.

docker compose -f docker-compose.prod.yml up -d --build
```

Ordem de subida: `db` → `migrate` (roda as migrations e sai) → `api`, `app`,
`web` → `caddy` emite os certificados. Acompanhe:

```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f caddy   # ver emissão do TLS
docker compose -f docker-compose.prod.yml logs -f api
```

> **TLS**: o Caddy só emite certificado depois que o DNS resolve para o servidor
> e as portas 80/443 estão abertas. Para não bater no rate limit do Let's
> Encrypt enquanto testa, descomente `acme_ca ...staging...` no `deploy/Caddyfile`.

### Seed inicial (super admin + catálogo de desafios)

O seed não roda automaticamente em prod (só as migrations). Rode uma vez, após
o primeiro `up`, para criar o super admin e popular o catálogo da trilha JS
(84 desafios — sem isso os alunos não têm o que estudar):

```bash
# super admin (usa SEED_SUPER_ADMIN_EMAIL / _PASSWORD do .env)
docker compose -f docker-compose.prod.yml run --rm migrate \
  sh -c "pnpm --filter @codinhos/api db:seed"

# catálogo da trilha de JavaScript
docker compose -f docker-compose.prod.yml run --rm migrate \
  sh -c "pnpm --filter @codinhos/api db:seed:trilha"
```

Confirme antes `SEED_SUPER_ADMIN_EMAIL` / `SEED_SUPER_ADMIN_PASSWORD` no `.env`
e troque a senha no primeiro login.

---

## 3. CI/CD (GitHub Actions)

O workflow `.github/workflows/deploy.yml` faz deploy a cada push na `main`:
conecta por SSH, `git pull` e `docker compose up -d --build`.

Configure em **Settings → Secrets and variables → Actions**:

| Secret | Valor |
|---|---|
| `SSH_HOST` | IP do servidor |
| `SSH_USER` | `deploy` |
| `SSH_KEY` | chave **privada** SSH do `deploy` (gere um par dedicado ao CI) |
| `SSH_PORT` | `22` (opcional) |
| `DEPLOY_PATH` | `/opt/codinhos` |

Gere uma chave só para o CI e autorize no servidor:

```bash
ssh-keygen -t ed25519 -C "github-actions" -f ci_deploy_key
ssh-copy-id -i ci_deploy_key.pub deploy@SEU_IP   # ou cole em ~/.ssh/authorized_keys
# conteúdo de ci_deploy_key (privada) → secret SSH_KEY
```

Disparo manual: aba **Actions → deploy → Run workflow**.

---

## 4. Migrations em produção

Rodam automaticamente no serviço `migrate` (one-shot) antes da `api`, a cada
`up`. Para rodar sob demanda:

```bash
docker compose -f docker-compose.prod.yml run --rm migrate
```

> `drizzle-kit generate` não roda no sandbox de dev — gere as migrations na sua
> máquina/CI e commite. Em produção só rodamos `db:migrate` (aplica o que já
> está versionado). Ver `agent_docs/banco-de-dados.md`.

---

## 5. Backups

O serviço `backup` (postgres:16-alpine) roda `pg_dump` comprimido todo dia às
03:00 (UTC) e mantém `BACKUP_RETENTION_DAYS` (default 14) dias em `./backups/`.
Configurável por `BACKUP_CRON` / `BACKUP_RETENTION_DAYS` no `.env`.

```bash
# backup imediato
docker compose -f docker-compose.prod.yml exec backup /usr/local/bin/backup-db.sh
ls -lt backups/                       # dumps
tail -f backups/backup.log            # log do cron

# restaurar um dump
gunzip -c backups/codinhos-AAAAMMDD-HHMMSS.sql.gz | \
  docker compose -f docker-compose.prod.yml exec -T db \
  psql -U postgres -d codinhos
```

> `backups/` está no `.gitignore`. Copie os dumps para fora do servidor
> (object storage/outra máquina) periodicamente — backup no mesmo disco não
> protege contra perda do servidor.

---

## 6. Pendências de produção (bloqueantes / sensíveis)

- **Google Cloud Console (rostering)**: criar projeto → habilitar Classroom API
  → tela de consentimento (escopos `classroom.courses.readonly`,
  `classroom.rosters.readonly`, `classroom.profile.emails`) → OAuth Client (Web)
  com redirect URI **`https://app.codinhos.com.br/api/integrations/google/callback`**
  → preencher `GOOGLE_CLIENT_ID/SECRET/REDIRECT_URI` no `.env`.
- **Criptografar `refresh_token`** em `google_integrations` (hoje em texto puro).
  Fazer antes de conectar contas Google reais.
- **Rotacionar segredos** que circularam em dev (SESSION_SECRET, chaves de API,
  senha do super admin, senha do Postgres).

---

## 7. Operação do dia a dia

```bash
docker compose -f docker-compose.prod.yml logs -f <serviço>   # logs
docker compose -f docker-compose.prod.yml restart api         # reiniciar
docker compose -f docker-compose.prod.yml up -d --force-recreate  # aplicar .env novo
docker compose -f docker-compose.prod.yml down                # parar (mantém volumes)
```

> Mudar o `.env` só tem efeito ao **recriar** o container (`up -d
> --force-recreate`), não no `restart`.

### Rollback

O deploy usa `git reset --hard origin/main`. Para voltar uma versão:

```bash
cd /opt/codinhos
git reset --hard <SHA-anterior>
docker compose -f docker-compose.prod.yml up -d --build
```

Volumes (`codinhos_db_prod`, `caddy_data`) são preservados. **Nunca** rode
`down -v` em produção — apaga banco e certificados.
