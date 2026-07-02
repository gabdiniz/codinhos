# Roteiro de QA — Front (clique a clique)

> Walkthrough manual da SPA, tela por tela, com **checkboxes**. Marque `[x]` conforme valida.
> Cada item: **ação** → _o que você deve ver_.
> SPA: `http://localhost:5173` · Slug de teste: `escola-demo` · senha de todos do seed: `demo1234`.

## Setup rápido

- [x] `.env` da API: ao menos `DATABASE_URL`, `SESSION_SECRET`, `SEED_*`, e **`APP_URL=http://localhost:5173`**. (Anthropic = Codi; Resend = e-mails; Google = Classroom — todos opcionais p/ a maior parte do teste.)
- [x] `docker compose up -d` · `pnpm --filter @codinhos/api db:migrate` · `pnpm --filter @codinhos/api db:seed`
- [x] Subir dev: `pnpm dev:local` (sem Turbo). API em `:3333`, SPA em `:5173`.
- [x] Abrir `http://localhost:3333/health` → responde OK.

> **Dica p/ logar como Professor/Responsável** (criados pelo gestor, recebem convite por e-mail):
> sem Resend configurado, pegue o token em `password_reset_tokens` (Drizzle Studio: `pnpm --filter @codinhos/api db:studio`) e acesse `http://localhost:5173/escola-demo/accept-invite?token=<token>` pra definir a senha.

---

## A. Super Admin — catálogo e escolas

- [x] Acessar `/__system__/login` e logar com `SEED_SUPER_ADMIN_EMAIL` / senha do `.env`. → cai na área **/admin**.
- [x] **Escolas (Tenants)**: ver `Escola Demo` na lista; criar uma escola nova (nome + slug). → aparece na lista.
- [x] **Badges**: ver/criar uma badge (slug, nome, gatilho, valor). → salva e lista.
- [x] **Usuários**: listagem global com filtro por papel. → filtra corretamente.
- [x] Logout (canto do menu). → volta pro login.

---

## B. Gestor — configuração da escola

- [x] Logar em `/escola-demo/login` com `gestor@escola-demo.com`. → cai em **/manager** (Dashboard).
- [x] **Dashboard**: ver KPIs (Alunos, Ativos hoje, Turmas) e seção de **Alertas**. → KPIs clicáveis levam a Alunos/Turmas.
- [x] **Turmas** → criar turma: nome + **modo de progressão** (livre/sequencial/controlado) + **validação** (auto / auto+revisão / manual). → turma criada com os badges de modo.
- [x] Abrir o **detalhe da turma** → atribuir uma **trilha** à turma. → trilha listada.
- [x] **(p/ testar blocos)** Em uma trilha da turma, ligar o `visualBlocksEnabled`. → toggle salvo.
- [x]**Alunos** → adicionar um aluno existente à turma. → aparece na lista de alunos da turma.
- [x] **Importação CSV**: baixar o template, preencher 2 linhas (`nome,email`), importar. → mostra `criados / ignorados / erros`; e-mail repetido conta como ignorado.
- [x] **Criar professor**: em Usuários, criar um usuário com papel **professor**. → criado; (recebe convite).
- [x] **Vincular professor à turma** (aba Professores da turma). → 422 se o usuário não for professor; 409 se repetir; sucesso lista o professor.
- [x] **Criar responsável** vinculando 1+ alunos. → 409 e-mail repetido; 404 se algum aluno inválido (e o responsável **não** é criado); sucesso lista o responsável com a contagem de filhos.
- [x] **Configurações** → alternar `aiErrorExplanationEnabled`. → salva (reflete no aluno, passo C).
- [x] **(Opcional, se Google configurado)** Config → "Conectar Google" → consentimento → volta com aviso de conectado → listar cursos → importar um curso. → cria turma com os alunos do Classroom.

---

## C. Aluno — aprender, gamificar, certificar

