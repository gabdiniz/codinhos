# Trilha 10 — Python: Módulos, Ferramentas e Algoritmos

Slug proposto `python-modulos-e-algoritmos`. `order: 10`. Pré-requisito: todas as trilhas 1-9
— é a **capstone** da sequência Python desta rodada: reúne biblioteca padrão curada, algoritmos
clássicos e fecha com um projeto livre.

**Objetivo da trilha:** o aluno sai sabendo usar módulos prontos da biblioteca padrão
(`math`, `random`, `string`) em vez de reinventar, entende os dois algoritmos de busca
(linear e binária — a binária já foi feita recursiva na trilha 8, aqui ganha a versão
iterativa como contraste) e um algoritmo de ordenação clássico (bubble sort) por dentro, e
fecha com um projeto livre que combina o que quiser das 9 trilhas anteriores.

**Pré-requisito de motor:**
- **G6 (escopo de módulos liberados)** precisa estar decidido antes de qualquer coisa: o
  sandbox de Python precisa de uma allowlist de `import` — candidatos claros para esta trilha
  são `math`, `random`, `string`; **nunca** `os`, `sys`, `subprocess`, `socket`, `pathlib`
  (acesso a sistema/rede, incompatível com sandbox seguro). Decisão de produto/infra, não
  fica travada por este documento — mas o desenho abaixo já assume só esses três.
- **Determinismo com `random` é um problema real de teste, resolvido no desenho:** um desafio
  que usa `random.randint` não pode ter `expected` fixo se a semente for livre. Os módulos que
  usam `random` (10.2) fixam a semente **dentro do próprio `testCase`** (`random.seed(42)`
  chamado antes de invocar a função do aluno, no código do runner de teste — não no código do
  aluno), tornando o resultado 100% reproduzível. Isso precisa existir como convenção de autoria
  documentada para quem escrever desafios com `random` no futuro (registrar em
  `docs/motor-desafios-capacidades.md` quando o runner Python for implementado).

## Módulos

| # | Tipo | Título | Conceito novo | Revisão de | Teste |
|---|---|---|---|---|---|
| 1 | lição | Biblioteca padrão: por que não reinventar a roda | `import`, o que o Codinhos libera (`math`, `random`, `string`) e por quê | 7.8 (`import functools`) | — |
| 2 | lição | `math`: `sqrt`, `floor`, `ceil`, `pi` | — | 1.9 (aritmética) | — |
| 3 | 10.1 | Hipotenusa de um triângulo | `math.sqrt` | 3.2 | function-call |
| 4 | lição | `random`: números e escolhas aleatórias — e por que testar isso é diferente | `random.randint`, `random.choice`; semente fixa para o teste ser reproduzível | — | — |
| 5 | 10.2 | Dado sorteado dentro de uma faixa | `random.randint(a, b)`, teste com semente fixa | 4, 1.4 | function-call (semente fixa no teste) |
| 6 | lição | `string`: alfabetos prontos, e convertendo letra ↔ posição | `string.ascii_lowercase`; `ord(letra)` (letra → código numérico) e `chr(numero)` (código numérico → letra) — o par que permite fazer conta com letra | trilha 4 (lição "Strings são quase listas") | — |
| 7 | 10.3 | Cifra de César | desloca cada letra no alfabeto usando `ord`/`chr` + `%` para "dar a volta" no fim do alfabeto | 6, 2.9 (`%`), trilha 4 (`for` em string) | function-call |
| 8 | lição | Busca linear: procurando item por item | percorrer até achar (ou não achar) | 4.8 (`in`) | — |
| 9 | 10.4 | Índice de um item na lista (busca linear) | busca linear manual, sem `.index()` | 8, 4.4 | function-call |
| 10 | lição | Busca binária: dividir para vencer, agora sem recursão | revisão da versão recursiva (trilha 8, R.10) reescrita com `while` | R.10 (trilha 8) | — |
| 11 | 10.5 | Busca binária iterativa | `while` com dois ponteiros (início/fim) | 10, 2.5 (`while`) | function-call |
| 12 | lição | Ordenação: bubble sort passo a passo | trocar vizinhos fora de ordem (`lista[i], lista[i+1] = lista[i+1], lista[i]` — o desempacotamento da trilha 5 usado ao contrário, para trocar), repetir até não trocar mais nada | 5.2 (desempacotamento), 4.10 (`.sort()`, contraste: "isso o Python já faz pronto — mas por dentro é assim que alguns algoritmos ordenam") | — |
| 13 | 10.6 | Bubble sort | implementação manual, sem `.sort()`/`sorted()` | 12, 2.9 (`for` aninhado) | function-call |
| 14 | lição | Pensando em desempenho (sem fórmula, só intuição) | mais itens custam mais passos, de jeitos diferentes conforme o algoritmo — comparação informal linear vs. binária vs. bubble sort | 9, 11, 13 | — |
| 15 | 10.7 | [Fecha a trilha — projeto livre] Seu programa em Python | projeto aberto (agenda, jogo de adivinhação com `random`, sistema de cadastro com classe da trilha 9...); `validationModeOverride: 'manual'`, sem `testCases` fixos — gestor/professor aprova | tudo | manual (sem gabarito) |

**Vocabulário acumulado ao final:** + `import`, `math.sqrt/floor/ceil/pi`, `random.randint/choice`,
`string.ascii_lowercase`, busca linear, busca binária iterativa, bubble sort.

## Fecho do currículo (trilhas 1-10)

Ao completar esta trilha, o aluno cobriu: valores/tipos, controle de fluxo, funções (com
parâmetro padrão e `*args`), listas/strings/tuplas/dicts/sets, comprehensions, estilo
funcional (`lambda`/`map`/`filter`/`sorted`/`reduce`), recursão estrutural, POO com herança, e
uso de biblioteca padrão + dois algoritmos clássicos por dentro. É o "básico ao mais avançado
possível dentro da realidade do motor" pedido — o próximo teto (tratamento de erro,
generators/decorators, projetos multi-arquivo) depende de evolução de motor registrada em
`docs/pesquisa-trilhas-python.md` §4, não de mais pesquisa de conteúdo.
