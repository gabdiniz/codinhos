# Trilha 1 — Python: Primeiros Passos

Slug proposto `python-primeiros-passos`. `language: 'python'`, `order: 1`. Primeira trilha da
sequência Python — sem pré-requisito de conteúdo (pressupõe só que o aluno já tem conta e sabe
navegar a plataforma; pode ser o primeiro contato do aluno com programação, ou vir depois da
trilha de JS — o desenho não assume JS prévio). Ver mapa geral em
`docs/pesquisa-trilhas-python.md` §5-6.

**Objetivo da trilha:** o aluno sai sabendo guardar valores em variáveis, reconhecer os tipos
primitivos, fazer contas e comparações, e mostrar resultado na tela com `print`/f-string. É a
base literal de tudo que vem depois.

**Pré-requisito de motor:** function-call e type-check (idênticos ao motor JS atual) e stdout
para os desafios de `print`. Nenhum recurso além do que o motor JS já prova ser possível — ver
G1 em `docs/pesquisa-trilhas-python.md` §4 (falta é só o runner de Python existir).

**Diferença de sintaxe a destacar logo de cara (não é detalhe menor):** Python usa
**indentação** para marcar blocos (sem `{ }`), não tem `;` obrigatório, e não tem `let`/`const`
— toda atribuição é `nome = valor`. Isso é dito explicitamente na Lição 1 para quem já viu
JS no Codinhos não estranhar.

## Módulos

| # | Tipo | Título | Conceito novo | Revisão de | Teste |
|---|---|---|---|---|---|
| 1 | lição | Python é diferente: sem chaves, com indentação | filosofia da linguagem, `#` comentário, `print()` | — | — |
| 2 | 1.1 | Sua primeira mensagem | `print("texto")` | — | stdout exato |
| 3 | lição | Variáveis: caixinhas com nome | `nome = valor`, sem `let`/`const`, convenção `snake_case` | — | — |
| 4 | 1.2 | Guarde seu nome | variável `str` | — | type-check (`type(nome) is str`) |
| 5 | 1.3 | Combine texto | concatenação com `+`, `print(a + b)` | 1.2 | stdout exato |
| 6 | lição | Números: `int` e `float` | tipo inteiro vs. decimal, `type()` | — | — |
| 7 | 1.4 | Sua idade | variável `int` | 1.2 | type-check |
| 8 | lição | Operadores aritméticos | `+ - * / // %` (destaque: `/` sempre dá `float`; `//` é divisão inteira; `%` é resto) | — | — |
| 9 | 1.5 | Dobro e metade | expressão aritmética simples | 1.4 | function-call |
| 10 | 1.6 | Resto da divisão | `%`, gancho para "par ou ímpar" (usado na trilha 2) | 1.5 | function-call |
| 11 | lição | `bool`, comparação e f-string | `True`/`False`, `== != > < >= <=`, `f"{variavel}"` | — | — |
| 12 | 1.7 | Maior que | comparação simples, retorna `bool` | 1.4 | function-call |
| 13 | 1.8 | Cartão de apresentação (f-string) | `f"Nome: {nome}, idade: {idade}"` | 1.2, 1.4 | stdout exato |
| 14 | 1.9 | [Fecha a trilha] Calculadora de retângulo | combina variável + aritmética + f-string + print | tudo acima | stdout exato |

**Nota de conteúdo (evita gap):** `input()` é **mencionado** na lição 2 ("existe uma forma de
pedir informação para quem está usando o programa, `input()` — aqui na plataforma cada desafio
já te dá os valores prontos para praticar, mas guarde o nome") e não aparece em nenhum
`starterCode`/solução de referência nem é cobrado em teste — ver gap G2 em
`docs/pesquisa-trilhas-python.md` §4. Isso evita o erro clássico de ensinar um recurso que o
motor não consegue avaliar.

**Vocabulário acumulado ao final da trilha:** `print`, `#`, `=`, `str`, `int`, `float`, `bool`,
`True`, `False`, `+ - * / // %`, `== != > < >= <=`, `type()`, f-string `f"...{}..."`.
