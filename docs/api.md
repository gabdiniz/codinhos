# Contratos da API

> Base URL: `/api`
> Rotas com `:slug` são escopadas ao tenant. O middleware `resolveTenant` converte o slug em `tenantId`.
> Rotas com `/admin` são exclusivas do Super Admin e não usam slug.

## Convenções

- Todos os responses de sucesso retornam `{ data: ... }`
- Todos os responses de erro retornam `{ error: { code, message } }`
- Paginação: `?page=1&limit=20` → response inclui `{ data: [...], meta: { total, page, limit } }`
- Datas: ISO 8601 (`2024-01-15T10:30:00Z`)
- Slug inválido → `404 { error: { code: "TENANT_NOT_FOUND" } }` em todas as rotas `/:slug/`
- Sessão ausente ou expirada → `401 { error: { code: "UNAUTHORIZED" } }` — o frontend redireciona para login
- Role insuficiente (ex: student em rota de manager) → `403 { error: { code: "FORBIDDEN" } }`
- Usuário inativo (`is_active = false`) → `403 { error: { code: "ACCOUNT_DISABLED" } }` no login e em todas as rotas autenticadas
- Recurso de outro tenant (ex: classId de tenant diferente) → `404` — nunca `403`, para não vazar existência do recurso

### Gamificação — Regras de Cálculo

> ⚠️ Todos os valores abaixo são **padrões de plataforma**. Cada tenant pode sobrescrever via
> `tenants.settings.gamification`. O service nunca deve hardcodar esses valores.
> Regras completas em `agent_docs/gamificacao.md`.

- **Nível**: `level = floor(totalXp / xp_per_level) + 1` — padrão `xp_per_level = 100`
- **Streak**: incrementa quando o aluno tem pelo menos uma submissão aprovada em um dia de calendário (UTC). Zera se não houver aprovação no dia anterior.
- **Bônus de primeira tentativa**: `floor(base_xp × (first_attempt_bonus_multiplier − 1))` — padrão multiplicador `1.5`
- **Bônus de streak**: `streak_bonus_xp × current_streak` XP extra — padrão `streak_bonus_xp = 5`
- **Badges**: verificação **síncrona** após cada concessão de XP. Retornados no campo `newBadges: [{ slug, name, iconUrl }]`

### Notificações — Eventos de Disparo

| Evento | type | Destinatário |
|---|---|---|
| Badge conquistado | `badge_earned` | student |
| Subida de nível | `level_up` | student |
| Milestone de streak (7, 30, 100 dias) | `streak_milestone` | student |
| Módulo desbloqueado pelo gestor | `module_unlocked` | student |
| Submissão aprovada em revisão manual | `submission_reviewed` | student |

---

## Autenticação — `/api/:slug/auth`

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| POST | `/login` | público | Login com email + senha |
| POST | `/logout` | sessão | Encerra a sessão atual |
| GET | `/me` | sessão | Retorna usuário autenticado |
| PATCH | `/profile` | sessão | Atualiza nome e avatar do próprio usuário |
| PATCH | `/password` | sessão | Troca de senha autenticada |
| POST | `/forgot-password` | público | Envia e-mail de recuperação |
| POST | `/reset-password` | público | Redefine senha com token |

### POST `/login`
```
Request:  { email, password }
Response: { data: { user: { id, name, email, role }, redirectTo } }
Cookie:   Set-Cookie: sessionId=...; HttpOnly; SameSite=Lax
// redirectTo por role: student → /:slug/learn | manager → /:slug/dashboard | super_admin → /admin
// 401 { error: { code: "INVALID_CREDENTIALS" } } — credenciais inválidas (resposta genérica, não revelar se e-mail existe)
// 403 { error: { code: "ACCOUNT_DISABLED" } }  — conta ou tenant desativado
```

### GET `/me`
```
Response: { data: { user: { id, name, email, role, avatarUrl, tenantId } } }
```

### POST `/logout`
```
Request:  (sem body)
Response: { data: { message: "Sessão encerrada" } }
// Apaga o cookie session_id e invalida a sessão no banco
```

### POST `/forgot-password`
```
Request:  { email }
Response: { data: { message: "E-mail enviado se o endereço existir" } }
```
> Resposta genérica intencional — não revelar se o e-mail existe.

### POST `/reset-password`
```
Request:  { token, newPassword }
Response: { data: { message: "Senha redefinida com sucesso" } }
// Invalida todas as sessões ativas do usuário após redefinição (DELETE WHERE user_id = ...)
// 422 se token inválido, expirado ou já utilizado
```

### PATCH `/profile`
```
Request:  { name?, avatarUrl? }
Response: { data: { user: { id, name, email, role, isActive, avatarUrl, createdAt } } }
// Qualquer role autenticado pode atualizar os próprios dados
```

### PATCH `/password`
```
Request:  { currentPassword, newPassword }
Response: { data: { message: "Senha atualizada" } }
// 401 se currentPassword incorreto
// Invalida todas as outras sessões ativas do usuário ao trocar a senha (sessão atual mantida)
```

---

## Usuários — `/api/:slug/users`

> Acesso: `manager`. Aluno só acessa `/me` via auth.

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| GET | `/` | manager | Lista usuários do tenant (filtrável por role) |
| POST | `/` | manager | Cria usuário individual |
| GET | `/template` | manager | Download do modelo CSV (Content-Type: text/csv) |
| POST | `/import` | manager | Importa alunos via CSV |
| GET | `/:userId` | manager | Detalhes do usuário |
| PATCH | `/:userId` | manager | Atualiza nome, avatar |
| DELETE | `/:userId` | manager | Desativa usuário (soft delete — `is_active = false`; 422 se auto-desativação; 403 se alvo for manager ou superior) |
| POST | `/:userId/resend-invite` | manager | Reenvia e-mail de convite |

