# Trilha JS 3 — Funções

Slug proposto `js-funcoes`. `order: 30`. Pré-requisito: `js-primeiros-passos` (função e `return`
básicos) e `js-decisoes-e-repeticoes`. Ver `docs/pesquisa-trilhas-js.md`.

**Objetivo da trilha:** o aluno **aprofunda** funções — monta texto com **template literal**, usa
**parâmetro padrão**, escreve **arrow functions**, combina funções (uma chama a outra) e entende
**escopo** (o que vive dentro da função não vaza para fora). Sai escrevendo código reutilizável e
organizado.

**Pré-requisito de motor:** nenhum. Modo **function-call**. Nos desafios com função auxiliar, o
desafio declara **`targetFn`** para o motor testar a função principal (não a primeira declarada) —
recurso já suportado (`resolveTargetFn`).

## Módulos

| # | Tipo | Título | Conceito novo | Revisão de | Teste |
|---|---|---|---|---|---|
| 1 | lição | Template literal | crases `` ` `` e `${}` para misturar texto e valores | PP (string) | — |
| 2 | FN.1 | Etiqueta | `` `Produto: ${nome}` `` | 1 | function-call (string) |
| 3 | FN.2 | Cartão | template com vários campos | 2 | function-call (string) |
| 4 | lição | Parâmetro padrão | `function f(x, y = 2)`: usa o padrão se nada for passado | PP (função) | — |
| 5 | FN.3 | Saudação com padrão | template + parâmetro padrão | 4, 2 | function-call (string) |
| 6 | lição | Arrow functions | `(x) => x + 1`, forma curta de função | PP (função) | — |
| 7 | FN.4 | Dobro como arrow | reescreve `dobro` como `const dobro = (n) => n * 2` | 6 | function-call (número) |
| 8 | FN.5 | Aplicar desconto | arrow + porcentagem `(v * pct) / 100` | 7, PP (operadores) | function-call (número) |
| 9 | lição | Funções que usam funções | uma função pode **chamar** outra (helper); código em blocos menores | PP (função) | — |
| 10 | FN.6 | Média com helper | uma função `soma(a,b)` usada por `media(a,b)` (`targetFn: media`) | 9 | function-call (número) |
| 11 | lição | Escopo | variável declarada dentro da função só existe lá dentro | 9 | — |
| 12 | FN.7 | Preço com imposto | helper calcula imposto; principal usa e devolve total (`targetFn`) | 11, 10 | function-call (número) |
| 13 | FN.8 | [Fecha a trilha] Cálculo de frete | parâmetro padrão + template + helper juntos | 5, 12 | function-call (string ou número) |

**Vocabulário acumulado ao final:** + template literal (`` `${}` ``), parâmetro padrão, arrow
function, função auxiliar (composição), escopo local.

**Nota de auditoria:** template literal (lição 1) vem antes do primeiro desafio que o usa; arrow
(lição 6) antes de FN.4; composição (lição 9) antes de FN.6. Desafios com helper usam `targetFn`
para o motor mirar a função certa. Nenhum uso de array/objeto/laço-sobre-lista. Retornos: string
e número.
