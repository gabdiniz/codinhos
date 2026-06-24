import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { resolveTenant } from '../../shared/middlewares/resolve-tenant.js'
import { authenticate } from '../../shared/middlewares/authenticate.js'
import { requireRole } from '../../shared/middlewares/require-role.js'
import { getPortfolio, getCertificate } from './portfolio.service.js'
import { slugParamsSchema, certificateParamsSchema, portfolioResponseSchema } from './portfolio.schema.js'

export async function portfolioRoutes(app: FastifyInstance) {
  const f = app.withTypeProvider<ZodTypeProvider>()
  const guard = [resolveTenant, authenticate, requireRole('student')]

  // GET /:slug/portfolio — trilhas concluídas, em progresso, badges e stats
  f.get(
    '/:slug/portfolio',
    { schema: { params: slugParamsSchema, response: { 200: portfolioResponseSchema } }, preHandler: guard },
    async (req, reply) => {
      const result = await getPortfolio(req.user.id, req.resolvedTenantId)
      return reply.status(200).send(result)
    },
  )

  // GET /:slug/portfolio/certificates/:trailId — PDF do certificado (trilha concluída)
  f.get(
    '/:slug/portfolio/certificates/:trailId',
    { schema: { params: certificateParamsSchema }, preHandler: guard },
    async (req, reply) => {
      const { pdf, filename } = await getCertificate(req.user.id, req.resolvedTenantId, req.params.trailId)
      return reply
        .header('Content-Type', 'application/pdf')
        .header('Content-Disposition', `attachment; filename="${filename}"`)
        .send(pdf)
    },
  )
}
