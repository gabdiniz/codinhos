import {
  findModuleProgress,
  insertModuleProgress,
  updateModuleProgressUnlock,
  findModuleTrailId,
} from './progress.repository.js'
import { findClassById, findClassStudent, findClassTrail } from '../classes/classes.repository.js'
import { NotFoundError, ForbiddenError, ConflictError, BadRequestError } from '../../shared/errors/index.js'
import type { UnlockModuleBody } from './progress.schema.js'

// ─── Unlock manual de módulo (modo "controlled") ──────────────────────────────

/**
 * Desbloqueia manualmente um módulo para um aluno — apenas turmas no modo de
 * progressão "controlled" permitem essa operação.
 * 400 se a turma não está em modo controlled.
 * 403 se o módulo não pertence a uma trilha atribuída à turma.
 * 409 se o módulo já está desbloqueado ou concluído para o aluno.
 */
export async function unlockModule(
  tenantId: string,
  moduleId: string,
  body: UnlockModuleBody,
  unlockedByUserId: string,
) {
  const { studentId, classId } = body

  const cls = await findClassById(classId, tenantId)
  if (!cls) throw new NotFoundError('Turma')

  if (cls.progressionMode !== 'controlled') {
    throw new BadRequestError('Turma não está no modo de progressão "controlled"')
  }

  const enrollment = await findClassStudent(classId, studentId)
  if (!enrollment) throw new NotFoundError('Aluno nesta turma')

  const trailId = await findModuleTrailId(moduleId)
  if (!trailId) throw new NotFoundError('Módulo')

  const classTrail = await findClassTrail(classId, trailId)
  if (!classTrail) throw new ForbiddenError()

  const existing = await findModuleProgress(tenantId, studentId, moduleId)

  if (existing) {
    if (existing.status !== 'locked') {
      throw new ConflictError('Módulo já está desbloqueado ou concluído para este aluno')
    }
    const updated = await updateModuleProgressUnlock(existing.id, tenantId, unlockedByUserId)
    return { data: { moduleProgress: updated! } }
  }

  const created = await insertModuleProgress({
    tenantId,
    studentId,
    moduleId,
    unlockedBy: unlockedByUserId,
  })
  return { data: { moduleProgress: created } }
}
