# Plano de conteúdo — trilhas para os modos novos do motor

Proposta de conteúdo (ainda **não semeado**) para exercitar `mode:'stdout'`, `mode:'ast'`
e `render_mode:'p5'`, que hoje o motor suporta mas o catálogo praticamente não usa. Ver
[[motor-aprendizado-kickoff]] / [[conteudo-modos-novos-kickoff]] e `docs/motor-desafios-capacidades.md`.

## O que já existe (para não duplicar)

Verifiquei o `seed-trilha-js.ts` atual antes de propor qualquer coisa nova:

- **stdout já tem 4 desafios** no fim da trilha "JS: do Fundamento ao Algoritmo" (lição
  `console.log` + C.1 Olá mundo, C.2 Conte 1-5, C.3 Tabuada, C.4 FizzBuzz). Não são muitos —
  cobrem só o básico de imprimir.
- **Recursão (módulo 11, 11.1–11.x) já existe**, mas testa só o **resultado** (`return`), com
  `mode` ausente (function-call clássico). Nenhum desafio hoje **exige estruturalmente** recursão
  ou proíbe laço via `mode:'ast'` — um aluno pode resolver com `for` e passar. Esse é o gap real.
- **`mode:'ast'` e `render_mode:'p5'` têm zero desafios no catálogo.** Capacidade 100% sem uso.

Por isso a proposta não é "mais uma trilha de fundamentos", e sim **3 trilhas novas e
independentes**, cada uma dedicada a um modo, autocontidas (explicam o conceito do zero) mas
assumindo como pré-requisito a trilha de fundamentos (variáveis, funções, `for`, arrays).

## Base de pesquisa

- **Recursão:** literatura de ensino (Miedema 2022; survey ERIC sobre ensino de recursão)
  aponta o erro mais comum — alunos constroem um "modelo de loop" da recursão e tratam o caso
  base como só uma condição de parada, sem entender a redução do problema. Recomenda-se
  metáfora visual + rastrear a execução passo a passo antes de cobrar código, e só then reforçar
  com um exercício que **proíbe laço estruturalmente** (senão o aluno volta ao loop no automático).
- **p5.js:** currículos de referência (p5.js oficial, NYC DoE "Computational Media", CodeHS)
  convergem numa progressão: canvas/coordenadas → formas e cor → variáveis/animação →
  interatividade (mouse/teclado) → padrões com repetição → projeto livre.
- **Saída/console:** não há currículo padronizado equivalente, mas o padrão comum em cursos
  introdutórios (pattern printing) é: texto fixo → laço simples → laços aninhados (formas/
  pirâmides) → alinhamento/tabelas → "arte" em texto combinando tudo.

## Trilha A — "Imprimindo e Formatando Saídas" (mode: stdout) — ✅ ESCRITA E VERIFICADA

Slug `js-saida-e-formatacao`, `order: 20`. Aprofunda o que os 4 desafios de stdout (C.1-C.4) já
plantaram na trilha de fundamentos.

| # | Tipo | Título | Conceito novo | Teste |
|---|---|---|---|---|
| 1 | lição | Recapitulando console.log e template strings | `` `${var}` `` em vez de concatenar com `+` | — |
| 2 | S.1 | Cartão de apresentação | template string + função com parâmetro | stdout exato |
| 3 | S.2 | Linha decorativa | `"-".repeat(n)` | stdout exato |
| 4 | lição | Laços aninhados (for dentro de for) | por que preciso de 2 contadores p/ desenhar em 2D | — |
| 5 | S.3 | Quadrado de asteriscos | `for` aninhado | stdout exato |
| 6 | S.4 | Triângulo crescente | linha `i` cresce | stdout exato |
| 7 | S.5 | Pirâmide numérica | reaproveita padrão, números em vez de `*` | stdout exato |
| 8 | lição | Alinhando texto (`padStart`/`padEnd`) | necessário para tabela | — |
| 9 | S.6 | Tabela de nomes e idades | `padEnd` para colunas | stdout exato |
| 10 | S.7 | Calendário da semana | combina tabela + `for` | stdout exato |
| 11 | lição | Quando a saída pode variar (matcher `contains`) | nem todo exercício tem 1 resposta única | — |
| 12 | S.8 | Relatório livre | matcher `contains` (aceita várias respostas certas) | stdout contém |
| 13 | S.9 | Arte em ASCII (arvorezinha) | indentação à esquerda preservada, multi-linha | stdout exato |
| 14 | S.10 | [Hard] Painel de placar | combina função + `padEnd` + laço + comparação (maior valor) | stdout exato |

