/**
 * Extrai o nome da função-alvo do código Python do aluno.
 *
 * Equivalente ao extractFunctionName de @codinhos/runner (JS), mas mais
 * simples: Python só tem uma forma de declarar função (`def nome(`), sem a
 * variação function/arrow do JS. `^` (sem flag multiline com indentação)
 * garante que só pega `def` na COLUNA 0 — uma função aninhada dentro de outra
 * função/classe (indentada) não conta como "primeira função declarada".
 */
export function extractDefName(code: string): string | null {
  const match = code.match(/^def\s+([a-zA-Z_]\w*)\s*\(/m)
  return match ? match[1] : null
}

/**
 * Resolve qual função deve ser chamada nos testes.
 * targetFn (do desafio) tem prioridade; cai para a primeira `def` de topo.
 */
export function resolveTargetFnPython(code: string, targetFn?: string | null): string | null {
  if (targetFn && targetFn.trim()) return targetFn.trim()
  return extractDefName(code)
}

/**
 * Extrai o nome da PRIMEIRA classe declarada no código do aluno (G7 —
 * mode: 'instance-call'). Mesma lógica de `extractDefName`: só pega `class`
 * na COLUNA 0 (uma classe aninhada não conta). `class Nome:` e
 * `class Nome(Base):` batem os dois — o que vem depois do nome (herança ou
 * `:`) não importa aqui.
 */
export function extractClassName(code: string): string | null {
  const match = code.match(/^class\s+([a-zA-Z_]\w*)/m)
  return match ? match[1] : null
}

/**
 * Resolve qual classe deve ser instanciada nos testes.
 * className (do desafio) tem prioridade; cai para a primeira `class` de topo.
 */
export function resolveTargetClassPython(code: string, className?: string | null): string | null {
  if (className && className.trim()) return className.trim()
  return extractClassName(code)
}
