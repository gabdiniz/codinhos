# Relatório de Progresso — Sprints 1 a 3

**Data:** 22/06/2026
**Status do `main`:** sincronizado com `origin/main`, working tree limpo (exceto este arquivo e `docs/sprints-roadmap.md`, ainda não commitados).

Baseado em `docs/sprints-roadmap.md`. As três primeiras sprints do roadmap estão concluídas e mergeadas. Próxima do plano: Sprint 4 (Papel de Professor).

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

- `docs/sprints-roadmap.md` e este relatório ainda estão untracked — commitar se quiser manter histórico.
- `meta/0001_snapshot.json` e `meta/0002_snapshot.json` (drizzle-kit) nunca foram gerados. Sem eles, `db:generate` pode "redescobrir" migrations já aplicadas e gerar arquivos redundantes (aconteceu uma vez nesta sessão, com `birth_date`). Vale reconstruir os snapshots antes do próximo ciclo de migrations.
- Próxima do roadmap: **Sprint 4 — Papel de Professor** (ainda não iniciada).
