# Motor de aprendizado — capacidades e evolução

Mapa honesto do que o motor de desafios do Codinhos consegue montar **hoje**, o que cada
evolução **destrava**, e o esforço estimado (P / M / G). Serve de base para priorizar o
roadmap do motor. Faixa-alvo: crianças de 11 a 14 anos aprendendo JavaScript.

> Reconstruído em jul/2026 a partir da leitura do código atual
> (`apps/api/src/shared/utils/run-tests.ts`, `apps/app/src/workers/sandbox.worker.ts`,
> `apps/api/src/shared/db/schema.ts`). Substitui a versão que vivia em `outputs/` (scratchpad temporário).

---

## 1. Estado atual do motor

O modelo mental de tudo é **uma função síncrona, entrada → saída**.

**Execução**
- Backend (nota): `node:vm` — `createContext` + `runInContext`, timeout 3s.
- Frontend (feedback imediato): Web Worker com `new Function()` (sem acesso ao DOM).
- Globais curados: `Math, Number, String, Array, Object, JSON, parseInt, parseFloat, isNaN, isFinite, Boolean, Date`.
- `console` **silenciado** (log/error/warn/info viram no-op).
- O front dá feedback, o **backend revalida** e é quem vale a nota.

**Como um teste roda**
- Extrai o nome da **primeira função declarada** no código (`function nome(` ou `const/let nome = ... =>`).
- Chama essa função com `input` (se for array, faz spread; senão, passa como arg único).
- Compara o retorno com `expected`.

**Dois modos de teste** (decididos pelo campo `input` do `TestCase`)
- `input: unknown[]` → **function-call**: chama a função e compara retorno.
- `input: null` → **type-check**: roda o código e checa `typeof <var>`, onde o nome da
  variável é extraído do início da `description` ("`nome` deve ser do tipo string" → `nome`).

**Modos de validação de módulo:** `auto` / `auto_review` / `manual`.

**Maquinário já pronto em volta do motor**
- Lições sem desafio (`kind: 'lesson'`).
- Vocabulário acumulado alimentando o autocomplete.
- Tutor Codi (Haiku): ajuda contextual + explicação de erro.
- Gamificação: XP, nível, streak, badges; ranking; portfólio; certificados por escola; desafio semanal.
- Autoria de trilha pelo gestor; editor de blocos (Blockly, fase a).

---

## 2. Limites estruturais

Tudo esbarra em "1 função síncrona, entrada → saída":

- Sem programas **interativos** ou **visuais**.
- Sem **estado** / sem `console.log` avaliável (console está silenciado).
- Sem **async/await**.
- Não avalia o **"como"** (ex.: "use recursão", "sem usar loop").
- Sem **multi-arquivo**.
- **Python** existe no schema, mas **não tem runner**.

---

## 3. Divergência conhecida front ↔ back (bug latente)

A comparação de resultado **não é a mesma** nos dois lados:

| Lado | Como compara | Comportamento |
|---|---|---|
| Backend (`run-tests.ts`) | `JSON.stringify(actual) === JSON.stringify(expected)` | **sensível à ordem das chaves** |
| Frontend (`sandbox.worker.ts`) | `deepEqual` recursivo que **ordena as chaves** | insensível à ordem |

Consequência real (verificado em Node): um retorno `{ b: 2, a: 1 }` contra `expected {a:1, b:2}`
→ **front mostra verde, backend grava vermelho**. Qualquer desafio que retorne objeto pode
queimar o aluno. Além disso, a função `extractFunctionName` está **duplicada** nos dois arquivos —
qualquer mudança na lógica de alvo precisa tocar os dois lugares em sincronia.

Isso torna "unificar a comparação front/back" não um item de limpeza, mas de **correção**.

---

## 4. Catálogo de evoluções

Bucket: **[motor]** = evolução do runner · **[conteúdo]** = trilhas/desafios · **[pedag.]** = funcionalidade de aprendizado.

