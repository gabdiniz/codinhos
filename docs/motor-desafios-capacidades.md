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

---

## 10. D3 (1ª leva) — dicas progressivas pelo Codi (feito)

Ramo sugerido `feat/d3-dicas-progressivas`. Primeira leva da direção pedagógica: **dicas
progressivas geradas por IA**, reaproveitando o tutor Codi (Haiku) que já existe. (Code review
pós-acerto fica para a 2ª leva.)

**Como funciona:** um botão **"Pedir uma dica"** no painel do Codi. A cada clique o nível sobe
(1 → 2 → 3, depois mantém no 3) e o front manda `intent:'hint'` + `hintLevel` + o código atual.
O system prompt ganha um bloco de **Modo DICA** que instrui o Codi a dar UMA dica curta do
nível pedido, sem nunca entregar a solução:
- Nível 1: cutucada conceitual (sem apontar o código).
- Nível 2: aponta ONDE olhar no código (sem escrever a correção).
- Nível 3: descreve o passo/estrutura que falta (ainda sem o código pronto).

**Reaproveitamento:** usa a mesma conversa persistida, o limite diário de mensagens e o
contexto de desafio já montados — zero migration. É a direção que consome o orçamento de IA da
planilha (mais mensagens por aluno), mas a margem segue ~80%+.

**Arquivos:** `ai-tutor.schema.ts` (intent/hintLevel), `ai-tutor.service.ts` (bloco de dica no
buildSystemPrompt + repasse no sendMessage), `ChallengePage.tsx` (estado hintsUsed, requestHint,
botão) + CSS. Testes em `ai-tutor.service.test.ts` (o bloco de dica do nível certo entra no
system prompt; conversa normal não o inclui; hintLevel sem intent=hint é ignorado).

### 2ª leva — code review pelo Codi (feito)
Após o aluno **acertar**, um botão **"✨ Pedir review ao Codi"** no bloco de conclusão abre o
Codi e manda `intent:'review'` + o código que passou. O system prompt ganha um bloco **Modo
REVIEW**: elogio curto + no máximo 1-2 sugestões concretas (clareza, nomes, JS idiomático, caso
de borda), sem reescrever o código; se já está ótimo, diz isso e aponta um ponto forte. Mesmo
padrão da dica (só um `intent` novo). Arquivos: `ai-tutor.schema.ts` (intent 'review'),
`ai-tutor.service.ts` (bloco reviewMode), `ChallengePage.tsx` (botão + autoMsg carrega intent) +
CSS. Testes no `ai-tutor.service.test.ts` (bloco de review entra só com intent=review).

**D3 completa.** Próximo: D4 (geração de desafios por IA) ou D5 (async/AST/Python/p5.js).

---

## 11. D5 (async/await) — feito

Ramo sugerido `feat/d5-async`. O motor deixou de ser estritamente síncrono: agora
**aguarda a Promise** que uma função `async` retorna antes de comparar. Destrava desafios de
`async`/`await`, `Promise.resolve/all/race` e "espere e então" (`setTimeout`).

**Runner (`@codinhos/runner`, `async.ts`):** `isThenable` + `resolveMaybeAsync(value, ms=3000)`
— se o valor for uma Promise, aguarda com **timeout** (Promise que não resolve em 3s rejeita, o
teste reprova); valores síncronos passam direto. Puro e compartilhado, então back e front
esperam igual. Também adicionei `setTimeout`/`clearTimeout` ao `SAFE_GLOBALS` do backend (o
worker já os tinha — havia uma divergência latente aí).

**Backend (`run-tests.ts`):** `runTests` virou **async**; os branches de função e stdout
aguardam a chamada via `resolveMaybeAsync`. `submissions.service` passou a `await runTests`.
**Worker:** handler assíncrono (`Promise.all`), `runFunctionTest`/`runStdoutTest` async.

**Verificação:** `run-tests.async.test.ts` (backend + concordância com réplica do worker: async
retorna valor, await interno, `Promise.all`, stdout async, síncrono ainda funciona, rejeição/
resultado errado reprovam, timeout de Promise pendente) e `async.test.ts` no runner. Os testes
diferencial e stdout foram atualizados para `await runTests`.

