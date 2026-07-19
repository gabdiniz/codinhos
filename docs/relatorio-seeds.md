# Relatório dos seeds — catálogo completo (JS + Python) + ambiente demo

Visão completa de **todos** os seeds do projeto: o que cada um faz, o resultado final do
ambiente, e uma auditoria de correção. Também avalia se o KB do Codi descreve corretamente o que
o aluno aprende. Data: 18/07/2026.

---

## 1. Os três grupos de seeds

O projeto tem três tipos de seed, todos idempotentes (re-rodar não duplica):

1. **Bootstrap** (`seed.ts`, comando `db:seed`) — cria o tenant demo, as turmas e os alunos, e
   **associa** as trilhas do catálogo às turmas. Não cria conteúdo de trilha.
2. **Catálogo JavaScript** (`seed-trilha-js-01..14.ts` + `-p5.ts`) — 15 trilhas globais.
3. **Catálogo Python** (`seed-trilha-python-01..10.ts`) — 10 trilhas globais.

---

## 2. Bootstrap: `seed.ts` (`pnpm db:seed`)

Cria o mínimo para o ambiente funcionar:

- **Tenant `__system__`** + **Super Admin** (e-mail/senha via variáveis de ambiente).
- **Escola Demo** (`escola-demo`) + **Gestor** (`gestor@escola-demo.com`).
- **Duas turmas, 3 alunos cada** (senha `demo1234`):
  - **Turma JavaScript** → `aluno@`, `ana@`, `pedro@`
  - **Turma Python** → `julia@`, `lucas@`, `marina@`
- **Vínculo de trilhas em ordem**: liga cada trilha do catálogo à turma do idioma certo, pelo
  slug, na sequência do currículo (helper `linkTrailBySlug`). Trilhas ainda não semeadas são
  puladas com aviso; re-rodar depois completa. Login: `http://localhost:5173/escola-demo/login`.

---

## 3. Catálogo JavaScript — 15 trilhas (o caminho principal + p5 opcional)

`tenant_id` nulo (catálogo global). Cada trilha intercala **lições** (só texto) e **desafios**
(enunciado + starterCode + testCases). Encadeadas por pré-requisito: cada conceito só é cobrado
depois de ensinado.

| Ordem | Slug | Trilha | Módulos | Foco |
|---|---|---|---|---|
| 10 | js-primeiros-passos | Primeiros Passos | 16 | variáveis, tipos, função/return, console.log, aritmética, comparação/lógica |
| 20 | js-decisoes-e-repeticoes | Decisões e Repetições | 15 | if/switch/ternário, for/while/for...of, acumulador |
| 30 | js-funcoes | Funções | 13 | template literal, parâmetro padrão, arrow, composição, escopo |
| 40 | js-listas-e-strings | Listas e Textos | 17 | arrays (métodos, spread, mutar vs. copiar) e strings |
| 50 | js-numeros-e-objetos | Números e Objetos | 16 | Math, conversão, objeto-dicionário, Object.keys/values |
| 60 | js-alta-ordem-e-funcional | Alta Ordem | 16 | map/filter/reduce/find/some/every/sort |
| 70 | js-saida-e-formatacao | Imprimindo e Formatando | 14 | repeat, laços aninhados, padStart/End, arte ASCII |
| 80 | js-recursao | Recursão de Verdade | 17 | recursão com regra estrutural, cabeça/cauda, busca binária, Hanói |
| 90 | js-algoritmos | Algoritmos Clássicos | 15 | FizzBuzz, frequência, regex, anagramas, cifra, mediana, romano |
| 100 | js-sintaxe-moderna | Sintaxe Moderna (ES6+) | 16 | desestruturação, spread/rest, ?., ??, shorthand |
| 110 | js-colecoes-map-set | Coleções: Map e Set | 15 | Set (unicidade) e Map (dicionário de verdade) |
| 120 | js-erros-e-robustez | Tratamento de Erros | 14 | try/catch/finally, throw, validação, acesso seguro |
| 130 | js-async-await | Async/await e Promises | 13 | Promise, then, async/await, Promise.all |
| 140 | js-orientacao-a-objetos | Orientação a Objetos | 17 | class, this, métodos, toString, getters, herança, #privado (teto) |
| 200 | js-programacao-visual-p5 | Desenhando com p5.js (opcional) | 15 | setup/draw, cor, formas, animação, interatividade |

**Subtotal JS: 15 trilhas · 229 módulos (80 lições + 149 desafios).** Comandos: `db:seed:js-01..14`,
`db:seed:js-p5`, e `db:seed:js` (roda todas em sequência, incluindo p5).

---

## 4. Catálogo Python — 10 trilhas

`tenant_id` nulo, `language: 'python'`, roda no runner de Python (Pyodide, `packages/runner-python`).
Mesma estrutura (lições + desafios), modos function-call, type-check e stdout.

