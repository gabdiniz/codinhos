# Pesquisa e plano geral — trilhas de Python

Documento mestre do planejamento de conteúdo de Python para o Codinhos. Define o que a
linguagem oferece, o que o motor **hoje** consegue sustentar, os gaps de motor que essa
frente descobre, e o mapa das trilhas propostas — quantas, em que ordem, como se conectam.
Cada trilha tem um documento próprio de desenho (`docs/trilha-python-01-*.md` em diante) com
a tabela módulo a módulo. Nada foi semeado — são documentos de planejamento, para revisão
antes de qualquer seed.

> Escopo: só Python nesta rodada. O desenho é feito para ser parcialmente reaproveitável para
> JS no futuro (estrutura de conexão entre trilhas, técnica de auditoria de gaps), mas as
> trilhas em si são específicas de Python.

---

## 1. Estado do motor hoje, para Python especificamente

Verificado no código atual (`apps/api/src/shared/db/schema.ts`, `.../shared/utils/run-tests.ts`,
`apps/app/.../sandbox.worker.ts`, `docs/motor-desafios-capacidades.md`):

- **A tabela `trails` já tem uma coluna `language` (`'javascript' | 'python'`, `NOT NULL`).**
  É possível criar uma trilha com `language: 'python'` hoje — o catálogo, a autoria e o
  cadastro **aceitam** o valor.
- **Mas não existe nenhum runner de Python.** `run-tests.ts` (backend, `node:vm`) e
  `sandbox.worker.ts` (frontend, `new Function()`) só sabem executar **JavaScript**. Não há
  branch, flag ou dispatch por `language` nesses dois arquivos — o campo `language` da trilha
  é só metadado (filtro/rótulo), não influencia a correção.
- **Conclusão prática:** se um desafio de Python fosse semeado hoje, o aluno escreveria código
  Python, o motor tentaria rodá-lo como JavaScript (`node:vm`/`new Function`) e o resultado
  seria erro de sintaxe ou comportamento sem sentido — **não funciona, não é uma questão de
  faltar conteúdo, é o runner que não existe.**

Isso confirma a orientação do pedido: **por enquanto só documentos.** Este trabalho é a
preparação de conteúdo para o dia em que a direção "Python via Pyodide" (já registrada como
horizonte G em `docs/motor-desafios-capacidades.md` §4-5) for priorizada. Quando isso
acontecer, o catálogo já está desenhado, verificado pedagogicamente e pronto para virar seed —
falta só o motor.

### O que muda quando o runner existir (decisão de produto, não deste documento)

Duas famílias de solução, ambas viáveis, citadas no motor hoje como horizonte G:

1. **Pyodide no navegador** (Python compilado para WASM) — resolveria o feedback do front
   (Web Worker), mas o **backend precisa revalidar** (regra do motor, `docs/motor-desafios-capacidades.md`
   §6: "backend revalida a nota"). Rodar Pyodide no Node do backend é possível mas pesado.
2. **Runtime Python real no servidor** (subprocess isolado/sandboxed, ex. dentro de um
   container com timeout e sem acesso a rede/filesystem) — mais fiel à linguagem real, mas é
   infraestrutura nova (isolamento de processo é uma superfície de risco diferente do
   `node:vm`, que já é "só" JS confinado).

Este documento **não decide entre as duas** — é chamada de produto/infra. O desenho de
conteúdo abaixo foi feito para funcionar com qualquer uma, assumindo apenas que o runner final
suporte os três modos de teste já provados no motor JS (function-call, type-check, stdout) —
ver §3.

---

## 2. O que o Python oferece (pesquisa da linguagem)

Levantamento do que a linguagem cobre, do básico ao avançado, para decidir o que entra no
currículo do Codinhos e o que fica de fora (por não caber na faixa etária, não caber no
modelo do motor, ou não ser prioridade).

### 2.1 Núcleo da linguagem (candidato a currículo)

