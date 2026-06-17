# Schema do Banco de Dados

> PostgreSQL + Drizzle. Estratégia multi-tenant: row-level isolation.
> Toda tabela relevante ao tenant tem coluna `tenant_id`. Toda query deve filtrar por `tenant_id`.

---

## Convenções

- IDs: `uuid` v4 gerado automaticamente pelo banco (`DEFAULT gen_random_uuid()`)
- Timestamps: `created_at` em toda tabela; `updated_at` nas tabelas cujas linhas são mutadas — definido com `.$onUpdate(() => new Date())` no schema Drizzle para auto-atualização
- Nomes: `snake_case` no plural
- E-mail único **por tenant**, não globalmente: `UNIQUE (tenant_id, email)`
- Migrations: nunca editar uma migration já aplicada — criar nova
- **Soft delete**: nunca deletar com `DELETE`. Usar `is_active = false` em `tenants` e `users`. Outras tabelas são append-only ou imutáveis.
- **Cascade**: nenhuma `CASCADE DELETE` definida — deleções físicas não ocorrem no MVP.

---

## 1. Tenants e Usuários

### `tenants`

| Coluna | Tipo | Notas |
|---|---|---|
| `id` | uuid PK | |
| `slug` | varchar(100) UNIQUE | identificador da URL: `app.com/:slug/` |
| `name` | varchar(255) | nome da escola/instituição |
| `theme` | jsonb | variáveis CSS do tenant (ver `agent_docs/theming.md`) |
| `plan` | varchar(50) DEFAULT 'free' | plano contratado |
| `settings` | jsonb DEFAULT '{}' | configurações do plano: limites de IA, max alunos, features habilitadas |
| `is_active` | boolean DEFAULT true | false = tenant desativado pelo Super Admin (soft delete) |
| `created_at` | timestamp | |
| `updated_at` | timestamp | |

> `settings` armazena limites e configurações por tenant. Exemplo completo:
> ```json
> {
>   "ai_messages_per_day": 20,
>   "max_students": 100,
>   "ai_error_explanation_enabled": true,
>   "gamification": {
>     "xp_per_level": 100,
>     "first_attempt_bonus_multiplier": 1.5,
>     "streak_bonus_xp": 5,
>     "streak_bonus_max_xp": 50,
>     "streak_milestone_days": [7, 30, 100]
>   }
> }
> ```
> Campos de `gamification` não presentes usam os **padrões de plataforma** definidos em `agent_docs/gamificacao.md`.
> O service deve sempre ler `tenants.settings.gamification` antes de calcular XP, nível ou streak — nunca hardcode.

---

### `users`

| Coluna | Tipo | Notas |
|---|---|---|
| `id` | uuid PK | |
| `tenant_id` | uuid FK → tenants | |
| `email` | varchar(255) | |
| `password_hash` | varchar(255) | |
| `role` | enum | `super_admin`, `manager`, `professor`¹, `student` |
| `name` | varchar(255) | |
| `avatar_url` | varchar(500) | |
| `is_active` | boolean DEFAULT true | false = desativado pelo gestor (soft delete) |
| `created_at` | timestamp | |
| `updated_at` | timestamp | |

**Constraints:** `UNIQUE (tenant_id, email)`

> ¹ `professor` incluído no enum agora para evitar migration futura. Não utilizado até V2.

> **Super Admin e `tenant_id`**: o Super Admin é um `user` com `role = 'super_admin'` e pertence a um tenant de sistema criado pelo seed script com `slug = '__system__'`. Esse tenant nunca é exposto na UI e não representa uma escola real. O `tenant_id` da sessão do Super Admin aponta para esse tenant de sistema.

---

### `sessions`

| Coluna | Tipo | Notas |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid FK → users | |
| `tenant_id` | uuid FK → tenants | |
| `role` | enum | cópia do role no momento da criação |
| `expires_at` | timestamp | |
| `created_at` | timestamp | |

> Sessões são imutáveis após a criação — nunca são atualizadas, apenas deletadas (logout ou expiração).

---

### `password_reset_tokens`

| Coluna | Tipo | Notas |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid FK → users | |
| `token_hash` | varchar(255) UNIQUE | SHA-256 do token bruto enviado por e-mail |
| `type` | enum | `invite` (primeiro acesso) ou `reset` (recuperação de senha) |
| `expires_at` | timestamp | expira em 1h |
| `used_at` | timestamp | preenchido ao usar; tokens usados são inválidos |
| `created_at` | timestamp | |

> O token bruto é gerado com `randomBytes(32).toString('hex')` e enviado por e-mail. Apenas o hash SHA-256 é armazenado no banco.

---

## 2. Catálogo de Conteúdo

> Gerenciado pelo Super Admin. Tenants selecionam do catálogo — não criam conteúdo próprio.

