# Roadmap de Sprints — Funcionalidades Faltantes

> Baseado em `docs/analise-mercado-funcionalidades.md` (17/06/2026). Cada sprint é dimensionado por complexidade, não por tempo fixo — ajustar duração conforme capacidade do time.
> Convenção de branch: `feat/<nome>` a partir de `develop`, PR de volta para `develop` (ver `agent_docs/commits.md`). Toda query nova deve filtrar por `tenant_id`; toda cor nova via `var(--color-*)`; rotas sempre `routes → service → repository → schema`.

**Status:** Sprints 1–3 concluídas e mergeadas na `main` (até 22/06/2026). Sprint 4 (Papel de Professor) **concluída** (backend `feat/auth-teacher-role` + UI `feat/app-professor-ui`, 23/06/2026). Sprint 5 (Portal de responsáveis) **concluída** (backend + UI). Sprint 6 (rostering Google Classroom) concluída no backend. Sprint 7.1 (autocomplete) e Sprint 8 (certificados + portfólio) concluídas. Sprint 7.2 fase (a) concluída (editor de blocos isolado). Roadmap principal coberto. **Sprint 9 (autoria híbrida de conteúdo)** concluída: 9.1 — gestor cria trilhas próprias (`trails.tenant_id`, migration 0007) + scoping do catálogo; 9.2 — UI de catálogo (CRUD) na área do Super Admin. **Certificado por escola** concluído (migration 0008 `certificate_templates`, PDF parametrizado, construtor no gestor). UIs de gestão concluídas na interface (Professores, Responsáveis, importação CSV, Google Classroom, reset de senha pelo admin). Trilha embutida **"JavaScript: do Fundamento ao Algoritmo"** (96 módulos: 84 desafios + 12 lições teóricas intercaladas, reordenados por pré-requisito) via `db:seed:trilha`. **Evolução do motor de aprendizado (D1–D5)** concluída e mergeada — runner unificado, saída de `console.log`, Codi pedagógico (dica/review), geração de desafios por IA, async/await, verificação estrutural (AST) e desafios visuais p5.js (ver seção própria + `docs/motor-desafios-capacidades.md`). Faltam só refinos (7.2 b/c), conteúdo de catálogo para os modos novos, e backlog opcional.

---

## Sprint 1 — Fechar lacunas já documentadas ✅ Concluída (18/06/2026)

Itens prometidos em `docs/api.md`/`docs/planejamento.md` mas ausentes no código. Maior risco de confiança (doc promete, produto não entrega), menor esforço de implementação.

**1.1 — Importação CSV de alunos** ✅
- Módulo: `users` (existente)
- Novo: `GET /:slug/users/template` (baixa modelo CSV), `POST /:slug/users/import` (multipart, parse linha a linha)
- Regras: cria `role: 'student'`, ignora e-mails já existentes sem sobrescrever, não interrompe no primeiro erro
- Resposta: `{ data: { created, skipped, errors: [{ row, reason }] } }`
- Guard: `[resolveTenant, authenticate, requireRole('manager')]`
- Branch: `feat/users-csv-import`
- Revisão pós-merge corrigiu um bug real: CSVs exportados do Excel no Windows trazem BOM UTF-8 no início, o que quebrava a validação do cabeçalho. Corrigido em `fix/ajustes-revisao-sprint1`.

**1.2 — Desbloqueio manual de módulo (modo "Controlado")** ✅
- Módulo novo: `progress` (routes/service/repository — schema já existe: `module_progress.unlocked_by`/`unlocked_at`)
- Novo: `PATCH /:slug/progress/modules/:moduleId/unlock` com body `{ studentId, classId }`
- Regras: 400 se a turma não estiver em `progressionMode: 'controlled'`; 403 se o módulo não pertencer a uma trilha atribuída à turma
- Guard: manager
- Branch: `feat/progress-module-unlock`
- Revisão pós-merge corrigiu um gap de isolamento: `updateModuleProgressUnlock` fazia UPDATE sem filtro de `tenant_id` (regra não-negociável do `CLAUDE.md`). Corrigido em `fix/ajustes-revisao-sprint1`.

**Critério de aceite do sprint:** os dois endpoints documentados em `docs/api.md` existem e se comportam exatamente como descrito; testes de integração cobrindo os casos de erro (400/403/409). — **Atingido.**

---

## Sprint 2 — Ativar o que o backend já entrega

Zero risco de arquitetura nova — é só construir a UI que falta em `apps/app`.

