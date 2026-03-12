import { useState } from 'react'
import { Check, Copy, Download, ChevronDown, ChevronRight } from 'lucide-react'
import type { ElementorTemplate } from '../../types'
import { copyToClipboard } from '../../utils/helpers'

interface JsonViewerProps {
  data: ElementorTemplate
}

export function JsonViewer({ data }: JsonViewerProps) {
  const [copied, setCopied] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const jsonString = JSON.stringify(data, null, 2)

  async function handleCopy() {
    await copyToClipboard(jsonString)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleDownload() {
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${data.title?.replace(/\s+/g, '-').toLowerCase() || 'elementor-template'}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="rounded-lg border border-border bg-bg-primary overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 bg-bg-tertiary/50 border-b border-border">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary transition-colors"
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
          <span className="font-mono">elementor-template.json</span>
        </button>
        <div className="flex items-center gap-1">
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-md hover:bg-bg-tertiary text-text-secondary hover:text-accent transition-all"
            title="Baixar JSON (importável no Elementor)"
          >
            <Download size={12} />
            <span>Baixar</span>
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-md hover:bg-bg-tertiary text-text-secondary hover:text-accent transition-all"
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
        </div>
      </div>
      {!collapsed && (
        <pre className="p-3 text-xs leading-relaxed overflow-x-auto max-h-[300px] overflow-y-auto">
          <code className="text-text-secondary">
            {jsonString.split('\n').map((line, i) => (
              <div key={i} className="flex">
                <span className="w-8 shrink-0 text-text-muted/50 select-none text-right pr-3">
                  {i + 1}
                </span>
                <span dangerouslySetInnerHTML={{ __html: syntaxHighlight(line) }} />
              </div>
            ))}
          </code>
        </pre>
      )}
    </div>
  )
}

function syntaxHighlight(line: string): string {
  return line
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"([^"]*)"(\s*:)/g, '<span style="color: hsl(200, 70%, 65%);">"$1"</span>$2')
    .replace(/:\s*"([^"]*)"/g, ': <span style="color: hsl(100, 50%, 60%);">"$1"</span>')
    .replace(/:\s*(\d+\.?\d*)/g, ': <span style="color: hsl(30, 80%, 65%);">$1</span>')
    .replace(/:\s*(true|false)/g, ': <span style="color: hsl(280, 60%, 65%);">$1</span>')
    .replace(/:\s*(null)/g, ': <span style="color: hsl(0, 60%, 60%);">$1</span>')
}