| Ordem | Slug | Trilha | Módulos |
|---|---|---|---|
| 100 | python-primeiros-passos | Primeiros Passos | 15 |
| 110 | python-decisoes-e-repeticoes | Decisões e Repetições | 20 |
| 120 | python-funcoes | Funções | 18 |
| 130 | python-listas-e-strings | Listas e Strings | 24 |
| 140 | python-estruturas-de-dados | Estruturas de Dados | 19 |
| 150 | python-saida-e-formatacao | Saída e Formatação | 15 |
| 160 | python-alta-ordem-e-funcional | Alta Ordem e Estilo Funcional | 20 |
| 170 | python-recursao-de-verdade | Recursão de Verdade | 17 |
| 180 | python-poo | Programação Orientada a Objetos | 16 |
| 190 | python-modulos-e-algoritmos | Módulos, Ferramentas e Algoritmos | 16 |

**Subtotal Python: 10 trilhas · 180 módulos (83 lições + 97 desafios).** Comandos: `db:seed:python-01`
a `db:seed:python-10`.

---

## 5. Auditoria de correção

Script de auditoria replicando o runner do motor, rodado sobre os 15 seeds de JS:

- **149/149 desafios de JS passam** (function-call, type-check, stdout, ast, async), back≡front.
- Recursão: soluções com laço **reprovam** pela regra estrutural; p5: sketches com primitiva
  faltando **reprovam** pelo requireCall; POO: `#privado`/herança/`toString` rodam.
- Slugs e `order` únicos e em sequência; `seed.ts` cobre todos os slugs JS e Python na ordem certa.
- Sintaxe válida (parser TS), sem corrupção (0 bytes NUL).

Os seeds de Python já haviam sido escritos e verificados numa rodada anterior (mesma técnica). O
único ponto cosmético: os cabeçalhos dos seeds de Python citam o antigo `seed-trilha-js.ts` (já
deletado) como "mesmo padrão" — só comentário, sem efeito.

---

## 6. Resultado final do ambiente

Depois de rodar os três grupos de seed, a plataforma fica com:

- **Currículo de JavaScript completo, do zero ao avançado** (15 trilhas, até POO) + trilha visual
  opcional de p5.js.
- **Currículo de Python completo** (10 trilhas, até POO).
- **Escola Demo pronta para demonstração**: gestor + Turma JavaScript e Turma Python, 3 alunos
  cada, já com as trilhas do idioma associadas na ordem — o aluno entra e encontra a trilha 1
  destravada.
- **~329 desafios semeáveis** (149 JS + ~180 Python... na prática 97 desafios Python), todos
  verificados contra o runner antes de virar conteúdo.

### Como subir tudo

```
pnpm --filter @codinhos/api db:seed:js          # 15 trilhas JS
pnpm --filter @codinhos/api db:seed:python-01   # ... até python-10
pnpm --filter @codinhos/api db:seed             # tenant + turmas + vínculos (por último)
```

---

## 7. KB do Codi — revisado e atualizado

O KB (`docs/codi-kb/`) alimenta o assistente Codi do site. Vários trechos não refletiam mais o
catálogo atual e **foram corrigidos** (seguindo a política do próprio KB: recurso já construído sai
do roadmap e vai para o arquivo temático). Mudanças aplicadas:

- **`03-trilha-e-conteudo.md`** — a seção "O que o aluno aprende" foi reescrita: antes listava só
  lógica básica, variáveis, funções, arrays e "mini-projetos"; agora descreve o percurso real do
  **básico ao avançado** (fundamentos → funções e dados → alta ordem, recursão, algoritmos, saída →
  sintaxe moderna, coleções, erros, async e **POO**), mais os **desafios visuais** e o caminho de
  **Python**. Removida a frase da "trilha única do fundamento ao algoritmo" (substituída por 15
  trilhas).
- **`06-faq.md`** — "que linguagem": agora JavaScript (principal) **e Python**; "tipos de desafio":
  inclui os **visuais**.
- **`00-sobre-codinhos.md`** — linguagem principal JS + Python, com progressão até POO.
- **`01-para-escolas-e-gestores.md`** — catálogo de JS **e Python**; incluída a **criação de
  desafios com apoio de IA** (feature de gestor, graduada do roadmap).
- **`04-gamificacao.md`** — avatar detalhado (personalização + desbloqueio por nível, sem foto da
  criança), **desafio da semana** e **portfólio/certificados**.
- **`07-roadmap.md`** — graduados (removidos do "em breve", pois já existem): desafios visuais (p5),
  geração de desafios por IA e Python. Ficaram como futuro só os itens ainda não construídos (modo
  híbrido de blocos, garagem de projetos, colaborativos, painéis mais ricos, resumo semanal por
  e-mail, aulas em vídeo, login SSO e sync contínua do Classroom).
- **`README.md`** — índice atualizado (03 e 04).

**Ponto de atenção (decisão de produto):** apresentei Python e os desafios visuais como
**disponíveis** no KB, coerente com o que existe no código e com a escola-demo já tendo uma turma
de Python. Se algum desses ainda **não estiver lançado para as escolas de verdade**, é só avisar
que eu volto o item para o `07-roadmap.md` como "em breve".
