import { Navigate, useParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.tsx'
import type { UserRole } from '../contexts/AuthContext.tsx'
import type { ReactNode } from 'react'

interface ProtectedRouteProps {
  children: ReactNode
  /** Se informado, so permite acesso para essa role */
  role?: UserRole
}

/**
 * Guarda de rota: redireciona para login se nao autenticado.
 * Se `role` for informado e a role do usuario nao bater, redireciona para
 * a area correta do usuario.
 */
export function ProtectedRoute({ children, role }: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const { slug } = useParams<{ slug: string }>()

  // Enquanto verifica a sessao, nao renderiza nada (evita flash de redirect)
  if (loading) return null

  if (!user) {
    return <Navigate to={`/${slug}/login`} replace />
  }

  if (role && user.role !== role) {
    // Redireciona para a area correta do usuario
    const redirectTo =
      user.role === 'student'     ? `/${slug}/learn`     :
      user.role === 'super_admin' ? `/${slug}/admin`     :
      user.role === 'professor'   ? `/${slug}/professor` :
      user.role === 'guardian'    ? `/${slug}/guardian`  :
      `/${slug}/manager`
    return <Navigate to={redirectTo} replace />
  }

  return <>{children}</>
}
