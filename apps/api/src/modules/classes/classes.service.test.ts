import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getClasses,
  getClassDetail,
  getClassTeachers,
  assignTeacher,
  removeTeacher,
} from './classes.service.js'
import {
  listClasses,
  findClassById,
  countClassStudents,
  countClassTrails,
  listClassTeachers,
  findClassTeacher,
  addTeacherToClass,
  removeTeacherFromClass,
  listTeacherClassIds,
  isClassAssignedToTeacher,
} from './classes.repository.js'
import { findUserById } from '../users/users.repository.js'
import { NotFoundError, ConflictError, UnprocessableError } from '../../shared/errors/index.js'

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('./classes.repository.js', () => ({
  listClasses: vi.fn(),
  findClassById: vi.fn(),
  countClassStudents: vi.fn(),
  countClassTrails: vi.fn(),
  listClassTeachers: vi.fn(),
  findClassTeacher: vi.fn(),
  addTeacherToClass: vi.fn(),
  removeTeacherFromClass: vi.fn(),
  listTeacherClassIds: vi.fn(),
  isClassAssignedToTeacher: vi.fn(),
}))

vi.mock('../users/users.repository.js', () => ({
  findUserById: vi.fn(),
}))

vi.mock('../tenant-trails/tenant-trails.repository.js', () => ({
  findTenantTrail: vi.fn(),
}))

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const tenantId = 'tenant-1'
const classId = 'class-1'
const teacherId = 'teacher-1'
const managerActor = { role: 'manager', userId: 'manager-1' }
const teacherActor = { role: 'professor', userId: teacherId }

const cls = {
  id: classId,
  tenantId,
  name: 'Turma A',
  progressionMode: 'free' as const,
  validationMode: 'auto' as const,
  showRanking: true,
  createdAt: new Date().toISOString(),
}

const teacherUser = {
  id: teacherId,
  tenantId,
  name: 'Prof. Ada',
  email: 'ada@test.com',
  role: 'professor' as const,
  avatarUrl: null,
  birthDate: null,
  isActive: true,
  createdAt: new Date(),
  passwordHash: 'x',
}

const existingLink = { id: 'ct-1', classId, teacherId, assignedAt: new Date() }

// ─── Testes ───────────────────────────────────────────────────────────────────

describe('classes.service — assignTeacher', () => {
  beforeEach(() => vi.clearAllMocks())

  it('vincula um professor à turma', async () => {
    vi.mocked(findClassById).mockResolvedValue(cls as any)
    vi.mocked(findUserById).mockResolvedValue(teacherUser as any)
    vi.mocked(findClassTeacher).mockResolvedValue(null)
    vi.mocked(addTeacherToClass).mockResolvedValue({
      id: 'ct-1',
      classId,
      teacherId,
      assignedAt: new Date().toISOString(),
    } as any)

    const result = await assignTeacher(classId, tenantId, { teacherId })

    expect(result.classTeacher.teacherId).toBe(teacherId)
    expect(addTeacherToClass).toHaveBeenCalledWith(classId, teacherId)
  })

  it('lança NotFound quando a turma não existe', async () => {
    vi.mocked(findClassById).mockResolvedValue(null)
    await expect(assignTeacher(classId, tenantId, { teacherId })).rejects.toThrow(NotFoundError)
  })

  it('lança NotFound quando o usuário não existe no tenant', async () => {
    vi.mocked(findClassById).mockResolvedValue(cls as any)
    vi.mocked(findUserById).mockResolvedValue(null)
    await expect(assignTeacher(classId, tenantId, { teacherId })).rejects.toThrow(NotFoundError)
  })

  it('lança Unprocessable quando o usuário não é professor', async () => {
    vi.mocked(findClassById).mockResolvedValue(cls as any)
    vi.mocked(findUserById).mockResolvedValue({ ...teacherUser, role: 'student' } as any)
    await expect(assignTeacher(classId, tenantId, { teacherId })).rejects.toThrow(UnprocessableError)
  })

  it('lança Conflict quando o professor já está vinculado', async () => {
    vi.mocked(findClassById).mockResolvedValue(cls as any)
    vi.mocked(findUserById).mockResolvedValue(teacherUser as any)
    vi.mocked(findClassTeacher).mockResolvedValue(existingLink as any)
    await expect(assignTeacher(classId, tenantId, { teacherId })).rejects.toThrow(ConflictError)
  })
})

