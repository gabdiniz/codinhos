# Trilha JS 7 — Imprimindo e Formatando Saídas

Slug proposto `js-saida-e-formatacao`. `order: 70`. Pré-requisito: `js-funcoes` (template) e
`js-decisoes-e-repeticoes` (laços). Ver `docs/pesquisa-trilhas-js.md`. (Absorve o conteúdo da
antiga trilha de console, agora integrada ao caminho.)

**Objetivo da trilha:** o aluno aprende a **imprimir com capricho** — a experiência de
programação mais natural para a idade. Sai desenhando padrões com laços aninhados, alinhando
colunas com `padStart`/`padEnd` e montando "arte" em texto.

**Pré-requisito de motor:** nenhum. Modo dominante **stdout** (`mode:'stdout'`) — compara a saída
de `console.log` (normalizada: apara espaços à direita e linhas em branco nas pontas, **preserva
indentação à esquerda**). Um desafio usa o matcher **`contains`** (saída com mais de uma resposta
certa).

## Módulos

| # | Tipo | Título | Conceito novo | Revisão de | Teste |
|---|---|---|---|---|---|
| 1 | lição | `console.log` e template para saída | montar a linha com `` `${}` `` em vez de concatenar | PP (`console.log`), FN (template) | — |
| 2 | SF.1 | Cartão de apresentação | template + função com parâmetro | 1 | stdout exato |
| 3 | SF.2 | Linha decorativa | `"-".repeat(n)` | 1 | stdout exato |
| 4 | lição | Laços aninhados | `for` dentro de `for`: dois contadores para desenhar em 2D | DR (`for`) | — |
| 5 | SF.3 | Quadrado de asteriscos | `for` aninhado | 4 | stdout exato |
| 6 | SF.4 | Triângulo crescente | a linha `i` cresce | 5 | stdout exato |
| 7 | SF.5 | Pirâmide numérica | mesmo padrão, números no lugar de `*` | 6 | stdout exato |
| 8 | lição | Alinhando texto | `.padStart(n)` / `.padEnd(n)` para colunas | LT (string) | — |
| 9 | SF.6 | Tabela de nomes e idades | `padEnd` alinhando colunas | 8 | stdout exato |
| 10 | SF.7 | Calendário da semana | tabela + `for` | 9, 4 | stdout exato |
| 11 | lição | Quando a saída pode variar | matcher `contains`: nem todo exercício tem 1 resposta única | — | — |
| 12 | SF.8 | Relatório livre | matcher `contains` | 11 | stdout contém |
| 13 | SF.9 | Arte em ASCII (arvorezinha) | indentação à esquerda preservada, multi-linha | 7 | stdout exato |
| 14 | SF.10 | [Fecha a trilha] Painel de placar | função + `padEnd` + laço + comparação (maior valor) | 9, 5 | stdout exato |

**Vocabulário acumulado ao final:** + `console.log` para desenho, `.repeat(n)`, `for` aninhado,
`.padStart`/`.padEnd`, matcher `contains`, arte ASCII multi-linha.

**Nota de auditoria:** `repeat`/`padStart`/`padEnd` são introduzidos em lição antes do uso. As
saídas esperadas devem ser geradas pelo runner real (exatas, char a char, incluindo espaçamento) —
mesmo cuidado adotado na versão anterior desta trilha. Nada de array/objeto complexo; foco em
saída.
