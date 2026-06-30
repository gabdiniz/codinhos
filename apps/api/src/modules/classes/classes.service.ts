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
  listClassTeachers,
  findClassTeacher,
  addTeacherToClass,
  removeTeacherFromClass,
  removeAllTeachersFromClass,
  listTeacherClassIds,
  isClassAssignedToTeacher,
} from './classes.repository.js'
import { findUserById } from '../users/users.repository.js'
import { findTenantTrail } from '../tenant-trails/tenant-trails.repository.js'
import { ConflictError, NotFoundError, UnprocessableError } from '../../shared/errors/index.js'
import type {
  CreateClassBody,
  UpdateClassBody,
  AddStudentBody,
  AssignTeacherBody,
  AssignTrailBody,
  UpdateClassTrailBody,
} from './classes.schema.js'

// Ator autenticado que chama um read de turma. O `professor` é escopado às turmas
// atribuídas a ele; `manager`/`super_admin` enxergam todas as turmas do tenant.
export type ClassActor = { role: string; userId: string }

/**
 * Garante que o professor só acessa turmas atribuídas a ele. Para outros papéis
 * (manager/super_admin) não há restrição. Turma fora do escopo → 404 (NotFound),
 * nunca 403 — mesmo padrão de "cross-tenant ou inexistente" usado no projeto.
 */
async function assertActorCanAccessClass(
  classId: string,
  tenantId: string,
  actor: ClassActor,
): Promise<void> {
  if (actor.role !== 'professor') return
  const assigned = await isClassAssignedToTeacher(classId, actor.userId, tenantId)
  if (!assigned) throw new NotFoundError('Turma')
}

// ─── Classes ──────────────────────────────────────────────────────────────────

export async function getClasses(tenantId: string, actor: ClassActor) {
  const rows = await listClasses(tenantId)
  if (actor.role === 'professor') {
    const assignedIds = new Set(await listTeacherClassIds(actor.userId, tenantId))
    return { data: rows.filter((r) => assignedIds.has(r.id)) }
  }
  return { data: rows }
}

export async function getClassDetail(classId: string, tenantId: string, actor: ClassActor) {
  const cls = await findClassById(classId, tenantId)
  if (!cls) throw new NotFoundError('Turma')
  await assertActorCanAccessClass(classId, tenantId, actor)

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

  // Cascade: weekly challenges → alunos → professores → trilhas → turma
  try {
    await deleteClassWeeklyChallenges(classId)
    await removeAllStudentsFromClass(classId)
    await removeAllTeachersFromClass(classId)
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

export async function getClassStudents(classId: string, tenantId: string, actor: ClassActor) {
  const cls = await findClassById(classId, tenantId)
  if (!cls) throw new NotFoundError('Turma')
  await assertActorCanAccessClass(classId, tenantId, actor)

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

// ─── Class Teachers (vínculo professor↔turma) ─────────────────────────────────

export async function getClassTeachers(classId: string, tenantId: string, actor: ClassActor) {
  const cls = await findClassById(classId, tenantId)
  if (!cls) throw new NotFoundError('Turma')
  await assertActorCanAccessClass(classId, tenantId, actor)

  const rows = await listClassTeachers(classId)
  return { data: rows, meta: { total: rows.length } }
}

export async function assignTeacher(classId: string, tenantId: string, body: AssignTeacherBody) {
  const cls = await findClassById(classId, tenantId)
  if (!cls) throw new NotFoundError('Turma')

  // Professor deve pertencer ao mesmo tenant e ter papel 'professor'
  const teacher = await findUserById(body.teacherId, tenantId)
  if (!teacher) throw new NotFoundError('Usuário')
  if (teacher.role !== 'professor') {
    throw new UnprocessableError('Usuário não é um professor')
  }

  const existing = await findClassTeacher(classId, body.teacherId)
  if (existing) throw new ConflictError('Professor já está vinculado à turma')

  const classTeacher = await addTeacherToClass(classId, body.teacherId)
  return { classTeacher }
}

export async function getTeacherClasses(teacherId: string, tenantId: string) {
  // Valida que o alvo existe e é professor do tenant
  const teacher = await findUserById(teacherId, tenantId)
  if (!teacher) throw new NotFoundError('Usuário')
  if (teacher.role !== 'professor') {
    throw new UnprocessableError('Usuário não é um professor')
  }
  const classIds = await listTeacherClassIds(teacherId, tenantId)
  return { data: classIds }
}

export async function removeTeacher(classId: string, teacherId: string, tenantId: string) {
  const cls = await findClassById(classId, tenantId)
  if (!cls) throw new NotFoundError('Turma')

  const existing = await findClassTeacher(classId, teacherId)
  if (!existing) throw new NotFoundError('Professor')

  await removeTeacherFromClass(classId, teacherId)
}

// ─── Class Trails ─────────────────────────────────────────────────────────────

export async function getClassTrails(classId: string, tenantId: string, actor: ClassActor) {
  const cls = await findClassById(classId, tenantId)
  if (!cls) throw new NotFoundError('Turma')
  await assertActorCanAccessClass(classId, tenantId, actor)

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
