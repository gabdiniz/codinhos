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
Response: { data: { user: { id, name, avatarUrl } } }
// Qualquer role autenticado pode atualizar os próprios dados
// ⚠️ Não implementado — entra junto com o módulo de users
```

### PATCH `/password`
```
Request:  { currentPassword, newPassword }
Response: { data: { message: "Senha atualizada" } }
// 401 se currentPassword incorreto
// Invalida todas as outras sessões ativas do usuário ao trocar a senha
// ⚠️ Não implementado — entra junto com o módulo de users
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
| DELETE | `/:userId` | manager | Desativa usuário (soft delete — `is_active = false`; 400 se auto-desativação; 403 se alvo for manager ou superior) |
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
// 400 se o usuário já definiu senha (nenhum token de convite pendente E usuário tem sessões ativas ou trocou senha)
// Na prática: 400 se não existe nenhum token 'invite' não-usado para o usuário
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

> Acesso: `manager`

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| GET | `/` | manager | Lista turmas do tenant |
| POST | `/` | manager | Cria turma |
| GET | `/:classId` | manager | Detalhes da turma |
| PATCH | `/:classId` | manager | Atualiza configurações |
| DELETE | `/:classId` | manager | Remove turma (cascata: desvincula alunos e trilhas, preserva submissions) |
| GET | `/:classId/students` | manager | Alunos da turma |
| POST | `/:classId/students` | manager | Adiciona aluno à turma |
| DELETE | `/:classId/students/:studentId` | manager | Remove aluno da turma (preserva submissions e module_progress) |
| GET | `/:classId/trails` | manager | Trilhas da turma |
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
// 400 se studentId não pertence ao tenant
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

## Aprendizado — `/api/:slug/learn`

> Acesso: `student`

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| GET | `/` | student | Dashboard: trilhas e progresso do aluno |
| GET | `/trails/:trailId` | student | Trilha com módulos e status de progresso |
| GET | `/modules/:moduleId` | student | Conteúdo do módulo (conceito, exemplo, desafio atual) |
| GET | `/challenges/:challengeId` | student | Detalhes do desafio + starter code |

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

> Acesso: `student` (criar + ver as próprias), `manager` (ver todas da turma + revisar)

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| POST | `/` | student | Submete solução |
| GET | `/` | student + manager | Lista submissões (student: só as próprias; manager: todas da turma) |
| GET | `/:submissionId` | student + manager | Detalhes da submissão |
| PATCH | `/:submissionId/review` | manager | Atribui nota e feedback (modo manual) |

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

## Tutor de IA — `/api/:slug/ai`

> Acesso: `student`

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| POST | `/conversations` | student | Inicia conversa para um desafio |
| GET | `/conversations/:conversationId` | student | Histórico da conversa |
| POST | `/conversations/:conversationId/messages` | student | Envia mensagem ao tutor |
| GET | `/usage/:challengeId` | student | Uso de IA do aluno hoje para este desafio |

### POST `/conversations`
```
Request:  { challengeId }
Response: { data: { conversation: { id, messages: [] } } }
// Retorna conversa existente se já houver uma para este desafio
```

### GET `/conversations/:conversationId`
```
Response: {
  data: {
    conversation: {
      id, challengeId,
      messages: [{ id, role: 'user' | 'assistant', content, createdAt }]
    }
  }
}
// 404 se a conversa não pertence ao student autenticado (não vazar existência)
```

### POST `/conversations/:conversationId/messages`
```
Request:  { content }
Response: { data: { message: { role: 'assistant', content } } }
// 429 se limite diário atingido (tenants.settings.ai_messages_per_day)
// Janela diária: reseta à meia-noite UTC. Verificado via ai_usage.date (DATE no banco = UTC)
```

### GET `/usage/:challengeId`
```
Response: {
  data: {
    used: N,
    limit: N,   // de tenants.settings.ai_messages_per_day
    remaining: N
  }
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

## Dashboard do Gestor — `/api/:slug/dashboard`

> Acesso: `manager`

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| GET | `/` | manager | Visão geral: turmas, alunos ativos, alertas |
| GET | `/students/:studentId` | manager | Progresso detalhado do aluno |
| GET | `/classes/:classId` | manager | Progresso da turma |

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
| GET | `/` | manager | Tema e configurações do tenant |
| PATCH | `/theme` | manager | Atualiza variáveis CSS |

### GET `/`
```
Response: {
  data: {
    theme: { "--color-primary": "#...", ... },
    settings: { ai_messages_per_day: N, max_students: N }
  }
}
```

### PATCH `/theme`
```
Request:  { theme: { "--color-primary": "#...", ... } }
Response: { data: { theme } }
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
// 400 se tenantId = tenant __system__ (não pode desativar o tenant do Super Admin)
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
