# Pesquisa — Landing Page de Vendas (apps/web)

Pesquisa de referências para a LP pública do Codinhos. Direção escolhida: **híbrido tech-lúdico**. Sem sistema de pagamento — CTA de conversão é **contato via e-mail** (formulário → e-mail / mailto). Suporte a **tema claro e escuro** e **animações** em toda a página.

Data: 2026-07-01.

---

## 1. Contexto e público

O Codinhos é **B2B**: quem decide a compra é o **gestor/coordenador da escola**, não a criança. Mas o produto vive da experiência lúdica do aluno (11–14 anos). Isso define a tensão central da LP:

- **Quem lê e decide**: gestor escolar — quer credibilidade, resultado pedagógico, facilidade de configurar trilhas/turmas, multi-tenant, segurança.
- **Quem usa e encanta**: aluno — sandbox, gamificação (XP, nível, streak, badges), tutor de IA.

A LP precisa **vender confiança para o adulto mostrando a diversão da criança**. A direção híbrida tech-lúdica resolve isso: base tech moderna e séria (grid, snippets de código, glow, mono font) com uma camada lúdica e colorida por cima (mascote leve, gamificação animada, cores dopamine em acentos).

---

## 2. Padrão de mercado — como esse setor se apresenta

### Dev-tech (referência de sobriedade e "programação de verdade")
- **Vercel** — reposicionou como "The AI Cloud" sobre fundo quase preto com gradientes animados baseados em shader em quase toda página de produto. Referência de dark-first sofisticado.
- **Linear / Betterstack / Nightwatch** — dark mode que parece nativo do público dev; hierarquia por contraste, não por caixas brancas.
- Padrão: mono/geometric fonts, snippets de código reais como "prova visual", micro-interações que demonstram funcionalidade.

### Edtech lúdico (referência de diversão e engajamento)
- **Duolingo** — verde+azul (crescimento + confiança), mascote onipresente, streak e leaderboard como narrativa central. Prova que gamificação pode ser o herói da comunicação.
- **Scratch** — marca experiencial que domina coding infantil; posicionamento "aberto e brincável".
- **Codecademy** — página concisa, linguagem leiga para tema técnico, prova social por números de matrícula.
- **Tynker** — coding for kids com jogos, forte em ilustração e cor.

### Síntese do padrão
Quem vende ensino de código para jovens **mostra o produto em ação cedo** (não stock photo), usa **2–3 cores complementares**, coloca **prova social perto do CTA**, e segmenta a mensagem por papel (gestor / professor / aluno / responsável). Tendência 2026: **dopamine design** (cores saturadas, gradientes neon, nostalgia Y2K) em marcas voltadas a jovens, e **dark-first** em ferramentas dev.

---

## 3. Estrutura de seções recomendada

Ordem convencional do mercado, adaptada ao Codinhos (topo → rodapé):

1. **Nav** — logo, âncoras (Como funciona, Para escolas, Trilha, Contato), toggle de tema, CTA "Falar com a gente".
2. **Hero** — headline + subtexto + CTA de contato + **visual do produto** (sandbox rodando um desafio JS, com resultado animado). Regra de ouro: se o hero não mostra o produto, a próxima seção precisa mostrar. Prova social leve aqui (ex.: "X escolas", "Y alunos").
3. **Prova / logos** — logos de escolas parceiras ou números de impacto.
4. **Como funciona** — 3 passos: escola contrata (tenant) → gestor configura trilhas e turmas → aluno aprende JS praticando. Cada passo com micro-animação.
5. **Demonstração do produto** — sandbox + tutor de IA em destaque; snippet de código real rodando. É o coração "tech" da página.
6. **Gamificação** — XP, nível, streak, badges animados. É o coração "lúdico". Barras de progresso e badges que animam ao entrar na viewport.
7. **Para gestores / escolas** — multi-tenant, configuração de trilhas e turmas, acompanhamento de progresso, segurança/isolamento por tenant. Fala com o decisor.
8. **Trilha / conteúdo** — o que o aluno aprende (JS via desafios práticos), amostra da trilha.
9. **Depoimentos** — de gestores e/ou professores, posicionados perto de CTA.
10. **FAQ** — dúvidas de adoção escolar.
11. **CTA final de contato** — formulário simples (nome, escola, e-mail, mensagem) que dispara e-mail. **Sem pagamento.**
12. **Footer** — links, contato, redes.

