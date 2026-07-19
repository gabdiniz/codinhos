# Trilha JS 6 — Alta Ordem e Estilo Funcional

Slug proposto `js-alta-ordem-e-funcional`. `order: 60`. Pré-requisito: `js-listas-e-strings`
(arrays) e `js-funcoes` (arrow functions). Ver `docs/pesquisa-trilhas-js.md`.

**Objetivo da trilha:** o aluno descobre que uma **função pode ser passada como valor** e usa os
métodos de array que substituem o `for` explícito — `map`, `filter`, `reduce`, `find`, `some`,
`every`, `sort`. Sai escrevendo transformações de lista de forma **declarativa** (o "o quê" em vez
do "como").

**Pré-requisito de motor:** nenhum. Modo **function-call**. Retornos JSON-serializáveis (array,
número, boolean).

## Módulos

| # | Tipo | Título | Conceito novo | Revisão de | Teste |
|---|---|---|---|---|---|
| 1 | lição | Função como valor + `map` | passar uma arrow para `.map(fn)` transforma cada item | funcoes (arrow), LT (array) | — |
| 2 | AO.1 | Dobrar todos | `.map(x => x * 2)` | 1 | function-call (array) |
| 3 | AO.2 | Nomes em maiúsculo | `.map` + `.toUpperCase` | 1, LT | function-call (array) |
| 4 | lição | `filter`: manter só o que passa | `.filter(x => condição)` | PP (comparação) | — |
| 5 | AO.3 | Só os pares | `.filter(x => x % 2 === 0)` | 4 | function-call (array) |
| 6 | AO.4 | Quantos maiores que N | `.filter(...).length` | 4, LT (`.length`) | function-call (número) |
| 7 | lição | `reduce`: combinar tudo em um | acumulador declarativo `.reduce((acc, x) => ..., inicial)` | DR (acumulador) | — |
| 8 | AO.5 | Somar tudo | `.reduce((a, b) => a + b, 0)` | 7 | function-call (número) |
| 9 | AO.6 | Média da lista | `reduce` + `.length` | 8 | function-call (número) |
| 10 | lição | `find`, `some`, `every` | achar o primeiro; algum passa?; todos passam? | 4 | — |
| 11 | AO.7 | Achar o primeiro maior que N | `.find(x => x > n)` | 10 | function-call |
| 12 | AO.8 | Todos positivos? | `.every(x => x > 0)` | 10 | function-call (boolean) |
| 13 | AO.9 | Algum negativo? | `.some(x => x < 0)` | 10 | function-call (boolean) |
| 14 | lição | `sort` com comparador | `[...lista].sort((a, b) => a - b)` (copiar antes p/ não mutar) | LT (mutação/spread) | — |
| 15 | AO.10 | Ordenar crescente | `sort` + spread | 14 | function-call (array) |
| 16 | AO.11 | [Fecha a trilha] Boletim da turma | `filter` aprovados + `sort` por nota + `map` só os nomes | 15, 5, 3 | function-call (array) |

**Vocabulário acumulado ao final:** + função como valor, `.map`, `.filter`, `.reduce`, `.find`,
`.some`, `.every`, `.sort` com comparador.

**Nota de auditoria:** cada método ganha lição antes do desafio. `sort` reforça a regra de
mutação da trilha 4 (copiar com spread antes de ordenar). Todos os retornos são JSON. Nenhum uso
de `Map`/`Set`/`class` (tier avançado).
