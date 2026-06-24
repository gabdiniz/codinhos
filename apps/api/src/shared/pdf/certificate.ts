import PDFDocument from 'pdfkit'

export type CertificateData = {
  studentName: string
  trailTitle: string
  tenantName: string
  completedAt: Date
}

// Cores fixas do documento gerado (PDF — não é UI; regra de CSS vars não se aplica).
const INK = '#1f2937'
const ACCENT = '#4f46e5'
const MUTED = '#6b7280'

/** Gera o PDF do certificado de conclusão de trilha e resolve com o Buffer. */
export function generateCertificatePdf(data: CertificateData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 0 })
    const chunks: Buffer[] = []
    doc.on('data', (c: Buffer) => chunks.push(c))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    const w = doc.page.width
    const h = doc.page.height

    // Moldura
    doc.lineWidth(3).strokeColor(ACCENT).rect(24, 24, w - 48, h - 48).stroke()
    doc.lineWidth(1).strokeColor('#c7d2fe').rect(34, 34, w - 68, h - 68).stroke()

    // Marca
    doc.fillColor(ACCENT).font('Helvetica-Bold').fontSize(20)
      .text('{ cod }', 0, 70, { align: 'center', width: w })

    // Título
    doc.fillColor(INK).font('Helvetica-Bold').fontSize(34)
      .text('Certificado de Conclusão', 0, 130, { align: 'center', width: w })

    doc.fillColor(MUTED).font('Helvetica').fontSize(14)
      .text('Este certificado é concedido a', 0, 195, { align: 'center', width: w })

    // Nome do aluno
    doc.fillColor(INK).font('Helvetica-Bold').fontSize(30)
      .text(data.studentName, 0, 225, { align: 'center', width: w })

    doc.fillColor(MUTED).font('Helvetica').fontSize(14)
      .text('por concluir a trilha', 0, 285, { align: 'center', width: w })

    // Trilha
    doc.fillColor(ACCENT).font('Helvetica-Bold').fontSize(24)
      .text(data.trailTitle, 0, 312, { align: 'center', width: w })

    // Rodapé
    const dateStr = data.completedAt.toLocaleDateString('pt-BR', {
      day: '2-digit', month: 'long', year: 'numeric',
    })
    doc.fillColor(MUTED).font('Helvetica').fontSize(12)
      .text(`${data.tenantName}  ·  ${dateStr}`, 0, h - 90, { align: 'center', width: w })

    doc.end()
  })
}
