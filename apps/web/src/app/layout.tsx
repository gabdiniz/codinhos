import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { ThemeProvider } from '@/components/theme/ThemeProvider'
import './globals.css'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.codinhos.com.br'
const SITE_NAME = 'Codinhos'
const TITLE = 'Codinhos — ensino de programação para escolas'
const DESCRIPTION =
  'Plataforma B2B de ensino de programação para alunos de 11 a 14 anos: JavaScript na prática, com sandbox no navegador, gamificação e o tutor de IA Codi. Feito para escolas.'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: '%s | Codinhos',
  },
  description: DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    'ensino de programação',
    'programação para crianças',
    'JavaScript para escolas',
    'edtech',
    'coding para crianças',
    'plataforma educacional',
    'programação 11 a 14 anos',
  ],
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: TITLE,
    description: DESCRIPTION,
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
  category: 'education',
}

// Aplica o tema antes da hidratação (anti-FOUC). Ver ThemeProvider.
const themeScript = `(function(){try{var t=localStorage.getItem('codinhos-theme');if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}document.documentElement.setAttribute('data-theme',t);}catch(e){document.documentElement.setAttribute('data-theme','light');}})();`

// Dados estruturados para busca (schema.org).
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'EducationalOrganization',
  name: SITE_NAME,
  url: SITE_URL,
  description: DESCRIPTION,
  areaServed: 'BR',
  inLanguage: 'pt-BR',
  audience: { '@type': 'EducationalAudience', educationalRole: 'student' },
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: script anti-FOUC precisa rodar antes da hidratação */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD estático de SEO */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
