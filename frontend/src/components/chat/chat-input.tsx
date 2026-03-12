import { useState, useRef, useEffect } from 'react'
import { SendHorizontal, ImagePlus, ChevronDown, X } from 'lucide-react'
import { AVAILABLE_MODELS } from '@/lib/constants'
import { imageToBase64 } from '@/services/storage'

interface ChatInputProps {
  onSend: (message: string, images?: string[]) => void
  disabled?: boolean
  model: string
  onModelChange: (model: string) => void
}

export function ChatInput({ onSend, disabled, model, onModelChange }: ChatInputProps) {
  const [value, setValue] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [showModels, setShowModels] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
    }
  }, [value])

  function handleSubmit() {
    const trimmed = value.trim()
    if ((!trimmed && images.length === 0) || disabled) return
    onSend(trimmed, images.length > 0 ? images : undefined)
    setValue('')
    setImages([])
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  async function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files) return
    for (const file of Array.from(files)) {
      const base64 = await imageToBase64(file)
      setImages((prev) => [...prev, base64])
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const currentModel = AVAILABLE_MODELS.find((m) => m.id === model)

  return (
    <div className="p-4 border-t border-border bg-bg-secondary/50">
      {images.length > 0 && (
        <div className="flex gap-2 mb-3 flex-wrap">
          {images.map((img, i) => (
            <div key={i} className="relative group">
              <img src={img} alt={`Anexo ${i + 1}`} className="w-16 h-16 object-cover rounded-lg border border-border" />
              <button
                onClick={() => setImages((prev) => prev.filter((_, idx) => idx !== i))}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={10} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 mb-2">
        <div className="relative">
          <button
            onClick={() => setShowModels(!showModels)}
            className="flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-lg bg-bg-primary border border-border hover:border-primary/40 text-text-secondary hover:text-text-primary transition-all"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
            {currentModel?.name ?? model}
            <ChevronDown size={10} />
          </button>
          {showModels && (
            <div className="absolute bottom-full left-0 mb-1 w-56 bg-bg-secondary border border-border rounded-lg shadow-xl z-10 overflow-hidden">
              {AVAILABLE_MODELS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => { onModelChange(m.id); setShowModels(false) }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs hover:bg-bg-tertiary transition-colors ${
                    model === m.id ? 'text-primary bg-primary/5' : 'text-text-secondary'
                  }`}
                >
                  <span className="font-medium">{m.name}</span>
                  <span className="text-text-muted text-[10px]">{m.description}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-end gap-2 bg-bg-primary rounded-xl border border-border focus-within:border-primary/40 transition-colors">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          className="m-1.5 p-2 rounded-lg hover:bg-bg-tertiary text-text-muted hover:text-primary disabled:opacity-30 transition-all"
        >
          <ImagePlus size={16} />
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageSelect} className="hidden" />
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Descreva a página que deseja criar..."
          disabled={disabled}
          rows={1}
          className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted py-3 resize-none outline-none max-h-[120px]"
        />
        <button
          onClick={handleSubmit}
          disabled={(!value.trim() && images.length === 0) || disabled}
          className="m-1.5 p-2 rounded-lg bg-primary text-bg-primary hover:bg-primary-hover disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-[0_0_12px_hsla(43,96%,56%,0.3)]"
        >
          <SendHorizontal size={16} />
        </button>
      </div>
      <p className="text-[10px] text-text-muted mt-2 text-center">
        Enter para enviar, Shift+Enter para nova linha
      </p>
    </div>
  )
}
