# Trilha JS 12 — Tratamento de Erros e Robustez

Slug proposto `js-erros-e-robustez`. `order: 120`. Pré-requisito: bloco base (10–60) —
`js-funcoes`, `js-decisoes-e-repeticoes`, `js-numeros-e-objetos` (`parseInt`/`isNaN`),
`js-alta-ordem-e-funcional` (`.reduce`) e `js-sintaxe-moderna` (`?.`/`??`). Ver
`docs/pesquisa-trilhas-js.md`.

**Objetivo da trilha:** o aluno para de escrever código que "quebra" no primeiro imprevisto.
Reconhece operações que podem falhar (`JSON.parse`, conversões, dados que faltam), captura com
`try`/`catch`/`finally`, sinaliza com `throw`, e **previne** com validação e acesso seguro. Sai
escrevendo funções que sempre devolvem algo sensato.

**Pré-requisito de motor:** nenhum — `try`/`catch`/`finally`/`throw` são sintaxe pura, back≡front
(testado). **Restrição de verificação (G-JS2):** o motor compara **retorno**, então não dá para
afirmar "esta função *lança* erro" como critério (um `throw` não capturado faz o teste falhar).
**Todos os desafios testam o caminho tratado** — a função captura/valida e **retorna** valor
sensato. Modo **function-call**.

## Módulos

| # | Tipo | Título | Conceito novo | Revisão de | Teste |
|---|---|---|---|---|---|
| 1 | lição | Operações que quebram o programa | `JSON.parse("xyz")` ou acessar campo de `undefined` lançam erro | trilha 05 (objeto) | — |
| 2 | lição | `try`/`catch`: tentar com plano B | `try { ...arriscado } catch (e) { ...plano B }` | DR (`if`) | — |
| 3 | ER.1 | Parse seguro | `try { return JSON.parse(txt) } catch (e) { return null }` | 1, 2 | function-call (objeto/`null`) |
| 4 | ER.2 | Divisão protegida | `try { if (b===0) throw new Error("div zero"); return a/b } catch { return null }` | 2, 3 | function-call (número/`null`) |
| 5 | lição | `throw`: criar o próprio erro | `throw new Error("msg")`; a mensagem fica em `e.message` | 4, funcoes | — |
| 6 | ER.3 | Saque com mensagem | `try { if (valor>saldo) throw new Error("saldo insuficiente"); return saldo-valor } catch (e) { return e.message }` | 5, 4 | function-call (número/string) |
| 7 | lição | `finally`: roda de qualquer jeito | executa com ou sem erro — "encerrar/registrar" | 2 | — |
| 8 | ER.4 | Registro do processamento | `log.push` em `try`/`catch`/`finally`; retorna o `log` | 7, 04 (`.push`) | function-call (array) |
| 9 | lição | Prevenir em vez de remediar | validar entrada (`Array.isArray`) e acesso seguro (`?.`/`??`) | trilha 10 (`?.`/`??`), 1 | — |
| 10 | ER.5 | Configuração com padrão | `config?.preferencias?.tema ?? "claro"` | 9, trilha 10 | function-call (string) |
| 11 | ER.6 | Média que não quebra | `if (!Array.isArray(lista) \|\| lista.length===0) return 0` antes do cálculo | 9, trilha 06 (`.reduce`) | function-call (número) |
| 12 | lição | Previsível vs. inesperado | valide o que você controla; `try/catch` para o que foge (parse/conversão) | 9, 2 | — |
| 13 | ER.7 | Conversão robusta | `try { const n = parseInt(txt,10); if (isNaN(n)) throw new Error("nan"); return n } catch { return 0 }` | 12, 3, trilha 05 (`parseInt`/`isNaN`) | function-call (número) |
| 14 | ER.8 | [Fecha a trilha] Carrinho robusto | lista de `{nome, preco, qtd}` com campos ausentes: `Array.isArray` + `?.`/`??` + `try/catch`; retorna total | 10, 11, 13, trilha 10 (desestruturação) | function-call (número) |

**Vocabulário acumulado ao final:** + `try`/`catch`/`finally`, `throw new Error`, `e.message`,
`JSON.parse`, `Array.isArray`, guarda de entrada, acesso seguro aplicado a robustez.

**Nota de auditoria:** nenhum desafio exige "lançar erro" como critério — todos exigem **retornar**
o valor tratado (JSON-serializável). `Array.isArray` e `JSON.parse` são introduzidos em lição
antes do uso. `?.`/`??` vêm da trilha 10 (revisão aplicada), não são novidade aqui.
