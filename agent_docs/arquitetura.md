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
| `tenant-trails` | Trilhas ativadas por tenant |
| `classes` | Turmas, alunos, **professores** (`class_teachers`), trilhas da turma |
| `learn` | Aprendizado do aluno: dashboard, trilha, módulo, desafio (+ `availableVocabulary`) |
| `submissions` | Submissões, validação por testes, revisão manual (gestor/professor) |
| `progress` | Desbloqueio manual de módulo (modo controlado) |
| `gamification` | XP, níveis, badges, ranking, streaks |
| `weekly-challenges` | Desafio da semana por turma |
| `notifications` | Centro de notificações in-app |
| `dashboard` | KPIs e alertas do tenant; detalhe de turma/aluno; fila de revisão |
| `ai-tutor` | Chat com Codi, histórico por desafio, rate limiting |
| `integrity` | Detecção de similaridade entre submissões (possível plágio) |
| `parental-consent` | Registro de consentimento parental (LGPD / ECA) |
| `guardians` | Gestão de responsáveis (gestor) + portal read-only do responsável |
| `integrations` | OAuth + rostering do Google Classroom (one-way) |
| `portfolio` | Trilhas concluídas, badges e certificado PDF do aluno |
| `student-profile` | Perfil público do aluno |
| `admin` | Operações de Super Admin |