**Importante ao subir:** como o pacote `@codinhos/runner` ganhou arquivo novo (`async.ts`),
**rebuildar o dist** (`pnpm install` ou `pnpm --filter @codinhos/runner build`) antes de
`docker compose restart api` — senão o import de `resolveMaybeAsync` quebra em runtime.

**Escopo v1 / limites:** captura de `console.log` async só dentro de função-alvo (não do topo do
código); sync infinito dentro da função ainda não tem timeout (só o async tem) — herança do
modelo atual. Restam da D5: AST ("use recursão"), Python (Pyodide), p5.js.

---

## 12. D4 — geração de desafios por IA (feito)

Ramo sugerido `feat/d4-gerar-desafio`. Escala a produção de conteúdo: o gestor descreve um
tema e a IA gera um desafio completo, **verificado automaticamente pelo runner** antes de o
gestor revisar. Nada é salvo sem revisão humana.

**Fluxo:** botão **"✨ Gerar com IA"** por módulo → modal (tema + dificuldade + tipo de teste) →
`POST /:slug/authoring/generate-challenge` (guard manager). O serviço (`challenge-gen.service.ts`)
usa **Sonnet** (`claude-sonnet-5`) para gerar um JSON estruturado — enunciado, `starterCode`,
`targetFn`, `testCases` (com matcher/mode) **e uma solução de referência**. Então roda a solução
contra os testCases no **mesmo `runTests`** que corrige o aluno; se passa em todos, marca
`verified: true`. Se não, **tenta uma vez mais** realimentando o erro. Devolve o rascunho (não
persiste) + a solução de referência + o selo de verificação.

No front, o rascunho **pré-preenche o formulário de desafio existente** (o `initial` do
`ChallengeForm` foi relaxado para `Partial<Challenge>`), com um toast dizendo se foi verificado.
O gestor edita/salva pelo fluxo normal de criação.

**Por que é sólido:** a IA às vezes erra os testCases; a verificação pelo runner (agora robusto,
com async/stdout/matchers) pega isso antes de virar conteúdo. Sem migration (não há coluna de
solução — ela é só para verificar e pré-visualizar).

**Testes:** `challenge-gen.service.test.ts` mocka a Anthropic mas usa o `runTests` REAL —
cobre: verificado quando a solução passa, extração de JSON com crases, retentativa quando a 1ª
falha, `verified:false` quando nem o retry passa, e `UnprocessableError` para JSON inválido. A
lógica de verificação foi validada contra o runner compilado (solução boa/ruim, call/stdout).

**Ao subir:** só `docker compose restart api` (novo código de backend) + HMR do app — **não** há
arquivo novo no `@codinhos/runner`, então não precisa rebuildar o dist desta vez. **Verificar:**
o string do modelo `claude-sonnet-5` precisa ser válido na conta; se não for, a geração retorna
503 (AiServiceError) — é um `const` fácil de trocar em `challenge-gen.service.ts`.

**Roadmap:** o motor cobriu D1 (unificação+targetFn+matchers), D2 (console.log), D3 (dicas+
review), D5-async e D4 (geração). Restam de motor: AST ("use recursão"), Python/Pyodide, p5.js;
e de pedagogia: dificuldade adaptativa, revisão espaçada.

---

## 13. D5 (AST) — avaliar o "como" (feito)

Ramo sugerido `feat/d5-ast`. O motor passou a avaliar a **estrutura do código**, não só o
resultado: "use recursão", "sem laços", "use `map`". Novo `mode: 'ast'` + `astRule` no TestCase.

**Sem parser (de propósito):** para não trazer dependência (acorn etc.) ao pacote e evitar o
custo de "pacote novo no Docker", a análise é dirigida sobre o código **limpo** —
`stripCommentsAndStrings` remove comentários e conteúdo de strings/templates (para a palavra
`for` num comentário não virar "laço"). Puro e compartilhado → back e front dão o mesmo veredito.

**Regras v1 (`checkAstRule`):** `requireRecursion` (a função-alvo chama a si mesma; usa o corpo
entre chaves, com fallback para arrow de expressão), `forbidLoops` (sem for/while/forEach),
`requireMethod`/`forbidMethod` (usa/não usa `.nome(`).

