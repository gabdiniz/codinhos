# Autenticação

## Estratégia: Sessions

Sessões armazenadas no banco (tabela `sessions`). Revogação imediata ao remover usuário ou alterar permissões.

### Conteúdo da sessão

```typescript
interface Session {
  sessionId: string
  userId: string
  tenantId: string
  role: 'super_admin' | 'manager' | 'student'
  expiresAt: Date
}
```

O `tenantId` na sessão é a fonte de verdade para isolamento de dados — nunca confiar no `tenantId` vindo do body ou query params.

### Middleware de autenticação

Toda rota protegida passa pelo middleware `authenticate`, que:
1. Lê o cookie de sessão
2. Busca a sessão no banco
3. Verifica se não expirou
4. Injeta `req.user`, `req.tenantId` e `req.role` na request

## Roteamento por Slug

Cada tenant tem um slug único. Rotas seguem o padrão:

```
# Frontend (app Vite)
app.com/:slug/login
app.com/:slug/dashboard
app.com/:slug/trilhas/:trailId

# Backend (API Fastify)
/api/:slug/users
/api/:slug/courses
/api/:slug/challenges
```

O slug é resolvido para `tenantId` no início de cada request via middleware `resolveTenant`. Se o slug não existir, retorna `404`.

## Fluxo de login

```
POST /api/:slug/auth/login
  body: { email, password }

1. Resolve slug → tenantId
2. Busca usuário por (tenantId, email)
3. Verifica senha (bcrypt)
4. Cria sessão no banco
5. Seta cookie httpOnly com sessionId
6. Retorna dados básicos do usuário
```

## Recuperação de senha

```
POST /api/:slug/auth/forgot-password
  body: { email }
  → Gera token de uso único, expira em 1h, envia e-mail via Resend

POST /api/:slug/auth/reset-password
  body: { token, newPassword }
  → Valida token, atualiza senha, invalida token
```

## Proteção de rotas por role

```typescript
// Exemplo de uso nos routes
fastify.get('/dashboard', {
  preHandler: [authenticate, requireRole('manager')]
}, handler)
```

Roles disponíveis: `super_admin` > `manager` > `student`. Super Admin tem acesso a tudo, independente do slug.
