# Trilha JS 1 — Primeiros Passos

Slug proposto `js-primeiros-passos`. `order: 10`. **Porta de entrada do currículo** — sem
pré-requisito. Ver o mapa completo em `docs/pesquisa-trilhas-js.md`.

**Objetivo da trilha:** o aluno guarda informação em **variáveis**, entende os **tipos** básicos
(`string`, `number`, `boolean`), escreve sua primeira **função** com `return`, faz **contas** e
**comparações**, e vê o resultado na tela com `console.log`. É a fundação de tudo.

**Pré-requisito de motor:** nenhum. Usa três modos: **type-check** (`input: null`, checa
`typeof <var>`), **function-call** e **stdout** (`console.log`). Todos retornam/imprimem valor
JSON-serializável.

## Módulos

| # | Tipo | Título | Conceito novo | Revisão de | Teste |
|---|---|---|---|---|---|
| 1 | lição | Valores e variáveis | `let` (muda) e `const` (fixo); tipos `string`, `number`, `boolean` | — | — |
| 2 | PP.1 | Declare seu nome | criar variável `string` | 1 | type-check (`string`) |
| 3 | PP.2 | Idade e status | `number` sem aspas, `boolean` (`true`/`false`) | 2 | type-check (`number`, `boolean`) |
| 4 | lição | Funções e `return` | `function nome(param) { return ... }` devolve um valor | 1 | — |
| 5 | PP.3 | Apresente-se | função que retorna um texto fixo | 4 | function-call (string) |
| 6 | PP.4 | O dobro | função com **parâmetro** + `*` | 5 | function-call (número) |
| 7 | lição | Mostrando na tela: `console.log` | imprimir é diferente de `return`; `console.log(valor)` | 4 | — |
| 8 | PP.5 | Olá na tela | `console.log("Olá, mundo!")` | 7 | stdout exato |
| 9 | lição | Operadores aritméticos | `+ - * /` e `%` (resto); parênteses e precedência | 6 | — |
| 10 | PP.6 | Soma | `a + b` num `return` | 9 | function-call (número) |
| 11 | PP.7 | É par? | `%` + `===` devolvendo boolean | 10 | function-call (boolean) |
| 12 | PP.8 | Média de três | somar e dividir com parênteses | 9, 10 | function-call (número) |
| 13 | lição | Comparação e lógica | `=== !== > < >= <=`; `&&` (E), `\|\|` (OU), `!` (não); `typeof` | 9 | — |
| 14 | PP.9 | Maior de idade | `>=` devolvendo boolean | 13 | function-call (boolean) |
| 15 | PP.10 | Está na faixa? | `&&` combinando duas comparações | 14 | function-call (boolean) |
| 16 | PP.11 | [Fecha a trilha] Ficha na tela | junta variáveis de tipos diferentes num `console.log` (com vírgulas) | 3, 8, 12 | stdout exato |

**Vocabulário acumulado ao final:** `let`, `const`, `string`, `number`, `boolean`, `function`,
`return`, parâmetro, `console.log`, `+ - * / %`, precedência/parênteses, `=== !== > < >= <=`,
`&& \|\| !`, `typeof`.

**Nota de auditoria:** função e `return` são introduzidos na lição 4, **antes** de qualquer
desafio function-call. `console.log` na lição 7, antes do primeiro stdout. Nenhum desafio usa
array, objeto, `if` ou laço (só aparecem nas trilhas seguintes). Retornos: string, número,
boolean; saídas stdout são texto simples.
