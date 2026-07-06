/**
 * Extrai o nome da função-alvo do código do aluno.
 *
 * Fonte única — antes duplicado em apps/api/.../run-tests.ts e
 * apps/app/.../sandbox.worker.ts.
 *
 * Ordem de resolução (ver resolveTargetFn):
 *  1. targetFn declarado no desafio, se presente e existir no código;
 *  2. senão, a primeira função declarada (function ou arrow).
 */

/** Nome da primeira função declarada no código (function ou arrow), ou null. */
export function extractFunctionName(code: string): string | null {
  const fnDecl = code.match(/function\s+([a-zA-Z_$][\w$]*)\s*\(/)
  if (fnDecl) return fnDecl[1]
  const arrow = code.match(
    /(?:const|let)\s+([a-zA-Z_$][\w$]*)\s*=\s*(?:\([^)]*\)|[a-zA-Z_$][\w$]*)\s*=>/,
  )
  if (arrow) return arrow[1]
  return null
}

/**
 * Resolve qual função deve ser chamada nos testes.
 * targetFn (do desafio) tem prioridade; cai para a primeira declarada.
 * A verificação de que a função realmente existe após executar o código
 * fica a cargo de quem executa (back ou worker).
 */
export function resolveTargetFn(code: string, targetFn?: string | null): string | null {
  if (targetFn && targetFn.trim()) return targetFn.trim()
  return extractFunctionName(code)
}
