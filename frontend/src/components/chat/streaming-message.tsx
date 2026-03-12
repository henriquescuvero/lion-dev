import { useState, useEffect, useMemo } from 'react'

const GENERATION_STEPS = [
  { label: 'Analisando requisitos', icon: '🔍', duration: 3000 },
  { label: 'Planejando estrutura da página', icon: '📐', duration: 4000 },
  { label: 'Criando containers e seções', icon: '🏗️', duration: 5000 },
  { label: 'Gerando widgets e conteúdo', icon: '⚙️', duration: 6000 },
  { label: 'Aplicando estilos e responsividade', icon: '🎨', duration: 5000 },
  { label: 'Montando template JSON', icon: '📦', duration: 4000 },
  { label: 'Finalizando template Elementor', icon: '✅', duration: 3000 },
]

function useProgressSteps(isActive: boolean) {
  const [currentStep, setCurrentStep] = useState(0)
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (!isActive) return
    const interval = setInterval(() => setElapsed((e) => e + 100), 100)
    return () => clearInterval(interval)
  }, [isActive])

  useEffect(() => {
    let total = 0
    for (let i = 0; i < GENERATION_STEPS.length; i++) {
      total += GENERATION_STEPS[i].duration
      if (elapsed < total) {
        setCurrentStep(i)
        return
      }
    }
    setCurrentStep(GENERATION_STEPS.length - 1)
  }, [elapsed])

  const stepProgress = useMemo(() => {
    let before = 0
    for (let i = 0; i < currentStep; i++) before += GENERATION_STEPS[i].duration
    const stepElapsed = elapsed - before
    const stepDuration = GENERATION_STEPS[currentStep].duration
    return Math.min(stepElapsed / stepDuration, 1)
  }, [elapsed, currentStep])

  const overallProgress = useMemo(() => {
    const totalDuration = GENERATION_STEPS.reduce((sum, s) => sum + s.duration, 0)
    return Math.min(elapsed / totalDuration, 0.95)
  }, [elapsed])

  return { currentStep, stepProgress, overallProgress, steps: GENERATION_STEPS }
}

export function StreamingMessage({ text }: { text: string }) {
  const hasText = text.length > 0
  const { currentStep, overallProgress, steps } = useProgressSteps(true)

  return (
    <div className="flex items-start gap-3 px-4 py-3 animate-fade-in">
      <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 bg-primary/10 border border-primary/20">
        <span className="text-sm">🦁</span>
      </div>
      <div className="flex-1 min-w-0 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium text-text-secondary">Lion Dev</span>
          <span className="text-[10px] text-primary animate-pulse-glow">gerando...</span>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="h-1.5 rounded-full bg-bg-tertiary overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary/80 to-primary transition-all duration-500 ease-out"
              style={{ width: `${Math.max(overallProgress * 100, 5)}%` }}
            />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-text-muted">
              {Math.round(overallProgress * 100)}%
            </span>
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-1">
          {steps.map((step, i) => {
            const isDone = i < currentStep
            const isActive = i === currentStep
            const isPending = i > currentStep

            if (isPending && i > currentStep + 1) return null

            return (
              <div
                key={i}
                className={`flex items-center gap-2 py-0.5 transition-all duration-300 ${
                  isPending ? 'opacity-30' : isActive ? 'opacity-100' : 'opacity-50'
                }`}
              >
                <span className="text-xs w-4 text-center">
                  {isDone ? '✓' : step.icon}
                </span>
                <span
                  className={`text-[11px] ${
                    isActive
                      ? 'text-primary font-medium'
                      : isDone
                        ? 'text-text-muted line-through'
                        : 'text-text-muted'
                  }`}
                >
                  {step.label}
                </span>
                {isActive && (
                  <span className="inline-flex gap-0.5 ml-1">
                    <span className="w-1 h-1 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1 h-1 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1 h-1 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                )}
              </div>
            )
          })}
        </div>

        {/* Streaming text preview */}
        {hasText && (
          <div className="mt-2 pt-2 border-t border-border/50">
            <div className="text-[10px] text-text-muted mb-1">Resposta da IA:</div>
            <div className="text-xs leading-relaxed text-text-secondary whitespace-pre-wrap max-h-24 overflow-hidden relative">
              {text.substring(0, 300)}
              {text.length > 300 && '...'}
              <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-bg-primary to-transparent" />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export function LoadingIndicator() {
  const { currentStep, overallProgress, steps } = useProgressSteps(true)
  const activeStep = steps[currentStep]

  return (
    <div className="flex items-start gap-3 px-4 py-3 animate-fade-in">
      <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 bg-primary/10 border border-primary/20 relative">
        <span className="text-sm">🦁</span>
        <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
      </div>
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-text-secondary">Lion Dev</span>
          <span className="text-[10px] text-primary animate-pulse-glow">processando...</span>
        </div>

        {/* Compact progress */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1 rounded-full bg-bg-tertiary overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary/80 to-primary transition-all duration-500 ease-out"
              style={{ width: `${Math.max(overallProgress * 100, 3)}%` }}
            />
          </div>
          <span className="text-[10px] text-text-muted w-7 text-right">
            {Math.round(overallProgress * 100)}%
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs">{activeStep.icon}</span>
          <span className="text-[11px] text-primary font-medium">{activeStep.label}</span>
          <span className="inline-flex gap-0.5 ml-0.5">
            <span className="w-1 h-1 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1 h-1 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1 h-1 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
          </span>
        </div>
      </div>
    </div>
  )
}
