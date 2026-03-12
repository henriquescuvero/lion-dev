import { X, Copy, Check, Save, RotateCcw } from 'lucide-react'
import { useState } from 'react'
import {
  loadSystemPrompt,
  saveSystemPrompt,
  resetSystemPrompt,
  DEFAULT_SYSTEM_PROMPT,
} from '../../services/ai'

interface PromptModalProps {
  onClose: () => void
}

export function PromptModal({ onClose }: PromptModalProps) {
  const [prompt, setPrompt] = useState(() => loadSystemPrompt())
  const [copied, setCopied] = useState(false)
  const [saved, setSaved] = useState(false)
  const isModified = prompt !== DEFAULT_SYSTEM_PROMPT

  async function handleCopy() {
    await navigator.clipboard.writeText(prompt)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleSave() {
    saveSystemPrompt(prompt)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function handleReset() {
    resetSystemPrompt()
    setPrompt(DEFAULT_SYSTEM_PROMPT)
    setSaved(false)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="bg-bg-secondary border border-border rounded-xl w-[750px] max-h-[85vh] flex flex-col shadow-2xl animate-fade-in">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-text-primary">
              Prompt do Agente — Lion Dev
            </h2>
            {isModified && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent/10 text-accent border border-accent/20">
                customizado
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {isModified && (
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border border-border hover:border-red-400/40 text-text-secondary hover:text-red-400 transition-all"
                title="Restaurar prompt original"
              >
                <RotateCcw size={12} />
                <span>Resetar</span>
              </button>
            )}
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border border-border hover:border-accent/40 text-text-secondary hover:text-accent transition-all"
            >
              {copied ? (
                <>
                  <Check size={12} className="text-green-400" />
                  <span className="text-green-400">Copiado!</span>
                </>
              ) : (
                <>
                  <Copy size={12} />
                  <span>Copiar</span>
                </>
              )}
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-accent text-bg-primary hover:bg-accent-hover transition-all font-medium"
            >
              {saved ? (
                <>
                  <Check size={12} />
                  <span>Salvo!</span>
                </>
              ) : (
                <>
                  <Save size={12} />
                  <span>Salvar</span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-bg-tertiary text-text-muted hover:text-text-primary transition-all"
            >
              <X size={16} />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-hidden p-4">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full h-full bg-bg-primary text-xs text-text-secondary leading-relaxed font-mono p-4 rounded-lg border border-border focus:border-accent/40 outline-none resize-none"
            spellCheck={false}
          />
        </div>
        <div className="px-5 py-2.5 border-t border-border flex items-center justify-between">
          <p className="text-[10px] text-text-muted">
            Edite o prompt para personalizar como a IA gera as páginas. Clique em "Salvar" para aplicar.
          </p>
          <p className="text-[10px] text-text-muted">
            {prompt.length.toLocaleString()} caracteres
          </p>
        </div>
      </div>
    </div>
  )
}
