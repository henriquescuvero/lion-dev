export function StreamingMessage({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3 px-4 py-3 animate-fade-in">
      <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 bg-primary/10 border border-primary/20">
        <span className="text-sm">🦁</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium text-text-secondary">Lion Dev</span>
          <span className="text-[10px] text-primary animate-pulse-glow">gerando...</span>
        </div>
        <div className="text-sm leading-relaxed text-text-secondary whitespace-pre-wrap">
          {text.substring(0, 500)}
          {text.length > 500 && '...'}
        </div>
      </div>
    </div>
  )
}
