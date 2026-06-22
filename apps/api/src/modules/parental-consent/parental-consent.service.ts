import { findConsentByStudentId, createParentalConsent } from './parental-consent.repository.js'
import { CURRENT_TERMS_VERSION } from './parental-consent.schema.js'

// Idade mínima para login sem consentimento parental registrado (LGPD / ECA Digital).
const MINIMUM_AGE_WITHOUT_CONSENT = 12

/** Idade calculada a partir da data de nascimento (formato YYYY-MM-DD), na data de referência informada. */
export function calculateAge(birthDate: string, asOf: Date = new Date()): number {
  const birth = new Date(birthDate)
  let age = asOf.getFullYear() - birth.getFullYear()
  const hasNotHadBirthdayYet =
    asOf.getMonth() < birth.getMonth() ||
    (asOf.getMonth() === birth.getMonth() && asOf.getDate() < birth.getDate())
  if (hasNotHadBirthdayYet) age--
  return age
}

/**
 * Verifica se o aluno precisa de consentimento parental registrado antes de
 * concluir o login.
 *
 * Alunos sem `birthDate` cadastrada não são bloqueados — sem data de
 * nascimento não há como calcular a idade. O gestor precisa preencher o campo
 * (tela de aluno) para que a regra passe a valer para esse aluno.
 */
export async function studentRequiresConsent(
  student: { id: string; role: string; birthDate: string | null },
  tenantId: string,
): Promise<boolean> {
  if (student.role !== 'student') return false
  if (!student.birthDate) return false
  if (calculateAge(student.birthDate) >= MINIMUM_AGE_WITHOUT_CONSENT) return false

  const existing = await findConsentByStudentId(student.id, tenantId)
  return existing === null
}

export async function recordConsent(input: {
  tenantId: string
  studentId: string
  guardianName: string
  guardianEmail: string
}): Promise<void> {
  await createParentalConsent({ ...input, termsVersion: CURRENT_TERMS_VERSION })
}
