import Anthropic from '@anthropic-ai/sdk'
import { AiServiceError, UnprocessableError } from '../../shared/errors/index.js'
import type { TestCase } from '../../shared/db/schema.js'
import { runTests } from '../../shared/utils/run-tests.js'
import type { GenerateChallengeBody } from './authoring.schema.js'

/**
 * Geração de desafios assistida por IA (D4).
 *
 * O modelo gera um rascunho estruturado (enunciado + testCases + SOLUÇÃO DE
 * REFERÊNCIA). Antes de devolver ao gestor, a solução é executada contra os
 * testCases no MESMO runner que corrige o aluno — se ela passa em todos, o
 * rascunho é marcado como "verificado". Se não, tenta uma vez mais realimentando
 * o erro. O gestor sempre revisa antes de salvar (nada é persistido aqui).
 */

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// Geração é de baixo volume (gestor) e sensível à correção → vale um modelo forte.
const GENERATION_MODEL = 'claude-sonnet-5'

const DIFFICULTY_XP: Record<'easy' | 'medium' | 'hard', number> = {
  easy: 10,
  medium: 15,
  hard: 20,
}

interface GeneratedDraft {
  title: string
  description: string
  starterCode: string
  targetFn: string | null
  difficulty: 'easy' | 'medium' | 'hard'
  testCases: TestCase[]
  referenceSolution: string
}

function buildSystemPrompt(): string {
  return `Você gera desafios de programação em JavaScript para a plataforma Codinhos, voltada a crianças de 11 a 14 anos.

## Sua saída
Responda APENAS com um objeto JSON válido (sem markdown, sem crases, sem texto antes ou depois), com exatamente estes campos:
{
  "title": "string curta",
  "description": "enunciado claro em português, 1-3 frases, do que o aluno deve fazer",
  "starterCode": "código inicial que o aluno vê (um esqueleto com comentário, SEM a resposta)",
  "targetFn": "nome da função avaliada" | null,
  "difficulty": "easy" | "medium" | "hard",
  "testMode": "call" | "stdout",
  "testCases": [ ... ],
  "referenceSolution": "código COMPLETO em JavaScript que resolve o desafio e passa em TODOS os testCases"
}

## Formato dos testCases
- Modo "call" (o aluno escreve uma função avaliada pelo RETORNO):
  - cada caso: { "input": [args...], "expected": <valor de retorno>, "description": "texto" }
  - "input" é SEMPRE um array com os argumentos, mesmo que seja um só (ex.: [5]).
  - "targetFn" deve ser o nome da função (ex.: "soma"), e o starterCode/solução declaram essa função.
- Modo "stdout" (o aluno IMPRIME com console.log; comparamos a SAÍDA):
  - cada caso: { "input": null, "expected": "linha1\\nlinha2", "description": "texto", "mode": "stdout" }
  - use \\n para separar linhas na string esperada. "targetFn" pode ser null (código no topo que imprime).
- Opcional em qualquer caso: "matcher": "approx" (números de ponto flutuante, com "tolerance": 0.01), "contains" ou "regex".

## Regras
- Gere de 2 a 4 testCases cobrindo casos normais e de borda.
- A "referenceSolution" DEVE passar em todos os testCases — confira mentalmente antes de responder.
- Linguagem simples e adequada à idade. Nada de bibliotecas externas, só JavaScript puro.
- Se pedirem modo "stdout", os testCases usam "mode": "stdout". Senão, use "call".
- NUNCA inclua a resposta dentro do starterCode.`
}

function buildUserPrompt(body: GenerateChallengeBody, feedback?: string): string {
  const parts = [`Tema do desafio: ${body.topic}`]
  if (body.difficulty) parts.push(`Dificuldade desejada: ${body.difficulty}`)
  if (body.testMode) parts.push(`Tipo de teste desejado: ${body.testMode}`)
  if (feedback) {
    parts.push(
      `\nO desafio que você gerou antes NÃO passou na verificação automática (a solução de referência falhou nos testes abaixo). Corrija os testCases e/ou a solução para que a solução passe em todos, e responda de novo com o JSON completo:\n${feedback}`,
    )
  }
  return parts.join('\n')
}