**2.1 — Tela de Desafio da Semana** (consome módulo `weekly-challenges`, já completo)
**2.2 — Centro de notificações** (sino + lista, consome módulo `notifications`, já completo)
**2.3 — Erros de sandbox humanizados** — camada de tradução de erros nativos do JS (`TypeError`, `ReferenceError`, etc.) para mensagens em linguagem acessível à idade, no painel de resultado do desafio. Não confundir com a explicação via IA (`aiErrorExplanationEnabled`), que é um recurso separado e já existe.

**Critério de aceite:** aluno vê desafio da semana e notificações sem precisar de nenhuma chamada de API nova; mensagens de erro do sandbox não mostram mais stack trace nativo por padrão.

---

## Sprint 3 — Compliance e integridade acadêmica

**3.1 — Consentimento parental (LGPD / ECA Digital)**
- `users.birth_date` já existe (migration `0001_robust_viper.sql`) — calcular se aluno tem menos de 12 anos no cadastro
- Novo fluxo no onboarding: tela de consentimento destacada e específica antes de ativar a conta de alunos <12 anos
- Decisão de design pendente: registrar consentimento como campo em `users` ou tabela própria `parental_consents` (recomendado, para auditoria — quem consentiu, quando, versão dos termos)
- Branch: `feat/auth-parental-consent`

**3.2 — Detecção de similaridade entre submissões**
- Novo serviço (pode viver em `submissions` ou módulo próprio `integrity`) que compara submissões do mesmo desafio dentro da turma
- Abordagem inicial simples: normalizar código (remover espaços/comentários/nomes de variável) e comparar hash ou distância de edição
- Resultado some como alerta novo no dashboard do gestor (`possible_plagiarism`), reaproveitando o padrão de alerts já existente em `dashboard.service.ts`
- Branch: `feat/submissions-similarity-check`

**Critério de aceite:** nenhum aluno <12 anos consegue concluir o onboarding sem consentimento registrado; gestor vê alerta quando duas submissões do mesmo desafio são muito parecidas.

---

## Sprint 4 — Papel de Professor ✅ Backend concluído (23/06/2026)

- ~~Adicionar `'professor'` ao enum de role~~ — já existia desde a migration `0000` (e em todos os tipos/middlewares); não precisou de migration de enum.
- ✅ Vínculo professor↔turma: nova tabela `class_teachers` (migration `0003`), espelhando `class_students` (escopo de tenant via join em `classes`). Cascade de deleção de turma atualizado.
- ✅ Endpoints de atribuição (gestor): `GET/POST /:slug/classes/:classId/teachers`, `DELETE .../teachers/:teacherId`.
- ✅ Guards revisados: leitura de `classes` e detalhe de turma/aluno do `dashboard` aceitam `manager` + `professor`; CRUD e visão geral do tenant seguem manager-only. Escopo do professor às turmas atribuídas aplicado na camada de service (fora do escopo → 404), em `classes`, `dashboard` e `submissions`.
- Decisão: `learn` (sandbox do próprio aluno) **não** foi aberto ao professor — fora do critério de aceite; acompanhamento é via dashboard. Estender depois se necessário.
- Branch: `feat/auth-teacher-role`

**Critério de aceite:** professor loga, vê só as turmas atribuídas a ele, revisa submissões manuais, não tem acesso a configurações de tenant. — **Atingido no backend.**

✅ **UI do professor** em `apps/app` (`feat/app-professor-ui`): ProfessorShell + telas de turmas atribuídas, detalhe de turma/aluno e fila de revisão (`GET /dashboard/review-queue` + aprovar/reprovar). Login e ProtectedRoute redirecionam `professor` → `/:slug/professor`.

---

## Sprint 5 — Portal para responsáveis ✅ Backend concluído (23/06/2026)

- ✅ Papel `'guardian'` adicionado ao enum role (migration `0004`) + tabela de junção **N:N** `guardian_students` (com `tenant_id` explícito) — um responsável tem vários filhos e um aluno pode ter mais de um responsável.
- ✅ Gestor: `GET/POST /:slug/guardians`, `GET/POST/DELETE /:slug/guardians/:id/students`. Criação envia convite (reusa o fluxo `accept-invite` dos demais usuários).
- ✅ Portal read-only do responsável: `GET /:slug/guardian/children` e `GET /:slug/guardian/children/:studentId` (stats, badges, progresso por trilha). Sem sandbox/chat IA (guards `requireRole('guardian')`); escopo aos filhos vinculados (fora do escopo → 404).
- Branch: `feat/guardian-portal`

