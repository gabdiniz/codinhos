import { useEffect, useState } from 'react'
import { Outlet, useParams, Navigate } from 'react-router-dom'
import { api, ApiError } from '../lib/api.ts'
import { applyTheme, clearTheme, type TenantTheme } from '../lib/theme.ts'

/**
 * Layout raiz de todas as rotas com :slug.
 *
 * Responsabilidades:
 * 1. Busca o tema do tenant via GET /:slug/theme (sem autenticação)
 * 2. Injeta as variáveis CSS no :root
 * 3. Limpa o tema ao desmontar (troca de tenant)
 * 4. Redireciona para 404 se o tenant não existe
 */
export function TenantLayout() {
  const { slug } = useParams<{ slug: string }>()
  const [themeLoaded, setThemeLoaded] = useState(false)
  const [tenantNotFound, setTenantNotFound] = useState(false)

  useEffect(() => {
    if (!slug) return

    let applied: TenantTheme | null = null

    api
      .get<{ data: { theme: TenantTheme | null } }>(`/api/${slug}/theme`)
      .then(({ data }) => {
        if (data.theme) {
          applyTheme(data.theme)
          applied = data.theme
        }
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 404) {
          setTenantNotFound(true)
        }
        // Se falhar por outro motivo, continua com o tema padrão
      })
      .finally(() => setThemeLoaded(true))

    return () => {
      // Limpa o tema ao sair do tenant (ex: logout para outro slug)
      if (applied) clearTheme(applied)
    }
  }, [slug])

  if (tenantNotFound) {
    return <Navigate to="/404" replace />
  }

  // Aguarda o tema carregar para evitar flash de cores incorretas
  if (!themeLoaded) {
    return null
  }

  return <Outlet />
}