### GET `/`
```
Query:    ?role=student|manager&page=1&limit=20
Response: { data: [{ id, name, email, role, isActive, createdAt }], meta: { total, page, limit } }
```

### POST `/`
```
Request:  { name, email, role: 'student' | 'manager' }
Response: { data: { user } }
// Envia e-mail de convite (type: 'invite') automaticamente
```

### PATCH `/:userId`
```
Request:  { name?, avatarUrl? }
Response: { data: { user } }
// role não é atualizável por este endpoint — campo ignorado se enviado
```

### GET `/:userId`
```
Response: { data: { user: { id, name, email, role, isActive, avatarUrl, createdAt } } }
```

### POST `/:userId/resend-invite`
```
Request:  (sem body)
Response: { data: { message: "Convite reenviado" } }
// Invalida tokens de convite anteriores (marca usedAt) e cria novo token
// 422 se não existe nenhum token 'invite' não-usado para o usuário (já configurou o acesso)
```

### GET `/template`
```
Response: Content-Type: text/csv
// Colunas: name,email  (cabeçalho obrigatório no import)
// Exemplo de linha: João Silva,joao@escola.com
```

### POST `/import`
```
Request:  multipart/form-data — campo "file" com o CSV
Response: { data: { created: N, skipped: N, errors: [{ row, reason }] } }
// Todos os usuários importados recebem role = 'student' automaticamente
// skipped: e-mail já existe para este tenant (não sobrescreve)
// Erros por linha não interrompem o import — processa tudo e reporta
```

---

## Turmas — `/api/:slug/classes`

> Leitura (GET): `manager` e `professor`. Escrita (CRUD, vínculos): `manager`.
> O `professor` enxerga **apenas as turmas atribuídas a ele** (via `class_teachers`); turma fora do escopo retorna **404**, não 403. O escopo é aplicado na camada de service, não só no guard.

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| GET | `/` | manager, professor | Lista turmas do tenant (professor: só as atribuídas) |
| POST | `/` | manager | Cria turma |
| GET | `/:classId` | manager, professor | Detalhes da turma |
| PATCH | `/:classId` | manager | Atualiza configurações |
| DELETE | `/:classId` | manager | Remove turma (cascata: weekly challenges → alunos → professores → trilhas; 409 se há submissões) |
| GET | `/:classId/students` | manager, professor | Alunos da turma |
| POST | `/:classId/students` | manager | Adiciona aluno à turma |
| DELETE | `/:classId/students/:studentId` | manager | Remove aluno da turma (preserva submissions e module_progress) |
| GET | `/:classId/teachers` | manager, professor | Professores vinculados à turma |
| POST | `/:classId/teachers` | manager | Vincula professor à turma |
| DELETE | `/:classId/teachers/:teacherId` | manager | Desvincula professor da turma |
| GET | `/:classId/trails` | manager, professor | Trilhas da turma |
| POST | `/:classId/trails` | manager | Atribui trilha à turma |
| PATCH | `/:classId/trails/:trailId` | manager | Atualiza ordem ou visual_blocks_enabled |
| DELETE | `/:classId/trails/:trailId` | manager | Remove trilha da turma (preserva module_progress e submissions) |

### GET `/`
```
Response: { data: [{ id, name, progressionMode, validationMode, showRanking, studentsCount, createdAt }] }
```

### POST `/`
```
Request:  { name, progressionMode?: 'free'|'sequential'|'controlled', validationMode?: 'auto'|'auto_review'|'manual', showRanking?: boolean }
Response: { data: { class } }
// progressionMode default: 'sequential' | validationMode default: 'auto' | showRanking default: true
```

### PATCH `/:classId`
```
Request:  { name?, progressionMode?, validationMode?, showRanking? }
Response: { data: { class } }
```

### GET `/:classId`
```
Response: {
  data: {
    class: { id, name, progressionMode, validationMode, showRanking, createdAt },
    studentsCount: N,
    trailsCount: N
  }
}
```

### GET `/:classId/trails`
```
Response: { data: [{ id, slug, title, order, visualBlocksEnabled }] }
```

### GET `/:classId/students`
```
Response: { data: [{ id, name, email, avatarUrl, isActive }], meta: { total } }
```

### POST `/:classId/students`
```
Request:  { studentId }
Response: { data: { classStudent } }
// 409 se aluno já está na turma
// 404 se studentId não pertence ao tenant
```

### GET `/:classId/teachers`
```
Response: { data: [{ id, name, email, avatarUrl, isActive }], meta: { total } }
```

### POST `/:classId/teachers`
```
Request:  { teacherId }
Response: { data: { classTeacher: { id, classId, teacherId, assignedAt } } }
// 422 se o usuário não tem papel 'professor'
// 409 se o professor já está vinculado à turma
// 404 se teacherId não pertence ao tenant
```

### DELETE `/:classId/teachers/:teacherId`
```
Response: { data: { message } }
// 404 se o vínculo não existe
```

### POST `/:classId/trails`
```
Request:  { trailId, order, visualBlocksEnabled?: boolean }
Response: { data: { classTrail } }
// trailId deve estar em tenant_trails (trilha ativada pelo tenant)
```

### PATCH `/:classId/trails/:trailId`
```
Request:  { order?, visualBlocksEnabled? }
Response: { data: { classTrail } }
```

---

## Trilhas do Tenant — `/api/:slug/trails`

