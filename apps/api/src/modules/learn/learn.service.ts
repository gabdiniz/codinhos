import {
  findClassWithMembership,
  listClassTrailsWithData,
  countModulesPerTrail,
  countCompletedModulesPerTrail,
  findStudentStats,
  findClassTrail,
  listTrailModulesWithChallenge,
  listModuleProgressForTrail,
  findModuleWithChallenge,
  listTrailModuleIds,
  countStudentSubmissions,
  findChallengeWithTrail,
  findLastSubmission,
} from './learn.repository.js'
import { ForbiddenError, NotFoundError } from '../../shared/errors/index.js'

// ─── Helper: cálculo de status de módulos ─────────────────────────────────────

type ProgressionMode = 'free' | 'sequential' | 'controlled'
type ModuleStatus = 'locked' | 'available' | 'completed'

/**
 * Calcula o status efetivo de cada módulo com base no progressionMode da turma
 * e nos registros existentes em module_progress.
 *
 * - free:       todos available (exceto os já completed)
 * - sequential: primeiro available; cada próximo só available se o anterior foi completed
 * - controlled: locked por padrão; só available/completed se houver registro explícito
 */
function computeModuleStatuses(
  orderedModules: { id: string; order: number }[],
  progressMap: Map<string, ModuleStatus>,
  progressionMode: ProgressionMode,
): Map<string, ModuleStatus> {
  const result = new Map<string, ModuleStatus>()
  let prevCompleted = false

  for (let i = 0; i < orderedModules.length; i++) {
    const mod = orderedModules[i]!
    const existing = progressMap.get(mod.id)

    if (existing === 'completed') {
      result.set(mod.id, 'completed')
      prevCompleted = true
    } else if (existing === 'available') {
      result.set(mod.id, 'available')
      prevCompleted = false
    } else {
      // Sem registro — calcula pelo progressionMode
      let status: ModuleStatus
      if (progressionMode === 'free') {
        status = 'available'
      } else if (progressionMode === 'sequential') {
        // Primeiro módulo sempre available; demais só se anterior completed
        status = i === 0 || prevCompleted ? 'available' : 'locked'
      } else {
        // controlled: somente desbloqueado explicitamente pelo gestor
        status = 'locked'
      }
      result.set(mod.id, status)
      prevCompleted = false
    }
  }

  return result
}

// ─── Services ─────────────────────────────────────────────────────────────────

/** GET /:slug/learn?classId= */
export async function getDashboard(
  tenantId: string,
  studentId: string,
  classId: string,
) {
  const cls = await findClassWithMembership(classId, studentId, tenantId)
  if (!cls) throw new ForbiddenError()

  const classTrailsData = await listClassTrailsWithData(classId)
  const trailIds = classTrailsData.map((ct) => ct.trailId)

  const [totalCounts, completedCounts, stats] = await Promise.all([
    countModulesPerTrail(trailIds),
    countCompletedModulesPerTrail(trailIds, studentId, tenantId),
    findStudentStats(studentId, tenantId),
  ])

  const trailsResult = classTrailsData.map((ct) => {
    const total = totalCounts[ct.trailId] ?? 0
    const completed = completedCounts[ct.trailId] ?? 0

    let status: 'not_started' | 'in_progress' | 'completed'
    if (completed === 0) {
      status = 'not_started'
    } else if (total > 0 && completed >= total) {
      status = 'completed'
    } else {
      status = 'in_progress'
    }

    return {
      id: ct.trail.id,
      title: ct.trail.title,
      progress: { completed, total },
      status,
    }
  })

  return {
    data: {
      class: { id: cls.id, name: cls.name },
      trails: trailsResult,
      stats: {
        xp: stats?.totalXp ?? 0,
        level: stats?.level ?? 1,
        streak: stats?.currentStreak ?? 0,
      },
    },
  }
}

