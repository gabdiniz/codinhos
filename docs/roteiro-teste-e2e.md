# Roteiro de Teste E2E — Plataforma Completa

> Teste manual de ponta a ponta cobrindo **todos os papéis e funcionalidades** (Sprints 1–8).
> Use após `pnpm dev` + seed. Cada passo tem **Ação** e **✅ Esperado**.
> Slug de teste: `escola-demo`. SPA: `http://localhost:5173`. API: `http://localhost:3333`.

## 0. Pré-requisitos

1. Banco migrado e seed rodado:
   ```bash
   pnpm --filter @codinhos/api db:migrate
   pnpm --filter @codinhos/api db:seed
   pnpm install            # garante @codemirror/autocomplete, blockly, pdfkit
   pnpm dev                # ou pnpm dev:local
   ```
2. Credenciais do seed (todas senha `demo1234`):

   | Papel | E-mail | Onde loga |
   |---|---|---|
   | Super Admin | `SEED_SUPER_ADMIN_EMAIL` (`.env`) | `/__system__/login` → redireciona p/ `/:slug/admin` |
   | Gestor | gestor@escola-demo.com | `/escola-demo/login` → `/manager` |
   | Aluno | aluno@escola-demo.com (+ ana, pedro, julia, lucas) | `/escola-demo/login` → `/learn` |

   > Professor e Responsável **não** vêm no seed — são criados no passo 2 (faz parte do teste).
3. (Opcional, só p/ o passo 2.7) OAuth do Google Cloud configurado (`GOOGLE_CLIENT_ID/SECRET/REDIRECT_URI`).

---

## 1. Super Admin — catálogo global e escolas

1. **Login** com o super admin → cai na área `/admin`.
   ✅ Esperado: vê Escolas (tenants), Badges e Usuários (global).
2. **Escolas**: confirme que `Escola Demo` existe; crie uma escola nova (slug + nome).
   ✅ Esperado: nova escola aparece na lista; acessível em `/<novo-slug>/login`.
3. **Catálogo** (trilhas → módulos → desafios): abra uma trilha; confira que módulos têm **conceito**, **exemplo** e **vocabulário** (`vocabulary`); desafios têm starter code, testes e dificuldade.
   ✅ Esperado: editar um módulo e salvar `vocabulary` (ex.: `let`, `const`, `if`, `console`) persiste.
4. **Badges**: confira/crie badges (gatilhos: xp_total, challenges_completed, streak_days, level_reached, first_submission).
   ✅ Esperado: badge criada aparece e pode ser concedida automaticamente depois (passo 3).

---

## 2. Gestor — configuração da escola

1. **Login** gestor → `/manager`. **Dashboard**: KPIs (alunos, ativos hoje, turmas) e seção de Alertas.
   ✅ Esperado: KPIs clicáveis levam a alunos/turmas.
2. **Turmas**: crie uma turma definindo **modo de progressão** (livre/sequencial/controlado) e **validação** (auto / auto+revisão / manual).
   ✅ Esperado: turma criada; badges de modo aparecem no detalhe.
3. **Trilha na turma**: atribua uma trilha à turma; ligue `visualBlocksEnabled` em uma trilha (para testar blocos no passo 3.9).
   ✅ Esperado: trilha listada no detalhe da turma.
4. **Alunos — individual**: adicione um aluno à turma; **importação CSV**: baixe o template (`GET /users/template`), preencha 2 linhas e importe.
   ✅ Esperado: resposta `{ created, skipped, errors }`; e-mails repetidos contam como `skipped`.
5. **Desbloqueio manual** (turma em modo *controlado*): desbloqueie um módulo para um aluno.
   ✅ Esperado: 422 se a turma não for `controlled`; sucesso registra `unlocked_by/at`.
6. **Professor**: crie um usuário `professor` (via Usuários) e **vincule-o à turma** (`POST /classes/:id/teachers`).
   ✅ Esperado: 422 se o usuário não for professor; 409 se já vinculado; professor recebe convite por e-mail.
7. **Responsável**: crie um **responsável** vinculando 1+ alunos (`POST /guardians` com `studentIds`).
   ✅ Esperado: 409 e-mail duplicado; 404 se algum `studentId` não for aluno (e o responsável **não** é criado); convite enviado.
8. **(Opcional) Google Classroom**: em Config., "Conectar Google" → consentimento → volta com `?google=connected`; liste cursos; importe um curso.
   ✅ Esperado: turma criada com alunos do Classroom (novos recebem convite); 422 se não conectado.
9. **Configurações**: alterne o toggle `ai_error_explanation_enabled`.
   ✅ Esperado: no aluno, o botão "Pedir ajuda ao Codi" aparece/some conforme o toggle.

---

## 3. Aluno — aprendizado, gamificação, reconhecimento

1. **Login** aluno → `/learn`. Veja trilhas e progresso.
2. Abra **trilha → módulo → desafio**. Confira conceito e exemplo.
2b. **Lição** (trilha com lições, ex.: a do catálogo "JavaScript: do Fundamento ao Algoritmo"): abra um módulo **sem desafio** (rótulo 📖 Lição). Leia o conteúdo, pergunte algo ao **Codi** (ele responde sobre a lição, não sobre um desafio) e clique **"Entendi, avançar"**.
   ✅ Esperado: `POST /learn/modules/:id/complete` marca a lição como concluída, concede **+5 XP** (uma vez) e oferece o **próximo módulo**; reabrir a lição não concede XP de novo.
