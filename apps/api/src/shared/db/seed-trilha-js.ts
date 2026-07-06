/**
 * Seed da trilha "JavaScript: do Fundamento ao Algoritmo" no CATÁLOGO GLOBAL
 * (tenant_id = NULL). Intercala LIÇÕES (módulos só-texto, sem desafio) com os
 * desafios, apresentando cada conceito antes de exercitá-lo.
 *
 * Execução: pnpm --filter @codinhos/api db:seed:trilha
 *
 * Idempotente E atualizável: re-rodar atualiza o conteúdo e converge para a
 * estrutura atual (lição = módulo sem desafio; remove desafio órfão se houver).
 * Desafios verificados contra o runner real (run-tests.ts).
 */

import 'dotenv/config'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { eq, and } from 'drizzle-orm'
import { trails, trailModules, challenges } from './schema.js'

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) {
  console.error('❌  DATABASE_URL não definida.')
  process.exit(1)
}

const client = postgres(DATABASE_URL, { max: 5 })
const db = drizzle(client)

const TRAIL_SLUG = 'js-fundamentos-ao-algoritmo'
const TRAIL_TITLE = 'JavaScript: do Fundamento ao Algoritmo'
const TRAIL_DESC =
  'Trilha completa de fundamentos de JavaScript, do básico ao avançado: lições de conceito intercaladas com desafios práticos — variáveis, operadores, decisões, funções, strings, números, loops, arrays, objetos, recursão e algoritmos.'

type Modulo = {
  kind: 'lesson' | 'challenge'
  title: string
  concept: string
  exampleCode: string
  vocabulary: string[]
  difficulty: 'easy' | 'medium' | 'hard'
  baseXp: number
  description: string
  starterCode: string
  targetFn?: string
  testCases: {
    input: unknown
    expected: unknown
    description: string
    mode?: 'stdout'
    matcher?: 'equal' | 'approx' | 'contains' | 'regex'
    tolerance?: number
  }[]
}