| Área | Conceitos |
|---|---|
| Valores e tipos | `int`, `float`, `str`, `bool`, `None`; tipagem dinâmica; `type()` |
| Operadores | aritméticos (`+ - * / // % **`), comparação, lógicos (`and or not`), atribuição composta |
| Entrada/saída | `print()` (incl. `sep`/`end`), f-strings, `input()` (⚠️ ver gap §4) |
| Controle de fluxo | `if/elif/else`, `while`, `for ... in`, `range()`, `break`/`continue`, `else` de loop (avançado) |
| Funções | `def`, parâmetros posicionais/nomeados, valor padrão, `return`, `*args`/`**kwargs`, escopo (`global`/`nonlocal`), recursão, funções aninhadas, docstrings |
| Strings | indexação, slicing, imutabilidade, métodos (`split`, `join`, `strip`, `replace`, `upper/lower`, `find`, `startswith/endswith`), f-strings com format spec |
| Coleções | `list` (mutável), `tuple` (imutável), `dict`, `set`; slicing; métodos de cada uma; comprehensions (`list`/`dict`/`set`) |
| Iteração avançada | `enumerate`, `zip`, desempacotamento (`a, b = ...`), iteração sobre dict (`.items()`) |
| Programação funcional | `lambda`, `map`, `filter`, `sorted(key=...)`, `functools.reduce`, comprehensions como alternativa idiomática |
| POO | `class`, `__init__`, `self`, atributos, métodos, herança simples, sobrescrita de método, métodos mágicos básicos (`__str__`, `__eq__`), encapsulamento por convenção (`_nome`) |
| Tratamento de erro | `try/except/else/finally`, `raise`, exceções built-in vs. customizadas |
| Módulos | `import`, biblioteca padrão (`math`, `random`, `string`, `statistics`, `datetime`, `itertools`, `collections`) |
| Arquivos | leitura/escrita de arquivo (`open`) |
| Avançado (fora do ensino médio de programação) | geradores/`yield`, decoradores, context managers (`with`), type hints, `async`/`await`, metaclasses, threading/multiprocessing |

### 2.2 O que entra no currículo do Codinhos (11–14 anos) e por quê

Critério: (a) é fundamento real da linguagem, não gambiarra; (b) cabe no modelo mental "código
que roda e produz um resultado observável" que o motor sustenta; (c) tem valor pedagógico para
a faixa etária (não é otimização prematura nem "programação de infraestrutura").

**Entra (vira trilha):** valores/tipos, operadores, controle de fluxo, funções, strings,
listas, tuplas/dicts/sets, comprehensions, funcional básico (lambda/map/filter/sorted/reduce),
recursão, POO básica (classe/atributo/método/herança simples), módulos curados da biblioteca
padrão, busca/ordenação (algoritmos clássicos), formatação de saída.

**Fica de fora nesta fase (com justificativa, não esquecimento):**

- **Tratamento de erro (`try/except`)** — conceito real e usado por gente grande, mas o motor
  atual não tem um jeito de "testar que o código lança/trata uma exceção específica" (nem em
  JS isso existe hoje). Fica registrado como extensão futura de conteúdo, condicionada a um
  matcher/modo novo no motor (ver §4).
- **Arquivos (`open`)** — sandbox não deve ter I/O de filesystem real (risco de segurança e
  não faz sentido num ambiente efêmero). Fora do currículo por design, não por lacuna.
- **Geradores/`yield`, decoradores, context managers, type hints, `async`, metaclasses,
  threading** — avançado demais para 11–14 mesmo no "mais avançado possível"; são tópicos de
  formação intermediária/profissional. Não entram.
- **`input()` interativo de verdade** — ver gap crítico em §4. Vira só um "sabia que existe"
  numa lição, não um mecanismo testável, até o motor evoluir.

Isso responde à parte do pedido "do básico ao mais avançado possível de Python **dentro da
realidade do nosso motor**": o teto não é a linguagem, é o motor. POO e recursão são o topo
hoje sustentável; tratamento de erro é o próximo teto a quebrar quando o motor evoluir.

---

## 3. Modos de teste disponíveis (herdados do motor JS, replicáveis em Python)

O desenho abaixo assume que o futuro runner de Python oferece o equivalente aos 3 modos já
provados e sem gap conceitual para portar:

| Modo | Em JS hoje | Equivalente em Python |
|---|---|---|
| function-call | chama a função com `input`, compara `return` | chama a função com `input` (spread posicional), compara `return` |
| type-check | `typeof var` | `type(var).__name__` (ou `isinstance`) |
| stdout | compara saída de `console.log` | compara saída de `print()` — **experiência ainda mais natural em Python**, já que scripts Python "de tela única" (sem função) são o estilo idiomático de iniciante |

**Ponto técnico a registrar para quando o motor for construído:** a comparação por
`deepEqual`/JSON não é 1:1 com os tipos Python — `None` ↔ `null`, `True/False` ↔ `true/false`
mapeiam bem, mas `tuple` vira indistinguível de `list` ao serializar para JSON (ambos viram
array). Se algum desafio depender de "retornar tupla, não lista" como parte do enunciado, o
comparador vai precisar de uma extensão (ex.: marcar `expected` com um tipo esperado) — não é
bloqueante para o currículo (nenhuma trilha abaixo depende disso para a nota), mas é um detalhe
a não esquecer na hora de implementar. Ver gap em §4.