| Evolução | Bucket | Esforço | O que destrava |
|---|---|---|---|
| Função-alvo por nome | motor | **P** | Helpers e mais de uma função no código do aluno |
| Unificar comparação front↔back | motor | **P** | Corrige o bug de ordem de chaves; fonte única de verdade |
| Matchers além da igualdade (float / contém / regex) | motor | **M** | Tolerância a ponto flutuante, respostas parciais, texto |
| Avaliação por saída de `console.log` | motor | **M** | "Imprima a tabuada", FizzBuzz, padrões/ASCII, contagens |
| async/await | motor | **P–M** | Consumir dados, promessas, "espere e então…" |
| Verificação estrutural via AST | motor | **M–G** | Avaliar o "como": use recursão, sem loop, use `map` |
| Python via Pyodide | motor | **G** | Trilha de Python (runtime + runner novos) |
| Interativo / visual (p5.js) | motor | **G** | Desenho, animação, jogos simples |
| Multi-arquivo | motor | **G** | Projetos maiores, separar módulos |
| Mais trilhas / mais desafios / projetos | conteúdo | **P–M** | Volume e progressão de catálogo |
| Desafios abertos via modo `manual` | conteúdo | **P** | Enunciados sem resposta única (correção humana) |
| Dicas progressivas | pedag. | **M** | Revelar ajuda em níveis, sem entregar a resposta |
| Code review pelo Codi | pedag. | **M** | Feedback de "como melhorar" após acertar |
| Geração de desafios assistida por IA | conteúdo/func. | **M–G** | Escala de catálogo com verificação automática |
| Dificuldade adaptativa | pedag. | **G** | Ajustar dificuldade ao aluno (precisa de dados de uso) |
| Revisão espaçada | pedag. | **M–G** | Reapresentar conceitos no tempo certo |

---

## 5. Direções priorizadas (esforço × impacto pedagógico)

Da melhor relação custo-benefício para a mais cara.

**1. Quick wins do runner** — esforço **P**, habilitador. **[motor]**
Função-alvo por nome + unificar comparação front↔back + matchers básicos. Barato, corrige o
bug de ordem de chaves e destrava helpers. Base para o resto.

**2. Avaliação por `console.log`** — esforço **M**, impacto **alto**. **[motor + conteúdo]**
O maior destravador para 11–14: imprimir é a experiência de programação mais natural da idade,
e é justamente o que está bloqueado. Vem casado com uma trilha "saída no console".

**3. Camada pedagógica sobre o Codi** — esforço **M**, impacto **alto**. **[pedag.]**
Dicas progressivas + code review. Reaproveita a infra de IA que já existe; custo é de
produto/prompt, não de motor.

**4. Geração de desafios assistida por IA** — esforço **M–G**, impacto na escala. **[conteúdo]**
Gera rascunhos (enunciado + testCases + solução) que passam pela verificação automática
(rodar a solução no runner) antes do gestor aprovar. Depende da direção 1.

**5. Horizonte maior** — esforço **G**, escolher **um por vez**. **[motor]**
async/await (o mais barato do grupo), AST ("use recursão"), Python via Pyodide, visual p5.js.
Alto impacto, custo alto; entram como fase seguinte, uma decisão de produto de cada vez.

**Sequência sugerida:** 1 → 2 → 3; depois 4 quando quiser escalar catálogo; 5 é rumo de produto.

---

## 6. Cuidados transversais

- **Backend revalida a nota** — toda mudança no runner precisa refletir no Web Worker do front.
- Hoje há **duas cópias** da lógica de execução; a direção 1 deve caminhar para uma fonte única.
- **Verificação de desafios:** replicar o runner em Node e rodar a solução de referência contra
  os `testCases` antes de semear.
- Ver `pendencia-ux-validacao-manual` (UX de validação manual, já anotada).

---

## 7. D1 detalhada — quick wins do runner (plano de sprint)

Ramo `feat/runner-unify` (nada direto na `main`). Decisões travadas:
comparar por **`deepEqual` (ordem-insensível), alinhando o backend ao front**; função-alvo
declarada em **campo `targetFn`** (fallback: primeira função declarada); lógica pura num
**novo `packages/runner`**.

### Tarefa 0 — Criar `packages/runner`
Fonte única da lógica **pura** (sem `vm`, sem `new Function`): `extractFunctionName`, `deepEqual`
e `applyMatcher(actual, expected, matcher)`. Também absorve o conjunto de **globais curados**
(`SAFE_GLOBALS`) para os dois lados usarem o mesmo. Testes unitários próprios, cobrindo ordem de
chaves e cada matcher. A execução em si (o `vm` no back, o `new Function` no worker) continua
local a cada ambiente.

