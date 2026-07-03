import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createSubmission } from './submissions.service.js'
import {
  findClassForSubmission,
  isStudentInClass,
  isChallengeInClass,
  findChallengeForSubmission,
  listTrailModuleIdsForChallenge,
  listModuleProgressForChallenge,
  countStudentSubmissionsForClass,
  hasStudentPassedChallenge,
  hasStudentAnySubmission,
  insertSubmission,
} from './submissions.repository.js'
import { computeModuleStatuses } from '../../shared/utils/progression.js'
import { runTests } from '../../shared/utils/run-tests.js'

// ─── Mocks ────────────────────────────────────────────────────────────────────
//
// Testa a decisão de STATUS por modo de validação (auto / auto_review / manual)
// isolando a lógica: mockamos o repositório, o runner e a progressão.
// Mantemos hasStudentAnySubmission=true (pula badge first_submission) e, no caso
// aprovado, hasStudentPassedChallenge=true (idempotente) — assim o fluxo de XP
// (com db.transaction) nunca é acionado e o teste não precisa de banco.

vi.mock('./submissions.repository.js', () => ({
  findClassForSubmission: vi.fn(),
  isStudentInClass: vi.fn(),
  isChallengeInClass: vi.fn(),
  findChallengeForSubmission: vi.fn(),
  listTrailModuleIdsForChallenge: vi.fn(),
  listModuleProgressForChallenge: vi.fn(),
  countStudentSubmissionsForClass: vi.fn(),
  hasStudentPassedChallenge: vi.fn(),
  hasStudentAnySubmission: vi.fn(),
  insertSubmission: vi.fn(),
  updateSubmissionStatus: vi.fn(),
  listSubmissions: vi.fn(),
  findSubmissionById: vi.fn(),
  findTenantSettings: vi.fn(),
  findStudentStatsRow: vi.fn(),
  listAllBadges: vi.fn(),
  findStudentBadgeIds: vi.fn(),
  countDistinctPassedChallenges: vi.fn(),
  upsertStudentStats: vi.fn(),
  insertXpEvent: vi.fn(),
  insertNotification: vi.fn(),
  insertStudentBadge: vi.fn(),
  upsertModuleProgress: vi.fn(),
}))

vi.mock('../../shared/utils/progression.js', () => ({
  computeModuleStatuses: vi.fn(),
}))

vi.mock('../../shared/utils/run-tests.js', () => ({
  runTests: vi.fn(),
}))

vi.mock('../classes/classes.repository.js', () => ({
  isClassAssignedToTeacher: vi.fn(),
}))

vi.mock('../../shared/db/index.js', () => ({
  db: { transaction: vi.fn() },
}))

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const tenantId = 'tenant-1'
const studentId = 'student-1'
const challengeId = 'challenge-1'
const moduleId = 'module-1'
const classId = 'class-1'

const body = { classId, code: 'function f(){ return 1 }' }

const testCases = [{ input: [1], expected: 1, description: 'ex' }]

type ClassRow = Awaited<ReturnType<typeof findClassForSubmission>>
type ChallengeRow = Awaited<ReturnType<typeof findChallengeForSubmission>>
type RunResult = ReturnType<typeof runTests>

function makeClass(validationMode: 'auto' | 'auto_review' | 'manual'): ClassRow {
  return { id: classId, validationMode, progressionMode: 'free' } as ClassRow
}

function makeChallenge(
  over: { testCases?: unknown; validationModeOverride?: 'auto' | 'auto_review' | 'manual' | null } = {},
): ChallengeRow {
  return {
    id: challengeId,
    moduleId,
    title: 'Desafio',
    baseXp: 10,
    testCases: over.testCases ?? testCases,
    validationModeOverride: over.validationModeOverride ?? null,
  } as ChallengeRow
}

// ─── Setup padrão ──────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(isStudentInClass).mockResolvedValue(true)
  vi.mocked(isChallengeInClass).mockResolvedValue(true)
  vi.mocked(listTrailModuleIdsForChallenge).mockResolvedValue([{ id: moduleId, order: 1 }])
  vi.mocked(listModuleProgressForChallenge).mockResolvedValue(new Map())
  vi.mocked(countStudentSubmissionsForClass).mockResolvedValue(0)
  vi.mocked(hasStudentAnySubmission).mockResolvedValue(true) // pula badge first_submission
  vi.mocked(hasStudentPassedChallenge).mockResolvedValue(false)
  vi.mocked(insertSubmission).mockResolvedValue({
    id: 'sub-1',
    submittedAt: new Date(),
  } as Awaited<ReturnType<typeof insertSubmission>>)
  // módulo sempre acessível
  vi.mocked(computeModuleStatuses).mockReturnValue(new Map([[moduleId, 'available' as const]]))
})

