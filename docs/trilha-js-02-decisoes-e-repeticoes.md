# Trilha JS 2 — Decisões e Repetições

Slug proposto `js-decisoes-e-repeticoes`. `order: 20`. Pré-requisito: `js-primeiros-passos`
(variáveis, funções, operadores, comparação e lógica). Ver `docs/pesquisa-trilhas-js.md`.

**Objetivo da trilha:** o programa passa a **tomar decisões** (`if`/`else if`/`else`, `switch`,
ternário) e a **repetir** tarefas (`for`, `while`, `for...of`) com **acumuladores**. É o salto de
"uma conta" para "um algoritmo".

**Pré-requisito de motor:** nenhum. Modo **function-call**. **Auditoria importante:** esta trilha
**não usa arrays** — laços trabalham com acumulador numérico e `for...of` **sobre strings** (que o
aluno já conhece como tipo). Construir/percorrer listas fica para a trilha 40, depois de arrays
serem ensinados.

## Módulos

| # | Tipo | Título | Conceito novo | Revisão de | Teste |
|---|---|---|---|---|---|
| 1 | lição | Decisões: `if`/`else if`/`else` | testa condições em ordem, do mais específico ao geral | PP (comparação) | — |
| 2 | DR.1 | Classificar nota | `if`/`else if` encadeados | 1 | function-call (string) |
| 3 | DR.2 | Sinal do número | 3 casos com `if`/`return` | 2 | function-call (string) |
| 4 | DR.3 | Maior de dois | comparar e devolver | 1, PP (`>`) | function-call (número) |
| 5 | lição | `switch` e ternário | `switch`/`case`/`default`; `cond ? a : b` | 1 | — |
| 6 | DR.4 | Nome do dia | `switch` com vários `case` | 5 | function-call (string) |
| 7 | DR.5 | Preço VIP | ternário devolvendo valor | 5 | function-call (número) |
| 8 | lição | Repetição: `for` e acumulador | contador (início, condição, passo); acumulador com `+=` | PP (operadores) | — |
| 9 | DR.6 | Somar até N | `for` + acumulador (começa em 0) | 8 | function-call (número) |
| 10 | DR.7 | Fatorial | acumulador de multiplicação (começa em 1, `*=`) | 8 | function-call (número) |
| 11 | DR.8 | Contar pares até N | `for` + `if` + `%` (conta condicional) | 9, PP (`%`) | function-call (número) |
| 12 | lição | `while` e `for...of` | `while` repete enquanto verdadeiro; `for...of` percorre cada caractere de uma string | 8 | — |
| 13 | DR.9 | Contar vogais | `for...of` sobre a string + `if`/`===` | 12 | function-call (número) |
| 14 | DR.10 | Potência na mão | laço multiplicando a base (sem `Math.pow`) | 10 | function-call (número) |
| 15 | DR.11 | [Fecha a trilha] Maior de três | combina `if` + `&&` para achar o maior | 4, PP (`&&`) | function-call (número) |

**Vocabulário acumulado ao final:** + `if`/`else if`/`else`, `switch`/`case`/`default`, ternário
`? :`, `for`, `while`, `for...of` (em string), acumulador (`+=`, `*=`), contador `++`.

**Nota de auditoria:** nenhum desafio usa array, objeto ou método de string ainda. `for...of` é
apresentado só sobre string (tipo já conhecido). Todos os retornos são número ou string. Laços que
constroem listas ficam para a trilha 40.
