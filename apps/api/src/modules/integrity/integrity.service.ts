import { findLatestSubmissionsByClassChallenge } from './integrity.repository.js'

const SIMILARITY_THRESHOLD = 0.85
// Trechos muito curtos geram falso positivo fácil (ex.: dois alunos com o
// mesmo boilerplate vazio) — ignora comparações abaixo desse tamanho.
const MIN_NORMALIZED_LENGTH = 30

export type PlagiarismCandidate = {
  classId: string
  challengeId: string
  studentId: string
  studentName: string
  otherStudentName: string
  similarity: number
}

function normalizeCode(code: string): string {
  return code
    .replace(/\/\/.*$/gm, '') // comentários de linha
    .replace(/\/\*[\s\S]*?\*\//g, '') // comentários de bloco
    .replace(/\s+/g, ' ') // colapsa espaços/quebras de linha
    .trim()
    .toLowerCase()
}

function bigramCounts(str: string): Map<string, number> {
  const counts = new Map<string, number>()
  for (let i = 0; i < str.length - 1; i++) {
    const gram = str.slice(i, i + 2)
    counts.set(gram, (counts.get(gram) ?? 0) + 1)
  }
  return counts
}

/** Coeficiente de Dice sobre bigramas de caracteres — similaridade textual simples, 0 a 1. */
function diceSimilarity(a: string, b: string): number {
  if (a.length < 2 || b.length < 2) return a === b ? 1 : 0

  const gramsA = bigramCounts(a)
  const gramsB = bigramCounts(b)

  let intersection = 0
  for (const [gram, countA] of gramsA) {
    const countB = gramsB.get(gram)
    if (countB) intersection += Math.min(countA, countB)
  }

  let totalA = 0
  for (const n of gramsA.values()) totalA += n
  let totalB = 0
  for (const n of gramsB.values()) totalB += n

  return (2 * intersection) / (totalA + totalB)
}

/**
 * Compara a submissão mais recente de cada aluno, agrupando por turma + desafio,
 * e aponta pares com alta similaridade textual (possível cola).
 *
 * Heurística simples (Dice sobre bigramas, sem parsing de AST) — não é detecção
 * definitiva de plágio, é um sinal para o gestor investigar manualmente.
 */
export async function findPossiblePlagiarismCandidates(tenantId: string): Promise<PlagiarismCandidate[]> {
  const submissions = await findLatestSubmissionsByClassChallenge(tenantId)

  const groups = new Map<string, typeof submissions>()
  for (const sub of submissions) {
    const key = `${sub.classId}:${sub.challengeId}`
    const group = groups.get(key)
    if (group) group.push(sub)
    else groups.set(key, [sub])
  }

  const candidates: PlagiarismCandidate[] = []

  for (const group of groups.values()) {
    if (group.length < 2) continue

    const normalized = group.map((s) => ({ ...s, normalizedCode: normalizeCode(s.code) }))

    for (let i = 0; i < normalized.length; i++) {
      for (let j = i + 1; j < normalized.length; j++) {
        const a = normalized[i]!
        const b = normalized[j]!
        if (a.normalizedCode.length < MIN_NORMALIZED_LENGTH) continue
        if (b.normalizedCode.length < MIN_NORMALIZED_LENGTH) continue

        const similarity = diceSimilarity(a.normalizedCode, b.normalizedCode)
        if (similarity < SIMILARITY_THRESHOLD) continue

        // Um alerta para cada aluno do par, apontando o outro.
        candidates.push({
          classId: a.classId,
          challengeId: a.challengeId,
          studentId: a.studentId,
          studentName: a.studentName,
          otherStudentName: b.studentName,
          similarity,
        })
        candidates.push({
          classId: b.classId,
          challengeId: b.challengeId,
          studentId: b.studentId,
          studentName: b.studentName,
          otherStudentName: a.studentName,
          similarity,
        })
      }
    }
  }

  return candidates
}