> Leitura: `manager` e `student`. Escrita: `manager`.

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| GET | `/` | manager | Lista trilhas ativadas pelo tenant |
| POST | `/` | manager | Ativa trilha do catálogo |
| PATCH | `/:trailId/order` | manager | Reordena trilha |
| DELETE | `/:trailId` | manager | Remove trilha do tenant |

### GET `/`
```
Response: { data: [{ id, slug, title, description, language, order }] }
```

### PATCH `/:trailId/order`
```
Request:  { order: N }
Response: { data: { tenantTrail } }
```

### POST `/`
```
Request:  { trailId, order? }
Response: { data: { tenantTrail } }
// trailId deve existir no catálogo global (tabela trails)
// 409 se trilha já ativada para este tenant
```

---

## Autoria de trilhas (gestor) — `/api/:slug/authoring` *(Sprint 9.1)*

O gestor cria e edita **trilhas próprias da escola** (`trails.tenant_id` = tenant). Mesma modelagem do catálogo, mas escopada ao tenant. Guard: `manager`.

| Método | Rota | Descrição |
|---|---|---|
| GET | `/authoring/trails` | Lista as trilhas próprias da escola |
| POST | `/authoring/trails` | Cria trilha própria (slugify + auto-ativa no tenant) |
| GET | `/authoring/trails/:trailId` | Detalhe (módulos + desafios completos) |
| PATCH/DELETE | `/authoring/trails/:trailId` | Edita / remove trilha própria |
| POST | `/authoring/trails/:trailId/modules` · PATCH/DELETE `/authoring/modules/:moduleId` | Módulos |
| POST | `/authoring/modules/:moduleId/challenges` · PATCH/DELETE `/authoring/challenges/:challengeId` | Desafios |
| POST | `/authoring/generate-challenge` | Gera um rascunho de desafio por IA (Sonnet) e o **verifica no runner** antes de devolver |

**Geração de desafio por IA (`generate-challenge`):** body `{ topic, difficulty?, testMode? }`.
O modelo devolve enunciado + `testCases` + solução de referência; o backend roda a solução no
`@codinhos/runner` contra os `testCases` (com 1 retentativa realimentando o erro) e responde
`{ challenge, referenceSolution, verified, message }`. Nada é salvo — o gestor revisa e salva pela
UI de autoria.

**Campos de desafio (autoria):** além de `title`, `description`, `starterCode`, `difficulty`,
`baseXp`, os desafios aceitam `targetFn` (função avaliada) e `renderMode` (`js`/`p5`). Os
`testCases` seguem o shape do runner (`matcher`, `mode: stdout|ast`, `astRule`) — ver `database.md`.

**Professores — turmas de um professor (gestor):** `GET /:slug/teachers/:teacherId/classes` → IDs das turmas atribuídas (usado na tela de Professores para marcar/desmarcar turmas).

---

## Aprendizado — `/api/:slug/learn`

> Acesso: `student`

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| GET | `/` | student | Dashboard: trilhas e progresso do aluno |
| GET | `/trails/:trailId` | student | Trilha com módulos e status de progresso |
| GET | `/modules/:moduleId` | student | Conteúdo do módulo (conceito, exemplo, desafio atual) |
| GET | `/challenges/:challengeId` | student | Detalhes do desafio + starter code |
| POST | `/modules/:moduleId/complete` | student | Conclui uma **lição** (módulo sem desafio) → +5 XP |

> **Lições** são módulos sem desafio (`kind: 'lesson'`): só conceito/exemplo. O aluno conclui com "Entendi, avançar", que chama `POST /:slug/learn/modules/:moduleId/complete` — idempotente, concede `LESSON_XP` (=5) uma única vez e retorna `nextModuleId`. Retorna 422 se o módulo tiver desafio.

### GET `/`
```
Query:    ?classId=   // obrigatório — aluno pode estar em múltiplas turmas
Response: {
  data: {
    class: { id, name },
    trails: [{
      id, title,
      progress: { completed, total },
      status: 'not_started' | 'in_progress' | 'completed'
      // not_started: nenhum módulo completed | in_progress: ≥1 completed | completed: todos completed
    }],
    stats: { xp, level, streak }
  }
}
// 400 se classId não fornecido
// 403 se o aluno não pertence à turma informada
// trails: [] se a turma não tiver trilhas atribuídas (aluno recém adicionado)
```

### GET `/trails/:trailId`
```
Query:    ?classId=   // necessário para resolver visualBlocksEnabled e status de progresso
Response: {
  data: {
    trail: { id, title, description },
    visualBlocksEnabled: boolean,   // de class_trails para este aluno + turma
    modules: [{
      id, title, order,
      status: 'locked' | 'available' | 'completed',
      challenge: { id, title, difficulty }
    }]
  }
}
```

### GET `/modules/:moduleId`
```
Query:    ?classId=   // necessário para resolver visualBlocksEnabled da turma
Response: {
  data: {
    module: { id, title, concept, exampleCode },
    challenge: { id, title, description, starterCode, difficulty, baseXp },
    progress: { status, attempts },
    visualBlocksEnabled: boolean   // de class_trails para este aluno + turma
  }
}
```

### GET `/challenges/:challengeId`
```
Query:    ?classId=   // necessário para resolver visualBlocksEnabled
Response: {
  data: {
    challenge: { id, title, description, starterCode, difficulty, baseXp },
    visualBlocksEnabled: boolean,
    myLastSubmission: { id, code, status, testResults } | null
  }
}
```

---

## Submissões — `/api/:slug/challenges/:challengeId/submissions`