- [x] Logar com `aluno@escola-demo.com`. → cai em **/learn** (Trilhas).
- [x] Abrir uma **trilha** → um **módulo** → o **desafio**. → vê conceito, exemplo e o editor.
- [ ] **Autocomplete contextual**: começar a digitar no editor. → sugere **só** o vocabulário ensinado até esse módulo (não o JS inteiro).
- [x] **Submeter** a solução correta. → testes passam (verde), painel mostra **XP ganho**, possível **subida de nível** e **badge**.
- [x] Submeter um código com **erro** (ex.: variável não definida). → mensagem **humanizada** (sem stack trace).
- [x] **(Se Codi/Anthropic ligado)** clicar "Pedir ajuda ao Codi" sobre um teste que falhou. → resposta contextual; respeita limite diário. (Se o toggle do gestor estiver off, o botão **não** aparece.)
- [x] **Sino de notificações** → ver badge/level-up/streak. → lista as notificações.
- [ ] **Desafio da semana** → abrir e submeter. → aceita submissão.
- [ ] **Ranking** (se a turma tiver ranking ligado). → mostra posições.
- [ ] **(Trilha com blocos)** abrir um desafio dessa trilha. → aparece o **editor de blocos (Blockly)** em vez do CodeMirror; arrastar blocos (ex.: `imprimir`) e submeter funciona.
- [ ] **Concluir a trilha** (todos os módulos) → ir em **Portfólio**. → trilha aparece em "Trilhas concluídas".
- [ ] **Baixar certificado** (botão na trilha concluída). → baixa um **PDF** com seu nome, trilha, escola e data.
- [ ] Logout.

---

## D. Professor — acompanhar e revisar

> Pré: a turma do professor precisa de submissões `under_review` — use turma em modo **manual** ou **auto+revisão** (passo B) e submeta como aluno (passo C).

- [ ] Logar como o **professor** (senha definida via convite — ver dica do Setup). → redireciona para **/professor** (NÃO /manager).
- [ ] **Turmas**: ver **apenas** as turmas atribuídas a ele.
- [ ] Tentar abrir na URL o id de uma turma **não** atribuída. → **404** (não 403).
- [ ] **Detalhe da turma**: stats + lista de alunos (nível/XP/atividade/pendências) → clicar num aluno → **detalhe do aluno**.
- [ ] **Revisões**: ver a fila de submissões pendentes → abrir uma → ver **código + resultado dos testes** → **Aprovar** ou **Reprovar** com feedback. → ao aprovar, sai da fila e o aluno ganha XP.
- [ ] Confirmar que **não** há acesso à visão geral do tenant nem a Configurações.
- [ ] Logout.

---

## E. Responsável — portal read-only

- [ ] Logar como o **responsável** (senha via convite). → redireciona para **/guardian**.
- [ ] **Filhos**: lista dos alunos vinculados (nível, XP, streak). → cards clicáveis.
- [ ] Abrir o **detalhe de um filho**: stats, badges e progresso por trilha. → tudo read-only.
- [ ] Confirmar que **não** existe sandbox, chat de IA nem nenhum botão de escrita.
- [ ] Tentar na URL o id de um aluno **não** vinculado. → 404.
- [ ] Logout.

---

## F. Compliance e integridade (cenários específicos)

- [ ] **Consentimento parental**: cadastrar um aluno com data de nascimento de **menos de 12 anos** e tentar ativar a conta no onboarding. → tela de **consentimento** bloqueia a ativação até consentir.
- [ ] **Plágio**: dois alunos da mesma turma submetem código quase idêntico no mesmo desafio. → no **Dashboard do gestor** aparece o alerta `possível plágio` com o % de similaridade.

---

## G. Comportamentos transversais (segurança no front)

- [ ] **Redirect por papel** no login: aluno→/learn, gestor→/manager, professor→/professor, responsável→/guardian, super admin→/admin.
- [ ] **Sem sessão**: acessar uma rota protegida direto na URL. → redireciona pro login.
- [ ] **Papel errado**: aluno tentando `/manager` na URL. → redirecionado pra área correta dele (sem flash).
- [ ] **Isolamento de tenant**: logado em `escola-demo`, trocar o slug na URL para outra escola. → não acessa (404/redirect).
- [ ] **Tema do tenant**: se a escola tiver tema, as cores (CSS vars) carregam corretamente.

---

## Checklist de cobertura (resumo)

- [ ] Login + redirect por papel (5 papéis)
- [ ] Catálogo + badges (Super Admin)
- [ ] Turmas (modos) + trilha por turma
- [ ] Cadastro + **importação CSV** de alunos
- [ ] **Desbloqueio manual** de módulo (modo controlado)
- [ ] Sandbox + **autocomplete contextual** + **editor de blocos**
- [ ] Submissão + **gamificação** (XP/nível/streak/badge) + ranking
- [ ] **Codi** (IA) + erros humanizados + notificações + desafio da semana
- [ ] **Professor**: turmas atribuídas + detalhe + **fila de revisão**
- [ ] **Responsável**: portal read-only
- [ ] **Consentimento parental** + **detecção de plágio**
- [ ] **Google Classroom** (rostering) — se configurado
- [ ] **Certificado PDF** + **portfólio**
- [ ] Isolamento de tenant + RBAC no front
