# Trilha JS 5 — Números e Objetos

Slug proposto `js-numeros-e-objetos`. `order: 50`. Pré-requisito: `js-listas-e-strings`. Ver
`docs/pesquisa-trilhas-js.md`.

**Objetivo da trilha:** o aluno domina a biblioteca **`Math`** e a conversão/precisão de
**números**, e aprende a estrutura de dados que guarda **campos com nome** — o **objeto**
(dicionário): criar, ler, checar chave, listar chaves/valores e atualizar sem mutar.

**Pré-requisito de motor:** nenhum (`Math`, `Number`, `Object` estão no `SAFE_GLOBALS`). Modo
**function-call**. Retornos: número, boolean, string, array e objeto simples — JSON-serializáveis.

## Módulos

| # | Tipo | Título | Conceito novo | Revisão de | Teste |
|---|---|---|---|---|---|
| 1 | lição | Números e `Math` | `Math.round/floor/ceil`, `Math.abs`, `Math.max/min`, `Math.sqrt` | PP (operadores) | — |
| 2 | NO.1 | Arredondar | `Math.round` | 1 | function-call |
| 3 | NO.2 | Valor absoluto | `Math.abs` | 1 | function-call |
| 4 | NO.3 | Maior entre dois | `Math.max` | 1 | function-call |
| 5 | lição | Precisão e conversão | `.toFixed(n)`, `Number()`, `String()` | 1 | — |
| 6 | NO.4 | Duas casas decimais | `Number(x.toFixed(2))` | 5 | function-call |
| 7 | NO.5 | Soma dos dígitos | `String(n).split("")` + laço + `Number()` | 5, LT (`split`) | function-call |
| 8 | lição | Objetos: campos com nome | `{ nome: "Ana", idade: 12 }`, acesso `.nome` e `obj[chave]` | LT (lista) | — |
| 9 | NO.6 | Criar pessoa | montar um objeto literal | 8 | function-call (objeto) |
| 10 | NO.7 | Pegar um campo | `obj.campo` / `obj[chave]` | 8 | function-call |
| 11 | lição | Chaves e valores | `in`, `Object.keys(obj)`, `Object.values(obj)` | 8 | — |
| 12 | NO.8 | Tem a chave? | operador `in` | 11 | function-call (boolean) |
| 13 | NO.9 | Somar valores | `for...of` sobre `Object.values(obj)` | 11, LT (`for...of`) | function-call (número) |
| 14 | lição | Atualizar sem mutar | `{ ...obj, campo: novo }` cria cópia com um campo trocado | 8, LT (spread) | — |
| 15 | NO.10 | Atualizar idade | spread de objeto | 14 | function-call (objeto) |
| 16 | NO.11 | [Fecha a trilha] Inverter chave e valor | `Object.keys` + laço construindo objeto novo | 13, 14 | function-call (objeto) |

**Vocabulário acumulado ao final:** + `Math.round/floor/ceil/abs/max/min/sqrt`, `.toFixed`,
`Number()`, `String()`, objeto literal, `obj.prop`/`obj[chave]`, `in`, `Object.keys`,
`Object.values`, spread de objeto `{...obj}`.

**Nota de auditoria:** `Math` e conversão vêm em lição antes dos desafios; objetos são
introduzidos na lição 8 antes de qualquer desafio de objeto. NO.9 usa `for...of` (trilha 4), não
`reduce` (que só chega na trilha 60). Spread de objeto reaproveita o spread de array da trilha 4.
Retornos de objeto são JSON-serializáveis.