> Acesso: `student` (criar + ver as próprias), `manager` e `professor` (ver da turma + revisar).
> O `professor` só acessa submissões de turmas atribuídas a ele (fora do escopo → 404).

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| POST | `/` | student | Submete solução |
| GET | `/` | student, manager, professor | Lista submissões (student: só as próprias; manager/professor: todas da turma) |
| GET | `/:submissionId` | student, manager, professor | Detalhes da submissão |
| PATCH | `/:submissionId/review` | manager, professor | Atribui nota e feedback (modo manual) |

### POST `/`
```
Request:  { code, classId }
// classId no body (não na URL) — o mesmo desafio pode ser submetido em turmas diferentes,
// cada uma com seu próprio validationMode e registros de submission
Response: {
  data: {
    submission: { id, status, testResults, attemptNumber },
    xpEarned: N,
    newBadges: [{ slug, name, iconUrl }]   // badges conquistados nesta submissão (pode ser [])
    // xpEarned = 0 se: falhou | já tinha passado antes | modo auto_review (pendente de revisão)
    // xpEarned > 0 apenas em primeira aprovação por modo 'auto'
  }
}
// 403 se o módulo do desafio está com status 'locked' para o aluno na turma informada
// 400 se o desafio pertence a um weekly challenge encerrado (ends_at < now) — submissão ainda
//     é permitida normalmente via endpoint de challenges; o guard é no contexto do weekly
// Fluxo por validationMode da turma (ou validationModeOverride do desafio, se presente):
//   auto:        testa imediatamente → status = passed | failed; XP concedido se passed
//   auto_review: testa imediatamente → status = under_review; XP = 0 até PATCH /review
//   manual:      não testa → status = under_review; XP = 0 até PATCH /review
```

### GET `/`
```
Query:    ?classId=   // obrigatório para manager; opcional para student (filtra por turma)
          &status=pending|passed|failed|under_review
          &page=1&limit=20
Response: {
  data: [{ id, studentId, studentName, status, attemptNumber, submittedAt }],
  meta: { total, page, limit }
}
// student: retorna apenas as próprias submissões (studentId ignorado)
// manager: retorna todas as submissões do desafio na turma informada
```

### GET `/:submissionId`
```
Response: {
  data: {
    submission: { id, code, status, attemptNumber, testResults, score, reviewerNote, submittedAt, reviewedAt }
  }
}
```

### PATCH `/:submissionId/review`
```
Request:  { score, reviewerNote, status: 'passed' | 'failed' }
Response: { data: { submission, xpEarned: N, newBadges: [{ slug, name, iconUrl }] } }
// Se status = 'passed': dispara XP award e verificação de badges (igual ao fluxo automático)
// XP só é concedido se for a primeira aprovação do aluno neste desafio
// 400 se submission.status não for 'under_review'
```

---

## Progresso de Módulos — `/api/:slug/progress`

> Acesso: `manager` (desbloquear), `student` (leitura via /learn)

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| PATCH | `/modules/:moduleId/unlock` | manager | Desbloqueia módulo no modo `controlled` |

### PATCH `/modules/:moduleId/unlock`
```
Request:  { studentId, classId }
Response: { data: { moduleProgress } }
// classId é obrigatório — determina qual turma tem o modo 'controlled'
// 400 se a turma não usa progressionMode = 'controlled'
// 403 se o módulo não pertence a uma trilha atribuída à turma
```

---

## Gamificação — `/api/:slug/gamification`

> Acesso: `student` e `manager`

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| GET | `/me` | student | XP, nível, streak, badges do aluno |
| GET | `/ranking/:classId` | student + manager | Ranking da turma |
| GET | `/badges` | student | Todos os badges + quais o aluno conquistou |
| GET | `/xp-events` | student | Histórico paginado de eventos de XP |

### GET `/me`
```
Response: {
  data: {
    totalXp, level, currentStreak, longestStreak,
    badges: [{ id, slug, name, earnedAt }]
  }
}
```

### GET `/ranking/:classId`
```
Response: {
  data: {
    ranking: [{ position, student: { id, name, avatarUrl }, totalXp, level }],
    myPosition: N
  }
}
// 403 se showRanking = false na turma e o requisitante for student
// manager sempre pode consultar independente de showRanking
```

### GET `/badges`
```
Response: {
  data: [{ id, slug, name, description, iconUrl, triggerType, triggerValue, earned: boolean, earnedAt: timestamp | null }]
}
```

### GET `/xp-events`
```
Query:    ?page=1&limit=20
Response: {
  data: [{ id, amount, reason, refId, createdAt }],
  meta: { total, page, limit }
}
```

---

## Notificações — `/api/:slug/notifications`

> Acesso: `student` e `manager`

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| GET | `/` | sessão | Lista notificações do usuário |
| GET | `/unread-count` | sessão | Contagem de não lidas (para badge no sino) |
| PATCH | `/:notificationId/read` | sessão | Marca como lida |
| PATCH | `/read-all` | sessão | Marca todas como lidas |

### GET `/`
```
Query:    ?page=1&limit=20&read=true|false
Response: {
  data: [{ id, type, title, body, readAt, createdAt }],
  meta: { total, page, limit }
}
```

### PATCH `/:notificationId/read`
```
Response: { data: { notification: { id, readAt } } }
// 404 se notificação não pertence ao usuário autenticado
```

### PATCH `/read-all`
```
Response: { data: { updated: N } }
// N = quantidade de notificações marcadas como lidas
```

### GET `/unread-count`
```
Response: { data: { count: N } }
// Rota leve para polling periódico no frontend
```

---

## Responsáveis — `/api/:slug/guardians` e `/api/:slug/guardian`

