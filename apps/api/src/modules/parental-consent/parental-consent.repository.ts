import { eq, and } from 'drizzle-orm'
import { db } from '../../shared/db/index.js'
import { parentalConsents } from '../../shared/db/schema.js'

// ─── Leitura ─────────────────────────────────────────────────────────────────

export async function findConsentByStudentId(studentId: string, tenantId: string) {
  const [row] = await db
    .select({ id: parentalConsents.id })
    .from(parentalConsents)
    .where(
      and(
        eq(parentalConsents.tenantId, tenantId),
        eq(parentalConsents.studentId, studentId),
      ),
    )
    .limit(1)
  return row ?? null
}

// ─── Escrita ─────────────────────────────────────────────────────────────────

type CreateParentalConsentInput = {
  tenantId: string
  studentId: string
  guardianName: string
  guardianEmail: string
  termsVersion: string
}

export async function createParentalConsent(input: CreateParentalConsentInput) {
  const [row] = await db
    .insert(parentalConsents)
    .values(input)
    .returning({ id: parentalConsents.id })
  return row!
}
