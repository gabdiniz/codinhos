# Relatório de Progresso — Sprints 1 a 8

**Data:** 23/06/2026
**Status do `main`:** Sprint 4 backend + snapshots mergeados (PRs #40). UI do professor na branch `feat/app-professor-ui` (aguardando push/PR).

Baseado em `docs/sprints-roadmap.md`. As quatro primeiras sprints do roadmap estão concluídas (backend). Próxima do plano: Sprint 5 (Portal para responsáveis).

---

## Sprint 1 — Fechar lacunas já documentadas ✅ (concluída 18/06/2026)

Itens prometidos em `docs/api.md`/`docs/planejamento.md` mas ausentes no código.

- **1.1 Importação CSV de alunos** (PR #27, `feat/users-csv-import`) — `GET /:slug/users/template` e `POST /:slug/users/import`, cria alunos em lote sem sobrescrever e-mails existentes, retorna `{ created, skipped, errors }`.
- **1.2 Desbloqueio manual de módulo** (PR #28, `feat/progress-module-unlock`) — `PATCH /:slug/progress/modules/:moduleId/unlock`, restrito a turmas em modo `controlled`.
- **Revisão pós-merge** (PR #30, `fix/ajustes-revisao-sprint1`) corrigiu dois bugs reais: BOM UTF-8 quebrando o parser de CSV exportado do Excel, e uma query de unlock sem filtro de `tenant_id` (violação da regra não-negociável).
- PR #26 (`fix/arquivos-truncados`) precedeu as features, restaurando conteúdo cortado em `app.ts`, módulo `users` e schema do banco.

Critério de aceite (endpoints batendo com a doc + testes de erro 400/403/409) atingido.

## Sprint 2 — Ativar o que o backend já entrega ✅ (concluída 18/06/2026, PR #31 `feat/sprint-2`)

Sem arquitetura nova — só UI consumindo módulos já completos. Diferente das outras sprints, foi entregue numa única branch/PR (2.1 + 2.2 + 2.3 juntas), não uma por feature.

- **2.1** Tela de Desafio da Semana.
- **2.2** Centro de notificações (sino + lista).
- **2.3** Erros de sandbox humanizados (traduz `TypeError`/`ReferenceError` etc. para linguagem acessível à idade).

**Gap encontrado e corrigido nesta sessão (22/06):** o worker (`sandbox.worker.ts`) nunca foi atualizado para propagar o campo `errorName`, do qual o humanizador (`humanizeSandboxError.ts`) e o `ChallengePage.tsx` já dependiam desde o merge da 2.3 — a feature estava no ar, mas degradada (caía sempre no fallback genérico). Corrigido isoladamente em PR #32 (`fix/sandbox-worker-error-name`), sem reabrir a sprint.

## Sprint 3 — Compliance e integridade acadêmica ✅ (concluída 22/06/2026)

- **3.1 Consentimento parental — LGPD/ECA Digital** (PR #34, `feat/auth-parental-consent`) — tabela própria `parental_consents` (decisão tomada: auditoria de quem consentiu, quando e versão dos termos, em vez de campo solto em `users`), cálculo de idade `<12` anos a partir de `users.birth_date`, tela de consentimento bloqueando ativação de conta no onboarding.
- **3.2 Detecção de similaridade entre submissões** (PR #33, `feat/submissions-similarity-check`) — módulo novo `integrity`: compara a submissão mais recente de cada aluno por turma+desafio usando coeficiente de Dice sobre bigramas de caracteres (threshold 0.85, mínimo 30 caracteres normalizados para evitar falso positivo em boilerplate vazio). Resultado entra como alerta `possible_plagiarism` no dashboard do gestor, reaproveitando o padrão de alerts existente.

Critério de aceite (nenhum aluno <12 conclui onboarding sem consentimento; gestor vê alerta de submissões muito parecidas) atingido.

## Sprint 4 — Papel de Professor ✅ (backend, 23/06/2026, `feat/auth-teacher-role`)

O valor `'professor'` já existia no enum `role` desde a migration inicial (`0000`) e em todos os tipos/middlewares — não foi preciso migration de enum. O que faltava era o vínculo e o escopo de acesso.

- **Vínculo professor↔turma**: nova tabela `class_teachers` (migration `0003_vinculo_professor_turma`), espelhando `class_students` — sem coluna `tenant_id` própria, escopo de tenant garantido via join em `classes`. FK `RESTRICT`, com `removeAllTeachersFromClass` adicionado ao cascade de deleção de turma.
- **Endpoints de atribuição (gestor)**: `GET/POST /:slug/classes/:classId/teachers` e `DELETE /:slug/classes/:classId/teachers/:teacherId`. `POST` valida que o usuário pertence ao tenant e tem papel `professor` (422 caso contrário), e bloqueia vínculo duplicado (409).
- **Guards revisados**: leitura de `classes` (lista, detalhe, alunos, trilhas) e do `dashboard` (detalhe de turma e de aluno) agora aceitam `manager` + `professor`. CRUD de turma, atribuição de professor/trilha/aluno e a visão geral do tenant (`GET /:slug/dashboard`) seguem restritos a `manager`. Revisão de submissões já aceitava professor.
- **Escopo do professor** (na camada de service, nunca só no guard): professor só enxerga as turmas atribuídas a ele e submissões/alunos dessas turmas. Acesso fora do escopo retorna 404 (mesmo padrão de "cross-tenant ou inexistente"), nunca 403. Aplicado em `classes` (list filtra; detail/students/trails validam), `dashboard` (class/student detail) e `submissions` (list/detail/review).
- **Decisão**: o módulo `learn` (sandbox do próprio aluno, keyed em `req.user.id`) **não** foi aberto ao professor — não está no critério de aceite e o "acompanhamento" é servido pelo dashboard (detalhe de turma/aluno). Estender `/learn` para o professor ver a trilha de um aluno específico fica como refino futuro.
- Testes unitários de serviço (`classes.service.test.ts`) cobrindo atribuição (sucesso, 404, 422, 409) e o escopo do professor nos reads.

Critério de aceite (professor loga, vê só as turmas atribuídas, revisa submissões manuais, sem acesso a configurações de tenant) atingido. UI entregue em `feat/app-professor-ui`:

- **ProfessorShell** (espelha o ManagerShell) + roteamento `/:slug/professor/*`; `LoginPage` e `ProtectedRoute` redirecionam o papel `professor`.
- **Telas**: turmas atribuídas (lista), detalhe de turma (dashboard scoped: stats + alunos com nível/XP/pendências), detalhe de aluno (stats, badges, progresso por trilha) e **fila de revisão** (lista + painel com código/testes + aprovar/reprovar).
- **Novo endpoint** `GET /:slug/dashboard/review-queue` (manager + professor, escopado): lista submissões `under_review`. A revisão reusa `PATCH /:slug/challenges/:challengeId/submissions/:submissionId/review`.

## Sprint 5 — Portal para responsáveis ✅ (backend, 23/06/2026, `feat/guardian-portal`)

- **Modelagem (N:N)**: papel `'guardian'` no enum role (migration `0004_portal_responsaveis`) + tabela `guardian_students` (`tenant_id` explícito, `UNIQUE (tenant_id, guardian_id, student_id)`). Decisão N:N: um responsável com vários filhos e um aluno com mais de um responsável. `'guardian'` propagado nos unions de role (8 arquivos) e enums zod (auth/admin/users).
- **Gestor**: módulo novo `guardians` — `GET/POST /:slug/guardians`, `GET/POST/DELETE /:slug/guardians/:id/students`. `createGuardian` valida todos os `studentIds` **antes** de criar o usuário (evita responsável órfão), gera o convite reaproveitando `createUser`/`createInviteToken` de `users` e o fluxo `accept-invite`.
- **Portal read-only**: `GET /:slug/guardian/children` (resumo) e `GET /:slug/guardian/children/:studentId` (detalhe — reaproveita o `dashboard.repository`). Guard `requireRole('guardian')`; sem sandbox/IA; escopo aos filhos vinculados (fora do escopo → 404).
- Testes de serviço cobrindo criação (409/404/sucesso), vínculos e o escopo do portal. Migration validada (`generate` → "No schema changes").

UI entregue em `feat/app-guardian-ui`: **GuardianShell** + tela de filhos (lista com nível/XP/streak) e detalhe read-only (stats, badges, progresso por trilha). `LoginPage`/`ProtectedRoute` redirecionam o papel `guardian`. **Pendente/V2**: e-mail de resumo semanal (notificações).

## Sprint 6 — Rostering Google Classroom ✅ (backend, 23/06/2026, `feat/integrations-google-classroom`)

Decisão tomada: **sincronização one-way** (importa turma/alunos do Classroom; depois manual). Contínua (job agendado + resolução de conflito) fica para quando houver demanda. Foco no critério de aceite (rostering), **não** SSO de login.

- **OAuth2 (rostering)**: `shared/integrations/google-classroom.ts` — cliente REST via `fetch` (sem SDK): `buildAuthUrl`, troca de code, refresh de token, `listCourses`, `listCourseStudents`. Escopos read-only de Classroom + e-mail.
- **Persistência**: tabela `google_integrations` (migration `0005`, um vínculo por tenant). `refresh_token` guardado — **pendência**: criptografar em repouso.
- **Módulo `integrations`** (gestor): `status`, `auth-url` (state CSRF em cookie httpOnly), `callback` (path fixo `/api/integrations/google/callback` — Google exige redirect URI exato; slug vai no state, autentica pela sessão), `courses`, `import`, `disconnect`.
- **Import one-way**: cria turma a partir do curso, cria alunos por e-mail (com convite `accept-invite`) ou reaproveita existentes, e matricula. Idempotente por aluno; re-importar cria nova turma.
- Env vars `GOOGLE_CLIENT_ID/SECRET/REDIRECT_URI` + setup do Google Cloud documentados em `agent_docs/variaveis-de-ambiente.md`.

**Não testável no sandbox** (sem rede/credenciais) — validado por leitura + `drizzle-kit generate` ("No schema changes"). Requer provisionar OAuth Client no Google e testar o fluxo real. **Pendente**: UI da integração (botão conectar + lista de cursos + importar) e criptografia do refresh token.

## Sprint 7.1 — Autocomplete contextual ✅ (24/06/2026, `feat/sandbox-autocomplete`)

Decisão tomada para a fonte de vocabulário: **campo explícito `vocabulary` (jsonb `string[]`) em `trail_modules`**, curado pelo admin — em vez de auto-derivar de `exampleCode` (que traria ruído).

- **Schema/migration `0006`**: coluna `vocabulary` em `trail_modules`. CRUD de módulo no `catalog` aceita/retorna o campo.
- **`learn`**: `listVocabularyUpToModule(moduleId)` une o vocabulário de todos os módulos da trilha com `order <=` o do módulo atual; `getModuleDetail` e `getChallengeDetail` retornam `availableVocabulary`.
- **Frontend**: `ChallengePage` passa `availableVocabulary` ao `CodeEditor`; `@codemirror/autocomplete` com `override` sugere **apenas** o vocabulário já ensinado (não o JS completo).

**Pendente da Sprint 7**: 7.2 — editor de blocos visuais (maior esforço; `visualBlocksEnabled` já existe e é lido, falta construir o editor; sub-fases a/b/c).

## Sprint 8 — Reconhecimento e portfólio ✅ (24/06/2026, `feat/student-certificates`)

- **Certificado PDF**: geração server-side com `pdfkit` (`shared/pdf/certificate.ts`) — A4 paisagem, com nome do aluno, título da trilha, tenant e data. Sem armazenamento: gerado on-the-fly e validado a cada download (422 se a trilha não está concluída).
- **Módulo `portfolio`** (student): `GET /:slug/portfolio` (trilhas concluídas + em andamento + badges + stats) e `GET /:slug/portfolio/certificates/:trailId` (stream do PDF). Conclusão de trilha derivada de `module_progress` (`completed === total`, `total > 0`) — **sem migration**. Reaproveita `dashboard.repository` para badges/stats.
- **Frontend**: `PortfolioPage` com trilhas concluídas (botão "Baixar certificado" → fetch com `credentials` → blob → download), em andamento (barra de progresso) e badges. Item "Portfólio" adicionado ao `StudentShell`.
- Dep nova no `apps/api`: `pdfkit` (+ `@types/pdfkit`).

---

## Mapa de PRs (sprints 1–3)

| PR | Branch | Entrega |
|---|---|---|
| #26 | `fix/arquivos-truncados` | Pré-requisito da 1.1/1.2 |
| #27 | `feat/users-csv-import` | Sprint 1.1 |
| #28 | `feat/progress-module-unlock` | Sprint 1.2 |
| #29 | `test/ai-tutor-mensagem-amigavel` | Ajuste de teste, fora do escopo das sprints |
| #30 | `fix/ajustes-revisao-sprint1` | Revisão pós-merge da Sprint 1 |
| #31 | `feat/sprint-2` | Sprint 2 completa (2.1+2.2+2.3) |
| #32 | `fix/sandbox-worker-error-name` | Correção de gap da Sprint 2.3 |
| #33 | `feat/submissions-similarity-check` | Sprint 3.2 |
| #34 | `feat/auth-parental-consent` | Sprint 3.1 |

---

## Pendências / próximos passos

- ✅ `meta/0001_snapshot.json` e `meta/0002_snapshot.json` reconstruídos (branch `chore/rebuild-drizzle-snapshots`). Validado: `drizzle-kit generate` contra o schema atual responde "No schema changes" — sem migration fantasma. `0003` (class_teachers) já encadeado em cima.
- `docs/sprints-roadmap.md` e este relatório vão na branch `docs/atualiza-relatorio-sprint4`.
- ✅ **UI do professor** em `apps/app` entregue (`feat/app-professor-ui`): shell, turmas atribuídas, detalhe de turma/aluno e fila de revisão.
- Próxima do roadmap: **Sprint 5 — Portal para responsáveis** (fica mais simples após a 3.1, que já captura e-mail/consentimento do responsável).
