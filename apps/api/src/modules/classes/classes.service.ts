import {
  listClasses,
  findClassById,
  countClassStudents,
  countClassTrails,
  createClass,
  updateClass,
  deleteClass,
  listClassStudents,
  findClassStudent,
  addStudentToClass,
  removeStudentFromClass,
  removeAllStudentsFromClass,
  hasClassSubmissions,
  deleteClassWeeklyChallenges,
  listClassTrails,
  findClassTrail,
  assignTrailToClass,
  updateClassTrail,
  removeTrailFromClass,
  removeAllTrailsFromClass,
} from './classes.repository.js'
import { findUserById } from '../users/users.repository.js'
import { findTenantTrail } from '../tenant-trails/tenant-trails.repository.js'
import { ConflictError, NotFoundError } from '../../shared/errors/index.js'
import type {
  CreateClassBody,
  UpdateClassBody,
  AddStudentBody,
  AssignTrailBody,
  UpdateClassTrailBody,
} from './classes.schema.js'

// ─── Classes ──────────────────────────────────────────────────────────────────

export async function getClasses(tenantId: string) {
  const rows = await listClasses(tenantId)
  return { data: rows }
}

export async function getClassDetail(classId: string, tenantId: string) {
  const cls = await findClassById(classId, tenantId)
  if (!cls) throw new NotFoundError('Turma')

  const [studentsCount, trailsCount] = await Promise.all([
    countClassStudents(classId),
    countClassTrails(classId),
  ])

  return {
    class: {
      id: cls.id,
      name: cls.name,
      progressionMode: cls.progressionMode,
      validationMode: cls.validationMode,
      showRanking: cls.showRanking,
      createdAt: cls.createdAt,
    },
    studentsCount,
    trailsCount,
  }
}

export async function createNewClass(tenantId: string, body: CreateClassBody) {
  const cls = await createClass({
    tenantId,
    name: body.name,
    progressionMode: body.progressionMode,
    validationMode: body.validationMode,
    showRanking: body.showRanking,
  })
  return { class: cls }
}

export async function updateExistingClass(
  classId: string,
  tenantId: string,
  body: UpdateClassBody,
) {
  const existing = await findClassById(classId, tenantId)
  if (!existing) throw new NotFoundError('Turma')

  const cls = await updateClass(classId, tenantId, {
    name: body.name,
    progressionMode: body.progressionMode,
    validationMode: body.validationMode,
    showRanking: body.showRanking,
  })

  return { class: cls! }
}

export async function removeClass(classId: string, tenantId: string) {
  const existing = await findClassById(classId, tenantId)
  if (!existing) throw new NotFoundError('Turma')

  // Bloqueia se há submissions — FK classId NOT NULL impede deleção da turma
  const hasSubmissions = await hasClassSubmissions(classId)
  if (hasSubmissions) {
    throw new ConflictError('Turma possui submissões registradas — não é possível removê-la')
  }

  // Cascade: weekly challenges → alunos → trilhas → turma
  try {
    await deleteClassWeeklyChallenges(classId)
    await removeAllStudentsFromClass(classId)
    await removeAllTrailsFromClass(classId)
    await deleteClass(classId, tenantId)
  } catch (err) {
    // FK violation do Postgres (código 23503) — dados vinculados à turma
    const pgCode = (err as { code?: string }).code
    if (pgCode === '23503') {
      throw new ConflictError('Não é possível remover a turma: há dados vinculados')
    }
    throw err
  }
}

// ─── Class Students ───────────────────────────────────────────────────────────

export async function getClassStudents(classId: string, tenantId: string) {
  const cls = await findClassById(classId, tenantId)
  if (!cls) throw new NotFoundError('Turma')

  const rows = await listClassStudents(classId)
  return { data: rows, meta: { total: rows.length } }
}

export async function addStudent(classId: string, tenantId: string, body: AddStudentBody) {
  const cls = await findClassById(classId, tenantId)
  if (!cls) throw new NotFoundError('Turma')

  // Verifica se o aluno pertence ao tenant
  const student = await findUserById(body.studentId, tenantId)
  if (!student) throw new NotFoundError('Usuário')

  // Verifica se já está na turma
  const existing = await findClassStudent(classId, body.studentId)
  if (existing) throw new ConflictError('Aluno já está na turma')

  const classStudent = await addStudentToClass(classId, body.studentId)
  return { classStudent }
}

export async function removeStudent(classId: string, studentId: string, tenantId: string) {
  const cls = await findClassById(classId, tenantId)
  if (!cls) throw new NotFoundError('Turma')

  const existing = await findClassStudent(classId, studentId)
  if (!existing) throw new NotFoundError('Aluno')

  // Remove apenas o vínculo — preserva submissions e module_progress
  await removeStudentFromClass(classId, studentId)
}

// ─── Class Trails ─────────────────────────────────────────────────────────────

export async function getClassTrails(classId: string, tenantId: string) {
  const cls = await findClassById(classId, tenantId)
  if (!cls) throw new NotFoundError('Turma')

  const rows = await listClassTrails(classId)
  return { data: rows }
}

export async function assignTrail(classId: string, tenantId: string, body: AssignTrailBody) {
  const cls = await findClassById(classId, tenantId)
  if (!cls) throw new NotFoundError('Turma')

  // Trilha deve estar ativada pelo tenant
  const tenantTrail = await findTenantTrail(tenantId, body.trailId)
  if (!tenantTrail) throw new NotFoundError('Trilha')

  // Verifica se já atribuída à turma
  const existing = await findClassTrail(classId, body.trailId)
  if (existing) throw new ConflictError('Trilha já está atribuída à turma')

  const classTrail = await assignTrailToClass(
    classId,
    body.trailId,
    body.order,
    body.visualBlocksEnabled ?? false,
  )
  return { classTrail }
}

export async function updateExistingClassTrail(
  classId: string,
  trailId: string,
  tenantId: string,
  body: UpdateClassTrailBody,
) {
  const cls = await findClassById(classId, tenantId)
  if (!cls) throw new NotFoundError('Turma')

  const existing = await findClassTrail(classId, trailId)
  if (!existing) throw new NotFoundError('Trilha')

  const classTrail = await updateClassTrail(classId, trailId, {
    order: body.order,
    visualBlocksEnabled: body.visualBlocksEnabled,
  })

  return { classTrail: classTrail! }
}

export async function removeClassTrail(classId: string, trailId: string, tenantId: string) {
  const cls = await findClassById(classId, tenantId)
  if (!cls) throw new NotFoundError('Turma')

  const existing = await findClassTrail(classId, trailId)
  if (!existing) throw new NotFoundError('Trilha')

  // Preserva module_progress e submissions
  await removeTrailFromClass(classId, trailId)
}
