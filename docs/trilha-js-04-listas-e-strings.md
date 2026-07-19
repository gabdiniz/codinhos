# Trilha JS 4 — Listas e Textos

Slug proposto `js-listas-e-strings`. `order: 40`. Pré-requisito: `js-funcoes` e
`js-decisoes-e-repeticoes` (laços). Ver `docs/pesquisa-trilhas-js.md`.

**Objetivo da trilha:** o aluno guarda **vários valores** numa **lista** (array), acessa por
índice, usa os métodos essenciais, entende a diferença crucial entre **alterar** e **copiar**, e
percorre/constrói listas com laço. Depois aplica o mesmo raciocínio a **textos** (strings), que
também têm índice e métodos.

**Pré-requisito de motor:** nenhum. Modo **function-call**. Retornos são arrays, strings, números
ou boolean — todos JSON-serializáveis.

## Módulos

| # | Tipo | Título | Conceito novo | Revisão de | Teste |
|---|---|---|---|---|---|
| 1 | lição | Listas: criar e acessar | `[10, 20, 30]`, índice `lista[i]` (começa em 0), `.length` | — | — |
| 2 | LT.1 | Primeiro | `lista[0]` | 1 | function-call |
| 3 | LT.2 | Último | `lista[lista.length - 1]` | 1 | function-call |
| 4 | lição | Buscar e fatiar | `.includes()`, `.indexOf()`, `.slice()`, `.join()` | 1 | — |
| 5 | LT.3 | Contém valor | `.includes(valor)` | 4 | function-call (boolean) |
| 6 | LT.4 | Sem o primeiro | `.slice(1)` (nova lista) | 4 | function-call (array) |
| 7 | LT.5 | Juntar com vírgula | `.join(", ")` | 4 | function-call (string) |
| 8 | lição | Alterar vs. copiar | `.push()`/`.reverse()` **alteram**; `.slice()`/spread `[...l]` **copiam** | DR (laços), 4 | — |
| 9 | LT.6 | Adicionar sem mutar | `[...lista, valor]` | 8 | function-call (array) |
| 10 | LT.7 | Inverter copiando | `[...lista].reverse()` | 8 | function-call (array) |
| 11 | lição | Percorrer e construir com laço | `for...of` sobre array; `.push()` dentro do laço | DR (`for...of`), 8 | — |
| 12 | LT.8 | Somar a lista | `for...of` + acumulador | 11 | function-call (número) |
| 13 | LT.9 | Maior da lista | `for...of` guardando o maior | 11 | function-call (número) |
| 14 | lição | Textos (strings) | `.toUpperCase/LowerCase`, `.charAt`/`[i]`, `.slice`, `.split`, `.join`, `.replace`, `.includes` | PP (string) | — |
| 15 | LT.10 | Gritar | `.toUpperCase()` | 14 | function-call (string) |
| 16 | LT.11 | Inverter texto | `.split("")` → `.reverse()` → `.join("")` | 14, 10 | function-call (string) |
| 17 | LT.12 | [Fecha a trilha] Sigla | `.split(" ")` + laço + `.charAt(0)` + `.join("")` | 16, 11 | function-call (string) |

**Vocabulário acumulado ao final:** + array `[i]`, `.length`, `.includes`, `.indexOf`, `.slice`,
`.join`, `.push`, `.reverse`, spread de array `[...l]`, mutação vs. cópia, `for...of` sobre lista;
strings: `.toUpperCase/LowerCase`, `.charAt`, `.split`, `.replace`.

**Nota de auditoria:** arrays são apresentados na lição 1, antes de qualquer desafio de lista;
métodos que mutam vs. copiam ganham lição própria (8) antes dos desafios "sem mutar". `for...of`
sobre array só entra na lição 11 (antes era só sobre string, na trilha 2). Métodos de string
reaproveitam `split`/`reverse`/`join` já vistos em array. Nada de HOF (`map`/`filter`) ainda — é a
trilha 60.
