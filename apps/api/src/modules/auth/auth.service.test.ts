import { describe, it, expect, vi, beforeEach } from 'vitest'
import bcrypt from 'bcryptjs'
import { login, getMe } from './auth.service.js'
import {
  findUserByEmailAndTenant,
  findUserById,
  deleteExpiredSessions,
  createSession,
} from './auth.repository.js'
import {
  InvalidCredentialsError,
  AccountDisabledError,
  NotFoundError,
} from '../../shared/errors/index.js'

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('./auth.repository.js', () => ({
  findUserByEmailAndTenant: vi.fn(),
  findUserByEmailAndRole: vi.fn(),
  findUserById: vi.fn(),
  createSession: vi.fn(),
  deleteSession: vi.fn(),
  createPasswordResetToken: vi.fn(),
  findValidPasswordResetToken: vi.fn(),
  deleteExpiredSessions: vi.fn(),
}))

// Evita conexão com banco em testes unitários
vi.mock('../../shared/db/index.js', () => ({
  db: { transaction: vi.fn() },
}))

// Evita envio real de e-mail
vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: { send: vi.fn().mockResolvedValue({ id: 'email-id' }) },
  })),
}))

// Reply fake do Fastify para testes de login
const mockReply = {
  setCookie: vi.fn(),
  clearCookie: vi.fn(),
}

// Usuário ativo padrão reusável nos testes
const activeUser = {
  id: 'user-uuid',
  email: 'aluno@escola.com',
  name: 'Aluno Teste',
  role: 'student' as const,
  passwordHash: 'hash-qualquer',
  isActive: true,
  tenantId: 'tenant-uuid',
}

// ─── Testes ───────────────────────────────────────────────────────────────────

describe('auth.service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── login ──────────────────────────────────────────────────────────────────

  describe('login', () => {
    it('deve lançar InvalidCredentialsError quando usuário não existe no tenant', async () => {
      vi.mocked(findUserByEmailAndTenant).mockResolvedValue(null)

      await expect(
        login('tenant-uuid', { email: 'nao@existe.com', password: '123' }, mockReply as any),
      ).rejects.toBeInstanceOf(InvalidCredentialsError)
    })

    it('deve lançar AccountDisabledError quando usuário está desativado', async () => {
      vi.mocked(findUserByEmailAndTenant).mockResolvedValue({
        ...activeUser,
        isActive: false,
      })

      await expect(
        login('tenant-uuid', { email: activeUser.email, password: '123' }, mockReply as any),
      ).rejects.toBeInstanceOf(AccountDisabledError)
    })

    it('deve lançar InvalidCredentialsError quando senha está incorreta', async () => {
      vi.mocked(findUserByEmailAndTenant).mockResolvedValue(activeUser)
      vi.spyOn(bcrypt, 'compare').mockResolvedValue(false as never)

      await expect(
        login('tenant-uuid', { email: activeUser.email, password: 'senha-errada' }, mockReply as any),
      ).rejects.toBeInstanceOf(InvalidCredentialsError)
    })

    it('deve retornar user e setar cookie quando credenciais estão corretas', async () => {
      vi.mocked(findUserByEmailAndTenant).mockResolvedValue(activeUser)
      vi.spyOn(bcrypt, 'compare').mockResolvedValue(true as never)
      vi.mocked(deleteExpiredSessions).mockResolvedValue(undefined)
      vi.mocked(createSession).mockResolvedValue({ id: 'session-uuid' } as any)

      const result = await login(
        'tenant-uuid',
        { email: activeUser.email, password: 'senha-certa' },
        mockReply as any,
      )

      expect(result.user.id).toBe(activeUser.id)
      expect(result.user.email).toBe(activeUser.email)
      expect(result.user.role).toBe('student')
      expect(mockReply.setCookie).toHaveBeenCalledOnce()
      expect(mockReply.setCookie).toHaveBeenCalledWith('sessionId', 'session-uuid', expect.any(Object))
    })

    it('deve limpar sessões expiradas ao fazer login', async () => {
      vi.mocked(findUserByEmailAndTenant).mockResolvedValue(activeUser)
      vi.spyOn(bcrypt, 'compare').mockResolvedValue(true as never)
      vi.mocked(deleteExpiredSessions).mockResolvedValue(undefined)
      vi.mocked(createSession).mockResolvedValue({ id: 'session-uuid' } as any)

      await login('tenant-uuid', { email: activeUser.email, password: 'senha' }, mockReply as any)

      expect(deleteExpiredSessions).toHaveBeenCalledWith(activeUser.id)
    })
  })

  // ── getMe ──────────────────────────────────────────────────────────────────

  describe('getMe', () => {
    it('deve lançar NotFoundError quando usuário não existe', async () => {
      vi.mocked(findUserById).mockResolvedValue(null)

      await expect(getMe('id-inexistente')).rejects.toBeInstanceOf(NotFoundError)
    })

    it('deve retornar dados do usuário quando existe', async () => {
      const userData = {
        id: activeUser.id,
        email: activeUser.email,
        name: activeUser.name,
        role: activeUser.role,
        avatarUrl: null,
        isActive: true,
        tenantId: activeUser.tenantId,
      }
      vi.mocked(findUserById).mockResolvedValue(userData)

      const result = await getMe(activeUser.id)

      expect(result.user.id).toBe(activeUser.id)
      expect(result.user.email).toBe(activeUser.email)
    })
  })
})
