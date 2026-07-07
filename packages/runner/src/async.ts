/**
 * Suporte a código assíncrono nos desafios (async/await, Promises).
 *
 * O runner é, por natureza, "entrada → saída". Para desafios async, o retorno
 * da função é uma Promise: precisamos aguardá-la antes de comparar. Isto é
 * puro e compartilhado entre backend (node:vm) e worker do front, para que a
 * espera e o timeout se comportem igual nos dois lados.
 */

/** Detecta um "thenable" (Promise ou objeto com .then). */
export function isThenable(value: unknown): value is Promise<unknown> {
  return (
    value != null &&
    (typeof value === 'object' || typeof value === 'function') &&
    typeof (value as { then?: unknown }).then === 'function'
  )
}

// setTimeout/clearTimeout existem tanto no Node quanto no navegador; pegamos do
// globalThis para não depender das libs DOM/node no tsconfig do pacote.
const timers = globalThis as unknown as {
  setTimeout: (cb: () => void, ms: number) => unknown
  clearTimeout: (id: unknown) => void
}

/**
 * Se `value` for uma Promise, aguarda sua resolução com um limite de tempo.
 * Uma Promise que não resolve em `timeoutMs` rejeita com erro de timeout
 * (evita que o teste trave). Valores síncronos passam direto.
 */
export async function resolveMaybeAsync(value: unknown, timeoutMs = 3000): Promise<unknown> {
  if (!isThenable(value)) return value

  let timer: unknown
  const timeout = new Promise<never>((_, reject) => {
    timer = timers.setTimeout(
      () => reject(new Error(`Tempo limite excedido: a Promise não resolveu em ${timeoutMs}ms.`)),
      timeoutMs,
    )
  })

  try {
    return await Promise.race([value, timeout])
  } finally {
    timers.clearTimeout(timer)
  }
}
