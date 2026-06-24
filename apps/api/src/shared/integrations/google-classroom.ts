// Cliente REST mínimo para OAuth2 + Google Classroom (Sprint 6 — rostering one-way).
// Usa fetch global (Node >= 18). Sem SDK para manter dependências enxutas.
import { AiServiceError } from '../errors/index.js'

const OAUTH_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
const OAUTH_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const USERINFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo'
const CLASSROOM_BASE = 'https://classroom.googleapis.com/v1'

// Escopos read-only de rostering + e-mail do gestor que conecta
export const GOOGLE_SCOPES = [
  'openid',
  'email',
  'https://www.googleapis.com/auth/classroom.courses.readonly',
  'https://www.googleapis.com/auth/classroom.rosters.readonly',
  'https://www.googleapis.com/auth/classroom.profile.emails',
]

function requireEnv(name: string): string {
  const v = process.env[name]
  if (!v) throw new AiServiceError(`Integração Google não configurada (${name} ausente)`)
  return v
}

export function buildAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: requireEnv('GOOGLE_CLIENT_ID'),
    redirect_uri: requireEnv('GOOGLE_REDIRECT_URI'),
    response_type: 'code',
    scope: GOOGLE_SCOPES.join(' '),
    access_type: 'offline', // garante refresh_token
    prompt: 'consent', // força emissão de refresh_token mesmo em re-conexão
    include_granted_scopes: 'true',
    state,
  })
  return `${OAUTH_AUTH_URL}?${params.toString()}`
}

export type GoogleTokens = {
  accessToken: string
  refreshToken: string | null
  expiresInSec: number
  scope: string | null
}

export async function exchangeCodeForTokens(code: string): Promise<GoogleTokens> {
  const res = await fetch(OAUTH_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: requireEnv('GOOGLE_CLIENT_ID'),
      client_secret: requireEnv('GOOGLE_CLIENT_SECRET'),
      redirect_uri: requireEnv('GOOGLE_REDIRECT_URI'),
      grant_type: 'authorization_code',
    }),
  })
  if (!res.ok) {
    console.error('[google] Falha na troca de code:', await res.text())
    throw new AiServiceError('Falha ao autenticar com o Google')
  }
  const json = (await res.json()) as {
    access_token: string
    refresh_token?: string
    expires_in: number
    scope?: string
  }
  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token ?? null,
    expiresInSec: json.expires_in,
    scope: json.scope ?? null,
  }
}

export async function refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; expiresInSec: number }> {
  const res = await fetch(OAUTH_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: requireEnv('GOOGLE_CLIENT_ID'),
      client_secret: requireEnv('GOOGLE_CLIENT_SECRET'),
      grant_type: 'refresh_token',
    }),
  })
  if (!res.ok) {
    console.error('[google] Falha ao renovar token:', await res.text())
    throw new AiServiceError('Falha ao renovar acesso ao Google. Reconecte a conta.')
  }
  const json = (await res.json()) as { access_token: string; expires_in: number }
  return { accessToken: json.access_token, expiresInSec: json.expires_in }
}

export async function fetchGoogleEmail(accessToken: string): Promise<string> {
  const res = await fetch(USERINFO_URL, { headers: { Authorization: `Bearer ${accessToken}` } })
  if (!res.ok) throw new AiServiceError('Falha ao obter dados da conta Google')
  const json = (await res.json()) as { email?: string }
  return json.email ?? 'desconhecido'
}

export type ClassroomCourse = { id: string; name: string; section: string | null; enrollmentCount: number | null }

export async function listCourses(accessToken: string): Promise<ClassroomCourse[]> {
  const courses: ClassroomCourse[] = []
  let pageToken: string | undefined
  do {
    const url = new URL(`${CLASSROOM_BASE}/courses`)
    url.searchParams.set('courseStates', 'ACTIVE')
    url.searchParams.set('pageSize', '100')
    if (pageToken) url.searchParams.set('pageToken', pageToken)
    const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } })
    if (!res.ok) {
      console.error('[google] Falha ao listar cursos:', await res.text())
      throw new AiServiceError('Falha ao listar turmas do Google Classroom')
    }
    const json = (await res.json()) as { courses?: { id: string; name: string; section?: string }[]; nextPageToken?: string }
    for (const c of json.courses ?? []) {
      courses.push({ id: c.id, name: c.name, section: c.section ?? null, enrollmentCount: null })
    }
    pageToken = json.nextPageToken
  } while (pageToken)
  return courses
}

export type ClassroomStudent = { email: string; name: string }

export async function listCourseStudents(accessToken: string, courseId: string): Promise<ClassroomStudent[]> {
  const students: ClassroomStudent[] = []
  let pageToken: string | undefined
  do {
    const url = new URL(`${CLASSROOM_BASE}/courses/${courseId}/students`)
    url.searchParams.set('pageSize', '100')
    if (pageToken) url.searchParams.set('pageToken', pageToken)
    const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } })
    if (!res.ok) {
      console.error('[google] Falha ao listar alunos:', await res.text())
      throw new AiServiceError('Falha ao listar alunos da turma do Classroom')
    }
    const json = (await res.json()) as {
      students?: { profile?: { name?: { fullName?: string }; emailAddress?: string } }[]
      nextPageToken?: string
    }
    for (const s of json.students ?? []) {
      const email = s.profile?.emailAddress
      if (!email) continue // sem e-mail visível (escopo/privacidade) — ignora
      students.push({ email, name: s.profile?.name?.fullName ?? email })
    }
    pageToken = json.nextPageToken
  } while (pageToken)
  return students
}
