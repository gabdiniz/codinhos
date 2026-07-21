# Análise de custos — Codinhos (revisão jul/2026)

Revisão honesta de custos um mês após a primeira planilha, já considerando o que evoluiu: geração de desafios com IA e o salto do motor de execução. Câmbio usado: **R$ 5,10/US$** (era 5,40). Planilha completa e recalculável: `custos-codinhos.xlsx`.

## O que mudou desde a última planilha

**A evolução do motor NÃO aumentou seu custo de nuvem.** Esse é o ponto mais importante e contra‑intuitivo. O motor de JS e Python roda via **Pyodide no navegador do aluno**. Executar código — por mais avançado que o motor fique — gasta a CPU do aluno, não a sua. O motor só roda no servidor durante a *verificação* de um desafio recém‑gerado, o que é pontual.

**Surgiu um novo custo de IA, mas é de autoria, não por aluno.** A geração de desafios usa **Claude Sonnet 5** (mais caro que o Haiku do tutor), com ~1,4 chamadas por desafio (gera + eventual retry). Custa **~R$ 0,13 por desafio gerado** (promo até 31/ago; ~R$ 0,20 depois). Quem paga esse custo é o gestor/professor ao criar conteúdo — acontece uma vez e o desafio fica no banco. Gerar 40 desafios sob medida = ~R$ 5.

**O único custo variável real por aluno continua sendo o tutor de IA** (Haiku 4.5), agora com um system prompt mais rico (contexto do desafio + histórico). Mantive **US$ 0,005/mensagem**, que continua realista.

**A base de infra dobrou** em relação à planilha antiga (que assumia R$ 34). O motivo não é gasto novo, é honestidade: o stack de produção real (Caddy/TLS + Postgres + API + app + LP + backup, tudo na mesma VPS) mais o assistente Codi da landing page não cabem em R$ 34.

## Custo base para manter a plataforma no ar

Tudo na sua VPS única, como você planejou:

| Item | R$/mês |
|---|---|
| VPS (R$50 em prod; R$30 hoje) — compute + Postgres + backup na mesma máquina | 50 |
| Domínio | 4 |
| Backup offsite (recomendado — Backblaze B2 / storage box) | 10 |
| Codi (assistente da LP / marketing) — varia com tráfego | 15 |
| E‑mail transacional (Resend) — grátis até ~3k/mês | 0 |
| **Base total** | **~R$ 79/mês** |

Se cortar o backup offsite (não recomendo) e zerar o Codi, a base cai para ~R$ 54. TLS é grátis (Caddy/Let's Encrypt) e monitoramento cabe em tiers gratuitos.

## Custo por escola, turma e aluno

O modelo é multi‑tenant row‑level: **uma escola ou turma a mais é praticamente só linhas no banco.** O custo marginal de infra de adicionar uma escola ou turma é ~R$ 0. Então:

- **Custo por turma** = (alunos da turma) × (custo por aluno). Não tem custo próprio.
- **Custo por escola** = (soma dos alunos) × (custo por aluno) + autoria pontual de conteúdo.
- **Custo por aluno** = só o tutor de IA.

**Custo por aluno/mês (só tutor):**

| Uso | Msg/mês | R$/mês |
|---|---|---|
| Leve | 15 | 0,38 |
| Típico | 30 | 0,77 |
| Engajado | 60 | 1,53 |
| Teto realista (20/dia × 22 letivos) | 440 | 11,22 |
| Teto absoluto (20/dia × 30) | 600 | 15,30 |

O cap de 20 msg/dia é o teto de risco: no pior caso um aluno custa ~R$ 11–15/mês, mas a média fica muito abaixo disso.

**Custo por escola/mês (uso típico, 30 msg/aluno):** pequena (30 alunos) ~R$ 23 · média (90) ~R$ 69 · grande (150) ~R$ 115 · rede (500) ~R$ 383. Mais ~R$ 5 uma vez para gerar 40 desafios próprios.

## O que os números dizem

Com a base fixa se diluindo conforme entram escolas, o **custo total por aluno cai de ~R$ 1,64 (1 escola) para ~R$ 0,78 (100 escolas)** — convergindo para o custo puro do tutor. Com 20 escolas (~1.800 alunos) o custo total roda ~R$ 1.456/mês, ou R$ 0,81/aluno.

Isso sustenta a margem: contra um preço de ~R$ 8/aluno ou piso de R$ 300/escola, o custo real de uma escola média (~R$ 69 + base amortizada) é uma fração da receita.

## Recomendações honestas e riscos

**A VPS de R$50 é suficiente para começar, mas tem prazo.** Postgres + API Fastify + Next.js SSR + build do app na mesma máquina pedem RAM. Com poucas escolas e baixa concorrência funciona; conforme escala, o Postgres e a concorrência da API vão te empurrar para um upgrade. Deixei a base como input editável para você revisar quando isso acontecer.

**Backup na mesma máquina = ponto único de falha.** Se a VPS morrer, o backup morre junto. Os R$ 10/mês de backup offsite são o melhor gasto do orçamento.

**Alavanca de economia disponível:** ativar prompt caching no tutor pode cortar até 90% dos tokens de entrada (o system prompt é repetido a cada mensagem), reduzindo o custo por mensagem. Vale ligar antes de escalar volume de tutor.

**Fique de olho no pós‑promo do Sonnet:** o custo de geração de desafios sobe ~60% depois de 31/ago. Como é custo de autoria pontual, o impacto total é pequeno, mas está registrado na planilha.

---
Fontes de preço: Anthropic API (Haiku 4.5 US$1/US$5 por M; Sonnet 5 US$2/US$10 promo, US$3/US$15 padrão). Câmbio: investing.com (~jul/2026). Todos os inputs estão em azul na aba **Premissas** — mudar lá recalcula tudo.
