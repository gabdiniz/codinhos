import {
  listStudentTrailCompletion,
  findStudentName,
  findTenantName,
  findTrailCompletion,
} from './portfolio.repository.js'
import {
  findStudentStatsForDashboard,
  findStudentEarnedBadges,
} from '../dashboard/dashboard.repository.js'
import { generateCertificatePdf } from '../../shared/pdf/certificate.js'
import { resolveCertificateTemplate } from '../certificates/certificates.service.js'
import { NotFoundError, UnprocessableError } from '../../shared/errors/index.js'

// ─── GET /portfolio ───────────────────────────────────────────────────────────

export async function getPortfolio(studentId: string, tenantId: string) {
  const [trailRows, stats, badges] = await Promise.all([
    listStudentTrailCompletion(studentId, tenantId),
    findStudentStatsForDashboard(studentId, tenantId),
    findStudentEarnedBadges(studentId, tenantId),
  ])

  const trails = trailRows.map((t) => {
    const total = Number(t.totalModules)
    const completed = Number(t.completedModules)
    return {
      id: t.trailId,
      title: t.trailTitle,
      progress: { completed, total },
      isComplete: total > 0 && completed >= total,
      lastActivity: t.lastActivity ? new Date(t.lastActivity).toISOString() : null,
    }
  })

  return {
    data: {
      stats: {
        totalXp: stats?.totalXp ?? 0,
        level: stats?.level ?? 1,
        currentStreak: stats?.currentStreak ?? 0,
      },
      completedTrails: trails
        .filter((t) => t.isComplete)
        .map((t) => ({ id: t.id, title: t.title, completedAt: t.lastActivity })),
      inProgressTrails: trails
        .filter((t) => !t.isComplete && t.progress.completed > 0)
        .map((t) => ({ id: t.id, title: t.title, progress: t.progress })),
      badges: badges.map((b) => ({ slug: b.slug, name: b.name, earnedAt: b.earnedAt.toISOString() })),
    },
  }
}

// ─── GET /portfolio/certificates/:trailId ─────────────────────────────────────

function slugifyFilename(title: string): string {
  const base = title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
  return base || 'trilha'
}

export async function getCertificate(studentId: string, tenantId: string, trailId: string) {
  const completion = await findTrailCompletion(studentId, tenantId, trailId)
  if (!completion) throw new NotFoundError('Trilha')

  const total = Number(completion.totalModules)
  const completed = Number(completion.completedModules)
  if (total === 0 || completed < total) {
    throw new UnprocessableError('Trilha ainda não concluída — certificado indisponível')
  }

  const [studentName, tenantName, template] = await Promise.all([
    findStudentName(studentId, tenantId),
    findTenantName(tenantId),
    resolveCertificateTemplate(tenantId, trailId),
  ])
  if (!studentName) throw new NotFoundError('Aluno')

  // Escola pode ter desativado o certificado para este curso
  if (template && template.enabled === false) {
    throw new UnprocessableError('Certificado desativado pela escola para este curso')
  }

  const pdf = await generateCertificatePdf(
    {
      studentName,
      trailTitle: completion.trailTitle,
      tenantName: tenantName ?? 'Codinhos',
      completedAt: new Date(),
    },
    template?.config ?? null,
  )

  return { pdf, filename: `certificado-${slugifyFilename(completion.trailTitle)}.pdf` }
}
