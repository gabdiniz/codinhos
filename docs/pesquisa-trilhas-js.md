# Pesquisa e plano geral — currículo de JavaScript

Documento mestre do conteúdo de JavaScript do Codinhos. Define o **caminho completo do zero ao
mais avançado possível dentro do motor**, desenhado como uma progressão única e coerente para o
aluno de 11–14 anos. Cada trilha tem um documento próprio (`docs/trilha-js-01-*.md` em diante)
com a tabela módulo a módulo. **Só documentos — nada semeado**, para revisão antes de qualquer
seed. Mesma técnica de auditoria de `docs/pesquisa-trilhas-python.md`.

> **Reset de conteúdo (jul/2026).** As trilhas JS antigas foram **descontinuadas e removidas** do
> código (`seed-trilha-js.ts` com 101 módulos, `seed-trilha-console.ts`, `seed-trilha-recursao.ts`,
> `seed-trilha-p5.ts` e seus scripts em `package.json`). Elas tinham bom conteúdo, mas eram um
> arranjo herdado: uma trilha-monstro de fundamentos + trilhas especializadas soltas. Este
> documento redesenha tudo como **um caminho linear** de trilhas do tamanho certo, do primeiro
> `let` até POO, absorvendo os tópicos essenciais das antigas (saída, recursão) em seus lugares
> naturais e mantendo o visual (p5.js) como **trilha opcional** fora do caminho principal.

---

## 1. Estado do motor (o que sustenta o currículo)

Verificado no código (`packages/runner/src/*`, `apps/api/src/shared/utils/run-tests.ts`,
`apps/app/src/workers/sandbox.worker.ts`) e **testado empiricamente** nas duas réplicas de runner
(backend `node:vm` com `SAFE_GLOBALS`; front `new Function`).

**Modos de teste disponíveis** (todos mergeados, D1→D5):

- **function-call** (`input: unknown[]`): chama a função-alvo, compara retorno via `deepEqual` ou
  matcher (`approx`/`contains`/`regex`). Modo dominante.
- **type-check** (`input: null`): checa `typeof <var>`. Para "crie uma variável do tipo X".
- **stdout** (`mode:'stdout'`): compara a saída de `console.log`. Para imprimir e para efeito
  observável (POO).
- **ast** (`mode:'ast'` + `astRule`): estrutura do código — `requireRecursion`, `forbidLoops`,
  `requireMethod`/`forbidMethod`, `requireCall`/`forbidCall`. Reforço, não verificação única.
- **async**: `resolveMaybeAsync` aguarda a Promise antes de comparar.
- **manual**: projeto aberto, gestor aprova.

**O que a linguagem oferece e o motor sustenta (testado, back≡front):** todo o ES6+ moderno —
`Map`, `Set`, `Promise`/`async`/`await`, `class` (+ herança, getters, `static`, `#privado`),
desestruturação, spread/rest, `?.`/`??`, `RegExp`, `Symbol`. A whitelist `SAFE_GLOBALS`
(`Math, Number, String, Array, Object, JSON, parseInt/Float, isNaN, isFinite, Boolean, Date,
setTimeout, console`) **não bloqueia** os intrínsecos: `vm.createContext` cria um contexto V8
completo. Detalhe em §3.

**As 3 fronteiras estruturais** (moldam o desenho, não a linguagem):

1. **Retorno comparado precisa ser JSON-serializável.** `testCases` são `jsonb` e `deepEqual` usa
   `Object.keys`. Nunca se retorna `Map`/`Set`/instância/função — converte-se antes
   (`Object.fromEntries`, `[...set]`, um campo).
2. **Função-alvo = primeira função declarada (ou `targetFn`).** Uma `class` não é função → POO se
   testa por `stdout` ou por função-embrulho.
3. **Sem multi-arquivo / `import`-`export`.** Elimina uma trilha de "módulos".

---

## 2. O caminho completo — 14 trilhas + 1 opcional

Progressão linear; cada trilha só usa o que as anteriores ensinaram. `order` em passos de 10 para
caber inserções futuras. Python fica em `order` 100+ (idioma separado).

| Ordem | Slug | Trilha | Foco | Modo(s) de teste |
|---|---|---|---|---|
| 10 | `js-primeiros-passos` | Primeiros Passos | variáveis, tipos, operadores, `console.log` | type-check, function-call, stdout |
| 20 | `js-decisoes-e-repeticoes` | Decisões e Repetições | `if`/`switch`/ternário, `for`/`while`/`for...of` | function-call |
| 30 | `js-funcoes` | Funções | parâmetros, padrão, arrow, template, escopo, composição | function-call |
| 40 | `js-listas-e-strings` | Listas e Textos | arrays (métodos, spread, mutação) + strings | function-call |
| 50 | `js-numeros-e-objetos` | Números e Objetos | `Math`/números + objetos (dicionário) | function-call |
| 60 | `js-alta-ordem-e-funcional` | Alta Ordem e Estilo Funcional | `map`/`filter`/`reduce`/`find`/`some`/`every`/`sort` | function-call |
| 70 | `js-saida-e-formatacao` | Imprimindo e Formatando | `console.log` avançado, `repeat`, `for` aninhado, `padStart/End`, ASCII | stdout |
| 80 | `js-recursao` | Recursão de Verdade | recursão (com `astRule`), cabeça/cauda, busca binária, Hanói | function-call + ast |
| 90 | `js-algoritmos` | Algoritmos Clássicos | FizzBuzz, frequência, regex, cifra, moda/mediana, romano | function-call, stdout |
| 100 | `js-sintaxe-moderna` | Sintaxe Moderna (ES6+) | desestruturação, spread/rest, `?.`/`??`, shorthand | function-call |
| 110 | `js-colecoes-map-set` | Coleções: Map e Set | `Map`, `Set`, quando usar | function-call + ast |
| 120 | `js-erros-e-robustez` | Tratamento de Erros | `try`/`catch`/`throw`/`finally`, código defensivo | function-call |
| 130 | `js-async-await` | Async/await e Promises | `Promise`, `async`/`await`, `Promise.all` | function-call (async) |
| 140 | `js-orientacao-a-objetos` | Orientação a Objetos | `class`, `this`, métodos, herança, encapsulamento | stdout + embrulho |
| — (opcional) | `js-programacao-visual-p5` | Desenhando com p5.js | visual: `setup`/`draw`, cor, animação, interação | ast (`requireCall`) + manual |