**Critério de aceite:** responsável recebe convite, define senha, vê dashboard somente leitura do(s) filho(s) vinculados ao seu tenant. — **Atingido no backend.**

✅ **UI do responsável** (`feat/app-guardian-ui`): GuardianShell + telas de filhos (lista) e detalhe read-only (stats, badges, progresso por trilha). Login/ProtectedRoute redirecionam `guardian` → `/:slug/guardian`. Opcional/V2: e-mail de resumo semanal.

---

## Sprint 6 — SSO / rostering com Google Classroom ✅ Backend concluído (23/06/2026)

- ✅ **Decisão: sincronização one-way** (importa e mantém manual depois) — menor complexidade; contínua (job + conflito) fica para validação de demanda.
- ✅ OAuth2 com Google (rostering, não login SSO): conectar conta → `auth-url`/`callback` (path fixo, state via cookie CSRF). Tokens por tenant em `google_integrations` (migration `0005`).
- ✅ Classroom API via REST/`fetch` (`shared/integrations/google-classroom.ts`): cursos + alunos. Módulo `integrations`: status/auth-url/callback/courses/import/disconnect.
- ✅ Import: curso → turma + alunos (cria por e-mail com convite, reaproveita existentes) + matrículas. Idempotente por aluno.
- Decisão: **SSO de login com Google** ficou de fora (não está no critério de aceite); pode entrar como V2.
- Branch: `feat/integrations-google-classroom`

**Critério de aceite:** gestor conecta a conta Google do Classroom, escolhe uma turma do Classroom, e ela aparece populada em Codinhos sem cadastro manual de aluno por aluno. — **Atingido no backend** (requer credenciais Google + teste real; sandbox sem rede).

**Pendente:** UI da integração em `apps/app` (botão conectar + lista de cursos + importar, na tela de Config.) e criptografia em repouso do `refresh_token`.

---

## Sprint 7 — Editor avançado de sandbox

**7.1 — Autocomplete contextual** ✅ (`feat/sandbox-autocomplete`, 24/06/2026) — novo campo `vocabulary` (jsonb `string[]`) em `trail_modules` (migration `0006`, curado pelo admin no catálogo). `learn` retorna `availableVocabulary` (união do vocab dos módulos com `order <=` o atual). No editor (CodeMirror 6) o `@codemirror/autocomplete` usa `override` para sugerir **só** esse vocabulário, não o JS inteiro.
**7.2 — Editor de blocos visuais** — ✅ **fase (a) concluída** (`feat/sandbox-visual-blocks`, 24/06/2026). Editor Blockly (modo blocos isolado) que aparece no `ChallengePage` quando `visualBlocksEnabled` está ligado, em vez do CodeMirror. Toolbox de lógica básica (Lógica, Laços, Matemática, Texto, Variáveis, Funções); os blocos geram JavaScript (`javascriptGenerator`) que alimenta o mesmo fluxo de submissão/sandbox (`text_print` → `console.log`). Locale pt-br. **Falta**: (b) modo híbrido blocos+texto e (c) conversão bidirecional bloco↔texto.

**Critério de aceite:** trilha com `visualBlocksEnabled` ligado mostra editor de blocos funcional para ao menos os módulos de lógica básica.

---

## Sprint 8 — Reconhecimento e portfólio ✅ Concluída (24/06/2026)

- ✅ Certificado em PDF ao concluir uma trilha — geração server-side com `pdfkit` (`shared/pdf/certificate.ts`), sem armazenamento (gerado on-the-fly e validado a cada download).
- ✅ Página de portfólio do aluno (`PortfolioPage`): trilhas concluídas (com botão de baixar certificado), trilhas em andamento, badges e stats. Item "Portfólio" no `StudentShell`.
- ✅ Módulo novo `portfolio` (student): `GET /:slug/portfolio` e `GET /:slug/portfolio/certificates/:trailId` (PDF). Conclusão derivada de `module_progress` (sem migration).
- Branch: `feat/student-certificates`

**Critério de aceite:** aluno conclui uma trilha, certificado em PDF fica disponível para download no perfil. — **Atingido.** (download via portfólio; `GET /portfolio/certificates/:trailId` retorna 422 se a trilha não está concluída.)

---

## Backlog — apostas de longo prazo (sem sprint fixo)

Itens de baixa prioridade na análise original — exigem validação de demanda/negócio antes de entrar em um sprint:

- Colaboração em tempo real (pair programming síncrono, estilo Replit)
- Trilha de conteúdo sobre IA/prompt engineering
- Integrações com Minecraft/robótica
- Aulas síncronas com professor humano (mudaria o modelo self-paced do produto)

