export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
  ) {
    super(message)
    this.name = 'AppError'
  }
}

/** 400 — requisição bloqueada por uma configuração que impede a operação */
export class BadRequestError extends AppError {
  constructor(message: string) {
    super(400, 'BAD_REQUEST', message)
  }
}

/** 401 — sessão ausente, expirada ou inválida */
export class UnauthorizedError extends AppError {
  constructor(message = 'Sessão ausente ou expirada') {
    super(401, 'UNAUTHORIZED', message)
  }
}

/** 401 — credenciais inválidas (e-mail ou senha incorretos) */
export class InvalidCredentialsError extends AppError {
  constructor() {
    super(401, 'INVALID_CREDENTIALS', 'E-mail ou senha inválidos')
  }
}

/** 403 — conta desativada pelo gestor */
export class AccountDisabledError extends AppError {
  constructor() {
    super(403, 'ACCOUNT_DISABLED', 'Conta desativada')
  }
}

/** 403 — role insuficiente */
export class ForbiddenError extends AppError {
  constructor() {
    super(403, 'FORBIDDEN', 'Permissão insuficiente')
  }
}

/**
 * 404 — recurso não encontrado.
 * Também usado para acesso cross-tenant para não revelar existência.
 */
export class NotFoundError extends AppError {
  constructor(resource = 'Recurso') {
    super(404, 'NOT_FOUND', `${resource} não encontrado`)
  }
}

/** 409 — conflito de unicidade */
export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, 'CONFLICT', message)
  }
}

/** 422 — regra de negócio violada */
export class UnprocessableError extends AppError {
  constructor(message: string) {
    super(422, 'UNPROCESSABLE', message)
  }
}

/** 429 — limite diário de uso excedido */
export class TooManyRequestsError extends AppError {
  constructor(message = 'Limite diário de mensagens atingido') {
    super(429, 'TOO_MANY_REQUESTS', message)
  }
}

/** 503 — falha ao chamar o provedor de IA (chave inválida/ausente, rate limit, indisponibilidade) */
export class AiServiceError extends AppError {
  constructor(message = 'O tutor de IA está indisponível agora. Tente de novo em alguns instantes.') {
    super(503, 'AI_SERVICE_ERROR', message)
  }
}

/** 503 — falha ao enviar e-mail (provedor indisponível, chave ausente/inválida) */
export class EmailServiceError extends AppError {
  constructor(
    message = 'Não foi possível enviar sua mensagem agora. Tente novamente em instantes.',
  ) {
    super(503, 'EMAIL_SERVICE_ERROR', message)
  }
}
