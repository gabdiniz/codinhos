import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react'
import { api, ApiError } from '../lib/api.ts'
import type { AvatarConfig } from '@codinhos/types'

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type UserRole = 'super_admin' | 'manager' | 'professor' | 'student' | 'guardian'

export interface CurrentUser {
  id: string
  name: string
  email: string
  role: UserRole
  avatarUrl: string | null
  avatarConfig: AvatarConfig | null
  isActive: boolean
}

interface AuthState {
  user: CurrentUser | null
  /** true enquanto a verificação de sessão inicial ainda está em andamento */
  loading: boolean
}

interface AuthContextValue extends AuthState {
  /** Atualiza o usuário no contexto (chamado após login bem-sucedido) */
  setUser: (user: CurrentUser | null) => void
  /** Limpa o estado — chamado após logout */
  logout: () => void
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null)

// ─── Provider ─────────────────────────────────────────────────────────────────

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUserState] = useState<CurrentUser | null>(null)
  const [loading, setLoading] = useState(true)

  /**
   * Na montagem, tenta recuperar o usuário logado via GET /me.
   * O slug é lido da URL para montar a rota correta.
   */
  useEffect(() => {
    const slug = extractSlugFromPath(window.location.pathname)
    if (!slug) {
      setLoading(false)
      return
    }

    api
      .get<{ data: { user: CurrentUser } }>(`/api/${slug}/auth/me`)
      .then(({ data }) => setUserState(data.user))
      .catch((err) => {
        // 401 = sem sessão — estado inicial normal, não é erro
        if (err instanceof ApiError && err.status === 401) return
        console.error('[auth] Falha ao verificar sessão:', err)
      })
      .finally(() => setLoading(false))
  }, [])

  const setUser = useCallback((u: CurrentUser | null) => {
    setUserState(u)
  }, [])

  const logout = useCallback(() => {
    setUserState(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>')
  return ctx
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Extrai o slug da URL: /:slug/... → 'escola-teste' */
function extractSlugFromPath(pathname: string): string | null {
  // Remove leading slash e pega o primeiro segmento
  const segments = pathname.replace(/^\//, '').split('/')
  const slug = segments[0]
  // Ignora segmentos vazios ou rotas sem slug (ex: /admin)
  if (!slug || slug === 'admin') return null
  return slug
}