> Gestão (`/guardians`): `manager`. Portal read-only (`/guardian`): `guardian`.
> O responsável (`guardian`) é um usuário com papel próprio; recebe convite e define
> senha pelo mesmo fluxo `accept-invite`. Vê **apenas** os filhos vinculados a ele
> (via `guardian_students`); sem acesso a sandbox, chat de IA ou qualquer escrita.

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| GET | `/guardians` | manager | Lista responsáveis do tenant (com contagem de filhos) |
| POST | `/guardians` | manager | Cria responsável (envia convite) e vincula alunos opcionais |
| GET | `/guardians/:guardianId/students` | manager | Alunos vinculados ao responsável |
| POST | `/guardians/:guardianId/students` | manager | Vincula um aluno |
| DELETE | `/guardians/:guardianId/students/:studentId` | manager | Desvincula um aluno |
| GET | `/guardian/children` | guardian | Filhos vinculados (resumo: nível, XP, streak, atividade) |
| GET | `/guardian/children/:studentId` | guardian | Detalhe read-only do filho (stats, badges, progresso por trilha) |

### POST `/guardians`
```
Request:  { name, email, studentIds?: uuid[] }
Response: { data: { guardian: { id, name, email, isActive, studentsCount, createdAt } } }
// 409 se o e-mail já existe no tenant
// 404 se algum studentId não for um aluno do tenant (responsável NÃO é criado nesse caso)
// Envia convite (type 'invite') — responsável define senha via accept-invite
```

### POST `/guardians/:guardianId/students`
```
Request:  { studentId }
Response: { data: { guardianStudent: { id, guardianId, studentId, createdAt } } }
// 404 se studentId não for aluno do tenant; 409 se já vinculado
```

### GET `/guardian/children`
```
Response: { data: [{ id, name, avatarUrl, totalXp, level, currentStreak, lastActivity }] }
```

### GET `/guardian/children/:studentId`
```
Response: {
  data: {
    student: { id, name, avatarUrl },
    stats: { totalXp, level, currentStreak },
    badges: [{ slug, name, earnedAt }],
    trails: [{ id, title, progress: { completed, total }, lastActivity }]
  }
}
// 404 se o aluno não for um filho vinculado ao responsável autenticado
```

---

## Integrações — Google Classroom (`/api/:slug/integrations/google`)

> Acesso: `manager`. Rostering **one-way**: importa uma turma do Classroom (turma + alunos)
> para o Codinhos. Depois a gestão é manual. OAuth2 via conta Google do gestor; tokens por
> tenant em `google_integrations`. Requer `GOOGLE_CLIENT_ID/SECRET/REDIRECT_URI` (ver env).

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| GET | `/status` | manager | Conexão atual (`{ connected, googleEmail }`) |
| GET | `/auth-url` | manager | URL de consentimento Google (seta cookie de `state` CSRF) |
| GET | `/api/integrations/google/callback` | sessão (gestor) | Callback do OAuth (path **fixo**, sem slug — exigência do Google). Valida `state`, troca o code, salva tokens e redireciona para `…/manager/settings?google=connected\|error` |
| GET | `/courses` | manager | Lista cursos ativos do Classroom |
| POST | `/import` | manager | Importa um curso → cria turma + alunos + matrículas |
| DELETE | `/` (`/integrations/google`) | manager | Desconecta a conta Google (remove tokens) |

### POST `/:slug/integrations/google/import`
```
Request:  { courseId, courseName }
Response: { data: { classId, className, total, created, reused } }
// created = alunos novos criados (recebem convite accept-invite)
// reused  = alunos que já existiam no tenant (por e-mail) — apenas matriculados
// Re-importar o mesmo curso cria uma NOVA turma (one-way; sem dedupe de turma)
// 422 se a conta Google não estiver conectada
```

---

## Dashboard do Gestor — `/api/:slug/dashboard`

> Visão geral do tenant: `manager`. Detalhe de turma/aluno: `manager` e `professor`.
> O `professor` só vê detalhe de turmas atribuídas a ele e de alunos dessas turmas (fora do escopo → 404).

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| GET | `/` | manager | Visão geral: turmas, alunos ativos, alertas |
| GET | `/students/:studentId` | manager, professor | Progresso detalhado do aluno |
| GET | `/classes/:classId` | manager, professor | Progresso da turma |
| GET | `/review-queue` | manager, professor | Submissões aguardando revisão manual (escopo do ator) |

### GET `/`
```
Response: {
  data: {
    totalStudents, activeToday, totalClasses,
    alerts: [{ type, studentId, studentName, classId, message }]
  }
}
// activeToday: alunos com pelo menos uma submissão nas últimas 24h
// Tipos de alerta (type):
//   'pending_review'    — submissão aguardando revisão manual há mais de 24h
//   'no_activity_7d'    — aluno sem atividade há 7+ dias
//   'stuck_on_module'   — aluno com 5+ tentativas falhas no mesmo desafio
```

### GET `/students/:studentId`
```
Response: {
  data: {
    student: { id, name, avatarUrl },
    stats: { totalXp, level, currentStreak },
    badges: [{ slug, name, earnedAt }],
    trails: [{
      id, title,
      progress: { completed, total },
      lastActivity: timestamp | null
    }]
  }
}
```

### GET `/classes/:classId`
```
Response: {
  data: {
    class: { id, name, progressionMode, validationMode },
    stats: { totalStudents, activeToday, avgXp },
    students: [{
      id, name, avatarUrl, totalXp, level,
      lastActivity: timestamp | null,
      pendingReview: N   // submissões aguardando revisão manual
    }]
    // MVP: students não paginado — adequado para turmas de até ~50 alunos
  }
}
```

