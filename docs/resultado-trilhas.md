# Resultado — Teste das trilhas inteiras (navegador)

> Cada desafio resolvido com uma solução de referência e submetido de verdade na SPA (runner real).
> Registro incremental, uma trilha por vez. Lições (conteúdo estático) não são submetidas.

## Legenda
✅ todos os testes passam · ⚠️ passou com ressalva · ❌ falhou (bug de conteúdo/runner)

---

## Python 01 — Primeiros Passos  (9 desafios) — ✅ 9/9

| # | Desafio | Testes | Status |
|---|---|---|---|
| 1.1 | Sua primeira mensagem | 1/1 | ✅ |
| 1.2 | Guarde seu nome (type-check str) | 1/1 | ✅ |
| 1.3 | Combine texto (stdout) | 2/2 | ✅ |
| 1.4 | Sua idade (type-check int) | 1/1 | ✅ |
| 1.5 | Dobro e metade (retorna lista) | 3/3 | ✅ |
| 1.6 | Resto da divisão | 3/3 | ✅ |
| 1.7 | Maior que (retorna bool) | 3/3 | ✅ |
| 1.8 | Cartão de apresentação (f-string) | 2/2 | ✅ |
| 1.9 | Calculadora de retângulo (f-string) | 2/2 | ✅ |

Observações:
- Nenhum defeito de conteúdo/runner nesta trilha. Cobre os modos type-check (str/int), function-call (lista, int, bool) e stdout (f-string).
- Falso alarme na 1ª tentativa do 1.7: `recebido: null` porque minha automação enviou antes de o starter (`pass`) ser substituído — ao reenviar com o código correto, 3/3. **Não é bug do produto** (a serialização de bool `json.dumps(True)="true"` está correta). Ajuste na automação: aguardar o starter carregar antes de substituir o código.

---

## JavaScript 01 — Primeiros Passos  (11 desafios) — ✅ 11/11

| # | Desafio | Testes | Status |
|---|---|---|---|
| 1.1 | Declare seu nome (type-check string) | 1/1 | ✅ |
| 1.2 | Idade e status (number + boolean) | 2/2 | ✅ |
| 1.3 | Apresente-se (return texto) | 1/1 | ✅ |
| 1.4 | O dobro | 3/3 | ✅ |
| 1.5 | Olá na tela (stdout) | 1/1 | ✅ |
| 1.6 | Soma | 3/3 | ✅ |
| 1.7 | É par? (bool, %) | 3/3 | ✅ |
| 1.8 | Média de três | 3/3 | ✅ |
| 1.9 | Maior de idade (>=) | 3/3 | ✅ |
| 1.10 | Está na faixa? (&&) | 3/3 | ✅ |
| 1.11 | Ficha na tela (stdout, +) | 2/2 | ✅ |

Observações:
- Nenhum defeito. Cobre type-check (string/number/boolean), function-call (number/bool) e stdout.
- Setup necessário: a trilha JS não estava **ativada** para a escola — ativei "JavaScript: Primeiros Passos" (Trilhas → Ativar) e atribuí à Turma Demo. O runner JS roda instantâneo (sem o congelamento do Pyodide).

---

## JavaScript 02 — Decisões e Repetições  (11 desafios) — ✅ 11/11
if/else encadeado, switch, ternário, for + acumulador, while, for...of. Cobre 2.1–2.11. Sem defeitos.

## JavaScript 03 — Funções  (8 desafios) — ✅ 8/8
Template literal, parâmetro padrão, arrow functions, funções auxiliares/composição, escopo. Cobre 3.1–3.8. Sem defeitos.

## JavaScript 04 — Listas e Textos  (12 desafios) — ✅ 12/12
Arrays (índice/length/includes/slice/join), spread, reverse sem mutar, for...of + acumulador, Math.max, métodos de string (toUpperCase/split/reverse/join/charAt). Cobre 4.1–4.12. Sem defeitos.

## JavaScript 05 — Números e Objetos  (11 desafios) — ✅ 11/11
Math (round/abs/max), toFixed/Number/String, soma de dígitos, objetos ({}, [chave], in, Object.keys/values), spread de objeto, inverter chave/valor. 5.1–5.11. Sem defeitos.

## JavaScript 06 — Alta Ordem e Estilo Funcional  (11 desafios) — ✅ 11/11
map, filter, reduce, find, some, every, sort com comparador + spread, e o pipeline filter→sort→map (boletim). 6.1–6.11. Sem defeitos.

