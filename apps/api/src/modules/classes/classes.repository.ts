import { count, eq, and } from 'drizzle-orm'
import { db } from '../../shared/db/index.js'
import {
  classes,
  classStudents,
  classTeachers,
  classTrails,
  classWeeklyChallenges,
  challengeSubmissions,
  trails,
  users,
} from '../../shared/db/schema.js'

// ─── Classes ──────────────────────────────────────────────────────────────────

export async function listClasses(tenantId: string) {
  // Lista turmas com contagem de alunos via subquery
  const rows = await db
    .select({
      id: classes.id,
      name: classes.name,
      progressionMode: classes.progressionMode,
      validationMode: classes.validationMode,
      showRanking: classes.showRanking,
      createdAt: classes.createdAt,
    })
    .from(classes)
    .where(eq(classes.tenantId, tenantId))
    .orderBy(classes.createdAt)

  // Busca contagem de alunos para cada turma
  const studentsCountRows = await db
    .select({
      classId: classStudents.classId,
      total: count(),
    })
    .from(classStudents)
    .innerJoin(classes, eq(classes.id, classStudents.classId))
    .where(eq(classes.tenantId, tenantId))
    .groupBy(classStudents.classId)

  const countMap = new Map(studentsCountRows.map((r) => [r.classId, Number(r.total)]))

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    progressionMode: r.progressionMode,
    validationMode: r.validationMode,
    showRanking: r.showRanking,
    createdAt: r.createdAt.toISOString(),
    studentsCount: countMap.get(r.id) ?? 0,
  }))
}

export async function findClassById(classId: string, tenantId: string) {
  const [cls] = await db
    .select({
      id: classes.id,
      tenantId: classes.tenantId,
      name: classes.name,
      progressionMode: classes.progressionMode,
      validationMode: classes.validationMode,
      showRanking: classes.showRanking,
      createdAt: classes.createdAt,
    })
    .from(classes)
    .where(and(eq(classes.id, classId), eq(classes.tenantId, tenantId)))
    .limit(1)
  if (!cls) return null
  return { ...cls, createdAt: cls.createdAt.toISOString() }
}

export async function countClassStudents(classId: string): Promise<number> {
  const [{ value }] = await db
    .select({ value: count() })
    .from(classStudents)
    .where(eq(classStudents.classId, classId))
  return Number(value)
}

export async function countClassTrails(classId: string): Promise<number> {
  const [{ value }] = await db
    .select({ value: count() })
    .from(classTrails)
    .where(eq(classTrails.classId, classId))
  return Number(value)
}

type CreateClassInput = {
  tenantId: string
  name: string
  progressionMode?: 'free' | 'sequential' | 'controlled'
  validationMode?: 'auto' | 'auto_review' | 'manual'
  showRanking?: boolean
}

export async function createClass(input: CreateClassInput) {
  const [cls] = await db
    .insert(classes)
    .values({
      tenantId: input.tenantId,
      name: input.name,
      ...(input.progressionMode !== undefined && { progressionMode: input.progressionMode }),
      ...(input.validationMode !== undefined && { validationMode: input.validationMode }),
      ...(input.showRanking !== undefined && { showRanking: input.showRanking }),
    })
    .returning({
      id: classes.id,
      tenantId: classes.tenantId,
      name: classes.name,
      progressionMode: classes.progressionMode,
      validationMode: classes.validationMode,
      showRanking: classes.showRanking,
      createdAt: classes.createdAt,
    })
  return { ...cls!, createdAt: cls!.createdAt.toISOString() }
}

type UpdateClassInput = {
  name?: string
  progressionMode?: 'free' | 'sequential' | 'controlled'
  validationMode?: 'auto' | 'auto_review' | 'manual'
  showRanking?: boolean
}

export async function updateClass(classId: string, tenantId: string, input: UpdateClassInput) {
  const [cls] = await db
    .update(classes)
    .set({
      ...(input.name !== undefined && { name: input.name }),
      ...(input.progressionMode !== undefined && { progressionMode: input.progressionMode }),
      ...(input.validationMode !== undefined && { validationMode: input.validationMode }),
      ...(input.showRanking !== undefined && { showRanking: input.showRanking }),
    })
    .where(and(eq(classes.id, classId), eq(classes.tenantId, tenantId)))
    .returning({
      id: classes.id,
      tenantId: classes.tenantId,
      name: classes.name,
      progressionMode: classes.progressionMode,
      validationMode: classes.validationMode,
      showRanking: classes.showRanking,
      createdAt: classes.createdAt,
    })
  if (!cls) return null
  return { ...cls, createdAt: cls.createdAt.toISOString() }
}

export async function deleteClass(classId: string, tenantId: string) {
  await db.delete(classes).where(and(eq(classes.id, classId), eq(classes.tenantId, tenantId)))
}

