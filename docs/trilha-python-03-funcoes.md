# Trilha 3 — Python: Funções

Slug proposto `python-funcoes`. `order: 3`. Pré-requisito: trilhas 1-2 (variável, tipo,
operador, `if`, `while`/`for`).

**Objetivo da trilha:** o aluno sai sabendo criar suas próprias funções com `def`, parâmetros
(incluindo valor padrão), `return`, e entende escopo local vs. global o suficiente para não se
confundir. Essa trilha é pré-requisito direto de quase tudo depois (listas/strings usam função
para encapsular lógica; recursão é função chamando a si mesma; POO é método = função dentro de
classe).

**Pré-requisito de motor:** function-call continua sendo o modo natural (a função é
literalmente o alvo testado agora, não só um acessório). `targetFn` (nome da função avaliada)
passa a ser sempre preenchido a partir desta trilha.

## Módulos

| # | Tipo | Título | Conceito novo | Revisão de | Teste |
|---|---|---|---|---|---|
| 1 | lição | Ponte: de escrever código solto para empacotar em função | recapitula que os desafios de 1-2 já usavam função por baixo (`targetFn`); agora o aluno escreve o `def` | 2.10 | — |
| 2 | lição | `def` e `return` | anatomia de uma função Python (`def nome(parametros):`, corpo indentado, `return`) | — | — |
| 3 | 3.1 | Dobrar um número | função com 1 parâmetro, `return` | 1.9 | function-call |
| 4 | lição | Vários parâmetros | `def soma(a, b):` | — | — |
| 5 | 3.2 | Soma de dois números | 2 parâmetros | 3 | function-call |
| 6 | lição | Chamar função dentro de função | reaproveitar lógica já pronta | — | — |
| 7 | 3.3 | Área e perímetro de um retângulo | 2 funções, uma chama conceito da outra | 5 | function-call |
| 8 | lição | Parâmetro com valor padrão | `def saudacao(nome, saudacao="Olá"):` — só com tipos imutáveis (`str`/`int`) por enquanto | — | — |
| 9 | 3.4 | Saudação personalizável | parâmetro padrão | 3 | function-call |
| 10 | lição | Função + decisão, função + repetição | função pode ter `if`/`for` dentro, igual qualquer bloco | 2.2, 2.6 | — |
| 11 | 3.5 | É primo? | função com `for` + `if` interno | 2.6, 2.4 | function-call |
| 12 | 3.6 | Contar múltiplos de 3 até N | função com `for` + `if` + acumulador numérico (variação do padrão de 3.5, sem precisar de string ou lista) | 2.9, 11 | function-call |
| 13 | lição | Escopo: variável de dentro não existe fora | local vs. global, por que não dá pra acessar variável de dentro da função de fora dela | — | — |
| 14 | 3.7 | [Pegadinha guiada] Por que isso não funciona? | lição-desafio de leitura de erro (`NameError`) — não editar lógica, só entender escopo | 13 | type-check dentro da função corrigida |
| 15 | lição | `*args`: função com quantidade variável de argumentos | quando não sabemos quantos parâmetros vêm | — | — |
| 16 | 3.8 | Soma de quantos números vierem | `*args` + `for`/`sum()` | 5, 2.6 | function-call |
| 17 | 3.9 | [Fecha a trilha] Calculadora com operação por nome | função recebe operação (`"soma"`/`"subtrai"`) e decide o que fazer — combina parâmetro padrão + `if/elif` + funções auxiliares | 9, 5, 2.2 | function-call |

**Nota de conteúdo (evita gap futuro):** a pegadinha clássica de **argumento padrão mutável**
(`def f(lista=[])`) **não entra aqui** — depende de saber lista e `.append()`, que só vêm na
trilha 4. Fica agendada como lição de revisão dentro da trilha 4 (ver aquele documento, módulo
dedicado "Função + lista: a pegadinha do parâmetro padrão"), no ponto exato em que o aluno tem
os dois conceitos para entender o problema de verdade — ensinar a pegadinha antes disso seria
ensinar algo sem o pré-requisito para compreendê-lo.

**Vocabulário acumulado ao final:** + `def`, `return`, parâmetro, parâmetro padrão, `*args`,
escopo local/global, `NameError` (leitura de erro).
