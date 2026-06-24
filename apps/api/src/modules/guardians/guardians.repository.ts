import { eq, and, count } from 'drizzle-orm'
import { db } from '../../shared/db/index.js'
import { users, guardianStudents, studentStats } from '../../shared/db/schema.js'

// ─── Responsáveis (visão do gestor) ───────────────────────────────────────────

export async function listGuardians(tenantId: string) {
  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      isActive: users.isActive,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(and(eq(users.tenantId, tenantId), eq(users.role, 'guardian')))
    .orderBy(users.name)

  const counts = await db
    .select({ guardianId: guardianStudents.guardianId, total: count() })
    .from(guardianStudents)
    .where(eq(guardianStudents.tenantId, tenantId))
    .groupBy(guardianStudents.guardianId)

  const countMap = new Map(counts.map((c) => [c.guardianId, Number(c.total)]))

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    isActive: r.isActive,
    createdAt: r.createdAt.toISOString(),
    studentsCount: countMap.get(r.id) ?? 0,
  }))
}

// Anotação explícita: o destructuring de array é tipado como nunca-undefined sem
// `noUncheckedIndexedAccess`, então o ramo `null` do `?? null` seria descartado.
export async function findGuardianById(
  guardianId: string,
  tenantId: string,
): Promise<{ id: string; name: string; email: string } | null> {
  const [row] = await db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .where(
      and(
        eq(users.id, guardianId),
        eq(users.tenantId, tenantId),
        eq(users.role, 'guardian'),
      ),
    )
    .limit(1)
  return row ?? null
}

export async function listGuardianStudents(guardianId: string, tenantId: string) {
  return db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      avatarUrl: users.avatarUrl,
      isActive: users.isActive,
    })
    .from(guardianStudents)
    .innerJoin(users, eq(users.id, guardianStudents.studentId))
    .where(and(eq(guardianStudents.guardianId, guardianId), eq(guardianStudents.tenantId, tenantId)))
    .orderBy(users.name)
}

export async function findGuardianStudentLink(
  tenantId: string,
  guardianId: string,
  studentId: string,
): Promise<{ id: string } | null> {
  const [row] = await db
    .select({ id: guardianStudents.id })
    .from(guardianStudents)
    .where(
      and(
        eq(guardianStudents.tenantId, tenantId),
        eq(guardianStudents.guardianId, guardianId),
        eq(guardianStudents.studentId, studentId),
      ),
    )
    .limit(1)
  return row ?? null
}

export async function insertGuardianStudent(
  tenantId: string,
  guardianId: string,
  studentId: string,
) {
  const [row] = await db
    .insert(guardianStudents)
    .values({ tenantId, guardianId, studentId })
    .returning({
      id: guardianStudents.id,
      guardianId: guardianStudents.guardianId,
      studentId: guardianStudents.studentId,
      createdAt: guardianStudents.createdAt,
    })
  return { ...row!, createdAt: row!.createdAt.toISOString() }
}

export async function deleteGuardianStudent(
  tenantId: string,
  guardianId: string,
  studentId: string,
) {
  await db
    .delete(guardianStudents)
    .where(
      and(
        eq(guardianStudents.tenantId, tenantId),
        eq(guardianStudents.guardianId, guardianId),
        eq(guardianStudents.studentId, studentId),
      ),
    )
}

// ─── Portal do responsável (read-only) ────────────────────────────────────────

/** Filhos vinculados ao responsável, com resumo de stats. */
export async function listChildrenWithStats(guardianId: string, tenantId: string) {
  return db
    .select({
      id: users.id,
      name: users.name,
      avatarUrl: users.avatarUrl,
      totalXp: studentStats.totalXp,
      level: studentStats.level,
      currentStreak: studentStats.currentStreak,
      lastActivity: studentStats.lastActivity,
    })
    .from(guardianStudents)
    .innerJoin(users, eq(users.id, guardianStudents.studentId))
    .leftJoin(
      studentStats,
      and(eq(studentStats.studentId, guardianStudents.studentId), eq(studentStats.tenantId, tenantId)),
    )
    .where(and(eq(guardianStudents.guardianId, guardianId), eq(guardianStudents.tenantId, tenantId)))
    .orderBy(users.name)
}