// ─── Class Students ───────────────────────────────────────────────────────────

export async function listClassStudents(classId: string) {
  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      avatarUrl: users.avatarUrl,
      isActive: users.isActive,
    })
    .from(classStudents)
    .innerJoin(users, eq(users.id, classStudents.studentId))
    .where(eq(classStudents.classId, classId))
    .orderBy(users.name)
  return rows
}

/** Busca a turma atual do aluno dentro do tenant — assume turma única por aluno */
export async function findStudentCurrentClass(studentId: string, tenantId: string) {
  const [row] = await db
    .select({ id: classes.id, name: classes.name })
    .from(classStudents)
    .innerJoin(classes, eq(classes.id, classStudents.classId))
    .where(and(eq(classStudents.studentId, studentId), eq(classes.tenantId, tenantId)))
    .limit(1)
  return row ?? null
}

// Anotação explícita: sem ela o TS prova (incorretamente) que o resultado da
// destructuring de array nunca é undefined e descarta o ramo `null` do `?? null`.
export async function findClassStudent(
  classId: string,
  studentId: string,
): Promise<{ id: string; classId: string; studentId: string; joinedAt: Date } | null> {
  const [row] = await db
    .select({
      id: classStudents.id,
      classId: classStudents.classId,
      studentId: classStudents.studentId,
      joinedAt: classStudents.joinedAt,
    })
    .from(classStudents)
    .where(and(eq(classStudents.classId, classId), eq(classStudents.studentId, studentId)))
    .limit(1)
  return row ?? null
}

export async function addStudentToClass(classId: string, studentId: string) {
  const [row] = await db
    .insert(classStudents)
    .values({ classId, studentId })
    .returning({
      id: classStudents.id,
      classId: classStudents.classId,
      studentId: classStudents.studentId,
      joinedAt: classStudents.joinedAt,
    })
  // joinedAt vem do banco como Date — classStudentResponseSchema espera string ISO
  return { ...row!, joinedAt: row!.joinedAt.toISOString() }
}

export async function removeStudentFromClass(classId: string, studentId: string) {
  await db
    .delete(classStudents)
    .where(and(eq(classStudents.classId, classId), eq(classStudents.studentId, studentId)))
}

export async function removeAllStudentsFromClass(classId: string) {
  await db.delete(classStudents).where(eq(classStudents.classId, classId))
}

// ─── Class Teachers (vínculo professor↔turma) ─────────────────────────────────

export async function listClassTeachers(classId: string) {
  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      avatarUrl: users.avatarUrl,
      isActive: users.isActive,
    })
    .from(classTeachers)
    .innerJoin(users, eq(users.id, classTeachers.teacherId))
    .where(eq(classTeachers.classId, classId))
    .orderBy(users.name)
  return rows
}

// Anotação explícita: sem ela o TS prova (incorretamente) que o resultado da
// destructuring de array nunca é undefined e descarta o ramo `null` do `?? null`.
export async function findClassTeacher(
  classId: string,
  teacherId: string,
): Promise<{ id: string; classId: string; teacherId: string; assignedAt: Date } | null> {
  const [row] = await db
    .select({
      id: classTeachers.id,
      classId: classTeachers.classId,
      teacherId: classTeachers.teacherId,
      assignedAt: classTeachers.assignedAt,
    })
    .from(classTeachers)
    .where(and(eq(classTeachers.classId, classId), eq(classTeachers.teacherId, teacherId)))
    .limit(1)
  return row ?? null
}

export async function addTeacherToClass(classId: string, teacherId: string) {
  const [row] = await db
    .insert(classTeachers)
    .values({ classId, teacherId })
    .returning({
      id: classTeachers.id,
      classId: classTeachers.classId,
      teacherId: classTeachers.teacherId,
      assignedAt: classTeachers.assignedAt,
    })
  // assignedAt vem do banco como Date — o response schema espera string ISO
  return { ...row!, assignedAt: row!.assignedAt.toISOString() }
}

export async function removeTeacherFromClass(classId: string, teacherId: string) {
  await db
    .delete(classTeachers)
    .where(and(eq(classTeachers.classId, classId), eq(classTeachers.teacherId, teacherId)))
}

export async function removeAllTeachersFromClass(classId: string) {
  await db.delete(classTeachers).where(eq(classTeachers.classId, classId))
}

/** IDs das turmas atribuídas a um professor dentro do tenant (escopo via join em classes). */
export async function listTeacherClassIds(teacherId: string, tenantId: string): Promise<string[]> {
  const rows = await db
    .select({ classId: classTeachers.classId })
    .from(classTeachers)
    .innerJoin(classes, eq(classes.id, classTeachers.classId))
    .where(and(eq(classTeachers.teacherId, teacherId), eq(classes.tenantId, tenantId)))
  return rows.map((r) => r.classId)
}

