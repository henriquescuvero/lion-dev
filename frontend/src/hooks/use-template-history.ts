import { useCallback, useRef } from 'react'
import type { ElementorTemplate } from '@/types/elementor'

const MAX_HISTORY = 50

interface HistoryState {
  past: ElementorTemplate[]
  future: ElementorTemplate[]
}

/**
 * Undo/Redo hook for template editing.
 * Tracks template state changes and allows undo (Ctrl+Z) / redo (Ctrl+Shift+Z).
 */
export function useTemplateHistory() {
  const historyRef = useRef<HistoryState>({ past: [], future: [] })

  const pushState = useCallback((template: ElementorTemplate) => {
    const h = historyRef.current
    h.past = [...h.past.slice(-(MAX_HISTORY - 1)), template]
    h.future = [] // clear redo stack on new action
  }, [])

  const undo = useCallback((currentTemplate: ElementorTemplate): ElementorTemplate | null => {
    const h = historyRef.current
    if (h.past.length === 0) return null

    const previous = h.past[h.past.length - 1]
    h.past = h.past.slice(0, -1)
    h.future = [currentTemplate, ...h.future]
    return previous
  }, [])

  const redo = useCallback((currentTemplate: ElementorTemplate): ElementorTemplate | null => {
    const h = historyRef.current
    if (h.future.length === 0) return null

    const next = h.future[0]
    h.future = h.future.slice(1)
    h.past = [...h.past, currentTemplate]
    return next
  }, [])

  const canUndo = useCallback(() => historyRef.current.past.length > 0, [])
  const canRedo = useCallback(() => historyRef.current.future.length > 0, [])

  const clear = useCallback(() => {
    historyRef.current = { past: [], future: [] }
  }, [])

  return { pushState, undo, redo, canUndo, canRedo, clear }
}
