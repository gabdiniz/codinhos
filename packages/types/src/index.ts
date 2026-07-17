// DTOs e tipos compartilhados entre api, web e app.
// Adicionar exports aqui conforme os módulos forem implementados.

// ─── Avatar do aluno ──────────────────────────────────────────────────────────
//
// Personalização de avatar renderizada com DiceBear (estilo "adventurer").
// O `AvatarConfig` é o que persiste em `users.avatar_config` (jsonb) e o que o
// front mapeia para as opções do DiceBear. Categorias "toggle" usam o valor
// especial `'none'` para indicar ausência (ex.: sem óculos).

export interface AvatarConfig {
  /** Cor de pele (hex sem '#') */
  skinColor: string
  /** Estilo de cabelo (variantXX do DiceBear) */
  hair: string
  /** Cor do cabelo (hex sem '#') */
  hairColor: string
  /** Olhos (variantXX) */
  eyes: string
  /** Sobrancelhas (variantXX) */
  eyebrows: string
  /** Boca / expressão (variantXX) */
  mouth: string
  /** Óculos (variantXX) ou 'none' */
  glasses: string
  /** Brinco (variantXX) ou 'none' */
  earrings: string
  /** Detalhe do rosto (freckles/blush/...) ou 'none' */
  features: string
  /** Cor de fundo (hex sem '#') */
  backgroundColor: string
}

export type AvatarCategoryKey = keyof AvatarConfig

/** Como o front deve renderizar as opções da categoria. */
export type AvatarCategoryKind = 'color' | 'style' | 'toggle'

export interface AvatarOption {
  value: string
  label: string
  /** Nível mínimo do aluno para desbloquear a opção. */
  requiredLevel: number
  /** Cor (hex sem '#') para categorias do tipo 'color'. */
  swatch?: string
  /** Preenchido na resposta da API conforme o nível atual do aluno. */
  unlocked: boolean
}

export interface AvatarCategory {
  key: AvatarCategoryKey
  label: string
  kind: AvatarCategoryKind
  options: AvatarOption[]
}

/** Resposta de GET /:slug/me/avatar — estúdio de personalização. */
export interface AvatarStudioData {
  config: AvatarConfig
  level: number
  categories: AvatarCategory[]
}
