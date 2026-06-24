import { eq, and } from 'drizzle-orm'
import { db } from '../../shared/db/index.js'
import { moduleProgress, trailModules } from '../../shared/db/schema.js'

// ─── Module Progress ────────────────────────────────────────────────────────

type ModuleProgressRow = typeof moduleProgress.$inferSelect

// Anotação explícita: sem ela o TS prova (incorretamente) que o resultado da
// destructuring de array nunca é undefined e descarta o ramo `null` do `?? null`.
export async function findModuleProgress(
  tenantId: string,
  studentId: string,
  moduleId: string,
): Promise<ModuleProgressRow | null> {
  const [row] = await db
    .select()
    .from(moduleProgress)
    .where(
      and(
        eq(moduleProgress.tenantId, tenantId),
        eq(moduleProgress.studentId, studentId),
        eq(moduleProgress.moduleId, moduleId),
      ),
    )
    .limit(1)
  return row ?? null
}

type InsertModuleProgressInput = {
  tenantId: string
  studentId: string
  moduleId: string
  unlockedBy: string
}

export async function insertModuleProgress(input: InsertModuleProgressInput) {
  const [row] = await db
    .insert(moduleProgress)
    .values({
      tenantId: input.tenantId,
      studentId: input.studentId,
      moduleId: input.moduleId,
      status: 'available',
      unlockedBy: input.unlockedBy,
      unlockedAt: new Date(),
    })
    .returning()
  return row!
}

export async function updateModuleProgressUnlock(id: string, tenantId: string, unlockedBy: string) {
  const [row] = await db
    .update(moduleProgress)
    .set({
      status: 'available',
      unlockedBy,
      unlockedAt: new Date(),
    })
    .where(and(eq(moduleProgress.id, id), eq(moduleProgress.tenantId, tenantId)))
    .returning()
  return row ?? null
}

// ─── Catálogo (sem tenant_id — gerenciado pelo Super Admin) ───────────────────

/** Busca o trailId de um módulo do catálogo. Retorna null se o módulo não existe. */
export async function findModuleTrailId(moduleId: string): Promise<string | null> {
  const [row] = await db
    .select({ trailId: trailModules.trailId })
    .from(trailModules)
    .where(eq(trailModules.id, moduleId))
    .limit(1)
  return row?.trailId ?? null
}
