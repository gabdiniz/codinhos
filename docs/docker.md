# Docker — subir tudo com um comando

Toda a stack (Postgres + API + App + Web) roda em containers. Isso também
**contorna o turbo**, que crasha nativamente em algumas máquinas — cada serviço
sobe seu próprio dev server em Linux, sem passar pelo turbo.

## Desenvolvimento (hot-reload)

```bash
docker compose up
# ou, em segundo plano:
docker compose up -d
```

Sobe, em ordem: banco → migrations + seed (one-shot) → API, App e Web.

| Serviço | URL |
|---|---|
| Web (landing, Next.js) | http://localhost:3000 |
| App (SPA interna, Vite) | http://localhost:5173 |
| API (Fastify) | http://localhost:3333 |
| Postgres | localhost:5432 (postgres/postgres) |

O código é bind-montado: editar arquivos recarrega na hora (polling ligado para
funcionar em bind-mounts do Windows/WSL2).

Login inicial do seed: `admin@codinhos.com.br` / `Admin123!codinhos`
(configurável via `.env`).

### Comandos úteis

```bash
docker compose up --build      # rebuild da imagem (após mudar dependências)
docker compose logs -f web     # logs de um serviço
docker compose down            # parar
docker compose down -v         # parar e apagar volumes (banco + node_modules)
docker compose run --rm migrate  # rodar migrations/seed manualmente
```

### Segredos (opcional em dev)

A API sobe sem chaves — só recursos de IA/e-mail ficam inativos. Para ativá-los:

```bash
cp apps/api/.env.example apps/api/.env
# preencha ANTHROPIC_API_KEY, RESEND_API_KEY, etc. — o compose carrega esse arquivo
```

Defaults de dev (seed, session secret) podem ser sobrescritos criando um `.env`
na raiz a partir de `.env.docker.example`.

## Produção (build otimizado)

O `docker-compose.prod.yml` já inclui **Caddy** (reverse proxy + HTTPS
automático via Let's Encrypt), Postgres, migrations one-shot e backup diário.
Só o Caddy publica portas no host (80/443); os demais serviços ficam apenas na
rede interna do compose.

```bash
cp .env.docker.example .env    # ajuste domínio, segredos e senhas
docker compose -f docker-compose.prod.yml up -d --build
```

Roteamento single-origin (sem CORS): `codinhos.com.br` → landing (Next),
`app.codinhos.com.br` → SPA (Vite), ambos com `/api/*` → API (Fastify).
Imagens: API (Node standalone), App (estático em Nginx), Web (Next standalone).

O passo a passo completo de deploy — provisionar o servidor, DNS, seed inicial,
backups, CI/CD e rollback — está em **[`deploy.md`](deploy.md)**.

## Como funciona por dentro

- `Dockerfile.dev` — imagem única de dev compartilhada por api/app/web; instala
  o node_modules do workspace (Linux) e o comando concreto vem do compose.
- Os **node_modules ficam em volumes nomeados** por pacote, para o bind-mount do
  código (com node_modules do host) não os apagar. Por isso, ao mudar
  dependências, rode `docker compose up --build` (e, se necessário,
  `docker compose down -v` para recriar os volumes).
- Portas dos apps são publicadas no host; o navegador fala com a API em
  `localhost:3333`. Entre containers, a API acessa o banco pelo host `db`.

## Solução de problemas

- **Mudei uma dependência e não aparece:** `docker compose down -v && docker compose up --build`.
- **Hot-reload não dispara:** o polling já está ligado (`DOCKER=true` no Vite,
  `WATCHPACK_POLLING=true` no Next). Confirme que está editando os arquivos do
  host montados no container.
- **Seed falhou por dado já existente:** normal em `up` repetido — o seed é
  best-effort e o restante da stack sobe mesmo assim.
- **drizzle-kit não migra:** verifique se o serviço `db` está saudável
  (`docker compose ps`) e o `DATABASE_URL` aponta para o host `db`.