**14 módulos (4 lições + 10 desafios).** Conteúdo completo em
`apps/api/src/shared/db/seed-trilha-console.ts` (script `pnpm --filter @codinhos/api
db:seed:console`, ainda **não rodado**). **Verificação feita:** script Node que replica o
dispatch `stdout` do `run-tests.ts` real (captura de console + `normalizeOutput` +
`applyMatcher`) rodou a solução de referência dos 10 desafios — todas batem exatamente com a
string esperada (inclusive espaçamento de `padEnd` e indentação da ASCII art, calculados e
conferidos char a char antes de gravar no seed).

## Trilha B — "Recursão de Verdade: Pensando Sem Loops" (mode: ast) — ✅ ESCRITA E VERIFICADA

Slug `js-recursao-de-verdade`, `order: 30`. **Revisão feita contra o `seed-trilha-js.ts` real**
antes de escrever: os módulos 11.1–11.4 (contagem regressiva, soma até N, fatorial, potência) e
11.6 (Fibonacci) já existem e já são recursivos — só não têm a regra estrutural. `7.9` (palíndromo)
e `9.5` (soma dos dígitos) também já existem, mas **iterativos**. Por isso a Trilha B assume esse
conhecimento e vira uma trilha de **"prove que você resolve sem for, com recursão de verdade"**:
revisita 6 desses problemas (mesma matemática, agora com `astRule` cobrando a estrutura) e depois
segue para 8 problemas **genuinamente novos** (não existem em nenhum outro lugar do catálogo).
Fibonacci ficou de fora por já ser idêntico ao 11.6; entrou **MDC (Euclides)** no lugar.

| # | Tipo | Título | astRule | Nota |
|---|---|---|---|---|
| 1 | lição | Recursão: funções que chamam a si mesmas | — | metáfora (bonecas russas) + rastro de execução passo a passo de `contagem(3)` |
| 2 | R.1 | Contagem regressiva — agora com recursão de verdade | `requireRecursion` + `forbidLoops` | revisão (existia em 11.1, iterativo-ou-recursivo sem regra) |
| 3 | R.2 | Soma de 1 até N — agora com recursão de verdade | `requireRecursion` + `forbidLoops` | revisão (11.3) |
| 4 | lição | Por que evitar o for muda o jeito de pensar | — | ponte conceitual |
| 5 | R.3 | Fatorial — agora com recursão de verdade | `requireRecursion` + `forbidLoops` | revisão (11.2) |
| 6 | R.4 | Potência — agora com recursão de verdade | `requireRecursion` + `forbidLoops` | revisão (11.4) |
| 7 | R.5 | Soma dos dígitos — agora com recursão de verdade | `requireRecursion` + `forbidLoops` | revisão (9.5, era iterativo) |
| 8 | R.6 | Palíndromo — agora com recursão de verdade | `requireRecursion` + `forbidLoops` | revisão (7.9, era iterativo) |
| 9 | lição | Recursão sobre listas: cabeça e cauda | — | a partir daqui, tudo NOVO |
| 10 | R.7 | Maior valor de uma lista (sem Math.max, sem loop) | `requireRecursion` + `forbidLoops` + `forbidMethod(max)` | novo |
| 11 | R.8 | Inverter uma string (sem .reverse(), sem loop) | `requireRecursion` + `forbidLoops` + `forbidMethod(reverse)` | novo |
| 12 | R.9 | MDC de dois números (algoritmo de Euclides) | `requireRecursion` + `forbidLoops` | novo |
| 13 | R.10 | Busca binária (recursiva) | `requireRecursion` + `forbidLoops` | novo |
| 14 | lição | Métodos de array em vez de loop (map/filter/reduce) | — | ponte: "sem for" também pode ser HOF |
| 15 | R.11 | Dobrar valores com .map (sem for) | `requireMethod(map)` + `forbidLoops` | novo |
| 16 | R.12 | Filtrar pares com .filter (sem for) | `requireMethod(filter)` + `forbidLoops` | novo |
| 17 | R.13 | Somar com .reduce (sem for) | `requireMethod(reduce)` + `forbidLoops` | novo |
| 18 | R.14 | [Bônus] Torres de Hanói | `requireRecursion` + `forbidLoops` | fecha a trilha |

