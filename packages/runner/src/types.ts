import type { AstRule } from './ast.js'
/**
 * Tipos compartilhados do runner de desafios.
 *
 * Fonte única usada tanto pelo backend (node:vm) quanto pelo Web Worker do
 * front (new Function). Só define contratos puros — nada de execução aqui.
 */

/** Estratégia de comparação entre o retorno do aluno e o esperado. */
export type Matcher = 'equal' | 'approx' | 'contains' | 'regex'

export interface TestCase {
  input: unknown
  expected: unknown
  description: string
  /** Estratégia de comparação. Ausente = 'equal' (retrocompatível). */
  matcher?: Matcher
  /** Tolerância para o matcher 'approx' (default 1e-9). */
  tolerance?: number
  /**
   * Modo de teste. Ausente = comportamento clássico (chamada de função quando
   * input é array; type-check quando input é null). 'stdout' compara a SAÍDA
   * impressa com console.log. 'ast' verifica a ESTRUTURA do código (ver astRule).
   * 'instance-call' instancia uma classe e chama um MÉTODO nela, comparando o
   * retorno (ver className/constructorArgs/methodName) — G7,
   * docs/motor-python-capacidades.md. Implementado hoje só no runner Python;
   * o runner JS reprova com mensagem clara em vez de quebrar (mesmo padrão
   * usado ali pro que ainda não tiver suporte).
   */
  mode?: 'stdout' | 'ast' | 'instance-call'
  /** Regra estrutural, usada quando mode === 'ast' (ex.: exigir recursão). */
  astRule?: AstRule
  /**
   * Usados só quando mode === 'instance-call'. `className` é opcional — sem
   * ele, o runner usa a primeira `class`/`class ...:` declarada no código
   * (mesma convenção de `targetFn` pra função). `methodName` é obrigatório.
   * `constructorArgs` são os argumentos do `__init__`/construtor (além de
   * self); `input` continua sendo os argumentos do MÉTODO chamado.
   */
  className?: string
  constructorArgs?: unknown[]
  methodName?: string
  /**
   * G2 (docs/motor-python-capacidades.md) — fila de respostas simuladas para
   * chamadas de `input()` no código do aluno, na ORDEM em que serão
   * consumidas (1ª chamada pega `stdin[0]`, 2ª pega `stdin[1]`, ...). Se o
   * código chamar `input()` mais vezes do que itens em `stdin`, a execução
   * reprova com `EOFError` (mesmo comportamento do Python real quando o
   * stdin acaba). Implementado hoje só no runner Python (`input()` não existe
   * em JS da mesma forma — nenhum desafio JS usa este campo); ausente ou
   * vazio = nenhuma resposta disponível, qualquer `input()` reprova.
   */
  stdin?: string[]
  /**
   * G3 completo (docs/motor-python-capacidades.md §1.5) — EXIGE que o valor
   * retornado seja de um tipo Python específico (`'tuple'`, `'list'`,
   * `'dict'`, `'set'`, `'str'`, `'int'`, `'float'`, `'bool'`, `'NoneType'`),
   * em cima da comparação de valor normal. Sem isso, `(1, 2)` e `[1, 2]`
   * comparam como iguais (round-trip via JSON não preserva o tipo — ver G3
   * "de graça" no doc mestre); com `expectedType: 'tuple'`, uma solução que
   * devolve `[1, 2]` reprova mesmo com o valor certo. Só faz sentido em
   * function-call/instance-call (que têm um valor de retorno real);
   * type-check já É uma checagem de tipo por natureza, não usa este campo;
   * stdout não tem valor de retorno pra checar. Implementado hoje só no
   * runner Python. Ausente = comportamento clássico (só valor importa).
   */
  expectedType?: string
}

export interface TestResult {
  passed: boolean
  input: unknown
  expected: unknown
  actual: unknown
  description: string
  error?: string
  /** err.name (ex.: "TypeError") — usado para humanizar a mensagem no front. */
  errorName?: string
}
