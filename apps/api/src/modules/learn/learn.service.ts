import { computeModuleStatuses } from '../../shared/utils/progression.js'
import {
  findClassWithMembership,
  findFirstStudentClass,
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
  listVocabularyUpToModule,
} from './learn.repository.js'
import { ForbiddenError, NotFoundError } from '../../shared/errors/index.js'

// ─── Services ─────────────────────────────────────────────────────────────────

/** GET /:slug/learn?classId= (classId opcional — auto-resolve a primeira turma do aluno) */
export async function getDashboard(
  tenantId: string,
  studentId: string,
  classId: string | undefined,
) {
  let cls
  if (classId) {
    cls = await findClassWithMembership(classId, studentId, tenantId)
    if (!cls) throw new ForbiddenError()
  } else {
    cls = await findFirstStudentClass(studentId, tenantId)
    if (!cls) throw new NotFoundError('Turma')
  }

  const resolvedClassId = cls.id
  const classTrailsData = await listClassTrailsWithData(resolvedClassId)
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
  classId: string | undefined,
) {
  let membership
  if (classId) {
    membership = await findClassWithMembership(classId, studentId, tenantId)
    if (!membership) throw new ForbiddenError()
  } else {
    membership = await findFirstStudentClass(studentId, tenantId)
    if (!membership) throw new NotFoundError('Turma')
  }

  const classTrail = await findClassTrail(membership.id, trailId)
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
  classId: string | undefined,
) {
  let membership
  if (classId) {
    membership = await findClassWithMembership(classId, studentId, tenantId)
    if (!membership) throw new ForbiddenError()
  } else {
    membership = await findFirstStudentClass(studentId, tenantId)
    if (!membership) throw new NotFoundError('Turma')
  }

  const mod = await findModuleWithChallenge(moduleId)
  if (!mod) throw new NotFoundError('Módulo')

  // Verifica se a trilha do módulo está atribuída à turma
  const classTrail = await findClassTrail(membership.id, mod.trailId)
  if (!classTrail) throw new NotFoundError('Módulo')

  // Calcula status do módulo com base no progressionMode
  const [trailModulesList, progressMap] = await Promise.all([
    listTrailModuleIds(mod.trailId),
    listModuleProgressForTrail(mod.trailId, studentId, tenantId),
  ])

  const statusMap = computeModuleStatuses(trailModulesList, progressMap, membership.progressionMode)
  const moduleStatus = statusMap.get(moduleId) ?? 'locked'

  // Contagem de tentativas (todas as submissões do aluno para o desafio)
  const [attempts, availableVocabulary] = await Promise.all([
    mod.challenge
      ? countStudentSubmissions(mod.challenge.id, studentId, tenantId)
      : Promise.resolve(0),
    listVocabularyUpToModule(moduleId),
  ])

  // Próximo módulo na ordem da trilha (null se for o último)
  const currentIdx = trailModulesList.findIndex((m) => m.id === moduleId)
  const nextModuleId =
    currentIdx >= 0 && currentIdx + 1 < trailModulesList.length
      ? trailModulesList[currentIdx + 1].id
      : null

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
      availableVocabulary,
      nextModuleId,
    },
  }
}

/** GET /:slug/learn/challenges/:challengeId?classId= */
export async function getChallengeDetail(
  tenantId: string,
  studentId: string,
  challengeId: string,
  classId: string | undefined,
) {
  let membership
  if (classId) {
    membership = await findClassWithMembership(classId, studentId, tenantId)
    if (!membership) throw new ForbiddenError()
  } else {
    membership = await findFirstStudentClass(studentId, tenantId)
    if (!membership) throw new NotFoundError('Turma')
  }

  const challenge = await findChallengeWithTrail(challengeId)
  if (!challenge) throw new NotFoundError('Desafio')

  // Verifica se a trilha do desafio está atribuída à turma
  const classTrail = await findClassTrail(membership.id, challenge.trailId)
  if (!classTrail) throw new NotFoundError('Desafio')

  const [lastSub, availableVocabulary] = await Promise.all([
    findLastSubmission(challengeId, studentId, membership.id, tenantId),
    listVocabularyUpToModule(challenge.moduleId),
  ])

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
      availableVocabulary,
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
