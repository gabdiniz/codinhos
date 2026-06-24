import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getMyStats, getClassRanking, getBadges } from './gamification.service.js'
import {
  findStudentStats,
  findEarnedBadges,
  findClassRankingConfig,
  listClassRanking,
  listBadgesWithEarnedStatus,
} from './gamification.repository.js'
import { findTenantSettings } from '../tenant-settings/tenant-settings.repository.js'
import { ForbiddenError, NotFoundError } from '../../shared/errors/index.js'

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('./gamification.repository.js', () => ({
  findStudentStats: vi.fn(),
  findEarnedBadges: vi.fn(),
  findClassRankingConfig: vi.fn(),
  listClassRanking: vi.fn(),
  listBadgesWithEarnedStatus: vi.fn(),
  countXpEvents: vi.fn(),
  listXpEvents: vi.fn(),
}))

vi.mock('../tenant-settings/tenant-settings.repository.js', () => ({
  findTenantSettings: vi.fn(),
}))

// ─── Testes ───────────────────────────────────────────────────────────────────

describe('gamification.service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── getMyStats ─────────────────────────────────────────────────────────────

  describe('getMyStats', () => {
    it('deve retornar valores padrão quando aluno não tem stats ainda', async () => {
      vi.mocked(findStudentStats).mockResolvedValue(null)
      vi.mocked(findEarnedBadges).mockResolvedValue([])

      const result = await getMyStats('student-id', 'tenant-id')

      expect(result.totalXp).toBe(0)
      expect(result.level).toBe(1)
      expect(result.currentStreak).toBe(0)
      expect(result.longestStreak).toBe(0)
      expect(result.badges).toEqual([])
    })

    it('deve retornar stats reais quando existem', async () => {
      vi.mocked(findStudentStats).mockResolvedValue({
        totalXp: 350,
        level: 4,
        currentStreak: 7,
        longestStreak: 14,
      })
      vi.mocked(findEarnedBadges).mockResolvedValue([])

      const result = await getMyStats('student-id', 'tenant-id')

      expect(result.totalXp).toBe(350)
      expect(result.level).toBe(4)
      expect(result.currentStreak).toBe(7)
      expect(result.longestStreak).toBe(14)
    })

    it('deve mapear badges com earnedAt em ISO string', async () => {
      vi.mocked(findStudentStats).mockResolvedValue(null)
      const earnedAt = new Date('2025-03-01T12:00:00Z')
      vi.mocked(findEarnedBadges).mockResolvedValue([
        { id: 'badge-1', slug: 'first-challenge', name: 'Primeiro Desafio', earnedAt },
      ])

      const result = await getMyStats('student-id', 'tenant-id')

      expect(result.badges).toHaveLength(1)
      expect(result.badges[0]!.id).toBe('badge-1')
      expect(result.badges[0]!.earnedAt).toBe(earnedAt.toISOString())
    })
  })

  // ── getClassRanking ────────────────────────────────────────────────────────

  describe('getClassRanking', () => {
    it('deve lançar NotFoundError quando turma não existe', async () => {
      vi.mocked(findClassRankingConfig).mockResolvedValue(null)

      await expect(
        getClassRanking('class-id', 'tenant-id', 'requester-id', 'student'),
      ).rejects.toBeInstanceOf(NotFoundError)
    })

    it('deve lançar ForbiddenError quando showRanking=false e role=student', async () => {
      vi.mocked(findClassRankingConfig).mockResolvedValue({
        showRanking: false,
      })

      await expect(
        getClassRanking('class-id', 'tenant-id', 'student-id', 'student'),
      ).rejects.toBeInstanceOf(ForbiddenError)
    })

    it('não deve lançar ForbiddenError quando showRanking=false e role=manager', async () => {
      vi.mocked(findClassRankingConfig).mockResolvedValue({
        showRanking: false,
      })
      vi.mocked(listClassRanking).mockResolvedValue([])

      const result = await getClassRanking('class-id', 'tenant-id', 'manager-id', 'manager')

      expect(result.ranking).toEqual([])
    })

    it('deve calcular posições e myPosition corretamente', async () => {
      vi.mocked(findClassRankingConfig).mockResolvedValue({
        showRanking: true,
      })
      vi.mocked(listClassRanking).mockResolvedValue([
        { studentId: 'a', name: 'Alice', avatarUrl: null, totalXp: 500, level: 6 },
        { studentId: 'b', name: 'Bob', avatarUrl: null, totalXp: 300, level: 4 },
        { studentId: 'c', name: 'Carol', avatarUrl: null, totalXp: 100, level: 2 },
      ])

      const result = await getClassRanking('class-id', 'tenant-id', 'b', 'student')

      expect(result.ranking[0]!.position).toBe(1)
      expect(result.ranking[0]!.student.name).toBe('Alice')
      expect(result.ranking[1]!.position).toBe(2)
      expect(result.myPosition).toBe(2) // Bob está na posição 2
    })

    it('deve retornar myPosition=null quando requester não está no ranking', async () => {
      vi.mocked(findClassRankingConfig).mockResolvedValue({
        showRanking: true,
      })
      vi.mocked(listClassRanking).mockResolvedValue([
        { studentId: 'a', name: 'Alice', avatarUrl: null, totalXp: 500, level: 6 },
      ])

      const result = await getClassRanking('class-id', 'tenant-id', 'manager-id', 'manager')

      expect(result.myPosition).toBeNull()
    })

    it('allowProfileView reflete o setting do tenant quando requester é aluno', async () => {
      vi.mocked(findClassRankingConfig).mockResolvedValue({ showRanking: true })
      vi.mocked(listClassRanking).mockResolvedValue([])
      vi.mocked(findTenantSettings).mockResolvedValue({
        id: 'tenant-id',
        name: 'Escola',
        plan: 'basic',
        theme: null,
        settings: { allow_student_profile_view: false },
      })

      const result = await getClassRanking('class-id', 'tenant-id', 'student-id', 'student')

      expect(result.allowProfileView).toBe(false)
    })

    it('allowProfileView é sempre true para manager, mesmo com tenant desativado', async () => {
      vi.mocked(findClassRankingConfig).mockResolvedValue({ showRanking: true })
      vi.mocked(listClassRanking).mockResolvedValue([])

      const result = await getClassRanking('class-id', 'tenant-id', 'manager-id', 'manager')

      expect(result.allowProfileView).toBe(true)
      expect(findTenantSettings).not.toHaveBeenCalled()
    })

    it('allowProfileView default é true quando tenant não tem setting salvo', async () => {
      vi.mocked(findClassRankingConfig).mockResolvedValue({ showRanking: true })
      vi.mocked(listClassRanking).mockResolvedValue([])
      vi.mocked(findTenantSettings).mockResolvedValue({
        id: 'tenant-id',
        name: 'Escola',
        plan: 'basic',
        theme: null,
        settings: {},
      })

      const result = await getClassRanking('class-id', 'tenant-id', 'student-id', 'student')

      expect(result.allowProfileView).toBe(true)
    })
  })

  // ── getBadges ──────────────────────────────────────────────────────────────

  describe('getBadges', () => {
    it('deve retornar earned=false para badges não conquistados', async () => {
      vi.mocked(listBadgesWithEarnedStatus).mockResolvedValue([
        {
          id: 'badge-1',
          slug: 'first-challenge',
          name: 'Primeiro Desafio',
          description: null,
          iconUrl: null,
          triggerType: 'challenge_count',
          triggerValue: 1,
          earnedAt: null,
        },
      ])

      const result = await getBadges('student-id', 'tenant-id')

      expect(result[0]!.earned).toBe(false)
      expect(result[0]!.earnedAt).toBeNull()
    })

    it('deve retornar earned=true com earnedAt em ISO string para badges conquistados', async () => {
      const earnedAt = new Date('2025-06-01T10:00:00Z')
      vi.mocked(listBadgesWithEarnedStatus).mockResolvedValue([
        {
          id: 'badge-1',
          slug: 'first-challenge',
          name: 'Primeiro Desafio',
          description: 'Completou o primeiro desafio',
          iconUrl: '/icons/first.svg',
          triggerType: 'challenge_count',
          triggerValue: 1,
          earnedAt,
        },
      ])

      const result = await getBadges('student-id', 'tenant-id')

      expect(result[0]!.earned).toBe(true)
      expect(result[0]!.earnedAt).toBe(earnedAt.toISOString())
    })
  })
})