Testemunhos, ratings, logos e provas de resultado convertem melhor quando ficam **perto do CTA/claim que sustentam** — não espalhados aleatoriamente.

---

## 4. Temas claro e escuro

Requisito: os dois temas, com toggle. Recomendações:

- **Tokens via CSS variables** (regra não-negociável do projeto — nenhuma cor fixa). Definir paleta semântica: `--color-bg`, `--color-fg`, `--color-primary`, `--color-accent`, `--color-muted`, `--color-code-*`, etc. Trocar tema = trocar valores das variáveis no `:root` / `[data-theme="dark"]`.
- **Dark**: base quase-preta (não `#000` puro — usar off-black para reduzir vibração), acentos neon/saturados para o lado lúdico, gradientes com glow suave. É onde o "dev-tech" brilha.
- **Light**: base clara e limpa, mesmos acentos saturados mas com contraste calibrado (AA), mais respiração. É onde o gestor se sente em terreno confiável.
- **Contraste**: manter razões AA em ambos; testar os acentos dopamine sobre fundo claro (costumam falhar contraste).
- **Persistência**: salvar preferência (respeitar `prefers-color-scheme` como default, permitir override manual).

Paleta sugerida (a validar no `theming.md`): base neutra + **primária tech** (azul/violeta elétrico) + **acento lúdico** (verde-lima ou magenta/amarelo dopamine). 2–3 cores, como o mercado recomenda.

---

## 5. Animações

Motion virou competência central de web design em 2026, não enfeite — micro-animações **demonstram funcionalidade** (hover, progresso por scroll, dashboards animados comunicam features na hora).

Padrões a usar:
- **Scroll-triggered**: seções entram com fade/slide; barras de XP e badges animam ao entrar na viewport.
- **Hero animado**: gradiente com glow suave, código "digitando" ou resultado do desafio aparecendo.
- **Hover states / micro-interações** em cards de feature e badges.
- **Transições de seção** e progress por scroll.

Stack recomendada para Next.js (ver §6):
- **Framer Motion** como base — API declarativa, integra natural com React, cobre a maioria das animações de UI (fade, slide, hover, layout).
- **GSAP + ScrollTrigger** só onde precisar de scroll complexo (pin, scrub, parallax, sequências). Abordagem híbrida: GSAP para scroll-driven pesado, Framer Motion para estado de UI — não conflitam.
- Preferir **CSS animations** para coisas simples (mais leves que JS).

**Acessibilidade e performance (obrigatório):**
- Respeitar `prefers-reduced-motion`: `<MotionConfig reducedMotion="user">` e/ou `useReducedMotion` para trocar animação pesada por fade simples.
- Testar em dispositivos fracos; Framer Motion cai de ~60 para ~45fps com muitas animações simultâneas; GSAP segura 60fps em sequências complexas.
- Cuidado com `will-change` deixado ativo após a animação — degrada scroll (picos de INP).

---

## 6. Stack técnica (apps/web)

Alinhado ao monorepo (Next.js na web pública):

- **Next.js** (App Router) — páginas públicas.
- **CSS variables** para temas (obrigatório) + provavelmente Tailwind com tokens mapeados às variáveis.
- **Framer Motion** (base) + **GSAP/ScrollTrigger** (scroll avançado, opcional/localizado).
- **Formulário de contato → e-mail**: sem gateway de pagamento. Opções: route handler que envia via provedor de e-mail (ex.: Resend/SMTP), ou `mailto` como fallback mínimo. Definir na fase de build.
- Componentes compartilhados de `packages/ui` quando fizer sentido.

---

## 7. Codi — mascote e assistente de dúvidas na LP

**Decisão:** o mascote é o **Codi**, reaproveitando o tutor de IA que já existe dentro do app (`CodiDrawer`, "Pedir ajuda ao Codi"). Vantagem de marca: a criança encontra o mesmo personagem no site e no produto — consistência sem custo. Presença comedida na LP (híbrido tech-lúdico): Codi aparece no hero, em transições e no widget de chat, sem virar Duolingo.

