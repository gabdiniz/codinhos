/**
 * Verificação estrutural do código (D5b — "use recursão", "sem loop", "use map").
 *
 * NÃO é um parser/AST completo — para não trazer dependência ao pacote, fazemos
 * uma análise dirigida sobre o código LIMPO (sem comentários nem strings, para
 * não confundir a palavra `for` dentro de um comentário com um laço real). É puro
 * e compartilhado entre backend e worker, então back e front dão o mesmo veredito.
 */
import { resolveTargetFn } from './extract.js'

export type AstRuleKind = 'requireRecursion' | 'forbidLoops' | 'requireMethod' | 'forbidMethod'

export interface AstRule {
  kind: AstRuleKind
  /** Nome do método para requireMethod/forbidMethod (ex.: 'map'). */
  name?: string
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Substitui comentários e conteúdo de strings/templates por espaços (preservando
 * quebras de linha), para a análise não ser enganada por texto dentro deles.
 */
export function stripCommentsAndStrings(code: string): string {
  let out = ''
  let i = 0
  const n = code.length
  type State = 'code' | 'line' | 'block' | 'single' | 'double' | 'template'
  let state: State = 'code'

  while (i < n) {
    const c = code[i]
    const next = code[i + 1]

    if (state === 'code') {
      if (c === '/' && next === '/') { state = 'line'; out += '  '; i += 2; continue }
      if (c === '/' && next === '*') { state = 'block'; out += '  '; i += 2; continue }
      if (c === "'") { state = 'single'; out += ' '; i++; continue }
      if (c === '"') { state = 'double'; out += ' '; i++; continue }
      if (c === '`') { state = 'template'; out += ' '; i++; continue }
      out += c
      i++
      continue
    }

    if (state === 'line') {
      if (c === '\n') { state = 'code'; out += '\n'; i++; continue }
      out += ' '
      i++
      continue
    }

    if (state === 'block') {
      if (c === '*' && next === '/') { state = 'code'; out += '  '; i += 2; continue }
      out += c === '\n' ? '\n' : ' '
      i++
      continue
    }

    // dentro de string/template
    if (c === '\\') { out += '  '; i += 2; continue } // apaga a barra e o char escapado
    if (
      (state === 'single' && c === "'") ||
      (state === 'double' && c === '"') ||
      (state === 'template' && c === '`')
    ) {
      state = 'code'
      out += ' '
      i++
      continue
    }
    out += c === '\n' ? '\n' : ' '
    i++
  }
  return out
}

/** Extrai o corpo (entre chaves) da função-alvo, ou null se não tiver corpo com {}. */
function findFunctionBody(clean: string, fnName: string): string | null {
  const esc = escapeRegExp(fnName)
  const patterns = [
    new RegExp(`function\\s+${esc}\\s*\\([^)]*\\)\\s*\\{`),
    new RegExp(`\\b${esc}\\s*=\\s*(?:async\\s*)?function[^(]*\\([^)]*\\)\\s*\\{`),
    new RegExp(`\\b${esc}\\s*=\\s*(?:async\\s*)?\\([^)]*\\)\\s*=>\\s*\\{`),
    new RegExp(`\\b${esc}\\s*=\\s*(?:async\\s*)?[a-zA-Z_$][\\w$]*\\s*=>\\s*\\{`),
  ]
  for (const re of patterns) {
    const m = re.exec(clean)
    if (!m) continue
    const open = clean.indexOf('{', m.index + m[0].length - 1)
    if (open === -1) continue
    let depth = 0
    for (let i = open; i < clean.length; i++) {
      if (clean[i] === '{') depth++
      else if (clean[i] === '}') {
        depth--
        if (depth === 0) return clean.slice(open + 1, i)
      }
    }
    return clean.slice(open + 1)
  }
  return null
}

function usesMethod(clean: string, name: string): boolean {
  if (!name) return false
  return new RegExp(`\\.\\s*${escapeRegExp(name)}\\s*\\(`).test(clean)
}

/** Verifica uma regra estrutural. `passed` = regra satisfeita. */
export function checkAstRule(
  code: string,
  targetFn: string | null | undefined,
  rule: AstRule,
): { passed: boolean; message: string } {
  const clean = stripCommentsAndStrings(code)

  switch (rule.kind) {
    case 'forbidLoops': {
      const hasLoop = /\bfor\b/.test(clean) || /\bwhile\b/.test(clean) || usesMethod(clean, 'forEach')
      return hasLoop
        ? { passed: false, message: 'Este desafio pede para resolver SEM laços (for/while/forEach).' }
        : { passed: true, message: 'Nenhum laço usado.' }
    }
    case 'requireRecursion': {
      const fnName = resolveTargetFn(code, targetFn)
      if (!fnName) {
        return { passed: false, message: 'Declare uma função para poder usar recursão.' }
      }
      const esc = escapeRegExp(fnName)
      const body = findFunctionBody(clean, fnName)
      let calls: boolean
      if (body != null) {
        calls = new RegExp(`\\b${esc}\\s*\\(`).test(body)
      } else {
        // arrow de expressão (sem chaves): conta chamadas fora da declaração
        const isFnDecl = new RegExp(`function\\s+${esc}\\s*\\(`).test(clean)
        const total = (clean.match(new RegExp(`\\b${esc}\\s*\\(`, 'g')) ?? []).length
        calls = (isFnDecl ? total - 1 : total) >= 1
      }
      return calls
        ? { passed: true, message: `A função "${fnName}" usa recursão (chama a si mesma).` }
        : { passed: false, message: `A função "${fnName}" precisa chamar a si mesma (recursão).` }
    }
    case 'requireMethod': {
      const name = rule.name ?? ''
      return usesMethod(clean, name)
        ? { passed: true, message: `Usa .${name}() como pedido.` }
        : { passed: false, message: `Você precisa usar .${name}() neste desafio.` }
    }
    case 'forbidMethod': {
      const name = rule.name ?? ''
      return usesMethod(clean, name)
        ? { passed: false, message: `Não use .${name}() neste desafio.` }
        : { passed: true, message: `Não usou .${name}().` }
    }
    default:
      return { passed: false, message: 'Regra de estrutura desconhecida.' }
  }
}