**Runner:** `ast.ts` (`stripCommentsAndStrings`, `checkAstRule`). **Backend/worker:** branch
`mode:'ast'` → `checkAstRule` (sem execução; `actual` = mensagem explicativa). **Zod:** mode 'ast'
+ astRule nos três schemas (authoring, catalog, **learn** — o do aluno). **Autoria:** o seletor
"tipo" ganhou "estrutura do código", com um seletor de regra + campo de método (para
require/forbidMethod), nos formulários do gestor e do admin. Uso típico: **um** caso de teste AST
(ex.: "exige recursão") junto dos casos normais que checam o resultado.

**Testes:** `ast.test.ts` no runner (regras + os guardas contra falso-positivo: "for" em
comentário/string/identificador não conta) e `run-tests.ast.test.ts` (despacho pelo runTests).
Validado contra o runner compilado.

**Ao subir:** o pacote `@codinhos/runner` ganhou arquivo novo (`ast.ts`) → **rebuildar o dist**
(`pnpm install` ou `pnpm --filter @codinhos/runner build`) antes de `docker compose restart api`,
igual à D5-async.

**Limite (heurístico, não AST real):** casos muito exóticos (regex literais com `for` dentro,
`arguments.callee`) podem escapar; para a faixa 11–14 e as regras acima é robusto. Se um dia
precisar de precisão total, trocar por acorn. **Restam da D5:** Python/Pyodide, p5.js.

---

## 14. D5 (p5.js) — desafios visuais (feito)

Ramo sugerido `feat/d5-p5`. O motor passou a suportar desafios **visuais**: o aluno escreve
um sketch p5.js (setup/draw) e **vê o desenho**. Novo campo `renderMode` no desafio
(`'js'` padrão | `'p5'`).

**A ideia que resolve a nota: separar VER de AVALIAR.**

**Ver (prévia):** um `<iframe sandbox="allow-scripts">` (SEM `allow-same-origin`) renderiza o
sketch no front. O código do aluno não enxerga o DOM, cookies nem a origem do app. A p5 é
**empacotada** (`import p5Src from 'p5/lib/p5.min.js?raw'`) e inlinada no `srcDoc` — roda
offline, sem CDN. A prévia atualiza no "Rodar desenho" (não a cada tecla). Roda no main thread
(o Web Worker de correção não tem canvas), mas isolada pelo sandbox do iframe.

**Avaliar (nota):** reaproveita a AST (§13). Não há comparação de pixels (frágil e o backend
não renderiza) — o aluno é avaliado pela **estrutura**: "chamou `createCanvas`?", "usou
`ellipse`?", "sem `for`?". Duas regras novas na AST: **`requireCall`/`forbidCall`** (chamada de
função solta `nome(`, distinta de método `.nome()` via lookbehind `(?<![.\w$])`). Assim o
**backend continua revalidando a nota** (AST é pura) e back≡front continua de graça. Desafios
criativos abertos usam o modo **`manual`** que já existe (gestor aprova).

**Onde mexeu:** runner (`ast.ts`: requireCall/forbidCall + `usesCall`); `render_mode` na tabela
`challenges` (migration 0010) + schema Drizzle; zod nos três schemas (authoring/catalog/**learn**)
com o enum de regra estendido e `renderMode`; repositories/services propagando `renderMode`;
front do aluno (`P5Preview` + botão "Rodar desenho" quando `renderMode==='p5'`); autoria (gestor
e admin) com "Tipo de desafio: visual (p5.js)" e as regras "exige/proíbe função (nome())".

**Testes:** `ast.test.ts` cobre requireCall/forbidCall (inclusive método homônimo, comentário e
prefixo não contam). Validado contra o runner compilado.

**Ao subir (3 pontos):** (1) `render_mode` é coluna nova → rodar a **migration** (docker migrate).
(2) `ast.ts` tem lógica nova → **rebuildar o dist do runner** antes dos testes da API. (3) **p5 é
dependência nova** do `apps/app` → `pnpm install` e, no Docker, **recriar o volume de deps do
container `app`** (mesmo cuidado de "pacote novo quebra volumes", agora no app, não na api).

**Limite:** grava "usou as primitivas certas", não "ficou bonito". Pixel-match fica fora (fura o
back≡front). Para 11–14 e as regras acima é o encaixe certo. **Fim da trilha D5** (async, AST, p5).
