import { useToastStore, type ToastType } from '@/stores/toast-store'
import { X } from 'lucide-react'

const TYPE_STYLES: Record<ToastType, { bg: string; border: string; icon: string }> = {
  success: { bg: 'bg-green-500/10', border: 'border-green-500/30', icon: '✓' },
  error: { bg: 'bg-red-500/10', border: 'border-red-500/30', icon: '✗' },
  info: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', icon: 'ℹ' },
  warning: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', icon: '⚠' },
}

const TYPE_TEXT: Record<ToastType, string> = {
  success: 'text-green-400',
  error: 'text-red-400',
  info: 'text-blue-400',
  warning: 'text-yellow-400',
}

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore()

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map((t) => {
        const style = TYPE_STYLES[t.type]
        return (
          <div
            key={t.id}
            className={`flex items-center gap-2 px-4 py-3 rounded-lg border ${style.bg} ${style.border} shadow-lg animate-slide-up`}
          >
            <span className={`text-sm font-bold ${TYPE_TEXT[t.type]}`}>{style.icon}</span>
            <span className="text-sm text-text-primary flex-1">{t.message}</span>
            <button
              onClick={() => removeToast(t.id)}
              className="p-0.5 hover:bg-bg-tertiary rounded transition-colors"
            >
              <X size={12} className="text-text-muted" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