/** GET /:slug/learn/trails/:trailId?classId= */
export async function getTrailDetail(
  tenantId: string,
  studentId: string,
  trailId: string,
  classId: string,
) {
  const membership = await findClassWithMembership(classId, studentId, tenantId)
  if (!membership) throw new ForbiddenError()

  const classTrail = await findClassTrail(classId, trailId)
  if (!classTrail) throw new NotFoundError('Trilha')

  const [modules, progressMap] = await Promise.all([
    listTrailModulesWithChallenge(trailId),
    listModuleProgressForTrail(trailId, studentId, tenantId),
  ])

  const statusMap = computeModuleStatuses(modules, progressMap, membership.progressionMode)

  return {
    data: {
      trail: classTrail.trail,
      visualBlocksEnabled: classTrail.visualBlocksEnabled,
      modules: modules.map((m) => ({
        id: m.id,
        title: m.title,
        order: m.order,
        status: statusMap.get(m.id) ?? 'locked',
        challenge: m.challenge
          ? { id: m.challenge.id, title: m.challenge.title, difficulty: m.challenge.difficulty }
          : null,
      })),
    },
  }
}

/** GET /:slug/learn/modules/:moduleId?classId= */
export async function getModuleDetail(
  tenantId: string,
  studentId: string,
  moduleId: string,
  classId: string,
) {
  const membership = await findClassWithMembership(classId, studentId, tenantId)
  if (!membership) throw new ForbiddenError()

  const mod = await findModuleWithChallenge(moduleId)
  if (!mod) throw new NotFoundError('Módulo')

  // Verifica se a trilha do módulo está atribuída à turma
  const classTrail = await findClassTrail(classId, mod.trailId)
  if (!classTrail) throw new NotFoundError('Módulo')

  // Calcula status do módulo com base no progressionMode
  const [trailModulesList, progressMap] = await Promise.all([
    listTrailModuleIds(mod.trailId),
    listModuleProgressForTrail(mod.trailId, studentId, tenantId),
  ])

  const statusMap = computeModuleStatuses(trailModulesList, progressMap, membership.progressionMode)
  const moduleStatus = statusMap.get(moduleId) ?? 'locked'

  // Contagem de tentativas (todas as submissões do aluno para o desafio)
  const attempts = mod.challenge
    ? await countStudentSubmissions(mod.challenge.id, studentId, tenantId)
    : 0

  return {
    data: {
      module: {
        id: mod.id,
        title: mod.title,
        concept: mod.concept,
        exampleCode: mod.exampleCode,
      },
      challenge: mod.challenge,
      progress: { status: moduleStatus, attempts },
      visualBlocksEnabled: classTrail.visualBlocksEnabled,
    },
  }
}

/** GET /:slug/learn/challenges/:challengeId?classId= */
export async function getChallengeDetail(
  tenantId: string,
  studentId: string,
  challengeId: string,
  classId: string,
) {
  const membership = await findClassWithMembership(classId, studentId, tenantId)
  if (!membership) throw new ForbiddenError()

  const challenge = await findChallengeWithTrail(challengeId)
  if (!challenge) throw new NotFoundError('Desafio')

  // Verifica se a trilha do desafio está atribuída à turma
  const classTrail = await findClassTrail(classId, challenge.trailId)
  if (!classTrail) throw new NotFoundError('Desafio')

  const lastSub = await findLastSubmission(challengeId, studentId, classId, tenantId)

  return {
    data: {
      challenge: {
        id: challenge.id,
        title: challenge.title,
        description: challenge.description,
        starterCode: challenge.starterCode,
        difficulty: challenge.difficulty,
        baseXp: challenge.baseXp,
      },
      visualBlocksEnabled: classTrail.visualBlocksEnabled,
      myLastSubmission: lastSub
        ? {
            id: lastSub.id,
            code: lastSub.code,
            status: lastSub.status,
            testResults: lastSub.testResults,
          }
        : null,
    },
  }
}
