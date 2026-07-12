# Trilha 6 — Python: Saída e Formatação

Slug proposto `python-saida-e-formatacao`. `order: 6`. Pré-requisito: trilhas 1-5 (inclusive
dict/lista — os desafios de tabela combinam com dados de trilha 5). Trilha "de aplicação":
não introduz pré-requisito para as trilhas seguintes, mas é usada dentro da trilha 9 (POO,
onde `print` formatado é o único jeito de observar estado de objeto — ver gap G7 do doc
mestre). Análoga em espírito à `js-saida-e-formatacao` já semeada em JS
(`[[conteudo-modos-novos-kickoff]]`), adaptada à sintaxe Python.

**Objetivo da trilha:** o aluno sai sabendo formatar saída de forma profissional — alinhar
colunas, controlar casas decimais, montar tabelas e "arte" em texto — tudo via `mode:'stdout'`.

**Pré-requisito de motor:** `mode: 'stdout'` (comparação de saída de `print`, ver §3 do doc
mestre). Único uso extra a registrar: matcher `contains` para o desafio de "relatório livre"
(módulo 12), igual ao padrão já usado em `js-saida-e-formatacao`.

## Módulos

| # | Tipo | Título | Conceito novo | Revisão de | Teste |
|---|---|---|---|---|---|
| 1 | lição | Ponte: você já sabe imprimir, agora vamos caprichar | recapitula f-string (1.8) e `print` com `end=` (2.9) | 1.8, 2.9 | — |
| 2 | 6.1 | `sep` no `print` | `print(a, b, sep=", ")` | — | stdout exato |
| 3 | lição | Casas decimais com format spec | `f"{valor:.2f}"` | — | — |
| 4 | 6.2 | Preço com duas casas | `:.2f` | 1.9 | stdout exato |
| 5 | lição | Alinhamento: `:<`, `:>`, `:^` | largura fixa, alinhar à esquerda/direita/centro — equivalente Python ao `padStart`/`padEnd` de JS | — | — |
| 6 | 6.3 | Coluna de números alinhada à direita | `:>5` | 5 | stdout exato |
| 7 | 6.4 | Tabela de nomes e idades | `:<10` combinando string + número numa linha, `for` sobre lista de tuplas | 5.4 (desempacotar), 2.7 (for+f-string) | stdout exato |
| 8 | lição | Repetição de caractere e laços aninhados aplicados a desenho | `"-" * n`, revisão do quadrado de asteriscos (2.9) | 2.9 | — |
| 9 | 6.5 | Linha decorativa | `"=" * n` | 8 | stdout exato |
| 10 | 6.6 | Triângulo crescente | `for` aninhado, linha `i` cresce | 2.9, 8 | stdout exato |
| 11 | 6.7 | Pirâmide numérica | reaproveita padrão de 10, números em vez de `*` | 10 | stdout exato |
| 12 | lição | Quando a saída pode variar (matcher `contains`) | nem todo exercício tem 1 resposta única | — | — |
| 13 | 6.8 | Relatório de vendas (livre) | monta relatório a partir de um dict; matcher `contains` (aceita formatação própria, desde que os números certos apareçam) | 5.6 (dict), 3 | stdout contém |
| 14 | 6.9 | [Fecha a trilha] Recibo formatado | combina alinhamento + `.2f` + `for` sobre lista de tuplas (item, preço) + linha de total | 7, 4, 5.6 | stdout exato |

**Vocabulário acumulado ao final:** + `print(sep=)`, format spec `:.2f`, `:<n`/`:>n`/`:^n`,
`"texto" * n`.