## JavaScript 07 — Imprimindo e Formatando Saídas  (10 desafios) — ✅ 10/10
console.log multi-linha, repeat, laços aninhados (quadrado/triângulo/pirâmide), padEnd (tabela/placar), matcher `contains` (relatório livre), arte ASCII com espaços à esquerda. 7.1–7.10. Sem defeitos.

## JavaScript 08 — Recursão de Verdade  (13 desafios) — ✅ 13/13
Recursão pura (contagem, fatorial, potência, dígitos, palíndromo, cabeça/cauda, MDC de Euclides, busca binária, Hanói) + map/filter sem laço. **Inclui regras AST** (requireRecursion, forbidLoops, forbidMethod, requireMethod) — todas passam. 8.1–8.13.

## JavaScript 09 — Algoritmos Clássicos  (10 desafios) — ✅ 10/10
FizzBuzz, objeto-contador (frequência/moda), map em sublistas, agrupar por paridade, validação de formato, anagramas, cifra de César (charCodeAt/fromCharCode), mediana, inteiro→romano. 9.1–9.10.

## JavaScript 10 — Sintaxe Moderna (ES6+)  (10 desafios) — ✅ 10/10
Desestruturação de array/objeto (com padrão), rest `...args`, spread de array/objeto, optional chaining `?.` e nullish `??`, template multilinha. 10.1–10.10.

## JavaScript 11 — Coleções (Map e Set)  (9 desafios) — ✅ 9/9
Set (dedup, .size, .has), Map (.set/.get, Object.fromEntries/entries), pertencimento, contagem, inverter dicionário, apuração de votos. Inclui regras AST requireCall(Set/Map). 11.1–11.9.

## JavaScript 12 — Tratamento de Erros e Robustez  (8 desafios) — ✅ 8/8
try/catch/finally, throw new Error/e.message, guard clauses (Array.isArray), `?.`/`??`, parseInt/isNaN. 12.1–12.8.

## JavaScript 13 — Async/await e Promises  (7 desafios) — ✅ 7/7
Promise.resolve, .then, async/await, dois awaits, Promise.all + map, try/catch assíncrono, setTimeout. 13.1–13.7.

## JavaScript 14 — Orientação a Objetos (classes)  (9 desafios) — ✅ 9/9
class/constructor/this/new, métodos, toString, estado mutável, getter, herança (extends/super), campo privado `#`, composição (lista de objetos). 14.1–14.9.

---

## Placar até agora
| Trilha | Desafios | Status |
|---|---|---|
| Python 01 — Primeiros Passos | 9 | ✅ |
| JavaScript 01 — Primeiros Passos | 11 | ✅ |
| JavaScript 02 — Decisões e Repetições | 11 | ✅ |
| JavaScript 03 — Funções | 8 | ✅ |
| JavaScript 04 — Listas e Textos | 12 | ✅ |
| JavaScript 05 — Números e Objetos | 11 | ✅ |
| JavaScript 06 — Alta Ordem e Estilo Funcional | 11 | ✅ |
| JavaScript 07 — Imprimindo e Formatando Saídas | 10 | ✅ |
| JavaScript 08 — Recursão de Verdade | 13 | ✅ |
| JavaScript 09 — Algoritmos Clássicos | 10 | ✅ |
| JavaScript 10 — Sintaxe Moderna (ES6+) | 10 | ✅ |
| JavaScript 11 — Coleções (Map e Set) | 9 | ✅ |
| JavaScript 12 — Tratamento de Erros | 8 | ✅ |
| JavaScript 13 — Async/await e Promises | 7 | ✅ |
| JavaScript 14 — Orientação a Objetos | 9 | ✅ |
| **Total** | **149** | **✅ 149/149** |

## JavaScript p5 — Desenhando com p5.js  (9 desafios) — ✅ 8/8 auto + 1 manual
Modo `renderMode: p5`, validação por **AST requireCall** (createCanvas, background, fill, rect, ellipse, triangle, draw, mousePressed, keyPressed). P.1–P.8 auto-passam. **P.9 [Projeto livre]** tem `validationModeOverride: manual` — submeter mostrou corretamente **"📤 Enviado para revisão do professor"** (não auto-conclui). Confirma o fluxo de revisão manual no nível do desafio.

---

## Placar até agora
Todas as **15 trilhas JavaScript (01–14 + p5)** concluídas.

| Bloco | Desafios | Status |
|---|---|---|
| Python 01 — Primeiros Passos | 9 | ✅ |
| JavaScript 01–14 | 140 | ✅ |
| JavaScript p5 (Desenhando) | 8 auto + 1 manual | ✅ |
| **Total exercitado** | **158** | **✅** |

