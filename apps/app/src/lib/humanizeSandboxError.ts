// ─── Erros de sandbox humanizados ──────────────────────────────────────────
//
// Traduz mensagens nativas de erro (JavaScript ou Python/Pyodide) para
// linguagem acessível a alunos de 11-14 anos, no idioma da linguagem do desafio.
//
// Mensagens que já são amigáveis (ex.: "Nenhuma função encontrada...",
// "Tempo limite excedido...") são escritas à mão no worker/backend e não
// passam por aqui — esse arquivo só traduz erros nativos do motor.
//
// Não confundir com a explicação de erro via IA (Codi / `aiErrorExplanationEnabled`),
// que é um recurso separado e já existe — este arquivo cobre a mensagem
// padrão exibida no painel de resultado, sem chamada de IA.

export interface RawSandboxError {
  message: string
  /** err.name (ex.: "TypeError") — só disponível quando o teste rodou no worker do navegador */
  name?: string
}

export type SandboxLanguage = 'javascript' | 'python'

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

// ─── Regras de JavaScript ─────────────────────────────────────────────────────
const JS_RULES: Rule[] = [
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

// ─── Regras de Python (mensagens do Pyodide/CPython) ──────────────────────────
// As mensagens do Python costumam vir como "TipoDoErro: descrição" (última linha
// do traceback). As regras abaixo casam com esse formato.
const PY_RULES: Rule[] = [
  // NameError: name 'x' is not defined
  {
    test: /name '([^']+)' is not defined/,
    message: (m) =>
      `Você usou "${m[1]}", mas ela ainda não existe no seu código. Confira se escreveu o nome certinho ou se esqueceu de criar essa variável antes de usá-la (ex.: ${m[1]} = ...).`,
  },
  // IndentationError / TabError / "expected an indented block"
  {
    test: /IndentationError|TabError|expected an indented block|unexpected indent|unindent does not match/,
    message: () =>
      'A indentação (os espaços no começo da linha) está incorreta. No Python, o que está dentro de um if, for ou def precisa de espaços a mais — alinhe as linhas do bloco com o mesmo recuo.',
  },
  // ZeroDivisionError
  {
    test: /division (by|or modulo by) zero/,
    message: () =>
      'Você dividiu um número por zero, o que não é possível. Confira o valor do divisor antes de dividir.',
  },
  // IndexError: list/string index out of range
  {
    test: /(list|string|tuple) index out of range/,
    message: (m) =>
      `Você tentou acessar uma posição que não existe ${m[1] === 'string' ? 'no texto' : 'na lista'}. Lembre que a contagem começa em 0 e vai até o tamanho − 1.`,
  },
  // KeyError: 'x'
  {
    test: /KeyError: '?([^'\n]+)'?/,
    message: (m) =>
      `A chave "${m[1].trim()}" não existe nesse dicionário. Confira se o nome da chave está certo (maiúsculas/minúsculas contam).`,
  },
  // TypeError: 'x' object is not subscriptable
  {
    test: /'([^']+)' object is not subscriptable/,
    message: (m) =>
      `Você usou colchetes [ ] em algo do tipo ${m[1]}, que não aceita indexação. Colchetes funcionam com listas, textos e dicionários.`,
  },
  // TypeError: 'x' object is not callable
  {
    test: /'([^']+)' object is not callable/,
    message: (m) =>
      `Você usou parênteses ( ) em algo do tipo ${m[1]}, como se fosse uma função — mas não é. Confira o nome ou se você não sobrescreveu uma função com uma variável.`,
  },
  // TypeError: 'x' object is not iterable
  {
    test: /'([^']+)' object is not iterable/,
    message: (m) =>
      `Você tentou percorrer algo do tipo ${m[1]} item por item, mas isso só funciona com listas, textos, dicionários e outros iteráveis.`,
  },
  // AttributeError: 'x' object has no attribute 'y'
  {
    test: /'([^']+)' object has no attribute '([^']+)'/,
    message: (m) =>
      `O valor do tipo ${m[1]} não tem "${m[2]}". Confira o nome do método/atributo e se o valor é do tipo que você esperava.`,
  },
  // ModuleNotFoundError / ImportError
  {
    test: /No module named '([^']+)'/,
    message: (m) =>
      `O módulo "${m[1]}" não foi encontrado. Confira o nome no import — e lembre que nem toda biblioteca está disponível aqui.`,
  },
  // ValueError de conversão numérica
  {
    test: /invalid literal for int|could not convert string to float/,
    message: () =>
      'Você tentou transformar em número um texto que não é um número. Confira o valor antes de usar int() ou float().',
  },
  // TypeError de mistura de tipos
  {
    test: /can only concatenate|unsupported operand type|must be str, not|not all arguments converted|can't multiply sequence/,
    message: () =>
      'Você misturou tipos diferentes numa mesma operação (por exemplo, texto com número). Converta os valores com int(), float() ou str() antes de combiná-los.',
  },
  // SyntaxError (Python) — genérico
  {
    test: /SyntaxError|invalid syntax|unexpected EOF|EOL while scanning|unterminated string|was never closed|invalid decimal literal/,
    message: () =>
      'Tem um errinho de digitação no código — pode ser parênteses ( ), aspas ou os dois-pontos ( : ) do if/for/def faltando ou sobrando. Releia o código linha por linha.',
  },
]

const DEFAULT_MESSAGE =
  'Seu código encontrou um erro ao rodar. Releia a lógica com calma — você consegue resolver!'

/** Traduz a mensagem nativa de um erro (JS ou Python) para uma frase acessível em PT-BR. */
export function humanizeSandboxError(rawMessage: string, language: SandboxLanguage = 'javascript'): string {
  const message = rawMessage.trim()
  const rules = language === 'python' ? PY_RULES : JS_RULES
  for (const rule of rules) {
    const match = message.match(rule.test)
    if (match) return rule.message(match)
  }
  return DEFAULT_MESSAGE
}
