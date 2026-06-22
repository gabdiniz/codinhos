// ─── Termos de uso (LGPD / ECA Digital) ───────────────────────────────────────
// Versão atual exigida para consentimento parental. Atualizar sempre que os
// termos de uso mudarem — consentimentos antigos não são retroativos.
export const CURRENT_TERMS_VERSION = '2026-06'

export type ParentalConsentCheck =
  | { required: false }
  | { required: true; consentToken: string; studentName: string }