**Blocos do caminho:**

- **Base (10–50):** do primeiro valor ao objeto-dicionário. Tudo que existe em qualquer linguagem.
- **Fluência (60–90):** pensar em estilo funcional, imprimir com capricho, recursão de verdade e
  aplicar em algoritmos clássicos. É o "fim do básico bem-feito".
- **Avançado JS (100–140):** o que é específico do JS moderno e sustentado pelo motor — ES6+,
  coleções, erros, assincronia e POO (o **teto**).
- **Opcional:** p5.js, um diferencial visual e motivacional, fora do caminho obrigatório.

**Por que esta ordem:** cada conceito aparece só depois de ter sido ensinado. Ex.: `map`/`filter`
(60) precisam de arrays (40) e funções (30); recursão estrutural (80) precisa de funções (30) e
listas (40); Map/Set (110) usam desestruturação de `[k,v]` (100); async (130) usa `try/catch`
(120); POO (140) usa `this` e desestruturação no construtor (100). Cada doc traz a coluna
**"Revisão de"** ligando cada reaplicação à sua origem — *citar e reaplicar*, nunca *reintroduzir*.

---

## 3. Verificação do motor para ES6+ (o teste que fundamenta o avançado)

Rodado em réplica fiel dos dois runners. Todos passaram, **back ≡ front**:

| Feature | node:vm | new Function | Observação de uso no currículo |
|---|---|---|---|
| `Map`/`Set` | ✅ | ✅ | nunca como retorno — converter (trilha 110) |
| `Promise`/`async`/`await` | ✅ | ✅ | motor aguarda via `resolveMaybeAsync` (130) |
| `class` + herança + getters + `static` + `#privado` | ✅ | ✅ | não é alvo → stdout/embrulho (140) |
| desestruturação, spread/rest, `?.`, `??`, shorthand | ✅ | ✅ | sintaxe pura (100) |
| `RegExp`, `Symbol`, `Object.entries/fromEntries` | ✅ | ✅ | regex nos algoritmos (90) |
| extração de alvo p/ `async function` sem `targetFn` | ✅ | ✅ | confirmado |

Soluções de referência de desafios representativos de cada bloco foram executadas nos dois
runners com resultado idêntico (incl. classe via embrulho, `Map`→`Object.fromEntries`, `Set`
dedup, `try/catch`, `async`, desestruturação+rest).

---

## 4. Gaps de motor que o currículo revela

Nenhum bloqueia publicar. Registrados para o roadmap do motor.

- **G-JS1 — `class` não é função-alvo (M).** POO fica em `stdout`/embrulho (contornos provados).
  Um modo "instancie X, chame método Y" tornaria a trilha 140 mais direta.
- **G-JS2 — sem regra AST para `class`/`try`/`?.`/desestruturação/`...` (P–M).** Dá para exigir
  `Map`/`Set`/construtor via `requireCall`, mas não `try`/desestruturação — esses são cobrados por
  **comportamento**. Uma regra `requireKeyword` (busca textual no código limpo) fecharia a lacuna.
- **G-JS3 — sem multi-arquivo/`import`-`export` (G).** Sem trilha de módulos; o tópico entra só
  conceitualmente (nota na trilha 140). Mesmo horizonte G do motor.
- **G-JS4 — async sem I/O real (G + decisão de segurança).** `fetch` está bloqueado; a trilha 130
  simula a espera com `Promise.resolve`/`setTimeout`. Ensina o mecanismo, não o consumo de rede.
- **G-JS5 — retorno não-JSON não é comparável (P, é design).** `Map`/`Set`/instância não podem ser
  `expected`. Todas as trilhas convertem antes de retornar.

---

## 5. Comparação com o Python (para calibrar tamanho)

O currículo JS (14 trilhas core, ~200 módulos) é **maior** que o de Python (10 trilhas, 180
módulos), como esperado: o JS é a linguagem-casa da plataforma, tem tier avançado próprio (ES6+,
Map/Set, erros, async) que o desenho de Python não cobre, e ainda o extra visual (p5.js). O teto
é o mesmo dos dois (POO). A única "avançada clássica" ausente nos dois é módulos/`import` — limite
de motor (G-JS3), não de linguagem.

---

## 6. Status

| Bloco | Trilhas | Status |
|---|---|---|
| Base | 01–05 | doc módulo a módulo, auditado |
| Fluência | 06–09 | doc módulo a módulo, auditado |
| Avançado | 10–14 | doc módulo a módulo, auditado |
| Opcional | p5 | doc módulo a módulo, auditado |

**Nada semeado.** Próximo passo, quando aprovado: escrever os `seed-trilha-js-*.ts` idempotentes
(mesmo padrão dos seeds de Python) e verificar cada solução de referência contra o runner
compilado antes de semear. Ver [[runner-dist-antes-dos-testes]] e [[dois-postgres-dev-vs-teste]].