---


### GET `/review-queue`
```
Response: { data: [{
  submissionId, challengeId, challengeTitle,
  studentId, studentName, classId, className,
  attemptNumber, submittedAt
}] }
// status under_review apenas; professor vê só as turmas atribuídas, gestor vê o tenant.
// Para revisar: PATCH /:slug/challenges/:challengeId/submissions/:submissionId/review
```

## Desafio da Semana — `/api/:slug/weekly-challenges`

> Acesso: `manager` (criar), `student` + `manager` (consultar)

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| GET | `/:classId` | manager + student | Desafio da semana ativo da turma |
| POST | `/:classId` | manager | Cria desafio da semana |
| GET | `/:classId/history` | manager + student | Histórico de desafios passados |
| GET | `/:classId/:weeklyId/leaderboard` | manager + student | Placar do desafio |

### GET `/:classId`
```
Response: {
  data: {
    weeklyChallenge: {
      id, challenge: { id, title, description, difficulty },
      startsAt, endsAt,
      mySubmission: { status, attemptNumber } | null
    } | null   // null se não houver desafio ativo
  }
}
```

### POST `/:classId`
```
Request:  { challengeId, startsAt, endsAt }
Response: { data: { weeklyChallenge } }
// 409 se já existe um desafio ativo ou futuro com período sobreposto para esta turma
```

### GET `/:classId/:weeklyId/leaderboard`
```
Response: {
  data: {
    leaderboard: [{ position, student: { id, name, avatarUrl }, submittedAt, status }],
    myPosition: N | null
  }
}
// Ordenado por: passou primeiro (status=passed) > tentativas > tempo de submissão
```

### GET `/:classId/history`
```
Response: {
  data: {
    history: [{ id, challenge: { id, title }, startsAt, endsAt, topStudents: [{ name, xp }] }]
  }
}
// Desafios passados (ends_at < now), ordenados do mais recente ao mais antigo
```

---

## Configurações do Tenant — `/api/:slug/settings`

> Acesso: `manager`

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| GET | `/theme` | público | Apenas o tema (usado no boot do app, antes do login) |
| GET | `/settings` | manager | Tema + configurações completas do tenant |
| PATCH | `/settings` | manager | Atualiza theme, gamification e/ou aiErrorExplanationEnabled |

### GET `/theme`
```
Response: { data: { theme: { "--color-primary": "#...", ... } | null } }
```

### GET `/settings`
```
Response: {
  data: {
    settings: {
      name: string
      plan: string
      theme: { "--color-primary": "#...", ... } | null
      gamification: { xpPerLevel, firstAttemptBonusMultiplier, streakBonusXp, streakBonusMaxXp, streakMilestoneDays } | null
      aiMessagesPerDay: number | null   // somente leitura — definido pelo Super Admin
      maxStudents: number | null        // somente leitura — definido pelo Super Admin
      aiErrorExplanationEnabled: boolean // default true; editável pelo gestor
    }
  }
}
```

### PATCH `/settings`
```
Request: {
  theme?: { "--color-primary": "#...", ... }
  gamification?: { xpPerLevel?, firstAttemptBonusMultiplier?, streakBonusXp?, streakBonusMaxXp?, streakMilestoneDays? }
  aiErrorExplanationEnabled?: boolean
}
Response: { data: { settings: /* mesmo formato do GET /settings */ } }
```

---

## Autenticação Admin — `/api/admin/auth`

> Rota pública para login do Super Admin. Sem slug — o `super_admin` não pertence a nenhum tenant.

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| POST | `/login` | público | Login do Super Admin |
| POST | `/logout` | sessão | Encerra sessão do Super Admin |

### POST `/login`
```
Request:  { email, password }
Response: { data: { user: { id, name, role: 'super_admin' }, redirectTo: '/admin' } }
Cookie:   Set-Cookie: sessionId=...; HttpOnly; SameSite=Lax
// 401 { error: { code: "INVALID_CREDENTIALS" } }
```

---

## Admin — `/api/admin`

> Acesso: `super_admin`. Sem slug.

### Usuários

| Método | Rota | Descrição |
|---|---|---|
| GET | `/users` | Lista usuários (filtrável por tenant, role) |

### GET `/users`
```
Query:    ?tenantId=&role=&isActive=&page=1&limit=20
Response: { data: [{ id, name, email, role, isActive, tenantId, createdAt }], meta: { total, page, limit } }
```

### Tenants

| Método | Rota | Descrição |
|---|---|---|
| GET | `/tenants` | Lista todos os tenants |
| POST | `/tenants` | Cria tenant + gestor inicial |
| GET | `/tenants/:tenantId` | Detalhes do tenant |
| PATCH | `/tenants/:tenantId` | Atualiza plano, settings, tema padrão |
| DELETE | `/tenants/:tenantId` | Desativa tenant (soft delete — `is_active = false`) |

### GET `/tenants`
```
Query:    ?page=1&limit=20&isActive=true|false   // default: retorna todos
Response: { data: [{ id, slug, name, plan, isActive, createdAt }], meta: { total, page, limit } }
```

### GET `/tenants/:tenantId`
```
Response: { data: { tenant: { id, slug, name, plan, settings, theme, isActive, createdAt } } }
```

### POST `/tenants`
```
Request:  {
  slug,
  name,
  plan?: string,         // default: 'free'
  settings?: object,     // ex: { ai_messages_per_day: 20 }
  managerName,
  managerEmail
}
Response: { data: { tenant, manager: { id, email }, inviteSent: boolean } }
// Cria tenant + usuário manager + tenta enviar convite ao gestor
// inviteSent: false se o envio de e-mail falhou (token criado, gestor pode reenviar depois)
// 409 se slug já existe
```

