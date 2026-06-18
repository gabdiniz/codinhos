// ─── Erros de sandbox humanizados ──────────────────────────────────────────
//
// Traduz mensagens nativas de erro do JavaScript (TypeError, ReferenceError,
// SyntaxError, RangeError) para linguagem acessível a alunos de 11-14 anos.
//
// Mensagens que já são amigáveis (ex.: "Nenhuma função encontrada...",
// "Tempo limite excedido...") são escritas à mão no worker/backend e não
// passam por aqui — esse arquivo só traduz erros nativos do motor JS.
//
// Não confundir com a explicação de erro via IA (Codi / `aiErrorExplanationEnabled`),
// que é um recurso separado e já existe — este arquivo cobre a mensagem
// padrão exibida no painel de resultado, sem chamada de IA.

export interface RawSandboxError {
  message: string
  /** err.name (ex.: "TypeError") — só disponível quando o teste rodou no worker do navegador */
  name?: string
}

const SERVER_ERROR_PREFIX = 'Erro: '

/**
 * Extrai a mensagem de erro nativa de um resultado de teste.
 *
 * O worker do navegador (Executar) preenche `error` diretamente. A avaliação
 * no servidor (Enviar solução, `shared/utils/run-tests.ts` da API) hoje embute
 * o erro como string dentro de `actual`, prefixada com "Erro: " — por isso
 * também reconhecemos esse formato aqui, sem precisar mudar o backend nesta sprint.
 */
export function extractRawSandboxError(
  error: string | undefined,
  errorName: string | undefined,
  actual: unknown,
): RawSandboxError | null {
  if (error) return { message: error, name: errorName }
  if (typeof actual === 'string' && actual.startsWith(SERVER_ERROR_PREFIX)) {
    return { message: actual.slice(SERVER_ERROR_PREFIX.length) }
  }
  return null
}

interface Rule {
  test: RegExp
  message: (match: RegExpMatchArray) => string
}

const RULES: Rule[] = [
  // ReferenceError: "x is not defined"
  {
    test: /^([\s\S]+?) is not defined$/,
    message: (m) =>
      `Você usou "${m[1]}", mas isso ainda não existe no seu código. Confira se escreveu o nome certinho ou se esqueceu de criar essa variável (let/const) ou função.`,
  },
  // ReferenceError (TDZ): "Cannot access 'x' before initialization"
  {
    test: /^Cannot access '([\s\S]+?)' before initialization$/,
    message: (m) =>
      `Você usou "${m[1]}" antes de criar essa variável. Mova a linha que cria "${m[1]}" (com let/const) para antes de onde ela é usada.`,
  },
  // TypeError (V8 atual): "Cannot read properties of undefined (reading 'x')"
  {
    test: /^Cannot read properties of (undefined|null) \(reading '([\s\S]+?)'\)$/,
    message: (m) =>
      `Você tentou acessar ".${m[2]}" em algo que ainda está vazio (${m[1]}). Confira se essa variável foi criada e já tem um valor antes de usar.`,
  },
  // TypeError (V8 antigo): "Cannot read property 'x' of undefined"
  {
    test: /^Cannot read property '([\s\S]+?)' of (undefined|null)$/,
    message: (m) =>
      `Você tentou acessar ".${m[1]}" em algo que ainda está vazio (${m[2]}). Confira se essa variável foi criada e já tem um valor antes de usar.`,
  },
  // TypeError: "Cannot set properties of undefined/null (setting 'x')"
  {
    test: /^Cannot set propert(?:y|ies) of (undefined|null) \(setting '([\s\S]+?)'\)$/,
    message: (m) =>
      `Você tentou definir ".${m[2]}" em algo que ainda está vazio (${m[1]}). Crie o objeto antes de definir essa propriedade nele.`,
  },
  // TypeError: "x is not a function"
  {
    test: /^([\s\S]+?) is not a function$/,
    message: (m) =>
      `Você tentou usar "${m[1]}" como uma função (com parênteses), mas ela não é uma função. Confira o nome e se ela foi definida do jeito certo.`,
  },
  // TypeError: "x is not iterable"
  {
    test: /^([\s\S]+?) is not iterable$/,
    message: (m) =>
      `Você tentou percorrer "${m[1]}" item por item, mas isso só funciona com listas (arrays) ou textos. Confira o tipo desse valor.`,
  },
  // TypeError: "Assignment to constant variable."
  {
    test: /^Assignment to constant variable\.?$/,
    message: () =>
      'Você tentou mudar o valor de algo criado com const. Se for precisar trocar o valor depois, crie essa variável com let em vez de const.',
  },
  // RangeError: "Maximum call stack size exceeded"
  {
    test: /^Maximum call stack size exceeded$/,
    message: () =>
      'Seu código ficou chamando a si mesmo sem parar (recursão infinita). Revise a condição que deveria fazer a função parar de se chamar.',
  },
  // RangeError: "Invalid array length"
  {
    test: /^Invalid array length$/,
    message: () =>
      'Você tentou criar uma lista (array) com um tamanho inválido. Confira o número usado para o tamanho da lista.',
  },
  // SyntaxError — várias mensagens possíveis do parser, tratadas de forma genérica
  {
    test: /Unexpected token|Unexpected identifier|Unexpected end of input|missing \)|Invalid or unexpected token|Unexpected string/,
    message: () =>
      'Tem um errinho de digitação no código — pode ser parênteses ( ), chaves { } ou vírgulas faltando ou sobrando. Releia o código linha por linha.',
  },
]

const DEFAULT_MESSAGE =
  'Seu código encontrou um erro ao rodar. Releia a lógica com calma — você consegue resolver!'

/** Traduz a mensagem nativa de um erro JS para uma frase acessível em PT-BR. */
export function humanizeSandboxError(rawMessage: string): string {
  const message = rawMessage.trim()
  for (const rule of RULES) {
    const match = message.match(rule.test)
    if (match) return rule.message(match)
  }
  return DEFAULT_MESSAGE
}