### `trails`

| Coluna | Tipo | Notas |
|---|---|---|
| `id` | uuid PK | |
| `slug` | varchar(100) UNIQUE | |
| `title` | varchar(255) | |
| `description` | text | |
| `language` | enum | `javascript`, `python` |
| `order` | int | ordem de exibição no catálogo |
| `created_at` | timestamp | |
| `updated_at` | timestamp | |

---

### `trail_modules`

| Coluna | Tipo | Notas |
|---|---|---|
| `id` | uuid PK | |
| `trail_id` | uuid FK → trails | |
| `title` | varchar(255) | |
| `concept` | text | markdown com a explicação teórica |
| `example_code` | text | código do exemplo guiado |
| `order` | int | ordem dentro da trilha |
| `video_url` | varchar(500) | *(V2)* link externo (YouTube, Vimeo) |
| `video_storage_key` | varchar(500) | *(V2)* chave no Cloudflare R2 para upload |
| `created_at` | timestamp | |
| `updated_at` | timestamp | |

---

### `challenges`

| Coluna | Tipo | Notas |
|---|---|---|
| `id` | uuid PK | |
| `module_id` | uuid FK → trail_modules | |
| `title` | varchar(255) | |
| `description` | text | |
| `starter_code` | text | código inicial dado ao aluno |
| `test_cases` | jsonb | array de `{ input, expected, description }` |
| `difficulty` | enum | `easy`, `medium`, `hard` |
| `order` | int | ordem dentro do módulo |
| `base_xp` | int NOT NULL DEFAULT 10 | XP base por completar o desafio |
| `validation_mode_override` | enum nullable | sobrescreve o `validation_mode` da turma para este desafio específico; `null` = usa o da turma |
| `created_at` | timestamp | |
| `updated_at` | timestamp | |

---

## 3. Configuração por Tenant

### `tenant_trails`

> Define quais trilhas do catálogo o tenant ativou.

| Coluna | Tipo | Notas |
|---|---|---|
| `id` | uuid PK | |
| `tenant_id` | uuid FK → tenants | |
| `trail_id` | uuid FK → trails | |
| `order` | int | ordem de exibição para este tenant |
| `created_at` | timestamp | |

**Constraints:** `UNIQUE (tenant_id, trail_id)`

---

### `classes`

| Coluna | Tipo | Notas |
|---|---|---|
| `id` | uuid PK | |
| `tenant_id` | uuid FK → tenants | |
| `name` | varchar(255) | |
| `progression_mode` | enum DEFAULT 'sequential' | `free`, `sequential`, `controlled` |
| `validation_mode` | enum DEFAULT 'auto' | `auto`, `auto_review`, `manual` |
| `show_ranking` | boolean DEFAULT true | gestor pode desligar o ranking da turma |
| `created_at` | timestamp | |
| `updated_at` | timestamp | |

---

### `class_students`

| Coluna | Tipo | Notas |
|---|---|---|
| `id` | uuid PK | |
| `class_id` | uuid FK → classes | |
| `student_id` | uuid FK → users | |
| `joined_at` | timestamp DEFAULT now() | |

**Constraints:** `UNIQUE (class_id, student_id)`

---

### `class_trails`

| Coluna | Tipo | Notas |
|---|---|---|
| `id` | uuid PK | |
| `class_id` | uuid FK → classes | |
| `trail_id` | uuid FK → trails | |
| `order` | int | ordem da trilha nesta turma |
| `visual_blocks_enabled` | boolean DEFAULT false | blocos visuais habilitados para esta turma nesta trilha |
| `created_at` | timestamp | |

**Constraints:** `UNIQUE (class_id, trail_id)`

---

## 4. Progresso do Aluno

### `module_progress`

| Coluna | Tipo | Notas |
|---|---|---|
| `id` | uuid PK | |
| `tenant_id` | uuid FK → tenants | |
| `student_id` | uuid FK → users | |
| `module_id` | uuid FK → trail_modules | |
| `status` | enum DEFAULT 'locked' | `locked`, `available`, `completed` |
| `unlocked_by` | uuid FK → users nullable | quem desbloqueou (gestor/professor no modo `controlled`) |
| `unlocked_at` | timestamp nullable | quando foi desbloqueado manualmente |
| `completed_at` | timestamp nullable | |
| `created_at` | timestamp | |
| `updated_at` | timestamp | atualizado em toda mudança de status |

**Constraints:** `UNIQUE (tenant_id, student_id, module_id)`

> Progresso é por aluno × módulo × tenant — não por turma. Se o aluno está em duas turmas com a mesma trilha, o progresso é compartilhado.

---

### `challenge_submissions`

