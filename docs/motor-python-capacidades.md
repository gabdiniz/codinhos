# Motor de aprendizado — Python: decisão de runtime e roadmap

Continuação de `docs/pesquisa-trilhas-python.md` §1-4 (estado do motor pra Python, modos de
teste, tabela de gaps G1-G7). Este documento fecha a parte que aquele deixou em aberto por ser
"decisão de produto/infra, não de conteúdo": **qual runtime roda Python** e **em que ordem** o
motor evolui até sustentar as 10 trilhas já desenhadas. Molde: `docs/motor-desafios-capacidades.md`
(como o motor JS foi faseado D1→D5).

> Verificado no código atual em 11/07/2026: `apps/api/src/shared/utils/run-tests.ts`,
> `apps/app/src/workers/sandbox.worker.ts`, `apps/api/src/shared/db/schema.ts` (`languageEnum`
> já aceita `'python'`, é só metadado), `docker-compose.yml`/`docker-compose.prod.yml`
> (deploy: um VPS único via Caddy + compose, sem Kubernetes/Firecracker/gVisor), `apps/api/package.json`
> (nenhuma dependência de execução Python ou isolamento de processo ainda).

---

## 1. Decisão: G1 (runtime de Python)

**Direção escolhida: Pyodide (CPython real compilado para WASM), rodando nos DOIS lados —
front (Web Worker, como já é hoje) E backend (dentro de um `worker_thread` do Node, não no
event loop principal).** Não runtime real em subprocesso isolado.

### Por que não subprocesso isolado

É a opção "mais fiel", mas o custo real não é trocar uma lib — é **infraestrutura nova**. Hoje
o deploy de produção é um VPS único (`docker-compose.prod.yml`: Caddy + api + app + web + db,
tudo na mesma rede interna, sem orquestração). Um subprocesso Python sem sandboxing forte
(cgroups + seccomp + rootfs somente-leitura + sem rede + usuário sem privilégio) tem uma
superfície de escape maior que o `node:vm` atual — e mesmo com esse endurecimento, o processo
Python continua no **mesmo container/kernel** que atende os outros tenants: um escape compromete
a API inteira, não só a execução de código. Isolamento de verdade (gVisor, Firecracker, um
container por execução) é viável, mas é uma peça de infra que o time não opera hoje e que não
se justifica no estágio atual do produto (B2B, carga de escola, não escala de internet aberta).

### Por que Pyodide nos dois lados

- **Mesma lógica que já existe para JS**: front dá feedback num Web Worker isolado, **backend
  revalida** (regra que não muda) — só troca o motor de JS pra CPython-em-WASM, sem inventar um
  modelo novo de confiança.
- **WASM já é a sandbox**: sem acesso a filesystem real, sem rede, sem processo do SO por
  construção. Isso não substitui curadoria (G6 continua necessário — ver §3), mas o chão de
  risco já é mais baixo que subprocesso nativo, com zero infra nova (mesmo container da API).
- **Fidelidade real**: Pyodide é CPython de verdade (não uma reimplementação tipo Skulpt/Brython)
  — sintaxe, erros e biblioteca padrão são o Python de verdade que um aluno encontraria fora do
  Codinhos. Resolve a preocupação de "fidelidade" sem precisar de subprocesso.
- **G3 (tupla vs. lista): decisão de implementação revista durante a P1.** A ideia original era
  comparar `actual == expected` inteiramente dentro do Python. Na prática, isso obrigaria a
  reimplementar os 4 matchers (`equal`/`approx`/`contains`/`regex`) em Python — duplicação sem
  ganho real, já que nenhuma das 10 trilhas exige testar "é tupla, não lista" pra nota. Escolha
  mais simples e mais barata: o worker devolve `actual` **serializado por `json.dumps`** (tupla
  vira array, igual today em JS) e a comparação reusa os matchers de `@codinhos/runner` **tal
  como já existem**, sem código novo. Só de bônus, o worker também devolve `repr(actual)` (preserva
  `(1, 2)` vs `[1, 2]` na *exibição*, útil pra gestor debugar um desafio) e `type(actual).__name__`
  — sem afetar a nota. G3 "de verdade" (grading que EXIGE tupla) continua no horizonte, sem
  trilha esperando.

### Custos reais a não subestimar (para dimensionar a P1)

- **Bundle no front**: Pyodide core + stdlib pesa alguns MB (comprimido). Mesmo cuidado que o
  p5.js embarcado no D5 — empacotar local, não CDN, e confirmar que o Vite consegue levar isso
  pro Web Worker (mesmo tipo de atrito de build que `packages/runner` deu no D1).
  Repos/apps/app/... — os autores dos módulos de p5 já resolveram um caso parecido de asset WASM/binário embarcado ali, vale reaproveitar a técnica.
