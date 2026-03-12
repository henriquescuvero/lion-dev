import { useEffect } from 'react'
import { X, RotateCcw } from 'lucide-react'
import { useTemplateVersions } from '@/hooks/use-template'
import type { ElementorTemplate } from '@/types/elementor'

interface VersionHistoryModalProps {
  projectId: string
  onClose: () => void
  onRevert: (template: ElementorTemplate) => void
}

export function VersionHistoryModal({ projectId, onClose, onRevert }: VersionHistoryModalProps) {
  const { versions, loading, fetchVersions } = useTemplateVersions(projectId)

  useEffect(() => {
    fetchVersions()
  }, [fetchVersions])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md mx-4 bg-bg-secondary border border-border rounded-xl shadow-2xl max-h-[70vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <h2 className="text-sm font-semibold text-text-primary">Histórico de Versões</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-bg-tertiary text-text-muted transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 rounded-lg bg-bg-tertiary/50 animate-pulse" />
              ))}
            </div>
          ) : versions.length === 0 ? (
            <div className="p-8 text-center text-text-muted">
              <p className="text-sm">Nenhuma versão salva</p>
              <p className="text-xs mt-1">As versões são criadas automaticamente quando o template é gerado</p>
            </div>
          ) : (
            versions.map((v) => (
              <div
                key={v.id}
                className="flex items-center justify-between px-5 py-3 border-b border-border/50 hover:bg-bg-tertiary/30 transition-colors"
              >
                <div>
                  <p className="text-xs font-medium text-text-primary">
                    v{v.version_number} — {v.title || 'Sem título'}
                  </p>
                  <p className="text-[10px] text-text-muted mt-0.5">
                    {new Date(v.created_at).toLocaleString('pt-BR')}
                  </p>
                </div>
                <button
                  onClick={() => onRevert(v.template)}
                  className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border border-border text-text-secondary hover:text-primary hover:border-primary/40 transition-all"
                >
                  <RotateCcw size={11} />
                  Restaurar
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
