/**
 * Seed da trilha "Desenhando com p5.js" no CATÁLOGO GLOBAL (tenant_id = NULL).
 * Primeira trilha do catálogo a usar `render_mode: 'p5'` — o aluno escreve um
 * sketch p5.js e VÊ o desenho num preview (iframe sandbox), mas a NOTA vem da
 * ESTRUTURA (astRule requireCall/forbidCall — "chamou createCanvas?", "usou
 * ellipse?"), nunca de comparação de pixel (ver docs/motor-desafios-capacidades.md §14).
 *
 * IMPORTANTE (achado ao revisar o seed-trilha-js.ts antes de escrever este):
 * o seedTrilha() original NÃO grava a coluna `renderMode` no insert/update de
 * `challenges` — só funciona porque nenhum desafio semeado até hoje usa p5.
 * Este arquivo GRAVA `renderMode` explicitamente (ver insert/update abaixo).
 *
 * Execução: pnpm --filter @codinhos/api db:seed:p5
 *
 * Idempotente E atualizável, mesmo padrão do seed-trilha-js.ts.
 * Desafios verificados contra o runner real (checkAstRule) — soluções boas e
 * soluções "erradas de propósito" (sem a primitiva pedida) antes de semear.
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

const TRAIL_SLUG = 'js-p5-programacao-visual'
const TRAIL_TITLE = 'Desenhando com p5.js'
const TRAIL_DESC =
  'Trilha visual: escreva sketches p5.js e veja o desenho na hora. Progressão canvas/coordenadas → cor → formas → animação → interatividade (mouse/teclado) → padrões com repetição → projeto livre. A nota vem da estrutura do código (usou as funções certas?), nunca de pixel.'

type AstRuleKind = 'requireCall' | 'forbidCall'

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
  renderMode?: 'p5'
  validationModeOverride?: 'auto' | 'auto_review' | 'manual'
  testCases: {
    input: unknown
    expected: unknown
    description: string
    mode?: 'ast'
    astRule?: { kind: AstRuleKind; name?: string }
  }[]
}

function requireCall(name: string, description: string) {
  return { input: null, expected: '', description, mode: 'ast' as const, astRule: { kind: 'requireCall' as const, name } }
}

const trilhaModules: Modulo[] = [
  {
    kind: 'lesson',
    title: 'Lição — O que é p5.js',
    concept:
      '**p5.js** é uma biblioteca para desenhar na tela com código. Todo sketch tem duas funções especiais: `setup()` roda UMA VEZ no início (para configurar a tela) e `draw()` roda REPETIDAMENTE (para animação — se não precisar animar, pode nem declarar).\n\n`createCanvas(largura, altura)` cria a tela onde tudo é desenhado.',
    exampleCode: 'function setup() {\n  createCanvas(400, 400)\n}',
    vocabulary: ['setup()', 'draw()', 'createCanvas()'],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: 'P.1 Sua primeira tela',
    concept: 'Toda tela começa com `createCanvas(largura, altura)` dentro de `setup()`.',
    exampleCode: 'function setup() {\n  createCanvas(300, 200)\n}',
    vocabulary: ['createCanvas()'],
    difficulty: 'easy',
    baseXp: 10,
    description: 'Escreva um sketch com `setup()` que cria uma tela de 400 x 400 usando `createCanvas`.',
    starterCode: 'function setup() {\n  // crie a tela aqui\n}\n',
    renderMode: 'p5',
    testCases: [requireCall('createCanvas', 'chamou createCanvas()')],
  },
  {
    kind: 'lesson',
    title: 'Lição — Cores: background, fill, stroke',
    concept:
      '`background(r,g,b)` pinta o FUNDO inteiro. `fill(r,g,b)` define a cor de PREENCHIMENTO das próximas formas. `stroke(r,g,b)` define a cor da BORDA; `noStroke()` remove a borda. Cada valor de cor vai de 0 a 255.',
    exampleCode: 'function setup() {\n  createCanvas(200, 200)\n  background(30, 30, 60)\n  fill(255, 200, 0)\n  noStroke()\n}',
    vocabulary: ['background()', 'fill()', 'stroke()', 'noStroke()'],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: 'P.2 Fundo colorido + retângulo',
    concept: 'Pinte o fundo com `background` e desenhe um retângulo colorido com `fill` + `rect`.',
    exampleCode: 'function setup() {\n  createCanvas(200, 200)\n  background(0, 0, 50)\n  fill(255, 0, 0)\n  rect(50, 50, 80, 80)\n}',
    vocabulary: ['background()', 'fill()', 'rect()'],
    difficulty: 'medium',
    baseXp: 15,
    description: 'Escreva um sketch: `createCanvas` de 300x300, `background` de uma cor à sua escolha, e um `rect` com `fill` de outra cor.',
    starterCode: 'function setup() {\n  createCanvas(300, 300)\n  // background(...) e fill(...) + rect(...)\n}\n',
    renderMode: 'p5',
    testCases: [
      requireCall('createCanvas', 'chamou createCanvas()'),
      requireCall('background', 'chamou background()'),
      requireCall('fill', 'chamou fill()'),
      requireCall('rect', 'chamou rect()'),
    ],
  },
  {
    kind: 'lesson',
    title: 'Lição — Formas e coordenadas',
    concept:
      'No p5, o eixo X cresce para a DIREITA e o eixo Y cresce para BAIXO (o ponto (0,0) é o canto superior esquerdo). Formas básicas: `rect(x,y,largura,altura)`, `ellipse(x,y,largura,altura)` (círculo quando largura = altura), `line(x1,y1,x2,y2)`, `triangle(x1,y1,x2,y2,x3,y3)`.',
    exampleCode: 'ellipse(100, 100, 50, 50) // círculo centrado em (100,100), diâmetro 50',
    vocabulary: ['rect()', 'ellipse()', 'line()', 'triangle()', 'coordenadas'],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: 'P.3 Desenhe um rosto',
    concept: 'Use `ellipse` para o rosto e os olhos, e outra forma para a boca.',
    exampleCode: 'ellipse(150, 150, 200, 200) // "rosto" grande',
    vocabulary: ['ellipse()'],
    difficulty: 'medium',
    baseXp: 15,
    description: 'Escreva um sketch (createCanvas 300x300) que desenha um rosto: um círculo grande (rosto), dois círculos pequenos (olhos) e algo para a boca (`ellipse`, `arc` ou `line`).',
    starterCode: 'function setup() {\n  createCanvas(300, 300)\n  // rosto + 2 olhos com ellipse, e algo para a boca\n}\n',
    renderMode: 'p5',
    testCases: [
      requireCall('createCanvas', 'chamou createCanvas()'),
      requireCall('ellipse', 'chamou ellipse()'),
    ],
  },
  {
    kind: 'challenge',
    title: 'P.4 Desenhe uma casinha',
    concept: 'Combine um `rect` (parede) com um `triangle` (telhado).',
    exampleCode: 'rect(50, 100, 100, 80)\ntriangle(50, 100, 150, 100, 100, 50)',
    vocabulary: ['rect()', 'triangle()'],
    difficulty: 'medium',
    baseXp: 20,
    description: 'Escreva um sketch (createCanvas 300x300) que desenha uma casinha: um `rect` para a parede e um `triangle` para o telhado.',
    starterCode: 'function setup() {\n  createCanvas(300, 300)\n  // rect para a parede + triangle para o telhado\n}\n',
    renderMode: 'p5',
    testCases: [
      requireCall('createCanvas', 'chamou createCanvas()'),
      requireCall('rect', 'chamou rect()'),
      requireCall('triangle', 'chamou triangle()'),
    ],
  },
  {
    kind: 'lesson',
    title: 'Lição — Variáveis e animação',
    concept:
      'Uma variável declarada FORA de `setup`/`draw` guarda seu valor entre quadros. `draw()` roda muitas vezes por segundo — mude a variável um pouquinho a cada chamada para animar.',
    exampleCode: 'let x = 0\nfunction setup() { createCanvas(200, 200) }\nfunction draw() {\n  background(255)\n  ellipse(x, 100, 30, 30)\n  x = x + 2\n}',
    vocabulary: ['variável global', 'draw()', 'animação'],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: 'P.5 Bolinha que se move',
    concept: 'Declare uma variável de posição fora das funções, e mude-a dentro de `draw` a cada quadro.',
    exampleCode: 'let tamanho = 10\nfunction draw() {\n  background(255)\n  ellipse(100, 100, tamanho, tamanho)\n  tamanho = tamanho + 1\n}',
    vocabulary: ['draw()', 'variável global'],
    difficulty: 'medium',
    baseXp: 20,
    description: 'Escreva um sketch com `setup` (createCanvas 300x300) e `draw`: uma bolinha (`ellipse`) que se move para a direita a cada quadro (aumente a posição x numa variável global).',
    starterCode: 'let x = 0\n\nfunction setup() {\n  createCanvas(300, 300)\n}\n\nfunction draw() {\n  // limpe o fundo, desenhe a bolinha na posição x, aumente x\n}\n',
    renderMode: 'p5',
    testCases: [
      requireCall('createCanvas', 'chamou createCanvas()'),
      requireCall('draw', 'definiu draw()'),
      requireCall('ellipse', 'chamou ellipse()'),
    ],
  },
  {
    kind: 'lesson',
    title: 'Lição — Interatividade: mouse e teclado',
    concept:
      '`mousePressed()` roda quando o mouse é clicado; dentro dela, `mouseX`/`mouseY` dizem onde o clique aconteceu. `keyPressed()` roda quando uma tecla é apertada.',
    exampleCode: 'function mousePressed() {\n  ellipse(mouseX, mouseY, 20, 20)\n}',
    vocabulary: ['mousePressed()', 'mouseX', 'mouseY', 'keyPressed()'],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: 'P.6 Círculo onde o mouse clicar',
    concept: 'Dentro de `mousePressed()`, desenhe usando `mouseX` e `mouseY` como posição.',
    exampleCode: 'function mousePressed() {\n  rect(mouseX, mouseY, 20, 20)\n}',
    vocabulary: ['mousePressed()'],
    difficulty: 'medium',
    baseXp: 20,
    description: 'Escreva um sketch (createCanvas 300x300) que desenha um círculo na posição do mouse toda vez que ele é clicado, usando `mousePressed()`.',
    starterCode: 'function setup() {\n  createCanvas(300, 300)\n}\n\nfunction mousePressed() {\n  // desenhe um círculo em (mouseX, mouseY)\n}\n',
    renderMode: 'p5',
    testCases: [
      requireCall('createCanvas', 'chamou createCanvas()'),
      requireCall('mousePressed', 'definiu mousePressed()'),
      requireCall('ellipse', 'chamou ellipse()'),
    ],
  },
  {
    kind: 'challenge',
    title: 'P.7 Muda a cor de fundo ao apertar tecla',
    concept: 'Dentro de `keyPressed()`, chame `background` com uma cor nova.',
    exampleCode: 'function keyPressed() {\n  fill(255, 0, 0)\n}',
    vocabulary: ['keyPressed()'],
    difficulty: 'medium',
    baseXp: 20,
    description: 'Escreva um sketch (createCanvas 300x300) que muda a cor de fundo (`background`) toda vez que uma tecla é apertada, usando `keyPressed()`.',
    starterCode: 'function setup() {\n  createCanvas(300, 300)\n  background(255)\n}\n\nfunction keyPressed() {\n  // mude o fundo para uma cor nova\n}\n',
    renderMode: 'p5',
    testCases: [
      requireCall('createCanvas', 'chamou createCanvas()'),
      requireCall('keyPressed', 'definiu keyPressed()'),
      requireCall('background', 'chamou background()'),
    ],
  },
  {
    kind: 'lesson',
    title: 'Lição — Repetição para desenhar padrões',
    concept: 'Um `for` pode desenhar várias formas seguidas, mudando a posição a cada volta — ótimo para grades e padrões.',
    exampleCode: 'for (let i = 0; i < 5; i++) {\n  ellipse(i * 40 + 20, 100, 30, 30)\n}',
    vocabulary: ['for', 'padrão visual'],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: 'P.8 Grade de quadrados',
    concept: 'Use dois `for` (linhas e colunas) para desenhar uma grade de quadrados igualmente espaçados.',
    exampleCode: 'for (let l = 0; l < 3; l++) {\n  for (let c = 0; c < 3; c++) {\n    ellipse(c * 50 + 30, l * 50 + 30, 20, 20)\n  }\n}',
    vocabulary: ['for aninhado'],
    difficulty: 'hard',
    baseXp: 30,
    description: 'Escreva um sketch (createCanvas 300x300) que desenha uma grade de quadrados (`rect`) usando dois `for` (linhas e colunas).',
    starterCode: 'function setup() {\n  createCanvas(300, 300)\n  // dois for aninhados desenhando rect em posições diferentes\n}\n',
    renderMode: 'p5',
    testCases: [
      requireCall('createCanvas', 'chamou createCanvas()'),
      requireCall('rect', 'chamou rect()'),
    ],
  },
  {
    kind: 'challenge',
    title: 'P.9 [Projeto livre] Seu desenho ou mini-animação',
    concept: 'Hora de criar algo seu — combine formas, cores, variáveis e o que aprendeu. Sem gabarito único: seu(sua) gestor(a) vai dar uma olhada e aprovar.',
    exampleCode: '// use o que aprendeu: createCanvas, cores, formas, draw(), mouse/teclado...',
    vocabulary: ['criatividade'],
    difficulty: 'hard',
    baseXp: 40,
    description: 'Crie um desenho ou mini-animação livre em p5.js, usando pelo menos 2 formas diferentes e uma cor de fundo. Capriche!',
    starterCode: 'function setup() {\n  createCanvas(400, 400)\n  // seu desenho aqui\n}\n\nfunction draw() {\n  // se quiser animar, use draw()\n}\n',
    renderMode: 'p5',
    validationModeOverride: 'manual',
    testCases: [],
  },
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
      .values({ slug: TRAIL_SLUG, title: TRAIL_TITLE, description: TRAIL_DESC, language: 'javascript', order: 40 })
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
        renderMode: m.renderMode ?? null,
        validationModeOverride: m.validationModeOverride ?? null,
        order: 1,
      })
    } else {
      await db
        .update(challenges)
        .set({
          title: m.title,
          description: m.description,
          starterCode: m.starterCode,
          testCases: m.testCases,
          difficulty: m.difficulty,
          baseXp: m.baseXp,
          targetFn: m.targetFn ?? null,
          renderMode: m.renderMode ?? null,
          validationModeOverride: m.validationModeOverride ?? null,
        })
        .where(eq(challenges.id, ch.id))
    }
    desafios++
  }

  console.log(`  ✅  ${trilhaModules.length} módulos (${licoes} lições, ${desafios} desafios)`)
  await client.end()
}

seedTrilha().catch((err) => {
  console.error('❌  Erro ao semear:', err)
  process.exit(1)
})
