import { createContext, useContext, useState } from 'react'

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface ClassInfo {
  id: string
  name: string
}

interface ClassContextValue {
  currentClass: ClassInfo | null
  setCurrentClass: (cls: ClassInfo) => void
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ClassContext = createContext<ClassContextValue | null>(null)

export function ClassProvider({ children }: { children: React.ReactNode }) {
  const [currentClass, setCurrentClass] = useState<ClassInfo | null>(null)

  return (
    <ClassContext.Provider value={{ currentClass, setCurrentClass }}>
      {children}
    </ClassContext.Provider>
  )
}

export function useClass() {
  const ctx = useContext(ClassContext)
  if (!ctx) throw new Error('useClass deve ser usado dentro de ClassProvider')
  return ctx
}