// ─── Testes ───────────────────────────────────────────────────────────────────

describe('submissions.service — createSubmission: status por modo de validação', () => {
  it('modo manual → under_review, sem rodar testes (testResults null)', async () => {
    vi.mocked(findClassForSubmission).mockResolvedValue(makeClass('manual'))
    vi.mocked(findChallengeForSubmission).mockResolvedValue(makeChallenge())

    const res = await createSubmission(tenantId, studentId, challengeId, body)

    expect(res.data.submission.status).toBe('under_review')
    expect(res.data.submission.testResults).toBeNull()
    expect(res.data.xpEarned).toBe(0)
    expect(runTests).not.toHaveBeenCalled()
    expect(vi.mocked(insertSubmission).mock.calls[0][0].status).toBe('under_review')
  })

  it('modo auto_review → under_review mesmo com todos os testes passando', async () => {
    vi.mocked(findClassForSubmission).mockResolvedValue(makeClass('auto_review'))
    vi.mocked(findChallengeForSubmission).mockResolvedValue(makeChallenge())
    vi.mocked(runTests).mockReturnValue({
      results: [{ passed: true, description: 'ex' }],
      allPassed: true,
    } as unknown as RunResult)

    const res = await createSubmission(tenantId, studentId, challengeId, body)

    expect(res.data.submission.status).toBe('under_review')
    expect(res.data.submission.testResults).not.toBeNull()
    expect(res.data.xpEarned).toBe(0)
    expect(runTests).toHaveBeenCalledOnce()
  })

  it('modo auto + testes falham → failed', async () => {
    vi.mocked(findClassForSubmission).mockResolvedValue(makeClass('auto'))
    vi.mocked(findChallengeForSubmission).mockResolvedValue(makeChallenge())
    vi.mocked(runTests).mockReturnValue({
      results: [{ passed: false, description: 'ex' }],
      allPassed: false,
    } as unknown as RunResult)

    const res = await createSubmission(tenantId, studentId, challengeId, body)

    expect(res.data.submission.status).toBe('failed')
    expect(res.data.xpEarned).toBe(0)
  })

  it('modo auto + testes passam (reenvio idempotente) → passed, sem novo XP', async () => {
    vi.mocked(findClassForSubmission).mockResolvedValue(makeClass('auto'))
    vi.mocked(findChallengeForSubmission).mockResolvedValue(makeChallenge())
    vi.mocked(hasStudentPassedChallenge).mockResolvedValue(true) // já passou antes → idempotente
    vi.mocked(runTests).mockReturnValue({
      results: [{ passed: true, description: 'ex' }],
      allPassed: true,
    } as unknown as RunResult)

    const res = await createSubmission(tenantId, studentId, challengeId, body)

    expect(res.data.submission.status).toBe('passed')
    expect(res.data.xpEarned).toBe(0)
  })

  it('validationModeOverride do desafio sobrepõe o modo da turma (turma auto, override manual)', async () => {
    vi.mocked(findClassForSubmission).mockResolvedValue(makeClass('auto'))
    vi.mocked(findChallengeForSubmission).mockResolvedValue(
      makeChallenge({ validationModeOverride: 'manual' }),
    )

    const res = await createSubmission(tenantId, studentId, challengeId, body)

    expect(res.data.submission.status).toBe('under_review')
    expect(runTests).not.toHaveBeenCalled()
  })

  it('auto_review sem casos de teste → under_review (não roda runner)', async () => {
    vi.mocked(findClassForSubmission).mockResolvedValue(makeClass('auto_review'))
    vi.mocked(findChallengeForSubmission).mockResolvedValue(makeChallenge({ testCases: [] }))

    const res = await createSubmission(tenantId, studentId, challengeId, body)

    expect(res.data.submission.status).toBe('under_review')
    expect(runTests).not.toHaveBeenCalled()
  })
})