- **Instância quente no backend, não uma por request**: carregar o interpretador WASM do zero a
  cada submissão é lento demais. Precisa de uma instância Pyodide viva no processo da API,
  **recriando o namespace de globals a cada execução** (Pyodide permite rodar com um dicionário
  de globals novo por chamada, sem recarregar o runtime inteiro) — se isso vazar estado entre
  execuções de alunos diferentes é bug de segurança, não só de correção. É o item de maior risco
  de implementação da P1.
- **Timeout não é de graça como no `node:vm`**: `vm.runInContext(..., {timeout})` interrompe
  synchronous JS nativamente; WASM não tem esse mecanismo pronto. Um loop infinito em Python só
  para matando o `worker_thread` inteiro (`.terminate()`) e recriando a instância — mais caro que
  interromper um contexto (perde o estado quente), mas é o único jeito confiável. Front já tem
  esse padrão (mata o Worker). Precisa existir explicitamente no backend também.
- **Concorrência**: um processo Node é single-thread pro JS; várias submissões Python
  simultâneas competem pelo mesmo `worker_thread` (ou precisam de um pool pequeno). Para a carga
  de uma escola por vez isso é folga suficiente; registrar como limite conhecido, não resolver
  agora.

Nenhum desses pontos muda a decisão — são os itens que vão para as tarefas da P1, igual o D1 de
JS teve "atrito de build do Worker" como a parte mais chata mesmo sendo esforço "P" no headline.

### P1 — backend validado por spike (11/07/2026)

Antes de mexer no `run-tests.ts`/schema/UI, os pontos de risco acima foram testados isoladamente
(script fora do repo, `loadPyodide` real, `node:worker_threads` real — não é estimativa):

- **Load frio: ~4s** (medido 3,9-4,2s neste hardware). **Execução em worker já quente: ~7-10ms.**
  Confirma que precisa de pool de workers vivos — um worker por submissão é inviável.
- **Isolamento de namespace confirmado**: rodando com um `dict()` novo por execução
  (`pyodide.globals.get('dict')()` passado como `globals` de `runPython`), uma variável de uma
  execução **não aparece** na próxima (`NameError`, como deveria). Sem isso, vaza.
- **Timeout confirmado**: `while True: pass` bloqueia a thread inteira (WASM síncrono não é
  interrompível de dentro) — só `worker.terminate()` de fora recupera. Depois disso, a PRÓXIMA
  submissão naquele slot paga o load frio (~4s) de novo enquanto um substituto sobe — por isso o
  pool precisa de mais de 1 worker (um travando não trava a fila inteira).
- **Comparação por JSON funciona bem**: `json.dumps`/`json.loads` faz o round-trip
  Python→JS→matchers-existentes sem problema pra número/string/bool/None/lista/dict — inclusive
  **dict com chave em ordem diferente já compara certo** (o `deepEqual` de `@codinhos/runner` já
  ordena chaves, D1 do motor JS) sem precisar de nada novo do lado Python.

**`packages/runner-python` criado** com essa base: `pool.ts` (pool de `worker_thread`, replace-on-timeout),
`python-exec.ts` (lógica pura de execução — mesma API `PyodideInterface` em Node e, no futuro,
browser), `python-worker.ts` (entry do worker_thread), `extract.ts` (equivalente Python do
`extractFunctionName`), `run-python-tests.ts` (dispatch dos 3 modos — function-call/type-check/stdout
— reusando `applyMatcher`/`normalizeOutput` de `@codinhos/runner`, zero lógica de comparação
duplicada). Os 9 cenários centrais (soma, targetFn implícito, tupla-vs-lista, exceção, type-check,
stdout limpando antes de chamar a função-alvo, isolamento entre execuções, timeout, recuperação
pós-timeout) foram validados batendo a lógica real contra Pyodide de verdade fora do repo (Node
com type-stripping, já que o sandbox não builda o workspace — ver nota abaixo). **Ainda não
verificado:** `tsc --noEmit` real do pacote (o sandbox não tem `pnpm`/`tsc` funcionais neste
projeto — precisa rodar na máquina local) e o comportamento em produção (Node 20 do Dockerfile,
não o Node 22 do spike — não deve ter diferença, mas não foi testado).