const trilhaModules: Modulo[] = [
  {
    "kind": "lesson",
    "title": "Lição 1 — Valores e variáveis",
    "concept": "Antes de resolver problemas, o computador precisa **guardar informações** — e fazemos isso com **variáveis**, como caixinhas com um nome onde guardamos um valor.\n\nUse `let` quando o valor pode mudar e `const` quando é fixo. Todo valor tem um **tipo**: texto é `string` (entre aspas), número é `number` (sem aspas) e verdadeiro/falso é `boolean`.\n\nPara fazer contas com números, usamos os **operadores aritméticos**: `+` (soma), `-` (subtração), `*` (multiplicação) e `/` (divisão). Por exemplo, `preco * 2` dobra o preço.\n\nE quando queremos que um trecho de código **devolva** um resultado, escrevemos uma **função** e usamos `return`. Nos próximos desafios você vai criar variáveis e funções que fazem contas e devolvem valores.",
    "exampleCode": "let nome = \"Ana\"          // string\nconst idade = 12           // number\nconst pontos = idade * 10  // operador * -> 120",
    "vocabulary": [
      "let",
      "const",
      "string",
      "number",
      "boolean",
      "+",
      "-",
      "*",
      "/",
      "function",
      "return"
    ],
    "difficulty": "easy",
    "baseXp": 5,
    "description": "",
    "starterCode": "",
    "testCases": []
  },
  {
    "kind": "challenge",
    "title": "1.1 Declare seu nome",
    "concept": "Uma **variável** guarda um valor com um nome. Use `let` (pode mudar) ou `const` (não muda). Texto é do tipo `string` e fica entre aspas.",
    "exampleCode": "// declarando variáveis de texto\nlet cidade = \"Recife\"\nconst pais = \"Brasil\"",
    "vocabulary": [
      "let",
      "const",
      "string"
    ],
    "difficulty": "easy",
    "baseXp": 10,
    "description": "Declare uma variável chamada `nome` e guarde o seu nome (um texto).",
    "starterCode": "// Declare aqui a variável nome com o seu nome entre aspas\n",
    "testCases": [
      {
        "input": null,
        "expected": "string",
        "description": "nome deve ser do tipo string"
      }
    ]
  },
  {
    "kind": "challenge",
    "title": "1.2 Idade e status",
    "concept": "Número (`number`) NÃO leva aspas. Verdadeiro/falso é `boolean`: vale `true` ou `false`.",
    "exampleCode": "let pontos = 10      // number\nlet venceu = false   // boolean",
    "vocabulary": [
      "number",
      "boolean",
      "true",
      "false"
    ],
    "difficulty": "easy",
    "baseXp": 10,
    "description": "Declare `idade` (um número) e `ativo` (um booleano: true ou false).",
    "starterCode": "// Declare idade (número) e ativo (true ou false)\n",
    "testCases": [
      {
        "input": null,
        "expected": "number",
        "description": "idade deve ser do tipo number"
      },
      {
        "input": null,
        "expected": "boolean",
        "description": "ativo deve ser do tipo boolean"
      }
    ]
  },
  {
    "kind": "challenge",
    "title": "1.3 Apresente-se",
    "concept": "Uma **função** é um bloco de código com nome. O `return` devolve um valor. Veja uma função parecida que devolve um texto fixo:",
    "exampleCode": "function corFavorita() {\n  return \"azul\"\n}\n// corFavorita() devolve \"azul\"",
    "vocabulary": [
      "function",
      "return"
    ],
    "difficulty": "easy",
    "baseXp": 10,
    "description": "Escreva a função `apresentar()` que retorna exatamente o texto \"Olá, eu sou o Codi\".",
    "starterCode": "function apresentar() {\n  // escreva seu código aqui\n}\n\n// Exemplos (clique em Executar para testar):\nconsole.log(apresentar())  // deve dar \"Olá, eu sou o Codi\"",
    "testCases": [
      {
        "input": [],
        "expected": "Olá, eu sou o Codi",
        "description": "retorna a apresentação"
      }
    ]
  },
  {
    "kind": "challenge",
    "title": "1.4 O dobro",
    "concept": "Uma função recebe **parâmetros** (entradas) e usa no `return`. O `*` multiplica. Exemplo análogo (triplo):",
    "exampleCode": "function triplo(n) {\n  return n * 3\n}\n// triplo(2) devolve 6",
    "vocabulary": [
      "parâmetro",
      "argumento"
    ],
    "difficulty": "easy",
    "baseXp": 10,
    "description": "Escreva `dobro(n)` que retorna o dobro de n.",
    "starterCode": "function dobro(n) {\n  // escreva seu código aqui\n}\n\n// Exemplos (clique em Executar para testar):\nconsole.log(dobro(4))  // deve dar 8\nconsole.log(dobro(0))  // deve dar 0",
    "testCases": [
      {
        "input": [
          4
        ],
        "expected": 8,
        "description": "dobro(4) = 8"
      },
      {
        "input": [
          0
        ],
        "expected": 0,
        "description": "dobro(0) = 0"
      },
      {
        "input": [
          -3
        ],
        "expected": -6,
        "description": "dobro(-3) = -6"
      }
    ]
  },
  {
    "kind": "lesson",
    "title": "Lição 2 — Operadores e expressões",
    "concept": "Com os valores guardados, a gente **calcula** e **compara**.\n\nOperadores aritméticos: `+` soma, `-` subtrai, `*` multiplica, `/` divide e `%` dá o **resto** da divisão (ótimo para saber se um número é par).\n\nPara comparar use `>`, `<`, `>=`, `<=` e, para igualdade, sempre `===` (compara valor **e** tipo). Cuidado: `==` faz conversões estranhas (`1 == \"1\"` é `true`!). Comparações devolvem `boolean`, e você combina condições com `&&` (E) e `||` (OU).",
    "exampleCode": "10 % 3       // 1 (resto)\n5 === 5      // true\n5 === \"5\"    // false (tipo diferente)",
    "vocabulary": [
      "%",
      "===",
      "!==",
      ">",
      "<",
      "&&",
      "||"
    ],
    "difficulty": "easy",
    "baseXp": 5,
    "description": "",
    "starterCode": "",
    "testCases": []
  },
  {
    "kind": "challenge",
    "title": "2.1 Soma",
    "concept": "Operadores: `+` soma, `-` subtrai, `*` multiplica, `/` divide. Exemplo análogo com subtração:",
    "exampleCode": "function diferenca(a, b) {\n  return a - b\n}\n// diferenca(10, 4) devolve 6",
    "vocabulary": [
      "+",
      "-",
      "*",
      "/",
      "%"
    ],
    "difficulty": "easy",
    "baseXp": 10,
    "description": "Escreva `soma(a, b)` que retorna a soma dos dois números.",
    "starterCode": "function soma(a, b) {\n  // escreva seu código aqui\n}\n\n// Exemplos (clique em Executar para testar):\nconsole.log(soma(2, 3))  // deve dar 5\nconsole.log(soma(-1, 1))  // deve dar 0",
    "testCases": [
      {
        "input": [
          2,
          3
        ],
        "expected": 5,
        "description": "soma(2, 3) = 5"
      },
      {
        "input": [
          -1,
          1
        ],
        "expected": 0,
        "description": "soma(-1, 1) = 0"
      },
      {
        "input": [
          10,
          25
        ],
        "expected": 35,
        "description": "soma(10, 25) = 35"
      }
    ]
  },
  {
    "kind": "challenge",
    "title": "2.2 É par?",
    "concept": "O `%` dá o RESTO da divisão (10 % 3 = 1). Uma comparação com `===` devolve true/false. Exemplo: múltiplo de 3.",
    "exampleCode": "function ehMultiploDe3(n) {\n  return n % 3 === 0\n}\n// ehMultiploDe3(9) devolve true",
    "vocabulary": [
      "===",
      "resto"
    ],
    "difficulty": "easy",
    "baseXp": 10,
    "description": "Escreva `ehPar(n)` que retorna true se n for par, senão false.",
    "starterCode": "function ehPar(n) {\n  // escreva seu código aqui\n}\n\n// Exemplos (clique em Executar para testar):\nconsole.log(ehPar(4))  // deve dar true\nconsole.log(ehPar(7))  // deve dar false",
    "testCases": [
      {
        "input": [
          4
        ],
        "expected": true,
        "description": "ehPar(4) = true"
      },
      {
        "input": [
          7
        ],
        "expected": false,
        "description": "ehPar(7) = false"
      },
      {
        "input": [
          0
        ],
        "expected": true,
        "description": "ehPar(0) = true"
      }
    ]
  },
  {
    "kind": "challenge",
    "title": "2.3 Média de três",
    "concept": "O operador de divisão é `/`. Para a média, **some primeiro** e **depois divida** pela quantidade. Guardar em variáveis deixa o passo-a-passo claro. Exemplo com DOIS números:",
    "exampleCode": "function mediaDeDois(a, b) {\n  const soma = a + b      // junta os números\n  const media = soma / 2  // divide pela quantidade\n  return media\n}\n// mediaDeDois(4, 6) devolve 5",
    "vocabulary": [
      "parênteses",
      "precedência"
    ],
    "difficulty": "easy",
    "baseXp": 10,
    "description": "Escreva `mediaTres(a, b, c)` que retorna a média dos três números.",
    "starterCode": "function mediaTres(a, b, c) {\n  // escreva seu código aqui\n}\n\n// Exemplos (clique em Executar para testar):\nconsole.log(mediaTres(3, 3, 3))  // deve dar 3\nconsole.log(mediaTres(1, 2, 3))  // deve dar 2",
    "testCases": [
      {
        "input": [
          3,
          3,
          3
        ],
        "expected": 3,
        "description": "média de 3,3,3 = 3"
      },
      {
        "input": [
          1,
          2,
          3
        ],
        "expected": 2,
        "description": "média de 1,2,3 = 2"
      },
      {
        "input": [
          2,
          2,
          5
        ],
        "expected": 3,
        "description": "média de 2,2,5 = 3"
      }
    ]
  },
  {
    "kind": "challenge",
    "title": "2.4 Maior de idade",
    "concept": "Comparações: `>` maior, `<` menor, `>=` maior ou igual, `<=` menor ou igual. Devolvem true/false. Exemplo análogo:",
    "exampleCode": "function ehAdolescente(idade) {\n  return idade >= 12\n}\n// ehAdolescente(12) devolve true",
    "vocabulary": [
      ">=",
      "<=",
      ">",
      "<"
    ],
    "difficulty": "easy",
    "baseXp": 10,
    "description": "Escreva `maiorDeIdade(idade)` que retorna true se idade for 18 ou mais.",
    "starterCode": "function maiorDeIdade(idade) {\n  // escreva seu código aqui\n}\n\n// Exemplos (clique em Executar para testar):\nconsole.log(maiorDeIdade(18))  // deve dar true\nconsole.log(maiorDeIdade(17))  // deve dar false",
    "testCases": [
      {
        "input": [
          18
        ],
        "expected": true,
        "description": "18 é maior de idade"
      },
      {
        "input": [
          17
        ],
        "expected": false,
        "description": "17 não é"
      },
      {
        "input": [
          40
        ],
        "expected": true,
        "description": "40 é"
      }
    ]
  },
  {
    "kind": "challenge",
    "title": "2.5 São idênticos?",
    "concept": "Use sempre `===` (compara valor E tipo). `1 === \"1\"` é false, porque um é número e o outro é texto. Exemplo:",
    "exampleCode": "function disseSim(resposta) {\n  return resposta === \"sim\"\n}\n// disseSim(\"sim\") devolve true",
    "vocabulary": [
      "===",
      "!==",
      "typeof"
    ],
    "difficulty": "easy",
    "baseXp": 10,
    "description": "Escreva `saoIdenticos(a, b)` que retorna true só se a e b forem idênticos (mesmo valor e mesmo tipo).",
    "starterCode": "function saoIdenticos(a, b) {\n  // escreva seu código aqui\n}\n\n// Exemplos (clique em Executar para testar):\nconsole.log(saoIdenticos(1, \"1\"))  // deve dar false\nconsole.log(saoIdenticos(5, 5))  // deve dar true",
    "testCases": [
      {
        "input": [
          1,
          "1"
        ],
        "expected": false,
        "description": "1 e \"1\" NÃO são idênticos"
      },
      {
        "input": [
          5,
          5
        ],
        "expected": true,
        "description": "5 e 5 são idênticos"
      },
      {
        "input": [
          "a",
          "a"
        ],
        "expected": true,
        "description": "\"a\" e \"a\" são idênticos"
      }
    ]
  },
  {
    "kind": "challenge",
    "title": "2.6 Está na faixa?",
    "concept": "O `&&` (E) só é true quando os DOIS lados são true. Exemplo análogo (nota de 0 a 10):",
    "exampleCode": "function notaValida(n) {\n  return n >= 0 && n <= 10\n}\n// notaValida(7) devolve true",
    "vocabulary": [
      "&&",
      "||",
      "!"
    ],
    "difficulty": "medium",
    "baseXp": 20,
    "description": "Escreva `naFaixa(n, min, max)` que retorna true se n estiver entre min e max (incluindo as pontas).",
    "starterCode": "function naFaixa(n, min, max) {\n  // escreva seu código aqui\n}\n\n// Os testes deste desafio ficam ocultos (dificuldade maior).\n// Use a descrição e o exemplo acima como guia.",
    "testCases": [
      {
        "input": [
          5,
          1,
          10
        ],
        "expected": true,
        "description": "5 está entre 1 e 10"
      },
      {
        "input": [
          0,
          1,
          10
        ],
        "expected": false,
        "description": "0 não está"
      },
      {
        "input": [
          10,
          1,
          10
        ],
        "expected": true,
        "description": "10 está (ponta)"
      }
    ]
  },
  {
    "kind": "lesson",
    "title": "Lição 3 — Decisões (condicionais)",
    "concept": "Programas ficam espertos quando **tomam decisões**.\n\nO `if` roda um bloco só se a condição for verdadeira; `else if` testa outra; `else` cobre o resto. A ordem importa: teste do caso mais específico ao mais geral.\n\nQuando a escolha é entre dois valores, o **ternário** `condição ? valorSeSim : valorSeNão` é um `if` curtinho que já devolve o valor. E o `switch` compara um mesmo valor com vários casos de forma organizada.",
    "exampleCode": "function faixa(idade) {\n  if (idade < 12) return \"criança\"\n  if (idade < 18) return \"adolescente\"\n  return \"adulto\"\n}",
    "vocabulary": [
      "if",
      "else",
      "else if",
      "switch",
      "? :"
    ],
    "difficulty": "easy",
    "baseXp": 5,
    "description": "",
    "starterCode": "",
    "testCases": []
  },
  {
    "kind": "challenge",
    "title": "3.1 Classificar nota",
    "concept": "O `if` testa uma condição; `else if` testa outra; o último `return` cobre o resto. A ordem importa (testa do mais específico ao geral). Exemplo análogo (tamanho):",
    "exampleCode": "function tamanho(n) {\n  if (n > 100) return \"grande\"\n  if (n > 10) return \"médio\"\n  return \"pequeno\"\n}",
    "vocabulary": [
      "if",
      "else",
      "else if"
    ],
    "difficulty": "easy",
    "baseXp": 10,
    "description": "Escreva `classificar(nota)`: \"aprovado\" se nota >= 7, \"recuperação\" se >= 5, senão \"reprovado\".",
    "starterCode": "function classificar(nota) {\n  // escreva seu código aqui\n}\n\n// Exemplos (clique em Executar para testar):\nconsole.log(classificar(9))  // deve dar \"aprovado\"\nconsole.log(classificar(6))  // deve dar \"recuperação\"",
    "testCases": [
      {
        "input": [
          9
        ],
        "expected": "aprovado",
        "description": "9 = aprovado"
      },
      {
        "input": [
          6
        ],
        "expected": "recuperação",
        "description": "6 = recuperação"
      },
      {
        "input": [
          3
        ],
        "expected": "reprovado",
        "description": "3 = reprovado"
      },
      {
        "input": [
          7
        ],
        "expected": "aprovado",
        "description": "7 = aprovado (limite)"
      },
      {
        "input": [
          5
        ],
        "expected": "recuperação",
        "description": "5 = recuperação (limite)"
      }
    ]
  },
  {
    "kind": "challenge",
    "title": "3.2 Sinal do número",
    "concept": "Encadeie `if`s para cobrir cada caso; o `return` já encerra a função. Exemplo análogo:",
    "exampleCode": "function temperatura(t) {\n  if (t > 30) return \"quente\"\n  if (t < 15) return \"frio\"\n  return \"agradável\"\n}",
    "vocabulary": [
      "if",
      "return"
    ],
    "difficulty": "easy",
    "baseXp": 10,
    "description": "Escreva `sinal(n)`: \"positivo\", \"negativo\" ou \"zero\".",
    "starterCode": "function sinal(n) {\n  // escreva seu código aqui\n}\n\n// Exemplos (clique em Executar para testar):\nconsole.log(sinal(5))  // deve dar \"positivo\"\nconsole.log(sinal(-2))  // deve dar \"negativo\"",
    "testCases": [
      {
        "input": [
          5
        ],
        "expected": "positivo",
        "description": "5 = positivo"
      },
      {
        "input": [
          -2
        ],
        "expected": "negativo",
        "description": "-2 = negativo"
      },
      {
        "input": [
          0
        ],
        "expected": "zero",
        "description": "0 = zero"
      }
    ]
  },
  {
    "kind": "challenge",
    "title": "3.3 Maior de dois",
    "concept": "Compare os dois e devolva o que interessa. Exemplo análogo (o MENOR dos dois):",
    "exampleCode": "function menorDeDois(a, b) {\n  if (a <= b) return a\n  return b\n}\n// menorDeDois(3, 7) devolve 3",
    "vocabulary": [
      "if",
      "else"
    ],
    "difficulty": "easy",
    "baseXp": 10,
    "description": "Escreva `maiorDeDois(a, b)` que retorna o maior dos dois (se forem iguais, retorne qualquer um).",
    "starterCode": "function maiorDeDois(a, b) {\n  // escreva seu código aqui\n}\n\n// Exemplos (clique em Executar para testar):\nconsole.log(maiorDeDois(3, 7))  // deve dar 7\nconsole.log(maiorDeDois(9, 2))  // deve dar 9",
    "testCases": [
      {
        "input": [
          3,
          7
        ],
        "expected": 7,
        "description": "maior de 3 e 7 = 7"
      },
      {
        "input": [
          9,
          2
        ],
        "expected": 9,
        "description": "maior de 9 e 2 = 9"
      },
      {
        "input": [
          4,
          4
        ],
        "expected": 4,
        "description": "iguais = 4"
      }
    ]
  },
  {
    "kind": "challenge",
    "title": "3.4 Maior de três",
    "concept": "Combine comparações com `&&`. Exemplo análogo (os três são positivos?):",
    "exampleCode": "function todosPositivos(a, b, c) {\n  return a > 0 && b > 0 && c > 0\n}",
    "vocabulary": [
      "&&",
      "if"
    ],
    "difficulty": "medium",
    "baseXp": 20,
    "description": "Escreva `maiorDeTres(a, b, c)` que retorna o maior dos três.",
    "starterCode": "function maiorDeTres(a, b, c) {\n  // escreva seu código aqui\n}\n\n// Os testes deste desafio ficam ocultos (dificuldade maior).\n// Use a descrição e o exemplo acima como guia.",
    "testCases": [
      {
        "input": [
          1,
          2,
          3
        ],
        "expected": 3,
        "description": "maior de 1,2,3 = 3"
      },
      {
        "input": [
          9,
          2,
          5
        ],
        "expected": 9,
        "description": "maior de 9,2,5 = 9"
      },
      {
        "input": [
          4,
          8,
          8
        ],
        "expected": 8,
        "description": "maior de 4,8,8 = 8"
      }
    ]
  },
  {
    "kind": "challenge",
    "title": "3.5 Nome do dia",
    "concept": "O `switch` compara um valor com vários `case`. Coloque `return` (ou `break`) em cada caso e um `default` para o resto. Exemplo análogo:",
    "exampleCode": "function nomeDaCor(n) {\n  switch (n) {\n    case 1: return \"vermelho\"\n    case 2: return \"verde\"\n    default: return \"desconhecida\"\n  }\n}",
    "vocabulary": [
      "switch",
      "case",
      "default"
    ],
    "difficulty": "medium",
    "baseXp": 20,
    "description": "Escreva `nomeDoDia(n)`: 1=\"domingo\", 2=\"segunda\", 3=\"terça\", 4=\"quarta\", 5=\"quinta\", 6=\"sexta\", 7=\"sábado\".",
    "starterCode": "function nomeDoDia(n) {\n  // escreva seu código aqui\n}\n\n// Os testes deste desafio ficam ocultos (dificuldade maior).\n// Use a descrição e o exemplo acima como guia.",
    "testCases": [
      {
        "input": [
          1
        ],
        "expected": "domingo",
        "description": "1 = domingo"
      },
      {
        "input": [
          4
        ],
        "expected": "quarta",
        "description": "4 = quarta"
      },
      {
        "input": [
          7
        ],
        "expected": "sábado",
        "description": "7 = sábado"
      }
    ]
  },
  {
    "kind": "challenge",
    "title": "3.6 Preço VIP",
    "concept": "O ternário `condição ? valorSeSim : valorSeNão` é um if curtinho que devolve um valor. Exemplo análogo:",
    "exampleCode": "function dobroOuZero(n, dobrar) {\n  return dobrar ? n * 2 : 0\n}\n// dobroOuZero(5, true) devolve 10",
    "vocabulary": [
      "? :",
      "ternário"
    ],
    "difficulty": "easy",
    "baseXp": 10,
    "description": "Escreva `preco(valor, ehVip)`: clientes VIP pagam 10% a menos; os demais pagam o valor cheio.",
    "starterCode": "function preco(valor, ehVip) {\n  // escreva seu código aqui\n}\n\n// Exemplos (clique em Executar para testar):\nconsole.log(preco(100, true))  // deve dar 90\nconsole.log(preco(50, false))  // deve dar 50",
    "testCases": [
      {
        "input": [
          100,
          true
        ],
        "expected": 90,
        "description": "VIP paga 90 de 100"
      },
      {
        "input": [
          50,
          false
        ],
        "expected": 50,
        "description": "não-VIP paga 50"
      },
      {
        "input": [
          200,
          true
        ],
        "expected": 180,
        "description": "VIP paga 180 de 200"
      }
    ]
  },
  {
    "kind": "lesson",
    "title": "Lição 4 — Funções",
    "concept": "Você já usou `return`; agora vamos aprofundar as **funções**.\n\nUma função recebe **parâmetros** (as entradas) e devolve um resultado. Um parâmetro pode ter **valor padrão** (`exp = 2`): se ninguém passar, usa o padrão. As **arrow functions** (`(x) => x + 1`) são uma forma curta de escrever funções.\n\nUm truque de texto muito usado é o **template literal**: com crases e `${}` você mistura texto e valores. Funções bem escritas deixam o código reutilizável.\n\nAlgumas contas já vêm prontas na biblioteca **`Math`**: por exemplo, `Math.pow(base, expoente)` calcula uma potência e `Math.round(n)` arredonda um número. Você vai ver o `Math` em detalhe mais pra frente.",
    "exampleCode": "function saudar(nome) {\n  return `Olá, ${nome}!`\n}\nconst dobro = (n) => n * 2",
    "vocabulary": [
      "parâmetro",
      "arrow function",
      "template literal",
      "${}",
      "Math.pow",
      "Math.round"
    ],
    "difficulty": "easy",
    "baseXp": 5,
    "description": "",
    "starterCode": "",
    "testCases": []
  },
  {
    "kind": "challenge",
    "title": "4.1 Saudação",
    "concept": "Template literal usa crases ` e `${...}` para misturar texto com valores. Exemplo análogo:",
    "exampleCode": "function etiqueta(nome) {\n  return `Produto: ${nome}`\n}\n// etiqueta(\"Bola\") devolve \"Produto: Bola\"",
    "vocabulary": [
      "template literal",
      "${}"
    ],
    "difficulty": "easy",
    "baseXp": 10,
    "description": "Escreva `saudar(nome)` que retorna \"Olá, NOME!\" (com o nome no meio e o ponto de exclamação).",
    "starterCode": "function saudar(nome) {\n  // escreva seu código aqui\n}\n\n// Exemplos (clique em Executar para testar):\nconsole.log(saudar(\"Ana\"))  // deve dar \"Olá, Ana!\"\nconsole.log(saudar(\"Beto\"))  // deve dar \"Olá, Beto!\"",
    "testCases": [
      {
        "input": [
          "Ana"
        ],
        "expected": "Olá, Ana!",
        "description": "saudar(\"Ana\")"
      },
      {
        "input": [
          "Beto"
        ],
        "expected": "Olá, Beto!",
        "description": "saudar(\"Beto\")"
      }
    ]
  },
  {
    "kind": "challenge",
    "title": "4.2 Potência com padrão",
    "concept": "Um parâmetro pode ter valor **padrão** (`= 2`): se não passarem, usa o padrão. `Math.pow(base, exp)` calcula a potência. Exemplo análogo do padrão:",
    "exampleCode": "function multiplica(a, b = 2) {\n  return a * b\n}\n// multiplica(5) usa b=2 -> 10",
    "vocabulary": [
      "parâmetro padrão",
      "Math.pow"
    ],
    "difficulty": "easy",
    "baseXp": 10,
    "description": "Escreva `potencia(base, exp)` onde exp tem padrão 2. Ex.: potencia(3) = 9; potencia(2, 3) = 8.",
    "starterCode": "function potencia(base, exp = 2) {\n  // escreva seu código aqui\n}\n\n// Exemplos (clique em Executar para testar):\nconsole.log(potencia(3))  // deve dar 9\nconsole.log(potencia(2, 3))  // deve dar 8",
    "testCases": [
      {
        "input": [
          3
        ],
        "expected": 9,
        "description": "potencia(3) usa exp=2 -> 9"
      },
      {
        "input": [
          2,
          3
        ],
        "expected": 8,
        "description": "potencia(2,3) = 8"
      },
      {
        "input": [
          5,
          0
        ],
        "expected": 1,
        "description": "potencia(5,0) = 1"
      }
    ]
  },
  {
    "kind": "challenge",
    "title": "4.3 Aplicar desconto",
    "concept": "Porcentagem: `(valor * pct) / 100`. Multiplique ANTES de dividir para evitar erros de arredondamento. Exemplo análogo (aumento):",
    "exampleCode": "function comAumento(preco, pct) {\n  return preco + (preco * pct) / 100\n}\n// comAumento(100, 10) devolve 110",
    "vocabulary": [
      "porcentagem"
    ],
    "difficulty": "easy",
    "baseXp": 10,
    "description": "Escreva `comDesconto(preco, pct)` que retorna o preço com pct% de desconto.",
    "starterCode": "function comDesconto(preco, pct) {\n  // escreva seu código aqui\n}\n\n// Exemplos (clique em Executar para testar):\nconsole.log(comDesconto(100, 20))  // deve dar 80\nconsole.log(comDesconto(250, 10))  // deve dar 225",
    "testCases": [
      {
        "input": [
          100,
          20
        ],
        "expected": 80,
        "description": "100 com 20% = 80"
      },
      {
        "input": [
          250,
          10
        ],
        "expected": 225,
        "description": "250 com 10% = 225"
      },
      {
        "input": [
          40,
          0
        ],
        "expected": 40,
        "description": "40 com 0% = 40"
      }
    ]
  },
  {
    "kind": "challenge",
    "title": "4.4 Ano bissexto",
    "concept": "Combine `&&` (E), `||` (OU) e `%` (resto). Exemplo análogo (divisível por 2 E por 3):",
    "exampleCode": "function divisivelPor6(n) {\n  return n % 2 === 0 && n % 3 === 0\n}\n// divisivelPor6(12) devolve true",
    "vocabulary": [
      "&&",
      "||",
      "%"
    ],
    "difficulty": "medium",
    "baseXp": 20,
    "description": "Escreva `ehBissexto(ano)` que retorna true se o ano for bissexto.",
    "starterCode": "function ehBissexto(ano) {\n  // escreva seu código aqui\n}\n\n// Os testes deste desafio ficam ocultos (dificuldade maior).\n// Use a descrição e o exemplo acima como guia.",
    "testCases": [
      {
        "input": [
          2024
        ],
        "expected": true,
        "description": "2024 é bissexto"
      },
      {
        "input": [
          2023
        ],
        "expected": false,
        "description": "2023 não é"
      },
      {
        "input": [
          2000
        ],
        "expected": true,
        "description": "2000 é (divisível por 400)"
      },
      {
        "input": [
          1900
        ],
        "expected": false,
        "description": "1900 não é (século não-400)"
      }
    ]
  },
  {
    "kind": "challenge",
    "title": "4.5 IMC arredondado",
    "concept": "Para arredondar com 1 casa decimal: `Math.round(x * 10) / 10`. Exemplo do truque:",
    "exampleCode": "function arredonda1(n) {\n  return Math.round(n * 10) / 10\n}\n// arredonda1(3.146) devolve 3.1",
    "vocabulary": [
      "Math.round",
      "arredondar"
    ],
    "difficulty": "medium",
    "baseXp": 20,
    "description": "Escreva `imc(peso, altura)` = peso / (altura * altura), arredondado para 1 casa decimal.",
    "starterCode": "function imc(peso, altura) {\n  // escreva seu código aqui\n}\n\n// Os testes deste desafio ficam ocultos (dificuldade maior).\n// Use a descrição e o exemplo acima como guia.",
    "testCases": [
      {
        "input": [
          80,
          2
        ],
        "expected": 20,
        "description": "imc(80, 2) = 20"
      },
      {
        "input": [
          70,
          1.75
        ],
        "expected": 22.9,
        "description": "imc(70, 1.75) = 22.9"
      }
    ]
  },
  {
    "kind": "lesson",
    "title": "Lição 5 — Listas (arrays)",
    "concept": "Uma **lista** (array) guarda vários valores em ordem: `[10, 20, 30]`.\n\nCada item tem índice a partir de 0 (`lista[0]`), e `.length` diz quantos há (o último é `lista[lista.length - 1]`). Verifique se algo está na lista com `.includes()`.\n\nRegra de ouro: alguns métodos **alteram** a lista original (`push`, `pop`, `sort`, `reverse`) e outros **devolvem uma nova** (`slice`, `concat`, `map`, `filter`, spread `[...lista]`). Para transformar sem estragar a original, **copie antes**.",
    "exampleCode": "const a = [1, 2, 3]\na[0]           // 1\na.length       // 3\n[...a, 4]      // [1,2,3,4] (nova lista)",
    "vocabulary": [
      "array",
      "[i]",
      ".length",
      ".includes()",
      "spread",
      "mutação"
    ],
    "difficulty": "easy",
    "baseXp": 5,
    "description": "",
    "starterCode": "",
    "testCases": []
  },
  {
    "kind": "challenge",
    "title": "5.1 Primeiro",
    "concept": "Itens de uma lista têm índice a partir de 0: `lista[0]` é o primeiro. Exemplo análogo (segundo item):",
    "exampleCode": "function segundo(lista) {\n  return lista[1]\n}\n// [10,20,30][1] é 20",
    "vocabulary": [
      "array",
      "[0]"
    ],
    "difficulty": "easy",
    "baseXp": 10,
    "description": "Escreva `primeiro(lista)` que retorna o primeiro item.",
    "starterCode": "function primeiro(lista) {\n  // escreva seu código aqui\n}\n\n// Exemplos (clique em Executar para testar):\nconsole.log(primeiro([10,20,30]))  // deve dar 10\nconsole.log(primeiro([\"a\",\"b\"]))  // deve dar \"a\"",
    "testCases": [
      {
        "input": [
          [
            10,
            20,
            30
          ]
        ],
        "expected": 10,
        "description": "primeiro = 10"
      },
      {
        "input": [
          [
            "a",
            "b"
          ]
        ],
        "expected": "a",
        "description": "primeiro = \"a\""
      }
    ]
  },
  {
    "kind": "challenge",
    "title": "5.2 Último",
    "concept": "O último índice é `.length - 1` (porque começa em 0). Exemplo análogo (penúltimo):",
    "exampleCode": "function penultimo(lista) {\n  return lista[lista.length - 2]\n}",
    "vocabulary": [
      ".length",
      "índice"
    ],
    "difficulty": "easy",
    "baseXp": 10,
    "description": "Escreva `ultimo(lista)` que retorna o último item.",
    "starterCode": "function ultimo(lista) {\n  // escreva seu código aqui\n}\n\n// Exemplos (clique em Executar para testar):\nconsole.log(ultimo([10,20,30]))  // deve dar 30\nconsole.log(ultimo([\"a\",\"b\"]))  // deve dar \"b\"",
    "testCases": [
      {
        "input": [
          [
            10,
            20,
            30
          ]
        ],
        "expected": 30,
        "description": "último = 30"
      },
      {
        "input": [
          [
            "a",
            "b"
          ]
        ],
        "expected": "b",
        "description": "último = \"b\""
      }
    ]
  },
  {
    "kind": "challenge",
    "title": "5.3 Tamanho da lista",
    "concept": "`.length` em uma lista diz quantos itens há. Exemplo análogo (está vazia?):",
    "exampleCode": "function estaVazia(lista) {\n  return lista.length === 0\n}",
    "vocabulary": [
      ".length"
    ],
    "difficulty": "easy",
    "baseXp": 10,
    "description": "Escreva `tamanhoLista(lista)` que retorna a quantidade de itens.",
    "starterCode": "function tamanhoLista(lista) {\n  // escreva seu código aqui\n}\n\n// Exemplos (clique em Executar para testar):\nconsole.log(tamanhoLista([1,2,3]))  // deve dar 3\nconsole.log(tamanhoLista([]))  // deve dar 0",
    "testCases": [
      {
        "input": [
          [
            1,
            2,
            3
          ]
        ],
        "expected": 3,
        "description": "3 itens"
      },
      {
        "input": [
          []
        ],
        "expected": 0,
        "description": "lista vazia"
      }
    ]
  },
  {
    "kind": "challenge",
    "title": "5.4 Contém valor",
    "concept": "`.includes(valor)` diz se o valor está na lista. Exemplo análogo:",
    "exampleCode": "function temZero(lista) {\n  return lista.includes(0)\n}\n// [1,0,2].includes(0) é true",
    "vocabulary": [
      ".includes()",
      ".indexOf()"
    ],
    "difficulty": "easy",
    "baseXp": 10,
    "description": "Escreva `contemValor(lista, valor)` que retorna true se o valor está na lista.",
    "starterCode": "function contemValor(lista, valor) {\n  // escreva seu código aqui\n}\n\n// Exemplos (clique em Executar para testar):\nconsole.log(contemValor([1,2,3], 2))  // deve dar true\nconsole.log(contemValor([1,2,3], 9))  // deve dar false",
    "testCases": [
      {
        "input": [
          [
            1,
            2,
            3
          ],
          2
        ],
        "expected": true,
        "description": "tem o 2"
      },
      {
        "input": [
          [
            1,
            2,
            3
          ],
          9
        ],
        "expected": false,
        "description": "não tem 9"
      }
    ]
  },
  {
    "kind": "challenge",
    "title": "5.5 Sem o primeiro",
    "concept": "`.slice(1)` devolve uma NOVA lista a partir do índice 1, sem mexer na original. Exemplo análogo (só os 2 primeiros):",
    "exampleCode": "function doisPrimeiros(lista) {\n  return lista.slice(0, 2)\n}\n// [1,2,3,4].slice(0,2) é [1,2]",
    "vocabulary": [
      ".slice()",
      "imutável"
    ],
    "difficulty": "medium",
    "baseXp": 20,
    "description": "Escreva `semPrimeiro(lista)` que retorna a lista sem o primeiro item.",
    "starterCode": "function semPrimeiro(lista) {\n  // escreva seu código aqui\n}\n\n// Os testes deste desafio ficam ocultos (dificuldade maior).\n// Use a descrição e o exemplo acima como guia.",
    "testCases": [
      {
        "input": [
          [
            1,
            2,
            3
          ]
        ],
        "expected": [
          2,
          3
        ],
        "description": "[1,2,3] -> [2,3]"
      },
      {
        "input": [
          [
            "a"
          ]
        ],
        "expected": [],
        "description": "[\"a\"] -> []"
      }
    ]
  },
  {
    "kind": "challenge",
    "title": "5.6 Adicionar (sem mutar)",
    "concept": "O spread `[...lista, valor]` cria uma NOVA lista com o item no fim, sem mexer na original (diferente de `.push`, que altera). Exemplo análogo (adiciona no começo):",
    "exampleCode": "function adicionarNoComeco(lista, valor) {\n  return [valor, ...lista]\n}\n// adicionarNoComeco([2,3], 1) é [1,2,3]",
    "vocabulary": [
      "spread",
      "..."
    ],
    "difficulty": "medium",
    "baseXp": 20,
    "description": "Escreva `adicionar(lista, valor)` que retorna uma NOVA lista com o valor no fim.",
    "starterCode": "function adicionar(lista, valor) {\n  // escreva seu código aqui\n}\n\n// Os testes deste desafio ficam ocultos (dificuldade maior).\n// Use a descrição e o exemplo acima como guia.",
    "testCases": [
      {
        "input": [
          [
            1,
            2
          ],
          9
        ],
        "expected": [
          1,
          2,
          9
        ],
        "description": "adiciona 9"
      },
      {
        "input": [
          [],
          1
        ],
        "expected": [
          1
        ],
        "description": "em lista vazia"
      }
    ]
  },
  {
    "kind": "challenge",
    "title": "5.7 Inverter (copiando antes)",
    "concept": "CUIDADO: `.reverse()` ALTERA a lista original. Copie antes com `[...lista]`. Exemplo do mesmo cuidado com sort:",
    "exampleCode": "function copiaInvertida(lista) {\n  const copia = [...lista]\n  copia.reverse()\n  return copia\n}",
    "vocabulary": [
      ".reverse()",
      "spread",
      "mutação"
    ],
    "difficulty": "medium",
    "baseXp": 20,
    "description": "Escreva `inverter(lista)` que retorna uma NOVA lista invertida.",
    "starterCode": "function inverter(lista) {\n  // escreva seu código aqui\n}\n\n// Os testes deste desafio ficam ocultos (dificuldade maior).\n// Use a descrição e o exemplo acima como guia.",
    "testCases": [
      {
        "input": [
          [
            1,
            2,
            3
          ]
        ],
        "expected": [
          3,
          2,
          1
        ],
        "description": "[1,2,3] -> [3,2,1]"
      },
      {
        "input": [
          [
            "a",
            "b"
          ]
        ],
        "expected": [
          "b",
          "a"
        ],
        "description": "[\"a\",\"b\"] -> [\"b\",\"a\"]"
      }
    ]
  },
  {
    "kind": "challenge",
    "title": "5.8 Juntar com vírgula",
    "concept": "`.join(separador)` transforma uma lista em string separando pelos caracteres dados. Exemplo análogo:",
    "exampleCode": "function comTraco(lista) {\n  return lista.join(\"-\")\n}\n// [1,2,3].join(\"-\") é \"1-2-3\"",
    "vocabulary": [
      ".join()"
    ],
    "difficulty": "easy",
    "baseXp": 10,
    "description": "Escreva `juntar(lista)` que retorna os itens separados por \", \" (vírgula e espaço).",
    "starterCode": "function juntar(lista) {\n  // escreva seu código aqui\n}\n\n// Exemplos (clique em Executar para testar):\nconsole.log(juntar([\"a\",\"b\",\"c\"]))  // deve dar \"a, b, c\"\nconsole.log(juntar([1,2]))  // deve dar \"1, 2\"",
    "testCases": [
      {
        "input": [
          [
            "a",
            "b",
            "c"
          ]
        ],
        "expected": "a, b, c",
        "description": "junta com vírgula"
      },
      {
        "input": [
          [
            1,
            2
          ]
        ],
        "expected": "1, 2",
        "description": "números viram texto"
      }
    ]
  },
  {
    "kind": "lesson",
    "title": "Lição 6 — Repetição (loops)",
    "concept": "Quando precisamos repetir algo, usamos **laços**.\n\nO `for` repete com um **contador** (começo, condição de parada e passo). O `while` repete enquanto uma condição for verdadeira. O `for...of` percorre cada item de uma lista ou string.\n\nMuitas vezes usamos um **acumulador**: uma variável que começa em 0 (para somar) ou 1 (para multiplicar) e é atualizada dentro do laço. Cuidado com o erro de \"um a mais/um a menos\" e com laços que nunca param.",
    "exampleCode": "let soma = 0\nfor (let i = 1; i <= 5; i++) {\n  soma += i\n}\n// soma vale 15",
    "vocabulary": [
      "for",
      "while",
      "for...of",
      "acumulador",
      "++"
    ],
    "difficulty": "easy",
    "baseXp": 5,
    "description": "",
    "starterCode": "",
    "testCases": []
  },
  {
    "kind": "challenge",
    "title": "6.1 Somar até N",
    "concept": "Um `for` repete com um contador; use um **acumulador** (começa em 0) e vá somando com `+=`. Exemplo análogo (soma dos pares até n? aqui: conta de 1 a n):",
    "exampleCode": "function quantosAte(n) {\n  let total = 0\n  for (let i = 1; i <= n; i++) total += 1\n  return total\n}",
    "vocabulary": [
      "for",
      "acumulador",
      "++"
    ],
    "difficulty": "easy",
    "baseXp": 10,
    "description": "Escreva `somaAte(n)` que soma 1 + 2 + ... + n.",
    "starterCode": "function somaAte(n) {\n  // escreva seu código aqui\n}\n\n// Exemplos (clique em Executar para testar):\nconsole.log(somaAte(5))  // deve dar 15\nconsole.log(somaAte(1))  // deve dar 1",
    "testCases": [
      {
        "input": [
          5
        ],
        "expected": 15,
        "description": "1..5 = 15"
      },
      {
        "input": [
          1
        ],
        "expected": 1,
        "description": "1 = 1"
      },
      {
        "input": [
          10
        ],
        "expected": 55,
        "description": "1..10 = 55"
      }
    ]
  },
  {
    "kind": "challenge",
    "title": "6.2 Contar pares",
    "concept": "Conte dentro do laço só quando a condição for verdadeira (`%` para testar par). Exemplo análogo (conta ímpares):",
    "exampleCode": "function contarImpares(ate) {\n  let n = 0\n  for (let i = 1; i <= ate; i++) {\n    if (i % 2 === 1) n++\n  }\n  return n\n}",
    "vocabulary": [
      "for",
      "if",
      "%"
    ],
    "difficulty": "easy",
    "baseXp": 10,
    "description": "Escreva `contarPares(ate)` que conta quantos números pares existem de 1 até ate.",
    "starterCode": "function contarPares(ate) {\n  // escreva seu código aqui\n}\n\n// Exemplos (clique em Executar para testar):\nconsole.log(contarPares(10))  // deve dar 5\nconsole.log(contarPares(1))  // deve dar 0",
    "testCases": [
      {
        "input": [
          10
        ],
        "expected": 5,
        "description": "1..10 tem 5 pares"
      },
      {
        "input": [
          1
        ],
        "expected": 0,
        "description": "1..1 tem 0"
      },
      {
        "input": [
          7
        ],
        "expected": 3,
        "description": "1..7 tem 3 (2,4,6)"
      }
    ]
  },
  {
    "kind": "challenge",
    "title": "6.3 Tabuada",
    "concept": "Crie uma lista vazia e vá adicionando com `.push()` dentro do laço. Exemplo análogo (lista de 1 a n):",
    "exampleCode": "function de1ate(n) {\n  const r = []\n  for (let i = 1; i <= n; i++) r.push(i)\n  return r\n}\n// de1ate(3) devolve [1,2,3]",
    "vocabulary": [
      "for",
      ".push()",
      "array"
    ],
    "difficulty": "medium",
    "baseXp": 20,
    "description": "Escreva `tabuada(n)` que retorna uma lista com n×1, n×2, ..., n×10.",
    "starterCode": "function tabuada(n) {\n  // escreva seu código aqui\n}\n\n// Os testes deste desafio ficam ocultos (dificuldade maior).\n// Use a descrição e o exemplo acima como guia.",
    "testCases": [
      {
        "input": [
          2
        ],
        "expected": [
          2,
          4,
          6,
          8,
          10,
          12,
          14,
          16,
          18,
          20
        ],
        "description": "tabuada do 2"
      },
      {
        "input": [
          5
        ],
        "expected": [
          5,
          10,
          15,
          20,
          25,
          30,
          35,
          40,
          45,
          50
        ],
        "description": "tabuada do 5"
      }
    ]
  },
  {
    "kind": "challenge",
    "title": "6.4 Fatorial",
    "concept": "Fatorial = 1×2×...×n. O acumulador de multiplicação começa em 1 e usa `*=`. Exemplo análogo (multiplica todos até n):",
    "exampleCode": "function produtoAte(n) {\n  let p = 1\n  for (let i = 1; i <= n; i++) p *= i\n  return p\n}\n// produtoAte(4) é 24",
    "vocabulary": [
      "for",
      "*="
    ],
    "difficulty": "medium",
    "baseXp": 20,
    "description": "Escreva `fatorial(n)` (use laço). fatorial(0) = 1.",
    "starterCode": "function fatorial(n) {\n  // escreva seu código aqui\n}\n\n// Os testes deste desafio ficam ocultos (dificuldade maior).\n// Use a descrição e o exemplo acima como guia.",
    "testCases": [
      {
        "input": [
          5
        ],
        "expected": 120,
        "description": "5! = 120"
      },
      {
        "input": [
          0
        ],
        "expected": 1,
        "description": "0! = 1"
      },
      {
        "input": [
          1
        ],
        "expected": 1,
        "description": "1! = 1"
      }
    ]
  },
  {
    "kind": "challenge",
    "title": "6.5 Potência na mão",
    "concept": "Potência é multiplicar a base por ela mesma \"exp\" vezes (acumulador começa em 1). Exemplo análogo (soma a base exp vezes = multiplicação na mão):",
    "exampleCode": "function multiplicaSomando(base, vezes) {\n  let r = 0\n  for (let i = 0; i < vezes; i++) r += base\n  return r\n}",
    "vocabulary": [
      "for",
      "*="
    ],
    "difficulty": "medium",
    "baseXp": 20,
    "description": "Escreva `potencia(base, exp)` SEM usar Math.pow. base^0 = 1.",
    "starterCode": "function potencia(base, exp) {\n  // escreva seu código aqui\n}\n\n// Os testes deste desafio ficam ocultos (dificuldade maior).\n// Use a descrição e o exemplo acima como guia.",
    "testCases": [
      {
        "input": [
          2,
          3
        ],
        "expected": 8,
        "description": "2^3 = 8"
      },
      {
        "input": [
          5,
          0
        ],
        "expected": 1,
        "description": "5^0 = 1"
      },
      {
        "input": [
          3,
          2
        ],
        "expected": 9,
        "description": "3^2 = 9"
      }
    ]
  },
  {
    "kind": "challenge",
    "title": "6.6 Maior da lista",
    "concept": "`for...of` percorre cada item. Guarde o maior visto até agora, começando pelo primeiro. Exemplo análogo (soma a lista):",
    "exampleCode": "function somar(lista) {\n  let total = 0\n  for (const x of lista) total += x\n  return total\n}",
    "vocabulary": [
      "for...of"
    ],
    "difficulty": "medium",
    "baseXp": 20,
    "description": "Escreva `maiorDaLista(lista)` que retorna o maior número da lista.",
    "starterCode": "function maiorDaLista(lista) {\n  // escreva seu código aqui\n}\n\n// Os testes deste desafio ficam ocultos (dificuldade maior).\n// Use a descrição e o exemplo acima como guia.",
    "testCases": [
      {
        "input": [
          [
            3,
            7,
            2
          ]
        ],
        "expected": 7,
        "description": "maior de [3,7,2] = 7"
      },
      {
        "input": [
          [
            -5,
            -1,
            -9
          ]
        ],
        "expected": -1,
        "description": "maior de negativos"
      },
      {
        "input": [
          [
            10
          ]
        ],
        "expected": 10,
        "description": "lista de 1"
      }
    ]
  },
  {
    "kind": "challenge",
    "title": "6.7 Quantas vezes a letra",
    "concept": "Percorra com `for...of` e conte quando o caractere for `===` à letra. Exemplo análogo (conta dígitos \"0\"):",
    "exampleCode": "function contarZeros(texto) {\n  let n = 0\n  for (const c of texto) {\n    if (c === \"0\") n++\n  }\n  return n\n}",
    "vocabulary": [
      "for...of",
      "===",
      "contador"
    ],
    "difficulty": "medium",
    "baseXp": 20,
    "description": "Escreva `contarLetra(texto, letra)` que conta quantas vezes a letra aparece.",
    "starterCode": "function contarLetra(texto, letra) {\n  // escreva seu código aqui\n}\n\n// Os testes deste desafio ficam ocultos (dificuldade maior).\n// Use a descrição e o exemplo acima como guia.",
    "testCases": [
      {
        "input": [
          "banana",
          "a"
        ],
        "expected": 3,
        "description": "\"a\" em \"banana\" = 3"
      },
      {
        "input": [
          "banana",
          "z"
        ],
        "expected": 0,
        "description": "\"z\" = 0"
      }
    ]
  },
  {
    "kind": "lesson",
    "title": "Lição 7 — Texto (strings)",
    "concept": "Texto (`string`) é um dos tipos que você mais vai manipular.\n\nToda string tem `.length` (quantos caracteres) e cada caractere tem um **índice a partir de 0** (`texto[0]` é o primeiro). Métodos úteis: `.toUpperCase()`/`.toLowerCase()`, `.includes()`, `.slice()`, `.split()` e `.replace()`.\n\nRegra importante: strings são **imutáveis** — os métodos não mudam a original, eles **devolvem uma nova** string. Guarde o resultado se for usá-lo.",
    "exampleCode": "\"casa\".length          // 4\n\"casa\"[0]               // \"c\"\n\"oi\".toUpperCase()      // \"OI\"",
    "vocabulary": [
      ".length",
      ".toUpperCase()",
      ".slice()",
      ".includes()",
      ".split()",
      "imutável"
    ],
    "difficulty": "easy",
    "baseXp": 5,
    "description": "",
    "starterCode": "",
    "testCases": []
  },
  {
    "kind": "challenge",
    "title": "7.1 Tamanho",
    "concept": "`.length` diz quantos caracteres a string tem. Exemplo análogo:",
    "exampleCode": "function temSenhaForte(senha) {\n  return senha.length >= 8\n}\n// \"12345678\".length é 8",
    "vocabulary": [
      ".length"
    ],
    "difficulty": "easy",
    "baseXp": 10,
    "description": "Escreva `tamanho(texto)` que retorna a quantidade de caracteres.",
    "starterCode": "function tamanho(texto) {\n  // escreva seu código aqui\n}\n\n// Exemplos (clique em Executar para testar):\nconsole.log(tamanho(\"casa\"))  // deve dar 4\nconsole.log(tamanho(\"\"))  // deve dar 0",
    "testCases": [
      {
        "input": [
          "casa"
        ],
        "expected": 4,
        "description": "\"casa\" tem 4"
      },
      {
        "input": [
          ""
        ],
        "expected": 0,
        "description": "vazio tem 0"
      }
    ]
  },
  {
    "kind": "challenge",
    "title": "7.2 Gritar",
    "concept": "Strings são imutáveis: `.toUpperCase()` devolve uma NOVA string em maiúsculas (`.toLowerCase()` em minúsculas). Exemplo análogo:",
    "exampleCode": "function sussurrar(texto) {\n  return texto.toLowerCase()\n}\n// sussurrar(\"OI\") devolve \"oi\"",
    "vocabulary": [
      ".toUpperCase()",
      ".toLowerCase()"
    ],
    "difficulty": "easy",
    "baseXp": 10,
    "description": "Escreva `gritar(texto)` que retorna o texto todo em MAIÚSCULAS.",
    "starterCode": "function gritar(texto) {\n  // escreva seu código aqui\n}\n\n// Exemplos (clique em Executar para testar):\nconsole.log(gritar(\"oi\"))  // deve dar \"OI\"\nconsole.log(gritar(\"Codi\"))  // deve dar \"CODI\"",
    "testCases": [
      {
        "input": [
          "oi"
        ],
        "expected": "OI",
        "description": "\"oi\" -> \"OI\""
      },
      {
        "input": [
          "Codi"
        ],
        "expected": "CODI",
        "description": "\"Codi\" -> \"CODI\""
      }
    ]
  },
  {
    "kind": "challenge",
    "title": "7.3 Primeira letra",
    "concept": "Cada caractere tem um índice começando em 0: `texto[0]` é o primeiro. Exemplo análogo (terceira letra):",
    "exampleCode": "function terceiraLetra(texto) {\n  return texto[2]\n}\n// \"casa\"[2] é \"s\"",
    "vocabulary": [
      "índice",
      "[0]"
    ],
    "difficulty": "easy",
    "baseXp": 10,
    "description": "Escreva `primeiraLetra(texto)` que retorna o primeiro caractere.",
    "starterCode": "function primeiraLetra(texto) {\n  // escreva seu código aqui\n}\n\n// Exemplos (clique em Executar para testar):\nconsole.log(primeiraLetra(\"banana\"))  // deve dar \"b\"\nconsole.log(primeiraLetra(\"Zé\"))  // deve dar \"Z\"",
    "testCases": [
      {
        "input": [
          "banana"
        ],
        "expected": "b",
        "description": "primeira de \"banana\" = \"b\""
      },
      {
        "input": [
          "Zé"
        ],
        "expected": "Z",
        "description": "primeira de \"Zé\" = \"Z\""
      }
    ]
  },
  {
    "kind": "challenge",
    "title": "7.4 Contém palavra",
    "concept": "`.includes(parte)` devolve true se a parte aparece na string. Exemplo análogo:",
    "exampleCode": "function ehEmail(texto) {\n  return texto.includes(\"@\")\n}\n// \"a@b\".includes(\"@\") é true",
    "vocabulary": [
      ".includes()"
    ],
    "difficulty": "easy",
    "baseXp": 10,
    "description": "Escreva `contem(frase, palavra)` que retorna true se a palavra aparece na frase.",
    "starterCode": "function contem(frase, palavra) {\n  // escreva seu código aqui\n}\n\n// Exemplos (clique em Executar para testar):\nconsole.log(contem(\"banana split\", \"split\"))  // deve dar true\nconsole.log(contem(\"ola mundo\", \"xyz\"))  // deve dar false",
    "testCases": [
      {
        "input": [
          "banana split",
          "split"
        ],
        "expected": true,
        "description": "tem \"split\""
      },
      {
        "input": [
          "ola mundo",
          "xyz"
        ],
        "expected": false,
        "description": "não tem \"xyz\""
      }
    ]
  },
  {
    "kind": "challenge",
    "title": "7.5 Inverter texto",
    "concept": "Quebre em letras com `.split(\"\")`, inverta com `.reverse()` e junte com `.join(\"\")`. Exemplo do encadeamento:",
    "exampleCode": "function letrasEmLista(texto) {\n  return texto.split(\"\")\n}\n// \"abc\".split(\"\") devolve [\"a\",\"b\",\"c\"]",
    "vocabulary": [
      ".split()",
      ".reverse()",
      ".join()"
    ],
    "difficulty": "medium",
    "baseXp": 20,
    "description": "Escreva `inverter(texto)` que retorna o texto de trás pra frente.",
    "starterCode": "function inverter(texto) {\n  // escreva seu código aqui\n}\n\n// Os testes deste desafio ficam ocultos (dificuldade maior).\n// Use a descrição e o exemplo acima como guia.",
    "testCases": [
      {
        "input": [
          "casa"
        ],
        "expected": "asac",
        "description": "\"casa\" -> \"asac\""
      },
      {
        "input": [
          "Codi"
        ],
        "expected": "idoC",
        "description": "\"Codi\" -> \"idoC\""
      }
    ]
  },
  {
    "kind": "challenge",
    "title": "7.6 Contar vogais",
    "concept": "Percorra com `for...of` e use um contador. `\"aeiou\".includes(c)` testa se é vogal. Exemplo análogo (conta espaços):",
    "exampleCode": "function contarEspacos(texto) {\n  let n = 0\n  for (const c of texto) {\n    if (c === \" \") n++\n  }\n  return n\n}",
    "vocabulary": [
      "for...of",
      "contador"
    ],
    "difficulty": "medium",
    "baseXp": 20,
    "description": "Escreva `contarVogais(texto)` que conta as vogais a, e, i, o, u (minúsculas).",
    "starterCode": "function contarVogais(texto) {\n  // escreva seu código aqui\n}\n\n// Os testes deste desafio ficam ocultos (dificuldade maior).\n// Use a descrição e o exemplo acima como guia.",
    "testCases": [
      {
        "input": [
          "banana"
        ],
        "expected": 3,
        "description": "\"banana\" tem 3 vogais"
      },
      {
        "input": [
          "xyz"
        ],
        "expected": 0,
        "description": "\"xyz\" tem 0"
      },
      {
        "input": [
          "aeiou"
        ],
        "expected": 5,
        "description": "\"aeiou\" tem 5"
      }
    ]
  },
  {
    "kind": "challenge",
    "title": "7.7 Capitalizar",
    "concept": "Junte a primeira letra em maiúscula com o resto (`.slice(1)`) em minúscula. Exemplo do `.slice`:",
    "exampleCode": "function semPrimeiraLetra(texto) {\n  return texto.slice(1)\n}\n// \"casa\".slice(1) devolve \"asa\"",
    "vocabulary": [
      ".slice()",
      ".charAt()"
    ],
    "difficulty": "medium",
    "baseXp": 20,
    "description": "Escreva `capitalizar(texto)`: primeira letra maiúscula, o resto minúsculo.",
    "starterCode": "function capitalizar(texto) {\n  // escreva seu código aqui\n}\n\n// Os testes deste desafio ficam ocultos (dificuldade maior).\n// Use a descrição e o exemplo acima como guia.",
    "testCases": [
      {
        "input": [
          "maria"
        ],
        "expected": "Maria",
        "description": "\"maria\" -> \"Maria\""
      },
      {
        "input": [
          "JOÃO"
        ],
        "expected": "João",
        "description": "\"JOÃO\" -> \"João\""
      }
    ]
  },
  {
    "kind": "challenge",
    "title": "7.8 Censurar",
    "concept": "Quebrar pela palavra e juntar com outra troca TODAS as ocorrências (o `.replace` simples trocaria só a 1ª). Exemplo análogo:",
    "exampleCode": "function trocarTracos(texto) {\n  return texto.split(\"-\").join(\" \")\n}\n// \"a-b-c\" vira \"a b c\"",
    "vocabulary": [
      ".split()",
      ".join()",
      ".replace()"
    ],
    "difficulty": "medium",
    "baseXp": 20,
    "description": "Escreva `censurar(frase, palavra)` que troca toda ocorrência da palavra por \"***\".",
    "starterCode": "function censurar(frase, palavra) {\n  // escreva seu código aqui\n}\n\n// Os testes deste desafio ficam ocultos (dificuldade maior).\n// Use a descrição e o exemplo acima como guia.",
    "testCases": [
      {
        "input": [
          "voce e bobo bobo",
          "bobo"
        ],
        "expected": "voce e *** ***",
        "description": "troca as duas"
      },
      {
        "input": [
          "oi mundo",
          "feio"
        ],
        "expected": "oi mundo",
        "description": "sem ocorrência fica igual"
      }
    ]
  },
  {
    "kind": "challenge",
    "title": "7.9 É palíndromo?",
    "concept": "Palíndromo é uma palavra igual de trás pra frente. Antes de comparar, **normalize**: deixe tudo minúsculo e monte uma versão só com letras, percorrendo com `for...of` e guardando cada letra. Depois compare com o texto invertido. Exemplo da limpeza:",
    "exampleCode": "let limpo = \"\"\nfor (const c of \"Olá, Ana!\".toLowerCase()) {\n  if (c >= \"a\" && c <= \"z\") limpo += c\n}\n// limpo = \"olana\"",
    "vocabulary": [
      ".toLowerCase()",
      "for...of",
      "comparação"
    ],
    "difficulty": "medium",
    "baseXp": 20,
    "description": "Escreva `ehPalindromo(texto)` que retorna true se for palíndromo (ignore maiúsculas e espaços).",
    "starterCode": "function ehPalindromo(texto) {\n  // escreva seu código aqui\n}\n\n// Os testes deste desafio ficam ocultos (dificuldade maior).\n// Use a descrição e o exemplo acima como guia.",
    "testCases": [
      {
        "input": [
          "arara"
        ],
        "expected": true,
        "description": "\"arara\" é"
      },
      {
        "input": [
          "Ana"
        ],
        "expected": true,
        "description": "\"Ana\" é"
      },
      {
        "input": [
          "casa"
        ],
        "expected": false,
        "description": "\"casa\" não é"
      },
      {
        "input": [
          "Anotaram a data da maratona"
        ],
        "expected": true,
        "description": "frase é palíndromo"
      }
    ]
  },
  {
    "kind": "lesson",
    "title": "Lição 8 — Transformando listas",
    "concept": "As **funções de ordem superior** deixam o trabalho com listas muito mais poderoso e limpo.\n\n`.map()` cria uma nova lista transformando cada item. `.filter()` mantém só os que passam numa condição. `.reduce()` combina a lista inteira em um valor (como uma soma). `.find()` acha o primeiro; `.some()`/`.every()` verificam se algum/todos passam.\n\nPegadinha clássica: `.sort()` sem função ordena como **texto** (`[10, 2, 1]` viraria `[1, 10, 2]`!). Para números use `.sort((a, b) => a - b)` — e copie antes, pois `sort` altera a original.",
    "exampleCode": "[1,2,3].map(x => x * 2)         // [2,4,6]\n[1,2,3,4].filter(x => x%2===0)  // [2,4]\n[1,2,3].reduce((a,x) => a+x, 0)  // 6",
    "vocabulary": [
      ".map()",
      ".filter()",
      ".reduce()",
      ".find()",
      ".sort()",
      "comparador"
    ],
    "difficulty": "easy",
    "baseXp": 5,
    "description": "",
    "starterCode": "",
    "testCases": []
  },
  {
    "kind": "challenge",
    "title": "8.1 Dobrar todos",
    "concept": "`.map(fn)` cria uma NOVA lista aplicando a função a cada item. Exemplo análogo (+1 em cada):",
    "exampleCode": "function maisUm(lista) {\n  return lista.map(x => x + 1)\n}\n// [1,2,3] vira [2,3,4]",
    "vocabulary": [
      ".map()"
    ],
    "difficulty": "medium",
    "baseXp": 20,
    "description": "Escreva `dobrarTodos(lista)` que retorna cada número dobrado.",
    "starterCode": "function dobrarTodos(lista) {\n  // escreva seu código aqui\n}\n\n// Os testes deste desafio ficam ocultos (dificuldade maior).\n// Use a descrição e o exemplo acima como guia.",
    "testCases": [
      {
        "input": [
          [
            1,
            2,
            3
          ]
        ],
        "expected": [
          2,
          4,
          6
        ],
        "description": "[1,2,3] -> [2,4,6]"
      },
      {
        "input": [
          []
        ],
        "expected": [],
        "description": "vazia -> vazia"
      }
    ]
  },
  {
    "kind": "challenge",
    "title": "8.2 Só os pares",
    "concept": "`.filter(fn)` mantém só os itens em que a função devolve true. Exemplo análogo (maiores que 5):",
    "exampleCode": "function maioresQue5(lista) {\n  return lista.filter(x => x > 5)\n}\n// [3,7,9] vira [7,9]",
    "vocabulary": [
      ".filter()"
    ],
    "difficulty": "medium",
    "baseXp": 20,
    "description": "Escreva `apenasPares(lista)` que retorna só os números pares.",
    "starterCode": "function apenasPares(lista) {\n  // escreva seu código aqui\n}\n\n// Os testes deste desafio ficam ocultos (dificuldade maior).\n// Use a descrição e o exemplo acima como guia.",
    "testCases": [
      {
        "input": [
          [
            1,
            2,
            3,
            4
          ]
        ],
        "expected": [
          2,
          4
        ],
        "description": "pares de 1..4"
      },
      {
        "input": [
          [
            1,
            3,
            5
          ]
        ],
        "expected": [],
        "description": "só ímpares -> vazio"
      }
    ]
  },
  {
    "kind": "challenge",
    "title": "8.3 Somar tudo",
    "concept": "`.reduce((acc, x) => ..., inicial)` combina a lista num único valor. Exemplo análogo (multiplica tudo):",
    "exampleCode": "function multiplicarTudo(lista) {\n  return lista.reduce((a, x) => a * x, 1)\n}\n// [2,3,4] dá 24",
    "vocabulary": [
      ".reduce()"
    ],
    "difficulty": "medium",
    "baseXp": 20,
    "description": "Escreva `somarTudo(lista)` que retorna a soma de todos os itens.",
    "starterCode": "function somarTudo(lista) {\n  // escreva seu código aqui\n}\n\n// Os testes deste desafio ficam ocultos (dificuldade maior).\n// Use a descrição e o exemplo acima como guia.",
    "testCases": [
      {
        "input": [
          [
            1,
            2,
            3,
            4
          ]
        ],
        "expected": 10,
        "description": "soma = 10"
      },
      {
        "input": [
          []
        ],
        "expected": 0,
        "description": "vazia = 0"
      }
    ]
  },
  {
    "kind": "challenge",
    "title": "8.4 Nomes em maiúsculo",
    "concept": "Use `.map` para transformar cada string. Exemplo análogo (tamanho de cada palavra):",
    "exampleCode": "function tamanhos(lista) {\n  return lista.map(s => s.length)\n}\n// [\"oi\",\"tchau\"] vira [2,5]",
    "vocabulary": [
      ".map()",
      ".toUpperCase()"
    ],
    "difficulty": "medium",
    "baseXp": 20,
    "description": "Escreva `nomesMaiusculos(lista)` que devolve cada nome em MAIÚSCULAS.",
    "starterCode": "function nomesMaiusculos(lista) {\n  // escreva seu código aqui\n}\n\n// Os testes deste desafio ficam ocultos (dificuldade maior).\n// Use a descrição e o exemplo acima como guia.",
    "testCases": [
      {
        "input": [
          [
            "ana",
            "beto"
          ]
        ],
        "expected": [
          "ANA",
          "BETO"
        ],
        "description": "maiúsculas"
      }
    ]
  },
  {
    "kind": "challenge",
    "title": "8.5 Quantos maiores que N",
    "concept": "Combine `.filter` com `.length` para contar. Exemplo análogo (quantos pares):",
    "exampleCode": "function quantosPares(lista) {\n  return lista.filter(x => x % 2 === 0).length\n}",
    "vocabulary": [
      ".filter()",
      ".length"
    ],
    "difficulty": "medium",
    "baseXp": 20,
    "description": "Escreva `quantosMaioresQue(lista, n)` que conta quantos itens são maiores que n.",
    "starterCode": "function quantosMaioresQue(lista, n) {\n  // escreva seu código aqui\n}\n\n// Os testes deste desafio ficam ocultos (dificuldade maior).\n// Use a descrição e o exemplo acima como guia.",
    "testCases": [
      {
        "input": [
          [
            1,
            5,
            9,
            3
          ],
          4
        ],
        "expected": 2,
        "description": "maiores que 4: 5 e 9"
      },
      {
        "input": [
          [
            1,
            2
          ],
          9
        ],
        "expected": 0,
        "description": "nenhum"
      }
    ]
  },
  {
    "kind": "challenge",
    "title": "8.6 Achar o primeiro maior",
    "concept": "`.find(fn)` devolve o PRIMEIRO item que passa na condição (ou undefined). Exemplo análogo (1º par):",
    "exampleCode": "function primeiroPar(lista) {\n  return lista.find(x => x % 2 === 0)\n}\n// [1,3,4,6] devolve 4",
    "vocabulary": [
      ".find()"
    ],
    "difficulty": "medium",
    "baseXp": 20,
    "description": "Escreva `primeiroMaiorQue(lista, n)` que retorna o primeiro item maior que n.",
    "starterCode": "function primeiroMaiorQue(lista, n) {\n  // escreva seu código aqui\n}\n\n// Os testes deste desafio ficam ocultos (dificuldade maior).\n// Use a descrição e o exemplo acima como guia.",
    "testCases": [
      {
        "input": [
          [
            1,
            5,
            9
          ],
          4
        ],
        "expected": 5,
        "description": "primeiro > 4 = 5"
      },
      {
        "input": [
          [
            10,
            2,
            20
          ],
          5
        ],
        "expected": 10,
        "description": "primeiro > 5 = 10"
      }
    ]
  },
  {
    "kind": "challenge",
    "title": "8.7 Todos positivos?",
    "concept": "`.every(fn)` devolve true se TODOS passarem. Exemplo análogo (todos pares?):",
    "exampleCode": "function todosPares(lista) {\n  return lista.every(x => x % 2 === 0)\n}",
    "vocabulary": [
      ".every()"
    ],
    "difficulty": "medium",
    "baseXp": 20,
    "description": "Escreva `todosPositivos(lista)` que retorna true se todos forem maiores que 0.",
    "starterCode": "function todosPositivos(lista) {\n  // escreva seu código aqui\n}\n\n// Os testes deste desafio ficam ocultos (dificuldade maior).\n// Use a descrição e o exemplo acima como guia.",
    "testCases": [
      {
        "input": [
          [
            1,
            2,
            3
          ]
        ],
        "expected": true,
        "description": "todos positivos"
      },
      {
        "input": [
          [
            1,
            -2,
            3
          ]
        ],
        "expected": false,
        "description": "tem negativo"
      }
    ]
  },
  {
    "kind": "challenge",
    "title": "8.8 Algum negativo?",
    "concept": "`.some(fn)` devolve true se PELO MENOS UM passar. Exemplo análogo (tem algum zero?):",
    "exampleCode": "function temZero(lista) {\n  return lista.some(x => x === 0)\n}",
    "vocabulary": [
      ".some()"
    ],
    "difficulty": "medium",
    "baseXp": 20,
    "description": "Escreva `algumNegativo(lista)` que retorna true se houver algum número negativo.",
    "starterCode": "function algumNegativo(lista) {\n  // escreva seu código aqui\n}\n\n// Os testes deste desafio ficam ocultos (dificuldade maior).\n// Use a descrição e o exemplo acima como guia.",
    "testCases": [
      {
        "input": [
          [
            1,
            -2,
            3
          ]
        ],
        "expected": true,
        "description": "tem -2"
      },
      {
        "input": [
          [
            1,
            2,
            3
          ]
        ],
        "expected": false,
        "description": "nenhum negativo"
      }
    ]
  },
  {
    "kind": "challenge",
    "title": "8.9 Média da lista",
    "concept": "Some com `.reduce` e divida pelo `.length`. Exemplo do `.reduce` somando:",
    "exampleCode": "function soma(lista) {\n  return lista.reduce((a, x) => a + x, 0)\n}\n// média = soma / lista.length",
    "vocabulary": [
      ".reduce()",
      ".length"
    ],
    "difficulty": "medium",
    "baseXp": 20,
    "description": "Escreva `media(lista)` que retorna a média dos números (a lista nunca é vazia).",
    "starterCode": "function media(lista) {\n  // escreva seu código aqui\n}\n\n// Os testes deste desafio ficam ocultos (dificuldade maior).\n// Use a descrição e o exemplo acima como guia.",
    "testCases": [
      {
        "input": [
          [
            2,
            4,
            6
          ]
        ],
        "expected": 4,
        "description": "média = 4"
      },
      {
        "input": [
          [
            10
          ]
        ],
        "expected": 10,
        "description": "um item"
      }
    ]
  },
  {
    "kind": "challenge",
    "title": "8.10 Ordenar crescente",
    "concept": "PEGADINHA: `.sort()` sem função ordena como TEXTO ([10,2,1] viraria [1,10,2]!). Para números use `.sort((a,b)=>a-b)`. E copie antes (`[...lista]`), pois sort altera a original. Exemplo:",
    "exampleCode": "function ordenarDecrescente(lista) {\n  return [...lista].sort((a, b) => b - a)\n}\n// [1,3,2] vira [3,2,1]",
    "vocabulary": [
      ".sort()",
      "comparador",
      "spread"
    ],
    "difficulty": "hard",
    "baseXp": 35,
    "description": "Escreva `ordenarCrescente(lista)` que retorna uma NOVA lista ordenada do menor ao maior.",
    "starterCode": "function ordenarCrescente(lista) {\n  // escreva seu código aqui\n}\n\n// Os testes deste desafio ficam ocultos (dificuldade maior).\n// Use a descrição e o exemplo acima como guia.",
    "testCases": [
      {
        "input": [
          [
            10,
            2,
            1
          ]
        ],
        "expected": [
          1,
          2,
          10
        ],
        "description": "ordena números (não texto!)"
      },
      {
        "input": [
          [
            3,
            1,
            2
          ]
        ],
        "expected": [
          1,
          2,
          3
        ],
        "description": "[3,1,2] -> [1,2,3]"
      }
    ]
  },
  {
    "kind": "lesson",
    "title": "Lição 9 — Números e Math",
    "concept": "Para trabalhar com números, o objeto **`Math`** traz várias ferramentas: `Math.round` (arredonda ao mais próximo), `Math.floor` (para baixo), `Math.ceil` (para cima), `Math.abs` (sem sinal), `Math.max`/`Math.min` e `Math.sqrt`.\n\nDuas armadilhas: `.toFixed(2)` devolve uma **string** (envolva em `Number(...)` se quiser número) e a soma de decimais nem sempre é exata (`0.1 + 0.2` não dá exatamente `0.3`). Para converter texto em número use `Number(...)` ou `parseInt(...)`.",
    "exampleCode": "Math.round(2.6)               // 3\nNumber((3.14159).toFixed(2))  // 3.14",
    "vocabulary": [
      "Math.round",
      "Math.floor",
      "Math.abs",
      "Math.max",
      ".toFixed()",
      "Number()"
    ],
    "difficulty": "easy",
    "baseXp": 5,
    "description": "",
    "starterCode": "",
    "testCases": []
  },
  {
    "kind": "challenge",
    "title": "9.1 Arredondar",
    "concept": "`Math.round` arredonda ao mais próximo; `Math.floor` para baixo; `Math.ceil` para cima. Exemplo análogo:",
    "exampleCode": "function paraBaixo(n) {\n  return Math.floor(n)\n}\n// Math.floor(2.9) é 2",
    "vocabulary": [
      "Math.round",
      "Math.floor",
      "Math.ceil"
    ],
    "difficulty": "easy",
    "baseXp": 10,
    "description": "Escreva `arredondar(n)` que retorna n arredondado ao inteiro mais próximo.",
    "starterCode": "function arredondar(n) {\n  // escreva seu código aqui\n}\n\n// Exemplos (clique em Executar para testar):\nconsole.log(arredondar(2.4))  // deve dar 2\nconsole.log(arredondar(2.6))  // deve dar 3",
    "testCases": [
      {
        "input": [
          2.4
        ],
        "expected": 2,
        "description": "2.4 -> 2"
      },
      {
        "input": [
          2.6
        ],
        "expected": 3,
        "description": "2.6 -> 3"
      },
      {
        "input": [
          5
        ],
        "expected": 5,
        "description": "5 -> 5"
      }
    ]
  },
  {
    "kind": "challenge",
    "title": "9.2 Valor absoluto",
    "concept": "`Math.abs` devolve o valor sem sinal (positivo ou zero). Exemplo análogo (distância entre dois números):",
    "exampleCode": "function distancia(a, b) {\n  return Math.abs(a - b)\n}\n// distancia(2, 9) é 7",
    "vocabulary": [
      "Math.abs"
    ],
    "difficulty": "easy",
    "baseXp": 10,
    "description": "Escreva `absoluto(n)` que retorna o valor absoluto de n.",
    "starterCode": "function absoluto(n) {\n  // escreva seu código aqui\n}\n\n// Exemplos (clique em Executar para testar):\nconsole.log(absoluto(-7))  // deve dar 7\nconsole.log(absoluto(3))  // deve dar 3",
    "testCases": [
      {
        "input": [
          -7
        ],
        "expected": 7,
        "description": "-7 -> 7"
      },
      {
        "input": [
          3
        ],
        "expected": 3,
        "description": "3 -> 3"
      },
      {
        "input": [
          0
        ],
        "expected": 0,
        "description": "0 -> 0"
      }
    ]
  },
  {
    "kind": "challenge",
    "title": "9.3 Maior entre dois",
    "concept": "`Math.max(a, b)` devolve o maior; `Math.min(a, b)`, o menor. Exemplo análogo:",
    "exampleCode": "function menorEntre(a, b) {\n  return Math.min(a, b)\n}\n// Math.min(3, 9) é 3",
    "vocabulary": [
      "Math.max",
      "Math.min"
    ],
    "difficulty": "easy",
    "baseXp": 10,
    "description": "Escreva `maiorEntre(a, b)` usando Math.max.",
    "starterCode": "function maiorEntre(a, b) {\n  // escreva seu código aqui\n}\n\n// Exemplos (clique em Executar para testar):\nconsole.log(maiorEntre(3, 9))  // deve dar 9\nconsole.log(maiorEntre(-1, -5))  // deve dar -1",
    "testCases": [
      {
        "input": [
          3,
          9
        ],
        "expected": 9,
        "description": "max(3,9)=9"
      },
      {
        "input": [
          -1,
          -5
        ],
        "expected": -1,
        "description": "max(-1,-5)=-1"
      }
    ]
  },
  {
    "kind": "challenge",
    "title": "9.4 Duas casas decimais",
    "concept": "CUIDADO: `.toFixed(2)` devolve uma STRING (\"3.14\"). Envolva em `Number(...)` para virar número. Exemplo análogo (1 casa):",
    "exampleCode": "function umaCasa(n) {\n  return Number(n.toFixed(1))\n}\n// Number((3.14).toFixed(1)) é 3.1",
    "vocabulary": [
      ".toFixed()",
      "Number()"
    ],
    "difficulty": "medium",
    "baseXp": 20,
    "description": "Escreva `duasCasas(n)` que retorna n com no máximo 2 casas decimais, como NÚMERO.",
    "starterCode": "function duasCasas(n) {\n  // escreva seu código aqui\n}\n\n// Os testes deste desafio ficam ocultos (dificuldade maior).\n// Use a descrição e o exemplo acima como guia.",
    "testCases": [
      {
        "input": [
          3.14159
        ],
        "expected": 3.14,
        "description": "3.14159 -> 3.14"
      },
      {
        "input": [
          2
        ],
        "expected": 2,
        "description": "2 -> 2"
      },
      {
        "input": [
          0.1
        ],
        "expected": 0.1,
        "description": "0.1 -> 0.1"
      }
    ]
  },
  {
    "kind": "challenge",
    "title": "9.5 Soma dos dígitos",
    "concept": "Transforme em texto com `String(n)`, quebre em dígitos com `.split(\"\")` e some convertendo cada um com `Number`. Exemplo análogo (quantos dígitos):",
    "exampleCode": "function quantosDigitos(n) {\n  return String(n).split(\"\").length\n}\n// quantosDigitos(123) é 3",
    "vocabulary": [
      "String()",
      "Number()",
      ".split()"
    ],
    "difficulty": "medium",
    "baseXp": 20,
    "description": "Escreva `somaDigitos(n)` que soma os dígitos de n (n é positivo). Ex.: 123 -> 6.",
    "starterCode": "function somaDigitos(n) {\n  // escreva seu código aqui\n}\n\n// Os testes deste desafio ficam ocultos (dificuldade maior).\n// Use a descrição e o exemplo acima como guia.",
    "testCases": [
      {
        "input": [
          123
        ],
        "expected": 6,
        "description": "1+2+3=6"
      },
      {
        "input": [
          99
        ],
        "expected": 18,
        "description": "9+9=18"
      },
      {
        "input": [
          5
        ],
        "expected": 5,
        "description": "5=5"
      }
    ]
  },
  {
    "kind": "challenge",
    "title": "9.6 É primo?",
    "concept": "Primo é maior que 1 e só divisível por 1 e por ele mesmo. Teste divisores de 2 até a raiz (`i * i <= n`). Exemplo análogo (tem divisor por 2 a 4?):",
    "exampleCode": "function temDivisorPequeno(n) {\n  for (let i = 2; i <= 4; i++) {\n    if (n % i === 0) return true\n  }\n  return false\n}",
    "vocabulary": [
      "Math.sqrt",
      "for",
      "%"
    ],
    "difficulty": "hard",
    "baseXp": 35,
    "description": "Escreva `ehPrimo(n)` que retorna true se n for primo.",
    "starterCode": "function ehPrimo(n) {\n  // escreva seu código aqui\n}\n\n// Os testes deste desafio ficam ocultos (dificuldade maior).\n// Use a descrição e o exemplo acima como guia.",
    "testCases": [
      {
        "input": [
          2
        ],
        "expected": true,
        "description": "2 é primo"
      },
      {
        "input": [
          7
        ],
        "expected": true,
        "description": "7 é primo"
      },
      {
        "input": [
          9
        ],
        "expected": false,
        "description": "9 não é"
      },
      {
        "input": [
          1
        ],
        "expected": false,
        "description": "1 não é"
      },
      {
        "input": [
          13
        ],
        "expected": true,
        "description": "13 é"
      }
    ]
  },
  {
    "kind": "lesson",
    "title": "Lição 10 — Objetos",
    "concept": "Enquanto listas guardam valores em ordem, **objetos** guardam valores com **nomes** (propriedades): `{ nome: \"Ana\", idade: 12 }`.\n\nAcesse com ponto (`pessoa.nome`) ou colchetes quando a chave é dinâmica (`pessoa[chave]`). `Object.keys(obj)` devolve as chaves e `Object.values(obj)` os valores.\n\nComo nas listas, para atualizar sem mexer no original use o spread: `{ ...pessoa, idade: 13 }` cria uma cópia trocando só a idade. Objetos são ótimos para representar \"coisas\" do mundo real.",
    "exampleCode": "const p = { nome: \"Ana\", idade: 12 }\np.nome            // \"Ana\"\nObject.keys(p)    // [\"nome\",\"idade\"]",
    "vocabulary": [
      "objeto",
      "{}",
      ".propriedade",
      "[chave]",
      "Object.keys()",
      "Object.values()"
    ],
    "difficulty": "easy",
    "baseXp": 5,
    "description": "",
    "starterCode": "",
    "testCases": []
  },
  {
    "kind": "challenge",
    "title": "10.1 Criar pessoa",
    "concept": "Um objeto agrupa dados com nomes: `{ chave: valor }`. Exemplo análogo:",
    "exampleCode": "function criarPonto(x, y) {\n  return { x, y }\n}\n// criarPonto(1, 2) devolve { x: 1, y: 2 }",
    "vocabulary": [
      "objeto",
      "{}",
      "propriedade"
    ],
    "difficulty": "easy",
    "baseXp": 10,
    "description": "Escreva `criarPessoa(nome, idade)` que retorna um objeto { nome, idade }.",
    "starterCode": "function criarPessoa(nome, idade) {\n  // escreva seu código aqui\n}\n\n// Exemplos (clique em Executar para testar):\nconsole.log(criarPessoa(\"Ana\", 10))  // deve dar {\"nome\":\"Ana\",\"idade\":10}",
    "testCases": [
      {
        "input": [
          "Ana",
          10
        ],
        "expected": {
          "nome": "Ana",
          "idade": 10
        },
        "description": "objeto pessoa"
      }
    ]
  },
  {
    "kind": "challenge",
    "title": "10.2 Pegar nome",
    "concept": "Acesse propriedades com ponto: `objeto.chave`. Exemplo análogo:",
    "exampleCode": "function pegarIdade(pessoa) {\n  return pessoa.idade\n}\n// { idade: 9 }.idade é 9",
    "vocabulary": [
      ".propriedade"
    ],
    "difficulty": "easy",
    "baseXp": 10,
    "description": "Escreva `pegarNome(pessoa)` que retorna o valor da propriedade nome.",
    "starterCode": "function pegarNome(pessoa) {\n  // escreva seu código aqui\n}\n\n// Exemplos (clique em Executar para testar):\nconsole.log(pegarNome({\"nome\":\"Beto\",\"idade\":9}))  // deve dar \"Beto\"",
    "testCases": [
      {
        "input": [
          {
            "nome": "Beto",
            "idade": 9
          }
        ],
        "expected": "Beto",
        "description": "nome = \"Beto\""
      }
    ]
  },
  {
    "kind": "challenge",
    "title": "10.3 Tem a chave?",
    "concept": "O operador `in` diz se uma chave existe no objeto: `\"chave\" in obj`. Exemplo análogo:",
    "exampleCode": "function temEmail(pessoa) {\n  return \"email\" in pessoa\n}",
    "vocabulary": [
      "in"
    ],
    "difficulty": "medium",
    "baseXp": 20,
    "description": "Escreva `temChave(obj, chave)` que retorna true se a chave existe no objeto.",
    "starterCode": "function temChave(obj, chave) {\n  // escreva seu código aqui\n}\n\n// Os testes deste desafio ficam ocultos (dificuldade maior).\n// Use a descrição e o exemplo acima como guia.",
    "testCases": [
      {
        "input": [
          {
            "a": 1,
            "b": 2
          },
          "a"
        ],
        "expected": true,
        "description": "tem \"a\""
      },
      {
        "input": [
          {
            "a": 1
          },
          "z"
        ],
        "expected": false,
        "description": "não tem \"z\""
      }
    ]
  },
  {
    "kind": "challenge",
    "title": "10.4 Quantas chaves",
    "concept": "`Object.keys(obj)` devolve a lista das chaves; conte com `.length`. Exemplo:",
    "exampleCode": "function chaves(obj) {\n  return Object.keys(obj)\n}\n// { a:1, b:2 } -> [\"a\",\"b\"]",
    "vocabulary": [
      "Object.keys()"
    ],
    "difficulty": "medium",
    "baseXp": 20,
    "description": "Escreva `quantasChaves(obj)` que retorna o número de chaves do objeto.",
    "starterCode": "function quantasChaves(obj) {\n  // escreva seu código aqui\n}\n\n// Os testes deste desafio ficam ocultos (dificuldade maior).\n// Use a descrição e o exemplo acima como guia.",
    "testCases": [
      {
        "input": [
          {
            "a": 1,
            "b": 2,
            "c": 3
          }
        ],
        "expected": 3,
        "description": "3 chaves"
      },
      {
        "input": [
          {}
        ],
        "expected": 0,
        "description": "objeto vazio"
      }
    ]
  },
  {
    "kind": "challenge",
    "title": "10.5 Somar valores",
    "concept": "`Object.values(obj)` devolve a lista dos valores; some com `.reduce`. Exemplo:",
    "exampleCode": "function valores(obj) {\n  return Object.values(obj)\n}\n// { a:1, b:2 } -> [1,2]",
    "vocabulary": [
      "Object.values()",
      ".reduce()"
    ],
    "difficulty": "medium",
    "baseXp": 20,
    "description": "Escreva `somarValores(obj)` que soma todos os valores (números) do objeto.",
    "starterCode": "function somarValores(obj) {\n  // escreva seu código aqui\n}\n\n// Os testes deste desafio ficam ocultos (dificuldade maior).\n// Use a descrição e o exemplo acima como guia.",
    "testCases": [
      {
        "input": [
          {
            "a": 1,
            "b": 2,
            "c": 3
          }
        ],
        "expected": 6,
        "description": "soma = 6"
      },
      {
        "input": [
          {}
        ],
        "expected": 0,
        "description": "vazio = 0"
      }
    ]
  },
  {
    "kind": "challenge",
    "title": "10.6 Atualizar idade (sem mutar)",
    "concept": "O spread `{ ...obj, chave: novo }` copia o objeto trocando uma propriedade, sem alterar o original. Exemplo análogo:",
    "exampleCode": "function comNovoNome(pessoa, nome) {\n  return { ...pessoa, nome }\n}",
    "vocabulary": [
      "spread",
      "...",
      "imutável"
    ],
    "difficulty": "medium",
    "baseXp": 20,
    "description": "Escreva `comNovaIdade(pessoa, idade)` que retorna uma cópia da pessoa com a idade trocada.",
    "starterCode": "function comNovaIdade(pessoa, idade) {\n  // escreva seu código aqui\n}\n\n// Os testes deste desafio ficam ocultos (dificuldade maior).\n// Use a descrição e o exemplo acima como guia.",
    "testCases": [
      {
        "input": [
          {
            "nome": "Ana",
            "idade": 10
          },
          11
        ],
        "expected": {
          "nome": "Ana",
          "idade": 11
        },
        "description": "idade vira 11"
      }
    ]
  },
  {
    "kind": "challenge",
    "title": "10.7 Inverter chave e valor",
    "concept": "Para chave dinâmica use colchetes: `novo[valor] = chave`. Percorra com `Object.keys`. Exemplo do colchete:",
    "exampleCode": "const cores = {}\ncores[\"céu\"] = \"azul\"\n// cores é { céu: \"azul\" }",
    "vocabulary": [
      "Object.keys()",
      "[chave]"
    ],
    "difficulty": "hard",
    "baseXp": 35,
    "description": "Escreva `inverterObj(obj)` que troca chaves por valores. Ex.: {a:1, b:2} -> {1:\"a\", 2:\"b\"}.",
    "starterCode": "function inverterObj(obj) {\n  // escreva seu código aqui\n}\n\n// Os testes deste desafio ficam ocultos (dificuldade maior).\n// Use a descrição e o exemplo acima como guia.",
    "testCases": [
      {
        "input": [
          {
            "a": 1,
            "b": 2
          }
        ],
        "expected": {
          "1": "a",
          "2": "b"
        },
        "description": "inverte"
      },
      {
        "input": [
          {
            "x": "sim"
          }
        ],
        "expected": {
          "sim": "x"
        },
        "description": "um par"
      }
    ]
  },
  {
    "kind": "lesson",
    "title": "Lição 11 — Recursão",
    "concept": "**Recursão** é quando uma função chama a si mesma para resolver o problema em pedaços menores.\n\nToda recursão precisa de duas partes: o **caso base** (uma situação simples que para a repetição) e o **passo recursivo** (que chama a função com um problema menor, aproximando-se do caso base).\n\nPense: \"como resolvo o caso mais simples?\" e \"como reduzo o problema?\". Cuidado: sem caso base a recursão nunca para e estoura. Muitos problemas de lista e matemática ficam elegantes com recursão.",
    "exampleCode": "function contagem(n) {\n  if (n <= 0) return []    // caso base\n  return [n, ...contagem(n - 1)]\n}\n// contagem(3) -> [3,2,1]",
    "vocabulary": [
      "recursão",
      "caso base",
      "passo recursivo"
    ],
    "difficulty": "easy",
    "baseXp": 5,
    "description": "",
    "starterCode": "",
    "testCases": []
  },
  {
    "kind": "challenge",
    "title": "11.1 Contagem regressiva",
    "concept": "Função recursiva chama a si mesma e precisa de um CASO BASE que para. Exemplo análogo (lista crescente 1..n):",
    "exampleCode": "function ate(n) {\n  if (n <= 0) return []\n  return [...ate(n - 1), n]\n}\n// ate(3) devolve [1,2,3]",
    "vocabulary": [
      "recursão",
      "caso base"
    ],
    "difficulty": "medium",
    "baseXp": 20,
    "description": "Escreva `regressiva(n)` que retorna a lista [n, n-1, ..., 1]. Para n <= 0, retorne [].",
    "starterCode": "function regressiva(n) {\n  // escreva seu código aqui\n}\n\n// Os testes deste desafio ficam ocultos (dificuldade maior).\n// Use a descrição e o exemplo acima como guia.",
    "testCases": [
      {
        "input": [
          3
        ],
        "expected": [
          3,
          2,
          1
        ],
        "description": "3 -> [3,2,1]"
      },
      {
        "input": [
          1
        ],
        "expected": [
          1
        ],
        "description": "1 -> [1]"
      },
      {
        "input": [
          0
        ],
        "expected": [],
        "description": "0 -> []"
      }
    ]
  },
  {
    "kind": "challenge",
    "title": "11.2 Fatorial recursivo",
    "concept": "fatorial(n) = n × fatorial(n-1); caso base fatorial(1) = 1. Exemplo análogo (soma recursiva):",
    "exampleCode": "function somaAte(n) {\n  if (n <= 0) return 0\n  return n + somaAte(n - 1)\n}",
    "vocabulary": [
      "recursão",
      "caso base"
    ],
    "difficulty": "medium",
    "baseXp": 20,
    "description": "Escreva `fatorialRec(n)` usando recursão.",
    "starterCode": "function fatorialRec(n) {\n  // escreva seu código aqui\n}\n\n// Os testes deste desafio ficam ocultos (dificuldade maior).\n// Use a descrição e o exemplo acima como guia.",
    "testCases": [
      {
        "input": [
          5
        ],
        "expected": 120,
        "description": "5! = 120"
      },
      {
        "input": [
          0
        ],
        "expected": 1,
        "description": "0! = 1"
      }
    ]
  },
  {
    "kind": "challenge",
    "title": "11.3 Soma até N recursiva",
    "concept": "somaAte(n) = n + somaAte(n-1), caso base somaAte(0) = 0. Exemplo análogo (conta itens):",
    "exampleCode": "function contar(lista) {\n  if (lista.length === 0) return 0\n  return 1 + contar(lista.slice(1))\n}",
    "vocabulary": [
      "recursão"
    ],
    "difficulty": "medium",
    "baseXp": 20,
    "description": "Escreva `somaAteRec(n)` (recursiva) que soma 1 + 2 + ... + n.",
    "starterCode": "function somaAteRec(n) {\n  // escreva seu código aqui\n}\n\n// Os testes deste desafio ficam ocultos (dificuldade maior).\n// Use a descrição e o exemplo acima como guia.",
    "testCases": [
      {
        "input": [
          5
        ],
        "expected": 15,
        "description": "1..5 = 15"
      },
      {
        "input": [
          0
        ],
        "expected": 0,
        "description": "0 = 0"
      }
    ]
  },
  {
    "kind": "challenge",
    "title": "11.4 Potência recursiva",
    "concept": "base^exp = base × base^(exp-1); caso base base^0 = 1. Exemplo análogo (dobra n vezes):",
    "exampleCode": "function dobrarNvezes(x, vezes) {\n  if (vezes === 0) return x\n  return dobrarNvezes(x * 2, vezes - 1)\n}",
    "vocabulary": [
      "recursão"
    ],
    "difficulty": "medium",
    "baseXp": 20,
    "description": "Escreva `potenciaRec(base, exp)` (recursiva). base^0 = 1.",
    "starterCode": "function potenciaRec(base, exp) {\n  // escreva seu código aqui\n}\n\n// Os testes deste desafio ficam ocultos (dificuldade maior).\n// Use a descrição e o exemplo acima como guia.",
    "testCases": [
      {
        "input": [
          2,
          3
        ],
        "expected": 8,
        "description": "2^3 = 8"
      },
      {
        "input": [
          5,
          0
        ],
        "expected": 1,
        "description": "5^0 = 1"
      }
    ]
  },
  {
    "kind": "challenge",
    "title": "11.5 Somar lista recursivamente",
    "concept": "A soma é o primeiro item mais a soma do resto (`.slice(1)`). Caso base: lista vazia soma 0. Exemplo análogo (tamanho recursivo):",
    "exampleCode": "function tamanho(lista) {\n  if (lista.length === 0) return 0\n  return 1 + tamanho(lista.slice(1))\n}",
    "vocabulary": [
      "recursão",
      ".slice()"
    ],
    "difficulty": "hard",
    "baseXp": 35,
    "description": "Escreva `somarLista(lista)` usando recursão. Lista vazia soma 0.",
    "starterCode": "function somarLista(lista) {\n  // escreva seu código aqui\n}\n\n// Os testes deste desafio ficam ocultos (dificuldade maior).\n// Use a descrição e o exemplo acima como guia.",
    "testCases": [
      {
        "input": [
          [
            1,
            2,
            3,
            4
          ]
        ],
        "expected": 10,
        "description": "soma = 10"
      },
      {
        "input": [
          []
        ],
        "expected": 0,
        "description": "vazia = 0"
      }
    ]
  },
  {
    "kind": "challenge",
    "title": "11.6 Fibonacci",
    "concept": "Cada termo é a soma dos dois anteriores; os DOIS primeiros valem 1 (dois casos base). Exemplo da estrutura:",
    "exampleCode": "function fib(n) {\n  if (n <= 2) return 1\n  return fib(n - 1) + fib(n - 2)\n}\n// 1,1,2,3,5,8...",
    "vocabulary": [
      "recursão",
      "dois casos base"
    ],
    "difficulty": "hard",
    "baseXp": 35,
    "description": "Escreva `fibonacci(n)` que retorna o n-ésimo termo (1,1,2,3,5,8,...).",
    "starterCode": "function fibonacci(n) {\n  // escreva seu código aqui\n}\n\n// Os testes deste desafio ficam ocultos (dificuldade maior).\n// Use a descrição e o exemplo acima como guia.",
    "testCases": [
      {
        "input": [
          1
        ],
        "expected": 1,
        "description": "1º = 1"
      },
      {
        "input": [
          7
        ],
        "expected": 13,
        "description": "7º = 13"
      },
      {
        "input": [
          10
        ],
        "expected": 55,
        "description": "10º = 55"
      }
    ]
  },
  {
    "kind": "lesson",
    "title": "Lição 12 — Algoritmos",
    "concept": "Chegou a hora de **juntar tudo**.\n\nUm algoritmo é uma sequência de passos para resolver um problema. Aqui você combina variáveis, condicionais, laços, listas, objetos e funções para resolver desafios clássicos: contar frequências, agrupar, validar com **expressões regulares** (padrões de texto), transformar dados e mais.\n\nDica principal: **decomponha** o problema em partes menores, pense nos **casos de borda** (lista vazia, empates) e escolha a estrutura certa. Não precisa acertar de primeira — teste, ajuste e peça uma dica ao Codi quando travar.",
    "exampleCode": "function frequencia(lista) {\n  const c = {}\n  for (const x of lista) c[x] = (c[x] || 0) + 1\n  return c\n}",
    "vocabulary": [
      "algoritmo",
      "objeto contador",
      "regex",
      "casos de borda"
    ],
    "difficulty": "easy",
    "baseXp": 5,
    "description": "",
    "starterCode": "",
    "testCases": []
  },
  {
    "kind": "challenge",
    "title": "12.1 FizzBuzz",
    "concept": "Monte uma lista de 1 a n. Teste o múltiplo de 15 ANTES de 3 e 5. Exemplo análogo (par/ímpar):",
    "exampleCode": "function parImpar(n) {\n  const r = []\n  for (let i = 1; i <= n; i++) {\n    r.push(i % 2 === 0 ? \"par\" : \"ímpar\")\n  }\n  return r\n}",
    "vocabulary": [
      "for",
      ".push()",
      "%"
    ],
    "difficulty": "medium",
    "baseXp": 20,
    "description": "Escreva `fizzBuzz(n)`: lista de 1 a n, trocando múltiplos de 3 por \"Fizz\", de 5 por \"Buzz\", de ambos por \"FizzBuzz\".",
    "starterCode": "function fizzBuzz(n) {\n  // escreva seu código aqui\n}\n\n// Os testes deste desafio ficam ocultos (dificuldade maior).\n// Use a descrição e o exemplo acima como guia.",
    "testCases": [
      {
        "input": [
          5
        ],
        "expected": [
          1,
          2,
          "Fizz",
          4,
          "Buzz"
        ],
        "description": "até 5"
      },
      {
        "input": [
          15
        ],
        "expected": [
          1,
          2,
          "Fizz",
          4,
          "Buzz",
          "Fizz",
          7,
          8,
          "Fizz",
          "Buzz",
          11,
          "Fizz",
          13,
          14,
          "FizzBuzz"
        ],
        "description": "até 15"
      }
    ]
  },
  {
    "kind": "challenge",
    "title": "12.2 Frequência",
    "concept": "Use um objeto como contador: `c[x] = (c[x] || 0) + 1`. Exemplo da contagem:",
    "exampleCode": "function contar(lista) {\n  const c = {}\n  for (const x of lista) c[x] = (c[x] || 0) + 1\n  return c\n}\n// [\"a\",\"a\"] -> { a: 2 }",
    "vocabulary": [
      "objeto",
      "contador",
      "[chave]"
    ],
    "difficulty": "hard",
    "baseXp": 35,
    "description": "Escreva `frequencia(lista)` que retorna um objeto { item: quantasVezes }.",
    "starterCode": "function frequencia(lista) {\n  // escreva seu código aqui\n}\n\n// Os testes deste desafio ficam ocultos (dificuldade maior).\n// Use a descrição e o exemplo acima como guia.",
    "testCases": [
      {
        "input": [
          [
            "a",
            "b",
            "a"
          ]
        ],
        "expected": {
          "a": 2,
          "b": 1
        },
        "description": "2 a, 1 b"
      },
      {
        "input": [
          [
            "x",
            "x",
            "x"
          ]
        ],
        "expected": {
          "x": 3
        },
        "description": "3 x"
      }
    ]
  },
  {
    "kind": "challenge",
    "title": "12.3 Maior de cada sublista",
    "concept": "Combine `.map` com `Math.max(...sub)` (o spread espalha a sublista como argumentos). Exemplo análogo (soma de cada sublista):",
    "exampleCode": "function somasDeCada(matriz) {\n  return matriz.map(sub => sub.reduce((a, x) => a + x, 0))\n}",
    "vocabulary": [
      ".map()",
      "Math.max",
      "spread"
    ],
    "difficulty": "hard",
    "baseXp": 35,
    "description": "Escreva `maioresDeCada(matriz)` que retorna o maior de cada sublista.",
    "starterCode": "function maioresDeCada(matriz) {\n  // escreva seu código aqui\n}\n\n// Os testes deste desafio ficam ocultos (dificuldade maior).\n// Use a descrição e o exemplo acima como guia.",
    "testCases": [
      {
        "input": [
          [
            [
              1,
              2
            ],
            [
              3,
              9
            ],
            [
              5,
              4
            ]
          ]
        ],
        "expected": [
          2,
          9,
          5
        ],
        "description": "maior de cada"
      }
    ]
  },
  {
    "kind": "challenge",
    "title": "12.4 Agrupar por paridade",
    "concept": "Crie um objeto com duas listas e empurre cada número para a certa com `.push`. Exemplo análogo (positivos/negativos):",
    "exampleCode": "function porSinal(lista) {\n  const g = { pos: [], neg: [] }\n  for (const x of lista) (x >= 0 ? g.pos : g.neg).push(x)\n  return g\n}",
    "vocabulary": [
      "objeto",
      ".push()",
      "%"
    ],
    "difficulty": "hard",
    "baseXp": 35,
    "description": "Escreva `porParidade(lista)` que retorna { pares: [...], impares: [...] }.",
    "starterCode": "function porParidade(lista) {\n  // escreva seu código aqui\n}\n\n// Os testes deste desafio ficam ocultos (dificuldade maior).\n// Use a descrição e o exemplo acima como guia.",
    "testCases": [
      {
        "input": [
          [
            1,
            2,
            3,
            4
          ]
        ],
        "expected": {
          "pares": [
            2,
            4
          ],
          "impares": [
            1,
            3
          ]
        },
        "description": "separa"
      }
    ]
  },
  {
    "kind": "challenge",
    "title": "12.5 Validar telefone",
    "concept": "Uma expressão regular descreve um padrão; `.test()` diz se casa. `\\\\d` é um dígito, `{11}` repete 11 vezes, `^...$` exige o texto inteiro. Exemplo análogo (3 dígitos):",
    "exampleCode": "function tem3Digitos(texto) {\n  return /^\\d{3}$/.test(texto)\n}\n// \"123\" é true, \"12a\" é false",
    "vocabulary": [
      "regex",
      ".test()"
    ],
    "difficulty": "hard",
    "baseXp": 35,
    "description": "Escreva `telefoneValido(texto)` que retorna true se for exatamente 11 dígitos (só números).",
    "starterCode": "function telefoneValido(texto) {\n  // escreva seu código aqui\n}\n\n// Os testes deste desafio ficam ocultos (dificuldade maior).\n// Use a descrição e o exemplo acima como guia.",
    "testCases": [
      {
        "input": [
          "81999998888"
        ],
        "expected": true,
        "description": "11 dígitos = válido"
      },
      {
        "input": [
          "123"
        ],
        "expected": false,
        "description": "curto demais"
      },
      {
        "input": [
          "8199999888a"
        ],
        "expected": false,
        "description": "tem letra"
      }
    ]
  },
  {
    "kind": "challenge",
    "title": "12.6 Cifra de César",
    "concept": "`c.charCodeAt(0)` dá o código da letra; `String.fromCharCode(n)` faz o caminho inverso. Use `% 26` para voltar ao \"a\" depois do \"z\". Exemplo do código:",
    "exampleCode": "function proximaLetra(c) {\n  return String.fromCharCode(c.charCodeAt(0) + 1)\n}\n// proximaLetra(\"a\") é \"b\"",
    "vocabulary": [
      ".charCodeAt()",
      "String.fromCharCode",
      "%"
    ],
    "difficulty": "hard",
    "baseXp": 35,
    "description": "Escreva `cesar(texto, n)` que desloca cada letra minúscula (a-z) em n posições, voltando ao \"a\" depois do \"z\".",
    "starterCode": "function cesar(texto, n) {\n  // escreva seu código aqui\n}\n\n// Os testes deste desafio ficam ocultos (dificuldade maior).\n// Use a descrição e o exemplo acima como guia.",
    "testCases": [
      {
        "input": [
          "abc",
          1
        ],
        "expected": "bcd",
        "description": "abc + 1 = bcd"
      },
      {
        "input": [
          "xyz",
          1
        ],
        "expected": "yza",
        "description": "volta no z"
      },
      {
        "input": [
          "codi",
          0
        ],
        "expected": "codi",
        "description": "sem deslocamento"
      }
    ]
  },
  {
    "kind": "challenge",
    "title": "12.7 Moda",
    "concept": "Conte as frequências num objeto e guarde o item com a maior contagem. Exemplo do contador (base da moda):",
    "exampleCode": "function contagem(lista) {\n  const c = {}\n  for (const x of lista) c[x] = (c[x] || 0) + 1\n  return c\n}",
    "vocabulary": [
      "objeto",
      "contador"
    ],
    "difficulty": "hard",
    "baseXp": 35,
    "description": "Escreva `moda(lista)` que retorna o número que mais aparece (sem empates nos testes).",
    "starterCode": "function moda(lista) {\n  // escreva seu código aqui\n}\n\n// Os testes deste desafio ficam ocultos (dificuldade maior).\n// Use a descrição e o exemplo acima como guia.",
    "testCases": [
      {
        "input": [
          [
            1,
            2,
            2,
            3
          ]
        ],
        "expected": 2,
        "description": "2 é a moda"
      },
      {
        "input": [
          [
            5,
            5,
            5,
            1
          ]
        ],
        "expected": 5,
        "description": "5 é a moda"
      }
    ]
  },
  {
    "kind": "challenge",
    "title": "12.8 Mediana",
    "concept": "Ordene; se a quantidade for ímpar, a mediana é o do meio; se for par, é a média dos dois do meio. Exemplo (pega o do meio, ímpar):",
    "exampleCode": "function doMeio(lista) {\n  const o = [...lista].sort((a, b) => a - b)\n  return o[Math.floor(o.length / 2)]\n}",
    "vocabulary": [
      ".sort()",
      "mediana"
    ],
    "difficulty": "hard",
    "baseXp": 35,
    "description": "Escreva `mediana(lista)` (a lista não é vazia).",
    "starterCode": "function mediana(lista) {\n  // escreva seu código aqui\n}\n\n// Os testes deste desafio ficam ocultos (dificuldade maior).\n// Use a descrição e o exemplo acima como guia.",
    "testCases": [
      {
        "input": [
          [
            3,
            1,
            2
          ]
        ],
        "expected": 2,
        "description": "ímpar -> do meio"
      },
      {
        "input": [
          [
            4,
            1,
            2,
            3
          ]
        ],
        "expected": 2.5,
        "description": "par -> média do meio"
      }
    ]
  },
  {
    "kind": "challenge",
    "title": "12.9 São anagramas?",
    "concept": "Dois textos são anagramas se têm as mesmas letras. Ordene as letras de cada um e compare. Exemplo da \"assinatura\":",
    "exampleCode": "function ordenarLetras(s) {\n  return s.split(\"\").sort().join(\"\")\n}\n// \"roma\" e \"amor\" viram \"amor\"",
    "vocabulary": [
      ".split()",
      ".sort()",
      ".join()"
    ],
    "difficulty": "hard",
    "baseXp": 35,
    "description": "Escreva `ehAnagrama(a, b)` que retorna true se a e b forem anagramas (mesmas letras).",
    "starterCode": "function ehAnagrama(a, b) {\n  // escreva seu código aqui\n}\n\n// Os testes deste desafio ficam ocultos (dificuldade maior).\n// Use a descrição e o exemplo acima como guia.",
    "testCases": [
      {
        "input": [
          "amor",
          "roma"
        ],
        "expected": true,
        "description": "amor/roma"
      },
      {
        "input": [
          "abc",
          "abd"
        ],
        "expected": false,
        "description": "letras diferentes"
      }
    ]
  },
  {
    "kind": "challenge",
    "title": "12.10 Inteiro para romano",
    "concept": "Tenha tabelas de valores e símbolos (do maior ao menor). Enquanto o número couber, subtraia o valor e acumule o símbolo. Exemplo do `while`:",
    "exampleCode": "function quantosCabem(n, valor) {\n  let q = 0\n  while (n >= valor) { n -= valor; q++ }\n  return q\n}",
    "vocabulary": [
      "for",
      "while",
      "array"
    ],
    "difficulty": "hard",
    "baseXp": 35,
    "description": "Escreva `paraRomano(n)` que converte um inteiro (1 a 3999) em algarismo romano.",
    "starterCode": "function paraRomano(n) {\n  // escreva seu código aqui\n}\n\n// Os testes deste desafio ficam ocultos (dificuldade maior).\n// Use a descrição e o exemplo acima como guia.",
    "testCases": [
      {
        "input": [
          4
        ],
        "expected": "IV",
        "description": "4 = IV"
      },
      {
        "input": [
          9
        ],
        "expected": "IX",
        "description": "9 = IX"
      },
      {
        "input": [
          58
        ],
        "expected": "LVIII",
        "description": "58 = LVIII"
      },
      {
        "input": [
          2024
        ],
        "expected": "MMXXIV",
        "description": "2024 = MMXXIV"
      }
    ]
  },
  {
    "kind": "lesson",
    "title": "Lição — Mostrando coisas na tela (console.log)",
    "concept": "Até agora suas funções **devolviam** um valor com `return`. Mas muitas vezes queremos **mostrar** algo na tela enquanto o programa roda — e para isso usamos `console.log(...)`.\n\nCada `console.log` imprime uma **linha**. Dá para imprimir texto, números e juntar tudo: `console.log(\"Total: \" + 10)`.\n\nNos próximos desafios, em vez de comparar o que a função devolve, o Codinhos vai comparar **exatamente o que você imprime** — a mesma ordem de linhas e o mesmo texto. Capriche!",
    "exampleCode": "console.log(\"Oi!\")\nconsole.log(\"Tudo bem?\")\n// imprime duas linhas",
    "vocabulary": [
      "console.log"
    ],
    "difficulty": "easy",
    "baseXp": 5,
    "description": "",
    "starterCode": "",
    "testCases": []
  },
  {
    "kind": "challenge",
    "title": "C.1 Olá, mundo!",
    "concept": "`console.log(texto)` mostra uma linha na tela. O texto vai entre aspas.",
    "exampleCode": "console.log(\"Bom dia!\")",
    "vocabulary": [
      "console.log"
    ],
    "difficulty": "easy",
    "baseXp": 10,
    "description": "Imprima exatamente a mensagem: **Olá, mundo!**",
    "starterCode": "// Use console.log para imprimir a mensagem\n",
    "testCases": [
      {
        "input": null,
        "expected": "Olá, mundo!",
        "description": "imprime a saudação",
        "mode": "stdout"
      }
    ]
  },
  {
    "kind": "challenge",
    "title": "C.2 Conte de 1 a 5",
    "concept": "Um `for` repete um bloco. A cada volta, imprima o número com `console.log(i)`.",
    "exampleCode": "for (let i = 1; i <= 3; i++) {\n  console.log(i)\n}",
    "vocabulary": [
      "console.log",
      "for"
    ],
    "difficulty": "easy",
    "baseXp": 10,
    "description": "Imprima os números de **1 a 5**, um por linha.",
    "starterCode": "for (let i = 1; i <= 5; i++) {\n  // imprima i\n}\n",
    "testCases": [
      {
        "input": null,
        "expected": "1\n2\n3\n4\n5",
        "description": "imprime de 1 a 5",
        "mode": "stdout"
      }
    ]
  },
  {
    "kind": "challenge",
    "title": "C.3 Tabuada",
    "concept": "Escreva a função `tabuada(n)` que **imprime** a tabuada de `n` do 1 ao 10, uma linha por multiplicação, no formato `n x i = resultado`.",
    "exampleCode": "function tabuada(n) {\n  for (let i = 1; i <= 10; i++) {\n    console.log(n + \" x \" + i + \" = \" + (n * i))\n  }\n}",
    "vocabulary": [
      "console.log",
      "for",
      "function"
    ],
    "difficulty": "medium",
    "baseXp": 15,
    "description": "Escreva a função **tabuada(n)** que imprime a tabuada de n do 1 ao 10 (ex.: `3 x 1 = 3`).",
    "starterCode": "function tabuada(n) {\n  // imprima cada linha da tabuada de n\n}\n",
    "targetFn": "tabuada",
    "testCases": [
      {
        "input": [
          3
        ],
        "expected": "3 x 1 = 3\n3 x 2 = 6\n3 x 3 = 9\n3 x 4 = 12\n3 x 5 = 15\n3 x 6 = 18\n3 x 7 = 21\n3 x 8 = 24\n3 x 9 = 27\n3 x 10 = 30",
        "description": "tabuada do 3",
        "mode": "stdout"
      },
      {
        "input": [
          7
        ],
        "expected": "7 x 1 = 7\n7 x 2 = 14\n7 x 3 = 21\n7 x 4 = 28\n7 x 5 = 35\n7 x 6 = 42\n7 x 7 = 49\n7 x 8 = 56\n7 x 9 = 63\n7 x 10 = 70",
        "description": "tabuada do 7",
        "mode": "stdout"
      }
    ]
  },
  {
    "kind": "challenge",
    "title": "C.4 FizzBuzz",
    "concept": "Imprima de 1 a 15. Múltiplo de 3 → `Fizz`; de 5 → `Buzz`; de 3 e 5 → `FizzBuzz`; senão o próprio número. Use `%` (resto da divisão) e cheque o múltiplo de 15 primeiro.",
    "exampleCode": "if (6 % 3 === 0) console.log(\"Fizz\")",
    "vocabulary": [
      "console.log",
      "for",
      "%",
      "if"
    ],
    "difficulty": "medium",
    "baseXp": 15,
    "description": "Imprima de 1 a 15 aplicando as regras do **FizzBuzz**.",
    "starterCode": "for (let i = 1; i <= 15; i++) {\n  // aplique as regras e imprima\n}\n",
    "testCases": [
      {
        "input": null,
        "expected": "1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz",
        "description": "FizzBuzz de 1 a 15",
        "mode": "stdout"
      }
    ]
  }
]

