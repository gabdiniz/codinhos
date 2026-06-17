import { count, eq, and } from 'drizzle-orm'
import { db } from '../../shared/db/index.js'
import {
  classes,
  classStudents,
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

export async function findClassStudent(classId: string, studentId: string) {
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

export async function findClassTrail(classId: string, trailId: string) {
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
