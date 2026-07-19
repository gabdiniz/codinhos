# Trilha JS 11 — Coleções: Map e Set

Slug proposto `js-colecoes-map-set`. `order: 110`. Pré-requisito: `js-numeros-e-objetos`
(objetos), `js-alta-ordem-e-funcional` (`.filter`), `js-listas-e-strings` e `js-sintaxe-moderna`
(desestruturação de `[chave, valor]`, spread). Ver `docs/pesquisa-trilhas-js.md`.

**Objetivo da trilha:** o aluno descobre as duas estruturas que o objeto-dicionário e o array não
resolvem bem: **`Set`** (coleção sem repetição, pertencimento direto) e **`Map`** (dicionário de
verdade, com `.size`, ordem de inserção e chave de qualquer tipo). Sai sabendo escolher entre
objeto, `Map` e `Set`.

**Pré-requisito de motor + restrição central (G-JS5):** `Map`/`Set` rodam idênticos back≡front
(testado). **Mas nunca podem ser o retorno comparado** (`expected` é JSON; `deepEqual` usa
`Object.keys`, que dá `[]` para `Map`). Todo desafio usa a estrutura *por dentro* e devolve
convertido — `[...set]`, `Object.fromEntries(map)` ou um valor extraído. Modo **function-call**;
alguns ganham caso extra `mode:'ast'` com `requireCall('Map')`/`requireCall('Set')` (o motor
detecta `new Map(`/`new Set(`, verificado).

## Módulos

| # | Tipo | Título | Conceito novo | Revisão de | Teste |
|---|---|---|---|---|---|
| 1 | lição | Onde objeto e array não bastam | objeto só aceita chave texto e não tem `.size`; achar "tem?" num array é verboso | trilha 05, 04 (`.includes`) | — |
| 2 | lição | `Set`: coleção sem repetição | `new Set()`, `.add`, `.has`, `.size`; `new Set(lista)` deduplica | 04 (`.includes`) | — |
| 3 | MS.1 | Remover duplicados | `[...new Set(lista)]` | 2, trilha 10 (spread) | function-call (array) + ast `requireCall('Set')` |
| 4 | MS.2 | Quantos distintos | `new Set(lista).size` | 3 | function-call (número) |
| 5 | MS.3 | Tem algum repetido? | compara `lista.length` com `new Set(lista).size` | 4, 04 (`.length`) | function-call (boolean) |
| 6 | lição | `Set` para pertencimento rápido | `set.has(x)` responde "está na coleção?" | PP (`===`), 2 | — |
| 7 | MS.4 | Manter só os permitidos | `const ok = new Set(permitidos); lista.filter(x => ok.has(x))` | 6, trilha 06 (`.filter`) | function-call (array) |
| 8 | lição | `Map`: o dicionário de verdade | `new Map()`, `.set/.get/.has/.size`; devolver com `Object.fromEntries(map)` | trilha 05 (objeto) | — |
| 9 | MS.5 | Contador de frequência | `for...of` + `m.set(x, (m.get(x) ?? 0) + 1)`, retorna `Object.fromEntries` | 8, 04 (`for...of`), AL.2 (frequência com objeto) | function-call (objeto) + ast `requireCall('Map')` |
| 10 | MS.6 | Somar estoque por produto | lista de `{produto, qtd}` → acumula em `Map` → objeto | 9, trilha 10 (desestruturação) | function-call (objeto) |
| 11 | lição | Percorrer um `Map` | `for (const [chave, valor] of map)`; `new Map(Object.entries(obj))` | trilha 10 (desestrut. de array), 04 | — |
| 12 | MS.7 | Chave de maior valor | objeto → `Map`, percorre com `[k, v]`, guarda a chave do maior | 11, 9 | function-call (string) |
| 13 | MS.8 | Inverter dicionário | entries → `Map` novo (valor→chave) → `Object.fromEntries` | 9, 11, NO.11 (inverter com objeto) | function-call (objeto) |
| 14 | lição | Objeto, `Map` ou `Set`? | `Set` p/ unicidade, `Map` p/ contagem/ordem/chave não-texto, objeto p/ registro fixo | 2, 8 | — |
| 15 | MS.9 | [Fecha a trilha] Apuração de votos | `Set` de válidos filtra, `Map` conta, `[k,v]` acha o vencedor; retorna `{vencedor, apuracao}` | 3, 7, 9, 12 | function-call (objeto) |

**Vocabulário acumulado ao final:** + `Set` (`.add/.has/.size`, dedup), `Map` (`.set/.get/.has/.size`),
percorrer `Map` com `for...of [k, v]`, `Object.fromEntries`/`new Map(Object.entries(...))`,
`[...set]`, critério objeto/`Map`/`Set`.

**Nota de auditoria:** nenhum desafio retorna `Map`/`Set` — todos convertem antes. MS.5 e MS.8
reaproveitam de propósito os problemas de AL.2 e NO.11, agora com a estrutura certa (revisão, não
novidade). Soluções de referência validadas back≡front.