**Papel novo na LP — Codi responde dúvidas sobre o produto.** Um widget de chat onde o visitante (gestor, professor, responsável) pergunta sobre o Codinhos e o Codi responde a partir de uma base de conhecimento. É o motivo de mantermos as docs bem escritas — elas alimentam o Codi.

Pontos a definir:

- **Base de conhecimento curada e pública.** As `agent_docs` (arquitetura, banco, autenticação, segurança) são **internas** e não podem ser expostas nem servir de resposta crua. O Codi da LP consome um subconjunto/curadoria voltada ao produto: o que é, como funciona para escola e aluno, trilha de JS, gamificação, modelo B2B multi-tenant, FAQ de adoção. Definir a fonte (docs públicas dedicadas em `docs/` ou coleção separada) e o pipeline (provavelmente RAG: embeddings + recuperação → resposta).
- **Escopo e guardrails.** Codi responde só sobre o produto; fora disso, encaminha para o CTA de contato por e-mail. Sem inventar preço, prazo ou dado que não está na base.
- **Reuso vs. serviço próprio.** Avaliar reaproveitar a infra de IA do tutor (`apps/api`) com um endpoint público separado, respeitando escopo (sem `tenant_id` aqui — é público, pré-venda) e rate limiting.
- **Handoff para vendas.** Quando a intenção for comprar/contratar, Codi direciona ao formulário de contato.

> Nota de produto: registrar também no `planejamento.md` como funcionalidade da LP (pré-venda), distinta do tutor in-app do aluno.

---

## 8. Decisões a fechar antes de codar

- Paleta final (primária tech + acento lúdico) e nomes dos tokens no `theming.md`.
- **Codi mascote:** definido (§7). Falta o grau visual (ilustração/estados/animação) e a arte do personagem.
- **Codi assistente da LP:** fonte da base curada, pipeline (RAG?), endpoint público e guardrails (§7).
- Provedor de envio de e-mail do formulário de contato.
- Quais provas sociais reais existem hoje (logos/números) ou se entram placeholders.
- Grau de animação no primeiro corte (MVP com Framer Motion apenas vs. já incluir GSAP).

---

## Fontes

- [Top 13 EdTech Landing Page Designs — Caffeine Marketing](https://www.caffeinemarketing.com/blog/top-13-edtech-landing-page-designs)
- [Education Landing Pages — Lapa Ninja](https://www.lapa.ninja/category/education/)
- [Edtech Landing Pages — Behance](https://www.behance.net/search/projects/edtech%20education%20landing%20page)
- [SaaS Design Trends 2026 — Design Studio](https://www.designstudiouiux.com/blog/top-saas-design-trends/)
- [Dark Mode SaaS Landing Pages — Saaspo](https://saaspo.com/style/dark-mode)
- [10 SaaS Landing Page Trends for 2026 — SaaSFrame](https://www.saasframe.io/blog/10-saas-landing-page-trends-for-2026-with-real-examples)
- [Top Web Design Trends for 2026 — Ariel Digital](https://www.arieldigitalmarketing.com/blog/web-design-trends-2026/)
- [Website Hero Section Best Practices — Prismic](https://prismic.io/blog/website-hero-section)
- [Best SaaS Landing Pages — CodeDesign](https://codedesign.ai/blog/best-saas-landing-pages)
- [Top Web Design Trends for 2026 — Figma](https://www.figma.com/resource-library/web-design-trends/)
- [Guide to Branding in Edtech — Literal Humans](https://literalhumans.com/the-ultimate-guide-to-branding-in-the-edtech-industry/)
- [15 Best Edtech Website Design Examples — Webstacks](https://www.webstacks.com/blog/edtech-websites)
- [7 Best Designed Edtech Platforms — Merge](https://merge.rocks/blog/7-best-designed-edtech-platforms-weve-seen-so-far)
- [Coding for Kids — Tynker](https://www.tynker.com/)
- [GSAP vs Framer Motion 2026 — Codolve](https://codolve.com/blog/gsap-vs-framer-motion)
- [Framer Motion Complete Guide — inhaq](https://inhaq.com/blog/framer-motion-complete-guide-react-nextjs-developers)
- [GSAP & Framer Motion in Next.js 15 — Build With Umar](https://buildwithumar.com/blogs/nextjs-animations-optimization)