Zero defeitos de conteúdo ou runner em toda a base JavaScript. Modos validados: function-call, type-check, stdout, contains, **AST** (requireRecursion, forbidLoops, forbidMethod, requireMethod, requireCall) e **manual** (P.9). Recursos: recursão, HOF, async/await, classes com herança e campo privado `#`, p5 visual.

## Python 02 — Decisões e Repetições  (10 desafios) — ✅ 10/10
if/elif/else, and/or/not (palavras, não símbolos), `%`, while, for/range, break/continue, laços aninhados, FizzBuzz. 2.1–2.10.

## Python 03 — Funções  (9 desafios) — ✅ 9/9
def/return, múltiplos parâmetros, função chamando função, parâmetro padrão, if/for no corpo, é-primo, escopo local/NameError (type-check global), `*args`+sum, calculadora por nome. 3.1–3.9.

## Python 04 — Listas e Strings  (14 desafios) — ✅ 14/14
Índice/negativo, for item, len/in/append, montar lista com append, **pegadinha do parâmetro padrão mutável** (historico=None), slicing `[:3]`/`[::-1]`, remove/sorted, indexação de string, palíndromo, split/join, lista numerada. 4.1–4.14.

## Python 05 — Estruturas de Dados  (11 desafios) — ✅ 11/11
Tuplas e desempacotamento, dict (`[chave]`/`.get`/`.items`), padrão contador, set (dedup, `&` interseção), list comprehension, dict de dict (agenda). 5.1–5.11.

## Python 06 — Saída e Formatação  (9 desafios) — ✅ 9/9
`sep=`, format spec `:.2f`, alinhamento `:<n`/`:>n`, repetição `"="*n`, laços de desenho, `" ".join`, matcher `contains`, recibo com colunas alinhadas (`:<10`/`:>6.2f`). 6.1–6.9.

## Python 07 — Alta Ordem e Estilo Funcional  (10 desafios) — ✅ 10/10
lambda, map, filter, `sorted(key=)`/`reverse=`, list/dict comprehension com `if`, `functools.reduce` (soma e máximo), boletim (média→filtro→ordenação). 7.1–7.10.

## Python 08 — Recursão de Verdade  (11 desafios) — ✅ 11/11
Recursão pura com **AST requireRecursion + forbidLoops** (Python) em todos: contagem, soma, fatorial, potência, dígitos, palíndromo, cabeça/cauda (maior, forbidCall max), inverter string, MDC de Euclides, busca binária, Hanói. R.1–R.11.

## Python 09 — Programação Orientada a Objetos  (7 desafios) — ✅ 7/7
class/`__init__`/`self`, métodos, `__str__`, lista de objetos, estado mutável, herança + sobrescrita, encapsulamento por convenção (`_saldo`), `__str__` com `:.2f`. P.1–P.7.

## Python 10 — Módulos e Algoritmos  (7 desafios) — ✅ 6/6 auto + 1 manual
`math` (sqrt, `approx`), `random` (seed reproduzível — bateu no Pyodide/CPython), `string`/`ord`/`chr` (cifra de César), busca linear, busca binária iterativa, bubble sort. **10.7 [projeto livre]** é `manual` → submeter mostrou **"📤 Enviado para revisão do professor"**. 10.1–10.7.

---

# ✅ CONCLUÍDO — todas as 24 trilhas testadas

| Idioma | Trilhas | Desafios | Status |
|---|---|---|---|
| JavaScript 01–14 | 14 | 140 | ✅ |
| JavaScript p5 | 1 | 8 auto + 1 manual | ✅ |
| Python 01–10 | 10 | 96 auto + 1 manual | ✅ |
| **Total** | **25** | **~246** | **✅ tudo passou** |

**Zero defeitos de conteúdo ou de runner** em toda a base (JS + Python).

Modos de teste validados de ponta a ponta:
- **function-call** (retorno: int/float/bool/str/list/dict/tuple)
- **type-check** (str/int/bool + variável global)
- **stdout** (multi-linha, f-string, alinhamento, espaços)
- **contains** (saída livre)
- **approx** (tolerância em float)
- **AST**: requireRecursion, forbidLoops, requireCall, forbidCall, requireMethod, forbidMethod (JS e Python)
- **manual** (revisão do professor: p5 P.9 e Python 10.7)

Recursos exercitados: controle de fluxo, funções (arrow/lambda, padrão, `*args`), coleções (list/dict/set/tuple, comprehensions), alta ordem (map/filter/reduce), recursão (com AST), erros (try/catch, guards), async/await + Promise, POO (herança, `#`/`_` privado), formatação, `math`/`random`/`functools`, e p5 visual.
