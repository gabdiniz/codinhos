import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getStudentProfile } from './student-profile.service.js'
import { findUserById } from '../users/users.repository.js'
import { findStudentCurrentClass } from '../classes/classes.repository.js'
import { findStudentStats, findEarnedBadges } from '../gamification/gamification.repository.js'
import { findTenantSettings } from '../tenant-settings/tenant-settings.repository.js'
import { ForbiddenError, NotFoundError } from '../../shared/errors/index.js'

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('../users/users.repository.js', () => ({
  findUserById: vi.fn(),
}))

vi.mock('../classes/classes.repository.js', () => ({
  findStudentCurrentClass: vi.fn(),
}))

vi.mock('../gamification/gamification.repository.js', () => ({
  findStudentStats: vi.fn(),
  findEarnedBadges: vi.fn(),
}))

vi.mock('../tenant-settings/tenant-settings.repository.js', () => ({
  findTenantSettings: vi.fn(),
}))

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const STUDENT = {
  id: 'student-id',
  tenantId: 'tenant-id',
  name: 'Ana Silva',
  email: 'ana@escola.com',
  role: 'student' as const,
  avatarUrl: null,
  birthDate: '2013-06-01',
  isActive: true,
  createdAt: new Date('2025-01-10T00:00:00Z'),
  passwordHash: 'hash',
}

function mockHappyPath() {
  vi.mocked(findUserById).mockResolvedValue(STUDENT)
  vi.mocked(findStudentCurrentClass).mockResolvedValue({ id: 'class-id', name: '6º Ano A' })
  vi.mocked(findStudentStats).mockResolvedValue({
    totalXp: 350,
    level: 4,
    currentStreak: 7,
    longestStreak: 14,
  })
  vi.mocked(findEarnedBadges).mockResolvedValue([])
}

// ─── Testes ───────────────────────────────────────────────────────────────────

