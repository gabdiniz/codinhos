# Gamificação

> ⚠️ As regras de gamificação **não são hardcoded**. Todos os valores numéricos têm um padrão de plataforma,
> mas podem ser sobrescritos por tenant via `tenants.settings.gamification`.
> O service deve sempre ler a config do tenant antes de calcular qualquer valor.

---

## Configuração por Tenant

As regras são armazenadas em `tenants.settings.gamification` (jsonb). Se a chave não existir, o service
usa os **valores padrão da plataforma** definidos abaixo.

```json
// Estrutura completa com valores padrão
{
  "gamification": {
    "xp_per_level": 100,
    "first_attempt_bonus_multiplier": 1.5,
    "streak_bonus_xp": 5,
    "streak_bonus_max_xp": 50,
    "streak_milestone_days": [7, 30, 100]
  }
}
```

| Chave | Padrão | Descrição |
|---|---|---|
| `xp_per_level` | `100` | XP necessário para subir um nível (mínimo: 10) |
| `first_attempt_bonus_multiplier` | `1.5` | Multiplicador sobre `base_xp` se aprovado na 1ª tentativa (mínimo: 1.0 = sem bônus; máximo: 3.0) |
| `streak_bonus_xp` | `5` | XP base do bônus de streak; **multiplicado por `current_streak`**, com cap em `streak_bonus_max_xp` (mínimo: 0) |
| `streak_bonus_max_xp` | `50` | Cap do bônus de streak por aprovação (mínimo: 0) |
| `streak_milestone_days` | `[7, 30, 100]` | Dias de streak que disparam notificação e verificação de badge |

> **Validação:** o service deve rejeitar com erro valores fora dos limites acima antes de persistir.
> `xp_per_level < 10` resulta em divisão por zero prática; `multiplier < 1.0` seria penalidade.

**Quem pode alterar:**
- **Super Admin** — altera qualquer chave de qualquer tenant via `PATCH /api/admin/tenants/:id`
- **Gestor** — visualiza no painel mas **não pode alterar** regras de gamificação

---

## Sistema de XP

### Tabela `xp_events` (log imutável)

Toda concessão de XP gera um ou mais registros em `xp_events`. Nunca deletar nem editar.

| `reason` | Quando é gerado |
|---|---|
| `challenge_passed` | Primeira aprovação do aluno neste desafio |
| `first_attempt_bonus` | Aprovação na 1ª tentativa (gerado junto com `challenge_passed`) |
| `streak_bonus` | Aprovação com streak ativo > 0 |
| `badge_earned` | Badge conquistado (amount = 0; evento informacional) |

### Cálculo ao aprovar uma submissão

O streak utilizado no cálculo do bônus é o **streak do momento da aprovação** (não da submissão).
Para modos `auto_review` e `manual`, a aprovação ocorre via `PATCH /review` — o streak pode ser
diferente do momento da submissão. Isso é intencional: o bônus reflete o engajamento atual do aluno.

```
1. Verificar se é a primeira aprovação do aluno neste desafio
2. Se não for: encerrar (idempotente — nenhum XP)
3. Se sim:
   a. cfg = tenant.settings.gamification (com defaults para chaves ausentes)
   b. xp_base = challenge.base_xp

   c. Atualizar streak ANTES de calcular bônus:
        today = DATE(now() AT TIME ZONE 'UTC')
        Se student_stats.last_activity = null        → current_streak = 1  (primeiro evento)
        Se student_stats.last_activity = ontem UTC  → current_streak += 1
        Se student_stats.last_activity < ontem UTC  → current_streak = 1
        Se student_stats.last_activity = hoje UTC   → sem alteração
        longest_streak = max(longest_streak, current_streak)
        // Verificar milestones após atualizar streak:
        Se current_streak ∈ cfg.streak_milestone_days:
          CREATE notification(streak_milestone)
          // Badges de streak_days são verificados no passo h junto com os demais

   d. Bônus de primeira tentativa:
        Se submission.attempt_number = 1:
          first_bonus = floor(xp_base × (cfg.first_attempt_bonus_multiplier - 1))
          INSERT xp_events (reason='first_attempt_bonus', amount=first_bonus, ref_id=submission.id)
        Senão: first_bonus = 0

   e. Bônus de streak (streak já atualizado):
        streak_xp = min(cfg.streak_bonus_xp × current_streak, cfg.streak_bonus_max_xp)
        Se streak_xp > 0:
          INSERT xp_events (reason='streak_bonus', amount=streak_xp, ref_id=submission.id)

   f. INSERT xp_events (reason='challenge_passed', amount=xp_base, ref_id=submission.id)

   g. total_xp_novo = student_stats.total_xp + xp_base + first_bonus + streak_xp
      level_anterior = student_stats.level
      level_novo = floor(total_xp_novo / cfg.xp_per_level) + 1
      UPDATE student_stats (total_xp, level, current_streak, longest_streak, last_activity)

      Para cada N de (level_anterior + 1) até level_novo:  // itera cada nível saltado
        CREATE notification(level_up)
        verificar badge trigger_type='level_reached', trigger_value=N

   h. Verificar badges gerais (ver seção Badges)
      // Tipos: challenges_completed, streak_days, first_submission, xp_total
      // NÃO inclui level_reached — já tratado em g para cada nível saltado
```

> Para desabilitar bônus de primeira tentativa: `first_attempt_bonus_multiplier = 1.0`
> Para desabilitar bônus de streak: `streak_bonus_xp = 0` ou `streak_bonus_max_xp = 0`

---

## Sistema de Nível

**Fórmula:** `level = floor(total_xp / xp_per_level) + 1`

Com o padrão `xp_per_level = 100`:

