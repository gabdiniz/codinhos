# Trilha 5 — Python: Estruturas de Dados

Slug proposto `python-estruturas-de-dados`. `order: 5`. Pré-requisito: trilhas 1-4 (função,
lista, string, `for`).

**Objetivo da trilha:** o aluno sai sabendo usar tupla (coleção que não muda), dicionário
(chave→valor) e set (sem repetição), além de uma primeira exposição a list comprehension como
"jeito compacto de escrever um `for` que monta lista" — sem ainda exigir domínio, isso é
aprofundado na trilha 7.

**Pré-requisito de motor:** nenhum novo em relação às trilhas 1-4. Nota de comparação (G3 do
doc mestre): distinção tupla/lista não é cobrada na nota de nenhum desafio desta trilha —
contornado por design, não por limitação percebida pelo aluno.

## Módulos

| # | Tipo | Título | Conceito novo | Revisão de | Teste |
|---|---|---|---|---|---|
| 1 | lição | Ponte: nem tudo precisa mudar, nem tudo é uma lista | recapitula mutabilidade de lista (trilha 4, lição de mutabilidade); anuncia tupla e dict | trilha 4 (lição de mutabilidade) | — |
| 2 | lição | Tupla: uma lista que não muda | `(1, 2, 3)`, desempacotamento `a, b = (1, 2)` | 4.2 (indexação) | — |
| 3 | 5.1 | Coordenadas x, y | retorna tupla de 2 valores | 3.2 | function-call |
| 4 | 5.2 | Desempacotar coordenadas | `x, y = ponto` | 3 | function-call |
| 5 | lição | Dicionário: chave e valor | `{"nome": "Ana", "idade": 12}`, `dic["chave"]`, `.get()` | — | — |
| 6 | 5.3 | Idade da pessoa | acesso por chave | — | function-call |
| 7 | 5.4 | Chave que talvez não exista | `.get(chave, padrao)` — evita `KeyError` sem ensinar `try/except` ainda | 6 | function-call |
| 8 | lição | Adicionar e percorrer dicionário | `dic["nova"] = valor`, `.items()`, `.keys()`, `.values()` | — | — |
| 9 | 5.5 | Cadastrar um novo item | atribuição por chave | 6 | function-call |
| 10 | 5.6 | Imprimir cadastro completo | `for chave, valor in dic.items():` | 4.14 (join), 2.6 (for) | stdout exato |
| 11 | lição | Contar com dicionário | padrão "contador": `dic[item] = dic.get(item, 0) + 1` | 7, 4.6 (`for` em string) | — |
| 12 | 5.7 | Contar letras de uma palavra | padrão contador aplicado a string, percorrida diretamente com `for letra in palavra:` | 11, trilha 4 (lição "Strings são quase listas") | function-call |
| 13 | lição | Set: coleção sem repetição | `{1, 2, 3}`, `.add()`, diferença de dict (sem `:`); conversão de ida e volta com `list(...)` e `set(...)` (o `list()`/`set()` como "conversor de coleção", não só literal) | 5 | — |
| 14 | 5.8 | Remover duplicados de uma lista | `set(lista)` → `list(...)` | 4.10 (list), 13 | function-call |
| 15 | 5.9 | Itens em comum entre duas listas | interseção de sets (`&`, mostrado no enunciado) | 14 | function-call |
| 16 | lição | List comprehension: um `for` compacto | `[x*2 for x in lista]` é o mesmo que um `for` com `.append()` — mostrado lado a lado com o código equivalente da trilha 4 | 4.9 (for+append) | — |
| 17 | 5.10 | Dobrar valores (com comprehension) | reescreve 4.9 no estilo comprehension | 4.9, 16 | function-call |
| 18 | 5.11 | [Fecha a trilha] Agenda de contatos | combina dict de dicts (`{"Ana": {"idade": 12, "cidade": "Recife"}}`) + `.items()` + f-string | 8, 4.14 | stdout exato |

**Nota de sequência:** comprehension aparece aqui só como **prévia conceitual** ligada 1:1 ao
`for` que o aluno já sabe escrever (módulo 16-17); a trilha 7 é quem aprofunda comprehension
como estilo (dict/set comprehension, comprehension com `if`, combinada com `lambda`/`map`/
`filter`) — evita reensinar do zero, só expande.

**Vocabulário acumulado ao final:** + `tuple`, `()`, desempacotamento, `dict`, `{chave: valor}`,
`.get()`, `.items()`/`.keys()`/`.values()`, `set`, `.add()`, `&` (interseção), list comprehension.
