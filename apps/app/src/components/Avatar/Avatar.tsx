import { useMemo } from 'react'
import type { AvatarConfig } from '@codinhos/types'
import { avatarDataUri } from '../../lib/avatar.ts'
import styles from './Avatar.module.css'

interface AvatarProps {
  name: string
  config?: AvatarConfig | null
  /** Diâmetro em pixels. */
  size?: number
  className?: string
}

/**
 * Avatar do aluno. Renderiza o personagem DiceBear a partir do config; se não
 * houver config salvo, cai para as iniciais do nome (comportamento antigo).
 */
export function Avatar({ name, config, size = 40, className }: AvatarProps) {
  const src = useMemo(
    // Render em 2x o tamanho exibido para ficar nítido em telas retina.
    () => (config ? avatarDataUri(config, size * 2) : null),
    [config, size],
  )

  const cls = className ? `${styles.avatar} ${className}` : styles.avatar
  const dim = { width: size, height: size }

  if (!src) {
    const initials = name
      .split(' ')
      .slice(0, 2)
      .map((n) => n[0])
      .join('')
      .toUpperCase()
    return (
      <div
        className={`${cls} ${styles.fallback}`}
        style={{ ...dim, fontSize: size * 0.36 }}
        aria-hidden="true"
      >
        {initials}
      </div>
    )
  }

  return (
    <img
      src={src}
      style={dim}
      className={`${cls} ${styles.img}`}
      alt={`Avatar de ${name}`}
      draggable={false}
    />
  )
}