**18 módulos (4 lições + 14 desafios).** Conteúdo completo escrito em
`apps/api/src/shared/db/seed-trilha-recursao.ts` (script `pnpm --filter @codinhos/api
db:seed:recursao`, ainda **não rodado** — precisa ser executado no ambiente do usuário).
**Verificação feita:** script Node que replica o dispatch real do `run-tests.ts` (importando
`@codinhos/runner` compilado) rodou, para cada um dos 14 desafios, a solução de referência
(recursiva) e uma solução "errada de propósito" (com `for`/`while`, e nos dois casos aplicáveis
também com `Math.max`/`.reverse()`). Resultado: as 14 soluções boas passam 100%, e todas as
soluções erradas são corretamente reprovadas pela `astRule` (0 falso-positivo/negativo).

## Trilha C — "Desenhando com p5.js" (render_mode: p5, ast requireCall/forbidCall) — ✅ ESCRITA E VERIFICADA

Slug `js-p5-programacao-visual`, `order: 40`. Nota vem da **estrutura** (chamou a função certa?
definiu a função de evento certa?), nunca de pixel — como já é o desenho do motor (ver
`docs/motor-desafios-capacidades.md` §14). Achei uma economia interessante do `requireCall`:
como a checagem é textual (`nome(` sem ponto antes), ela também detecta a DECLARAÇÃO de
`function draw()/mousePressed()/keyPressed()`, não só chamadas — então dá pra exigir "definiu o
event handler" com a mesma regra usada para "chamou a primitiva".

| # | Tipo | Título | Verificação (ast) |
|---|---|---|---|
| 1 | lição | O que é p5.js: `setup()`/`draw()`, `createCanvas` | — |
| 2 | P.1 | Sua primeira tela | `requireCall(createCanvas)` |
| 3 | lição | Cores: `background`, `fill`, `stroke`, `noStroke` | — |
| 4 | P.2 | Fundo colorido + um retângulo | `requireCall` de createCanvas + background + fill + rect |
| 5 | lição | Formas e coordenadas (x→direita, y→baixo) | — |
| 6 | P.3 | Desenhe um rosto (círculo + olhos + boca) | `requireCall` de createCanvas + ellipse |
| 7 | P.4 | Desenhe uma casinha | `requireCall` de createCanvas + rect + triangle |
| 8 | lição | Variáveis e animação: `draw()` roda a cada quadro | — |
| 9 | P.5 | Bolinha que se move | `requireCall` de createCanvas + draw + ellipse |
| 10 | lição | Interatividade: `mousePressed`, `mouseX`/`mouseY`, `keyPressed` | — |
| 11 | P.6 | Círculo onde o mouse clicar | `requireCall` de createCanvas + mousePressed + ellipse |
| 12 | P.7 | Muda a cor de fundo ao apertar tecla | `requireCall` de createCanvas + keyPressed + background |
| 13 | lição | Repetição para desenhar padrões (`for` aplicado ao visual) | — |
| 14 | P.8 | [Hard] Grade de quadrados | `requireCall` de createCanvas + rect (o `for` em si não é conferido — a astRule não tem uma regra "exige loop") |
| 15 | P.9 | [Projeto livre] Seu desenho ou mini-animação | `validationModeOverride: 'manual'`, sem testCases — gestor aprova |