describe('classes.service — removeTeacher', () => {
  beforeEach(() => vi.clearAllMocks())

  it('remove o vínculo existente', async () => {
    vi.mocked(findClassById).mockResolvedValue(cls as any)
    vi.mocked(findClassTeacher).mockResolvedValue(existingLink as any)
    vi.mocked(removeTeacherFromClass).mockResolvedValue(undefined as any)

    await removeTeacher(classId, teacherId, tenantId)

    expect(removeTeacherFromClass).toHaveBeenCalledWith(classId, teacherId)
  })

  it('lança NotFound quando o vínculo não existe', async () => {
    vi.mocked(findClassById).mockResolvedValue(cls as any)
    vi.mocked(findClassTeacher).mockResolvedValue(null)
    await expect(removeTeacher(classId, teacherId, tenantId)).rejects.toThrow(NotFoundError)
  })
})

describe('classes.service — getClassTeachers', () => {
  beforeEach(() => vi.clearAllMocks())

  it('lista professores da turma com total', async () => {
    vi.mocked(findClassById).mockResolvedValue(cls as any)
    vi.mocked(listClassTeachers).mockResolvedValue([
      { id: teacherId, name: 'Prof. Ada', email: 'ada@test.com', avatarUrl: null, isActive: true },
    ] as any)

    const result = await getClassTeachers(classId, tenantId, managerActor)

    expect(result.meta.total).toBe(1)
    expect(result.data[0]!.id).toBe(teacherId)
  })
})

describe('classes.service — escopo do professor nos reads', () => {
  beforeEach(() => vi.clearAllMocks())

  it('getClasses: gestor enxerga todas as turmas do tenant', async () => {
    vi.mocked(listClasses).mockResolvedValue([
      { id: 'class-1' },
      { id: 'class-2' },
    ] as any)

    const result = await getClasses(tenantId, managerActor)

    expect(result.data).toHaveLength(2)
    expect(listTeacherClassIds).not.toHaveBeenCalled()
  })

  it('getClasses: professor enxerga só as turmas atribuídas a ele', async () => {
    vi.mocked(listClasses).mockResolvedValue([
      { id: 'class-1' },
      { id: 'class-2' },
    ] as any)
    vi.mocked(listTeacherClassIds).mockResolvedValue(['class-2'])

    const result = await getClasses(tenantId, teacherActor)

    expect(result.data).toHaveLength(1)
    expect(result.data[0]!.id).toBe('class-2')
  })

  it('getClassDetail: professor sem vínculo recebe NotFound', async () => {
    vi.mocked(findClassById).mockResolvedValue(cls as any)
    vi.mocked(isClassAssignedToTeacher).mockResolvedValue(false)

    await expect(getClassDetail(classId, tenantId, teacherActor)).rejects.toThrow(NotFoundError)
  })

  it('getClassDetail: professor com vínculo recebe o detalhe', async () => {
    vi.mocked(findClassById).mockResolvedValue(cls as any)
    vi.mocked(isClassAssignedToTeacher).mockResolvedValue(true)
    vi.mocked(countClassStudents).mockResolvedValue(3)
    vi.mocked(countClassTrails).mockResolvedValue(2)

    const result = await getClassDetail(classId, tenantId, teacherActor)

    expect(result.studentsCount).toBe(3)
    expect(result.trailsCount).toBe(2)
  })

  it('getClassDetail: gestor não dispara checagem de vínculo', async () => {
    vi.mocked(findClassById).mockResolvedValue(cls as any)
    vi.mocked(countClassStudents).mockResolvedValue(0)
    vi.mocked(countClassTrails).mockResolvedValue(0)

    await getClassDetail(classId, tenantId, managerActor)

    expect(isClassAssignedToTeacher).not.toHaveBeenCalled()
  })
})
