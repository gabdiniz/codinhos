# Trilha JS 9 — Algoritmos Clássicos

Slug proposto `js-algoritmos`. `order: 90`. Pré-requisito: todo o bloco base (10–60) —
especialmente `js-alta-ordem-e-funcional`, `js-numeros-e-objetos` e `js-listas-e-strings`. Ver
`docs/pesquisa-trilhas-js.md`. Fecha o "básico bem-feito": aplica tudo em problemas clássicos.

**Objetivo da trilha:** o aluno junta as ferramentas (laços, objetos, HOF, strings) para resolver
os algoritmos que aparecem em toda introdução à programação — contagem, frequência, padrões de
texto, códigos de caractere e conversões.

**Pré-requisito de motor:** nenhum. Modo **function-call** (alguns podem virar stdout na autoria).
Introduz `RegExp.test` e `charCodeAt`/`String.fromCharCode` — ambos sustentados (intrínsecos, back≡
front). Retornos JSON-serializáveis.

## Módulos

| # | Tipo | Título | Conceito novo | Revisão de | Teste |
|---|---|---|---|---|---|
| 1 | lição | O que é um algoritmo | juntar as ferramentas para um objetivo; pensar em casos de borda | — | — |
| 2 | AL.1 | FizzBuzz | `for` + `%` + `if`, construindo lista | DR, LT (`push`) | function-call (array) |
| 3 | lição | Objeto como contador | acumular contagem por chave num objeto | NO (objeto) | — |
| 4 | AL.2 | Frequência | objeto-contador percorrendo a lista | 3 | function-call (objeto) |
| 5 | AL.3 | Moda | frequência + achar a chave de maior valor | 4 | function-call |
| 6 | lição | Trabalhando com sublistas | lista de listas; `map` + `Math.max` | AO (`map`), NO (`Math.max`) | — |
| 7 | AL.4 | Maior de cada sublista | `.map(sub => Math.max(...sub))` | 6 | function-call (array) |
| 8 | AL.5 | Agrupar por paridade | objeto com duas listas + `.push` | 3, LT | function-call (objeto) |
| 9 | lição | Texto e padrões: regex | `/.../.test(texto)` verifica um padrão | LT (string) | — |
| 10 | AL.6 | Validar telefone | `RegExp.test` | 9 | function-call (boolean) |
| 11 | AL.7 | São anagramas? | `.split("").sort().join("")` dos dois e comparar | LT, AO (`sort`) | function-call (boolean) |
| 12 | lição | Códigos de caractere | `.charCodeAt(i)` e `String.fromCharCode(n)` | LT (string) | — |
| 13 | AL.8 | Cifra de César | desloca cada letra com `charCodeAt`/`fromCharCode` + `%` | 12 | function-call (string) |
| 14 | AL.9 | Mediana | `sort` (cópia) + elemento(s) do meio | AO (`sort`) | function-call |
| 15 | AL.10 | [Fecha a trilha] Inteiro para romano | array de pares valor→símbolo + `while` | DR (`while`), LT | function-call (string) |

**Vocabulário acumulado ao final:** + objeto-contador, lista de listas, `RegExp.test`,
`.charCodeAt`, `String.fromCharCode`, mediana, e a prática de combinar várias ferramentas.

**Nota de auditoria:** `regex.test` e `charCodeAt`/`fromCharCode` ganham lição antes do desafio que
os usa. Tudo o mais (objeto, `push`, `map`, `sort`, `Math.max`, `split/join`) vem das trilhas
40–60. Retornos: array, objeto, string, boolean — JSON-serializáveis.
