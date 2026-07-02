# ── App (SPA Vite/React) — imagem de produção ──────────────────────────────
# Contexto de build = raiz do monorepo.
#   docker build -f apps/app/Dockerfile --build-arg VITE_API_URL=https://api.seu-dominio -t codinhos-app .
#
# A URL da API é embutida no bundle em BUILD time (Vite), então passe-a como arg.

FROM node:20-bookworm-slim AS build
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /workspace
COPY . .
RUN pnpm install --frozen-lockfile
ARG VITE_API_URL=http://localhost:3333
ENV VITE_API_URL=$VITE_API_URL
RUN pnpm --filter @codinhos/app build

FROM nginx:1.27-alpine AS runtime
COPY apps/app/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /workspace/apps/app/dist /usr/share/nginx/html
EXPOSE 80
