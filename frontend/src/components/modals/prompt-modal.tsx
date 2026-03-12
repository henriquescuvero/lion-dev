import { useState } from 'react'
import { X, RotateCcw, Copy, Save } from 'lucide-react'
import { DEFAULT_SYSTEM_PROMPT } from '@/services/ai'
import { copyToClipboard } from '@/lib/utils'
import type { Project } from '@/hooks/use-projects'

interface PromptModalProps {
  project: Project
  onClose: () => void
  onSave: (prompt: string) => Promise<void>
}

export function PromptModal({ project, onClose, onSave }: PromptModalProps) {
  const [prompt, setPrompt] = useState(project.system_prompt || DEFAULT_SYSTEM_PROMPT)
  const [saved, setSaved] = useState(false)
  const isCustom = prompt !== DEFAULT_SYSTEM_PROMPT

  async function handleSave() {
    await onSave(prompt)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function handleReset() {
    setPrompt(DEFAULT_SYSTEM_PROMPT)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-2xl mx-4 bg-bg-secondary border border-border rounded-xl shadow-2xl max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-text-primary">Prompt do Agente</h2>
            {isCustom && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                customizado
              </span>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-bg-tertiary text-text-muted transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full h-[400px] bg-bg-primary border border-border rounded-lg p-4 text-xs text-text-secondary font-mono leading-relaxed resize-none focus:outline-none focus:border-primary/40"
          />
        </div>
        <div className="flex items-center justify-between px-5 py-3 border-t border-border">
          <span className="text-[10px] text-text-muted">{prompt.length} caracteres</span>
          <div className="flex items-center gap-2">
            <button onClick={handleReset} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-border text-text-secondary hover:text-text-primary transition-colors">
              <RotateCcw size={12} /> Resetar
            </button>
            <button onClick={() => copyToClipboard(prompt)} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-border text-text-secondary hover:text-text-primary transition-colors">
              <Copy size={12} /> Copiar
            </button>
            <button onClick={handleSave} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-primary text-bg-primary font-medium hover:bg-primary-hover transition-colors">
              <Save size={12} /> {saved ? 'Salvo!' : 'Salvar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
