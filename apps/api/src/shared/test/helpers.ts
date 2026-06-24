import type { FastifyInstance, InjectOptions, LightMyRequestResponse } from 'fastify'
import { createApp } from '../../app.js'

// ─── App singleton para testes ────────────────────────────────────────────────

let _app: FastifyInstance | null = null

/**
 * Retorna a instância do Fastify para testes.
 * Cria e aquece uma única instância compartilhada entre todos os testes.
 */
export async function getTestApp(): Promise<FastifyInstance> {
  if (!_app) {
    _app = await createApp()
    await _app.ready()
  }
  return _app
}

/**
 * Fecha a instância do app. Chamar em afterAll do teste mais externo.
 */
export async function closeTestApp(): Promise<void> {
  if (_app) {
    await _app.close()
    _app = null
  }
}

// ─── Inject helpers ───────────────────────────────────────────────────────────

type InjectWithSession = InjectOptions & { sessionId?: string }

/**
 * Wrapper sobre app.inject que injeta automaticamente o cookie de sessão.
 *
 * @example
 * const res = await inject(app, {
 *   method: 'GET',
 *   url: '/api/escola/auth/me',
 *   sessionId: managerSessionId,
 * })
 */
// Anotação explícita: o tipo de retorno de app.inject() vem de 'light-my-request'
// e o TS não consegue nomear esse tipo sozinho (TS2742) sem essa importação direta.
export async function inject(
  app: FastifyInstance,
  opts: InjectWithSession,
): Promise<LightMyRequestResponse> {
  const { sessionId, ...rest } = opts

  return app.inject({
    ...rest,
    headers: {
      ...rest.headers,
      ...(sessionId ? { cookie: `sessionId=${sessionId}` } : {}),
    },
  })
}

/**
 * Extrai o sessionId do header Set-Cookie de uma resposta de login.
 */
export function extractSessionCookie(setCookieHeader: string | string[] | undefined): string {
  const header = Array.isArray(setCookieHeader) ? setCookieHeader[0] : setCookieHeader
  if (!header) throw new Error('Set-Cookie header não encontrado na resposta')

  const match = header.match(/sessionId=([^;]+)/)
  if (!match?.[1]) throw new Error('sessionId não encontrado no cookie')

  return match[1]
}