### PATCH `/tenants/:tenantId`
```
Request:  { name?, plan?, settings?, theme? }
Response: { data: { tenant } }
// settings é merged (não substituído): { ai_messages_per_day: 30 } preserva max_students existente
// Para desabilitar IA completamente: settings.ai_messages_per_day = 0
```

### DELETE `/tenants/:tenantId`
```
Response: { data: { message: "Tenant desativado" } }
// is_active = false no tenant → DELETE FROM sessions WHERE tenant_id = :tenantId
// Usuários não são deletados — ficam inacessíveis via ACCOUNT_DISABLED enquanto tenant inativo
// 422 se tenantId = tenant __system__ (não pode desativar o tenant do Super Admin)
// 422 se tenant já está inativo
```

### Catálogo de Trilhas

| Método | Rota | Descrição |
|---|---|---|
| GET | `/trails` | Lista trilhas do catálogo |
| POST | `/trails` | Cria trilha |
| GET | `/trails/:trailId` | Detalhe da trilha com módulos e desafios |
| PATCH | `/trails/:trailId` | Atualiza trilha |
| DELETE | `/trails/:trailId` | Remove trilha do catálogo (409 se em uso por algum tenant) |
| POST | `/trails/:trailId/modules` | Cria módulo |
| PATCH | `/modules/:moduleId` | Atualiza módulo |
| DELETE | `/modules/:moduleId` | Remove módulo (409 se tem desafios com submissions) |
| POST | `/modules/:moduleId/challenges` | Cria desafio |
| PATCH | `/challenges/:challengeId` | Atualiza desafio |
| DELETE | `/challenges/:challengeId` | Remove desafio (409 se tem submissions) |

### GET `/trails`
```
Query:    ?language=&page=1&limit=20
Response: { data: [{ id, slug, title, description, language, order }], meta: { total, page, limit } }
```

### GET `/trails/:trailId`
```
Response: {
  data: {
    trail: { id, slug, title, description, language, order },
    modules: [{
      id, title, order,
      challenges: [{ id, title, difficulty, order, baseXp }]
    }]
  }
}
```

### POST `/trails`
```
Request:  { slug, title, description, language: 'javascript' | 'python', order? }
Response: { data: { trail } }
// 409 se slug já existe no catálogo
```

### PATCH `/trails/:trailId`
```
Request:  { title?, description?, order? }
Response: { data: { trail } }
```

### POST `/trails/:trailId/modules`
```
Request:  { title, concept, exampleCode, order? }
Response: { data: { module } }
```

### PATCH `/modules/:moduleId`
```
Request:  { title?, concept?, exampleCode?, order? }
Response: { data: { module } }
```

### POST `/modules/:moduleId/challenges`
```
Request:  {
  title, description, starterCode,
  testCases: [{ input, expected, description }],
  difficulty: 'easy' | 'medium' | 'hard',
  order?, baseXp?, validationModeOverride?
}
Response: { data: { challenge } }
```

### PATCH `/challenges/:challengeId`
```
Request:  { title?, description?, starterCode?, testCases?, difficulty?, order?, baseXp?, validationModeOverride? }
Response: { data: { challenge } }
```

### Badges

| Método | Rota | Descrição |
|---|---|---|
| GET | `/badges` | Lista badges |
| POST | `/badges` | Cria badge |
| PATCH | `/badges/:badgeId` | Atualiza badge |
| DELETE | `/badges/:badgeId` | Remove badge |

### GET `/badges`
```
Response: { data: [{ id, slug, name, description, iconUrl, triggerType, triggerValue }] }
```

### POST `/badges`
```
Request:  { slug, name, description, iconUrl, triggerType, triggerValue }
Response: { data: { badge } }
```

### PATCH `/badges/:badgeId`
```
Request:  { name?, description?, iconUrl?, triggerType?, triggerValue? }
Response: { data: { badge } }
```

---

## Catálogo do Super Admin — `/api/admin` *(Sprint 9.2)*

CRUD do **catálogo global** (trilhas com `tenant_id` NULL). Guard: `super_admin`. Sem slug na rota.

| Método | Rota | Descrição |
|---|---|---|
| GET/POST | `/admin/trails` · GET/PATCH/DELETE `/admin/trails/:trailId` | Trilhas globais |
| POST | `/admin/trails/:trailId/modules` · PATCH/DELETE `/admin/modules/:moduleId` | Módulos |
| POST | `/admin/modules/:moduleId/challenges` · PATCH/DELETE `/admin/challenges/:challengeId` | Desafios |
| POST | `/admin/users/:userId/reset-password` | Dispara reset de senha para qualquer usuário (cross-tenant); devolve o link e envia e-mail |

> `GET /admin/trails/:trailId` retorna os desafios **completos** (description/starterCode/testCases) para o editor do admin pré-preencher.

---

## Tutor de IA (Codi) — `/:slug/ai`

> Exclusivo para role `student`. O tutor é o Codi, personagem pedagógico da plataforma.

### Modelo e custo

- **Modelo**: `claude-haiku-4-5-20251001` (mais rápido e barato)
- **Camada pedagógica (`intent`)**: `chat` (padrão), `hint` (dica progressiva — o `hintLevel`
  controla o quanto revela, sem entregar a resposta) e `review` (feedback de "como melhorar"
  após o aluno acertar). O `intent` só ajusta o system prompt; a conversa e o limite são os mesmos.
