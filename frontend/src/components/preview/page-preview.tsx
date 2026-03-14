import { useState, useCallback, useEffect } from 'react'
import { Monitor, Smartphone, Tablet, MousePointer2, Download, Undo2, Redo2 } from 'lucide-react'
import { useAppStore } from '@/stores/app-store'
import { ElementorRenderer } from './ElementorRenderer'
import { ElementEditor } from './element-editor'
import { useTemplateHistory } from '@/hooks/use-template-history'
import { toast } from '@/stores/toast-store'
import type { Project } from '@/hooks/use-projects'
import type { ElementorTemplate, ElementorElement } from '@/types/elementor'

interface PagePreviewProps {
  project: Project | null
  onPageUpdate: (page: ElementorTemplate) => void
}

export function PagePreview({ project, onPageUpdate }: PagePreviewProps) {
  const { viewMode, setViewMode, editMode, toggleEditMode } = useAppStore()
  const page = project?.current_template as ElementorTemplate | null
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null)
  const { pushState, undo, redo, canUndo, canRedo, clear } = useTemplateHistory()

  const selectedElement = selectedElementId && page ? findElement(page.content, selectedElementId) : null

  // Clear history when project changes
  useEffect(() => {
    clear()
  }, [project?.id, clear])

  // Tracked page update — pushes current state before applying change
  const handlePageUpdate = useCallback((newTemplate: ElementorTemplate) => {
    if (page) pushState(page)
    onPageUpdate(newTemplate)
  }, [page, pushState, onPageUpdate])

  function handleTextEdit(elementId: string, field: string, value: string) {
    if (!page) return
    function updateElement(elements: ElementorElement[]): ElementorElement[] {
      return elements.map((el) => {
        if (el.id === elementId) {
          return { ...el, settings: { ...el.settings, [field]: value } }
        }
        if (el.elements.length > 0) {
          return { ...el, elements: updateElement(el.elements) }
        }
        return el
      })
    }
    handlePageUpdate({ ...page, content: updateElement(page.content) })
  }

  const handleElementClick = useCallback((e: React.MouseEvent) => {
    if (!editMode) return

    const target = e.target as HTMLElement
    const elementWrapper = target.closest('[data-element-id]')
    if (elementWrapper) {
      e.stopPropagation()
      const id = elementWrapper.getAttribute('data-element-id')
      setSelectedElementId(id)
    }
  }, [editMode])

  function handleExport() {
    if (!page) return
    const blob = new Blob([JSON.stringify(page, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${page.title || 'template'}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Template exportado!')
  }

  function handleUndo() {
    if (!page) return
    const prev = undo(page)
    if (prev) {
      onPageUpdate(prev)
      toast.info('Ação desfeita')
    }
  }

  function handleRedo() {
    if (!page) return
    const next = redo(page)
    if (next) {
      onPageUpdate(next)
      toast.info('Ação refeita')
    }
  }

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const isMod = e.metaKey || e.ctrlKey

      // Ctrl+Z — Undo
      if (isMod && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        handleUndo()
        return
      }

      // Ctrl+Shift+Z or Ctrl+Y — Redo
      if (isMod && (e.key === 'Z' || e.key === 'y') && (e.shiftKey || e.key === 'y')) {
        e.preventDefault()
        handleRedo()
        return
      }

      // Ctrl+S — Export
      if (isMod && e.key === 's') {
        e.preventDefault()
        handleExport()
        return
      }

      // Ctrl+E — Toggle edit mode
      if (isMod && e.key === 'e') {
        e.preventDefault()
        toggleEditMode()
        if (editMode) setSelectedElementId(null)
        return
      }

      // Delete/Backspace — Delete selected element
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElement && editMode) {
        // Don't trigger if user is typing in an input
        const active = document.activeElement
        if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || (active as HTMLElement).isContentEditable)) return
        e.preventDefault()
        // Delete logic is in ElementEditor, just deselect
        setSelectedElementId(null)
        return
      }

      // Escape — Deselect / Exit edit mode
      if (e.key === 'Escape') {
        if (selectedElementId) {
          setSelectedElementId(null)
        } else if (editMode) {
          toggleEditMode()
        }
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  })

  if (!page) {
    return (
      <div className="flex-1 flex items-center justify-center text-text-muted">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-bg-tertiary border border-border flex items-center justify-center mx-auto mb-4">
            <Monitor size={28} className="text-text-muted" />
          </div>
          <p className="text-sm">O preview aparecerá aqui</p>
          <p className="text-xs mt-1">Envie um prompt no chat para gerar uma página</p>
          <div className="mt-4 text-[10px] text-text-muted space-y-0.5">
            <p>Ctrl+E — Alternar modo edição</p>
            <p>Ctrl+S — Exportar template</p>
            <p>Ctrl+Z / Ctrl+Shift+Z — Desfazer / Refazer</p>
          </div>
        </div>
      </div>
    )
  }

  const widthMap = { desktop: '100%', tablet: '768px', mobile: '375px' }

  return (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-bg-secondary/30">
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted">Preview:</span>
            <span className="text-xs font-medium text-text-primary">{page.title}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
              Elementor
            </span>
          </div>
          <div className="flex items-center gap-3">
            {/* Undo/Redo */}
            {editMode && (
              <div className="flex items-center gap-1">
                <button
                  onClick={handleUndo}
                  disabled={!canUndo()}
                  className="p-1.5 rounded-lg border border-border text-text-muted hover:text-text-secondary hover:border-primary/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Desfazer (Ctrl+Z)"
                >
                  <Undo2 size={13} />
                </button>
                <button
                  onClick={handleRedo}
                  disabled={!canRedo()}
                  className="p-1.5 rounded-lg border border-border text-text-muted hover:text-text-secondary hover:border-primary/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Refazer (Ctrl+Shift+Z)"
                >
                  <Redo2 size={13} />
                </button>
              </div>
            )}

            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border border-border text-text-muted hover:text-text-secondary hover:border-primary/20 transition-all"
              title="Exportar JSON (Ctrl+S)"
            >
              <Download size={13} />
              <span>Exportar</span>
            </button>
            <button
              onClick={() => {
                toggleEditMode()
                if (editMode) setSelectedElementId(null)
              }}
              className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border transition-all ${
                editMode
                  ? 'bg-primary/10 border-primary/40 text-primary'
                  : 'border-border text-text-muted hover:text-text-secondary hover:border-primary/20'
              }`}
              title="Editar (Ctrl+E)"
            >
              <MousePointer2 size={13} />
              <span>{editMode ? 'Editando' : 'Editar'}</span>
            </button>
            <div className="flex items-center gap-1 bg-bg-primary rounded-lg p-0.5 border border-border">
              {([
                { mode: 'desktop' as const, icon: Monitor },
                { mode: 'tablet' as const, icon: Tablet },
                { mode: 'mobile' as const, icon: Smartphone },
              ]).map(({ mode, icon: Icon }) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`p-1.5 rounded-md transition-all ${
                    viewMode === mode ? 'bg-bg-tertiary text-primary' : 'text-text-muted hover:text-text-secondary'
                  }`}
                >
                  <Icon size={14} />
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto bg-bg-primary/50 p-4" onClick={handleElementClick}>
          <div
            className="mx-auto bg-bg-primary rounded-lg border border-border overflow-hidden shadow-xl transition-all duration-300 animate-slide-up"
            style={{ maxWidth: widthMap[viewMode], color: '#e0e0e0' }}
          >
            <ElementorRenderer
              elements={page.content}
              editMode={editMode}
              onTextEdit={handleTextEdit}
              selectedElementId={selectedElementId}
              onElementSelect={editMode ? setSelectedElementId : undefined}
            />
          </div>
        </div>
      </div>

      {/* Editor Panel */}
      {editMode && selectedElement && page && (
        <ElementEditor
          element={selectedElement}
          template={page}
          onUpdate={handlePageUpdate}
          onClose={() => setSelectedElementId(null)}
        />
      )}
    </div>
  )
}

function findElement(elements: ElementorElement[], id: string): ElementorElement | null {
  for (const el of elements) {
    if (el.id === id) return el
    if (el.elements.length > 0) {
      const found = findElement(el.elements, id)
      if (found) return found
    }
  }
  return null
}
