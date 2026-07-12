# Trilha 4 — Python: Listas e Strings

Slug proposto `python-listas-e-strings`. `order: 4`. Pré-requisito: trilhas 1-3 (variável,
tipo, `if`/`for`/`while`, função, `return`).

**Objetivo da trilha:** o aluno sai sabendo guardar várias coisas numa lista, percorrer,
indexar, fatiar (slice), usar os métodos mais comuns (`append`, `remove`, `sort`, `len`) e faz
a mesma coisa em strings (que "se comportam como lista de caracteres" em vários aspectos —
indexação e slicing são ensinados como o mesmo conceito aplicado a dois tipos).

**Pré-requisito de motor:** nenhum novo. `input` de `TestCase` já suporta lista como parâmetro
único hoje em JS (regra: se a função espera **uma lista** como argumento, o `input` precisa ser
`[[...]]`, senão o motor espalha os elementos como argumentos separados — mesma regra vale para
o runner de Python, documentado aqui para não repetir o erro já mapeado em `[[trilha-js-catalogo]]`).

## Módulos

| # | Tipo | Título | Conceito novo | Revisão de | Teste |
|---|---|---|---|---|---|
| 1 | lição | Ponte: guardando várias coisas de uma vez | por que uma variável não basta pra guardar uma turma inteira de alunos | 1.2 | — |
| 2 | lição | Criar e indexar listas | `lista = [1, 2, 3]`, `lista[0]`, índice negativo `lista[-1]` | — | — |
| 3 | 4.1 | Primeiro e último item | indexação `[0]` e `[-1]` | — | function-call |
| 4 | lição | Percorrer lista com `for` | `for item in lista:` | 2.6 | — |
| 5 | 4.2 | Somar todos os valores | `for` + acumulador | 4, 3.5 | function-call |
| 6 | lição | `len()`, `in`, `.append()` | tamanho, pertencimento, adicionar item | — | — |
| 7 | 4.3 | Quantos itens? | `len()` | — | function-call |
| 8 | 4.4 | Já está na lista? | operador `in` | — | function-call |
| 9 | 4.5 | Monte a lista de pares até N | `for` + `if` + `.append()` — reabre o par/ímpar da trilha 2 guardando resultado em lista em vez de só imprimir | 2.4 | function-call |
| 10 | lição | Função + lista: a pegadinha do parâmetro padrão | `def f(historico=[])` — o valor padrão é criado **uma vez só**, não a cada chamada; por que isso surpreende; a correção padrão é usar `historico=None` e, dentro da função, `if historico is None: historico = []` | 3.8 (parâmetro padrão), 6 (`.append`) | — |
| 11 | 4.6 | [Pegadinha guiada] Corrija a função com padrão mutável | identificar e corrigir o bug do módulo 10 com o padrão `None` + `is None` mostrado na lição | 10 | function-call (chamando 2x, resultado não deve "vazar" entre chamadas) |
| 12 | lição | Slicing: fatias de lista | `lista[inicio:fim]`, `lista[:3]`, `lista[::-1]` | 2 | — |
| 13 | 4.7 | Os três primeiros | slicing básico | 12 | function-call |
| 14 | 4.8 | Inverter uma lista (com slice) | `[::-1]` | 12 | function-call |
| 15 | lição | Métodos que modificam vs. que não modificam | `.append`/`.remove`/`.sort` mudam a lista original; `sorted()` devolve nova — mutabilidade | 6 | — |
| 16 | 4.9 | Remover um item | `.remove()` | 15 | function-call |
| 17 | 4.10 | Ordenar números | `.sort()` vs `sorted()` | 15 | function-call |
| 18 | lição | Strings são "quase" listas | indexação e slicing de string funcionam igual à lista; também dá pra fazer `for letra in palavra:` igual a `for item in lista:` (módulo 4); diferença: string é **imutável** | 2, 4, 12 | — |
| 19 | 4.11 | Primeira letra maiúscula (sem `.capitalize()`) | indexação de string + concatenação | 18, 3 | function-call |
| 20 | 4.12 | É palíndromo? | slicing `[::-1]` aplicado a string | 14, 18 | function-call |
| 21 | lição | Métodos de string úteis | `.upper()`, `.lower()`, `.strip()`, `.split()`, `.join()` | — | — |
| 22 | 4.13 | Contar palavras de uma frase | `.split()` + `len()` | 21, 7 | function-call |
| 23 | 4.14 | [Fecha a trilha] Lista de compras formatada | combina lista + `for` + `.join()` + f-string, imprime cada item numerado | 21, 2.7 | stdout exato |

**Revisão espaçada:** módulo 9 reabre par/ímpar (2.4); módulo 20 reabre o "é palíndromo"
conceito (será revisitado de novo em recursão, trilha 8, "sem slicing, com recursão").

**Vocabulário acumulado ao final:** + `list`, `[]`, índice, índice negativo, `len()`, `in`,
`.append()`, `.remove()`, `.sort()`/`sorted()`, slicing `[:]`, `.upper()`/`.lower()`/`.strip()`/
`.split()`/`.join()`, mutável vs. imutável, `None`.
