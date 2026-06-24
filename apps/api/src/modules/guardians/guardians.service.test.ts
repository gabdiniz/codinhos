import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  createGuardian,
  linkStudent,
  unlinkStudent,
  getChildDetail,
  getChildren,
} from './guardians.service.js'
import {
  listGuardians,
  findGuardianById,
  listGuardianStudents,
  findGuardianStudentLink,
  insertGuardianStudent,
  deleteGuardianStudent,
  listChildrenWithStats,
} from './guardians.repository.js'
import { findUserByEmailInTenant, createUser, createInviteToken, findUserById } from '../users/users.repository.js'
import {
  findStudentForDashboard,
  findStudentStatsForDashboard,
  findStudentEarnedBadges,
  findStudentTrailProgress,
} from '../dashboard/dashboard.repository.js'
import { ConflictError, NotFoundError } from '../../shared/errors/index.js'

vi.mock('./guardians.repository.js', () => ({
  listGuardians: vi.fn(),
  findGuardianById: vi.fn(),
  listGuardianStudents: vi.fn(),
  findGuardianStudentLink: vi.fn(),
  insertGuardianStudent: vi.fn(),
  deleteGuardianStudent: vi.fn(),
  listChildrenWithStats: vi.fn(),
}))
vi.mock('../users/users.repository.js', () => ({
  findUserByEmailInTenant: vi.fn(),
  createUser: vi.fn(),
  createInviteToken: vi.fn(),
  findUserById: vi.fn(),
}))
vi.mock('../dashboard/dashboard.repository.js', () => ({
  findStudentForDashboard: vi.fn(),
  findStudentStatsForDashboard: vi.fn(),
  findStudentEarnedBadges: vi.fn(),
  findStudentTrailProgress: vi.fn(),
}))
vi.mock('resend', () => ({ Resend: vi.fn(() => ({ emails: { send: vi.fn() } })) }))

const tenantId = 'tenant-1'
const guardianId = 'guardian-1'
const studentId = 'student-1'
const student = { id: studentId, tenantId, name: 'Aluno', email: 'a@t.com', role: 'student', avatarUrl: null, birthDate: null, isActive: true, createdAt: new Date(), passwordHash: 'x' }
const guardianUser = { id: guardianId, name: 'Mãe', email: 'mae@t.com', role: 'guardian' }

describe('guardians.service — createGuardian', () => {
  beforeEach(() => vi.clearAllMocks())

  it('cria responsável, gera convite e vincula alunos', async () => {
    vi.mocked(findUserByEmailInTenant).mockResolvedValue(null)
    vi.mocked(findUserById).mockResolvedValue(student as any)
    vi.mocked(createUser).mockResolvedValue(guardianUser as any)
    vi.mocked(createInviteToken).mockResolvedValue(undefined as any)
    vi.mocked(insertGuardianStudent).mockResolvedValue({ id: 'gs-1', guardianId, studentId, createdAt: new Date().toISOString() } as any)

    const res = await createGuardian(tenantId, 'escola', { name: 'Mãe', email: 'mae@t.com', studentIds: [studentId] })

    expect(res.guardian.studentsCount).toBe(1)
    expect(createInviteToken).toHaveBeenCalled()
    expect(insertGuardianStudent).toHaveBeenCalledWith(tenantId, guardianId, studentId)
  })

  it('lança Conflict se o e-mail já existe', async () => {
    vi.mocked(findUserByEmailInTenant).mockResolvedValue({ id: 'x' } as any)
    await expect(createGuardian(tenantId, 'escola', { name: 'M', email: 'm@t.com' })).rejects.toThrow(ConflictError)
    expect(createUser).not.toHaveBeenCalled()
  })

  it('lança NotFound (e não cria usuário) se um studentId não é aluno', async () => {
    vi.mocked(findUserByEmailInTenant).mockResolvedValue(null)
    vi.mocked(findUserById).mockResolvedValue({ ...student, role: 'manager' } as any)
    await expect(createGuardian(tenantId, 'escola', { name: 'M', email: 'm@t.com', studentIds: [studentId] })).rejects.toThrow(NotFoundError)
    expect(createUser).not.toHaveBeenCalled()
  })
})

describe('guardians.service — vínculos', () => {
  beforeEach(() => vi.clearAllMocks())

  it('linkStudent: 409 se já vinculado', async () => {
    vi.mocked(findGuardianById).mockResolvedValue(guardianUser as any)
    vi.mocked(findUserById).mockResolvedValue(student as any)
    vi.mocked(findGuardianStudentLink).mockResolvedValue({ id: 'gs-1' } as any)
    await expect(linkStudent(guardianId, tenantId, { studentId })).rejects.toThrow(ConflictError)
  })

  it('unlinkStudent: 404 se vínculo inexistente', async () => {
    vi.mocked(findGuardianById).mockResolvedValue(guardianUser as any)
    vi.mocked(findGuardianStudentLink).mockResolvedValue(null)
    await expect(unlinkStudent(guardianId, studentId, tenantId)).rejects.toThrow(NotFoundError)
  })
})

describe('guardians.service — portal read-only', () => {
  beforeEach(() => vi.clearAllMocks())

  it('getChildDetail: 404 se o aluno não é filho vinculado', async () => {
    vi.mocked(findGuardianStudentLink).mockResolvedValue(null)
    await expect(getChildDetail(guardianId, tenantId, studentId)).rejects.toThrow(NotFoundError)
    expect(findStudentForDashboard).not.toHaveBeenCalled()
  })

  it('getChildren: mapeia stats com defaults', async () => {
    vi.mocked(listChildrenWithStats).mockResolvedValue([
      { id: studentId, name: 'Aluno', avatarUrl: null, totalXp: null, level: null, currentStreak: null, lastActivity: null },
    ] as any)
    const res = await getChildren(guardianId, tenantId)
    expect(res.data[0]!.level).toBe(1)
    expect(res.data[0]!.totalXp).toBe(0)
  })
})
