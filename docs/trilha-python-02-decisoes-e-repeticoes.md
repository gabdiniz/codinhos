# Trilha 2 — Python: Decisões e Repetições

Slug proposto `python-decisoes-e-repeticoes`. `order: 2`. Pré-requisito:
`python-primeiros-passos` (trilha 1) — usa variável, tipo, operador aritmético/comparação e
`print`/f-string sem reensinar.

**Objetivo da trilha:** o aluno sai sabendo tomar decisão (`if/elif/else`) e repetir ações
(`while`, `for` com `range`), incluindo laços aninhados simples — base para tudo que envolve
"processar vários valores", que domina o resto do currículo.

**Pré-requisito de motor:** function-call, type-check e stdout — nada novo em relação à
trilha 1.

## Módulos

| # | Tipo | Título | Conceito novo | Revisão de | Teste |
|---|---|---|---|---|---|
| 1 | lição | Ponte: de calcular para decidir | recapitula variável/comparação da trilha 1; anuncia `if` | 1.7 | — |
| 2 | lição | `if` / `else` | bloco por indentação, `:` | — | — |
| 3 | 2.1 | Maior de idade? | `if/else` simples, retorna `bool`/string | 1.7 (comparação) | function-call |
| 4 | lição | `elif` e condições encadeadas | várias faixas de decisão | — | — |
| 5 | 2.2 | Classificar nota (A/B/C/D) | `if/elif/else` em cadeia | 2.1 | function-call |
| 6 | lição | Operadores lógicos: `and`, `or`, `not` | combinar condições | trilha 1 (lição de bool/comparação) | — |
| 7 | 2.3 | Pode entrar no parque? (idade e altura) | `and`/`or` combinados | 2.2, 1.4 | function-call |
| 8 | lição | Par ou ímpar com `%` | reaproveita o resto da divisão (1.6) numa decisão | 1.6 | — |
| 9 | 2.4 | Par ou ímpar | `%` + `if` | 1.6, 2.1 | function-call |
| 10 | lição | `while`: repetir enquanto for verdade | condição de parada, risco de loop infinito | — | — |
| 11 | 2.5 | Contagem regressiva com `while` | `while` + decremento | 1.9 (aritmética) | stdout exato |
| 12 | lição | `for` e `range()` | `for i in range(n)`, `range(inicio, fim, passo)` | — | — |
| 13 | 2.6 | Conte de 1 a 10 | `for` + `range` + `print` | 11 | stdout exato |
| 14 | 2.7 | Tabuada do 5 | `for` + `range` + f-string | 1.8, 2.6 | stdout exato |
| 15 | lição | `break` e `continue` | interromper/pular iteração | — | — |
| 16 | 2.8 | Pare no primeiro múltiplo de 7 | `for` + `if` + `break` | 2.4, 12 | stdout exato |
| 17 | lição | Laços aninhados: `for` dentro de `for` | por que preciso de 2 contadores para desenhar em 2D | 12 | — |
| 18 | 2.9 | Quadrado de asteriscos | `for` aninhado, `print("*", end="")` | 17 | stdout exato |
| 19 | 2.10 | [Fecha a trilha] FizzBuzz | `for` + `if/elif/else` + `%` combinados | 2.4, 2.6, 2.2 | stdout exato |

**Revisão espaçada dentro da trilha:** módulo 8-9 reabre `%` de 1.6; módulo 14 reabre a
f-string de 1.8; módulo 19 (FizzBuzz) é propositalmente uma síntese de quase tudo que a
trilha ensinou.

**Vocabulário acumulado ao final:** + `if`, `elif`, `else`, `and`, `or`, `not`, `while`, `for`,
`in`, `range()`, `break`, `continue`, `end=` (parâmetro nomeado de `print`).