| Coluna | Tipo | Notas |
|---|---|---|
| `id` | uuid PK | |
| `tenant_id` | uuid FK → tenants | |
| `student_id` | uuid FK → users | |
| `challenge_id` | uuid FK → challenges | |
| `class_id` | uuid FK → classes | define qual `validation_mode` aplicar |
| `attempt_number` | int NOT NULL | número da tentativa (1, 2, 3…); calculado no INSERT como `COUNT(rows com mesmo tenant_id + student_id + challenge_id) + 1` |
| `code` | text NOT NULL | código submetido pelo aluno |
| `status` | enum | `pending`, `passed`, `failed`, `under_review` |
| `test_results` | jsonb | resultado detalhado de cada test case |
| `score` | numeric(5,2) nullable | nota atribuída no modo manual |
| `reviewer_id` | uuid FK → users nullable | gestor/professor que revisou |
| `reviewer_note` | text nullable | feedback escrito da revisão |
| `submitted_at` | timestamp DEFAULT now() | |
| `reviewed_at` | timestamp nullable | |

> Múltiplas submissões por desafio são permitidas. A submissão mais recente com `status = 'passed'` é o que conta para `module_progress`.

---

## 5. Gamificação

### `xp_events`

> Log imutável — nunca deletar ou editar registros.

| Coluna | Tipo | Notas |
|---|---|---|
| `id` | uuid PK | |
| `tenant_id` | uuid FK → tenants | |
| `student_id` | uuid FK → users | |
| `amount` | int | pode ser negativo (futuro) |
| `reason` | varchar(100) | `challenge_passed`, `first_attempt_bonus`, `streak_bonus`, `badge_earned` |
| `ref_id` | uuid nullable | id da submissão, badge ou evento relacionado |
| `created_at` | timestamp | |

---

### `student_stats`

> Totais computados por aluno. Recalculável a partir de `xp_events` e `challenge_submissions`.

| Coluna | Tipo | Notas |
|---|---|---|
| `id` | uuid PK | |
| `tenant_id` | uuid FK → tenants | |
| `student_id` | uuid FK → users | |
| `total_xp` | int DEFAULT 0 | |
| `level` | int DEFAULT 1 | |
| `current_streak` | int DEFAULT 0 | dias consecutivos com atividade |
| `longest_streak` | int DEFAULT 0 | |
| `last_activity` | date nullable | data da última submissão |
| `created_at` | timestamp | |
| `updated_at` | timestamp | |

**Constraints:** `UNIQUE (tenant_id, student_id)`

---

### `badges`

> Catálogo global gerenciado pelo Super Admin.

| Coluna | Tipo | Notas |
|---|---|---|
| `id` | uuid PK | |
| `slug` | varchar(100) UNIQUE | |
| `name` | varchar(255) | |
| `description` | text | |
| `icon_url` | varchar(500) | |
| `trigger_type` | varchar(100) | `challenges_completed`, `streak_days`, `first_submission`, etc. |
| `trigger_value` | int | ex: `5` para streak de 5 dias |
| `created_at` | timestamp | |

---

### `student_badges`

| Coluna | Tipo | Notas |
|---|---|---|
| `id` | uuid PK | |
| `tenant_id` | uuid FK → tenants | |
| `student_id` | uuid FK → users | |
| `badge_id` | uuid FK → badges | |
| `earned_at` | timestamp DEFAULT now() | |

**Constraints:** `UNIQUE (tenant_id, student_id, badge_id)`

---

### `class_weekly_challenges`

| Coluna | Tipo | Notas |
|---|---|---|
| `id` | uuid PK | |
| `tenant_id` | uuid FK → tenants | |
| `class_id` | uuid FK → classes | |
| `challenge_id` | uuid FK → challenges | |
| `starts_at` | timestamp | |
| `ends_at` | timestamp | |
| `created_at` | timestamp | |

> O placar do desafio da semana é computado filtrando `challenge_submissions` por `challenge_id + class_id + status = 'passed' + submitted_at` dentro do intervalo `starts_at / ends_at`. Apenas submissões aprovadas contam para o placar.

---

## 6. Tutor de IA

### `ai_conversations`

| Coluna | Tipo | Notas |
|---|---|---|
| `id` | uuid PK | |
| `tenant_id` | uuid FK → tenants | |
| `student_id` | uuid FK → users | |
| `challenge_id` | uuid FK → challenges | |
| `created_at` | timestamp | |

---

### `ai_messages`

| Coluna | Tipo | Notas |
|---|---|---|
| `id` | uuid PK | |
| `conversation_id` | uuid FK → ai_conversations | |
| `role` | enum | `user`, `assistant` |
| `content` | text | |
| `created_at` | timestamp | |

