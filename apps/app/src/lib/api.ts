// ─── Cliente de API ───────────────────────────────────────────────────────────
//
// Wrapper sobre fetch que:
// - Usa VITE_API_URL como base
// - Inclui credenciais (cookie de sessão httpOnly)
// - Lança ApiError em respostas de erro (4xx / 5xx)

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333'

// ─── Tipos ────────────────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export interface ApiResponse<T> {
  data: T
}

export interface ApiErrorResponse {
  error: { code: string; message: string }
}

// ─── Função base ──────────────────────────────────────────────────────────────

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${BASE_URL}${path}`

  const res = await fetch(url, {
    ...options,
    credentials: 'include', // envia o cookie sessionId httpOnly
    headers: {
      // Content-Type só quando há body — evita FST_ERR_CTP_EMPTY_JSON_BODY no DELETE
      ...(options.body !== undefined && { 'Content-Type': 'application/json' }),
      ...options.headers,
    },
  })

  if (!res.ok) {
    let code = 'UNKNOWN_ERROR'
    let message = `HTTP ${res.status}`

    try {
      const body = (await res.json()) as ApiErrorResponse
      code = body.error?.code ?? code
      message = body.error?.message ?? message
    } catch {
      // body não é JSON — mantém valores padrão
    }

    throw new ApiError(res.status, code, message)
  }

  // 204 No Content — sem body
  if (res.status === 204) return undefined as T

  return res.json() as Promise<T>
}

// ─── Métodos HTTP ─────────────────────────────────────────────────────────────

export const api = {
  get<T>(path: string): Promise<T> {
    return request<T>(path)
  },

  post<T>(path: string, body?: unknown): Promise<T> {
    return request<T>(path, {
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  },

  patch<T>(path: string, body?: unknown): Promise<T> {
    return request<T>(path, {
      method: 'PATCH',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  },

  put<T>(path: string, body?: unknown): Promise<T> {
    return request<T>(path, {
      method: 'PUT',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  },

  delete<T>(path: string): Promise<T> {
    return request<T>(path, { method: 'DELETE' })
  },
}