**Gap corrigido nesta sessão:** o `ready` de cada slot agora tem timeout próprio (20s, bem mais
folgado que o de execução) — se o Pyodide falhar ao carregar (bug de deploy/empacotamento), o
slot é descartado e substituído em vez de travar `run()` pra sempre. Validado por spike incluindo
o detalhe de unhandled rejection (um slot que rejeita `ready` enquanto ocioso no pool precisa de
um `.catch()` "grudado" nele desde a criação, senão o Node reporta erro não tratado mesmo que uma
chamada futura fosse tratar — achado ao testar o caminho de erro de propósito).

### 1.1 G7 resolvido — `mode: 'instance-call'` (12/07/2026)

Motivação: a trilha 9 (POO) inteira usava `mode:'stdout'` porque o motor só sabia "chamar a
primeira função declarada" — uma `class` não é uma função. Isso funciona, mas é mais fraco que
comparar o RETORNO de um método (fica sujeito a erro de formatação de `print`/`__str__`
contaminar a nota de algo que não é sobre formatação).

**O que foi adicionado**, mesmo padrão dos outros modos (function-call/type-check/stdout):

- `TestCase` (`packages/runner/src/types.ts`, tipo compartilhado JS/Python) ganhou
  `mode: 'instance-call'` + campos `className?`, `constructorArgs?`, `methodName?`. `input`
  continua sendo os argumentos do MÉTODO chamado (mesma convenção de array/valor único do
  function-call); `constructorArgs` são os argumentos do `__init__`.
- **Python** (`packages/runner-python`): `extract.ts` ganhou `extractClassName`/
  `resolveTargetClassPython` (equivalente a `resolveTargetFnPython`, primeira `class` na coluna 0
  se `className` não for informado). `python-exec.ts` ganhou o `PythonOp` `'instance'` e o script
  `INSTANCE_WRAPPER` (instancia a classe com `constructorArgs`, chama `methodName` com os args do
  método, serializa o retorno com o mesmo `__safe_json`/`json.dumps` do function-call — G3
  continua valendo, tupla vira array). `run-python-tests.ts` ganhou `runInstanceCase`, despachado
  quando `tc.mode === 'instance-call'`.
- **JavaScript** (`apps/api/src/shared/utils/run-tests.ts`): como o tipo é compartilhado, um
  desafio JS com `mode:'instance-call'` não pode simplesmente ser ignorado — ganhou um branch que
  reprova com mensagem clara ("ainda não suportado para JavaScript"). **Só Python implementa de
  verdade por enquanto** (JS não tem gap equivalente a G7 registrado — POO em JS não faz parte do
  currículo atual).
- **Front** (`apps/app/src/workers/sandbox.worker.ts`): nenhuma mudança necessária — o adaptador
  `PythonRunner` do Web Worker já repassa o `RunRequest` inteiro pra `handleRequest` sem filtrar
  campos, então os novos campos passam de graça.
- **Erros tratados**: classe não encontrada, método não encontrado na instância, e qualquer
  exceção do `__init__`/método (nome da exceção + mensagem, igual function-call).
- **Testes novos** em `run-python-tests.test.ts` (5 cenários: método simples usando atributo do
  construtor, `className` explícito + estado mutado entre leitura, método com argumento próprio,
  classe inexistente, método inexistente) — **não executados neste sandbox** (mesma limitação já
  documentada: sem Pyodide real aqui). Rodar `pnpm --filter @codinhos/runner-python test` na
  máquina local pra confirmar, mesmo fluxo do resto da P1.

**Não fiz nesta rodada:** não voltei a editar `seed-trilha-python-09.ts` pra usar o modo novo —
o Gabriel pediu só o motor, não re-tocar no conteúdo já escrito. A trilha 9 continua 100%
`stdout` como está; migrar os 8 desafios pra `instance-call` (mais preciso) é trabalho de
conteúdo futuro, não bloqueado por nada agora.

### 1.2 G5 resolvido — `mode: 'ast'` para Python (12/07/2026)

Motivação: a trilha 8 (Recursão) documentava `requireRecursion`/`forbidLoops` como regra
estrutural desejada em TODOS os 12 desafios com regra, mas rodava só `function-call` puro — sem
provar que a solução não "trapaceou" com `for`/`while` escondido.

**Implementação, mais simples que a versão JS por design** (Python tem parser de AST nativo, o
JS usa heurística de texto sobre código "limpo" — ver `packages/runner/src/ast.ts`):

- **Não executa o código do aluno.** `mode:'ast'` só faz `ast.parse(code)` — um `while True` no
  código nem chega a rodar. Caminho próprio em `handleAstCheck` (`python-exec.ts`), separado do
  `handleRequest` normal (que sempre executa `req.code` primeiro para os outros modos).
