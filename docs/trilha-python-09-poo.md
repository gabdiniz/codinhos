# Trilha 9 — Python: Programação Orientada a Objetos

Slug proposto `python-poo`. `order: 9`. Pré-requisito: trilhas 1-6 (função, dict — uma
instância "parece" um dict com nome fixo de campos —, e principalmente a trilha 6, porque
**toda** a verificação desta trilha usa `print`). É o teto de conteúdo desta rodada: o tópico
mais avançado que ainda cabe inteiramente no motor descrito em `docs/pesquisa-trilhas-python.md`.

**Objetivo da trilha:** o aluno sai sabendo criar uma classe simples (`class`, `__init__`,
`self`), instanciar objetos, criar métodos que leem e mudam o estado do objeto, e o básico de
herança — o suficiente para modelar "coisas do mundo" (um cachorro, uma conta bancária) como
código.

**Pré-requisito de motor — o mais restrito desta rodada (gap G7):** o motor pega "a primeira
função declarada" como alvo do teste; uma `class` não é uma função, e um método dentro dela não
é alcançável do mesmo jeito. **Por isso, 100% dos desafios desta trilha são `mode:'stdout'`:**
o enunciado sempre pede para o aluno instanciar o objeto e **imprimir** o resultado observável
(`print(cachorro)`, `print(f"Saldo: {conta.saldo}")`), nunca `return` de um método de instância.
Isso não é um contorno frágil — é o mesmo padrão já usado com sucesso na trilha 6 e é, na
prática, como se testa "efeito observável" em qualquer linguagem sem framework de teste
dedicado. Quando/se o motor ganhar um modo dedicado a instanciar classe + chamar método (G7,
esforço M), esses desafios podem ganhar uma segunda forma de verificação mais precisa — não é
bloqueante para publicar a trilha como está.

## Módulos

| # | Tipo | Título | Conceito novo | Revisão de | Teste |
|---|---|---|---|---|---|
| 1 | lição | O que é uma classe: molde de objetos | metáfora "fôrma de bolo" — a classe é o molde, cada objeto é um bolo | 5.5 (dict com campos fixos) | — |
| 2 | lição | `class`, `__init__`, `self` | anatomia mínima de uma classe Python | 3.2 (`def`, parâmetro) | — |
| 3 | P.1 | Criar e imprimir um Cachorro | `class Cachorro:` com `__init__(self, nome)`, instanciar, `print(cachorro.nome)` | 1.8 (f-string) | stdout exato |
| 4 | lição | Métodos: função que mora dentro da classe | `def latir(self):`, `self` referencia o próprio objeto | 3 | — |
| 5 | P.2 | Método que usa o atributo | `.latir()` usa `self.nome` num `print` | 4, 6.4 | stdout exato |
| 6 | lição | `__str__`: como o objeto se apresenta no `print` | por que `print(objeto)` mostra algo estranho sem `__str__`, e como consertar | 3 | — |
| 7 | P.3 | Implementar `__str__` | `def __str__(self): return f"..."` | 6 | stdout exato |
| 8 | lição | Vários objetos, mesma classe | lista de objetos, `for` imprime cada um | 4.2 (`for` em lista) | — |
| 9 | P.4 | Canil (lista de cachorros) | lista de instâncias + `for` + `print` (usa `__str__` de 7) | 8, 7 | stdout exato |
| 10 | lição | Métodos que mudam o estado do objeto | `self.idade = self.idade + 1` — o objeto "lembra" entre chamadas de método | trilha 4 (lição de mutabilidade) | — |
| 11 | P.5 | Aniversário (incrementa idade) | método que altera atributo, chamado 2x seguidas, imprime o resultado final | 10 | stdout exato |
| 12 | lição | Herança: uma classe "é um tipo de" outra | `class Cachorro(Animal):`, `super().__init__(...)`, sobrescrever método | 2 | — |
| 13 | P.6 | Animal e Cachorro (herança + sobrescrita) | `Cachorro` herda de `Animal`, sobrescreve `emitir_som()` | 12, 7 | stdout exato |
| 14 | lição | Encapsulamento por convenção | `_saldo` (prefixo `_` = "não mexa direto de fora", combinado, não é regra imposta pela linguagem como em outras) | — | — |
| 15 | P.7 | [Fecha a trilha] Conta bancária | `class ContaBancaria` com `depositar()`/`sacar()`/`__str__`; várias operações seguidas, imprime extrato final | 11, 14, 7 | stdout exato |

**Vocabulário acumulado ao final:** + `class`, `__init__`, `self`, atributo, método, `__str__`,
herança, `super()`, sobrescrita de método, encapsulamento (convenção `_nome`).