**Bônus real para Python: verificação estrutural fica mais fácil, não mais difícil.** A D5-AST
em JS (`docs/motor-desafios-capacidades.md` §13) é heurística por texto (regex sobre código
"limpo") porque trazer um parser JS de verdade (acorn etc.) era custo extra. Python **já tem**
um parser de AST na biblioteca padrão (`ast`, módulo nativo, sem dependência nova) — dá para
implementar `requireRecursion`/`forbidLoops`/`requireMethod` etc. com uma árvore sintática real
em vez de regex, o que é estritamente mais robusto. Isso só é possível no lado que executa
Python de verdade (não dá para replicar `ast` do Python em JavaScript no Web Worker do front) —
então essa checagem estrutural, quando existir, provavelmente vive só no backend Python, e o
front mostra feedback mais genérico até a revalidação do backend chegar. Registrado como nota
de design para a trilha 8 (Recursão) e trilha 9 (POO).

---

## 4. Gaps do motor identificados nesta pesquisa (para o roadmap, não para agora)

Itens que a pesquisa de conteúdo escancarou e que **não dá para resolver com pesquisa de
linguagem** — são decisões de engenharia/produto do Codinhos. Registrados aqui para entrarem
no próximo kickoff de motor (mesmo formato do `docs/motor-desafios-capacidades.md`).

| # | Gap | Por que aparece | Esforço estimado | Bloqueia qual trilha |
|---|---|---|---|---|
| G1 | **Não existe runner de Python** | `language` é só metadado; `run-tests.ts`/`sandbox.worker.ts` só rodam JS | **G** | Todas — pré-requisito de tudo |
| G2 | **`input()` sem fonte de stdin simulável** | O modelo do motor é entrada→saída via argumento de função, não leitura interativa de stdin; nem JS tem `prompt()` testável hoje | **M** (definir um "stdin simulado" como novo campo de `TestCase`, ex. `stdin: string[]`) | Trilha 1 (mencionado, não testado) |
| G3 | **Distinção tupla vs. lista se perde na serialização JSON** | `deepEqual`/JSON não preserva o tipo Python de coleção | **P** (adicionar `expectedType` opcional ao comparador) | Trilha 5 (mitigado: nenhum desafio exige isso na nota) |
| G4 | **Sem modo de teste para exceções (`try/except`)** | Motor não tem conceito de "espera-se que lance erro X" | **M** | Nenhuma das 10 (adiado por design, não incluído no currículo ainda) |
| G5 | **Verificação estrutural (`mode:'ast'`) para Python precisa de implementação própria** | O heurístico de JS não serve para sintaxe Python (indentação, `:` em vez de `{}`); mas a biblioteca `ast` nativa do Python resolve isso melhor do que o heurístico atual de JS | **M** (menor que a versão JS, por já ter parser pronto) | Trilha 8 (Recursão) e Trilha 9 (POO, opcionalmente) |
| G6 | **Escopo de módulos padrão liberados não está definido** | Motor JS cura globais (`SAFE_GLOBALS`); Python precisa da mesma curadoria para `import` — decisão de quais módulos entram (`math`, `random`, `string` são candidatos óbvios; `os`/`sys`/`subprocess`/`socket` nunca) | **P** (é uma allowlist, não um mecanismo novo) | Trilha 10 |
| G7 | ~~POO exercita só via stdout, não há modo "instancie e chame método"~~ **RESOLVIDO (12/07/2026)** | O motor pega "a primeira função declarada"; uma classe não é uma função — então testar estado de objeto exigia o aluno **imprimir** o resultado (`print`), não `return` de instância | **M** — implementado: `mode:'instance-call'` em `packages/runner-python` + fallback no runner JS. Ver `docs/motor-python-capacidades.md` §1.1 | Trilha 9 pode migrar de `stdout` pra `instance-call` (não migrada nesta rodada — só o motor foi mexido) |

**Nenhum destes gaps impede escrever os documentos de trilha** (que é o pedido desta rodada) —
eles impedem **rodar o seed com efeito real**. G1 é o bloqueador de fundo; G2–G7 mudam o
**tipo** de desafio possível em algumas trilhas, e o desenho abaixo já foi adaptado a essas
restrições (por isso, por exemplo, POO usa só `stdout` e a trilha não promete testar
`try/except`).

---

## 5. Quantas trilhas, e por quê

