# Trilha JS 8 — Recursão de Verdade

Slug proposto `js-recursao`. `order: 80`. Pré-requisito: `js-funcoes` e `js-listas-e-strings`.
Ver `docs/pesquisa-trilhas-js.md`. (Absorve a antiga trilha de recursão, agora no caminho.)

**Objetivo da trilha:** o aluno entende recursão como **redução do problema** (não como um laço
disfarçado) — funções que chamam a si mesmas, com **caso base** e **passo recursivo** — e prova
que sabe resolver **sem `for`**. Fecha vendo que `map`/`filter`/`reduce` também são "sem for".

**Pré-requisito de motor:** nenhum. Além de **function-call** (compara o resultado), usa
**`mode:'ast'`** com `requireRecursion` + `forbidLoops` (e `forbidMethod` onde faz sentido) como
**caso extra** ao lado dos casos de resultado — para o aluno não "voltar ao `for` no automático".
Base de pesquisa: alunos constroem um "modelo de loop" da recursão; recomenda-se metáfora + rastro
de execução antes de cobrar, e depois exigir a estrutura.

## Módulos

| # | Tipo | Título | astRule / conceito | Revisão de | Teste |
|---|---|---|---|---|---|
| 1 | lição | Funções que chamam a si mesmas | metáfora (bonecas russas) + rastro passo a passo de `contagem(3)` | funcoes | — |
| 2 | RE.1 | Contagem regressiva | `requireRecursion` + `forbidLoops` | 1 | function-call + ast |
| 3 | RE.2 | Soma de 1 até N | `requireRecursion` + `forbidLoops` | 2 | function-call + ast |
| 4 | lição | Por que o caso base vem primeiro | evitar o `for` muda o jeito de pensar | 2 | — |
| 5 | RE.3 | Fatorial recursivo | `requireRecursion` + `forbidLoops` | 4 | function-call + ast |
| 6 | RE.4 | Potência recursiva | `requireRecursion` + `forbidLoops` | 5 | function-call + ast |
| 7 | RE.5 | Soma dos dígitos | `requireRecursion` + `forbidLoops` | 5, NO (dígitos) | function-call + ast |
| 8 | RE.6 | Palíndromo | `requireRecursion` + `forbidLoops` | LT (string) | function-call + ast |
| 9 | lição | Recursão sobre listas: cabeça e cauda | `lista[0]` + `lista.slice(1)` | LT (`slice`) | — |
| 10 | RE.7 | Maior da lista (sem loop, sem `Math.max`) | `requireRecursion` + `forbidLoops` + `forbidMethod(max)` | 9 | function-call + ast |
| 11 | RE.8 | Inverter string (sem `.reverse`, sem loop) | `requireRecursion` + `forbidLoops` + `forbidMethod(reverse)` | 9, LT | function-call + ast |
| 12 | RE.9 | MDC (algoritmo de Euclides) | `requireRecursion` + `forbidLoops` | 5 | function-call + ast |
| 13 | RE.10 | Busca binária recursiva | `requireRecursion` + `forbidLoops` | 9 | function-call + ast |
| 14 | lição | Métodos de array em vez de loop | `map`/`filter`/`reduce` também são "sem for" | AO (HOF) | — |
| 15 | RE.11 | Dobrar com `.map` (sem for) | `requireMethod(map)` + `forbidLoops` | 14 | function-call + ast |
| 16 | RE.12 | Filtrar com `.filter` (sem for) | `requireMethod(filter)` + `forbidLoops` | 14 | function-call + ast |
| 17 | RE.13 | [Fecha a trilha] Torres de Hanói | `requireRecursion` + `forbidLoops` | 5 | function-call + ast |

**Vocabulário acumulado ao final:** + recursão (caso base, passo recursivo), cabeça/cauda de
lista, verificação estrutural (`requireRecursion`/`forbidLoops`/`forbidMethod`/`requireMethod`),
busca binária, MDC, Hanói.

**Nota de auditoria:** o `astRule` sempre acompanha casos de resultado (function-call) — nunca é a
única verificação. A verificação (quando semear) deve rodar, por desafio, a solução recursiva
correta (passa tudo) **e** uma solução com `for`/`while` (deve reprovar pelo `astRule`), evitando
falso-positivo/negativo — mesma técnica já validada na versão anterior. HOF (map/filter) vem da
trilha 60.
