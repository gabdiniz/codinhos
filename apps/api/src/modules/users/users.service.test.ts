import { describe, it, expect, vi, beforeEach } from 'vitest'
import { importUsersFromCsv, generateUsersCsvTemplate } from './users.service.js'
import { findUserByEmailInTenant, createUser, createInviteToken } from './users.repository.js'
import { UnprocessableError } from '../../shared/errors/index.js'

// ─── Mocks ────────────────────────────────────────────────────────────────────
// Foco: importUsersFromCsv / generateUsersCsvTemplate (Sprint 1.1). Demais
// funções do módulo users não têm testes unitários ainda.

vi.mock('./users.repository.js', () => ({
  findUserById: vi.fn(),
  findUserByIdOnly: vi.fn(),
  findUserByEmailInTenant: vi.fn(),
  listUsers: vi.fn(),
  createUser: vi.fn(),
  updateUser: vi.fn(),
  setUserActive: vi.fn(),
  invalidatePendingInviteTokens: vi.fn(),
  findPendingInviteToken: vi.fn(),
  createInviteToken: vi.fn(),
  deleteOtherSessions: vi.fn(),
  deleteAllSessions: vi.fn(),
}))

vi.mock('../classes/classes.repository.js', () => ({
  findClassById: vi.fn(),
  findStudentCurrentClass: vi.fn(),
  addStudentToClass: vi.fn(),
  removeStudentFromClass: vi.fn(),
}))

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('hashed-password'),
    compare: vi.fn(),
  },
}))

const { mockSend } = vi.hoisted(() => ({ mockSend: vi.fn() }))
vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(() => ({ emails: { send: mockSend } })),
}))

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const tenantId = 'tenant-1'
const slug = 'escola-teste'

function fakeCreatedUser(input: { name: string; email: string; role: string }) {
  return {
    id: `user-${input.email}`,
    name: input.name,
    email: input.email,
    role: input.role,
    avatarUrl: null,
    isActive: true,
    createdAt: new Date(),
  }
}

// ─── Testes ───────────────────────────────────────────────────────────────────

describe('users.service — importUsersFromCsv', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSend.mockResolvedValue({})
  })

  it('deve lançar erro quando o conteúdo do CSV está vazio', async () => {
    await expect(importUsersFromCsv(tenantId, slug, '')).rejects.toThrow(UnprocessableError)
  })

  it('deve lançar erro quando o cabeçalho do CSV é inválido', async () => {
    const csv = 'nome,mail\nJoão,joao@escola.com'
    await expect(importUsersFromCsv(tenantId, slug, csv)).rejects.toThrow(UnprocessableError)
  })

  it('deve processar corretamente um CSV exportado do Excel com BOM UTF-8 no início', async () => {
    vi.mocked(findUserByEmailInTenant).mockResolvedValue(null)
    vi.mocked(createUser).mockImplementation(async (input: any) => fakeCreatedUser(input) as any)
    vi.mocked(createInviteToken).mockResolvedValue(undefined as any)

    const csv = '﻿name,email\nJoão Silva,joao@escola.com'
    const result = await importUsersFromCsv(tenantId, slug, csv)

    expect(result.data.created).toBe(1)
    expect(result.data.errors).toEqual([])
  })

  it('deve criar alunos válidos com role "student" e enviar e-mail de convite para cada um', async () => {
    vi.mocked(findUserByEmailInTenant).mockResolvedValue(null)
    vi.mocked(createUser).mockImplementation(async (input: any) => fakeCreatedUser(input) as any)
    vi.mocked(createInviteToken).mockResolvedValue(undefined as any)

    const csv = 'name,email\nJoão Silva,joao@escola.com\nMaria Souza,maria@escola.com'
    const result = await importUsersFromCsv(tenantId, slug, csv)

    expect(result.data.created).toBe(2)
    expect(result.data.skipped).toBe(0)
    expect(result.data.errors).toEqual([])
    expect(createUser).toHaveBeenCalledWith(
      expect.objectContaining({ tenantId, name: 'João Silva', email: 'joao@escola.com', role: 'student' }),
    )
    expect(mockSend).toHaveBeenCalledTimes(2)
  })

  it('deve ignorar (skip) e-mails já cadastrados no tenant, sem sobrescrever o usuário existente', async () => {
    vi.mocked(findUserByEmailInTenant).mockResolvedValue({ id: 'existing-id' } as any)

    const csv = 'name,email\nJoão Silva,joao@escola.com'
    const result = await importUsersFromCsv(tenantId, slug, csv)

    expect(result.data.created).toBe(0)
    expect(result.data.skipped).toBe(1)
    expect(createUser).not.toHaveBeenCalled()
  })

  it('deve reportar erro por linha sem interromper o processamento das demais linhas', async () => {
    vi.mocked(findUserByEmailInTenant).mockResolvedValue(null)
    vi.mocked(createUser).mockImplementation(async (input: any) => fakeCreatedUser(input) as any)
    vi.mocked(createInviteToken).mockResolvedValue(undefined as any)

    const csv = [
      'name,email',
      ',email-em-branco@escola.com', // nome em branco
      'Nome Sem Email', // formato inválido — sem vírgula
      'Nome Email Invalido,nao-e-email', // e-mail inválido
      'Valido Silva,valido@escola.com', // válido — deve ser criado
    ].join('\n')

    const result = await importUsersFromCsv(tenantId, slug, csv)

    expect(result.data.created).toBe(1)
    expect(result.data.errors).toEqual([
      { row: 2, reason: 'Nome em branco' },
      { row: 3, reason: 'Formato inválido — esperado "name,email"' },
      { row: 4, reason: 'E-mail inválido' },
    ])
  })

  it('deve registrar erro na linha e continuar quando a criação do usuário falha', async () => {
    vi.mocked(findUserByEmailInTenant).mockResolvedValue(null)
    vi.mocked(createUser).mockRejectedValueOnce(new Error('falha de banco'))

    const csv = 'name,email\nJoão Silva,joao@escola.com'
    const result = await importUsersFromCsv(tenantId, slug, csv)

    expect(result.data.created).toBe(0)
    expect(result.data.errors).toEqual([{ row: 2, reason: 'Erro ao criar usuário' }])
  })
})

describe('users.service — generateUsersCsvTemplate', () => {
  it('deve gerar o CSV-modelo com as colunas name,email', () => {
    const csv = generateUsersCsvTemplate()
    expect(csv.startsWith('name,email')).toBe(true)
    expect(csv).toContain('@')
  })
})
