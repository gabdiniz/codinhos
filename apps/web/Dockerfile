# ── Web (Next.js) — imagem de produção ─────────────────────────────────────
# Contexto de build = raiz do monorepo. Usa a saída `standalone` do Next.
#   docker build -f apps/web/Dockerfile -t codinhos-web .
#
# As variáveis NEXT_PUBLIC_* são inlined no BUILD (componentes 'use client'),
# então precisam ser passadas como build-args — não como env de runtime.

FROM node:20-bookworm-slim AS build
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /workspace
COPY . .
RUN pnpm install --frozen-lockfile
# URLs públicas embutidas no bundle (build time). Defaults = dev; em prod, o
# compose passa os valores reais via build.args.
ARG NEXT_PUBLIC_SITE_URL=http://localhost:3000
ARG NEXT_PUBLIC_APP_URL=http://localhost:5173
ARG NEXT_PUBLIC_API_URL=http://localhost:3333
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL \
    NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
# Liga a saída standalone só aqui (o next.config lê esta env)
ENV BUILD_STANDALONE=true
RUN pnpm --filter @codinhos/web build

FROM node:20-bookworm-slim AS runtime
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
WORKDIR /app
# Saída standalone: servidor mínimo + node_modules traçados
COPY --from=build /workspace/apps/web/.next/standalone ./
COPY --from=build /workspace/apps/web/.next/static ./apps/web/.next/static
COPY --from=build /workspace/apps/web/public ./apps/web/public
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
