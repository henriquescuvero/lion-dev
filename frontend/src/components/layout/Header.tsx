import { Code2, FileText } from 'lucide-react'

interface HeaderProps {
  onShowPrompt: () => void
}

export function Header({ onShowPrompt }: HeaderProps) {
  return (
    <header className="flex items-center justify-between px-6 py-3 border-b border-border bg-bg-secondary/50 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-accent/10 border border-accent/20">
          <span className="text-lg leading-none">🦁</span>
        </div>
        <div>
          <h1 className="text-base font-semibold text-text-primary leading-tight">
            Lion Dev
          </h1>
          <p className="text-xs text-text-muted flex items-center gap-1">
            <Code2 size={11} />
            Elementor Template Builder
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onShowPrompt}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border hover:border-accent/40 text-text-secondary hover:text-accent transition-all"
          title="Ver prompt do agente"
        >
          <FileText size={13} />
          <span>Prompt do Agente</span>
        </button>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20 font-medium">
          v2.0
        </span>
      </div>
    </header>
  )
}
