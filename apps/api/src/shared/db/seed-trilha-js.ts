/**
 * Seed da trilha "JavaScript: do Fundamento ao Algoritmo" no CATÁLOGO GLOBAL
 * (tenant_id = NULL). 84 módulos (1 desafio cada), do básico ao avançado.
 *
 * Execução: pnpm --filter @codinhos/api db:seed:trilha
 *
 * Idempotente: pode rodar várias vezes. Casos de teste verificados contra o
 * runner real (apps/api/src/shared/utils/run-tests.ts) antes de commitar.
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
  'Trilha completa de fundamentos de JavaScript, do básico ao avançado: variáveis, operadores, decisões, funções, strings, números, loops, arrays, objetos, recursão e algoritmos.'

type Modulo = {
  title: string
  concept: string
  exampleCode: string
  vocabulary: string[]
  difficulty: 'easy' | 'medium' | 'hard'
  baseXp: number
  description: string
  starterCode: string
  testCases: { input: unknown; expected: unknown; description: string }[]
}

const trilhaModules: Modulo[] = [
  {
    "title": "1.1 Declare seu nome",
    "concept": "Uma **variável** guarda um valor. Use `let` para um valor que pode mudar e `const` para um que não muda. Todo valor tem um **tipo**: texto é `string`.",
    "exampleCode": "let cidade = \"Recife\"\nconst pais = \"Brasil\"",
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
    "title": "1.2 Idade e status",
    "concept": "Números (`number`) não levam aspas. Verdadeiro/falso é o tipo `boolean` (`true` ou `false`).",
    "exampleCode": "let pontos = 10\nlet venceu = false",
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
    "title": "1.3 Apresente-se",
    "concept": "Uma **função** é um bloco de código com nome. O `return` devolve um valor para quem chamou a função.",
    "exampleCode": "function corFavorita() {\n  return \"azul\"\n}",
    "vocabulary": [
      "function",
      "return"
    ],
    "difficulty": "easy",
    "baseXp": 10,
    "description": "Escreva a função `apresentar()` que retorna exatamente o texto \"Olá, eu sou o Codi\".",
    "starterCode": "function apresentar() {\n  // use return para devolver o texto\n}",
    "testCases": [
      {
        "input": [],
        "expected": "Olá, eu sou o Codi",
        "description": "retorna a apresentação"
      }
    ]
  },
  {
    "title": "1.4 O dobro",
    "concept": "Uma função pode receber **parâmetros** (entradas) e usá-los no cálculo do `return`.",
    "exampleCode": "function triplo(n) {\n  return n * 3\n}",
    "vocabulary": [
      "parâmetro",
      "argumento"
    ],
    "difficulty": "easy",
    "baseXp": 10,
    "description": "Escreva `dobro(n)` que retorna o dobro de n.",
    "starterCode": "function dobro(n) {\n  // retorne n vezes 2\n}",
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
    "title": "2.1 Soma",
    "concept": "Operadores aritméticos: `+ - * /` e `%` (resto da divisão).",
    "exampleCode": "function resto(a, b) {\n  return a % b\n}",
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
    "starterCode": "function soma(a, b) {\n  // retorne a + b\n}",
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
    "title": "2.2 É par?",
    "concept": "Um número é par quando o resto da divisão por 2 é zero. Comparações devolvem um booleano.",
    "exampleCode": "function ehZero(n) {\n  return n === 0\n}",
    "vocabulary": [
      "===",
      "resto"
    ],
    "difficulty": "easy",
    "baseXp": 10,
    "description": "Escreva `ehPar(n)` que retorna true se n for par, senão false.",
    "starterCode": "function ehPar(n) {\n  // dica: use o operador %\n}",
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
    "title": "2.3 Média de três",
    "concept": "Cuidado com a ordem das operações: a divisão acontece antes da soma se não houver parênteses. Some primeiro, depois divida.",
    "exampleCode": "function somaDois(a, b) {\n  return a + b\n}",
    "vocabulary": [
      "parênteses",
      "precedência"
    ],
    "difficulty": "easy",
    "baseXp": 10,
    "description": "Escreva `mediaTres(a, b, c)` que retorna a média dos três números.",
    "starterCode": "function mediaTres(a, b, c) {\n  // use parênteses!\n}",
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
    "title": "2.4 Maior de idade",
    "concept": "Operadores de comparação: `> < >= <=`. Devolvem true ou false.",
    "exampleCode": "function ehPositivo(n) {\n  return n > 0\n}",
    "vocabulary": [
      ">=",
      "<=",
      ">",
      "<"
    ],
    "difficulty": "easy",
    "baseXp": 10,
    "description": "Escreva `maiorDeIdade(idade)` que retorna true se idade for 18 ou mais.",
    "starterCode": "function maiorDeIdade(idade) {\n}",
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
    "title": "2.5 São idênticos?",
    "concept": "Use sempre `===` (compara valor **e** tipo). O `==` faz conversões traiçoeiras: `1 == \"1\"` é true, mas `1 === \"1\"` é false.",
    "exampleCode": "function ehTexto(x) {\n  return typeof x === \"string\"\n}",
    "vocabulary": [
      "===",
      "!==",
      "typeof"
    ],
    "difficulty": "easy",
    "baseXp": 10,
    "description": "Escreva `saoIdenticos(a, b)` que retorna true só se a e b forem idênticos (mesmo valor e mesmo tipo).",
    "starterCode": "function saoIdenticos(a, b) {\n  // use ===\n}",
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
    "title": "2.6 Está na faixa?",
    "concept": "O operador `&&` (E) só é verdadeiro quando os dois lados são verdadeiros.",
    "exampleCode": "function entreUmEDez(n) {\n  return n >= 1 && n <= 10\n}",
    "vocabulary": [
      "&&",
      "||",
      "!"
    ],
    "difficulty": "medium",
    "baseXp": 20,
    "description": "Escreva `naFaixa(n, min, max)` que retorna true se n estiver entre min e max (incluindo as pontas).",
    "starterCode": "function naFaixa(n, min, max) {\n  // use &&\n}",
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
    "title": "3.1 Classificar nota",
    "concept": "O `if/else if/else` escolhe um caminho conforme a condição.",
    "exampleCode": "function par(n) {\n  if (n % 2 === 0) { return \"par\" } else { return \"ímpar\" }\n}",
    "vocabulary": [
      "if",
      "else",
      "else if"
    ],
    "difficulty": "easy",
    "baseXp": 10,
    "description": "Escreva `classificar(nota)`: \"aprovado\" se nota >= 7, \"recuperação\" se >= 5, senão \"reprovado\".",
    "starterCode": "function classificar(nota) {\n}",
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
    "title": "3.2 Sinal do número",
    "concept": "Encadeie condições para cobrir todos os casos.",
    "exampleCode": "function ehZero(n) {\n  if (n === 0) return \"zero\"\n  return \"não zero\"\n}",
    "vocabulary": [
      "if",
      "return"
    ],
    "difficulty": "easy",
    "baseXp": 10,
    "description": "Escreva `sinal(n)`: \"positivo\", \"negativo\" ou \"zero\".",
    "starterCode": "function sinal(n) {\n}",
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
    "title": "3.3 Maior de dois",
    "concept": "Compare os dois e devolva o maior.",
    "exampleCode": "function menor(a, b) {\n  return a < b ? a : b\n}",
    "vocabulary": [
      "if",
      "else"
    ],
    "difficulty": "easy",
    "baseXp": 10,
    "description": "Escreva `maiorDeDois(a, b)` que retorna o maior dos dois (se forem iguais, retorne qualquer um).",
    "starterCode": "function maiorDeDois(a, b) {\n}",
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
    "title": "3.4 Maior de três",
    "concept": "Combine comparações com `&&` para achar o maior de três.",
    "exampleCode": "function todosIguais(a, b, c) {\n  return a === b && b === c\n}",
    "vocabulary": [
      "&&",
      "if"
    ],
    "difficulty": "medium",
    "baseXp": 20,
    "description": "Escreva `maiorDeTres(a, b, c)` que retorna o maior dos três.",
    "starterCode": "function maiorDeTres(a, b, c) {\n}",
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
    "title": "3.5 Nome do dia",
    "concept": "O `switch` compara um valor com vários `case`. Não esqueça o `return` (ou `break`) em cada caso.",
    "exampleCode": "function corDoNum(n) {\n  switch (n) {\n    case 1: return \"vermelho\"\n    case 2: return \"verde\"\n    default: return \"?\"\n  }\n}",
    "vocabulary": [
      "switch",
      "case",
      "default"
    ],
    "difficulty": "medium",
    "baseXp": 20,
    "description": "Escreva `nomeDoDia(n)`: 1=\"domingo\", 2=\"segunda\", 3=\"terça\", 4=\"quarta\", 5=\"quinta\", 6=\"sexta\", 7=\"sábado\".",
    "starterCode": "function nomeDoDia(n) {\n  switch (n) {\n    // ...\n  }\n}",
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
    "title": "3.6 Preço VIP",
    "concept": "O operador ternário `condição ? valorSeSim : valorSeNão` é um if curtinho que devolve um valor.",
    "exampleCode": "function status(ativo) {\n  return ativo ? \"on\" : \"off\"\n}",
    "vocabulary": [
      "? :",
      "ternário"
    ],
    "difficulty": "easy",
    "baseXp": 10,
    "description": "Escreva `preco(valor, ehVip)`: clientes VIP pagam 10% a menos; os demais pagam o valor cheio.",
    "starterCode": "function preco(valor, ehVip) {\n  // use o ternário\n}",
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
    "title": "4.1 Saudação",
    "concept": "Template literals usam crases e `${}` para misturar texto com variáveis.",
    "exampleCode": "function ola(nome) {\n  return `Oi, ${nome}`\n}",
    "vocabulary": [
      "template literal",
      "${}"
    ],
    "difficulty": "easy",
    "baseXp": 10,
    "description": "Escreva `saudar(nome)` que retorna \"Olá, NOME!\" (com o nome no meio e o ponto de exclamação).",
    "starterCode": "function saudar(nome) {\n  // use crase e ${nome}\n}",
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
    "title": "4.2 Potência com padrão",
    "concept": "Um parâmetro pode ter valor **padrão**: se a pessoa não passar, ele usa o default. `Math.pow(b, e)` calcula b elevado a e.",
    "exampleCode": "function vezes(a, b = 1) {\n  return a * b\n}",
    "vocabulary": [
      "parâmetro padrão",
      "Math.pow"
    ],
    "difficulty": "easy",
    "baseXp": 10,
    "description": "Escreva `potencia(base, exp)` onde exp tem padrão 2. Ex.: potencia(3) = 9; potencia(2, 3) = 8.",
    "starterCode": "function potencia(base, exp = 2) {\n}",
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
    "title": "4.3 Aplicar desconto",
    "concept": "Para evitar erros de ponto flutuante, multiplique antes de dividir: `(preco * pct) / 100`.",
    "exampleCode": "function metade(n) {\n  return n / 2\n}",
    "vocabulary": [
      "porcentagem"
    ],
    "difficulty": "easy",
    "baseXp": 10,
    "description": "Escreva `comDesconto(preco, pct)` que retorna o preço com pct% de desconto.",
    "starterCode": "function comDesconto(preco, pct) {\n}",
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
    "title": "4.4 Ano bissexto",
    "concept": "Um ano é bissexto se for divisível por 4, EXCETO os múltiplos de 100 que não são de 400. Combine `&&`, `||` e `%`.",
    "exampleCode": "function divisivelPor3(n) {\n  return n % 3 === 0\n}",
    "vocabulary": [
      "&&",
      "||",
      "%"
    ],
    "difficulty": "medium",
    "baseXp": 20,
    "description": "Escreva `ehBissexto(ano)` que retorna true se o ano for bissexto.",
    "starterCode": "function ehBissexto(ano) {\n}",
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
    "title": "4.5 IMC arredondado",
    "concept": "Para arredondar com 1 casa decimal: `Math.round(x * 10) / 10`.",
    "exampleCode": "function arredonda(n) {\n  return Math.round(n)\n}",
    "vocabulary": [
      "Math.round",
      "arredondar"
    ],
    "difficulty": "medium",
    "baseXp": 20,
    "description": "Escreva `imc(peso, altura)` = peso / (altura * altura), arredondado para 1 casa decimal.",
    "starterCode": "function imc(peso, altura) {\n}",
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
    "title": "5.1 Tamanho",
    "concept": "`.length` diz quantos caracteres a string tem.",
    "exampleCode": "\"oi\".length // 2",
    "vocabulary": [
      ".length"
    ],
    "difficulty": "easy",
    "baseXp": 10,
    "description": "Escreva `tamanho(texto)` que retorna a quantidade de caracteres.",
    "starterCode": "function tamanho(texto) {\n}",
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
    "title": "5.2 Gritar",
    "concept": "Strings são imutáveis: métodos como `.toUpperCase()` devolvem uma **nova** string.",
    "exampleCode": "\"oi\".toUpperCase() // \"OI\"",
    "vocabulary": [
      ".toUpperCase()",
      ".toLowerCase()"
    ],
    "difficulty": "easy",
    "baseXp": 10,
    "description": "Escreva `gritar(texto)` que retorna o texto todo em MAIÚSCULAS.",
    "starterCode": "function gritar(texto) {\n}",
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
    "title": "5.3 Primeira letra",
    "concept": "Cada caractere tem um índice começando em 0: `texto[0]` é o primeiro.",
    "exampleCode": "\"abc\"[0] // \"a\"",
    "vocabulary": [
      "índice",
      "[0]"
    ],
    "difficulty": "easy",
    "baseXp": 10,
    "description": "Escreva `primeiraLetra(texto)` que retorna o primeiro caractere.",
    "starterCode": "function primeiraLetra(texto) {\n}",
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
    "title": "5.4 Contém palavra",
    "concept": "`.includes(parte)` devolve true se a parte aparece dentro da string.",
    "exampleCode": "\"banana\".includes(\"ana\") // true",
    "vocabulary": [
      ".includes()"
    ],
    "difficulty": "easy",
    "baseXp": 10,
    "description": "Escreva `contem(frase, palavra)` que retorna true se a palavra aparece na frase.",
    "starterCode": "function contem(frase, palavra) {\n}",
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
    "title": "5.5 Inverter texto",
    "concept": "Quebre em letras com `.split(\"\")`, inverta com `.reverse()` e junte com `.join(\"\")`.",
    "exampleCode": "\"abc\".split(\"\") // [\"a\",\"b\",\"c\"]",
    "vocabulary": [
      ".split()",
      ".reverse()",
      ".join()"
    ],
    "difficulty": "medium",
    "baseXp": 20,
    "description": "Escreva `inverter(texto)` que retorna o texto de trás pra frente.",
    "starterCode": "function inverter(texto) {\n}",
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
    "title": "5.6 Contar vogais",
    "concept": "Percorra o texto e conte quantas letras são vogais.",
    "exampleCode": "for (const letra of \"abc\") { /* ... */ }",
    "vocabulary": [
      "for...of",
      "contador"
    ],
    "difficulty": "medium",
    "baseXp": 20,
    "description": "Escreva `contarVogais(texto)` que conta as vogais a, e, i, o, u (minúsculas).",
    "starterCode": "function contarVogais(texto) {\n}",
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
    "title": "5.7 Capitalizar",
    "concept": "Junte a primeira letra em maiúscula com o resto (`.slice(1)`) em minúscula.",
    "exampleCode": "\"abc\".slice(1) // \"bc\"",
    "vocabulary": [
      ".slice()",
      ".charAt()"
    ],
    "difficulty": "medium",
    "baseXp": 20,
    "description": "Escreva `capitalizar(texto)`: primeira letra maiúscula, o resto minúsculo.",
    "starterCode": "function capitalizar(texto) {\n}",
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
    "title": "5.8 Censurar",
    "concept": "Quebrar pela palavra e juntar com \"***\" troca **todas** as ocorrências (o `.replace` simples trocaria só a primeira).",
    "exampleCode": "\"a-b-a\".split(\"-\").join(\"+\") // \"a+b+a\"",
    "vocabulary": [
      ".split()",
      ".join()",
      ".replace()"
    ],
    "difficulty": "medium",
    "baseXp": 20,
    "description": "Escreva `censurar(frase, palavra)` que troca toda ocorrência da palavra por \"***\".",
    "starterCode": "function censurar(frase, palavra) {\n}",
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
    "title": "5.9 É palíndromo?",
    "concept": "Palíndromo é igual de trás pra frente. Normalize (minúsculas, só letras/números) antes de comparar.",
    "exampleCode": "\"Ana\".toLowerCase() // \"ana\"",
    "vocabulary": [
      ".toLowerCase()",
      ".replace()"
    ],
    "difficulty": "medium",
    "baseXp": 20,
    "description": "Escreva `ehPalindromo(texto)` que retorna true se for palíndromo (ignore maiúsculas e espaços).",
    "starterCode": "function ehPalindromo(texto) {\n}",
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
    "title": "6.1 Arredondar",
    "concept": "`Math.round` arredonda para o inteiro mais próximo.",
    "exampleCode": "Math.round(2.6) // 3",
    "vocabulary": [
      "Math.round",
      "Math.floor",
      "Math.ceil"
    ],
    "difficulty": "easy",
    "baseXp": 10,
    "description": "Escreva `arredondar(n)` que retorna n arredondado ao inteiro mais próximo.",
    "starterCode": "function arredondar(n) {\n}",
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
    "title": "6.2 Valor absoluto",
    "concept": "`Math.abs` devolve o valor sem sinal (sempre positivo ou zero).",
    "exampleCode": "Math.abs(-7) // 7",
    "vocabulary": [
      "Math.abs"
    ],
    "difficulty": "easy",
    "baseXp": 10,
    "description": "Escreva `absoluto(n)` que retorna o valor absoluto de n.",
    "starterCode": "function absoluto(n) {\n}",
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
    "title": "6.3 Maior entre dois",
    "concept": "`Math.max(a, b)` devolve o maior; `Math.min`, o menor.",
    "exampleCode": "Math.max(3, 9) // 9",
    "vocabulary": [
      "Math.max",
      "Math.min"
    ],
    "difficulty": "easy",
    "baseXp": 10,
    "description": "Escreva `maiorEntre(a, b)` usando Math.max.",
    "starterCode": "function maiorEntre(a, b) {\n}",
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
    "title": "6.4 Duas casas decimais",
    "concept": "CUIDADO: `.toFixed(2)` devolve uma **string** (\"3.14\"). Envolva em `Number(...)` para virar número de novo.",
    "exampleCode": "Number((3.14159).toFixed(2)) // 3.14",
    "vocabulary": [
      ".toFixed()",
      "Number()"
    ],
    "difficulty": "medium",
    "baseXp": 20,
    "description": "Escreva `duasCasas(n)` que retorna n com no máximo 2 casas decimais, como NÚMERO.",
    "starterCode": "function duasCasas(n) {\n}",
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
    "title": "6.5 Soma dos dígitos",
    "concept": "Transforme o número em texto, quebre em dígitos e some convertendo cada um com `Number`.",
    "exampleCode": "String(12).split(\"\") // [\"1\",\"2\"]",
    "vocabulary": [
      "String()",
      "Number()",
      ".split()"
    ],
    "difficulty": "medium",
    "baseXp": 20,
    "description": "Escreva `somaDigitos(n)` que soma os dígitos de n (n é positivo). Ex.: 123 -> 6.",
    "starterCode": "function somaDigitos(n) {\n}",
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
    "title": "6.6 É primo?",
    "concept": "Primo é maior que 1 e só divisível por 1 e por ele mesmo. Teste divisores de 2 até a raiz.",
    "exampleCode": "Math.sqrt(16) // 4",
    "vocabulary": [
      "Math.sqrt",
      "for",
      "%"
    ],
    "difficulty": "hard",
    "baseXp": 35,
    "description": "Escreva `ehPrimo(n)` que retorna true se n for primo.",
    "starterCode": "function ehPrimo(n) {\n}",
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
    "title": "7.1 Somar até N",
    "concept": "Um laço `for` repete com um contador. Use um **acumulador** para somar.",
    "exampleCode": "let s = 0\nfor (let i = 1; i <= 3; i++) s += i // 6",
    "vocabulary": [
      "for",
      "acumulador",
      "++"
    ],
    "difficulty": "easy",
    "baseXp": 10,
    "description": "Escreva `somaAte(n)` que soma 1 + 2 + ... + n.",
    "starterCode": "function somaAte(n) {\n}",
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
    "title": "7.2 Contar pares",
    "concept": "Conte dentro do laço só quando a condição for verdadeira.",
    "exampleCode": "if (i % 2 === 0) total++",
    "vocabulary": [
      "for",
      "if",
      "%"
    ],
    "difficulty": "easy",
    "baseXp": 10,
    "description": "Escreva `contarPares(ate)` que conta quantos números pares existem de 1 até ate.",
    "starterCode": "function contarPares(ate) {\n}",
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
    "title": "7.3 Tabuada",
    "concept": "Você pode ir acumulando os resultados numa lista com `.push()`.",
    "exampleCode": "const r = []\nr.push(5) // [5]",
    "vocabulary": [
      "for",
      ".push()",
      "array"
    ],
    "difficulty": "medium",
    "baseXp": 20,
    "description": "Escreva `tabuada(n)` que retorna uma lista com n×1, n×2, ..., n×10.",
    "starterCode": "function tabuada(n) {\n}",
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
    "title": "7.4 Fatorial",
    "concept": "Fatorial de n é 1×2×3×...×n. O acumulador começa em 1 (multiplicação).",
    "exampleCode": "let p = 1\nfor (let i = 1; i <= 4; i++) p *= i // 24",
    "vocabulary": [
      "for",
      "*="
    ],
    "difficulty": "medium",
    "baseXp": 20,
    "description": "Escreva `fatorial(n)` (use laço). fatorial(0) = 1.",
    "starterCode": "function fatorial(n) {\n}",
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
    "title": "7.5 Potência na mão",
    "concept": "Potência é multiplicar a base por ela mesma \"exp\" vezes.",
    "exampleCode": "// 2^3 = 2*2*2",
    "vocabulary": [
      "for",
      "*="
    ],
    "difficulty": "medium",
    "baseXp": 20,
    "description": "Escreva `potencia(base, exp)` SEM usar Math.pow. base^0 = 1.",
    "starterCode": "function potencia(base, exp) {\n}",
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
    "title": "7.6 Maior da lista",
    "concept": "`for...of` percorre cada item da lista. Guarde o maior visto até agora.",
    "exampleCode": "for (const x of [1,2,3]) { /* ... */ }",
    "vocabulary": [
      "for...of"
    ],
    "difficulty": "medium",
    "baseXp": 20,
    "description": "Escreva `maiorDaLista(lista)` que retorna o maior número da lista.",
    "starterCode": "function maiorDaLista(lista) {\n}",
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
    "title": "7.7 Quantas vezes a letra",
    "concept": "Percorra o texto e conte quando o caractere for igual à letra procurada.",
    "exampleCode": "for (const c of \"aba\") { /* ... */ }",
    "vocabulary": [
      "for...of",
      "===",
      "contador"
    ],
    "difficulty": "medium",
    "baseXp": 20,
    "description": "Escreva `contarLetra(texto, letra)` que conta quantas vezes a letra aparece.",
    "starterCode": "function contarLetra(texto, letra) {\n}",
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
    "title": "8.1 Primeiro",
    "concept": "Itens de uma lista têm índice a partir de 0: `lista[0]` é o primeiro.",
    "exampleCode": "[10, 20][0] // 10",
    "vocabulary": [
      "array",
      "[0]"
    ],
    "difficulty": "easy",
    "baseXp": 10,
    "description": "Escreva `primeiro(lista)` que retorna o primeiro item.",
    "starterCode": "function primeiro(lista) {\n}",
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
    "title": "8.2 Último",
    "concept": "O último índice é `.length - 1` (porque começa em 0).",
    "exampleCode": "const a = [1,2,3]\na[a.length - 1] // 3",
    "vocabulary": [
      ".length",
      "índice"
    ],
    "difficulty": "easy",
    "baseXp": 10,
    "description": "Escreva `ultimo(lista)` que retorna o último item.",
    "starterCode": "function ultimo(lista) {\n}",
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
    "title": "8.3 Tamanho da lista",
    "concept": "`.length` também funciona em listas: diz quantos itens há.",
    "exampleCode": "[1,2,3].length // 3",
    "vocabulary": [
      ".length"
    ],
    "difficulty": "easy",
    "baseXp": 10,
    "description": "Escreva `tamanhoLista(lista)` que retorna a quantidade de itens.",
    "starterCode": "function tamanhoLista(lista) {\n}",
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
    "title": "8.4 Contém valor",
    "concept": "`.includes(valor)` diz se o valor está na lista.",
    "exampleCode": "[1,2,3].includes(2) // true",
    "vocabulary": [
      ".includes()",
      ".indexOf()"
    ],
    "difficulty": "easy",
    "baseXp": 10,
    "description": "Escreva `contemValor(lista, valor)` que retorna true se o valor está na lista.",
    "starterCode": "function contemValor(lista, valor) {\n}",
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
    "title": "8.5 Sem o primeiro",
    "concept": "`.slice(1)` devolve uma NOVA lista a partir do índice 1, sem alterar a original.",
    "exampleCode": "[1,2,3].slice(1) // [2,3]",
    "vocabulary": [
      ".slice()",
      "imutável"
    ],
    "difficulty": "medium",
    "baseXp": 20,
    "description": "Escreva `semPrimeiro(lista)` que retorna a lista sem o primeiro item.",
    "starterCode": "function semPrimeiro(lista) {\n}",
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
    "title": "8.6 Adicionar (sem mutar)",
    "concept": "O **spread** `[...lista, valor]` cria uma nova lista com o item no fim, SEM mexer na original (diferente de `.push`, que altera).",
    "exampleCode": "[...[1,2], 3] // [1,2,3]",
    "vocabulary": [
      "spread",
      "..."
    ],
    "difficulty": "medium",
    "baseXp": 20,
    "description": "Escreva `adicionar(lista, valor)` que retorna uma NOVA lista com o valor no fim.",
    "starterCode": "function adicionar(lista, valor) {\n}",
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
    "title": "8.7 Inverter (copiando antes)",
    "concept": "CUIDADO: `.reverse()` ALTERA a lista original. Copie antes com `[...lista]` e então inverta.",
    "exampleCode": "[...[1,2,3]].reverse() // [3,2,1]",
    "vocabulary": [
      ".reverse()",
      "spread",
      "mutação"
    ],
    "difficulty": "medium",
    "baseXp": 20,
    "description": "Escreva `inverter(lista)` que retorna uma NOVA lista invertida.",
    "starterCode": "function inverter(lista) {\n}",
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
    "title": "8.8 Juntar com vírgula",
    "concept": "`.join(\", \")` transforma uma lista numa string separando por vírgula.",
    "exampleCode": "[1,2,3].join(\"-\") // \"1-2-3\"",
    "vocabulary": [
      ".join()"
    ],
    "difficulty": "easy",
    "baseXp": 10,
    "description": "Escreva `juntar(lista)` que retorna os itens separados por \", \" (vírgula e espaço).",
    "starterCode": "function juntar(lista) {\n}",
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
    "title": "9.1 Dobrar todos",
    "concept": "`.map(fn)` cria uma NOVA lista aplicando a função a cada item.",
    "exampleCode": "[1,2,3].map(x => x + 1) // [2,3,4]",
    "vocabulary": [
      ".map()"
    ],
    "difficulty": "medium",
    "baseXp": 20,
    "description": "Escreva `dobrarTodos(lista)` que retorna cada número dobrado.",
    "starterCode": "function dobrarTodos(lista) {\n}",
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
    "title": "9.2 Só os pares",
    "concept": "`.filter(fn)` mantém só os itens em que a função devolve true.",
    "exampleCode": "[1,2,3,4].filter(x => x > 2) // [3,4]",
    "vocabulary": [
      ".filter()"
    ],
    "difficulty": "medium",
    "baseXp": 20,
    "description": "Escreva `apenasPares(lista)` que retorna só os números pares.",
    "starterCode": "function apenasPares(lista) {\n}",
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
    "title": "9.3 Somar tudo",
    "concept": "`.reduce((acc, x) => ..., inicial)` combina a lista inteira em um único valor.",
    "exampleCode": "[1,2,3].reduce((a, x) => a + x, 0) // 6",
    "vocabulary": [
      ".reduce()"
    ],
    "difficulty": "medium",
    "baseXp": 20,
    "description": "Escreva `somarTudo(lista)` que retorna a soma de todos os itens.",
    "starterCode": "function somarTudo(lista) {\n}",
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
    "title": "9.4 Nomes em maiúsculo",
    "concept": "Use `.map` para transformar cada string da lista.",
    "exampleCode": "[\"a\"].map(s => s.toUpperCase()) // [\"A\"]",
    "vocabulary": [
      ".map()",
      ".toUpperCase()"
    ],
    "difficulty": "medium",
    "baseXp": 20,
    "description": "Escreva `nomesMaiusculos(lista)` que devolve cada nome em MAIÚSCULAS.",
    "starterCode": "function nomesMaiusculos(lista) {\n}",
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
    "title": "9.5 Quantos maiores que N",
    "concept": "Combine `.filter` com `.length` para contar.",
    "exampleCode": "[1,5,9].filter(x => x > 4).length // 2",
    "vocabulary": [
      ".filter()",
      ".length"
    ],
    "difficulty": "medium",
    "baseXp": 20,
    "description": "Escreva `quantosMaioresQue(lista, n)` que conta quantos itens são maiores que n.",
    "starterCode": "function quantosMaioresQue(lista, n) {\n}",
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
    "title": "9.6 Achar o primeiro maior",
    "concept": "`.find(fn)` devolve o PRIMEIRO item que satisfaz a condição (ou undefined).",
    "exampleCode": "[1,5,9].find(x => x > 4) // 5",
    "vocabulary": [
      ".find()"
    ],
    "difficulty": "medium",
    "baseXp": 20,
    "description": "Escreva `primeiroMaiorQue(lista, n)` que retorna o primeiro item maior que n.",
    "starterCode": "function primeiroMaiorQue(lista, n) {\n}",
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
    "title": "9.7 Todos positivos?",
    "concept": "`.every(fn)` devolve true se TODOS os itens passarem na condição.",
    "exampleCode": "[1,2].every(x => x > 0) // true",
    "vocabulary": [
      ".every()"
    ],
    "difficulty": "medium",
    "baseXp": 20,
    "description": "Escreva `todosPositivos(lista)` que retorna true se todos forem maiores que 0.",
    "starterCode": "function todosPositivos(lista) {\n}",
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
    "title": "9.8 Algum negativo?",
    "concept": "`.some(fn)` devolve true se PELO MENOS UM item passar na condição.",
    "exampleCode": "[1,-2].some(x => x < 0) // true",
    "vocabulary": [
      ".some()"
    ],
    "difficulty": "medium",
    "baseXp": 20,
    "description": "Escreva `algumNegativo(lista)` que retorna true se houver algum número negativo.",
    "starterCode": "function algumNegativo(lista) {\n}",
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
    "title": "9.9 Média da lista",
    "concept": "Some tudo com `.reduce` e divida pelo `.length`.",
    "exampleCode": "// soma / quantidade",
    "vocabulary": [
      ".reduce()",
      ".length"
    ],
    "difficulty": "medium",
    "baseXp": 20,
    "description": "Escreva `media(lista)` que retorna a média dos números (a lista nunca é vazia).",
    "starterCode": "function media(lista) {\n}",
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
    "title": "9.10 Ordenar crescente",
    "concept": "PEGADINHA: `.sort()` sem função ordena como TEXTO ([10,2,1] viraria [1,10,2]!). Para números use `.sort((a,b)=>a-b)`. E copie antes, pois sort altera a original.",
    "exampleCode": "[...[3,1,2]].sort((a,b) => a - b) // [1,2,3]",
    "vocabulary": [
      ".sort()",
      "comparador",
      "spread"
    ],
    "difficulty": "hard",
    "baseXp": 35,
    "description": "Escreva `ordenarCrescente(lista)` que retorna uma NOVA lista ordenada do menor ao maior.",
    "starterCode": "function ordenarCrescente(lista) {\n}",
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
    "title": "10.1 Criar pessoa",
    "concept": "Um objeto agrupa dados com nomes: `{ nome: \"Ana\", idade: 10 }`.",
    "exampleCode": "const p = { x: 1, y: 2 }",
    "vocabulary": [
      "objeto",
      "{}",
      "propriedade"
    ],
    "difficulty": "easy",
    "baseXp": 10,
    "description": "Escreva `criarPessoa(nome, idade)` que retorna um objeto { nome, idade }.",
    "starterCode": "function criarPessoa(nome, idade) {\n}",
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
    "title": "10.2 Pegar nome",
    "concept": "Acesse propriedades com ponto: `pessoa.nome`.",
    "exampleCode": "({ x: 1 }).x // 1",
    "vocabulary": [
      ".propriedade"
    ],
    "difficulty": "easy",
    "baseXp": 10,
    "description": "Escreva `pegarNome(pessoa)` que retorna o valor da propriedade nome.",
    "starterCode": "function pegarNome(pessoa) {\n}",
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
    "title": "10.3 Tem a chave?",
    "concept": "O operador `in` diz se uma chave existe no objeto: `\"nome\" in pessoa`.",
    "exampleCode": "\"x\" in { x: 1 } // true",
    "vocabulary": [
      "in"
    ],
    "difficulty": "medium",
    "baseXp": 20,
    "description": "Escreva `temChave(obj, chave)` que retorna true se a chave existe no objeto.",
    "starterCode": "function temChave(obj, chave) {\n}",
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
    "title": "10.4 Quantas chaves",
    "concept": "`Object.keys(obj)` devolve a lista das chaves; conte com `.length`.",
    "exampleCode": "Object.keys({ a: 1, b: 2 }) // [\"a\",\"b\"]",
    "vocabulary": [
      "Object.keys()"
    ],
    "difficulty": "medium",
    "baseXp": 20,
    "description": "Escreva `quantasChaves(obj)` que retorna o número de chaves do objeto.",
    "starterCode": "function quantasChaves(obj) {\n}",
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
    "title": "10.5 Somar valores",
    "concept": "`Object.values(obj)` devolve a lista dos valores; some com `.reduce`.",
    "exampleCode": "Object.values({ a: 1, b: 2 }) // [1,2]",
    "vocabulary": [
      "Object.values()",
      ".reduce()"
    ],
    "difficulty": "medium",
    "baseXp": 20,
    "description": "Escreva `somarValores(obj)` que soma todos os valores (números) do objeto.",
    "starterCode": "function somarValores(obj) {\n}",
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
    "title": "10.6 Atualizar idade (sem mutar)",
    "concept": "O spread `{ ...pessoa, idade }` cria uma cópia do objeto trocando só a idade, sem alterar o original.",
    "exampleCode": "({ ...{ a: 1 }, b: 2 }) // { a: 1, b: 2 }",
    "vocabulary": [
      "spread",
      "...",
      "imutável"
    ],
    "difficulty": "medium",
    "baseXp": 20,
    "description": "Escreva `comNovaIdade(pessoa, idade)` que retorna uma cópia da pessoa com a idade trocada.",
    "starterCode": "function comNovaIdade(pessoa, idade) {\n}",
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
    "title": "10.7 Inverter chave e valor",
    "concept": "Para chaves dinâmicas use colchetes: `novo[valor] = chave`.",
    "exampleCode": "const o = {}; o[\"x\"] = 1",
    "vocabulary": [
      "Object.keys()",
      "[chave]"
    ],
    "difficulty": "hard",
    "baseXp": 35,
    "description": "Escreva `inverterObj(obj)` que troca chaves por valores. Ex.: {a:1, b:2} -> {1:\"a\", 2:\"b\"}.",
    "starterCode": "function inverterObj(obj) {\n}",
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
    "title": "11.1 Contagem regressiva",
    "concept": "Uma função recursiva chama a si mesma. Precisa de um CASO BASE que para a recursão.",
    "exampleCode": "// se n <= 0, pare",
    "vocabulary": [
      "recursão",
      "caso base"
    ],
    "difficulty": "medium",
    "baseXp": 20,
    "description": "Escreva `regressiva(n)` que retorna a lista [n, n-1, ..., 1]. Para n <= 0, retorne [].",
    "starterCode": "function regressiva(n) {\n}",
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
    "title": "11.2 Fatorial recursivo",
    "concept": "fatorial(n) = n × fatorial(n-1), e fatorial(0) = 1 (caso base).",
    "exampleCode": "// n * fatorial(n - 1)",
    "vocabulary": [
      "recursão",
      "caso base"
    ],
    "difficulty": "medium",
    "baseXp": 20,
    "description": "Escreva `fatorialRec(n)` usando recursão.",
    "starterCode": "function fatorialRec(n) {\n}",
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
    "title": "11.3 Soma até N recursiva",
    "concept": "somaAte(n) = n + somaAte(n-1), com caso base somaAte(0) = 0.",
    "exampleCode": "// n + somaAte(n - 1)",
    "vocabulary": [
      "recursão"
    ],
    "difficulty": "medium",
    "baseXp": 20,
    "description": "Escreva `somaAteRec(n)` (recursiva) que soma 1 + 2 + ... + n.",
    "starterCode": "function somaAteRec(n) {\n}",
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
    "title": "11.4 Potência recursiva",
    "concept": "base^exp = base × base^(exp-1), com base^0 = 1.",
    "exampleCode": "// base * potenciaRec(base, exp - 1)",
    "vocabulary": [
      "recursão"
    ],
    "difficulty": "medium",
    "baseXp": 20,
    "description": "Escreva `potenciaRec(base, exp)` (recursiva). base^0 = 1.",
    "starterCode": "function potenciaRec(base, exp) {\n}",
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
    "title": "11.5 Somar lista recursivamente",
    "concept": "A soma da lista é o primeiro item mais a soma do resto (`.slice(1)`).",
    "exampleCode": "// lista[0] + somar(lista.slice(1))",
    "vocabulary": [
      "recursão",
      ".slice()"
    ],
    "difficulty": "hard",
    "baseXp": 35,
    "description": "Escreva `somarLista(lista)` usando recursão. Lista vazia soma 0.",
    "starterCode": "function somarLista(lista) {\n}",
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
    "title": "11.6 Fibonacci",
    "concept": "Cada termo é a soma dos dois anteriores. Casos base: o 1º e o 2º termos valem 1.",
    "exampleCode": "// fib(n-1) + fib(n-2)",
    "vocabulary": [
      "recursão",
      "dois casos base"
    ],
    "difficulty": "hard",
    "baseXp": 35,
    "description": "Escreva `fibonacci(n)` que retorna o n-ésimo termo (1,1,2,3,5,8,...).",
    "starterCode": "function fibonacci(n) {\n}",
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
    "title": "12.1 FizzBuzz",
    "concept": "Clássico: múltiplos de 3 viram \"Fizz\", de 5 viram \"Buzz\", de 3 e 5 viram \"FizzBuzz\".",
    "exampleCode": "// monte uma lista de 1 a n",
    "vocabulary": [
      "for",
      ".push()",
      "%"
    ],
    "difficulty": "medium",
    "baseXp": 20,
    "description": "Escreva `fizzBuzz(n)`: lista de 1 a n, trocando múltiplos de 3 por \"Fizz\", de 5 por \"Buzz\", de ambos por \"FizzBuzz\".",
    "starterCode": "function fizzBuzz(n) {\n}",
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
    "title": "12.2 Frequência",
    "concept": "Use um objeto como contador: para cada item, some 1 na sua chave.",
    "exampleCode": "const c = {}; c[\"a\"] = (c[\"a\"] || 0) + 1",
    "vocabulary": [
      "objeto",
      "contador",
      "[chave]"
    ],
    "difficulty": "hard",
    "baseXp": 35,
    "description": "Escreva `frequencia(lista)` que retorna um objeto { item: quantasVezes }.",
    "starterCode": "function frequencia(lista) {\n}",
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
    "title": "12.3 Maior de cada sublista",
    "concept": "Combine `.map` com `Math.max(...sub)` (spread espalha a sublista como argumentos).",
    "exampleCode": "Math.max(...[3, 9, 5]) // 9",
    "vocabulary": [
      ".map()",
      "Math.max",
      "spread"
    ],
    "difficulty": "hard",
    "baseXp": 35,
    "description": "Escreva `maioresDeCada(matriz)` que retorna o maior de cada sublista.",
    "starterCode": "function maioresDeCada(matriz) {\n}",
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
    "title": "12.4 Agrupar por paridade",
    "concept": "Crie um objeto com duas listas e vá empurrando cada número para a certa.",
    "exampleCode": "const g = { pares: [], impares: [] }",
    "vocabulary": [
      "objeto",
      ".push()",
      "%"
    ],
    "difficulty": "hard",
    "baseXp": 35,
    "description": "Escreva `porParidade(lista)` que retorna { pares: [...], impares: [...] }.",
    "starterCode": "function porParidade(lista) {\n}",
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
    "title": "12.5 Validar telefone",
    "concept": "Uma expressão regular descreve um padrão. `/^\\d{11}$/` casa exatamente 11 dígitos.",
    "exampleCode": "/^\\d{11}$/.test(\"81999998888\") // true",
    "vocabulary": [
      "regex",
      ".test()"
    ],
    "difficulty": "hard",
    "baseXp": 35,
    "description": "Escreva `telefoneValido(texto)` que retorna true se for exatamente 11 dígitos (só números).",
    "starterCode": "function telefoneValido(texto) {\n}",
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
    "title": "12.6 Cifra de César",
    "concept": "Desloque cada letra no alfabeto. Use `charCodeAt` (código da letra) e `String.fromCharCode`, com volta no \"z\".",
    "exampleCode": "\"a\".charCodeAt(0) // 97",
    "vocabulary": [
      ".charCodeAt()",
      "String.fromCharCode",
      "%"
    ],
    "difficulty": "hard",
    "baseXp": 35,
    "description": "Escreva `cesar(texto, n)` que desloca cada letra minúscula (a-z) em n posições, voltando ao \"a\" depois do \"z\".",
    "starterCode": "function cesar(texto, n) {\n}",
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
    "title": "12.7 Moda",
    "concept": "Conte as frequências e devolva o valor com a maior contagem.",
    "exampleCode": "// objeto contador + achar o máximo",
    "vocabulary": [
      "objeto",
      "contador"
    ],
    "difficulty": "hard",
    "baseXp": 35,
    "description": "Escreva `moda(lista)` que retorna o número que mais aparece (sem empates nos testes).",
    "starterCode": "function moda(lista) {\n}",
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
    "title": "12.8 Mediana",
    "concept": "Ordene a lista; se a quantidade for ímpar, a mediana é o do meio; se for par, é a média dos dois do meio.",
    "exampleCode": "// ordene e pegue o(s) do meio",
    "vocabulary": [
      ".sort()",
      "mediana"
    ],
    "difficulty": "hard",
    "baseXp": 35,
    "description": "Escreva `mediana(lista)` (a lista não é vazia).",
    "starterCode": "function mediana(lista) {\n}",
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
    "title": "12.9 São anagramas?",
    "concept": "Dois textos são anagramas se têm as mesmas letras. Ordene as letras de cada um e compare.",
    "exampleCode": "\"abc\".split(\"\").sort().join(\"\") // \"abc\"",
    "vocabulary": [
      ".split()",
      ".sort()",
      ".join()"
    ],
    "difficulty": "hard",
    "baseXp": 35,
    "description": "Escreva `ehAnagrama(a, b)` que retorna true se a e b forem anagramas (mesmas letras).",
    "starterCode": "function ehAnagrama(a, b) {\n}",
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
    "title": "12.10 Inteiro para romano",
    "concept": "Vá subtraindo os maiores valores possíveis e acumulando os símbolos correspondentes.",
    "exampleCode": "// tabela de valores e símbolos",
    "vocabulary": [
      "for",
      "while",
      "array"
    ],
    "difficulty": "hard",
    "baseXp": 35,
    "description": "Escreva `paraRomano(n)` que converte um inteiro (1 a 3999) em algarismo romano.",
    "starterCode": "function paraRomano(n) {\n}",
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
  }
]

async function seedTrilha() {
  console.log('🌱  Semeando trilha:', TRAIL_TITLE)

  // 1) Trilha (catálogo global: tenant_id NULL)
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

  // 2) Módulos + desafios (1 desafio por módulo)
  let novosModulos = 0
  let novosDesafios = 0
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
        .values({
          trailId: trail!.id,
          title: m.title,
          concept: m.concept,
          exampleCode: m.exampleCode,
          vocabulary: m.vocabulary,
          order,
        })
        .returning({ id: trailModules.id })
      novosModulos++
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
        order: 1,
      })
      novosDesafios++
    }
  }

  console.log(`  ✅  ${trilhaModules.length} módulos no total (${novosModulos} novos, ${novosDesafios} desafios novos)`)
  console.log('🎉  Seed da trilha concluído.')
}

seedTrilha()
  .catch((err) => {
    console.error('❌  Erro no seed da trilha:', err)
    process.exit(1)
  })
  .finally(() => client.end())
