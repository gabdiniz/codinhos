import type { AvatarConfig, AvatarCategoryKey, AvatarCategoryKind } from '@codinhos/types'

// ─── Catálogo do avatar (fonte de verdade) ────────────────────────────────────
//
// Valores válidos para o estilo "adventurer" do DiceBear. `requiredLevel` controla
// o desbloqueio por gamificação — o service compara com o nível atual do aluno.
//
// NOTA sobre cores: os hex de pele, cabelo e fundo são DADOS de arte passados ao
// renderer (DiceBear), não cores de identidade visual da UI. Por isso não usam
// `var(--color-*)` — a regra de theming vale para o chrome da interface, não para
// o conteúdo do avatar. Toda a UI do estúdio, essa sim, usa variáveis CSS.

export interface CatalogOption {
  value: string
  label: string
  requiredLevel: number
  /** hex sem '#' — só para categorias 'color' */
  swatch?: string
}

export interface CatalogCategory {
  key: AvatarCategoryKey
  label: string
  kind: AvatarCategoryKind
  options: CatalogOption[]
}

/** Valor especial de categorias 'toggle' (sem óculos, sem brinco, etc.). */
export const NONE = 'none'

export const AVATAR_CATALOG: CatalogCategory[] = [
  {
    key: 'skinColor',
    label: 'Pele',
    kind: 'color',
    // Pele nunca é travada — inclusão em primeiro lugar.
    options: [
      { value: 'f2d3b1', label: 'Clara',        requiredLevel: 1, swatch: 'f2d3b1' },
      { value: 'ecad80', label: 'Clara dourada', requiredLevel: 1, swatch: 'ecad80' },
      { value: 'd08b5b', label: 'Média',         requiredLevel: 1, swatch: 'd08b5b' },
      { value: 'ae5d29', label: 'Morena',        requiredLevel: 1, swatch: 'ae5d29' },
      { value: '9e5622', label: 'Morena escura', requiredLevel: 1, swatch: '9e5622' },
      { value: '763900', label: 'Negra',         requiredLevel: 1, swatch: '763900' },
      { value: '614335', label: 'Negra escura',  requiredLevel: 1, swatch: '614335' },
    ],
  },
  {
    key: 'hair',
    label: 'Cabelo',
    kind: 'style',
    options: [
      { value: 'short01', label: 'Curto 1',  requiredLevel: 1 },
      { value: 'short02', label: 'Curto 2',  requiredLevel: 1 },
      { value: 'short03', label: 'Curto 3',  requiredLevel: 1 },
      { value: 'long01',  label: 'Longo 1',  requiredLevel: 1 },
      { value: 'long02',  label: 'Longo 2',  requiredLevel: 1 },
      { value: 'short05', label: 'Curto 4',  requiredLevel: 2 },
      { value: 'long05',  label: 'Longo 3',  requiredLevel: 2 },
      { value: 'short08', label: 'Curto 5',  requiredLevel: 3 },
      { value: 'long10',  label: 'Longo 4',  requiredLevel: 3 },
      { value: 'short13', label: 'Curto 6',  requiredLevel: 5 },
      { value: 'long13',  label: 'Longo 5',  requiredLevel: 5 },
      { value: 'short19', label: 'Curto 7',  requiredLevel: 8 },
      { value: 'long20',  label: 'Longo 6',  requiredLevel: 8 },
      { value: 'long26',  label: 'Especial', requiredLevel: 12 },
    ],
  },
  {
    key: 'hairColor',
    label: 'Cor do cabelo',
    kind: 'color',
    options: [
      { value: '0e0e0e', label: 'Preto',     requiredLevel: 1, swatch: '0e0e0e' },
      { value: '6a4e35', label: 'Castanho',  requiredLevel: 1, swatch: '6a4e35' },
      { value: 'ac6511', label: 'Ruivo',     requiredLevel: 1, swatch: 'ac6511' },
      { value: 'e5d7a3', label: 'Loiro',     requiredLevel: 1, swatch: 'e5d7a3' },
      { value: 'afafaf', label: 'Grisalho',  requiredLevel: 3, swatch: 'afafaf' },
      { value: 'ab2a18', label: 'Vermelho',  requiredLevel: 3, swatch: 'ab2a18' },
      { value: '3eac2c', label: 'Verde',     requiredLevel: 5, swatch: '3eac2c' },
      { value: '85c2c6', label: 'Azul',      requiredLevel: 5, swatch: '85c2c6' },
      { value: 'dba3be', label: 'Rosa',      requiredLevel: 8, swatch: 'dba3be' },
      { value: '592454', label: 'Roxo',      requiredLevel: 10, swatch: '592454' },
    ],
  },
  {
    key: 'eyes',
    label: 'Olhos',
    kind: 'style',
    options: [
      { value: 'variant01', label: 'Olhos 1', requiredLevel: 1 },
      { value: 'variant02', label: 'Olhos 2', requiredLevel: 1 },
      { value: 'variant03', label: 'Olhos 3', requiredLevel: 1 },
      { value: 'variant04', label: 'Olhos 4', requiredLevel: 1 },
      { value: 'variant07', label: 'Olhos 5', requiredLevel: 2 },
      { value: 'variant11', label: 'Olhos 6', requiredLevel: 3 },
      { value: 'variant15', label: 'Olhos 7', requiredLevel: 5 },
      { value: 'variant19', label: 'Olhos 8', requiredLevel: 8 },
      { value: 'variant24', label: 'Olhos 9', requiredLevel: 12 },
    ],
  },
  {
    key: 'eyebrows',
    label: 'Sobrancelhas',
    kind: 'style',
    options: [
      { value: 'variant01', label: 'Sobr. 1', requiredLevel: 1 },
      { value: 'variant02', label: 'Sobr. 2', requiredLevel: 1 },
      { value: 'variant03', label: 'Sobr. 3', requiredLevel: 1 },
      { value: 'variant07', label: 'Sobr. 4', requiredLevel: 3 },
      { value: 'variant10', label: 'Sobr. 5', requiredLevel: 6 },
      { value: 'variant15', label: 'Sobr. 6', requiredLevel: 10 },
    ],
  },
  {
    key: 'mouth',
    label: 'Boca',
    kind: 'style',
    options: [
      { value: 'variant01', label: 'Boca 1', requiredLevel: 1 },
      { value: 'variant02', label: 'Boca 2', requiredLevel: 1 },
      { value: 'variant03', label: 'Boca 3', requiredLevel: 1 },
      { value: 'variant04', label: 'Boca 4', requiredLevel: 1 },
      { value: 'variant08', label: 'Boca 5', requiredLevel: 2 },
      { value: 'variant12', label: 'Boca 6', requiredLevel: 3 },
      { value: 'variant18', label: 'Boca 7', requiredLevel: 5 },
      { value: 'variant25', label: 'Boca 8', requiredLevel: 8 },
      { value: 'variant30', label: 'Boca 9', requiredLevel: 12 },
    ],
  },
  {
    key: 'glasses',
    label: 'Óculos',
    kind: 'toggle',
    options: [
      { value: NONE,        label: 'Nenhum',   requiredLevel: 1 },
      { value: 'variant01', label: 'Óculos 1', requiredLevel: 2 },
      { value: 'variant02', label: 'Óculos 2', requiredLevel: 3 },
      { value: 'variant03', label: 'Óculos 3', requiredLevel: 5 },
      { value: 'variant04', label: 'Óculos 4', requiredLevel: 8 },
      { value: 'variant05', label: 'Óculos 5', requiredLevel: 12 },
    ],
  },
  {
    key: 'earrings',
    label: 'Brincos',
    kind: 'toggle',
    options: [
      { value: NONE,        label: 'Nenhum',    requiredLevel: 1 },
      { value: 'variant01', label: 'Brinco 1',  requiredLevel: 3 },
      { value: 'variant02', label: 'Brinco 2',  requiredLevel: 5 },
      { value: 'variant03', label: 'Brinco 3',  requiredLevel: 8 },
      { value: 'variant06', label: 'Brinco 4',  requiredLevel: 12 },
    ],
  },
  {
    key: 'features',
    label: 'Detalhes',
    kind: 'toggle',
    options: [
      { value: NONE,       label: 'Nenhum',    requiredLevel: 1 },
      { value: 'freckles', label: 'Sardas',    requiredLevel: 2 },
      { value: 'blush',    label: 'Bochechas', requiredLevel: 4 },
      { value: 'birthmark', label: 'Pinta',    requiredLevel: 7 },
      { value: 'mustache', label: 'Bigode',    requiredLevel: 15 },
    ],
  },
  {
    key: 'backgroundColor',
    label: 'Fundo',
    kind: 'color',
    options: [
      { value: 'b6e3f4', label: 'Céu',      requiredLevel: 1, swatch: 'b6e3f4' },
      { value: 'c0aede', label: 'Lavanda',  requiredLevel: 1, swatch: 'c0aede' },
      { value: 'd1d4f9', label: 'Névoa',    requiredLevel: 1, swatch: 'd1d4f9' },
      { value: 'ffd5dc', label: 'Rosé',     requiredLevel: 1, swatch: 'ffd5dc' },
      { value: 'ffdfbf', label: 'Pêssego',  requiredLevel: 1, swatch: 'ffdfbf' },
      { value: 'a0e7c0', label: 'Menta',    requiredLevel: 3, swatch: 'a0e7c0' },
      { value: 'ffec99', label: 'Sol',      requiredLevel: 3, swatch: 'ffec99' },
      { value: '5b8def', label: 'Oceano',   requiredLevel: 6, swatch: '5b8def' },
      { value: 'ff8fa3', label: 'Coral',    requiredLevel: 6, swatch: 'ff8fa3' },
      { value: '2d2a5a', label: 'Galáxia',  requiredLevel: 10, swatch: '2d2a5a' },
      { value: '10b981', label: 'Esmeralda', requiredLevel: 15, swatch: '10b981' },
    ],
  },
]

/** Config padrão para alunos sem avatar salvo (nível 1, tudo desbloqueado). */
export const DEFAULT_AVATAR_CONFIG: AvatarConfig = {
  skinColor: 'ecad80',
  hair: 'short01',
  hairColor: '6a4e35',
  eyes: 'variant01',
  eyebrows: 'variant01',
  mouth: 'variant03',
  glasses: NONE,
  earrings: NONE,
  features: NONE,
  backgroundColor: 'b6e3f4',
}
