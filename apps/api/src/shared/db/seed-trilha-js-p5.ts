/**
 * Seed da trilha OPCIONAL "JavaScript: Desenhando com p5.js" no CATÁLOGO GLOBAL.
 * Fora do caminho obrigatório — ver docs/pesquisa-trilhas-js.md e docs/trilha-js-opcional-visual-p5.md.
 * Execução: pnpm --filter @codinhos/api db:seed:js-p5
 * Idempotente. renderMode: 'p5' (prévia visual no front). Nota vem da ESTRUTURA
 * (mode:'ast' + requireCall) — nunca de pixel. Projeto livre usa validationModeOverride 'manual'.
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

const TRAIL_SLUG = 'js-programacao-visual-p5'
const TRAIL_TITLE = 'JavaScript: Desenhando com p5.js'
const TRAIL_DESC =
  'Trilha opcional de programação visual: setup/draw, cores, formas, animação e interatividade com p5.js. Diferencial de engajamento, fora do caminho obrigatório.'
const TRAIL_ORDER = 200

type AstRule = { kind: 'requireCall'; name: string }

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
  renderMode?: 'js' | 'p5'
  validationModeOverride?: 'auto' | 'auto_review' | 'manual'
  testCases: {
    input: unknown
    expected: unknown
    description: string
    mode?: 'stdout' | 'ast'
    astRule?: AstRule
  }[]
}

const CALL = (name: string) => ({
  input: null as null,
  expected: true as const,
  description: `usa ${name}()`,
  mode: 'ast' as const,
  astRule: { kind: 'requireCall' as const, name },
})

const trilhaModules: Modulo[] = [
  {
    kind: 'lesson',
    title: 'Lição 1 — O que é p5.js: setup, draw, createCanvas',
    concept:
      'p5.js é uma biblioteca para desenhar e animar. `setup()` roda uma vez no início (crie a tela com `createCanvas(largura, altura)`); `draw()` roda a cada quadro (para animação). Você verá o desenho na prévia ao clicar em "Rodar desenho".',
    exampleCode: 'function setup() {\n  createCanvas(400, 400)\n}',
    vocabulary: ['setup', 'draw', 'createCanvas'],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: 'P.1 Sua primeira tela',
    concept: 'Crie a tela dentro de `setup()` com `createCanvas`.',
    exampleCode: 'function setup() {\n  createCanvas(400, 400)\n}',
    vocabulary: ['setup', 'createCanvas'],
    difficulty: 'easy',
    baseXp: 10,
    description: 'Crie uma tela de 400×400 dentro de `setup()` usando `createCanvas`.',
    starterCode: 'function setup() {\n  // createCanvas(400, 400)\n}\n',
    renderMode: 'p5',
    testCases: [CALL('createCanvas')],
  },
  {
    kind: 'lesson',
    title: 'Lição 2 — Cores: background, fill, stroke, noStroke',
    concept:
      '`background(r, g, b)` pinta o fundo; `fill(r, g, b)` define a cor de preenchimento das formas; `stroke(...)` a cor da borda e `noStroke()` tira a borda. As cores vão de 0 a 255.',
    exampleCode: 'background(200)\nfill(255, 0, 0)   // vermelho',
    vocabulary: ['background', 'fill', 'stroke', 'noStroke'],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: 'P.2 Fundo colorido + um retângulo',
    concept: 'Pinte o fundo, escolha uma cor de preenchimento e desenhe um retângulo com `rect(x, y, w, h)`.',
    exampleCode: 'background(220)\nfill(0, 0, 255)\nrect(50, 50, 100, 80)',
    vocabulary: ['background', 'fill', 'rect'],
    difficulty: 'easy',
    baseXp: 10,
    description: 'Em `setup()`: crie a tela, pinte o fundo (`background`), escolha uma cor (`fill`) e desenhe um `rect`.',
    starterCode: 'function setup() {\n  createCanvas(400, 400)\n  // background, fill, rect\n}\n',
    renderMode: 'p5',
    testCases: [CALL('createCanvas'), CALL('background'), CALL('fill'), CALL('rect')],
  },
  {
    kind: 'lesson',
    title: 'Lição 3 — Formas e coordenadas',
    concept:
      'A tela tem coordenadas: x cresce para a DIREITA, y cresce para BAIXO (o topo é y=0). Formas: `ellipse(x, y, w, h)` (círculo/oval), `rect`, `triangle(x1,y1,x2,y2,x3,y3)`, `line(x1,y1,x2,y2)`.',
    exampleCode: 'ellipse(200, 200, 80, 80)   // círculo no centro',
    vocabulary: ['ellipse', 'rect', 'triangle', 'coordenadas'],
    difficulty: 'easy',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: 'P.3 Desenhe um rosto',
    concept: 'Use `ellipse` para o rosto e os olhos (posições diferentes).',
    exampleCode: 'ellipse(200, 200, 200, 200)   // rosto',
    vocabulary: ['ellipse'],
    difficulty: 'medium',
    baseXp: 15,
    description: 'Em `setup()`: crie a tela e desenhe um rosto com `ellipse` (o rosto e pelo menos um olho).',
    starterCode: 'function setup() {\n  createCanvas(400, 400)\n  // use ellipse para o rosto e os olhos\n}\n',
    renderMode: 'p5',
    testCases: [CALL('createCanvas'), CALL('ellipse')],
  },
  {
    kind: 'challenge',
    title: 'P.4 Desenhe uma casinha',
    concept: 'Um `rect` para a parede e um `triangle` para o telhado.',
    exampleCode: 'rect(150, 200, 100, 100)\ntriangle(140, 200, 260, 200, 200, 130)',
    vocabulary: ['rect', 'triangle'],
    difficulty: 'medium',
    baseXp: 15,
    description: 'Em `setup()`: crie a tela e desenhe uma casinha com `rect` (parede) e `triangle` (telhado).',
    starterCode: 'function setup() {\n  createCanvas(400, 400)\n  // rect + triangle\n}\n',
    renderMode: 'p5',
    testCases: [CALL('createCanvas'), CALL('rect'), CALL('triangle')],
  },
  {
    kind: 'lesson',
    title: 'Lição 4 — Variáveis e animação: draw() roda a cada quadro',
    concept:
      'A função `draw()` roda repetidamente (muitos quadros por segundo). Mudando uma variável a cada quadro (ex.: a posição x de uma bolinha), você cria animação. Use `background` no início do `draw` para "limpar" o quadro anterior.',
    exampleCode: 'let x = 0\nfunction draw() {\n  background(220)\n  ellipse(x, 200, 40, 40)\n  x = x + 1\n}',
    vocabulary: ['draw', 'variável', 'animação'],
    difficulty: 'medium',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: 'P.5 Bolinha que se move',
    concept: 'Defina `draw()` e desenhe uma `ellipse` cuja posição muda a cada quadro.',
    exampleCode: 'function draw() {\n  background(220)\n  ellipse(x, 200, 40, 40)\n  x++\n}',
    vocabulary: ['draw', 'ellipse', 'animação'],
    difficulty: 'medium',
    baseXp: 20,
    description: 'Crie a tela em `setup()` e, em `draw()`, desenhe uma `ellipse` que se move (mude a posição a cada quadro).',
    starterCode: 'let x = 0\n\nfunction setup() {\n  createCanvas(400, 400)\n}\n\nfunction draw() {\n  // background + ellipse(x, ...) + mudar x\n}\n',
    renderMode: 'p5',
    testCases: [CALL('createCanvas'), CALL('draw'), CALL('ellipse')],
  },
  {
    kind: 'lesson',
    title: 'Lição 5 — Interatividade: mousePressed, mouseX/mouseY, keyPressed',
    concept:
      '`mousePressed()` roda quando o mouse é clicado; `mouseX`/`mouseY` dão a posição do mouse. `keyPressed()` roda ao apertar uma tecla. Assim o desenho responde à pessoa.',
    exampleCode: 'function mousePressed() {\n  ellipse(mouseX, mouseY, 30, 30)\n}',
    vocabulary: ['mousePressed', 'mouseX', 'mouseY', 'keyPressed'],
    difficulty: 'medium',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: 'P.6 Círculo onde o mouse clicar',
    concept: 'Defina `mousePressed()` e desenhe uma `ellipse` em `mouseX`, `mouseY`.',
    exampleCode: 'function mousePressed() {\n  ellipse(mouseX, mouseY, 30, 30)\n}',
    vocabulary: ['mousePressed', 'mouseX', 'mouseY', 'ellipse'],
    difficulty: 'medium',
    baseXp: 20,
    description: 'Crie a tela em `setup()` e, em `mousePressed()`, desenhe uma `ellipse` na posição do mouse.',
    starterCode: 'function setup() {\n  createCanvas(400, 400)\n}\n\nfunction mousePressed() {\n  // ellipse(mouseX, mouseY, ...)\n}\n',
    renderMode: 'p5',
    testCases: [CALL('createCanvas'), CALL('mousePressed'), CALL('ellipse')],
  },
  {
    kind: 'challenge',
    title: 'P.7 Muda a cor de fundo ao apertar tecla',
    concept: 'Defina `keyPressed()` e troque o `background`.',
    exampleCode: 'function keyPressed() {\n  background(random(255), random(255), random(255))\n}',
    vocabulary: ['keyPressed', 'background'],
    difficulty: 'medium',
    baseXp: 20,
    description: 'Crie a tela em `setup()` e, em `keyPressed()`, troque a cor do fundo com `background`.',
    starterCode: 'function setup() {\n  createCanvas(400, 400)\n}\n\nfunction keyPressed() {\n  // background(...)\n}\n',
    renderMode: 'p5',
    testCases: [CALL('createCanvas'), CALL('keyPressed'), CALL('background')],
  },
  {
    kind: 'lesson',
    title: 'Lição 6 — Repetição para desenhar padrões',
    concept: 'Um `for` no desenho repete uma forma em posições diferentes — ótimo para grades, listras e padrões.',
    exampleCode: 'for (let x = 0; x < 400; x += 50) {\n  rect(x, 100, 40, 40)\n}',
    vocabulary: ['for', 'padrão'],
    difficulty: 'medium',
    baseXp: 5,
    description: '',
    starterCode: '',
    testCases: [],
  },
  {
    kind: 'challenge',
    title: 'P.8 Grade de quadrados',
    concept: 'Use dois `for` (linhas e colunas) desenhando um `rect` em cada posição.',
    exampleCode: 'for (let y = 0; y < 400; y += 50)\n  for (let x = 0; x < 400; x += 50)\n    rect(x, y, 40, 40)',
    vocabulary: ['for', 'rect'],
    difficulty: 'hard',
    baseXp: 25,
    description: 'Em `setup()`: crie a tela e desenhe uma grade de quadrados usando `for` e `rect`.',
    starterCode: 'function setup() {\n  createCanvas(400, 400)\n  // for aninhado + rect\n}\n',
    renderMode: 'p5',
    testCases: [CALL('createCanvas'), CALL('rect')],
  },
  {
    kind: 'challenge',
    title: 'P.9 [Projeto livre] Seu desenho ou mini-animação',
    concept: 'Solte a criatividade: use as primitivas que aprendeu para fazer um desenho ou uma mini-animação sua. Um humano (o gestor) avalia.',
    exampleCode: '// combine formas, cores, draw() e interatividade como quiser',
    vocabulary: ['createCanvas', 'projeto livre'],
    difficulty: 'hard',
    baseXp: 30,
    description: 'Crie um desenho ou mini-animação livre com p5.js. Vale tudo que você aprendeu. Este desafio é avaliado manualmente pelo gestor.',
    starterCode: 'function setup() {\n  createCanvas(400, 400)\n}\n\nfunction draw() {\n  // sua arte aqui\n}\n',
    renderMode: 'p5',
    validationModeOverride: 'manual',
    testCases: [],
  },
]

async function seedTrilha() {
  console.log('🌱  Semeando/atualizando trilha:', TRAIL_TITLE)

  let [trail] = await db.select({ id: trails.id }).from(trails).where(eq(trails.slug, TRAIL_SLUG)).limit(1)

  if (!trail) {
    ;[trail] = await db
      .insert(trails)
      .values({ slug: TRAIL_SLUG, title: TRAIL_TITLE, description: TRAIL_DESC, language: 'javascript', order: TRAIL_ORDER })
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

    const [ch] = await db.select({ id: challenges.id }).from(challenges).where(eq(challenges.moduleId, mod!.id)).limit(1)

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
        renderMode: m.renderMode ?? 'p5',
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
          renderMode: m.renderMode ?? 'p5',
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