> **Explicação de erro:** quando o aluno pede ajuda sobre um teste que falhou,
> o contexto (`failedTest`: descrição, esperado, obtido, erro) vem no body de
> `POST /messages` e é usado **apenas para montar o system prompt** daquela
> chamada — não é uma coluna nova nem fica persistido em separado. A resposta
> do tutor é salva em `ai_messages` normalmente, como qualquer outra mensagem.
> Controlado por `tenants.settings.ai_error_explanation_enabled` (default
> `true` quando ausente — ver seção 1).

---

### `ai_usage`

> Controle de rate limiting por aluno por desafio por dia.

| Coluna | Tipo | Notas |
|---|---|---|
| `id` | uuid PK | |
| `tenant_id` | uuid FK → tenants | |
| `student_id` | uuid FK → users | |
| `challenge_id` | uuid FK → challenges | |
| `message_count` | int DEFAULT 0 | |
| `date` | date | |

**Constraints:** `UNIQUE (tenant_id, student_id, challenge_id, date)`

> Limite diário configurado em `tenants.settings.ai_messages_per_day`.
> **Padrão de escrita**: sempre via upsert — `INSERT ... ON CONFLICT (tenant_id, student_id, challenge_id, date) DO UPDATE SET message_count = message_count + 1`. Nunca usar INSERT simples.

---

## 7. Notificações

### `notifications`

| Coluna | Tipo | Notas |
|---|---|---|
| `id` | uuid PK | |
| `tenant_id` | uuid FK → tenants | |
| `user_id` | uuid FK → users | |
| `type` | varchar(100) | `badge_earned`, `level_up`, `streak_milestone`, `module_unlocked` |
| `title` | varchar(255) | |
| `body` | text nullable | |
| `read_at` | timestamp nullable | `null` = não lida |
| `created_at` | timestamp | |

---

## Índices de Performance

> Além dos índices UNIQUE documentados em cada tabela, os índices abaixo são necessários para as queries mais frequentes.

| Tabela | Índice | Motivo |
|---|---|---|
| `sessions` | `(user_id)` | `deleteExpiredSessions` roda a cada login |
| `sessions` | `(expires_at)` | jobs de limpeza de sessões expiradas |
| `trail_modules` | `(trail_id)` | listar módulos de uma trilha |
| `challenges` | `(module_id)` | listar desafios de um módulo |
| `challenge_submissions` | `(tenant_id, student_id, challenge_id)` | cálculo de `attempt_number` e busca de histórico |
| `challenge_submissions` | `(tenant_id, class_id, challenge_id, submitted_at)` | placar semanal |
| `xp_events` | `(tenant_id, student_id)` | timeline de XP do aluno |
| `notifications` | `(tenant_id, user_id, read_at)` | listagem de notificações não lidas |
| `module_progress` | `(tenant_id, student_id)` | progresso geral do aluno |
| `ai_conversations` | `(tenant_id, student_id, challenge_id)` | buscar conversa ativa de um aluno em um desafio |
| `class_weekly_challenges` | `(tenant_id, class_id)` | buscar desafio da semana de uma turma |

---

## Tabelas V2

> Não implementar no MVP. Documentadas aqui para orientar migrations futuras.

### Garagem de Projetos

```
user_projects
  id, tenant_id, student_id, title, code, language,
  published_at (null = privado), created_at, updated_at

project_reactions
  id, tenant_id, project_id, user_id, emoji, created_at
  UNIQUE (tenant_id, project_id, user_id)
```

### Desafios Colaborativos

```
challenge_pairs
  id, tenant_id, class_id, challenge_id,
  student_a_id, student_b_id, status (pending, active, completed),
  created_at

pair_submissions
  id, tenant_id, pair_id,
  student_a_code, student_b_code,
  status, test_results jsonb,
  submitted_at
```

### Moeda Cosmética

```
cosmetic_items
  id, slug, name, icon_url, price_xp, type (theme, avatar, effect),
  created_at

student_inventory
  id, tenant_id, student_id, item_id, acquired_at
  UNIQUE (tenant_id, student_id, item_id)
```

### Professor

> Apenas adicionar `role = 'professor'` (já no enum) e implementar as permissões no middleware `requireRole`.

---

## Diagrama de Relacionamentos

```
tenants
  ├── users (1:N)
  │     └── sessions (1:N)
  │     └── password_reset_tokens (1:N)
  ├── tenant_trails → trails (N:N)
  ├── classes (1:N)
  │     ├── class_students → users (N:N)
  │     ├── class_trails → trails (N:N)  [visual_blocks_enabled por turma]
  │     └── class_weekly_challenges → challenges (N:N)
  └── (via student)
        ├── module_progress → trail_modules
        ├── challenge_submissions → challenges
        ├── student_stats
        ├── student_badges → badges
        ├── xp_events
        ├── ai_conversations → ai_messages
        ├── ai_usage
        └── notifications

trails
  └── trail_modules (1:N)
        └── challenges (1:N)

badges  (catálogo global, sem tenant_id)
```
