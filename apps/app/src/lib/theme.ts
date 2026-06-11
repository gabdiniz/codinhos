// ─── Utilitário de tema ───────────────────────────────────────────────────────
//
// Injeta as variáveis CSS do tenant no :root do documento.
// Chamado pelo TenantLayout após buscar o tema via API.

export type TenantTheme = Record<string, string>

/**
 * Aplica o tema do tenant sobrescrevendo as variáveis CSS padrão no :root.
 *
 * @example
 * applyTheme({ 'color-primary': '#ff6b00', 'color-background': '#0a0a0f' })
 * // Resulta em: document.documentElement.style.setProperty('--color-primary', '#ff6b00')
 */
export function applyTheme(theme: TenantTheme): void {
  const root = document.documentElement
  for (const [key, value] of Object.entries(theme)) {
    // A API retorna chaves sem o prefixo '--', ex: 'color-primary'
    // Por segurança, aceita também chaves já prefixadas
    const varName = key.startsWith('--') ? key : `--${key}`
    root.style.setProperty(varName, value)
  }
}

/**
 * Remove variáveis de tema injetadas dinamicamente, restaurando os defaults do global.css.
 * Útil ao trocar de tenant ou no logout.
 */
export function clearTheme(theme: TenantTheme): void {
  const root = document.documentElement
  for (const key of Object.keys(theme)) {
    const varName = key.startsWith('--') ? key : `--${key}`
    root.style.removeProperty(varName)
  }
}