describe('student-profile.service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getStudentProfile', () => {
    it('deve lançar NotFoundError quando o usuário não existe no tenant', async () => {
      vi.mocked(findUserById).mockResolvedValue(null)

      await expect(
        getStudentProfile('student-id', 'tenant-id', 'manager-id', 'manager'),
      ).rejects.toBeInstanceOf(NotFoundError)
    })

    it('deve lançar NotFoundError quando o alvo não é um aluno', async () => {
      vi.mocked(findUserById).mockResolvedValue({ ...STUDENT, role: 'manager' })

      await expect(
        getStudentProfile('student-id', 'tenant-id', 'manager-id', 'manager'),
      ).rejects.toBeInstanceOf(NotFoundError)
    })

    it('gestor pode ver o perfil de qualquer aluno, mesmo com o toggle desativado', async () => {
      mockHappyPath()

      const result = await getStudentProfile('student-id', 'tenant-id', 'manager-id', 'manager')

      expect(result.email).toBe('ana@escola.com')
      expect(findTenantSettings).not.toHaveBeenCalled()
      expect(findStudentCurrentClass).not.toHaveBeenCalledWith('manager-id', 'tenant-id')
    })

    it('aluno pode sempre ver o próprio perfil, mesmo com o toggle desativado', async () => {
      mockHappyPath()
      vi.mocked(findTenantSettings).mockResolvedValue({
        id: 'tenant-id',
        name: 'Escola',
        plan: 'basic',
        theme: null,
        settings: { allow_student_profile_view: false },
      })

      const result = await getStudentProfile('student-id', 'tenant-id', 'student-id', 'student')

      expect(result.id).toBe('student-id')
      expect(findTenantSettings).not.toHaveBeenCalled()
    })

    it('deve lançar ForbiddenError quando aluno tenta ver colega e o toggle está desativado', async () => {
      mockHappyPath()
      vi.mocked(findTenantSettings).mockResolvedValue({
        id: 'tenant-id',
        name: 'Escola',
        plan: 'basic',
        theme: null,
        settings: { allow_student_profile_view: false },
      })

      await expect(
        getStudentProfile('student-id', 'tenant-id', 'other-student-id', 'student'),
      ).rejects.toBeInstanceOf(ForbiddenError)
    })

    it('deve lançar ForbiddenError quando aluno tenta ver colega de outra turma (defesa em profundidade)', async () => {
      mockHappyPath()
      vi.mocked(findTenantSettings).mockResolvedValue({
        id: 'tenant-id',
        name: 'Escola',
        plan: 'basic',
        theme: null,
        settings: { allow_student_profile_view: true },
      })
      vi.mocked(findStudentCurrentClass).mockImplementation(async (userId: string) =>
        userId === 'other-student-id' ? { id: 'class-a', name: 'Turma A' } : { id: 'class-b', name: 'Turma B' },
      )

      await expect(
        getStudentProfile('student-id', 'tenant-id', 'other-student-id', 'student'),
      ).rejects.toBeInstanceOf(ForbiddenError)
    })

    it('aluno pode ver colega da mesma turma quando o toggle está ativado', async () => {
      mockHappyPath()
      vi.mocked(findTenantSettings).mockResolvedValue({
        id: 'tenant-id',
        name: 'Escola',
        plan: 'basic',
        theme: null,
        settings: { allow_student_profile_view: true },
      })
      vi.mocked(findStudentCurrentClass).mockResolvedValue({ id: 'class-id', name: '6º Ano A' })

      const result = await getStudentProfile('student-id', 'tenant-id', 'other-student-id', 'student')

      expect(result.id).toBe('student-id')
      expect(result.email).toBeNull()
    })

    it('toggle ausente no tenant tem default true (opt-out)', async () => {
      mockHappyPath()
      vi.mocked(findTenantSettings).mockResolvedValue({
        id: 'tenant-id',
        name: 'Escola',
        plan: 'basic',
        theme: null,
        settings: null,
      })
      vi.mocked(findStudentCurrentClass).mockResolvedValue({ id: 'class-id', name: '6º Ano A' })

      const result = await getStudentProfile('student-id', 'tenant-id', 'other-student-id', 'student')

      expect(result.id).toBe('student-id')
    })

    it('aluno vendo colega não recebe email, birthDate nem createdAt', async () => {
      mockHappyPath()
      vi.mocked(findTenantSettings).mockResolvedValue({
        id: 'tenant-id',
        name: 'Escola',
        plan: 'basic',
        theme: null,
        settings: { allow_student_profile_view: true },
      })

      const result = await getStudentProfile('student-id', 'tenant-id', 'other-student-id', 'student')

      expect(result.email).toBeNull()
      expect(result.birthDate).toBeNull()
      expect(result.createdAt).toBeNull()
      // Dados básicos de ranking/identificação seguem visíveis
      expect(result.name).toBe('Ana Silva')
      expect(result.age).not.toBeNull()
    })

    it('gestor recebe email, birthDate e createdAt preenchidos', async () => {
      mockHappyPath()

      const result = await getStudentProfile('student-id', 'tenant-id', 'manager-id', 'manager')

      expect(result.email).toBe('ana@escola.com')
      expect(result.birthDate).toBe('2013-06-01')
      expect(result.createdAt).toBe(new Date('2025-01-10T00:00:00Z').toISOString())
    })

    it('deve mapear badges com earnedAt em ISO string', async () => {
      mockHappyPath()
      const earnedAt = new Date('2025-03-01T12:00:00Z')
      vi.mocked(findEarnedBadges).mockResolvedValue([
        { id: 'badge-1', slug: 'first-challenge', name: 'Primeiro Desafio', earnedAt },
      ])

      const result = await getStudentProfile('student-id', 'tenant-id', 'manager-id', 'manager')

      expect(result.badges).toHaveLength(1)
      expect(result.badges[0]!.earnedAt).toBe(earnedAt.toISOString())
    })

    it('deve retornar valores padrão (xp=0, level=1) quando aluno ainda não tem stats', async () => {
      mockHappyPath()
      vi.mocked(findStudentStats).mockResolvedValue(null)

      const result = await getStudentProfile('student-id', 'tenant-id', 'manager-id', 'manager')

      expect(result.totalXp).toBe(0)
      expect(result.level).toBe(1)
    })
  })
})
