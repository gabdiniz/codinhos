import { useEffect, useRef } from 'react'
import * as Blockly from 'blockly'
import { javascriptGenerator, Order } from 'blockly/javascript'
import * as ptBr from 'blockly/msg/pt-br'
import styles from './BlocklyEditor.module.css'

// Locale pt-br para os blocos (Sprint 7.2 — editor de blocos, fase a: modo isolado).
Blockly.setLocale(ptBr as unknown as Record<string, string>)

// `text_print` por padrão gera window.alert — no sandbox queremos console.log,
// que é o que o painel de resultado e os testes do desafio observam.
javascriptGenerator.forBlock['text_print'] = (block, generator) => {
  const msg = generator.valueToCode(block, 'TEXT', Order.NONE) || "''"
  return `console.log(${msg});\n`
}

// Toolbox limitado a lógica básica (fase a). Ampliar conforme novos módulos.
const TOOLBOX = {
  kind: 'categoryToolbox',
  contents: [
    {
      kind: 'category',
      name: 'Lógica',
      colour: '210',
      contents: [
        { kind: 'block', type: 'controls_if' },
        { kind: 'block', type: 'logic_compare' },
        { kind: 'block', type: 'logic_operation' },
        { kind: 'block', type: 'logic_boolean' },
        { kind: 'block', type: 'logic_negate' },
      ],
    },
    {
      kind: 'category',
      name: 'Laços',
      colour: '120',
      contents: [
        { kind: 'block', type: 'controls_repeat_ext', inputs: { TIMES: { shadow: { type: 'math_number', fields: { NUM: 10 } } } } },
        { kind: 'block', type: 'controls_whileUntil' },
        { kind: 'block', type: 'controls_for', inputs: {
          FROM: { shadow: { type: 'math_number', fields: { NUM: 1 } } },
          TO: { shadow: { type: 'math_number', fields: { NUM: 10 } } },
          BY: { shadow: { type: 'math_number', fields: { NUM: 1 } } },
        } },
      ],
    },
    {
      kind: 'category',
      name: 'Matemática',
      colour: '230',
      contents: [
        { kind: 'block', type: 'math_number', fields: { NUM: 0 } },
        { kind: 'block', type: 'math_arithmetic' },
        { kind: 'block', type: 'math_modulo' },
      ],
    },
    {
      kind: 'category',
      name: 'Texto',
      colour: '160',
      contents: [
        { kind: 'block', type: 'text' },
        { kind: 'block', type: 'text_join' },
        { kind: 'block', type: 'text_length' },
        { kind: 'block', type: 'text_print' },
      ],
    },
    { kind: 'category', name: 'Variáveis', colour: '330', custom: 'VARIABLE' },
    { kind: 'category', name: 'Funções', colour: '290', custom: 'PROCEDURE' },
  ],
}

interface BlocklyEditorProps {
  /** Recebe o JavaScript gerado a partir dos blocos a cada alteração. */
  onChange: (code: string) => void
}

export function BlocklyEditor({ onChange }: BlocklyEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  useEffect(() => {
    if (!containerRef.current) return

    const workspace = Blockly.inject(containerRef.current, {
      toolbox: TOOLBOX,
      trashcan: true,
      renderer: 'zelos',
      grid: { spacing: 20, length: 3, colour: 'rgba(255,255,255,0.06)', snap: true },
      zoom: { controls: true, wheel: true, startScale: 0.9 },
      move: { scrollbars: true, drag: true, wheel: false },
    })

    const handleChange = () => {
      // Ignora eventos de UI puros (seleção, scroll) — só recomputa em mudanças reais
      const code = javascriptGenerator.workspaceToCode(workspace)
      onChangeRef.current(code)
    }
    workspace.addChangeListener(handleChange)

    // Reposiciona ao redimensionar o container
    const ro = new ResizeObserver(() => Blockly.svgResize(workspace))
    ro.observe(containerRef.current)

    return () => {
      ro.disconnect()
      workspace.dispose()
    }
  }, [])

  return <div ref={containerRef} className={styles.blocklyContainer} />
}
