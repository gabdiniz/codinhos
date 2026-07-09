import { describe, expect, it } from 'vitest'
import { checkAstRule, stripCommentsAndStrings } from './index.js'

describe('stripCommentsAndStrings', () => {
  it('remove comentários de linha e de bloco', () => {
    expect(stripCommentsAndStrings('a // for\nb')).not.toMatch(/for/)
    expect(stripCommentsAndStrings('a /* while */ b')).not.toMatch(/while/)
  })
  it('remove o conteúdo de strings', () => {
    expect(stripCommentsAndStrings('const x = "for e while"')).not.toMatch(/for|while/)
  })
})

describe('checkAstRule', () => {
  it('requireRecursion detecta função que chama a si mesma', () => {
    expect(checkAstRule('function fat(n){ return n<=1?1:n*fat(n-1) }', 'fat', { kind: 'requireRecursion' }).passed).toBe(true)
    expect(checkAstRule('function fat(n){ let r=1; for(let i=2;i<=n;i++) r*=i; return r }', 'fat', { kind: 'requireRecursion' }).passed).toBe(false)
  })
  it('requireRecursion funciona em arrow', () => {
    expect(checkAstRule('const fat = (n) => n<=1?1:n*fat(n-1)', 'fat', { kind: 'requireRecursion' }).passed).toBe(true)
  })
  it('forbidLoops reprova for/while/forEach', () => {
    expect(checkAstRule('function f(){ for(let i=0;i<3;i++){} }', 'f', { kind: 'forbidLoops' }).passed).toBe(false)
    expect(checkAstRule('function f(){ while(true){} }', 'f', { kind: 'forbidLoops' }).passed).toBe(false)
    expect(checkAstRule('function f(a){ a.forEach((x) => x) }', 'f', { kind: 'forbidLoops' }).passed).toBe(false)
  })
  it('forbidLoops NÃO falseia com "for" em comentário, string ou identificador', () => {
    expect(checkAstRule('function fat(n){ // resolva sem for\n return n<=1?1:n*fat(n-1) }', 'fat', { kind: 'forbidLoops' }).passed).toBe(true)
    expect(checkAstRule('function f(){ return "for e while" }', 'f', { kind: 'forbidLoops' }).passed).toBe(true)
    expect(checkAstRule('function f(){ let formato = 1; return formato }', 'f', { kind: 'forbidLoops' }).passed).toBe(true)
  })
  it('requireMethod / forbidMethod', () => {
    expect(checkAstRule('function f(a){ return a.map((x) => x*2) }', 'f', { kind: 'requireMethod', name: 'map' }).passed).toBe(true)
    expect(checkAstRule('function f(a){ return a }', 'f', { kind: 'requireMethod', name: 'map' }).passed).toBe(false)
    expect(checkAstRule('function f(a){ return a.map((x) => x) }', 'f', { kind: 'forbidMethod', name: 'map' }).passed).toBe(false)
  })
  it('requireCall detecta chamada solta (p5) e não confunde com método homônimo', () => {
    expect(checkAstRule('function setup(){ createCanvas(400,400) }', null, { kind: 'requireCall', name: 'createCanvas' }).passed).toBe(true)
    expect(checkAstRule('function draw(){ ellipse(50,50,80,80) }', null, { kind: 'requireCall', name: 'ellipse' }).passed).toBe(true)
    expect(checkAstRule('function draw(){ background(200) }', null, { kind: 'requireCall', name: 'ellipse' }).passed).toBe(false)
    expect(checkAstRule('function f(o){ return o.ellipse() }', 'f', { kind: 'requireCall', name: 'ellipse' }).passed).toBe(false)
  })
  it('requireCall não falseia com "ellipse" em comentário/string nem prefixo', () => {
    expect(checkAstRule('function draw(){ /* use ellipse */ background(0) }', null, { kind: 'requireCall', name: 'ellipse' }).passed).toBe(false)
    expect(checkAstRule('function draw(){ myEllipse(1) }', null, { kind: 'requireCall', name: 'ellipse' }).passed).toBe(false)
  })
  it('forbidCall reprova quando a função proibida é chamada', () => {
    expect(checkAstRule('function draw(){ rect(0,0,10,10) }', null, { kind: 'forbidCall', name: 'rect' }).passed).toBe(false)
    expect(checkAstRule('function draw(){ ellipse(0,0,10,10) }', null, { kind: 'forbidCall', name: 'rect' }).passed).toBe(true)
  })
})
