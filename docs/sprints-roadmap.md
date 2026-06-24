# Roadmap de Sprints — Funcionalidades Faltantes

> Baseado em `docs/analise-mercado-funcionalidades.md` (17/06/2026). Cada sprint é dimensionado por complexidade, não por tempo fixo — ajustar duração conforme capacidade do time.
> Convenção de branch: `feat/<nome>` a partir de `develop`, PR de volta para `develop` (ver `agent_docs/commits.md`). Toda query nova deve filtrar por `tenant_id`; toda cor nova via `var(--color-*)`; rotas sempre `routes → service → repository → schema`.

**Status:** Sprint 1 concluída e mergeada na `main` em 18/06/2026 (PRs #26–#29 + PR de revisão `fix/ajustes-revisao-sprint1`). Próxima: Sprint 2.

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

## Sprint 4 — Papel de Professor

- Adicionar `'teacher'` ao enum de role (hoje `super_admin > manager > student`)
- Revisar `requireRole(...)` em todos os guards que devem aceitar professor: `submissions` (revisão), `classes` (leitura, não CRUD completo), `dashboard` (visão da própria turma), `learn` (acompanhamento)
- Vínculo professor↔turma (tabela ou FK em `classes`)
- Branch: `feat/auth-teacher-role`

**Critério de aceite:** professor loga, vê só as turmas atribuídas a ele, revisa submissões manuais, não tem acesso a configurações de tenant.

---

## Sprint 5 — Portal para responsáveis

- Nova entidade `guardian` vinculada a um ou mais alunos (FK `guardian_id` → `users`, ou tabela de junção se um responsável puder ter vários filhos em turmas diferentes)
- Novo fluxo de auth read-only: login do responsável vê progresso, badges, alertas de inatividade do(s) filho(s) — sem acesso a sandbox/chat IA
- Gatilho natural para reaproveitar o sistema de notificações já existente (e-mail de resumo semanal, listado como V2 em `planejamento.md`)
- Branch: `feat/guardian-portal`

**Critério de aceite:** responsável recebe convite, define senha, vê dashboard somente leitura do(s) filho(s) vinculados ao seu tenant.

---

## Sprint 6 — SSO / rostering com Google Classroom

- OAuth2 com Google na tela de login do gestor/professor
- Sincronização de turmas e alunos via Classroom API → mapeamento para `classes`/`users` do tenant
- Decisão de produto pendente: sincronização one-way (importa e mantém manual depois) ou contínua (re-sincroniza periodicamente)
- Branch: `feat/integrations-google-classroom`

**Critério de aceite:** gestor conecta a conta Google do Classroom, escolhe uma turma do Classroom, e ela aparece populada em Codinhos sem cadastro manual de aluno por aluno.

---

## Sprint 7 — Editor avançado de sandbox

**7.1 — Autocomplete contextual** — sugestões limitadas ao vocabulário já ensinado até o módulo atual da trilha (não o vocabulário completo de JS)
**7.2 — Editor de blocos visuais** — maior esforço do roadmap; o toggle `visualBlocksEnabled` já existe no backend e é lido pelo frontend, falta construir o editor. Recomenda-se tratar como sub-fases: (a) modo blocos isolado, (b) modo híbrido blocos+texto, (c) conversão bidirecional bloco↔texto

**Critério de aceite:** trilha com `visualBlocksEnabled` ligado mostra editor de blocos funcional para ao menos os módulos de lógica básica.

---

## Sprint 8 — Reconhecimento e portfólio

- Certificado em PDF ao concluir uma trilha (template + geração server-side)
- Página de portfólio interno (lista de trilhas/badges conquistados, exportável)
- Branch: `feat/student-certificates`

**Critério de aceite:** aluno conclui uma trilha, certificado em PDF fica disponível para download no perfil.

---

## Backlog — apostas de longo prazo (sem sprint fixo)

Itens de baixa prioridade na análise original — exigem validação de demanda/negócio antes de entrar em um sprint:

- Colaboração em tempo real (pair programming síncrono, estilo Replit)
- Trilha de conteúdo sobre IA/prompt engineering
- Integrações com Minecraft/robótica
- Aulas síncronas com professor humano (mudaria o modelo self-paced do produto)

---

## Ordem recomendada

```
Sprint 1 → Sprint 2 → Sprint 3 → Sprint 4 → Sprint 5 → Sprint 6 → Sprint 7 → Sprint 8
```

Sprints 1–3 não têm dependência entre si e podem ser paralelizados se houver mais de uma pessoa codando. Sprint 4 (Professor) é pré-requisito natural para qualquer refinamento futuro de revisão delegada. Sprint 5 (Portal de responsáveis) fica mais simples depois do Sprint 3.1 (já existe captura de e-mail/consentimento de responsável).