**10 trilhas**, fácil → difícil, cada uma autocontida (tem lição própria dos conceitos novos)
mas **assumindo como pré-requisito todas as anteriores** — ordem estrita, ao contrário das 3
trilhas de "modos novos" de JS (que eram independentes entre si). Aqui a independência não
faz sentido: Python tem uma progressão mais linear de pré-requisitos (não dá pra ensinar
dicionário antes de variável, nem POO antes de função).

Por que 10 e não uma trilha monolítica (como a `js-fundamentos-ao-algoritmo` de 84 módulos) nem
3-4 trilhas grandes:

- **Trilhas menores e nomeadas dão sinal de progresso mais claro** para um aluno de 11-14 anos
  ("terminei Funções!" é mais motivador que "estou no módulo 47 de 84").
- **Cada trilha vira uma unidade de ativação independente** para o gestor (ele pode atribuir só
  até Funções para uma turma iniciante, e liberar POO/Alta Ordem depois) — o pedido do usuário
  de "trilhas que se conectam" combina melhor com trilhas curtas e sequenciais do que com um
  monólito.
- **Facilita a auditoria de gaps** (verificar que nada usa conceito não ensinado) — módulos por
  trilha ficam entre 12–18, tamanho administrável para revisão manual e para o script de
  varredura de tokens que o time já usa em JS (ver `[[trilha-js-catalogo]]`, técnica replicável
  para Python trocando os tokens procurados).

| # | Trilha | Slug proposto | Foco | Módulos (estimado) |
|---|---|---|---|---|
| 1 | Primeiros Passos | `python-primeiros-passos` | valores, tipos, operadores, print | ~14 |
| 2 | Decisões e Repetições | `python-decisoes-e-repeticoes` | if/elif/else, while, for+range | ~16 |
| 3 | Funções | `python-funcoes` | def, parâmetros, retorno, escopo | ~14 |
| 4 | Listas e Strings | `python-listas-e-strings` | indexação, slicing, métodos, iteração | ~16 |
| 5 | Estruturas de Dados | `python-estruturas-de-dados` | tuplas, dicts, sets, comprehensions (intro) | ~14 |
| 6 | Saída e Formatação | `python-saida-e-formatacao` | f-strings avançadas, tabelas, ASCII art (stdout) | ~12 |
| 7 | Alta Ordem e Estilo Funcional | `python-alta-ordem-e-funcional` | lambda, map/filter, sorted, comprehensions avançadas, reduce | ~12 |
| 8 | Recursão de Verdade | `python-recursao-de-verdade` | recursão estrutural, "sem loop" | ~14 |
| 9 | Programação Orientada a Objetos | `python-poo` | class, atributos, métodos, herança | ~14 |
| 10 | Módulos, Ferramentas e Algoritmos | `python-modulos-e-algoritmos` | math/random/string curados, busca/ordenação, projeto final | ~14 |

**Total estimado: ~140 módulos.** Maior que a trilha JS única (84) porque cobre, além do
equivalente aos fundamentos JS, formatação de saída e recursão **desde o desenho inicial**
(em JS essas vieram depois, como trilhas B/A separadas) e adiciona POO, que JS ainda nem tem.

---

## 6. Mapa de conexão entre trilhas (como cada uma referencia a anterior)

Regra geral seguida em **todas** as trilhas (deriva do pedido do usuário): a **lição de
abertura** de cada trilha (a partir da trilha 2) começa com uma frase de ponte nomeando
explicitamente o que a trilha anterior deixou pronto, e o **primeiro desafio** de cada trilha é
sempre um **desafio de revisão** — resolve algo que já daria pra resolver com o conhecimento
antigo, mas usando o contexto que introduz a trilha nova (nunca conceito 100% inédito no
desafio 1). A partir daí intercala: 1 revisão a cada 3-4 desafios novos, sempre compondo
conceito antigo + novo (não é reexplicar do zero, é reaproveitar em um problema maior).

```
1 Primeiros Passos
        │  (variável, tipo, operador, print)
        ▼
2 Decisões e Repetições  ──uses──> variável/operador de 1
        │  (condição, loop)
        ▼
3 Funções  ──uses──> condição/loop de 2, variável de 1
        │  (def, parâmetro, retorno)
        ▼
4 Listas e Strings  ──uses──> função de 3, loop de 2
        │  (coleção sequencial, iteração)
        ▼
5 Estruturas de Dados  ──uses──> lista de 4, função de 3
        │  (dict, tupla, set)
        ▼
6 Saída e Formatação  ──uses──> tudo de 1-5 (é uma trilha "de aplicação", reusa cada camada)
        │  (print avançado, f-string com spec)
        ▼
7 Alta Ordem e Funcional  ──uses──> lista/dict de 4-5, função de 3
        │  (lambda, map/filter/sorted, comprehension)
        ▼
8 Recursão de Verdade  ──uses──> função de 3, lista de 4 (revisita 5-6 problemas de 1-7 "sem loop")
        │  (função que chama a si mesma)
        ▼
9 POO  ──uses──> função/dict de 3/5, print de 6 (estado de objeto só é observável via print)
        │  (class, self, método, herança)
        ▼
10 Módulos, Ferramentas e Algoritmos  ──uses──> tudo (capstone: busca/ordenação/projeto livre)
```

