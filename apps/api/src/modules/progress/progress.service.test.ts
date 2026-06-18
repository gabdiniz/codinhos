import { describe, it, expect, vi, beforeEach } from 'vitest'
import { unlockModule } from './progress.service.js'
import {
  findModuleProgress,
  insertModuleProgress,
  updateModuleProgressUnlock,
  findModuleTrailId,
} from './progress.repository.js'
import { findClassById, findClassStudent, findClassTrail } from '../classes/classes.repository.js'
import { NotFoundError, ForbiddenError, ConflictError, BadRequestError } from '../../shared/errors/index.js'

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('./progress.repository.js', () => ({
  findModuleProgress: vi.fn(),
  insertModuleProgress: vi.fn(),
  updateModuleProgressUnlock: vi.fn(),
  findModuleTrailId: vi.fn(),
}))

vi.mock('../classes/classes.repository.js', () => ({
  findClassById: vi.fn(),
  findClassStudent: vi.fn(),
  findClassTrail: vi.fn(),
}))

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const tenantId = 'tenant-1'
const moduleId = 'module-1'
const studentId = 'student-1'
const classId = 'class-1'
const managerId = 'manager-1'

const controlledClass = {
  id: classId,
  tenantId,
  name: 'Turma A',
  progressionMode: 'controlled' as const,
  validationMode: 'auto' as const,
  showRanking: true,
  createdAt: new Date().toISOString(),
}

const freeClass = { ...controlledClass, progressionMode: 'free' as const }

const enrollment = { id: 'enroll-1', classId, studentId, joinedAt: new Date() }
const classTrail = { id: 'ct-1', classId, trailId: 'trail-1', order: 1, visualBlocksEnabled: false }

// ─── Testes ───────────────────────────────────────────────────────────────────

describe('progress.service — unlockModule', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deve criar um novo registro de progresso quando não existe nenhum para o aluno', async () => {
    vi.mocked(findClassById).mockResolvedValue(controlledClass as any)
    vi.mocked(findClassStudent).mockResolvedValue(enrollment as any)
    vi.mocked(findModuleTrailId).mockResolvedValue('trail-1')
    vi.mocked(findClassTrail).mockResolvedValue(classTrail as any)
    vi.mocked(findModuleProgress).mockResolvedValue(null)
    vi.mocked(insertModuleProgress).mockResolvedValue({
      id: 'mp-1',
      tenantId,
      studentId,
      moduleId,
      status: 'available',
      unlockedBy: managerId,
      unlockedAt: new Date(),
      completedAt: null,
    } as any)

    const result = await unlockModule(tenantId, moduleId, { studentId, classId }, managerId)

    expect(insertModuleProgress).toHaveBeenCalledWith({ tenantId, studentId, moduleId, unlockedBy: managerId })
    expect(updateModuleProgressUnlock).not.toHaveBeenCalled()
    expect(result.data.moduleProgress.status).toBe('available')
  })

  it('deve atualizar o registro existente quando o status é "locked", em vez de criar um novo', async () => {
    vi.mocked(findClassById).mockResolvedValue(controlledClass as any)
    vi.mocked(findClassStudent).mockResolvedValue(enrollment as any)
    vi.mocked(findModuleTrailId).mockResolvedValue('trail-1')
    vi.mocked(findClassTrail).mockResolvedValue(classTrail as any)
    vi.mocked(findModuleProgress).mockResolvedValue({ id: 'mp-1', status: 'locked' } as any)
    vi.mocked(updateModuleProgressUnlock).mockResolvedValue({
      id: 'mp-1',
      status: 'available',
      unlockedBy: managerId,
    } as any)

    await unlockModule(tenantId, moduleId, { studentId, classId }, managerId)

    expect(updateModuleProgressUnlock).toHaveBeenCalledWith('mp-1', tenantId, managerId)
    expect(insertModuleProgress).not.toHaveBeenCalled()
  })

  it('deve lançar 404 quando a turma não existe no tenant', async () => {
    vi.mocked(findClassById).mockResolvedValue(null)

    await expect(
      unlockModule(tenantId, moduleId, { studentId, classId }, managerId),
    ).rejects.toThrow(NotFoundError)
  })

  it('deve lançar 400 quando a turma não está no modo de progressão "controlled"', async () => {
    vi.mocked(findClassById).mockResolvedValue(freeClass as any)

    await expect(
      unlockModule(tenantId, moduleId, { studentId, classId }, managerId),
    ).rejects.toThrow(BadRequestError)
  })

  it('deve lançar 404 quando o aluno não está matriculado na turma', async () => {
    vi.mocked(findClassById).mockResolvedValue(controlledClass as any)
    vi.mocked(findClassStudent).mockResolvedValue(null)

    await expect(
      unlockModule(tenantId, moduleId, { studentId, classId }, managerId),
    ).rejects.toThrow(NotFoundError)
  })

  it('deve lançar 404 quando o módulo não existe no catálogo', async () => {
    vi.mocked(findClassById).mockResolvedValue(controlledClass as any)
    vi.mocked(findClassStudent).mockResolvedValue(enrollment as any)
    vi.mocked(findModuleTrailId).mockResolvedValue(null)

    await expect(
      unlockModule(tenantId, moduleId, { studentId, classId }, managerId),
    ).rejects.toThrow(NotFoundError)
  })

  it('deve lançar 403 quando o módulo não pertence a uma trilha atribuída à turma', async () => {
    vi.mocked(findClassById).mockResolvedValue(controlledClass as any)
    vi.mocked(findClassStudent).mockResolvedValue(enrollment as any)
    vi.mocked(findModuleTrailId).mockResolvedValue('trail-1')
    vi.mocked(findClassTrail).mockResolvedValue(null)

    await expect(
      unlockModule(tenantId, moduleId, { studentId, classId }, managerId),
    ).rejects.toThrow(ForbiddenError)
  })

  it('deve lançar 409 quando o módulo já está desbloqueado ou concluído para o aluno', async () => {
    vi.mocked(findClassById).mockResolvedValue(controlledClass as any)
    vi.mocked(findClassStudent).mockResolvedValue(enrollment as any)
    vi.mocked(findModuleTrailId).mockResolvedValue('trail-1')
    vi.mocked(findClassTrail).mockResolvedValue(classTrail as any)
    vi.mocked(findModuleProgress).mockResolvedValue({ id: 'mp-1', status: 'available' } as any)

    await expect(
      unlockModule(tenantId, moduleId, { studentId, classId }, managerId),
    ).rejects.toThrow(ConflictError)
  })
})