/** Extrai o primeiro objeto JSON do texto do modelo (tolera crases/markdown). */
function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  const raw = fenced ? fenced[1] : text
  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) {
    throw new UnprocessableError('A IA não retornou um desafio em formato válido. Tente de novo.')
  }
  try {
    return JSON.parse(raw.slice(start, end + 1))
  } catch {
    throw new UnprocessableError('A IA não retornou um desafio em formato válido. Tente de novo.')
  }
}

/** Valida o formato do rascunho retornado pela IA. */
function parseDraft(value: unknown): GeneratedDraft {
  const o = value as Record<string, unknown>
  const difficulty = o.difficulty === 'medium' || o.difficulty === 'hard' ? o.difficulty : 'easy'
  if (
    typeof o.title !== 'string' ||
    typeof o.description !== 'string' ||
    typeof o.referenceSolution !== 'string' ||
    !Array.isArray(o.testCases) ||
    o.testCases.length === 0
  ) {
    throw new UnprocessableError('A IA retornou um desafio incompleto. Tente de novo.')
  }
  return {
    title: o.title,
    description: o.description,
    starterCode: typeof o.starterCode === 'string' ? o.starterCode : '',
    targetFn: typeof o.targetFn === 'string' && o.targetFn.trim() ? o.targetFn.trim() : null,
    difficulty,
    testCases: o.testCases as TestCase[],
    referenceSolution: o.referenceSolution,
  }
}

async function callModel(body: GenerateChallengeBody, feedback?: string): Promise<GeneratedDraft> {
  let response: Anthropic.Message
  try {
    response = await anthropic.messages.create({
      model: GENERATION_MODEL,
      max_tokens: 2048,
      system: buildSystemPrompt(),
      messages: [{ role: 'user', content: buildUserPrompt(body, feedback) }],
    })
  } catch (err) {
    console.error('[challenge-gen] Falha ao chamar a API da Anthropic:', err)
    throw new AiServiceError()
  }
  const text = response.content[0]?.type === 'text' ? response.content[0].text : ''
  return parseDraft(extractJson(text))
}

/** Roda a solução de referência contra os testCases no runner. */
async function verifyDraft(draft: GeneratedDraft): Promise<{ verified: boolean; message: string }> {
  let allPassed = false
  let failing: string[] = []
  try {
    const { results, allPassed: ok } = await runTests(
      draft.referenceSolution,
      draft.testCases,
      draft.targetFn,
    )
    allPassed = ok
    failing = results
      .filter((r) => !r.passed)
      .map((r) => `- ${r.description}: esperado ${JSON.stringify(r.expected)}, obtido ${JSON.stringify(r.actual)}`)
  } catch (err) {
    failing = [`- Erro ao executar a solução: ${err instanceof Error ? err.message : String(err)}`]
  }

  return {
    verified: allPassed,
    message: allPassed
      ? 'Verificado: a solução de referência passa em todos os testes.'
      : `A solução gerada não passou na verificação:\n${failing.join('\n')}`,
  }
}

export async function generateChallenge(body: GenerateChallengeBody) {
  let draft = await callModel(body)
  let result = await verifyDraft(draft)

  // Uma retentativa realimentando o erro da verificação; adota o resultado dela.
  if (!result.verified) {
    draft = await callModel(body, result.message)
    result = await verifyDraft(draft)
  }

  return {
    challenge: {
      title: draft.title,
      description: draft.description,
      starterCode: draft.starterCode,
      targetFn: draft.targetFn,
      difficulty: draft.difficulty,
      baseXp: DIFFICULTY_XP[draft.difficulty],
      testCases: draft.testCases,
    },
    referenceSolution: draft.referenceSolution,
    verified: result.verified,
    message: result.message,
  }
}
