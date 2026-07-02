import { Resend } from 'resend'
import { EmailServiceError } from '../../shared/errors/index.js'
import type { ContactBody } from './contact.schema.js'

// Para onde os leads da landing são encaminhados. Configurável por env.
const CONTACT_TO = process.env.CONTACT_TO ?? 'contato@codinhos.com.br'
const EMAIL_FROM = process.env.EMAIL_FROM ?? 'noreply@codinhos.com.br'

/** Escapa HTML para não injetar markup no corpo do e-mail. */
function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export async function sendContactMessage(body: ContactBody): Promise<{ ok: true }> {
  const name = escapeHtml(body.name)
  const school = escapeHtml(body.school)
  const email = escapeHtml(body.email)
  const message = escapeHtml(body.message).replace(/\n/g, '<br>')

  // O SDK do Resend NÃO lança em erro de API (ex.: 403 domínio não verificado):
  // ele retorna { data, error }. O try/catch cobre só falha de rede; o erro de
  // API precisa ser verificado no retorno.
  let result: Awaited<ReturnType<Resend['emails']['send']>>
  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    result = await resend.emails.send({
      from: EMAIL_FROM,
      to: CONTACT_TO,
      replyTo: body.email,
      subject: `Novo contato pela landing — ${body.school}`,
      html: `
        <h2>Novo contato pela landing page do Codinhos</h2>
        <p><strong>Nome:</strong> ${name}</p>
        <p><strong>Escola:</strong> ${school}</p>
        <p><strong>E-mail:</strong> ${email}</p>
        <p><strong>Mensagem:</strong></p>
        <p>${message}</p>
      `,
    })
  } catch (err) {
    console.error('[contact] Falha de rede ao chamar o Resend:', err)
    throw new EmailServiceError()
  }

  if (result.error) {
    // Loga o motivo real (ex.: domínio não verificado, restrição de modo teste)
    console.error('[contact] Resend recusou o envio:', result.error)
    throw new EmailServiceError()
  }

  return { ok: true }
}
