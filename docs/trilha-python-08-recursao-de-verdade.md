# Trilha 8 — Python: Recursão de Verdade

Slug proposto `python-recursao-de-verdade`. `order: 8`. Pré-requisito: trilhas 1-5 (função,
`if`, lista/string indexação — trilhas 6-7 não são pré-requisito de conteúdo direto, mas 7
(estilo funcional) é citada dentro desta trilha como contraste). Espírito idêntico à
`js-recursao-de-verdade` já semeada e verificada em JS (`[[conteudo-modos-novos-kickoff]]`,
`docs/plano-trilhas-modos-novos.md`) — mesma pedagogia (metáfora + rastro de execução antes de
código, depois provar com regra estrutural que proíbe loop), adaptada à sintaxe Python.

**Objetivo da trilha:** o aluno sai entendendo recursão de verdade — não só "resolver com
`return f(...)` dentro de `f`", mas **provar** que resolveu sem recorrer a `for`/`while`.

**Pré-requisito de motor — resolvido.** A verificação estrutural ("exige recursão", "proíbe
loop") dependia de G5 (`docs/pesquisa-trilhas-python.md` §4), via módulo `ast` **nativo** do
Python (mais robusto que a heurística de texto do motor JS). G5 foi implementado em 12/07/2026
(`docs/motor-python-capacidades.md` §1.2) e, na validação end-to-end de 16/07/2026 (mesmo doc,
§1.7), um gap de wiring foi encontrado e corrigido (o dispatch de testes nunca chamava a checagem
de AST de verdade) e `seed-trilha-python-08.ts` foi atualizado: os 11 desafios de recursão desta
tabela ganharam `astRule` (`requireRecursion` + `forbidLoops`, mais `forbidCall('max')` no R.7).
Confirmado num teste manual real: solução iterativa (`for`/`while`) reprova, solução recursiva de
verdade passa.

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

**Nota de verificação:** a auditoria completa (solução de referência recursiva vs. solução
"errada de propósito" com `for`/`while`, contra a regra estrutural de cada um dos 11 desafios com
regra — mesma técnica documentada para `js-recursao-de-verdade`) ainda não rodou desafio a
desafio; o que foi confirmado na validação de 16/07/2026 foi o caminho de ponta a ponta (regra
rejeita/aceita corretamente) em pelo menos um desafio real via navegador. Rodar a auditoria
completa nos 11 continua como item de qualidade, não bloqueio — o motor já suporta e um caso já
foi confirmado funcionando de verdade.

**Vocabulário acumulado ao final:** + recursão, caso base, caso recursivo, pilha de chamadas,
`RecursionError`.
