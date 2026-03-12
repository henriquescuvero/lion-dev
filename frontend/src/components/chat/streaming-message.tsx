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

/**
 * Parse the streaming text to detect chunked generation status
 */
function parseChunkedStatus(text: string): {
  isChunked: boolean
  currentSection: number
  totalSections: number
  sectionName: string
  phase: 'planning' | 'generating' | 'assembling' | 'complete' | 'error'
  sections: string[]
} | null {
  // Check for section progress pattern: "🏗️ Seção 3/7: nome"
  const sectionMatch = text.match(/Seção (\d+)\/(\d+)[:\s]+(.+?)(?:\n|$)/)
  if (sectionMatch) {
    return {
      isChunked: true,
      currentSection: parseInt(sectionMatch[1]),
      totalSections: parseInt(sectionMatch[2]),
      sectionName: sectionMatch[3].replace(/\.\.\.$/, '').trim(),
      phase: 'generating',
      sections: [],
    }
  }

  // Check for plan pattern: "📋 Plano: 6 seções → hero, benefícios, ..."
  const planMatch = text.match(/Plano: (\d+) seções → (.+)/)
  if (planMatch) {
    return {
      isChunked: true,
      currentSection: 0,
      totalSections: parseInt(planMatch[1]),
      sectionName: '',
      phase: 'planning',
      sections: planMatch[2].split(',').map((s) => s.trim()),
    }
  }

  // Check for completed section: "✅ Seção 3/7 concluída: nome"
  const completeMatch = text.match(/✅ Seção (\d+)\/(\d+) concluída: (.+)/)
  if (completeMatch) {
    return {
      isChunked: true,
      currentSection: parseInt(completeMatch[1]),
      totalSections: parseInt(completeMatch[2]),
      sectionName: completeMatch[3].trim(),
      phase: 'generating',
      sections: [],
    }
  }

  if (text.includes('Montando template')) {
    return { isChunked: true, currentSection: 0, totalSections: 0, sectionName: '', phase: 'assembling', sections: [] }
  }

  if (text.includes('Analisando requisitos')) {
    return { isChunked: true, currentSection: 0, totalSections: 0, sectionName: '', phase: 'planning', sections: [] }
  }

  if (text.includes('❌')) {
    return { isChunked: true, currentSection: 0, totalSections: 0, sectionName: '', phase: 'error', sections: [] }
  }

  return null
}

export function StreamingMessage({ text }: { text: string }) {
  const hasText = text.length > 0
  const chunkedStatus = parseChunkedStatus(text)

  // If chunked generation, show section-based progress
  if (chunkedStatus?.isChunked) {
    return <ChunkedProgress status={chunkedStatus} rawText={text} />
  }

  // Default: streaming text with animated steps
  const { overallProgress, steps, currentStep } = useProgressSteps(true)

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

        <div className="space-y-2">
          <div className="h-1.5 rounded-full bg-bg-tertiary overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary/80 to-primary transition-all duration-500 ease-out"
              style={{ width: `${Math.max(overallProgress * 100, 5)}%` }}
            />
          </div>
          <span className="text-[10px] text-text-muted">{Math.round(overallProgress * 100)}%</span>
        </div>

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
                <span className="text-xs w-4 text-center">{isDone ? '✓' : step.icon}</span>
                <span className={`text-[11px] ${isActive ? 'text-primary font-medium' : isDone ? 'text-text-muted line-through' : 'text-text-muted'}`}>
                  {step.label}
                </span>
                {isActive && <BounceDots />}
              </div>
            )
          })}
        </div>

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

function ChunkedProgress({ status, rawText }: {
  status: NonNullable<ReturnType<typeof parseChunkedStatus>>
  rawText: string
}) {
  const { phase, currentSection, totalSections, sectionName, sections } = status
  const progress = totalSections > 0 ? (currentSection / totalSections) : 0

  return (
    <div className="flex items-start gap-3 px-4 py-3 animate-fade-in">
      <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 bg-primary/10 border border-primary/20 relative">
        <span className="text-sm">🦁</span>
        <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
      </div>
      <div className="flex-1 min-w-0 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-text-secondary">Lion Dev</span>
          <span className="text-[10px] text-primary animate-pulse-glow">
            {phase === 'planning' ? 'planejando...' :
              phase === 'assembling' ? 'montando...' :
                phase === 'error' ? 'erro' : 'construindo...'}
          </span>
        </div>

        {/* Main progress bar */}
        {totalSections > 0 && (
          <div className="space-y-1">
            <div className="h-2 rounded-full bg-bg-tertiary overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary/60 via-primary to-primary-hover transition-all duration-700 ease-out"
                style={{ width: `${Math.max(progress * 100, 3)}%` }}
              />
            </div>
            <div className="flex justify-between">
              <span className="text-[10px] text-text-muted">
                Seção {currentSection}/{totalSections}
              </span>
              <span className="text-[10px] text-text-muted">
                {Math.round(progress * 100)}%
              </span>
            </div>
          </div>
        )}

        {/* Phase indicator */}
        {phase === 'planning' && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs">📋</span>
              <span className="text-[11px] text-primary font-medium">Planejando seções da página</span>
              <BounceDots />
            </div>
            {sections.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {sections.map((s, i) => (
                  <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-bg-tertiary text-text-muted">
                    {s}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {phase === 'generating' && totalSections > 0 && (
          <div className="space-y-1">
            {Array.from({ length: totalSections }, (_, i) => {
              const sectionIdx = i + 1
              const isDone = sectionIdx < currentSection
              const isActive = sectionIdx === currentSection
              const isPending = sectionIdx > currentSection

              if (isPending && sectionIdx > currentSection + 2) return null

              return (
                <div
                  key={i}
                  className={`flex items-center gap-2 py-0.5 transition-all duration-300 ${
                    isPending ? 'opacity-30' : isActive ? 'opacity-100' : 'opacity-60'
                  }`}
                >
                  <span className="text-xs w-4 text-center">
                    {isDone ? '✅' : isActive ? '🏗️' : '⬜'}
                  </span>
                  <span className={`text-[11px] ${
                    isActive ? 'text-primary font-medium' : isDone ? 'text-text-muted' : 'text-text-muted'
                  }`}>
                    {isActive ? sectionName : `Seção ${sectionIdx}`}
                  </span>
                  {isActive && <BounceDots />}
                </div>
              )
            })}
          </div>
        )}

        {phase === 'assembling' && (
          <div className="flex items-center gap-2">
            <span className="text-xs">📦</span>
            <span className="text-[11px] text-primary font-medium">Montando template completo</span>
            <BounceDots />
          </div>
        )}

        {phase === 'error' && (
          <div className="text-xs text-red-400 mt-1">
            {rawText.replace(/❌\s*/, '')}
          </div>
        )}

        {/* Streaming text preview for section generation */}
        {phase === 'generating' && rawText.includes('\n\n') && (
          <div className="mt-2 pt-2 border-t border-border/50">
            <div className="text-[10px] text-text-muted mb-1">Preview da seção:</div>
            <div className="text-xs leading-relaxed text-text-secondary whitespace-pre-wrap max-h-16 overflow-hidden relative font-mono">
              {rawText.split('\n\n').pop()?.substring(0, 200)}
              <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-bg-primary to-transparent" />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function BounceDots() {
  return (
    <span className="inline-flex gap-0.5 ml-1">
      <span className="w-1 h-1 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
      <span className="w-1 h-1 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
      <span className="w-1 h-1 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
    </span>
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
          <BounceDots />
        </div>
      </div>
    </div>
  )
}
