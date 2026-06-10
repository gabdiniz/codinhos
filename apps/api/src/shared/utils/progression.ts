type ProgressionMode = 'free' | 'sequential' | 'controlled'
type ModuleStatus = 'locked' | 'available' | 'completed'

/**
 * Calcula o status efetivo de cada módulo com base no progressionMode da turma
 * e nos registros existentes em module_progress.
 *
 * - free:       todos available (exceto os já completed)
 * - sequential: primeiro available; cada próximo só available se o anterior foi completed
 * - controlled: locked por padrão; só available/completed se houver registro explícito
 */
export function computeModuleStatuses(
  orderedModules: { id: string; order: number }[],
  progressMap: Map<string, ModuleStatus>,
  progressionMode: ProgressionMode,
): Map<string, ModuleStatus> {
  const result = new Map<string, ModuleStatus>()
  let prevCompleted = false

  for (let i = 0; i < orderedModules.length; i++) {
    const mod = orderedModules[i]!
    const existing = progressMap.get(mod.id)

    if (existing === 'completed') {
      result.set(mod.id, 'completed')
      prevCompleted = true
    } else if (existing === 'available') {
      result.set(mod.id, 'available')
      prevCompleted = false
    } else {
      let status: ModuleStatus
      if (progressionMode === 'free') {
        status = 'available'
      } else if (progressionMode === 'sequential') {
        status = i === 0 || prevCompleted ? 'available' : 'locked'
      } else {
        status = 'locked'
      }
      result.set(mod.id, status)
      prevCompleted = false
    }
  }

  return result
}
