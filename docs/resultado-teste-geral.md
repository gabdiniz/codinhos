# Resultado da Execução — Roteiro de Teste Geral

> Execução dirigida na SPA (`localhost:5173`) via navegador, em 2026-07-19.
> Ambiente: `pnpm dev:local` (API :3333 + SPA :5173) com o seed padrão.
> Legenda: ✅ passou · 🐞 achado · ⛔ bloqueado (precisa de você) · ⏭️ não exercido.

---

## Resumo

Executei os blocos **Gestor** e **Aluno** e as **checagens transversais**, incluindo o caminho
crítico do produto (sandbox + submissão + gamificação). Tudo o que foi exercido **passou**.
Os blocos de **Super Admin**, **Professor** e **Responsável** ficaram bloqueados por credenciais
(senha real do super admin) e por convites (sem Resend, o token do convite fica no banco/log).
Ficou combinado que você roda esses blocos.

---

## ✅ Passou

### Gestor
- Login (`gestor@escola-demo.com`) → redirect `/manager`.
- Dashboard: KPIs (6 alunos / 0 ativos / 5→6 turmas) e **7 alertas** (revisão pendente, sem atividade, travado no desafio).
- Turmas: lista com Progressão/Validação/Ranking. **Criei "Turma QA Controlada"** (Controlada + Manual + Ranking) — apareceu na lista. Modal confirma os 3 modos de progressão (free/sequential/controlled) e 3 de validação (auto/auto_review/manual).
- Detalhe da turma: alunos (Ativo) + trilhas atribuídas + "Atribuir trilha" / "Adicionar aluno".
- Alunos: 6 cadastrados, busca, filtros (Todos/Ativos/Inativos), **Importar CSV**, Convidar, ações por linha.
- Trilhas (tenant): "10 trilhas ativadas", **Ativar trilha**, cards arrastáveis p/ reordenar, Desativar.
- Certificados: editor completo (escopo padrão/por curso, cores, título/corpo, assinatura, logo, rodapé) com **prévia ao vivo** do PDF.
- Configurações: abas Geral / Tema visual / Gamificação / **Tutor de IA** / Privacidade / Integrações; toggle "Tutor explica o erro" presente.

### Aluno
- Login (`aluno@escola-demo.com`) → redirect `/learn`.
- Header de gamificação: XP, Nível, Streak.
- Trilhas → módulo → desafio: conceito, exemplo, editor, estados (disponível/concluído), mistura de lições e desafios.
- **Sandbox Pyodide (Python)**: executou e **submeteu** `print("Olá, Codinhos!")` → **✅ concluído, +20 XP, 1/1 testes** (10 base + 5 primeira tentativa + 5 streak).
- **Gamificação persiste**: XP 125 → **145**; progresso da trilha 1/14 → 2/14; nível recalculado.
- **Erro humanizado**: ao enviar código com erro, mensagem amigável ("Você usou 'NameError…', mas isso ainda não existe…") com link **"ver mensagem técnica"** (esconde o stack trace) + "Pedir ajuda ao Codi". Sem stack trace nativo vazando.
- Notificações (sino): "Nível 2 alcançado!" + badges; "marcar todas como lidas".
- Ranking: pódio + "Sua posição #1" (145 XP, Nível 2) — respeita `showRanking`.
- Portfólio: "Trilhas concluídas (0)" com empty-state de certificado, "Em andamento" com progresso, Badges (3).
- Avatar Studio: DiceBear (Nv 2), categorias (Pele/Cabelo/Olhos/…), "suba de nível para desbloquear", Surpreenda-me/Salvar.
- Desafio da Semana: página carrega (sem desafio ativo — ver lacunas).

### Transversais
- **RBAC**: aluno acessando `/manager` → redirecionado para `/learn`.
- **Isolamento de tenant**: slug inexistente → "Escola não encontrada" → `/404`.
- **Sessão**: logout volta ao login; troca de papel (gestor↔aluno) funciona.
- **Tema**: CSS vars da plataforma aplicadas (nenhuma cor fixa observada).

---

## 🐞 Achados (menores)

1. **Rótulo de linguagem fixo em JS** nos desafios Python: a aba do editor diz "solution**.js**"; o Codi diz "dúvidas sobre **JavaScript**"; a mensagem de erro humanizada cita "**let/const**" (construtos JS) num desafio Python.
2. **Typo no 404**: o título aparece "Escola **nao** encontrada" (falta o til em "não").
3. **Poluição de dados de testes antigos**: 2 turmas "Turma E2E …" (0 alunos) e 3 badges "Badge E2E …" ficaram no banco de execuções anteriores.
4. **Performance**: a **1ª carga do Pyodide** congela a UI por vários segundos (captura de tela chega a dar timeout). Esperado, mas vale um indicador de "carregando runtime".

---

## ⛔ Bloqueado (você roda)

- **Bloco 1 — Super Admin**: a senha em `apps/api/.env` é o placeholder `troque-antes-de-rodar` e foi rejeitada no login. Precisa da senha real usada no seed.
- **Bloco 4 — Professor** e **Bloco 5 — Responsável**: não existem no seed; sem Resend, aceitar o convite exige o **token** (tabela `password_reset_tokens` ou log da API). As páginas de gestão (Professores/Responsáveis) estão OK e vazias, prontas para "Convidar/Criar".

---

## ⏭️ Não exercido (falta dado/serviço)

- **Certificado (PDF do aluno)**: exige uma trilha 100% concluída (14+ módulos) — inviável forçar via submissão manual. UI de portfólio (empty-state) e editor de certificado (gestor) OK.
- **Desafio da semana (submissão)**: nenhum desafio da semana ativo/criado.
- **Plágio** e **consentimento parental**: exigem setup específico (duas submissões quase idênticas na mesma turma; aluno com data de nascimento < 12 anos).
- **Bloco 7 — LP pública (`:3000`)** e **Codi público**: `dev:local` não sobe o `apps/web` (Next) — porta 3000 fora do ar.
- **Google Classroom**: depende de OAuth configurado.

---

## Sugestões de próximo passo

- Definir/anotar a **senha real do super admin** (ou resetar o seed com uma conhecida) para liberar o Bloco 1.
- Em dev, **logar o link de convite** (accept-invite) no console da API para destravar Professor/Responsável sem Resend.
- **Limpar** as turmas/badges "E2E …" residuais.
- Padronizar os rótulos de **linguagem** (JS/Python) na tela de desafio e nas mensagens do Codi.
- Corrigir o **til** no título do 404.
