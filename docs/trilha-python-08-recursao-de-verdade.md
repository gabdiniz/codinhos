# Trilha 8 — Python: Recursão de Verdade

Slug proposto `python-recursao-de-verdade`. `order: 8`. Pré-requisito: trilhas 1-5 (função,
`if`, lista/string indexação — trilhas 6-7 não são pré-requisito de conteúdo direto, mas 7
(estilo funcional) é citada dentro desta trilha como contraste). Espírito idêntico à
`js-recursao-de-verdade` já semeada e verificada em JS (`[[conteudo-modos-novos-kickoff]]`,
`docs/plano-trilhas-modos-novos.md`) — mesma pedagogia (metáfora + rastro de execução antes de
código, depois provar com regra estrutural que proíbe loop), adaptada à sintaxe Python.

**Objetivo da trilha:** o aluno sai entendendo recursão de verdade — não só "resolver com
`return f(...)` dentro de `f`", mas **provar** que resolveu sem recorrer a `for`/`while`.

**Pré-requisito de motor — o mais dependente de gap desta rodada:** a verificação estrutural
("exige recursão", "proíbe loop") depende de G5 (`docs/pesquisa-trilhas-python.md` §4): motor
JS resolve isso com heurística de texto (`mode:'ast'`); para Python, o caminho correto é usar o
módulo `ast` **nativo** da própria linguagem (mais robusto que a heurística JS, mas é
implementação nova, só possível no lado que executa Python de verdade). **Até essa peça
existir, todo módulo desta trilha continua funcionando em `function-call` puro** — só sem a
garantia de que a solução do aluno não "trapaceou" com `for`/`while`. A tabela abaixo já marca
onde a regra estrutural entra assim que existir.

## Módulos

| # | Tipo | Título | Regra estrutural (quando existir) | Revisão de | Teste |
|---|---|---|---|---|---|
| 1 | lição | Recursão: uma função que chama a si mesma | — | 3.3 (função chama função) | — |
| 2 | lição | Rastro de execução: veja `contagem(3)` passo a passo | metáfora (bonecas russas) + desenho da pilha de chamadas | — | — |
| 3 | R.1 | Contagem regressiva — com recursão de verdade | `requireRecursion` + `forbidLoops` | 2.5 (era `while`) | function-call |
| 4 | lição | Caso base e caso recursivo | por que toda função recursiva precisa de uma condição de parada; sem isso, `RecursionError` | — | — |
| 5 | R.2 | Soma de 1 até N | `requireRecursion` + `forbidLoops` | 4.5 (era `for`+acumulador) | function-call |
| 6 | R.3 | Fatorial | `requireRecursion` + `forbidLoops` | 3.5 (função com `for`, mesma família de problema) | function-call |
| 7 | R.4 | Potência (base elevado a expoente) | `requireRecursion` + `forbidLoops` | 1.9 (aritmética) | function-call |
| 8 | R.5 | Soma dos dígitos de um número | `requireRecursion` + `forbidLoops` | 2.9 (`%` e `//`) | function-call |
| 9 | R.6 | Palíndromo — agora com recursão de verdade | `requireRecursion` + `forbidLoops` + `forbidMethod` de slice reverso | 4.12 (era slicing `[::-1]`) | function-call |
| 10 | lição | Recursão sobre listas: cabeça e cauda | `lista[0]` (cabeça) + `lista[1:]` (cauda) como o "resto do problema" | 4.2, trilha 4 (lição de slicing) | — |
| 11 | R.7 | Maior valor de uma lista (sem `max()`, sem loop) | `requireRecursion` + `forbidLoops` + `forbidMethod(max)` | 4.5 | function-call |
| 12 | R.8 | Inverter uma string (sem `[::-1]`, sem loop) | `requireRecursion` + `forbidLoops` | 4.8 | function-call |
| 13 | R.9 | MDC de dois números (algoritmo de Euclides) | `requireRecursion` + `forbidLoops` | 2.9 (`%`) | function-call |
| 14 | R.10 | Busca binária (recursiva) | `requireRecursion` + `forbidLoops` | 4.10 (lista ordenada) | function-call |
| 15 | lição | Quando recursão custa caro | limite de profundidade de chamada, `RecursionError`, por que nem todo problema deve ser recursivo (contraste com o estilo funcional/comprehension da trilha 7 para o mesmo tipo de problema) | 7 (trilha inteira) | — |
| 16 | R.11 | [Bônus] Torres de Hanói | `requireRecursion` + `forbidLoops` | — (problema genuinamente novo) | function-call |

**Nota de verificação futura:** quando G5 existir, a auditoria roda a solução de referência
(recursiva) e uma solução "errada de propósito" (com `for`/`while`) contra a regra estrutural
de cada um dos 12 desafios com regra — mesma técnica usada e documentada para
`js-recursao-de-verdade` (0 falso-positivo/negativo lá). Até lá, a trilha já é publicável e
funcional só com `function-call` — a regra estrutural é um reforço de rigor pedagógico, não um
bloqueio de conteúdo.

**Vocabulário acumulado ao final:** + recursão, caso base, caso recursivo, pilha de chamadas,
`RecursionError`.