---

## Sprint 9 — Autoria híbrida de conteúdo ✅ Concluída

- ✅ **9.1** — Coluna `trails.tenant_id` (migration `0007`): NULL = catálogo global (Super Admin); preenchida = trilha própria da escola. Scoping aplicado no `catalog` (catálogo só global), `tenant-trails` (disponíveis = global + próprias) e módulo novo **`authoring`** (gestor cria/edita trilha própria, com verificação de posse por operação). UI do gestor: criar/editar trilha própria + manual e placeholders nos formulários.
- ✅ **9.2** — UI de **catálogo (CRUD)** na área do Super Admin (reusa o padrão de autoria do gestor, apontando para `/admin/trails|modules|challenges`).

---

## Certificado por escola ✅ Concluída

- ✅ Migration `0008` — tabela `certificate_templates` (por escola; `trail_id` NULL = padrão; `enabled` ligado por padrão; `config` jsonb).
- ✅ `shared/pdf/certificate.ts` parametrizado (cores, título, textos, mensagem, assinatura, logo, fundo, nome da escola). Módulo `certificates` (gestor GET/PUT/DELETE). `getCertificate` resolve curso → padrão → embutido e respeita `enabled`.
- ✅ **Construtor no gestor** (tela Certificados): seletor de escopo, formulário completo, liga/desliga e **preview ao vivo**.

---

## Conteúdo — trilha JS embutida ✅

- ✅ Seed **"JavaScript: do Fundamento ao Algoritmo"** no catálogo global — 96 módulos: 84 desafios + 12 lições teóricas intercaladas (variáveis → algoritmos), temas ordenados por pré-requisito (nada usado antes de ensinado), casos de teste verificados contra o runner real. Comando: `pnpm --filter @codinhos/api db:seed:trilha` (idempotente e atualizável).

---

## Evolução do motor de aprendizado (D1–D5) ✅

Frente dedicada a **ampliar o que um desafio consegue avaliar**, cada direção implementada,
testada (unit + diferencial back≡front) e mergeada na `main`. Detalhe vivo em
`docs/motor-desafios-capacidades.md`. Base transversal: pacote novo `@codinhos/runner` (lógica
pura compartilhada entre backend `node:vm` e worker do front).

- ✅ **D1 — Unificação do runner** (`feat/runner-unify`): fonte única de correção; corrige o bug
  de ordem de chaves de objeto (front≡back via `deepEqual`); função-alvo por `targetFn`; matchers
  `equal`/`approx`/`contains`/`regex`.
- ✅ **D2 — Saída de `console.log`** (`feat/d2-console-output`): `mode: 'stdout'` — desafios em que
  o aluno **imprime** o resultado (tabuada, FizzBuzz, padrões). Lição: ao adicionar campo em
  `TestCase`, atualizar o Zod de resposta de todos os módulos (o do aluno inclusive).
- ✅ **D3 — Camada pedagógica no Codi** (`feat/d3-codi-pedagogico`): `intent` `hint` (dica
  progressiva por nível) e `review` (feedback pós-acerto).
- ✅ **D4 — Geração de desafios por IA** (`feat/d4-gerar-desafio`): gestor gera rascunho (Sonnet)
  **verificado no runner** antes de revisar. Endpoint `POST /authoring/generate-challenge`.
- ✅ **D5 — Horizonte do motor** (um por vez): **async/await** (`feat/d5-async`, `runTests`
  assíncrona); **AST** (`feat/d5-ast`, `mode: 'ast'` + `astRule` — "use recursão", "sem laço",
  usa/proíbe método/função, heurístico sem dependência); **p5.js visual** (`feat/d5-p5`, coluna
  `render_mode`, migration `0010`; prévia do sketch em iframe sandbox; nota por regra estrutural).

**Restam da D5 (fase de produto):** Python via Pyodide (rompe o "backend revalida"). Falta também
**conteúdo de catálogo** que exercite os modos novos (desafios de console, recursão e visuais).

---

## Ordem recomendada

```
Sprint 1 → Sprint 2 → Sprint 3 → Sprint 4 → Sprint 5 → Sprint 6 → Sprint 7 → Sprint 8
```

Sprints 1–3 não têm dependência entre si e podem ser paralelizados se houver mais de uma pessoa codando. Sprint 4 (Professor) é pré-requisito natural para qualquer refinamento futuro de revisão delegada. Sprint 5 (Portal de responsáveis) fica mais simples depois do Sprint 3.1 (já existe captura de e-mail/consentimento de responsável).
