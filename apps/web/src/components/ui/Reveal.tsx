'use client'

import { type ReactNode, useEffect, useRef, useState } from 'react'
import styles from './Reveal.module.css'

type RevealProps = {
  children: ReactNode
  /** Atraso em ms para escalonar a entrada de itens vizinhos */
  delay?: number
  className?: string
}

/**
 * Revela o conteúdo com fade + slide quando ele entra na viewport.
 * Sem dependências (IntersectionObserver) e respeita prefers-reduced-motion
 * (tratado no CSS). Anima uma vez só.
 */
export function Reveal({ children, delay = 0, className = '' }: RevealProps) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -10% 0px' },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={`${styles.reveal} ${visible ? styles.visible : ''} ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  )
}
