# Trilha JS 13 — Async/await e Promises

Slug proposto `js-async-await`. `order: 130`. Pré-requisito: `js-funcoes` (arrow),
`js-alta-ordem-e-funcional` (`.map`) e `js-erros-e-robustez` (`try`/`catch` para falhas em
`await`). Ver `docs/pesquisa-trilhas-js.md`.

**Objetivo da trilha:** o aluno entende o **mecanismo** do JavaScript assíncrono — uma `Promise` é
"um valor que chega depois", `.then` reage à chegada, `async`/`await` escrevem isso como
sequencial. Sai esperando várias promessas juntas (`Promise.all`) e tratando falhas assíncronas.

**Pré-requisito de motor:** nenhum — o motor aguarda a Promise de uma função `async` antes de
comparar (`resolveMaybeAsync`; `setTimeout` no `SAFE_GLOBALS`). Testado back≡front, inclusive a
extração de alvo de `async function` sem `targetFn`. Modo **function-call**; `expected` é o valor
**resolvido**, JSON-serializável.

**Limite honesto (G-JS4):** `fetch` está bloqueado no sandbox; os desafios **simulam** a espera
com `Promise.resolve` e `setTimeout`, não buscam dados de rede. Ensina o mecanismo por inteiro; só
não exercita I/O real.

## Módulos

| # | Tipo | Título | Conceito novo | Revisão de | Teste |
|---|---|---|---|---|---|
| 1 | lição | Por que existe código assíncrono | tarefas que demoram; "valores que chegam depois" (espera **simulada**) | funcoes | — |
| 2 | lição | `Promise` e `Promise.resolve` | uma `Promise` representa um valor futuro | 1 | — |
| 3 | AS.1 | Promessa pronta | `function jaResolvida(x) { return Promise.resolve(x) }` | 2 | function-call (async) |
| 4 | lição | `.then` e `.catch` | `p.then(v => ...)` / `.catch(e => ...)` | 3, funcoes (arrow) | — |
| 5 | AS.2 | Dobrar quando chegar | `Promise.resolve(x).then(n => n * 2)` | 4 | function-call (async) |
| 6 | lição | `async`/`await` | `async function`; `await p` pausa e devolve o valor | 3, 4 | — |
| 7 | AS.3 | Reescreva com `await` | `async function dobro(x) { const n = await Promise.resolve(x); return n*2 }` | 6, 5 | function-call (async) |
| 8 | AS.4 | Somar dois futuros | dois `await` em sequência | 7 | function-call (async) |
| 9 | lição | `Promise.all`: esperar várias | `await Promise.all([...])` devolve um array de resultados | 6, 04 (array) | — |
| 10 | AS.5 | Esperar todas | `await Promise.all(lista.map(x => Promise.resolve(x * x)))` | 9, trilha 06 (`.map`) | function-call (async, array) |
| 11 | lição | Esperar um tempo e tratar falhas | `new Promise(r => setTimeout(() => r(v), ms))`; `try/catch` em volta de `await` | trilha 12 (`try/catch`), 6 | — |
| 12 | AS.6 | `await` protegido | `try { if (!ok) throw new Error("x"); return await Promise.resolve("dado") } catch { return "falhou" }` | 11, trilha 12 | function-call (async) |
| 13 | AS.7 | [Fecha a trilha] Corrida de tarefas | `setTimeout` + `.map` + `Promise.all` + `await` | 10, 12 | function-call (async, array) |

**Vocabulário acumulado ao final:** + `Promise`, `Promise.resolve`, `.then`, `.catch`, `async`,
`await`, `Promise.all`, `setTimeout` em Promise, `try/catch` em código assíncrono.

**Nota de auditoria:** todo `expected` é o valor **resolvido** (número/array/string). O motor
aguarda via `resolveMaybeAsync` (timeout 3s; `setTimeout` usa 5–10ms). Nenhum desafio depende de
`fetch` — a assincronia é sempre simulada. `.map` vem da trilha 06; `try/catch`, da trilha 12.
