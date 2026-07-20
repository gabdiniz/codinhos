# Roteiro de Teste Geral — Codinhos (super-admin → aluno)

> Teste manual **de ponta a ponta**, cobrindo **todos os papéis e todas as funcionalidades** da plataforma.
> Nasce no **Super Admin** (catálogo global + escolas), desce pelo **Gestor** (configuração da escola),
> chega ao **Aluno** (aprender/gamificar/certificar) e fecha com **Professor**, **Responsável**,
> **compliance**, **páginas públicas (LP/Codi)** e **checagens transversais** (multi-tenant, RBAC, tema).
>
> Formato de cada passo: **Ação** → **✅ Esperado**. Marque `[ ]`/`[x]` conforme valida.
> SPA interna: `http://localhost:5173` · API: `http://localhost:3333` · LP pública (Next): `http://localhost:3000`.
> Slug de teste: `escola-demo`. Senha de todos do seed: `demo1234`.

---

## 0. Pré-requisitos e setup

### 0.1 Banco, migrations e seeds

> ⚠️ Ambiente tem **dois Postgres na 5432**: o de **dev** (container Docker) e o de **teste** (local).
> O seed roda contra o **container**. Comandos em **PowerShell** (uma linha por comando, sem `\`).

- [ ] Subir infra e migrar:
  ```
  docker compose up -d
  pnpm --filter @codinhos/api db:migrate
  ```
- [ ] Semear o **catálogo** (trilhas). São **14 trilhas JS + 1 opcional p5** e **10 trilhas Python**:
  ```
  pnpm --filter @codinhos/api db:seed:js
  pnpm --filter @codinhos/api db:seed:python-01
  # ... até python-10 (rode todos os db:seed:python-0X)
  ```
- [ ] Semear **tenant + turmas + alunos + vínculos de trilha** (idempotente; re-rode depois das trilhas):
  ```
  pnpm --filter @codinhos/api db:seed
  ```
  ✅ Esperado: log lista o Super Admin, `escola-demo`, gestor, 6 alunos, **Turma JavaScript** e **Turma Python** com trilhas vinculadas em ordem.
- [ ] Instalar deps e subir dev (sem Turbo, por causa do crash conhecido):
  ```
  pnpm install
  pnpm dev:local
  ```
- [ ] `http://localhost:3333/health` → responde **OK**.

### 0.2 Credenciais do seed

| Papel | E-mail | Senha | Loga em | Cai em |
|---|---|---|---|---|
| Super Admin | `SEED_SUPER_ADMIN_EMAIL` (`.env`) | `SEED_SUPER_ADMIN_PASSWORD` | `/__system__/login` (ou `/admin/auth/login`) | `/admin` |
| Gestor | `gestor@escola-demo.com` | `demo1234` | `/escola-demo/login` | `/manager` |
| Aluno (JS) | `aluno@`, `ana@`, `pedro@` `escola-demo.com` | `demo1234` | `/escola-demo/login` | `/learn` |
| Aluno (Python) | `julia@`, `lucas@`, `marina@` `escola-demo.com` | `demo1234` | `/escola-demo/login` | `/learn` |

> **Professor** e **Responsável** **não** vêm no seed — são criados pelo Gestor no bloco 2 (faz parte do teste).

### 0.3 Como logar como quem foi convidado (Professor/Responsável) ou consentir (menor)

Professor/Responsável recebem **convite por e-mail** (Resend). Sem Resend configurado:
- [ ] Abra o **Drizzle Studio**: `pnpm --filter @codinhos/api db:studio`.
- [ ] Pegue o **token cru** na tabela `password_reset_tokens` (o valor no banco é hash — use o **token do link/log**, não o hash da tabela; em dev a branch de invite loga o link cru).
- [ ] Acesse `http://localhost:5173/escola-demo/accept-invite?token=<token>` e defina a senha.

### 0.4 Serviços opcionais

| Serviço | Para quê | Sem ele |
|---|---|---|
| Anthropic | Tutor Codi + explicação de erro + gerar desafio por IA | botão/recurso some ou responde erro amigável |
| Resend | e-mails de convite/reset | pegar token manual (0.3) |
| Google OAuth | Google Classroom (rostering) | pular passos de import |

---

## 1. Super Admin — catálogo global e escolas

> Login: `/__system__/login`. Super Admin acessa **qualquer** slug e as áreas globais `/admin`.

### 1.1 Login e navegação global
- [ ] Login com o super admin → cai em **/admin**.
  ✅ Esperado: menu com **Escolas (Tenants)**, **Catálogo**, **Badges** e **Usuários** (global).

### 1.2 Escolas (tenants)
- [ ] Ver `Escola Demo` na lista; **criar** uma escola nova (nome + slug único).
  ✅ Esperado: escola aparece na lista e fica acessível em `/<novo-slug>/login`.
- [ ] Abrir o detalhe de um tenant e **editar overrides de gamificação** em `settings.gamification`
      (`xp_per_level`, `first_attempt_bonus_multiplier`, `streak_bonus_xp`, `streak_bonus_max_xp`, `streak_milestone_days`).
  ✅ Esperado: valores fora dos limites são **rejeitados** (ex.: `xp_per_level < 10`, `multiplier < 1.0`); válidos persistem.
- [ ] Desativar/reativar um tenant (`isActive`).
  ✅ Esperado: tenant inativo bloqueia login dos usuários dele.

### 1.3 Catálogo (trilhas → módulos → desafios)
- [ ] Abrir o **Catálogo**: confira as **14 trilhas JS** + **p5 (opcional/visual)** e as **10 trilhas Python**.
  ✅ Esperado: cada trilha tem `language` (`javascript`/`python`), ordem e módulos.
- [ ] Abrir uma trilha → um módulo. Confira **conceito**, **exemplo (exampleCode)** e **vocabulário (vocabulary)**.
  ✅ Esperado: editar o `vocabulary` (ex.: `let`, `const`, `if`, `console`) e salvar **persiste** (usado no autocomplete contextual, passo 3).
- [ ] Confira **módulos-lição** (módulo **sem desafio**, rótulo 📖 Lição) e **módulos com desafio**.
  ✅ Esperado: os dois tipos coexistem numa mesma trilha.
- [ ] Abrir um desafio: confira **starterCode**, **testCases** (matchers: `stdout`, `ast`, `contains`, `regex`), **difficulty** (`easy/medium/hard`), **baseXp**, **targetFn** e **renderMode** (`js`/`p5`).
  ✅ Esperado: desafio da trilha p5 tem `renderMode = p5`; editar e salvar persiste.
- [ ] **CRUD**: criar trilha/módulo/desafio novos e depois **excluir**.
  ✅ Esperado: criação/edição/remoção refletem na lista.

### 1.4 Badges (globais)
- [ ] Ver/criar uma badge: `slug`, `nome`, `triggerType`, `triggerValue`.
  ✅ Esperado: gatilhos aceitos: `xp_total`, `challenges_completed`, `streak_days`, `level_reached`, `first_submission`.
  A badge criada aparece e poderá ser concedida automaticamente (validado no bloco 3).

### 1.5 Usuários (global)
- [ ] Listagem global de usuários com **filtro por papel**.
  ✅ Esperado: filtra corretamente entre `super_admin/manager/professor/student/guardian`.
- [ ] **Reset de senha** de um usuário (`POST /admin/users/:userId/reset-password`).
  ✅ Esperado: gera token/fluxo de redefinição.
- [ ] **Logout** do super admin → volta para o login.

---

## 2. Gestor — configuração da escola

> Login: `/escola-demo/login` com `gestor@escola-demo.com` → cai em **/manager**.

### 2.1 Dashboard
- [ ] Ver KPIs (**Alunos**, **Ativos hoje**, **Turmas**) e a seção de **Alertas**.
  ✅ Esperado: KPIs clicáveis levam a Alunos/Turmas; alertas mostram pendências (ex.: revisões, plágio).

### 2.2 Turmas
- [ ] Criar turma definindo **modo de progressão** (`free`/`sequential`/`controlled`) e **validação** (`auto`/`auto_review`/`manual`), e o toggle **`showRanking`**.
  ✅ Esperado: turma criada; badges de modo aparecem no detalhe.
- [ ] Editar e excluir turma; abrir o **detalhe** da turma.
  ✅ Esperado: alterações persistem.

### 2.3 Trilhas na turma
- [ ] Ver **trilhas disponíveis** (`/trails/available`) e **atribuir** uma trilha à turma; ajustar a **ordem**.
  ✅ Esperado: trilha listada no detalhe, na ordem definida.
- [ ] Ligar o **`visualBlocksEnabled`** em uma trilha da turma (para testar Blockly no passo 3).
  ✅ Esperado: toggle salvo.

### 2.4 Alunos
- [ ] **Individual**: adicionar um aluno existente à turma; criar um aluno novo.
  ✅ Esperado: aluno aparece na lista da turma; novo aluno recebe convite.
- [ ] **Importação CSV**: baixar o template (`GET /:slug/users/template`), preencher 2 linhas (`nome,email`), importar (`POST /:slug/users/import`).
  ✅ Esperado: resposta `{ created, skipped, errors }`; e-mail repetido conta como **skipped**.
- [ ] **Reenviar convite** de um aluno (`POST /:slug/users/:userId/resend-invite`).
  ✅ Esperado: novo convite enviado/logado.

### 2.5 Desbloqueio manual (turma `controlled`)
- [ ] Numa turma em modo **controlado**, desbloquear um módulo para um aluno (`POST /:slug/progress/modules/:moduleId/unlock`).
  ✅ Esperado: **422** se a turma não for `controlled`; sucesso registra `unlocked_by/at`.

### 2.6 Professor
- [ ] Criar um usuário com papel **professor** (Usuários).
  ✅ Esperado: criado; recebe convite (ver 0.3).
- [ ] **Vincular** professor à turma (`POST /:slug/classes/:classId/teachers`).
  ✅ Esperado: **422** se o usuário não for professor; **409** se já vinculado; sucesso lista o professor.
- [ ] Desvincular professor.

### 2.7 Responsável
- [ ] Criar um **responsável** vinculando 1+ alunos (`POST /:slug/guardians` com `studentIds`).
  ✅ Esperado: **409** e-mail duplicado; **404** se algum `studentId` não for aluno (e o responsável **não** é criado); convite enviado.
- [ ] Gerenciar vínculos do responsável (adicionar/remover filhos).

### 2.8 Autoria de trilha própria da escola (Sprint 9)
- [ ] Em **Trilhas**, criar uma **trilha própria** do tenant (`POST /:slug/authoring/trails`), adicionar **módulos** e **desafios**.
  ✅ Esperado: trilha aparece só para esta escola (não no catálogo global); CRUD completo funciona.
- [ ] **Gerar desafio por IA** (`POST /:slug/authoring/generate-challenge`).
  ✅ Esperado: com Anthropic ligado, retorna starterCode/testes sugeridos; sem chave, erro amigável.

### 2.9 Certificados por escola (Fase 4)
- [ ] Em **Certificados**, criar um **template padrão da escola** (trail_id nulo) e um específico de uma trilha (`POST /:slug/certificates/templates`).
  ✅ Esperado: template salvo com `config`; usado ao emitir o PDF do aluno (bloco 3).

### 2.10 Configurações do tenant
- [ ] Alternar **`ai_error_explanation_enabled`**.
  ✅ Esperado: no aluno, o botão "Pedir ajuda ao Codi" aparece/some conforme o toggle.
- [ ] Ajustar **`ai_messages_per_day`** (limite diário do Codi), **`allow_student_profile_view`** e **`max_students`**.
  ✅ Esperado: salvam; refletem no comportamento do aluno (limite Codi, ver perfil de colega).
- [ ] **Tema**: definir cores do tenant (`PUT /:slug/theme`).
  ✅ Esperado: SPA aplica as **CSS vars** do tenant (nada hardcoded).

### 2.11 Google Classroom (opcional)
- [ ] Config → "Conectar Google" → consentimento → volta com `?google=connected`; listar cursos; importar um curso.
  ✅ Esperado: turma criada com alunos do Classroom (novos recebem convite); **422** se não conectado.
- [ ] Desconectar Google.

---

## 3. Aluno — aprender, gamificar, reconhecer

> Login `/escola-demo/login` com `aluno@escola-demo.com` (JS) e depois `julia@escola-demo.com` (Python) → cai em **/learn**.

### 3.1 Dashboard e trilhas
- [ ] Ver trilhas da sua turma e o progresso.
  ✅ Esperado: aluno JS vê trilhas JS; aluno Python vê trilhas Python.
- [ ] Abrir **trilha → módulo → desafio**. Confira conceito e exemplo.

### 3.2 Módulo-lição (+5 XP)
- [ ] Abrir um módulo **sem desafio** (📖 Lição). Ler, perguntar algo ao **Codi** (responde sobre a lição), clicar **"Entendi, avançar"** (`POST /:slug/learn/modules/:moduleId/complete`).
  ✅ Esperado: marca a lição como concluída, concede **+5 XP** (`lesson_completed`) **uma vez**, oferece o **próximo módulo**; reabrir **não** concede XP de novo.

### 3.3 Sandbox + autocomplete contextual
- [ ] Começar a digitar no editor.
  ✅ Esperado: autocomplete sugere **só** o vocabulário ensinado até o módulo atual (não a linguagem inteira).
- [ ] **Aluno JS**: sandbox JS roda no **Web Worker** (runner JS). **Aluno Python**: roda no **Pyodide** (runner Python).
  ✅ Esperado: os dois executam código e mostram saída sem travar a UI.

### 3.4 Submissão + testes (matchers)
- [ ] Escrever a solução correta e submeter (`POST /:slug/challenges/:challengeId/submissions`).
  ✅ Esperado: testes passam → status `passed`; matchers cobrem `stdout` (saída), `ast` (estrutura do código), `contains`, `regex`.
- [ ] Testar um desafio que usa **`targetFn`** (função avaliada) com uma função auxiliar extra.
  ✅ Esperado: o teste avalia a função-alvo mesmo com helpers no código.

### 3.5 Gamificação
- [ ] Na 1ª aprovação de um desafio: observar **XP base + bônus de 1ª tentativa + bônus de streak**.
  ✅ Esperado: `xp_events` registra `challenge_passed`, `first_attempt_bonus` e `streak_bonus`; painel mostra os ganhos.
- [ ] **Re-submeter** o mesmo desafio já aprovado.
  ✅ Esperado: **idempotente** — nenhum XP novo.
- [ ] Subir de **nível** (`level = floor(total_xp / xp_per_level) + 1`).
  ✅ Esperado: notificação **level_up** por cada nível saltado; badge `level_reached` concedida no nível certo.
- [ ] **Streak**: aprovar em dias consecutivos (ou simular via `last_activity`).
  ✅ Esperado: streak sobe; milestones (`7/30/100`, ou override do tenant) geram notificação e checam badge `streak_days`.
- [ ] **Badges**: conquistar por `first_submission`, `challenges_completed`, `xp_total`.
  ✅ Esperado: badge aparece no perfil + notificação.

### 3.6 Erros humanizados
- [ ] Submeter código com erro (ex.: variável não definida / erro de sintaxe).
  ✅ Esperado: mensagem amigável, **sem stack trace nativo**.

### 3.7 Tutor Codi (IA)
- [ ] Com o toggle ligado, clicar "Pedir ajuda ao Codi" sobre um teste que falhou (`POST /:slug/ai/challenges/:challengeId/messages`).
  ✅ Esperado: resposta **contextual**; conversa persiste; respeita o **limite diário** (`ai_messages_per_day`) — ao estourar, bloqueia com aviso.
- [ ] Toggle desligado no gestor → botão **não** aparece.

### 3.8 Desafio da semana e ranking
- [ ] Abrir **Desafio da semana** (`/weekly-challenge`) e submeter.
  ✅ Esperado: aceita submissão; **leaderboard** da semana lista posições (`/:slug/weekly-challenges/:classId/:weeklyId/leaderboard`); há **histórico**.
- [ ] **Ranking** da turma (`/ranking`), se `showRanking` ligado.
  ✅ Esperado: mostra posições; se desligado, não exibe.

### 3.9 Editor de blocos (Blockly) e render p5
- [ ] Numa trilha com **`visualBlocksEnabled`**, abrir um desafio.
  ✅ Esperado: aparece o editor **Blockly** (não o CodeMirror); montar blocos gera código e a submissão funciona.
- [ ] Num desafio **`renderMode = p5`** (trilha visual p5), rodar o sketch.
  ✅ Esperado: preview do p5.js em **iframe sandbox**; a nota continua vindo dos `testCases` (regras AST), revalidada no backend.

### 3.10 Avatar Studio
- [ ] Abrir **/avatar**: escolher opções (DiceBear "adventurer") e salvar (`PUT /:slug/me/avatar`).
  ✅ Esperado: opções com `requiredLevel` acima do nível do aluno ficam **bloqueadas**; salvar persiste em `avatar_config` e reflete no shell.

### 3.11 Perfil, portfólio e certificado
- [ ] Abrir **/profile**: ver nível/XP/streak/badges.
- [ ] **Concluir uma trilha** (todos os módulos `completed`) → **/portfolio**.
  ✅ Esperado: trilha aparece em "Trilhas concluídas".
- [ ] **Baixar certificado** (`GET /:slug/portfolio/certificates/:trailId`).
  ✅ Esperado: baixa **PDF** com nome/trilha/escola/data (usa o template da escola do bloco 2.9); trilha **não** concluída → **422** (sem botão).

### 3.12 Notificações
- [ ] Abrir o **sino** (`/:slug/notifications`), ver contagem não lidas, marcar uma e marcar todas como lidas.
  ✅ Esperado: badge/level-up/streak/milestone aparecem; contadores atualizam.

---

## 4. Professor — acompanhamento e revisão

> Pré: a turma do professor precisa ter submissões `under_review` — use turma em modo **manual** ou **auto_review** (2.2) e submeta como aluno (bloco 3).
> No **aluno**, ao enviar nesses modos, o painel mostra **"📤 Enviado para revisão do professor"** (neutro), **não** "❌ Não passou"; o XP só entra na aprovação.

- [ ] Login como o professor (senha via convite) → redireciona para **/professor** (NÃO /manager).
- [ ] **Turmas**: vê **apenas** as turmas atribuídas.
  ✅ Esperado: acessar na URL o id de uma turma não atribuída → **404** (não 403).
- [ ] **Detalhe da turma** (dashboard scoped): stats + alunos (nível/XP/atividade/pendências) → clicar num aluno → **detalhe do aluno**.
- [ ] **Fila de revisão** (`/:slug/dashboard/review-queue`): abrir uma submissão → ver **código + resultado dos testes** → **Aprovar/Reprovar** com feedback (`PATCH .../review`).
  ✅ Esperado: ao aprovar, sai da fila e o aluno ganha XP (**idempotente**); ao reprovar, feedback chega ao aluno.
- [ ] Confirmar que **não** há acesso à visão geral do tenant (`/dashboard`) nem a Configurações.
- [ ] Logout.

---

## 5. Responsável — portal read-only

- [ ] Login como o responsável (senha via convite) → redireciona para **/guardian**.
- [ ] **Filhos** (`/:slug/guardian/children`): lista dos alunos vinculados (nível, XP, streak) — cards clicáveis.
- [ ] **Detalhe do filho** (`/:slug/guardian/children/:studentId`): stats, badges e progresso por trilha.
  ✅ Esperado: **sem** sandbox, **sem** chat de IA, **sem** nenhum botão de escrita.
- [ ] Tentar na URL o id de um aluno **não** vinculado → **404**.
- [ ] Logout.

---

## 6. Compliance e integridade acadêmica

- [ ] **Consentimento parental (LGPD/ECA)**: cadastrar um aluno com `birth_date` que dê **menos de 12 anos** e tentar ativar/logar.
  ✅ Esperado: fluxo de **consentimento** (`/consentimento-parental`) bloqueia a ativação até o responsável consentir (`POST /:slug/auth/parental-consent`); registro em `parental_consents` (quem, quando, versão dos termos).
- [ ] **Detecção de plágio**: dois alunos da **mesma turma** submetem código quase idêntico no mesmo desafio.
  ✅ Esperado: acima do limiar (**dice ≥ 0.85**) aparece alerta `possible_plagiarism` no dashboard do gestor, com **% de similaridade**.

---

## 7. Páginas públicas — LP de vendas e Codi público

> LP em Next.js (`apps/web`), `http://localhost:3000`. Sem pagamento; foca em captação.

- [ ] Abrir a LP: navegar seções, alternar **light/dark**, ver o mascote **Codi**.
  ✅ Esperado: cores via **CSS vars** (tokens da LP); layout responsivo.
- [ ] **Assistente de dúvidas (Codi público)** (`POST /codi/ask`): perguntar sobre o produto.
  ✅ Esperado: responde a partir da **KB curada** (não expõe `agent_docs` nem detalhes internos).
- [ ] **Formulário de contato** (`POST /contact`): enviar uma mensagem.
  ✅ Esperado: registra/envia lead; validação de campos.

---

## 8. Checagens transversais (segurança / multi-tenant / tema)

- [ ] **Redirect por papel** no login: aluno→/learn, gestor→/manager, professor→/professor, responsável→/guardian, super admin→/admin.
- [ ] **Isolamento de tenant**: logado em `escola-demo`, trocar o slug na URL para outra escola / acessar um recurso de outro tenant.
  ✅ Esperado: **404** (nunca 403 — não vaza existência). Nenhuma listagem mistura dados de outro tenant.
- [ ] **Sessão**: logout e tentar acessar rota protegida direto na URL.
  ✅ Esperado: **401 → redireciona para login**.
- [ ] **RBAC**: aluno tentando `/manager` → redirecionado à sua área (sem flash); professor em config de tenant → negado.
- [ ] **`tenant_id` em toda query**: nenhum dado de outro tenant aparece em nenhuma tela ou endpoint.
- [ ] **Tema do tenant**: escola com tema → CSS vars carregam corretamente; sem tema → tema padrão.

---

## Checklist de cobertura (resumo)

- [ ] **Super Admin**: tenants (criar/editar/gamification override), catálogo (14 JS + p5 + 10 Python, módulos/lições/desafios, matchers, renderMode), badges (5 gatilhos), usuários globais + reset
- [ ] **Gestor**: dashboard/alertas, turmas (3 modos progressão × 3 validação + ranking), trilha por turma + ordem + blocos, alunos individual + **CSV**, **desbloqueio manual**, professor, responsável, **autoria de trilha própria + IA**, **certificados**, settings (Codi/limite/perfil/tema), **Google Classroom**
- [ ] **Aluno**: trilhas JS **e** Python, lição (+5 XP), autocomplete contextual, sandbox JS (Worker) + Python (Pyodide), submissão + testes, **gamificação** (XP/1ª tentativa/streak/nível/badges), erros humanizados, **Codi** (limite diário), desafio da semana + leaderboard, ranking, **Blockly**, **p5**, **avatar** (unlock por nível), perfil, **portfólio + certificado PDF**, notificações
- [ ] **Professor**: redirect, turmas atribuídas (404), detalhe turma/aluno, **fila de revisão** (idempotente), escopo
- [ ] **Responsável**: redirect, filhos, detalhe **read-only**, 404 não vinculado
- [ ] **Compliance**: **consentimento parental** (<12), **plágio** (dice ≥ 0.85)
- [ ] **Público**: LP (light/dark, Codi KB), contato
- [ ] **Transversais**: redirect por papel, **isolamento de tenant** (404), sessão/logout, RBAC, `tenant_id`, tema
