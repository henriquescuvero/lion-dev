import { Monitor, Smartphone, Tablet, MousePointer2 } from 'lucide-react'
import { useState } from 'react'
import type { ElementorTemplate, ElementorElement } from '../../types'
import { ElementorRenderer } from './ElementorRenderer'

interface PagePreviewProps {
  page: ElementorTemplate | null
  editMode: boolean
  onToggleEditMode: () => void
  onPageUpdate: (page: ElementorTemplate) => void
}

type ViewMode = 'desktop' | 'tablet' | 'mobile'

export function PagePreview({ page, editMode, onToggleEditMode, onPageUpdate }: PagePreviewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('desktop')

  if (!page) {
    return (
      <div className="flex-1 flex items-center justify-center text-text-muted">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-bg-tertiary border border-border flex items-center justify-center mx-auto mb-4">
            <Monitor size={28} className="text-text-muted" />
          </div>
          <p className="text-sm">O preview aparecera aqui</p>
          <p className="text-xs mt-1">Envie um prompt no chat para gerar uma pagina</p>
        </div>
      </div>
    )
  }

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

    onPageUpdate({ ...page, content: updateElement(page.content) })
  }

  const widthMap: Record<ViewMode, string> = {
    desktop: '100%',
    tablet: '768px',
    mobile: '375px',
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-bg-secondary/30">
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted">Preview:</span>
          <span className="text-xs font-medium text-text-primary">{page.title}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent/10 text-accent border border-accent/20">
            Elementor
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleEditMode}
            className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border transition-all ${
              editMode
                ? 'bg-accent/10 border-accent/40 text-accent'
                : 'border-border text-text-muted hover:text-text-secondary hover:border-accent/20'
            }`}
            title={editMode ? 'Desativar edição' : 'Ativar edição visual'}
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
                  viewMode === mode
                    ? 'bg-bg-tertiary text-accent'
                    : 'text-text-muted hover:text-text-secondary'
                }`}
              >
                <Icon size={14} />
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto bg-bg-primary/50 p-4">
        <div
          className="mx-auto bg-bg-primary rounded-lg border border-border overflow-hidden shadow-xl transition-all duration-300 animate-slide-up"
          style={{ maxWidth: widthMap[viewMode], color: '#e0e0e0' }}
        >
          <ElementorRenderer
            elements={page.content}
            editMode={editMode}
            onTextEdit={handleTextEdit}
          />
        </div>
      </div>
    </div>
  )
}