### Tarefa 1 — Unificar comparação (1b)
`run-tests.ts` (api) e `sandbox.worker.ts` (app) passam a importar de `packages/runner`; backend
troca `JSON.stringify` por `deepEqual`. Aplicar os globais curados também no worker (hoje ele
não cura nada — tem `fetch` etc.). **Atenção de build:** garantir que o Vite empacota
`packages/runner` dentro do bundle do Web Worker.

### Tarefa 2 — Função-alvo por nome (1a)
Migration **aditiva**: coluna `target_fn` (nullable) em `challenges`. Fluxo por camadas:
schema Drizzle -> repository devolve o campo -> service inclui no payload -> runner usa
`targetFn ?? extractFunctionName(code)`. O payload que o front posta ao worker (`InMessage`)
passa a carregar `targetFn`. Nulo em todos os 84 desafios = comportamento atual preservado.
Migration gerada à mão (drizzle-kit não roda no sandbox).

### Tarefa 3 — Matchers (1c)
`testCases` já é `jsonb` -> **sem migration**. Estender o type `TestCase` com
`matcher?: 'equal' | 'approx' | 'contains' | 'regex'` (default `equal`) e tolerância para
`approx`. `applyMatcher` no `packages/runner` cobre os quatro. **Custo extra a decidir:** expor
o matcher na **UI de autoria** do gestor (módulo catalog/authoring) ou, numa primeira fase,
só via dado/seed.

### Tarefa 4 — Verificação (revisada)
Não existem soluções de referência armazenadas (a tabela só tem `starterCode` e `testCases`).
Então a verificação da D1 é **diferencial**: um harness em Node que roda o mesmo par
`(código, testCase)` nos dois runners e exige resultado idêntico, + testes unitários do
`deepEqual`/matchers. Esperado: back e front concordam em tudo, e os casos de retorno-objeto
que hoje dão falso-vermelho no backend passam a passar. Autorar soluções de referência dos 84
desafios fica adiado para quando a D4 precisar (vira ativo reutilizável).

**Ordem:** 0 -> 1 -> 2 -> 3 -> 4. As tarefas 0 e 1 já corrigem o bug e removem a duplicação
sozinhas; 2 e 3 são incrementos independentes.

### Custo estimado
Headline **P**, mas realista **~2–4 dias** de dev solo, guiado por três variáveis:
- Atrito de build do `packages/runner` dentro do Worker do Vite (a parte mais chata).
- Se o matcher (1c) para na UI de autoria (+M) ou fica só em dado (P).
- A verificação diferencial é barata (P–M); autorar 84 soluções seria G (adiado).

Divisão aproximada: T0 ~0,5–1d, T1 ~0,5d, T2 ~0,5–1d, T3 ~0,5d (sem UI) a +1d (com UI),
T4 ~0,5–1d. Risco baixo e retrocompatível: tudo aditivo, exceto a troca de comparação — que
só torna verdes casos que hoje já eram verdes no front.
erdes no front.

---

## 8. D1 — estado da implementação (feito)

Ramo sugerido `feat/runner-unify`. Implementado:

- **`packages/runner`** (`@codinhos/runner`): lógica pura única — `extractFunctionName`,
  `resolveTargetFn`, `deepEqual`, `applyMatcher`, `SAFE_GLOBALS`, `DENIED_WORKER_GLOBALS` +
  `runner.test.ts` (vitest). Build para `dist` via `prepare` (roda no `pnpm install` dos
  Dockerfiles); exports servem `dist` em runtime e `src` para tipos.
- **T1 unificação:** `run-tests.ts` (API) e `sandbox.worker.ts` (front) consomem o runner.
  Backend passou de `JSON.stringify` para `deepEqual`. Tipos `TestCase`/`TestResult`
  reexportados do runner no schema (fonte única). Worker cura globais web-only.
- **T2 função-alvo:** coluna `target_fn` (migration 0009, aditiva) → schema → repository →
  service → payload → worker. `targetFn ?? primeira função`. Flui por submissions, catalog
  (aluno) e autoria (gestor + admin). **Falta só a UI** de autoria para o gestor digitar o
  `targetFn` (hoje setável via API/seed).