3. **Sandbox + autocomplete contextual**: comece a digitar no editor.
   ✅ Esperado: o autocomplete sugere **só** o vocabulário ensinado até o módulo atual (não o JS inteiro).
4. **Submeter**: escreva a solução e rode os testes.
   ✅ Esperado: testes passam → status `passed`, ganha **XP** (com bônus de 1ª tentativa + streak), pode subir de **nível** e ganhar **badge**; o painel mostra os ganhos.
5. **Erros humanizados**: submeta um código com erro (ex.: variável não definida).
   ✅ Esperado: mensagem amigável (sem stack trace nativo).
6. **Tutor Codi**: com o toggle ligado, clique "Pedir ajuda ao Codi" sobre um teste que falhou.
   ✅ Esperado: resposta contextual do Codi; respeita o limite diário de mensagens.
7. **Notificações** (sino) e **Desafio da semana**.
   ✅ Esperado: badge/level-up/streak aparecem como notificação; desafio da semana abre e aceita submissão.
8. **Ranking** da turma (se `show_ranking` ligado).
9. **Editor de blocos** (trilha com `visualBlocksEnabled`): abra um desafio dessa trilha.
   ✅ Esperado: aparece o editor **Blockly** (não o CodeMirror); montar blocos (ex.: `console.log`) gera o código e a submissão funciona.
10. **Concluir a trilha** (todos os módulos `completed`) → **Portfólio**.
    ✅ Esperado: a trilha aparece em "Trilhas concluídas"; **"Baixar certificado"** baixa o **PDF** com nome/trilha/escola/data. Trilha não concluída → 422 (sem botão).

---

## 4. Professor — acompanhamento e revisão

> Pré: a turma do professor deve ter submissões `under_review` (use modo *manual* ou *auto+revisão* no passo 2.2 e submeta como aluno).
>
> No **aluno**, ao enviar nesses modos, o painel deve mostrar **"📤 Enviado para revisão do professor"** (cor neutra + nota "o professor vai revisar e dar a nota") — **não** "❌ Não passou ainda". O XP só é concedido quando o professor aprova.

1. **Login** professor → redireciona para `/professor`.
   ✅ Esperado: NÃO cai em `/manager`.
2. **Turmas**: vê **apenas** as turmas atribuídas a ele.
   ✅ Esperado: acessar o id de uma turma não atribuída → **404** (não 403).
3. **Detalhe da turma** (dashboard scoped): stats + alunos com nível/XP/pendências → clique num aluno → detalhe.
4. **Fila de revisão**: lista submissões `under_review`; abra uma → vê código + testes → **Aprovar/Reprovar** com feedback.
   ✅ Esperado: ao aprovar, o aluno ganha XP (idempotente); a submissão sai da fila.
5. **Escopo**: confirme que o professor **não** vê a visão geral do tenant (`/dashboard`) nem configurações.

---

## 5. Responsável — portal read-only

1. **Login** responsável → redireciona para `/guardian`.
2. **Filhos**: lista dos alunos vinculados (nível, XP, streak).
3. **Detalhe do filho**: stats, badges e progresso por trilha.
   ✅ Esperado: **sem** sandbox, sem chat de IA, sem nenhuma escrita. Acessar um aluno não vinculado → 404.

---

## 6. Compliance e integridade acadêmica

1. **Consentimento parental**: cadastre um aluno com `birth_date` que dê **menos de 12 anos** e tente ativar a conta no onboarding.
   ✅ Esperado: tela de consentimento bloqueia a ativação até o responsável consentir; registro fica em `parental_consents` (quem, quando, versão dos termos).
2. **Detecção de plágio**: dois alunos da mesma turma submetem código quase idêntico no mesmo desafio.
   ✅ Esperado: alerta `possible_plagiarism` aparece no dashboard do gestor (com % de similaridade).

---

## 7. Checagens transversais (segurança / multi-tenant)

1. **Isolamento de tenant**: logado em `escola-demo`, tente acessar um recurso de outro slug.
   ✅ Esperado: **404** (nunca 403 — não vaza existência).
2. **Sessão**: faça logout; tente acessar rota protegida.
   ✅ Esperado: redireciona para login (401 → login).
3. **RBAC**: aluno tentando rota de gestor → 403; professor em config de tenant → 403.
4. **tenant_id em toda query**: nenhum dado de outro tenant aparece em nenhuma listagem.

---

## Cobertura por funcionalidade (checklist rápido)

- [ ] Multi-tenant + isolamento por `tenant_id`
- [ ] Catálogo (trilhas/módulos/desafios) + badges (Super Admin)
- [ ] Turmas (modos de progressão/validação) + trilha por turma
- [ ] Cadastro individual + **importação CSV** de alunos
- [ ] **Desbloqueio manual** de módulo (modo controlado)
- [ ] Sandbox JS + **autocomplete contextual** + **editor de blocos** (Blockly)
- [ ] Submissão + testes + **gamificação** (XP/nível/streak/badge) + ranking
- [ ] **Tutor Codi** (IA) + erros humanizados
- [ ] Notificações + desafio da semana
- [ ] **Professor**: turmas atribuídas, detalhe, **fila de revisão**
- [ ] **Responsável**: portal read-only dos filhos
- [ ] **Consentimento parental** (LGPD/ECA) + **detecção de plágio**
- [ ] **Rostering Google Classroom** (import one-way)
- [ ] **Certificado PDF** + **portfólio**
