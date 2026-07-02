# ── API (Fastify) — imagem de produção ─────────────────────────────────────
# Contexto de build = raiz do monorepo (precisa do workspace).
#   docker build -f apps/api/Dockerfile -t codinhos-api .

FROM node:20-bookworm-slim AS build
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /workspace
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @codinhos/api build
# Gera uma pasta autocontida só com deps de produção do pacote da API.
RUN pnpm --filter @codinhos/api deploy --prod /app-api

FROM node:20-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
# node_modules de produção + código compilado + arquivos do pacote (inclui migrations)
COPY --from=build /app-api/node_modules ./node_modules
COPY --from=build /app-api/dist ./dist
COPY --from=build /app-api/package.json ./package.json
COPY --from=build /app-api/src/shared/db/migrations ./src/shared/db/migrations
EXPOSE 3333
CMD ["node", "dist/server.js"]
