import { ImageResponse } from 'next/og'

// Imagem de compartilhamento (Open Graph / Twitter) gerada pelo Next.
// Next injeta automaticamente og:image e twitter:image apontando para esta rota.
export const alt = 'Codinhos — ensino de programacao para escolas'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

// Texto sem acentos de proposito: a fonte padrao do next/og cobre bem ASCII + middot.
export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        background: '#0b0e16',
        padding: '72px',
        fontFamily: 'sans-serif',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 16,
            background: '#5b4ef0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 32,
            fontWeight: 800,
            color: '#a3e635',
          }}
        >
          {'</>'}
        </div>
        <div style={{ display: 'flex', fontSize: 40, fontWeight: 800, color: '#edf0f7' }}>
          Codinhos
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18, fontSize: 74, fontWeight: 800, lineHeight: 1.05 }}>
          <span style={{ color: '#edf0f7' }}>Aprenda a</span>
          <span style={{ color: '#818cf8' }}>programar</span>
          <span style={{ color: '#edf0f7' }}>brincando</span>
        </div>
        <div style={{ display: 'flex', fontSize: 34, color: '#9aa1b8' }}>
          Programe de verdade, no navegador · 11 a 14 anos
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ height: 8, width: 130, borderRadius: 8, background: '#5b4ef0' }} />
        <div style={{ height: 8, width: 64, borderRadius: 8, background: '#a3e635' }} />
        <div style={{ height: 8, width: 40, borderRadius: 8, background: '#ec4899' }} />
      </div>
    </div>,
    { ...size },
  )
}
