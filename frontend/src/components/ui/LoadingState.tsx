export function LoadingState() {
  return (
    <div className="flex items-start gap-3 px-4 py-3 animate-fade-in">
      <div className="w-7 h-7 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
        <span className="text-sm">🦁</span>
      </div>
      <div className="flex-1 pt-1">
        <div className="flex items-center gap-2 text-text-secondary text-sm">
          <div className="flex gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse-glow" style={{ animationDelay: '0ms' }} />
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse-glow" style={{ animationDelay: '300ms' }} />
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse-glow" style={{ animationDelay: '600ms' }} />
          </div>
          <span>Gerando modelo JSON...</span>
        </div>
      </div>
    </div>
  )
}
