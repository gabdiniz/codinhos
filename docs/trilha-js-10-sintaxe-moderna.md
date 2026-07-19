# Trilha JS 10 — Sintaxe Moderna (ES6+)

Slug proposto `js-sintaxe-moderna`. `order: 100`. Pré-requisito: bloco base (10–60) —
`js-listas-e-strings` (arrays/spread), `js-numeros-e-objetos` (objetos/spread), `js-funcoes`
(template), `js-alta-ordem-e-funcional` (`.reduce`). Primeira trilha do **tier avançado**. Ver
`docs/pesquisa-trilhas-js.md`.

**Objetivo da trilha:** o aluno escreve JavaScript *moderno e limpo* — desestruturando arrays e
objetos, usando `...` como rest (juntar) e spread (espalhar), lidando com dados que podem faltar
(`?.` e `??`) e montando texto com template de várias linhas. É **notação**, não algoritmo novo:
deixa as trilhas seguintes (Map/Set, POO) mais legíveis.

**Pré-requisito de motor:** nenhum — sintaxe pura de ES6+, idêntica back≡front (testado, ver
`docs/pesquisa-trilhas-js.md` §3). Modo **function-call**, retorno JSON-serializável. **Nota
(G-JS2):** não há regra AST para "exija desestruturação"; a verificação é por resultado.

## Módulos

| # | Tipo | Título | Conceito novo | Revisão de | Teste |
|---|---|---|---|---|---|
| 1 | lição | Ponte: você já usa `...` e `${}` | recapitula spread e template; anuncia a "modernização" da escrita | trilha 03 (template), 04/05 (spread) | — |
| 2 | lição | Desestruturar arrays | `const [a, b] = lista` lê por posição | trilha 04 (`lista[i]`) | — |
| 3 | SM.1 | Troca de posição | `function troca([a, b]) { return [b, a] }` | 2 | function-call (array) |
| 4 | SM.2 | Cabeça e cauda | `const [primeiro, ...resto] = lista` (rest na desestruturação); retorna `[primeiro, resto]` | 3 | function-call (array) |
| 5 | lição | Desestruturar objetos — e o atalho para montar | `const {nome} = pessoa`; e o **atalho** `{nome, idade}` (shorthand) para montar objeto | trilha 05 (`obj.prop`) | — |
| 6 | SM.3 | Ficha resumida | `function ficha({nome, idade}) {...}` + template | 5, trilha 03 | function-call (string) |
| 7 | SM.4 | Campo com padrão | `const {cor = "azul"} = obj` | 6, trilha 03 (padrão) | function-call |
| 8 | lição | Rest em parâmetros: `...args` | `function f(...nums)` junta os argumentos num array | trilha 06 (`.reduce`) | — |
| 9 | SM.5 | Somar quantos vierem | `function somaTudo(...nums) { return nums.reduce((a,b)=>a+b, 0) }` | 8 | function-call (número) |
| 10 | SM.6 | Média de quantos vierem | rest + `.length` + `.reduce` | 9 | function-call (número) |
| 11 | lição | Spread para espalhar e juntar | `[...a, ...b]`, `{...a, ...b}`, `f(...args)` | 04/05 (spread), 8 | — |
| 12 | SM.7 | Juntar duas listas | `[...a, ...b]` | 11 | function-call (array) |
| 13 | SM.8 | Mesclar dois cadastros | `{...base, ...novo}` (novo sobrescreve) | 11, trilha 05 (spread objeto) | function-call (objeto) |
| 14 | lição | Quando o dado pode faltar: `?.` e `??` | `p?.endereco?.cidade` não quebra; `?? "padrão"` cobre `null`/`undefined` | trilha 05 (`obj.prop`) | — |
| 15 | SM.9 | Cidade com segurança | `p?.endereco?.cidade ?? "desconhecida"` | 14 | function-call (string) |
| 16 | SM.10 | [Fecha a trilha] Cartão de visita | desestruturação no parâmetro + `??` + **template multilinha** | 6, 15 | function-call (string) |

**Vocabulário acumulado ao final:** + desestruturação de array (`[a, b]`, `[x, ...resto]`) e de
objeto (`{nome}`, `{cor = padrão}`), atalho de objeto (shorthand), rest em parâmetros (`...args`),
spread para juntar/argumentos, `?.`, `??`, template multilinha.

**Nota de auditoria:** o atalho de objeto (shorthand) é introduzido na lição 5, antes de qualquer
retorno que o use; as trilhas seguintes (Map/Set, erros) já contam com ele. Todas as 10 soluções
de referência foram validadas back≡front. SM.4 devolve array; SM.7 array; SM.8 objeto;
SM.3/SM.9/SM.10 string; SM.5/SM.6 número — todos JSON.