async function seedTrilha() {
  console.log('🌱  Semeando/atualizando trilha:', TRAIL_TITLE)

  let [trail] = await db
    .select({ id: trails.id })
    .from(trails)
    .where(eq(trails.slug, TRAIL_SLUG))
    .limit(1)

  if (!trail) {
    ;[trail] = await db
      .insert(trails)
      .values({ slug: TRAIL_SLUG, title: TRAIL_TITLE, description: TRAIL_DESC, language: 'javascript', order: 10 })
      .returning({ id: trails.id })
    console.log('  ✅  Trilha criada:', trail!.id)
  } else {
    console.log('  ⏩  Trilha já existe:', trail.id)
  }

  let licoes = 0
  let desafios = 0
  for (let i = 0; i < trilhaModules.length; i++) {
    const m = trilhaModules[i]!
    const order = i + 1

    let [mod] = await db
      .select({ id: trailModules.id })
      .from(trailModules)
      .where(and(eq(trailModules.trailId, trail!.id), eq(trailModules.order, order)))
      .limit(1)

    if (!mod) {
      ;[mod] = await db
        .insert(trailModules)
        .values({ trailId: trail!.id, title: m.title, concept: m.concept, exampleCode: m.exampleCode, vocabulary: m.vocabulary, order })
        .returning({ id: trailModules.id })
    } else {
      await db
        .update(trailModules)
        .set({ title: m.title, concept: m.concept, exampleCode: m.exampleCode, vocabulary: m.vocabulary })
        .where(eq(trailModules.id, mod.id))
    }

    if (m.kind === 'lesson') {
      // Lição = módulo sem desafio. Remove qualquer desafio que exista neste módulo.
      await db.delete(challenges).where(eq(challenges.moduleId, mod!.id))
      licoes++
      continue
    }

    const [ch] = await db
      .select({ id: challenges.id })
      .from(challenges)
      .where(eq(challenges.moduleId, mod!.id))
      .limit(1)

    if (!ch) {
      await db.insert(challenges).values({
        moduleId: mod!.id,
        title: m.title,
        description: m.description,
        starterCode: m.starterCode,
        testCases: m.testCases,
        difficulty: m.difficulty,
        baseXp: m.baseXp,
        targetFn: m.targetFn ?? null,
        order: 1,
      })
    } else {
      await db
        .update(challenges)
        .set({ title: m.title, description: m.description, starterCode: m.starterCode, testCases: m.testCases, difficulty: m.difficulty, baseXp: m.baseXp, targetFn: m.targetFn ?? null })
        .where(eq(challenges.id, ch.id))
    }
    desafios++
  }

  console.log(`  ✅  ${trilhaModules.length} módulos (${licoes} lições, ${desafios} desafios)`)
  console.log('🎉  Seed da trilha concluído.')
}

seedTrilha()
  .catch((err) => {
    console.error('❌  Erro no seed da trilha:', err)
    process.exit(1)
  })
  .finally(() => client.end())
