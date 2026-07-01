import PDFDocument from 'pdfkit'
import type { CertificateConfig } from '../db/schema.js'

export type CertificateData = {
  studentName: string
  trailTitle: string
  tenantName: string
  completedAt: Date
}

// Padrões do certificado (usados quando a escola não personaliza).
const DEFAULTS = {
  accentColor: '#4f46e5',
  textColor: '#1f2937',
  title: 'Certificado de Conclusão',
  bodyText: 'por concluir a trilha',
  showSchoolName: true,
} as const
const MUTED = '#6b7280'

function safeColor(value: string | undefined, fallback: string): string {
  return value && /^#[0-9a-fA-F]{3,8}$/.test(value) ? value : fallback
}

function logoBuffer(dataUrl: string | undefined): Buffer | null {
  if (!dataUrl) return null
  const m = dataUrl.match(/^data:image\/(png|jpe?g);base64,([A-Za-z0-9+/=]+)$/)
  if (!m) return null
  try {
    return Buffer.from(m[2]!, 'base64')
  } catch {
    return null
  }
}

/**
 * Gera o PDF do certificado. Se `template` for informado, aplica a
 * personalização da escola; campos ausentes usam os padrões.
 */
export function generateCertificatePdf(
  data: CertificateData,
  template?: CertificateConfig | null,
): Promise<Buffer> {
  const t = template ?? {}
  const accent = safeColor(t.accentColor, DEFAULTS.accentColor)
  const ink = safeColor(t.textColor, DEFAULTS.textColor)
  const bg = t.backgroundColor ? safeColor(t.backgroundColor, '') : ''
  const title = (t.title ?? DEFAULTS.title).slice(0, 80)
  const bodyText = (t.bodyText ?? DEFAULTS.bodyText).slice(0, 120)
  const message = (t.message ?? '').slice(0, 200)
  const showSchoolName = t.showSchoolName ?? DEFAULTS.showSchoolName
  const sigName = (t.signatureName ?? '').slice(0, 80)
  const sigRole = (t.signatureRole ?? '').slice(0, 80)
  const logo = logoBuffer(t.logoDataUrl)

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 0 })
    const chunks: Buffer[] = []
    doc.on('data', (c: Buffer) => chunks.push(c))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    const w = doc.page.width
    const h = doc.page.height

    if (bg) doc.rect(0, 0, w, h).fill(bg)

    doc.lineWidth(3).strokeColor(accent).rect(24, 24, w - 48, h - 48).stroke()
    doc.lineWidth(1).strokeColor('#c7d2fe').rect(34, 34, w - 68, h - 68).stroke()

    if (logo) {
      try {
        const lw = 120
        doc.image(logo, (w - lw) / 2, 56, { width: lw, fit: [lw, 56] })
      } catch {
        doc.fillColor(accent).font('Helvetica-Bold').fontSize(20).text('{ cod }', 0, 70, { align: 'center', width: w })
      }
    } else {
      doc.fillColor(accent).font('Helvetica-Bold').fontSize(20).text('{ cod }', 0, 70, { align: 'center', width: w })
    }

    doc.fillColor(ink).font('Helvetica-Bold').fontSize(34).text(title, 0, 130, { align: 'center', width: w })

    doc.fillColor(MUTED).font('Helvetica').fontSize(14)
      .text('Este certificado é concedido a', 0, 195, { align: 'center', width: w })

    doc.fillColor(ink).font('Helvetica-Bold').fontSize(30).text(data.studentName, 0, 225, { align: 'center', width: w })

    doc.fillColor(MUTED).font('Helvetica').fontSize(14).text(bodyText, 0, 285, { align: 'center', width: w })

    doc.fillColor(accent).font('Helvetica-Bold').fontSize(24).text(data.trailTitle, 0, 312, { align: 'center', width: w })

    if (message) {
      doc.fillColor(MUTED).font('Helvetica-Oblique').fontSize(12).text(message, w * 0.15, 356, { align: 'center', width: w * 0.7 })
    }

    if (sigName) {
      const sx = w - 300
      const sy = h - 130
      doc.lineWidth(1).strokeColor(ink).moveTo(sx, sy).lineTo(sx + 220, sy).stroke()
      doc.fillColor(ink).font('Helvetica-Bold').fontSize(13).text(sigName, sx, sy + 6, { width: 220, align: 'center' })
      if (sigRole) doc.fillColor(MUTED).font('Helvetica').fontSize(11).text(sigRole, sx, sy + 24, { width: 220, align: 'center' })
    }

    const dateStr = data.completedAt.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
    const footer = showSchoolName ? `${data.tenantName}  ·  ${dateStr}` : dateStr
    doc.fillColor(MUTED).font('Helvetica').fontSize(12).text(footer, 0, h - 90, { align: 'center', width: w })

    doc.end()
  })
}
