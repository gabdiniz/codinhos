import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import './globals.css'

export const metadata: Metadata = {
  title: 'Codinhos — programação para escolas',
  description:
    'Plataforma B2B de ensino de programação para alunos de 11 a 14 anos: desafios práticos, sandbox e tutor de IA.',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
