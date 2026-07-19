# Trilha JS (opcional) — Desenhando com p5.js

Slug proposto `js-programacao-visual-p5`. `order: 200` (**fora do caminho obrigatório**).
Pré-requisito: `js-decisoes-e-repeticoes` (`for`) e `js-funcoes`. Ver `docs/pesquisa-trilhas-js.md`.

**Por que é opcional:** programação visual é um **diferencial de engajamento** (motiva muito a
faixa 11–14), mas não é um tópico da *linguagem* — o aluno pode aprender JS inteiro sem ela. Fica
como trilha extra, atribuível a qualquer momento depois das trilhas 20–30, sem travar o caminho
principal.

**Pré-requisito de motor:** `render_mode: 'p5'` (mergeado). O aluno escreve um sketch p5
(`setup`/`draw`) e **vê o desenho** num `<iframe sandbox>` (p5 empacotada, sem CDN). **A nota vem
da estrutura, nunca de pixel** (o backend não renderiza): `mode:'ast'` com
`requireCall`/`forbidCall` — que detecta tanto a **chamada** de primitiva (`ellipse(`) quanto a
**definição** do event handler (`function mousePressed()`). O projeto livre usa `manual` (gestor
aprova).

## Módulos

| # | Tipo | Título | Verificação (ast) |
|---|---|---|---|
| 1 | lição | O que é p5.js: `setup()`/`draw()`, `createCanvas` | — |
| 2 | P.1 | Sua primeira tela | `requireCall(createCanvas)` |
| 3 | lição | Cores: `background`, `fill`, `stroke`, `noStroke` | — |
| 4 | P.2 | Fundo colorido + um retângulo | `requireCall`: createCanvas + background + fill + rect |
| 5 | lição | Formas e coordenadas (x→direita, y→baixo) | — |
| 6 | P.3 | Desenhe um rosto | `requireCall`: createCanvas + ellipse |
| 7 | P.4 | Desenhe uma casinha | `requireCall`: createCanvas + rect + triangle |
| 8 | lição | Variáveis e animação: `draw()` roda a cada quadro | — |
| 9 | P.5 | Bolinha que se move | `requireCall`: createCanvas + draw + ellipse |
| 10 | lição | Interatividade: `mousePressed`, `mouseX`/`mouseY`, `keyPressed` | — |
| 11 | P.6 | Círculo onde o mouse clicar | `requireCall`: createCanvas + mousePressed + ellipse |
| 12 | P.7 | Muda a cor de fundo ao apertar tecla | `requireCall`: createCanvas + keyPressed + background |
| 13 | lição | Repetição para desenhar padrões (`for` no visual) | — |
| 14 | P.8 | Grade de quadrados | `requireCall`: createCanvas + rect |
| 15 | P.9 | [Projeto livre] Seu desenho ou mini-animação | `manual`, sem testCases — gestor aprova |

**Vocabulário acumulado ao final:** `setup`/`draw`, `createCanvas`, `background`/`fill`/`stroke`,
`rect`/`ellipse`/`triangle`, `mousePressed`/`mouseX`/`mouseY`, `keyPressed`, `for` aplicado ao
visual, projeto livre.

**Nota de auditoria:** grava "usou as primitivas certas", não "ficou bonito" (pixel-match fura o
back≡front). O seed precisa gravar a coluna `renderMode: 'p5'` explicitamente. Não há regra "exige
`for`" na AST — P.8 confere só as primitivas; o padrão em si é orientação do enunciado.