- **T3 matchers:** `matcher` (`equal|approx|contains|regex`) + `tolerance` no `TestCase`
  (jsonb, sem migration); aceitos nos zod de autoria. **Falta só o seletor na UI** de autoria
  (por ora via seed/dado).
- **T4 verificação diferencial:** `run-tests.differential.test.ts` — roda o mesmo caso no
  backend real e numa réplica do worker e exige veredito idêntico. Validado: 11/11 concordam.

**Bug extra encontrado e corrigido (pelo diferencial):** arrow function via `const`/`let`
(ex.: `const dobro = (n) => n*2`) **passava no front e falhava no backend**, porque no
`node:vm` `const`/`let` no topo não viram propriedade do sandbox. O backend agora resolve a
função avaliando o nome como expressão no contexto (`vm.runInContext(fnName, ...)`), igual à
closure do `new Function` do front.

**Nota de semântica:** `deepEqual` difere de `JSON.stringify` em casos de borda — `NaN` não é
igual a `NaN` (antes o backend os igualava via `"null"`), e `undefined` em objeto. Nenhum dos
84 desafios semeados usa esses casos; é um refinamento (deepEqual é mais correto).

**Antes de rodar:** `pnpm install` (constrói o runner), depois `pnpm --filter @codinhos/api
db:migrate` (aplica a 0009), e `pnpm --filter @codinhos/runner test` + `--filter @codinhos/api
test` + `typecheck`. Feito no sandbox: typecheck isolado (runner, run-tests, worker) e o
diferencial em Node com o código real compilado.

---

## 9. D2 — avaliação por console.log (feito)

Ramo sugerido `feat/d2-console-output`. O motor passa a suportar um terceiro modo de
teste, `mode: 'stdout'`, que compara a **saída impressa com console.log** em vez do retorno
da função. Destrava a experiência de programação mais natural para 11–14: imprimir.

**Runner (`@codinhos/runner`, `console.ts`):** formatação de saída pura e compartilhada
(`formatConsoleLine`), console de captura (`createCaptureConsole` — só `log` acumula; `warn`/
`error`/`info` são no-op) e `normalizeOutput`. A formatação é a MESMA nos dois ambientes — não
usamos o console nativo (o `util.inspect` do Node difere do navegador); injetamos o nosso.

**Normalização (decisão de design):** apara espaços à direita de cada linha e linhas em branco
no início/fim; **preserva indentação à esquerda e linhas internas** — de propósito, senão
"desenhe um triângulo" com espaços quebraria.

**Backend (`run-tests.ts`) e worker (`sandbox.worker.ts`):** novo branch stdout. Executa o
código capturando `console.log`; se `input` é array, roda a função-alvo e considera só a saída
dela (limpa o topo antes de chamar); senão captura a saída do código no topo. Compara
`normalizeOutput(saída)` com `expected` via `applyMatcher` — então `contains` e `regex` também
funcionam sobre a saída ("a saída contém 15", "bate com `total: \d+`").

**Dispatch:** `mode === 'stdout'` → stdout; senão `input === null` → type-check; senão →
função. Totalmente retrocompatível: os 84 desafios existentes não têm `mode`.

**Autoria:** zod (authoring + catalog) aceita `mode`; formulários do gestor e do admin ganharam
um seletor de **tipo de teste** ("retorno da função" / "saída (console.log)") por caso, com dica
de usar string JSON com `\n` para saída de várias linhas.

**Conteúdo (seed):** módulo novo na trilha JS — lição de `console.log` + desafios **C.1 Olá,
mundo!**, **C.2 Conte de 1 a 5**, **C.3 Tabuada** (função `tabuada(n)` com `targetFn`, testada
com n=3 e n=7) e **C.4 FizzBuzz**. As saídas esperadas foram geradas pelo runner real (exatas).

**Verificação:** `run-tests.stdout.test.ts` (backend + concordância com réplica do worker, 9
casos) e `console.test.ts` no runner (11 asserts). Diferencial rodado com o código real
compilado: back e front produzem saída e veredito idênticos; modos antigos (função/type-check)
seguem intactos.

**Pendência de polish (não bloqueante):** o painel de resultado do aluno mostra saída multilinha
com `\n` escapado numa linha só (via `JSON.stringify`); um `<pre>` renderizaria melhor, mas
mexe num caminho de serialização compartilhado por todos os tipos de teste — deixado para uma
iteração com verificação visual.
