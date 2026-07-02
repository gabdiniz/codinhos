# Base de conhecimento do Codi (pública)

Conteúdo **curado e voltado ao público** que alimenta o **Codi**, o assistente de dúvidas da landing page (`apps/web`). Tudo aqui pode ser exposto a visitantes (gestores, professores, responsáveis) antes da contratação.

Contexto e decisão de produto em `docs/planejamento.md` (seção "Codi na Landing Page") e `docs/pesquisa-lp-vendas.md` (§7).

## Índice

| Arquivo | Tema |
|---|---|
| `00-sobre-codinhos.md` | O que é, para quem, diferenciais |
| `01-para-escolas-e-gestores.md` | Configuração, turmas, progressão, avaliação, relatórios, onboarding |
| `02-para-alunos.md` | Jornada do aluno, sandbox, tutor Codi |
| `03-trilha-e-conteudo.md` | Trilha de JavaScript, módulos, catálogo |
| `04-gamificacao.md` | XP, níveis, badges, ranking, streak |
| `05-privacidade-e-seguranca.md` | LGPD, dados por escola, moderação da IA |
| `06-faq.md` | Perguntas frequentes (formato pergunta/resposta) |
| `07-roadmap.md` | Novidades planejadas (sempre como "em breve") |

## Política de curadoria — o que NUNCA incluir

Esta base é **pública**. Nunca adicionar aqui:

- Detalhes internos de arquitetura, banco de dados, autenticação ou infraestrutura (isso vive em `agent_docs/`, que é **interno** e não deve ser exposto nem servir de resposta).
- Nomes de arquivos, tabelas, campos, módulos de código, endpoints ou stack técnica.
- Preços, prazos ou números de contrato — o Codi encaminha isso para o formulário de contato.
- Recursos ainda não construídos apresentados como se já existissem. Novidades entram só em `07-roadmap.md`, sempre rotuladas como planejadas.
- Dados pessoais de alunos, escolas ou clientes.

## Como o Codi usa esta base

- **Persona e tom** do Codi ficam no **system prompt** do assistente, não aqui. Esta base é a **fonte factual** (conteúdo), não a voz.
- Pipeline previsto: RAG (recuperação sobre estes arquivos) → resposta. Cada arquivo é um agrupamento temático natural de chunks.
- **Guardrails de resposta** (ver planejamento): responder só sobre o produto; fora do escopo, encaminhar ao contato por e-mail; não inventar dado ausente da base; handoff para vendas quando a intenção for contratar.

## Manutenção

Ao mudar o produto, atualizar o arquivo temático correspondente aqui — e não deixar `agent_docs` (interno) vazar para cá. Quando um item do roadmap for lançado, movê-lo do `07-roadmap.md` para o arquivo temático certo.