- Implementa os 6 `AstRuleKind` já existentes no tipo compartilhado (nenhum tipo novo):
  `forbidLoops`, `requireRecursion`, `requireMethod`, `forbidMethod`, `requireCall`, `forbidCall`
  — via `ast.walk()` percorrendo a árvore de verdade (`ast.For`/`ast.While`/`ast.Call`/
  `ast.FunctionDef`/etc.), não regex.
- **Fecha um loophole que a heurística de JS não cobre:** `forbidLoops` também conta list/set/dict
  comprehension e generator expression como laço (`ast.ListComp`/`SetComp`/`DictComp`/
  `GeneratorExp`) — sem isso, `sum([x for x in lista])` "trapacearia" um desafio de recursão sem
  usar a palavra `for` fora de uma comprehension. Decisão registrada no código
  (`python-exec.ts`), não pedida pelo desenho original da trilha 8, mas necessária pra a regra
  cumprir o que promete.
- `extract.ts` reaproveitado (`resolveTargetFnPython`, já existia) — `requireRecursion` busca a
  `FunctionDef` pelo nome resolvido e verifica se o próprio corpo dela contém uma `Call` pro seu
  próprio nome.
- **Validado fora do repo antes de integrar**: rodei a lógica EXATA do `AST_CHECK_WRAPPER`
  (copiada, não simplificada) contra Python 3.10 real no sandbox — 15 cenários (forbidLoops
  passa numa recursão de verdade / reprova com for / reprova com while / reprova com
  comprehension; requireRecursion passa/reprova/função não encontrada/nenhum alvo;
  requireMethod/forbidMethod distinguindo `.sort()` de `sorted()`; requireCall/forbidCall; erro de
  sintaxe) — todos corretos. Isso é análise estática, não depende de Pyodide/WASM pra validar a
  LÓGICA (só a integração com `pyodide.runPython`/globals precisa do teste real na máquina local).
- **Testes novos** em `run-python-tests.test.ts` (6 cenários via `runPythonTests`, integração
  real com Pyodide) — mesma ressalva de sempre: não executados neste sandbox.

**Não fiz:** não voltei a editar `seed-trilha-python-08.ts` pra usar `mode:'ast'` nos 12 desafios
documentados com regra estrutural — mesma decisão do G7, só motor nesta rodada.

### 1.3 G6 resolvido — allowlist de `import` (12/07/2026)

Motivação: até aqui, qualquer `import` funcionava sem restrição — o comentário já deixado em
`seed-trilha-python-10.ts` (trilha 10, capstone) registrava isso como pendência de hardening
antes de abrir a plataforma pra fora. `math`/`random`/`string` (trilha 10) e `functools` (trilha
7 — achado ao revisar o seed já escrito, não estava na lista original do §2 deste doc, que citava
só math/random/string) precisam continuar liberados; o resto da stdlib (em especial
`os`/`sys`/`subprocess`/`socket`) não faz parte do currículo por design e agora fica bloqueado de
verdade, não só "fora do desenho".

**Implementação, mesmo espírito do G5 (checagem estática, não confia em blocklist em tempo de
execução):**

