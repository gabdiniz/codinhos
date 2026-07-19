# Trilha JS 14 — Orientação a Objetos (classes)

Slug proposto `js-orientacao-a-objetos`. `order: 140`. Pré-requisito: `js-numeros-e-objetos`
(objetos), `js-funcoes`, `js-decisoes-e-repeticoes` (`for`), `js-saida-e-formatacao`
(`console.log`) e `js-sintaxe-moderna` (`this` com desestruturação no construtor);
`js-colecoes-map-set` é **opcional** (o desafio final pode usar um `Map`). **Teto do currículo** —
o tópico mais avançado que cabe inteiro no motor. Ver `docs/pesquisa-trilhas-js.md`.

**Objetivo da trilha:** o aluno modela "coisas do mundo" como código — `class` com `constructor` e
`this`, métodos que leem e mudam o estado, `get`ters e membros `static`, herança
(`extends`/`super`/sobrescrita) e encapsulamento (`_convenção` e `#privado`).

**Pré-requisito de motor — o mais restrito (G-JS1):** o motor pega "a primeira função declarada"
como alvo, e uma `class` não é função. Verificado: classe, herança, getters, `static`, `#privado`
e `toString` rodam idênticos back≡front — falta só *como testar*. Duas formas, ambas provadas:
**(1) função-embrulho** (o aluno define a classe **e** uma função-alvo que instancia, opera e
**retorna JSON**), **(2) `mode:'stdout'`** (instancia e **imprime** o estado observável). Quando o
motor ganhar um modo "instancie X, chame método Y" (G-JS1), esses desafios ganham verificação
direta — não é bloqueante.

## Módulos

| # | Tipo | Título | Conceito novo | Revisão de | Teste |
|---|---|---|---|---|---|
| 1 | lição | O que é uma classe | metáfora "fôrma de bolo": molde vs. objeto | trilha 05 (objeto) | — |
| 2 | lição | `class`, `constructor`, `this`, `new` | anatomia mínima; instanciar com `new` | funcoes, trilha 05 | — |
| 3 | OO.1 | Criar um ponto | `class Ponto {...}` + embrulho `criar(x, y)` retorna `{ x: p.x, y: p.y }` | 2 | function-call (objeto) |
| 4 | lição | Métodos | `metodo() {...}` usa `this` | 3 | — |
| 5 | OO.2 | Retângulo com área | `class Retangulo { area() {...} }` + embrulho `areaDe(l, a)` | 4 | function-call (número) |
| 6 | lição | Instanciar e imprimir; `toString` | `console.log(objeto)` mostra algo estranho; `toString()` conserta | trilha 07 (`console.log`), 3 | — |
| 7 | OO.3 | `toString` do produto | `toString() { return \`${this.nome}: R$${this.preco}\` }`; imprime | 6, funcoes (template) | stdout exato |
| 8 | lição | Estado que muda entre chamadas | método altera `this`; o objeto "lembra" | 5, trilha 05 (mutação) | — |
| 9 | OO.4 | Contador | `incrementar() { this.n++ }` + embrulho que chama num `for` e retorna `.n` | 8, DR (`for`) | function-call (número) |
| 10 | OO.5 | Conta bancária | `depositar`/`sacar` em sequência, `console.log` do saldo final | 9, 7 | stdout exato |
| 11 | lição | `get`ters e membros `static` | `get resumo() {...}` (propriedade calculada); `static criar(...)` | 5 | — |
| 12 | OO.6 | Status por getter | `get status() {...}` + embrulho que lê `obj.status` | 11, funcoes (template) | function-call (string) |
| 13 | lição | Herança | `class Cachorro extends Animal`, `super(...)`, sobrescrever método | 2, 4 | — |
| 14 | OO.7 | Animal e Cachorro | sobrescreve `som()`; embrulho `somDoCachorro(nome)` | 13, 4 | function-call (string) |
| 15 | lição | Encapsulamento | `_saldo` (convenção) e `#saldo` (campo **privado de verdade**) | 10 | — |
| 16 | OO.8 | Cofre com senha | `#saldo` privado; só métodos com checagem mexem; embrulho retorna o saldo | 15, 9 | function-call (número) |
| 17 | OO.9 | [Fecha a trilha] Mini-biblioteca | `class Livro` (com `toString`) + `class Biblioteca` (array — ou `Map` opcional), `adicionar`/`emprestar`, imprime o acervo | 14, 10, 7 | stdout exato |

**Vocabulário acumulado ao final:** + `class`, `constructor`, `this`, `new`, método, `toString`,
método que altera estado, `get`ter, membro `static`, herança (`extends`, `super`, sobrescrita),
encapsulamento (`_convenção`, `#privado`).

**Nota de auditoria:** desafios de **embrulho** (OO.1/2/4/6/7/8) retornam objeto/número/string
JSON; os de **stdout** (OO.3/5/9) imprimem o estado observável. Nenhum retorna instância de classe.
Herança, getters, `static` e `#privado` confirmados back≡front antes do desenho. `import`/`export`
(organizar em módulos) fica de fora — limite de motor G-JS3, mencionado só conceitualmente.
