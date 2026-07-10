# Arquitetura do Backend

O backend segue o padrão **Monólito Modular**: organizado por domínio/feature, com camadas claras dentro de cada módulo.

## Estrutura de pastas

```
api/src/
  modules/
    auth/
    tenants/
    users/
    trails/
    challenges/
    gamification/
    ai-tutor/
  shared/
    db/              ← conexão Drizzle + migrations
    middlewares/     ← autenticação, rate limit, tenant injection
    errors/          ← classes de erro padronizadas
    utils/
  app.ts             ← bootstrap: registra plugins e módulos no Fastify
  server.ts          ← entry point: inicia o servidor
```

## Camadas de cada módulo

Cada módulo tem exatamente estas camadas, nesta ordem de responsabilidade:

```
routes.ts      → recebe request HTTP, valida schema, chama service, retorna response
service.ts     → lógica de negócio; orquestra chamadas a repositories e outros services
repository.ts  → queries ao banco via Drizzle; sem lógica de negócio
schema.ts      → tipos TypeScript + validação de input/output (Fastify schema + Zod)
```

### Regras de camada

- `routes` nunca importa `repository` diretamente — passa sempre pelo `service`
- `repository` nunca contém `if/else` de regra de negócio — apenas queries
- `service` não conhece `Request`/`Reply` do Fastify — recebe dados puros, retorna dados puros
- `schema` é a fonte de verdade dos tipos — DTOs gerados a partir dele

## Criando um novo módulo

1. Criar pasta `modules/nome-do-modulo/`
2. Criar os quatro arquivos: `routes.ts`, `service.ts`, `repository.ts`, `schema.ts`
3. Registrar as rotas do módulo em `app.ts`

## Módulos existentes e suas responsabilidades

| Módulo | Responsabilidade |
|---|---|
| `auth` | Login, logout, sessões, reset/convite de senha, consentimento parental no login |
| `tenants` | CRUD de tenants (Super Admin), configurações, theming |
| `tenant-settings` | Configurações e tema do tenant (`/settings`, `/theme` público) |
| `users` | CRUD de usuários, importação CSV de alunos |
| `catalog` | Catálogo global: trilhas, módulos (com `vocabulary`), desafios (Super Admin) |
| `authoring` | Autoria de trilhas próprias do tenant (gestor): trilhas, módulos, desafios + geração de desafio por IA (`generate-challenge`) |
| `tenant-trails` | Trilhas ativadas por tenant |
| `classes` | Turmas, alunos, **professores** (`class_teachers`), trilhas da turma |
| `learn` | Aprendizado do aluno: dashboard, trilha, módulo, desafio (+ `availableVocabulary`) |
| `submissions` | Submissões, validação por testes, revisão manual (gestor/professor) |
| `progress` | Desbloqueio manual de módulo (modo controlado) |
| `gamification` | XP, níveis, badges, ranking, streaks |
| `weekly-challenges` | Desafio da semana por turma |
| `notifications` | Centro de notificações in-app |
| `dashboard` | KPIs e alertas do tenant; detalhe de turma/aluno; fila de revisão |
| `ai-tutor` | Chat com Codi, histórico por desafio, rate limiting; `intent` (`chat`/`hint`/`review`) para dica progressiva e code review |
| `codi-public` | Codi da landing page (`apps/web`): assistente público de dúvidas sobre o produto, alimentado pela KB curada (`docs/codi-kb/`) |
| `integrity` | Detecção de similaridade entre submissões (possível plágio) |
| `parental-consent` | Registro de consentimento parental (LGPD / ECA) |
| `guardians` | Gestão de responsáveis (gestor) + portal read-only do responsável |
| `integrations` | OAuth + rostering do Google Classroom (one-way) |
| `portfolio` | Trilhas concluídas, badges e certificado PDF do aluno |
| `student-profile` | Perfil público do aluno |
| `admin` | Operações de Super Admin |

## Runner compartilhado e correção de desafios

A lógica **pura** de correção vive num pacote próprio do monorepo, `packages/runner`
(`@codinhos/runner`), consumido tanto pelo backend quanto pelo frontend — fonte única de
verdade para os dois lados darem **o mesmo veredito** (back≡front). Ele exporta, entre outros:
`extractFunctionName`/`resolveTargetFn`, `deepEqual` (comparação ordem-insensível de chaves),
`applyMatcher`, o conjunto de globais curados (`SAFE_GLOBALS`), helpers de async
(`resolveMaybeAsync`) e a verificação estrutural (`checkAstRule`).

- **Backend (nota):** `apps/api/src/shared/utils/run-tests.ts` executa o código com `node:vm`
  (timeout) e usa o runner para comparar. `runTests` é **assíncrona** (suporta async/await).
- **Frontend (feedback imediato):** o Web Worker do SPA (`apps/app/.../sandbox.worker.ts`) roda
  com `new Function()` e importa o **mesmo** runner. O front dá o feedback, mas o **backend
  revalida** e é quem grava a nota.
- **Importante:** o runner é publicado como pacote (`prepare: tsc` gera `dist`). Ao adicionar um
  arquivo/export novo nele, é preciso **rebuildar o `dist`** antes de rodar os testes da API e
  antes de subir os containers.

### Modos de teste (`TestCase`)

Um desafio é uma lista de `TestCase`. O modo é decidido pelos campos do caso:

| Modo | Como decide | O que avalia |
|---|---|---|
| function-call | `input` é array | Chama a função-alvo com o `input` e compara o retorno |
| type-check | `input: null` (sem `mode`) | `typeof` de uma variável declarada no código |
| `mode: 'stdout'` | — | Compara a **saída** de `console.log` com o esperado |
| `mode: 'ast'` | + `astRule` | Verifica a **estrutura** do código (recursão, sem laços, usa/proíbe método ou função) — não executa |

Matchers de comparação: `equal` (padrão), `approx` (+`tolerance`), `contains`, `regex`.
Campo `renderMode: 'p5'` marca desafios **visuais** (prévia em iframe no front); a nota continua
vindo dos `testCases` (regras `ast`) ou de validação manual. Detalhe completo da evolução do
motor em `docs/motor-desafios-capacidades.md`.