**15 módulos (6 lições + 9 desafios).** Um pouco menor que a estimativa inicial (~16): fundi as
lições de "variáveis" e "animação" em uma só, ficou mais enxuto sem perder conteúdo. Conteúdo
completo em `apps/api/src/shared/db/seed-trilha-p5.ts` (script `pnpm --filter @codinhos/api
db:seed:p5`, ainda **não rodado**) — este seed **grava a coluna `renderMode`** explicitamente
(o `seedTrilha()` original não gravava). **Verificação feita:** como `checkAstRule` é puro (sem
execução), rodei ele direto para cada regra dos 8 desafios com `astRule`: uma solução "boa"
(passa todas as regras) e uma "incompleta de propósito" (falta uma primitiva específica —
reprova pelo menos aquela regra). 0 falso-positivo/negativo. O projeto livre (P.9) não tem
`astRule` por design (é `manual`, sem gabarito).

## Números gerais da proposta

- **3 trilhas novas**, 47 módulos no total (14 lições + 33 desafios), todas fácil→difícil.
- Cada trilha é independente das outras duas (podem ser semeadas e atribuídas em qualquer ordem),
  mas as três pressupõem a trilha de fundamentos já concluída.

## O que mudou no código (além de conteúdo)

1. **`render_mode` não era salvo pelo seed original.** O `seedTrilha()` de `seed-trilha-js.ts` não
   inclui `renderMode` no insert/update de `challenges` — só funcionava porque nenhum desafio
   semeado usava p5. O `seed-trilha-p5.ts` novo grava essa coluna explicitamente.
2. **3 arquivos de seed novos**, todos seguindo o padrão idempotente do `seed-trilha-js.ts`:
   `seed-trilha-console.ts`, `seed-trilha-recursao.ts`, `seed-trilha-p5.ts`. + 3 entradas novas em
   `package.json`: `db:seed:console`, `db:seed:recursao`, `db:seed:p5`.
3. **Verificação feita para as 3** (mesma técnica das 84 anteriores, adaptada a cada modo): script
   Node que roda a solução de referência de cada desafio contra os `testCases` usando o runner
   compilado (`@codinhos/runner`) — para `stdout` confere a saída exata (inclusive espaçamento);
   para `ast` confere que a solução boa passa a regra E que uma solução "errada/incompleta de
   propósito" (com loop, sem recursão, faltando uma primitiva) falha a regra certa — evita
   falso-positivo/negativo dos dois lados.
4. Runner (`@codinhos/runner`) já suportava tudo isso (D2/D5b/D5c mergeados) — nenhuma mudança de
   motor foi necessária, só conteúdo + seed.

## Status: as 3 trilhas escritas e verificadas — falta só rodar o seed

| Trilha | Slug | Módulos | Arquivo | Script | Verificação |
|---|---|---|---|---|---|
| A — Saída/stdout | `js-saida-e-formatacao` | 14 (4 lições + 10 desafios) | `seed-trilha-console.ts` | `db:seed:console` | ✅ string exata conferida |
| B — Recursão/ast | `js-recursao-de-verdade` | 18 (4 lições + 14 desafios) | `seed-trilha-recursao.ts` | `db:seed:recursao` | ✅ boa passa + ruim reprova |
| C — p5.js | `js-p5-programacao-visual` | 15 (6 lições + 9 desafios) | `seed-trilha-p5.ts` | `db:seed:p5` | ✅ boa passa + incompleta reprova |

Nada foi semeado no banco ainda — o sandbox não tem acesso ao `DATABASE_URL` do ambiente real.
Para publicar, rode os 3 comandos abaixo (em qualquer ordem, cada trilha é independente) e depois
ative cada trilha como gestor:

```bash
pnpm --filter @codinhos/api db:seed:console
pnpm --filter @codinhos/api db:seed:recursao
pnpm --filter @codinhos/api db:seed:p5
```
