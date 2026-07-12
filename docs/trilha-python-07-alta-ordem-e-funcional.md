# Trilha 7 — Python: Alta Ordem e Estilo Funcional

Slug proposto `python-alta-ordem-e-funcional`. `order: 7`. Pré-requisito: trilhas 1-5
(função, lista, dict, comprehension básica — trilha 6 não é pré-requisito de conteúdo, só está
antes na ordem por ser aplicação, ver mapa no doc mestre §6).

**Objetivo da trilha:** o aluno sai sabendo que uma função pode ser passada como valor
(`lambda`, `map`, `filter`, `sorted(key=...)`) e que comprehension é o jeito Python idiomático
de expressar boa parte disso — alternativa declarativa ao `for` explícito, mesmo espírito da
trilha `js-recursao-de-verdade` quando apresenta `map`/`filter`/`reduce` como alternativa ao
loop (ver `[[trilha-js-catalogo]]`).

**Pré-requisito de motor:** nenhum novo — `lambda`/`map`/`filter`/`sorted` são só função sendo
chamada e retorno sendo comparado, mesmo modelo de sempre. Único cuidado: `map`/`filter`
retornam um objeto iterador em Python (não uma lista pronta) — os desafios sempre pedem
`list(map(...))` explicitamente, para o `expected` bater com um array na comparação.

## Módulos

| # | Tipo | Título | Conceito novo | Revisão de | Teste |
|---|---|---|---|---|---|
| 1 | lição | Ponte: função dentro de função, função como valor | recapitula "chamar função dentro de função" (3.3); anuncia que dá pra passar função de argumento | 3.3 | — |
| 2 | lição | `lambda`: função de uma linha, sem nome | `lambda x: x * 2` equivale a um `def` de uma linha | 3.1 (`def`) | — |
| 3 | 7.1 | Reescreva como lambda | converte uma função `def` simples (dobro) em `lambda` | 1.9 | function-call |
| 4 | lição | `map()`: aplicar função a cada item | `list(map(lambda x: x*2, lista))` — mesma coisa que list comprehension (lição de trilha 5), jeito diferente | trilha 5 (lição comprehension) | — |
| 5 | 7.2 | Dobrar valores com `map` | `map` + `lambda`, comparado lado a lado com a versão comprehension já vista (5.10) | 5.10 | function-call |
| 6 | lição | `filter()`: manter só o que passa no teste | `list(filter(lambda x: x % 2 == 0, lista))` | 2.4 (par/ímpar) | — |
| 7 | 7.3 | Filtrar só os pares | `filter` + `lambda` | 6, 4.9 (mesma ideia com `for`+`if`+`append`) | function-call |
| 8 | lição | `sorted(chave=...)`: ordenar por um critério | `sorted(lista, key=lambda x: x[1])`, `reverse=True` | 4.10 (`.sort()`) | — |
| 9 | 7.4 | Ordenar por idade (lista de tuplas) | `sorted(key=...)` | 5.3 (tupla), 8 | function-call |
| 10 | 7.5 | Top 3 maiores valores | `sorted(reverse=True)` + slicing | 9, 4.13 (slicing) | function-call |
| 11 | lição | Comprehension com condição | `[x for x in lista if x % 2 == 0]` — reescreve o `filter` do módulo 7 | 7 | — |
| 12 | 7.6 | Filtrar (agora com comprehension) | comprehension + `if` | 11, 7 | function-call |
| 13 | lição | Dict comprehension | `{k: v*2 for k, v in dic.items()}` | 5.8 (`.items()`) | — |
| 14 | 7.7 | Dobrar todos os valores de um dicionário | dict comprehension | 13 | function-call |
| 15 | lição | `functools.reduce`: combinar tudo numa coisa só | `reduce(lambda acc, x: acc + x, lista)` — comparado com o acumulador manual (4.5) | 4.5 (soma com `for`) | — |
| 16 | 7.8 | Soma com `reduce` | `functools.reduce`, `import functools` | 15, 4.5 | function-call |
| 17 | 7.9 | Maior valor com `reduce` (sem `max()`) | `reduce` para achar máximo | 15 | function-call |
| 18 | lição | Qual estilo usar? | comprehension é preferido no dia a dia Python; `map`/`filter`/`reduce` existem e valem entender, mas não são "mais pythônico" — orientação de estilo, não regra técnica | — | — |
| 19 | 7.10 | [Fecha a trilha] Boletim da turma | recebe lista de dicts `{"nome":..., "notas":[...]}`, calcula média (via `reduce` ou comprehension, aluno escolhe), filtra aprovados, ordena por média | 14, 9, 17 | function-call |

**Vocabulário acumulado ao final:** + `lambda`, `map()`, `filter()`, `sorted(key=, reverse=)`,
comprehension com `if`, dict comprehension, `functools.reduce`, `import`.