- **Allowlist fechada** (`packages/runner-python/src/python-exec.ts`, `IMPORT_ALLOWLIST`):
  `['math', 'random', 'string', 'functools']`. É uma lista positiva (só o que está nela passa),
  não uma lista de nomes perigosos — mais simples de raciocinar sobre segurança ("o que é
  permitido" é uma pergunta menor que "o que é perigoso") e mais fácil de auditar quando uma
  trilha nova precisar de um módulo novo (um item a mais na lista).
- **Checagem via `ast.parse`, nunca executa o código** (`IMPORT_CHECK_WRAPPER`) — roda como um
  portão em `handleRequest`, ANTES de `pyodide.runPython(req.code, ...)`, pra TODOS os ops que de
  fato executam código (function/typecheck/stdout/instance). Um `import os` nem chega a rodar.
  Usa um dict de globals próprio (descartado depois), separado do namespace real do aluno — mesma
  disciplina de isolamento do resto do arquivo.
- Cobre `import x`, `import x.y` (checa a raiz `x`), `import x as y` (raiz, ignora o alias),
  `from x import y` e reprova explicitamente `from . import x` (import relativo, mensagem própria
  — não faz sentido em um script avulso de aluno). Detecta import dentro de função também (o
  `ast.walk` percorre a árvore inteira, não só o nível de módulo), não só import no topo do
  arquivo.
- **Não cobre import dinâmico** (`__import__('os')`, `importlib.import_module(...)`) — ast
  estático não pega chamada de função disfarçada de import. Fica por conta do isolamento do WASM
  em si (mesmo raciocínio de "defesa em profundidade, não confiar só nisso" do §1: mesmo que
  `__import__('os')` "funcionasse" sintaticamente, o Pyodide não dá acesso a filesystem/rede/
  processo real de qualquer forma — não é um bypass de segurança, só um buraco na CURADORIA
  pedagógica que fica registrado como limite conhecido, não resolvido agora).
- **Validado fora do repo antes de integrar** (mesma disciplina do G5): rodei a lógica exata do
  `IMPORT_CHECK_WRAPPER` contra Python 3.10 real no sandbox — 17 cenários (math/random/string/
  functools liberados incluindo `import math as m`; `os`/`sys`/`subprocess`/`socket` bloqueados;
  `import os.path` bloqueado pela raiz; `from os import path`/`from os import path as p`
  bloqueados; `from . import x`/`from .foo import x` como import relativo; `import math, os`
  bloqueado pelo `os`; import dentro de função também pego; código sem import nenhum passa) —
  todos corretos.
- **Testes novos** em `run-python-tests.test.ts` (8 cenários via `runPythonTests`, integração real
  com Pyodide) — mesma ressalva de sempre: não executados neste sandbox, rodar
  `pnpm --filter @codinhos/runner-python test` na máquina local pra confirmar.

**Não fiz:** não voltei a editar `seed-trilha-python-10.ts` (nem `-07.ts`) pra remover os
comentários que descreviam o G6 como pendência — ficam como registro histórico de quando foram
escritos; o comportamento real agora é o descrito aqui. Também não toquei em nenhum outro conteúdo
de trilha.

### 1.4 G2 resolvido — `input()` simulado via fila de stdin (12/07/2026)

Motivação: `input()` era só **mencionado** na trilha 1 (lição 2), nunca cobrado em teste — o
comentário deixado em `seed-trilha-python-01.ts`/`docs/trilha-python-01-primeiros-passos.md`
registrava isso como gap G2, justamente pra evitar ensinar um recurso que a plataforma não
conseguia testar de verdade. Sem stdin real dentro de um `worker_thread`/Web Worker, um `input()`
não interceptado travaria a execução esperando por uma entrada que nunca chega.

**Implementação — campo novo no `TestCase`, não um modo novo:**

- `TestCase` (`packages/runner/src/types.ts`, tipo compartilhado) ganhou `stdin?: string[]` — fila
  de respostas na ORDEM de consumo (1ª chamada de `input()` pega `stdin[0]`, e assim por diante).
  Ausente/vazio = qualquer `input()` reprova. Diferente de `mode` (que muda o TIPO de verificação),
  `stdin` é um parâmetro extra que vale pra QUALQUER execução real (function-call, type-check,
  stdout, instance-call) — por isso não é um `PythonOp` novo, é só mais um campo do `RunRequest`.
- **Sem mutar `builtins` (decisão de design deliberada):** a primeira ideia óbvia seria sobrescrever
  `builtins.input` — mas isso mutaria um módulo COMPARTILHADO por toda a instância Pyodide (que
  fica quente entre várias submissões no mesmo worker), quebrando a mesma disciplina de isolamento
  que o resto do arquivo já segue ("namespace isolado por execução"). Solução mais simples e mais
  segura: define `input` DIRETO no dict `g` isolado da execução (`STDIN_SETUP_WRAPPER`, roda ANTES
  de `req.code`, no MESMO `g`) — como `exec(code, g)` resolve um nome global primeiro em `g`, o
  `input()` do aluno encontra a versão simulada sem precisar tocar em nada global/compartilhado.
- **Fiel ao Python real:** escreve o prompt no stdout (`print(prompt, end="")`, mesmo buffer
  capturado por `pyodide.setStdout` no modo `stdout`) mas não ecoa a resposta digitada (isso é o
  terminal que ecoa, não o Python). Fila esgotada = `EOFError("EOF when reading a line")` — o
  MESMO erro que um `input()` real dá quando o stdin acaba (ex.: rodando um script com `< arquivo`
  e o arquivo tem menos linhas do que `input()` chamado) — propaga pro `catch` genérico que já
  envolve `pyodide.runPython(req.code, ...)`, sem precisar de nenhum tratamento especial de erro.
- **Cobre `input()` em qualquer lugar do código** — nível de módulo (ex.: `nome = input()` direto
  no topo do script) ou dentro de uma função definida pelo aluno, já que a função criada por
  `req.code` herda `g` como seu `__globals__`.
- **Validado fora do repo antes de integrar** (mesma disciplina do G5/G6): simulei a pipeline
  completa (setup + código do aluno + chamada de função, via `exec` com dict compartilhado, mesma
  semântica que `pyodide.runPython(..., {globals: g})` usa) contra Python 3.10 real no sandbox — 6
  cenários (dois `input()` em sequência preenchendo variáveis; fila esgotada vira `EOFError`;
  `input()` dentro de função; nenhum `input()` chamado não quebra nada; isolamento entre duas
  execuções em sequência, fila de uma não vaza pra outra) — todos corretos.
- **Testes novos** em `run-python-tests.test.ts` (4 cenários via `runPythonTests`: retorno de
  função que lê 2 valores via `input()`, fila esgotada, `input()` sem `stdin` nenhum configurado,
  isolamento entre submissões) — mesma ressalva de sempre: não executados neste sandbox.

**Não fiz:** não editei `seed-trilha-python-01.ts` pra passar a EXIGIR `input()` de verdade em
algum desafio — a trilha 1 continua exatamente como estava (menciona o recurso, não cobra em
teste). Agora que o motor suporta, isso é uma melhoria de conteúdo opcional pra uma sessão futura,
não urgente (nenhum aluno é prejudicado por `input()` continuar não-testado na trilha 1 — só deixa
de aproveitar uma capacidade nova).

### 1.5 G3 completo resolvido — `expectedType` (12/07/2026)

Motivação: a P1 já resolvia G3 "de graça" — `json.dumps`/`json.loads` faz o round-trip
Python→JS→matchers-existentes sem duplicar os 4 matchers em Python, mas isso significa que
`(1, 2)` (tuple) e `[1, 2]` (list) comparam como IGUAIS pro `applyMatcher` (JSON não distingue os
dois). Pra maioria dos desafios isso é o comportamento CERTO (o aluno não devia ser reprovado por
usar list onde uma tuple funcionaria igual) — mas nenhum mecanismo existia pra um desafio que
QUISESSE exigir tuple de propósito (ex.: ensinar por que uma função retorna coordenadas como tuple
"imutável" e não list). G3 completo fecha essa lacuna, como opção — não muda o comportamento
padrão de nenhum desafio existente.

**Implementação — campo novo no `TestCase`, checagem só na camada de comparação (TS), zero mudança
no lado Python:**

- `TestCase.expectedType?: string` (`packages/runner/src/types.ts`) — nome do tipo Python exigido
  (`'tuple'`, `'list'`, `'dict'`, `'set'`, `'str'`, `'int'`, `'float'`, `'bool'`, `'NoneType'`,
  confirmado contra `type(x).__name__` real do CPython). Ausente = comportamento clássico
  (só valor importa, retrocompatível — nenhum `testCase` existente muda de resultado).
- **Não precisou de nenhuma mudança em `python-exec.ts`** — `FUNCTION_WRAPPER`/`INSTANCE_WRAPPER`
  já calculavam `type(__result).__name__` desde a P1 (campo `actualType` do `RunResponse`, usado
  até agora só como metadado pra UI, nunca pra decidir a nota). G3 completo só passou a LER esse
  campo que já existia: `run-python-tests.ts` ganhou `checkExpectedType(expectedType, actualType)`,
  usado em `runFunctionCase`/`runInstanceCase` — as duas únicas ops com um valor de retorno real
  (`type-check` já É uma checagem de tipo por natureza; `stdout` não tem valor de retorno, só
  texto impresso; `ast` nunca executa código, não tem `actualType`).
- **Nota final = valor E tipo, mas a mensagem só aparece quando faz sentido:** `passed = valuePassed
  && typeOk`. Quando o VALOR já está errado, não adiciono nenhuma nota extra sobre tipo (a
  mensagem de "esperado vs. recebido" já basta, uma nota de tipo ali só confundiria). Só quando o
  valor bate mas o tipo não, preencho `TestResult.error`/`errorName` (campos que já existiam no
  tipo compartilhado, mas nunca eram usados pelo runner Python) com uma mensagem específica:
  `O valor está certo, mas o TIPO retornado precisa ser "X" — veio "Y".`
- **Limite conhecido, achado revisando o consumo desses campos no front:** `error`/`errorName` só
  chegam ao aluno no fluxo de "Executar" (Web Worker local, feedback instantâneo,
  `apps/app/src/pages/student/ChallengePage.tsx`) — `apps/api/src/modules/submissions/submissions.schema.ts`
  (`testResultSchema`) NÃO inclui esses dois campos, então numa submissão "Enviar solução"
  (persistida, revalidada no backend) a mensagem específica de tipo se perde: o aluno só vê
  `passed: false`, sem a explicação. Isso não é uma regressão desta mudança — `error`/`errorName`
  já existiam no tipo compartilhado sem NENHUM runner (JS ou Python) preenchê-los antes de agora, e
  o schema de submissão nunca os expôs. Registrado aqui como pendência de UX pra uma sessão futura
  (adicionar os dois campos em `testResultSchema` e no componente de exibição de submissão), fora
  do escopo desta rodada (só motor).
- **Sem execução Python nova pra validar** — diferente do G2/G5/G6, esta mudança é pura lógica TS
  em cima de um campo (`actualType`) que a P1 já validava com Pyodide real. Confirmei a função
  `checkExpectedType` isoladamente (4 combinações: sem `expectedType`; tipo bate; tipo não bate;
  `actualType` ausente) fora do Pyodide, já que não há Python novo envolvido.
- **Testes novos** em `run-python-tests.test.ts` (5 cenários via `runPythonTests`: tuple de
  verdade passa; list com valor certo mas tipo errado reprova com mensagem; sem `expectedType`
  continua aceitando list, retrocompatível; valor E tipo errados não duplicam a mensagem;
  funciona também em `instance-call`) — mesma ressalva de sempre: não executados neste sandbox.

**Não fiz:** não apliquei `expectedType` em nenhum `testCase` das 10 trilhas já semeadas — nenhuma
delas foi desenhada esperando essa exigência (a trilha 5, que mais fala de tupla vs. lista,
foi desenhada justamente para não depender disso, ver `docs/pesquisa-trilhas-python.md`). É um
recurso disponível pra conteúdo futuro, não uma correção de algo que estava quebrado.

---

## 2. Roadmap faseado (molde D1→D5)

Numeração própria (**P1→P5**) para não colidir com a numeração D1-D5 do motor JS — são trilhas
de evolução paralelas do mesmo motor.

| Fase | O que entra | Gaps fechados | Esforço | Destrava |
|---|---|---|---|---|
| **P1** | Runner Python (Pyodide front+back), 3 modos portados (function-call, type-check, stdout), comparação nativa em Python, timeout via terminate | **G1** (+ G3 quase de graça) | **G** | Trilhas 1-7 e 9 (nenhuma delas precisa de import, AST ou try/except) |
| **P2** | Seed das trilhas 1-7 e 9 (conteúdo, não motor) | — | M (conteúdo) | Primeiro valor real entregue — 9 de 10 trilhas no ar |
| **P3** | ~~AST estrutural pra Python~~ **RESOLVIDO fora de ordem, ver abaixo** | ~~**G5**~~ | M | Trilha 8 (Recursão) como desenhada, com "sem loop"/"usa recursão" de verdade |
| **P4** | ~~Allowlist de módulos (`math`/`random`/`string`; bloqueio explícito de `os`/`sys`/`subprocess`/`socket` como defesa em profundidade, não só confiar no sandbox WASM)~~ **RESOLVIDO fora de ordem, ver abaixo** | ~~**G6**~~ | P | Trilha 10 (capstone) e trilha 7 (`functools`) |
| **P5** | Seed das trilhas 8 e 10 (conteúdo) | — | P (conteúdo) | Fecha as 10 trilhas |
| **Horizonte** (sem trilha bloqueada hoje) | ~~G2 (stdin simulado)~~ **RESOLVIDO**, ~~G3 completo (marcador explícito de tipo esperado)~~ **RESOLVIDO**, G4 (modo de teste pra `try/except`) — ver §1.4/§1.5 | ~~G2~~, ~~G3(completo)~~, G4 | cada um P–M | Melhoria de qualidade, não desbloqueio — entram quando houver motivo de conteúdo, igual async/AST/p5 ficaram estacionados no motor JS até serem priorizados |

**G7, G5, G6, G2 e G3(completo) resolvidos fora de ordem (12/07/2026)** — ver §1.1-§1.5 acima.
Nenhum estava na sequência estrita P1→P5 no momento (G7/G2/G3-completo nem tinham fase própria,
eram horizonte; G5 era P3; G6 era P4), mas o Gabriel pediu pra fechar tudo que dava pra fechar
antes do primeiro seed — G7 melhora a precisão de nota da trilha 9 (hoje só `stdout`), G5 destrava
a trilha 8 completa como desenhada ("sem loop"/"usa recursão" verificado de verdade, não só
documentado), G6 fecha a allowlist de imports que a trilha 10 (e a 7, com `functools`) já
dependiam sem bloqueio real, G2 destrava `input()` como recurso testável de verdade (não mais só
mencionado), G3 completo dá a opção de EXIGIR tuple (ou outro tipo específico) quando algum
desafio futuro quiser. **Motor sem nenhum gap pendente pras 10 trilhas já desenhadas — falta só
rodar o primeiro seed.** Só G4 (try/except) segue no horizonte, sem nenhuma trilha esperando.

**Sequência:** P1 → P2 → P3 → P4 → P5; horizonte fica parado até ter motivo de conteúdo pra
puxar um item específico (mesmo padrão do "5. Horizonte maior" do motor JS).

---

## 3. G2-G7: antes ou depois do primeiro seed

Resposta curta: **só G1 bloqueou (já resolvido, P1). G2, G3(completo), G4, G5, G6 e G7 não
bloqueiam nenhuma das 10 trilhas hoje — todos os gaps com trilha esperando já foram resolvidos
(G5, G6, G7, G2 e G3-completo, fora de ordem, ver §1.1-§1.5).**

| Gap | Bloqueia o quê | Quando entra |
|---|---|---|
| G1 | Tudo | P1 — obrigatório antes de qualquer seed |
| G5 (AST) | ~~Trilha 8, como desenhada ("sem loop")~~ | **Resolvido em 12/07/2026, fora de ordem** — ver §1.2 |
| G6 (allowlist de módulos) | ~~Trilha 10 (capstone usa `math`/`random`/`string`) e trilha 7 (`functools`)~~ | **Resolvido em 12/07/2026, fora de ordem** — ver §1.3 |
| G3 (tupla vs. lista) | Nenhuma trilha depende disso pra nota | Resolvido em boa parte de graça na P1 (comparação nativa em Python); **versão completa (`expectedType`) também resolvida** — ver §1.5 |
| G2 (stdin) | ~~Nenhuma bloqueava pra nota — `input()` era só "sabia que existe" numa lição, não testável~~ | **Resolvido em 12/07/2026, fora de ordem** — ver §1.4 |
| G4 (try/except) | Nenhuma — tratamento de erro está fora do currículo por design | Horizonte, sem trilha esperando |
| G7 (instance-call) | Nenhuma — trilha 9 contorna com `stdout` por desenho | **Resolvido em 12/07/2026, fora de ordem** — ver §1.1 |

Consequência prática: depois da P1, **as 10 trilhas já podem ser semeadas e publicadas sem esperar
mais nada de motor** — G5 (trilha 8) e G6 (trilhas 7 e 10) foram os últimos gaps com trilha
esperando pra nota, e ambos foram resolvidos. G2 e G3(completo) não bloqueavam nenhuma trilha (só
eram recursos/precisões que nenhum desafio exigia), mas também foram resolvidos — `input()` é
testável de verdade e um desafio pode exigir `tuple` (ou outro tipo) explicitamente, se algum
conteúdo futuro quiser usar. **Só G4 (try/except) segue no horizonte, sem nenhuma trilha
bloqueada.**

---

## 4. Cuidados transversais

- **Backend revalida a nota** continua valendo — em Python isso significa que a instância
  Pyodide do backend não é "confiar no que o front mandou", é reexecutar de verdade.
- **Isolamento de namespace entre execuções é o item de maior risco da P1** — testar
  explicitamente que globals de uma submissão não vazam pra próxima (equivalente ao teste
  diferencial que já existe pro motor JS, mas aqui também precisa de um teste de "vazamento de
  estado" rodando duas submissões em sequência na mesma instância quente).
- **Verificação de desafios** (mesma disciplina de `docs/pesquisa-trilhas-python.md` §7): replicar
  o runner Python fora do banco e rodar a solução de referência de cada desafio contra os
  `testCases` antes de semear — vale ainda mais aqui, por ser runtime novo.
- **Auditoria "nada usado antes de ensinado"** dos 10 docs de trilha (item já planejado) deve
  rodar **depois** da P1 estar de pé, contra o runner real — não só contra o texto do desenho.
- Este documento não decide nomes de arquivo/branch da implementação — isso fica pra quando a
  P1 virar um plano de sprint (mesmo formato do §7 de `docs/motor-desafios-capacidades.md`, "D1
  detalhada").
