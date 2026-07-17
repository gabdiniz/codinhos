// ─── Render de avatar (DiceBear) ──────────────────────────────────────────────
//
// Fonte única de render do avatar do aluno. Recebe o AvatarConfig persistido e
// devolve o SVG (data URI) do estilo "adventurer" do DiceBear. Roda 100% no
// cliente — nenhuma imagem sai do dispositivo (bom para privacidade escolar).
//
// Os valores de variante/cor vêm do catálogo validado pela API, então o cast
// para os tipos literais do DiceBear é seguro.

import { createAvatar, type StyleOptions } from '@dicebear/core'
import { adventurer } from '@dicebear/collection'
import type { AvatarConfig } from '@codinhos/types'

const NONE = 'none'

function buildOptions(config: AvatarConfig): StyleOptions<adventurer.Options> {
  const opts = {
    seed: 'codinhos',
    skinColor: [config.skinColor],
    hair: [config.hair],
    hairColor: [config.hairColor],
    hairProbability: 100,
    eyes: [config.eyes],
    eyebrows: [config.eyebrows],
    mouth: [config.mouth],
    glasses: config.glasses === NONE ? [] : [config.glasses],
    glassesProbability: config.glasses === NONE ? 0 : 100,
    earrings: config.earrings === NONE ? [] : [config.earrings],
    earringsProbability: config.earrings === NONE ? 0 : 100,
    features: config.features === NONE ? [] : [config.features],
    featuresProbability: config.features === NONE ? 0 : 100,
    backgroundColor: [config.backgroundColor],
    backgroundType: ['solid'],
  }
  return opts as unknown as StyleOptions<adventurer.Options>
}

/** SVG serializado (string) do avatar. */
export function renderAvatarSvg(config: AvatarConfig, size = 96): string {
  return createAvatar(adventurer, { ...buildOptions(config), size, radius: 50 }).toString()
}

/** Data URI (`data:image/svg+xml;...`) para usar em <img src>. */
export function avatarDataUri(config: AvatarConfig, size = 96): string {
  return createAvatar(adventurer, { ...buildOptions(config), size, radius: 50 }).toDataUri()
}
