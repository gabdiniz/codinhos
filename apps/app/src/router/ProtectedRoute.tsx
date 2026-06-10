import { Navigate, useParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.tsx'
import type { UserRole } from '../contexts/AuthContext.tsx'
import type { ReactNode } from 'react'

interface ProtectedRouteProps {
  children: ReactNode
  /** Se informado, só permite acesso para essa role */
  role?: UserRole
}

/**
 * Guarda de rota: redireciona para login se não autenticado.
 * Se `role` for informado e a role do usuário não bater, redireciona para
 * a área correta do usuário (/:slug/learn para alunos, /:slug/manager para gestores).
 */
export function ProtectedRoute({ children, role }: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const { slug } = useParams<{ slug: string }>()

  // Enquanto verifica a sessão, não renderiza nada (evita flash de redirect)
  if (loading) return null

  if (!user) {
    return <Navigate to={`/${slug}/login`} replace />
  }

  if (role && user.role !== role) {
    // Redireciona para a área correta do usuário
    const redirectTo = user.role === 'student' ? `/${slug}/learn` : `/${slug}/manager`
    return <Navigate to={redirectTo} replace />
  }

  return <>{children}</>
}