**Trilhas 6 e 7 são as duas exceções à ordem "pura"** (não introduzem um pré-requisito novo
para as trilhas seguintes, são camadas de refinamento sobre 1-5): poderiam, em teoria, ser
adiadas para depois de POO sem quebrar nada. Ficaram nessa posição porque (a) "imprimir bem"
(6) é usado dentro de POO (9) para tornar objetos observáveis, e (b) estilo funcional (7) é
citado como alternativa de solução dentro da Recursão (8, "sem loop também pode ser
`map`/`filter`" — mesmo padrão já usado na trilha `js-recursao-de-verdade`). Por isso ficam
antes, não depois.

**Revisão espaçada concreta (exemplos, detalhados em cada doc de trilha):**
- Trilha 4 (Listas) reabre o problema "tabuada" (visto com `print`/`for` na trilha 2) agora
  guardando os resultados numa lista antes de imprimir.
- Trilha 8 (Recursão) revisita literalmente problemas resolvidos com `for` nas trilhas 2-4
  (contagem regressiva, soma até N, fatorial, palíndromo, soma de dígitos) — igual à estratégia
  que já funcionou em `js-recursao-de-verdade` (ver `[[trilha-js-catalogo]]`).
- Trilha 10 (capstone) reabre "maior valor de uma lista" (visto em 4 e de novo em 8 sem
  `max()`) desta vez usando o módulo `random` para gerar a lista.

---

## 7. Técnica de verificação planejada (para quando houver seed)

Mesma disciplina usada na trilha JS (`[[trilha-js-catalogo]]`, `[[conteudo-modos-novos-kickoff]]`):

1. **Verificação de corretude:** replicar o runner de Python (quando existir) fora do banco e
   rodar a solução de referência de cada desafio contra os `testCases`, antes de semear.
2. **Auditoria "nada usado antes de ensinado":** script que varre o `exampleCode`/solução de
   referência de cada módulo por tokens (`for`, `while`, `lambda`, `class`, `def`, `.append(`,
   comprehension `[... for ... in ...]`, `import`, `try`, etc.) e confere que o tópico
   correspondente já foi introduzido em uma lição anterior na mesma ordem de módulo. Adaptação
   direta do script usado na reordenação `feat/trilha-ordem-prerequisitos` da trilha JS.
3. Este documento e os 10 docs de trilha já foram escritos **com essa disciplina em mente**
   durante o desenho (não só depois) — a auditoria formal (item 12 da lista de tarefas desta
   rodada) é uma segunda passada de conferência, não a primeira linha de defesa.

---

## 8. Fontes consultadas

- Levantamento de currículos de Python para iniciantes/middle school (estrutura de fases:
  fundamentos → controle de fluxo → funções/coleções → avançado/POO → projetos) —
  [Python Curriculum For Kids](https://www.create-learn.us/blog/python-curriculum/),
  [CodeHS K-12 CS Curriculum](https://codehs.com/curriculum),
  [Python for Middle Schoolers — Tynker](https://www.tynker.com/blog/python-for-middle-schoolers/).
- Erros/concepções equivocadas comuns de iniciantes (indentação, argumento padrão mutável,
  mutabilidade vs. imutabilidade) — usado para decidir onde ensinar cada armadilha como lição
  dedicada em vez de deixar o aluno descobrir sozinho — [Common Python Mistakes — DEV
  Community](https://dev.to/kelseyroche/6-beginner-mistakes-in-python-and-how-to-fix-them-1d15),
  [10 Common Python Mistakes](https://blog.eduonix.com/2025/05/top-10-python-mistakes-beginners-make-and-how-to-avoid-them/).
- Base técnica interna: `docs/motor-desafios-capacidades.md`, `docs/plano-trilhas-modos-novos.md`,
  `apps/api/src/shared/db/schema.ts`, `apps/api/src/shared/utils/run-tests.ts`,
  `apps/api/src/shared/db/seed-trilha-js.ts` (padrão de estrutura de módulo/seed).
