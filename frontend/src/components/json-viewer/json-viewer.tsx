import { useState } from 'react'
import { ChevronDown, ChevronRight, Copy, Download } from 'lucide-react'
import { copyToClipboard } from '@/lib/utils'
import type { ElementorTemplate } from '@/types/elementor'

interface JsonViewerProps {
  data: ElementorTemplate
}

export function JsonViewer({ data }: JsonViewerProps) {
  const [expanded, setExpanded] = useState(false)
  const jsonStr = JSON.stringify(data, null, 2)

  function handleDownload() {
    const blob = new Blob([jsonStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${data.title || 'template'}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="rounded-lg border border-border overflow-hidden bg-bg-primary">
      <div className="flex items-center justify-between px-3 py-2 bg-bg-secondary/50 border-b border-border">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary transition-colors"
        >
          {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          <span className="font-medium">Template JSON</span>
          <span className="text-[10px] text-text-muted">({data.content?.length || 0} elementos)</span>
        </button>
        <div className="flex items-center gap-1">
          <button
            onClick={() => copyToClipboard(jsonStr)}
            className="p-1.5 rounded hover:bg-bg-tertiary text-text-muted hover:text-text-primary transition-colors"
            title="Copiar JSON"
          >
            <Copy size={12} />
          </button>
          <button
            onClick={handleDownload}
            className="p-1.5 rounded hover:bg-bg-tertiary text-text-muted hover:text-primary transition-colors"
            title="Baixar JSON"
          >
            <Download size={12} />
          </button>
        </div>
      </div>
      {expanded && (
        <pre className="p-3 text-[11px] leading-relaxed overflow-x-auto max-h-[300px] overflow-y-auto text-text-secondary font-mono">
          {jsonStr}
        </pre>
      )}
    </div>
  )
}