- **Histórico**: últimas 10 mensagens da conversa enviadas à API
- **Conversa por desafio**: cada desafio tem sua própria conversa; trocar de desafio reinicia o contexto
- **Limite diário**: configurável em `tenants.settings.ai_messages_per_day` (padrão: 20 msgs/aluno/dia)
- **Contagem**: 1 por mensagem enviada pelo aluno (1 request = 1 msg user + 1 msg assistant = 1 no contador)

### System prompt (contexto injetado a cada request)

O tutor recebe no system prompt, a cada request:
- Nome, escola e nível do aluno
- Título, enunciado, dificuldade e conceito do módulo do desafio
- Código atual do aluno (se enviado no body)

Isso garante que o tutor sempre conhece o desafio, mesmo após vários turnos de conversa.

### Endpoints

| Método | Rota | Role | Descrição |
|---|---|---|---|
| GET | `/:slug/ai/challenges/:challengeId/conversation` | student | Obtém/cria conversa e histórico |
| POST | `/:slug/ai/challenges/:challengeId/messages` | student | Envia mensagem e recebe resposta |
| POST | `/:slug/ai/modules/:moduleId/messages` | student | Codi na **lição**: pergunta sobre o conteúdo do módulo. Contexto = conceito/exemplo do módulo; **não persiste** a conversa (histórico enviado no body). Mesmo limite diário. |

### GET `/:slug/ai/challenges/:challengeId/conversation`

Retorna (ou cria) a conversa do aluno para o desafio, com as últimas mensagens e o status de uso diário.

```
Response: {
  data: {
    conversationId: string,
    messages: [{ id, role: 'user' | 'assistant', content, createdAt }],
    messagesUsedToday: number,
    dailyLimit: number | null    // null = sem limite configurado
  }
}
```

### POST `/:slug/ai/challenges/:challengeId/messages`

Envia uma mensagem do aluno e retorna a resposta do tutor.

```
Request: {
  message: string           // obrigatório, 1–2000 chars
  currentCode?: string      // código atual do editor (até 10000 chars)
                            // — injetado no system prompt para contexto
  failedTest?: {            // contexto de um teste que falhou (botão "Pedir ajuda ao Codi")
    description: string     // descrição do caso de teste
    expected?: string
    actual?: string
    error?: string
  }                         // ignorado pelo backend se o tenant tiver
                            // ai_error_explanation_enabled = false
  intent?: 'chat' | 'hint' | 'review'  // chat (padrão); hint = dica progressiva
                                        // (usa hintLevel); review = feedback pós-acerto
  hintLevel?: number        // nível da dica progressiva quando intent = 'hint'
}

Response: {
  data: {
    message: { id, role: 'assistant', content, createdAt },
    messagesUsedToday: number,
    dailyLimit: number | null
  }
}

// 429 { error: { code: "TOO_MANY_REQUESTS", message: "Você atingiu o limite de X mensagens por dia..." } }
// 404 { error: { code: "NOT_FOUND", message: "Desafio não encontrado" } }
```

### Rastreamento de uso (`ai_usage`)

A tabela `ai_usage` registra `message_count` por `(tenant_id, student_id, challenge_id, date)`.
O limite diário é verificado somando todos os desafios do aluno no dia atual.
O frontend pode exibir `messagesUsedToday / dailyLimit` como barra de progresso.

---

## Vocabulário de módulo (Sprint 7.1 — autocomplete contextual)

- `trail_modules.vocabulary` (jsonb `string[]`, opcional) — termos ensinados no módulo, curados pelo admin. Aceito em `POST/PATCH /admin/modules` (catalog) e retornado no módulo.
- `GET /:slug/learn/modules/:moduleId` e `GET /:slug/learn/challenges/:challengeId` retornam `availableVocabulary: string[]` — união do vocabulário dos módulos da trilha com `order <=` o do módulo atual. O editor do aluno limita o autocomplete a essa lista.

---

## Portfólio e certificados — `/api/:slug/portfolio`

> Acesso: `student`. Reconhecimento (Sprint 8). Conclusão de trilha derivada de
> `module_progress` (sem tabela nova). Certificado gerado on-the-fly (pdfkit).

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| GET | `/portfolio` | student | Trilhas concluídas + em andamento + badges + stats |
| GET | `/portfolio/certificates/:trailId` | student | PDF do certificado da trilha (download) |

### GET `/portfolio`
```
Response: { data: {
  stats: { totalXp, level, currentStreak },
  completedTrails: [{ id, title, completedAt }],
  inProgressTrails: [{ id, title, progress: { completed, total } }],
  badges: [{ slug, name, earnedAt }]
} }
```

### GET `/portfolio/certificates/:trailId`
```
Response: application/pdf (Content-Disposition: attachment)
// 422 se a trilha não está concluída (completed < total ou total = 0)
// 404 se a trilha não existe/não está atribuída ao tenant
```


---

## Certificados por escola — `/api/:slug/certificates` *(Sprint 4)*

Templates de certificado configuráveis pela escola. Guard: `manager`. Ver tabela `certificate_templates`.

| Método | Rota | Descrição |
|---|---|---|
| GET | `/certificates/templates` | Lista os templates da escola (padrão + overrides por curso) |
| PUT | `/certificates/templates` | Upsert de um template. Body: `{ trailId: uuid\|null, enabled: boolean, config }` (trailId NULL = padrão da escola) |
| DELETE | `/certificates/templates/:templateId` | Remove um override (o curso volta a usar o padrão da escola) |

A emissão do certificado (em `/portfolio/certificates/:trailId`) resolve o template (curso → padrão da escola → embutido) e respeita `enabled` (se desligado, retorna 422 "certificado desativado").
