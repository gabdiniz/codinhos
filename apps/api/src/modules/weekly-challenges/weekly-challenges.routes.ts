import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { resolveTenant } from '../../shared/middlewares/resolve-tenant.js'
import { authenticate } from '../../shared/middlewares/authenticate.js'
import { requireRole } from '../../shared/middlewares/require-role.js'
import {
  getActiveWeeklyChallenge,
  createWeeklyChallenge,
  getWeeklyChallengeHistory,
  getLeaderboard,
} from './weekly-challenges.service.js'
import {
  classParamsSchema,
  leaderboardParamsSchema,
  createWeeklyChallengeBodySchema,
  activeWeeklyChallengeResponseSchema,
  createWeeklyChallengeResponseSchema,
  historyResponseSchema,
  leaderboardResponseSchema,
} from './weekly-challenges.schema.js'

export async function weeklyChallengesRoutes(app: FastifyInstance) {
  const f = app.withTypeProvider<ZodTypeProvider>()
  const studentManagerGuard = [resolveTenant, authenticate, requireRole('student', 'manager')]
  const managerGuard = [resolveTenant, authenticate, requireRole('manager')]

  // GET /:slug/weekly-challenges/:classId — desafio ativo da turma
  f.get(
    '/:slug/weekly-challenges/:classId',
    {
      schema: {
        params: classParamsSchema,
        response: { 200: activeWeeklyChallengeResponseSchema },
      },
      preHandler: studentManagerGuard,
    },
    async (req, reply) => {
      const studentId = req.user.role === 'student' ? req.user.id : null
      const result = await getActiveWeeklyChallenge(
        req.params.classId,
        req.resolvedTenantId,
        studentId,
      )
      return reply.status(200).send(result)
    },
  )

  // POST /:slug/weekly-challenges/:classId — criar desafio da semana
  f.post(
    '/:slug/weekly-challenges/:classId',
    {
      schema: {
        params: classParamsSchema,
        body: createWeeklyChallengeBodySchema,
        response: { 201: createWeeklyChallengeResponseSchema },
      },
      preHandler: managerGuard,
    },
    async (req, reply) => {
      const result = await createWeeklyChallenge(
        req.params.classId,
        req.resolvedTenantId,
        req.body.challengeId,
        new Date(req.body.startsAt),
        new Date(req.body.endsAt),
      )
      return reply.status(201).send(result)
    },
  )

  // GET /:slug/weekly-challenges/:classId/history — histórico de desafios passados
  f.get(
    '/:slug/weekly-challenges/:classId/history',
    {
      schema: {
        params: classParamsSchema,
        response: { 200: historyResponseSchema },
      },
      preHandler: studentManagerGuard,
    },
    async (req, reply) => {
      const result = await getWeeklyChallengeHistory(req.params.classId, req.resolvedTenantId)
      return reply.status(200).send(result)
    },
  )

  // GET /:slug/weekly-challenges/:classId/:weeklyId/leaderboard — placar
  f.get(
    '/:slug/weekly-challenges/:classId/:weeklyId/leaderboard',
    {
      schema: {
        params: leaderboardParamsSchema,
        response: { 200: leaderboardResponseSchema },
      },
      preHandler: studentManagerGuard,
    },
    async (req, reply) => {
      const result = await getLeaderboard(
        req.params.weeklyId,
        req.params.classId,
        req.resolvedTenantId,
        req.user.id,
      )
      return reply.status(200).send(result)
    },
  )
}