/** Verifica se a turma está atribuída ao professor (filtra tenant_id via join em classes). */
export async function isClassAssignedToTeacher(
  classId: string,
  teacherId: string,
  tenantId: string,
): Promise<boolean> {
  const [row] = await db
    .select({ id: classTeachers.id })
    .from(classTeachers)
    .innerJoin(classes, eq(classes.id, classTeachers.classId))
    .where(
      and(
        eq(classTeachers.classId, classId),
        eq(classTeachers.teacherId, teacherId),
        eq(classes.tenantId, tenantId),
      ),
    )
    .limit(1)
  return !!row
}

/** Verifica se o aluno pertence a alguma turma atribuída ao professor (escopo de tenant via join). */
export async function isStudentInTeacherClasses(
  studentId: string,
  teacherId: string,
  tenantId: string,
): Promise<boolean> {
  const [row] = await db
    .select({ id: classStudents.id })
    .from(classStudents)
    .innerJoin(classTeachers, eq(classTeachers.classId, classStudents.classId))
    .innerJoin(classes, eq(classes.id, classStudents.classId))
    .where(
      and(
        eq(classStudents.studentId, studentId),
        eq(classTeachers.teacherId, teacherId),
        eq(classes.tenantId, tenantId),
      ),
    )
    .limit(1)
  return !!row
}

// ─── Class Trails ─────────────────────────────────────────────────────────────

export async function listClassTrails(classId: string) {
  const rows = await db
    .select({
      id: trails.id,
      slug: trails.slug,
      title: trails.title,
      order: classTrails.order,
      visualBlocksEnabled: classTrails.visualBlocksEnabled,
    })
    .from(classTrails)
    .innerJoin(trails, eq(trails.id, classTrails.trailId))
    .where(eq(classTrails.classId, classId))
    .orderBy(classTrails.order)
  return rows
}

// Anotação explícita: sem ela o TS prova (incorretamente) que o resultado da
// destructuring de array nunca é undefined e descarta o ramo `null` do `?? null`.
export async function findClassTrail(
  classId: string,
  trailId: string,
): Promise<
  { id: string; classId: string; trailId: string; order: number; visualBlocksEnabled: boolean } | null
> {
  const [row] = await db
    .select({
      id: classTrails.id,
      classId: classTrails.classId,
      trailId: classTrails.trailId,
      order: classTrails.order,
      visualBlocksEnabled: classTrails.visualBlocksEnabled,
    })
    .from(classTrails)
    .where(and(eq(classTrails.classId, classId), eq(classTrails.trailId, trailId)))
    .limit(1)
  return row ?? null
}

export async function assignTrailToClass(
  classId: string,
  trailId: string,
  order: number,
  visualBlocksEnabled: boolean,
) {
  const [row] = await db
    .insert(classTrails)
    .values({ classId, trailId, order, visualBlocksEnabled })
    .returning({
      id: classTrails.id,
      classId: classTrails.classId,
      trailId: classTrails.trailId,
      order: classTrails.order,
      visualBlocksEnabled: classTrails.visualBlocksEnabled,
    })
  return row!
}

type UpdateClassTrailInput = {
  order?: number
  visualBlocksEnabled?: boolean
}

export async function updateClassTrail(
  classId: string,
  trailId: string,
  input: UpdateClassTrailInput,
) {
  const [row] = await db
    .update(classTrails)
    .set({
      ...(input.order !== undefined && { order: input.order }),
      ...(input.visualBlocksEnabled !== undefined && {
        visualBlocksEnabled: input.visualBlocksEnabled,
      }),
    })
    .where(and(eq(classTrails.classId, classId), eq(classTrails.trailId, trailId)))
    .returning({
      id: classTrails.id,
      classId: classTrails.classId,
      trailId: classTrails.trailId,
      order: classTrails.order,
      visualBlocksEnabled: classTrails.visualBlocksEnabled,
    })
  return row ?? null
}

export async function removeTrailFromClass(classId: string, trailId: string) {
  await db
    .delete(classTrails)
    .where(and(eq(classTrails.classId, classId), eq(classTrails.trailId, trailId)))
}

export async function removeAllTrailsFromClass(classId: string) {
  await db.delete(classTrails).where(eq(classTrails.classId, classId))
}

// ─── Cascade helpers ──────────────────────────────────────────────────────────

/** Verifica se a turma tem alguma submission (bloqueia deleção) */
export async function hasClassSubmissions(classId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: challengeSubmissions.id })
    .from(challengeSubmissions)
    .where(eq(challengeSubmissions.classId, classId))
    .limit(1)
  return row !== undefined
}

/** Remove weekly challenges da turma antes de deletá-la */
export async function deleteClassWeeklyChallenges(classId: string) {
  await db.delete(classWeeklyChallenges).where(eq(classWeeklyChallenges.classId, classId))
}