| Nível | XP necessário |
|---|---|
| 1 | 0 – 99 |
| 2 | 100 – 199 |
| N | (N-1)×100 – N×100−1 |

Quando o nível sobe, o service deve (para cada nível atingido):
1. Atualizar `student_stats.level`
2. Criar notificação `level_up` para o aluno
3. Executar verificação de badge `trigger_type='level_reached'` para o nível atingido — a verificação insere `xp_events (reason='badge_earned')` e `student_badges` se aplicável

> Isso ocorre dentro do loop do passo g do algoritmo, não no passo h.

---

## Sistema de Streak

### Definição

O streak conta **dias consecutivos com pelo menos uma submissão aprovada** (status = `passed`).

- A data de referência é a coluna `student_stats.last_activity` (tipo `DATE`, fuso UTC)
- Uma submissão aprovada no mesmo dia calendário que `last_activity` **não incrementa** o streak
- Uma submissão aprovada no dia seguinte a `last_activity` **incrementa** o streak em 1
- Uma submissão aprovada 2+ dias depois de `last_activity` **reseta** o streak para 1

```
last_activity = hoje      → streak não muda     (já contou hoje)
last_activity = ontem     → streak += 1
last_activity = antes     → streak = 1          (quebrou a sequência)
last_activity = null      → streak = 1          (primeiro evento)
```

**Timezone:** todos os cálculos usam UTC. O campo `date` em `ai_usage` e `DATE now()` no banco
são sempre UTC.

### Milestones de streak

Quando `current_streak` atinge um valor presente em `streak_milestone_days`, o service deve:
1. Criar notificação `streak_milestone` para o aluno
2. Verificar badges com `trigger_type = 'streak_days'` e `trigger_value ≤ current_streak`

---

## Badges

### Catálogo global

Badges são gerenciados pelo Super Admin via `/api/admin/badges`. Cada badge tem:
- `trigger_type`: tipo de evento que desencadeia a verificação
- `trigger_value`: threshold numérico para a conquista

### Tipos de trigger suportados

| `trigger_type` | `trigger_value` | Verificação |
|---|---|---|
| `challenges_completed` | N | Total de desafios aprovados pelo aluno (conta `challenge_submissions` distintos com `status = 'passed'`) |
| `streak_days` | N | `current_streak >= N` |
| `first_submission` | — (ignorado) | Primeira submissão do aluno (qualquer status) |
| `level_reached` | N | `level >= N` |
| `xp_total` | N | `total_xp >= N` |

### Verificação síncrona (pós-XP)

Após cada concessão de XP (passo h do algoritmo acima):
1. Buscar todos os badges do catálogo que o aluno ainda não possui
2. Para cada badge, avaliar `trigger_type` contra `student_stats` atualizado
3. Badges satisfeitos → INSERT `student_badges` + INSERT `xp_events` (reason='badge_earned', amount=0, ref_id=badge.id) + CREATE notification(badge_earned)
4. Retornar lista no campo `newBadges` do response da API

**Idempotência:** `UNIQUE (tenant_id, student_id, badge_id)` impede concessão duplicada.

### Disparo especial — `first_submission`

O badge `first_submission` não depende de XP, então tem ponto de disparo próprio:
- **Onde:** na criação da submissão (`POST /challenges/:id/submissions`), antes de qualquer aprovação
- **Condição:** verificar se o aluno possui alguma submissão anterior (qualquer status)
- Se não possuir: conceder o badge imediatamente (mesmo que a submissão falhe)
- `newBadges` é incluído no response de criação de submissão mesmo que `xpEarned = 0`

### `ref_id` por tipo de evento

| `reason` | `ref_id` |
|---|---|
| `challenge_passed` | `submission.id` |
| `first_attempt_bonus` | `submission.id` |
| `streak_bonus` | `submission.id` |
| `badge_earned` | `badge.id` |

---

## Desafio da Semana

O desafio da semana **não cria XP separado** — a submissão passa pelo fluxo normal de aprovação.
A diferença está na classificação do leaderboard:

### Critério de ordenação do leaderboard

1. Alunos com `status = 'passed'` vêm antes dos sem aprovação
2. Entre aprovados: menor `attempt_number` (quem passou em menos tentativas)
3. Desempate: `submitted_at` mais cedo

### Submissões após o encerramento

Submissões feitas após `ends_at` são gravadas normalmente no banco e XP é concedido, mas
**não aparecem no leaderboard** do desafio. O service filtra por `submitted_at BETWEEN starts_at AND ends_at`.

---

## `student_stats` como Cache

A tabela `student_stats` é um cache computado e pode ser **reconstruída do zero** a partir de:
- `xp_events` → `total_xp`, `level`
- `challenge_submissions` + `xp_events` → `current_streak`, `longest_streak`, `last_activity`
- `student_badges` → contagem de badges (não armazenada em stats, consultada diretamente)

Nunca tome `student_stats` como fonte de verdade para auditoria — use `xp_events`.

---

## Regras do Service

1. **Toda concessão de XP passa pelo módulo de gamificação** — routes não devem atualizar
   `student_stats` diretamente; apenas o service de gamificação faz isso
2. **Verificar first_approval antes de qualquer cálculo** — evita XP duplicado em re-submissões
3. **Ler configuração do tenant no início de cada cálculo** — nunca cachear config entre requests
4. **Operações de gamificação são atômicas** — XP + stats + badges em uma única transação
5. **Nunca deletar `xp_events`** — log imutável; qualquer correção é feita por evento de crédito/débito
6. **`attempt_number` calculado na criação da submissão** — ao criar `challenge_submissions`, o service conta quantas submissões anteriores existem para o mesmo `(student_id, challenge_id)` e define `attempt_number = count + 1`; nunca vem do cliente
