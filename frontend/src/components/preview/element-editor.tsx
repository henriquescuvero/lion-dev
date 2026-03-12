import { useState } from 'react'
import { X, Trash2, Copy, ChevronUp, ChevronDown, AlignLeft, AlignCenter, AlignRight } from 'lucide-react'
import type { ElementorElement, ElementorTemplate } from '@/types/elementor'
import { generateId } from '@/lib/utils'

interface ElementEditorProps {
  element: ElementorElement
  template: ElementorTemplate
  onUpdate: (template: ElementorTemplate) => void
  onClose: () => void
}

type Tab = 'content' | 'style' | 'layout'

export function ElementEditor({ element, template, onUpdate, onClose }: ElementEditorProps) {
  const [tab, setTab] = useState<Tab>('content')
  const s = element.settings

  function updateSetting(key: string, value: unknown) {
    const updated = updateElementInTemplate(template, element.id, {
      ...element,
      settings: { ...element.settings, [key]: value },
    })
    onUpdate(updated)
  }

  function deleteElement() {
    const updated = removeElementFromTemplate(template, element.id)
    onUpdate(updated)
    onClose()
  }

  function duplicateElement() {
    const cloned = cloneElement(element)
    const updated = insertAfterElement(template, element.id, cloned)
    onUpdate(updated)
  }

  function moveElement(direction: 'up' | 'down') {
    const updated = moveElementInTemplate(template, element.id, direction)
    onUpdate(updated)
  }

  const isWidget = element.elType === 'widget'
  const isContainer = element.elType === 'container' || element.elType === 'section'
  const widgetType = element.widgetType || ''

  return (
    <div className="w-72 bg-bg-secondary border-l border-border flex flex-col h-full animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-bg-tertiary/50">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-primary">
            {isContainer ? 'Container' : widgetType || 'Elemento'}
          </span>
          <span className="text-[10px] text-text-muted font-mono">#{element.id.slice(0, 6)}</span>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-bg-tertiary rounded transition-colors">
          <X size={14} className="text-text-muted" />
        </button>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 px-3 py-1.5 border-b border-border">
        <button onClick={() => moveElement('up')} className="p-1 hover:bg-bg-tertiary rounded" title="Mover para cima">
          <ChevronUp size={14} className="text-text-muted" />
        </button>
        <button onClick={() => moveElement('down')} className="p-1 hover:bg-bg-tertiary rounded" title="Mover para baixo">
          <ChevronDown size={14} className="text-text-muted" />
        </button>
        <button onClick={duplicateElement} className="p-1 hover:bg-bg-tertiary rounded" title="Duplicar">
          <Copy size={14} className="text-text-muted" />
        </button>
        <div className="flex-1" />
        <button onClick={deleteElement} className="p-1 hover:bg-red-500/20 rounded" title="Excluir">
          <Trash2 size={14} className="text-red-400" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        {(['content', 'style', 'layout'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 text-[11px] py-2 transition-colors ${
              tab === t ? 'text-primary border-b-2 border-primary' : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            {t === 'content' ? 'Conteúdo' : t === 'style' ? 'Estilo' : 'Layout'}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {tab === 'content' && (
          <>
            {isWidget && renderContentFields(widgetType, s, updateSetting)}
            {isContainer && (
              <FieldGroup label="Título do container">
                <input
                  type="text"
                  value={(s._title as string) || ''}
                  onChange={(e) => updateSetting('_title', e.target.value)}
                  placeholder="Sem título"
                  className="field-input"
                />
              </FieldGroup>
            )}
          </>
        )}

        {tab === 'style' && (
          <>
            <FieldGroup label="Cor de fundo">
              <ColorPicker
                value={getColor(s, 'background_color') || '#transparent'}
                onChange={(c) => {
                  updateSetting('background_background', 'classic')
                  updateSetting('background_color', c)
                }}
              />
            </FieldGroup>

            {isWidget && widgetType === 'heading' && (
              <FieldGroup label="Cor do título">
                <ColorPicker
                  value={(s.title_color as string) || '#ffffff'}
                  onChange={(c) => updateSetting('title_color', c)}
                />
              </FieldGroup>
            )}

            {isWidget && widgetType === 'text-editor' && (
              <FieldGroup label="Cor do texto">
                <ColorPicker
                  value={(s.text_color as string) || '#ffffff'}
                  onChange={(c) => updateSetting('text_color', c)}
                />
              </FieldGroup>
            )}

            {isWidget && widgetType === 'button' && (
              <>
                <FieldGroup label="Cor do botão">
                  <ColorPicker
                    value={(s.background_color as string) || '#e6a817'}
                    onChange={(c) => updateSetting('background_color', c)}
                  />
                </FieldGroup>
                <FieldGroup label="Cor do texto">
                  <ColorPicker
                    value={(s.button_text_color as string) || '#ffffff'}
                    onChange={(c) => updateSetting('button_text_color', c)}
                  />
                </FieldGroup>
              </>
            )}

            {isWidget && widgetType === 'icon-box' && (
              <FieldGroup label="Cor do ícone">
                <ColorPicker
                  value={(s.primary_color as string) || '#e6a817'}
                  onChange={(c) => updateSetting('primary_color', c)}
                />
              </FieldGroup>
            )}

            <FieldGroup label="Padding">
              <SpacingInput
                value={s.padding as SpacingValue}
                onChange={(v) => updateSetting('padding', v)}
              />
            </FieldGroup>

            <FieldGroup label="Margin">
              <SpacingInput
                value={s.margin as SpacingValue}
                onChange={(v) => updateSetting('margin', v)}
              />
            </FieldGroup>
          </>
        )}

        {tab === 'layout' && isContainer && (
          <>
            <FieldGroup label="Direção">
              <div className="flex gap-1">
                {['column', 'row'].map((dir) => (
                  <button
                    key={dir}
                    onClick={() => updateSetting('flex_direction', dir)}
                    className={`flex-1 text-[11px] py-1.5 rounded border transition-colors ${
                      (s.flex_direction || 'column') === dir
                        ? 'bg-primary/10 border-primary/40 text-primary'
                        : 'border-border text-text-muted hover:border-primary/20'
                    }`}
                  >
                    {dir === 'column' ? 'Vertical' : 'Horizontal'}
                  </button>
                ))}
              </div>
            </FieldGroup>

            <FieldGroup label="Largura">
              <div className="flex gap-1">
                {['boxed', 'full'].map((w) => (
                  <button
                    key={w}
                    onClick={() => updateSetting('content_width', w)}
                    className={`flex-1 text-[11px] py-1.5 rounded border transition-colors ${
                      (s.content_width || 'boxed') === w
                        ? 'bg-primary/10 border-primary/40 text-primary'
                        : 'border-border text-text-muted hover:border-primary/20'
                    }`}
                  >
                    {w === 'boxed' ? 'Boxed' : 'Full Width'}
                  </button>
                ))}
              </div>
            </FieldGroup>

            <FieldGroup label="Alinhamento vertical">
              <div className="flex gap-1">
                {['top', 'center', 'bottom'].map((pos) => (
                  <button
                    key={pos}
                    onClick={() => updateSetting('content_position', pos)}
                    className={`flex-1 text-[11px] py-1.5 rounded border transition-colors ${
                      (s.content_position || 'top') === pos
                        ? 'bg-primary/10 border-primary/40 text-primary'
                        : 'border-border text-text-muted hover:border-primary/20'
                    }`}
                  >
                    {pos === 'top' ? 'Topo' : pos === 'center' ? 'Centro' : 'Base'}
                  </button>
                ))}
              </div>
            </FieldGroup>

            <FieldGroup label="Gap">
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0"
                  max="60"
                  value={getSize(s.flex_gap)}
                  onChange={(e) => updateSetting('flex_gap', { unit: 'px', size: parseInt(e.target.value) })}
                  className="flex-1 accent-primary"
                />
                <span className="text-[10px] text-text-muted w-8 text-right">{getSize(s.flex_gap)}px</span>
              </div>
            </FieldGroup>

            <FieldGroup label="Flex Wrap">
              <div className="flex gap-1">
                {['nowrap', 'wrap'].map((w) => (
                  <button
                    key={w}
                    onClick={() => updateSetting('flex_wrap', w)}
                    className={`flex-1 text-[11px] py-1.5 rounded border transition-colors ${
                      (s.flex_wrap || 'nowrap') === w
                        ? 'bg-primary/10 border-primary/40 text-primary'
                        : 'border-border text-text-muted hover:border-primary/20'
                    }`}
                  >
                    {w === 'nowrap' ? 'Sem wrap' : 'Wrap'}
                  </button>
                ))}
              </div>
            </FieldGroup>
          </>
        )}

        {tab === 'layout' && isWidget && (
          <>
            <FieldGroup label="Alinhamento">
              <div className="flex gap-1">
                {[
                  { value: 'left', icon: AlignLeft },
                  { value: 'center', icon: AlignCenter },
                  { value: 'right', icon: AlignRight },
                ].map(({ value, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => updateSetting('align', value)}
                    className={`flex-1 flex items-center justify-center py-1.5 rounded border transition-colors ${
                      (s.align || 'left') === value
                        ? 'bg-primary/10 border-primary/40 text-primary'
                        : 'border-border text-text-muted hover:border-primary/20'
                    }`}
                  >
                    <Icon size={14} />
                  </button>
                ))}
              </div>
            </FieldGroup>

            {widgetType === 'heading' && (
              <FieldGroup label="Tamanho">
                <select
                  value={(s.header_size as string) || 'h2'}
                  onChange={(e) => updateSetting('header_size', e.target.value)}
                  className="field-input"
                >
                  <option value="h1">H1</option>
                  <option value="h2">H2</option>
                  <option value="h3">H3</option>
                  <option value="h4">H4</option>
                  <option value="h5">H5</option>
                  <option value="h6">H6</option>
                </select>
              </FieldGroup>
            )}

            {widgetType === 'button' && (
              <FieldGroup label="Tamanho">
                <select
                  value={(s.size as string) || 'md'}
                  onChange={(e) => updateSetting('size', e.target.value)}
                  className="field-input"
                >
                  <option value="sm">Pequeno</option>
                  <option value="md">Médio</option>
                  <option value="lg">Grande</option>
                  <option value="xl">Extra Grande</option>
                </select>
              </FieldGroup>
            )}

            {widgetType === 'spacer' && (
              <FieldGroup label="Altura">
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="10"
                    max="200"
                    value={getSize(s.space) || 50}
                    onChange={(e) => updateSetting('space', { unit: 'px', size: parseInt(e.target.value) })}
                    className="flex-1 accent-primary"
                  />
                  <span className="text-[10px] text-text-muted w-8 text-right">{getSize(s.space) || 50}px</span>
                </div>
              </FieldGroup>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// === Sub-components ===

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[10px] text-text-muted uppercase tracking-wider mb-1 block">{label}</label>
      {children}
    </div>
  )
}

function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  const presets = ['#ffffff', '#000000', '#e6a817', '#3b82f6', '#22c55e', '#ef4444', '#8b5cf6', '#f97316', '#06b6d4', '#ec4899']

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value || '#ffffff'}
          onChange={(e) => onChange(e.target.value)}
          className="w-8 h-8 rounded border border-border cursor-pointer bg-transparent"
        />
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="field-input flex-1 font-mono text-[11px]"
          placeholder="#hex"
        />
      </div>
      <div className="flex gap-1 flex-wrap">
        {presets.map((c) => (
          <button
            key={c}
            onClick={() => onChange(c)}
            className={`w-5 h-5 rounded border transition-all ${
              value === c ? 'border-primary scale-110' : 'border-border/50 hover:scale-110'
            }`}
            style={{ backgroundColor: c }}
          />
        ))}
      </div>
    </div>
  )
}

interface SpacingValue {
  unit?: string
  top?: string
  right?: string
  bottom?: string
  left?: string
  isLinked?: boolean
}

function SpacingInput({ value, onChange }: { value?: SpacingValue; onChange: (v: SpacingValue) => void }) {
  const v = value || { unit: 'px', top: '0', right: '0', bottom: '0', left: '0', isLinked: false }

  function update(side: string, val: string) {
    if (v.isLinked) {
      onChange({ ...v, top: val, right: val, bottom: val, left: val })
    } else {
      onChange({ ...v, [side]: val })
    }
  }

  return (
    <div className="space-y-1">
      <div className="grid grid-cols-4 gap-1">
        {(['top', 'right', 'bottom', 'left'] as const).map((side) => (
          <div key={side} className="text-center">
            <span className="text-[9px] text-text-muted uppercase">{side[0]}</span>
            <input
              type="number"
              value={(v[side] as string) || '0'}
              onChange={(e) => update(side, e.target.value)}
              className="field-input text-center text-[11px] mt-0.5"
            />
          </div>
        ))}
      </div>
      <button
        onClick={() => onChange({ ...v, isLinked: !v.isLinked })}
        className={`text-[10px] w-full py-0.5 rounded border transition-colors ${
          v.isLinked ? 'bg-primary/10 border-primary/30 text-primary' : 'border-border text-text-muted'
        }`}
      >
        {v.isLinked ? '🔗 Vinculado' : '🔓 Independente'}
      </button>
    </div>
  )
}

function renderContentFields(
  widgetType: string,
  s: Record<string, unknown>,
  updateSetting: (key: string, value: unknown) => void
) {
  switch (widgetType) {
    case 'heading':
      return (
        <FieldGroup label="Título">
          <input
            type="text"
            value={(s.title as string) || ''}
            onChange={(e) => updateSetting('title', e.target.value)}
            className="field-input"
          />
        </FieldGroup>
      )

    case 'text-editor':
      return (
        <FieldGroup label="Texto">
          <textarea
            value={(s.editor as string) || ''}
            onChange={(e) => updateSetting('editor', e.target.value)}
            rows={4}
            className="field-input resize-y"
          />
        </FieldGroup>
      )

    case 'button':
      return (
        <>
          <FieldGroup label="Texto do botão">
            <input
              type="text"
              value={(s.text as string) || ''}
              onChange={(e) => updateSetting('text', e.target.value)}
              className="field-input"
            />
          </FieldGroup>
          <FieldGroup label="Link URL">
            <input
              type="text"
              value={((s.link as Record<string, unknown>)?.url as string) || '#'}
              onChange={(e) => updateSetting('link', { ...((s.link as Record<string, unknown>) || {}), url: e.target.value })}
              className="field-input"
            />
          </FieldGroup>
        </>
      )

    case 'image':
      return (
        <FieldGroup label="URL da imagem">
          <input
            type="text"
            value={((s.image as Record<string, unknown>)?.url as string) || ''}
            onChange={(e) => updateSetting('image', { url: e.target.value, id: 0 })}
            className="field-input"
          />
        </FieldGroup>
      )

    case 'icon-box':
      return (
        <>
          <FieldGroup label="Título">
            <input
              type="text"
              value={(s.title_text as string) || ''}
              onChange={(e) => updateSetting('title_text', e.target.value)}
              className="field-input"
            />
          </FieldGroup>
          <FieldGroup label="Descrição">
            <textarea
              value={(s.description_text as string) || ''}
              onChange={(e) => updateSetting('description_text', e.target.value)}
              rows={3}
              className="field-input resize-y"
            />
          </FieldGroup>
        </>
      )

    case 'counter':
      return (
        <>
          <FieldGroup label="Número">
            <input
              type="number"
              value={(s.ending_number as number) || 0}
              onChange={(e) => updateSetting('ending_number', parseInt(e.target.value))}
              className="field-input"
            />
          </FieldGroup>
          <FieldGroup label="Sufixo">
            <input
              type="text"
              value={(s.suffix as string) || ''}
              onChange={(e) => updateSetting('suffix', e.target.value)}
              className="field-input"
            />
          </FieldGroup>
          <FieldGroup label="Rótulo">
            <input
              type="text"
              value={(s.title as string) || ''}
              onChange={(e) => updateSetting('title', e.target.value)}
              className="field-input"
            />
          </FieldGroup>
        </>
      )

    case 'testimonial':
      return (
        <>
          <FieldGroup label="Depoimento">
            <textarea
              value={(s.testimonial_content as string) || ''}
              onChange={(e) => updateSetting('testimonial_content', e.target.value)}
              rows={3}
              className="field-input resize-y"
            />
          </FieldGroup>
          <FieldGroup label="Nome">
            <input
              type="text"
              value={(s.testimonial_name as string) || ''}
              onChange={(e) => updateSetting('testimonial_name', e.target.value)}
              className="field-input"
            />
          </FieldGroup>
          <FieldGroup label="Cargo">
            <input
              type="text"
              value={(s.testimonial_job as string) || ''}
              onChange={(e) => updateSetting('testimonial_job', e.target.value)}
              className="field-input"
            />
          </FieldGroup>
        </>
      )

    default:
      return (
        <p className="text-[11px] text-text-muted italic">
          Edite este widget ({widgetType}) pelo chat ou use a aba Estilo.
        </p>
      )
  }
}

// === Template manipulation helpers ===

function getColor(s: Record<string, unknown>, key: string): string {
  return (s[key] as string) || ''
}

function getSize(v: unknown): number {
  if (!v) return 0
  if (typeof v === 'number') return v
  return (v as { size?: number })?.size || 0
}

function updateElementInTemplate(template: ElementorTemplate, id: string, newElement: ElementorElement): ElementorTemplate {
  function walk(elements: ElementorElement[]): ElementorElement[] {
    return elements.map((el) => {
      if (el.id === id) return newElement
      if (el.elements.length > 0) return { ...el, elements: walk(el.elements) }
      return el
    })
  }
  return { ...template, content: walk(template.content) }
}

function removeElementFromTemplate(template: ElementorTemplate, id: string): ElementorTemplate {
  function walk(elements: ElementorElement[]): ElementorElement[] {
    return elements.filter((el) => el.id !== id).map((el) => ({
      ...el,
      elements: walk(el.elements),
    }))
  }
  return { ...template, content: walk(template.content) }
}

function cloneElement(element: ElementorElement): ElementorElement {
  return {
    ...element,
    id: generateId().slice(0, 8),
    elements: element.elements.map(cloneElement),
  }
}

function insertAfterElement(template: ElementorTemplate, afterId: string, newElement: ElementorElement): ElementorTemplate {
  function walk(elements: ElementorElement[]): ElementorElement[] {
    const result: ElementorElement[] = []
    for (const el of elements) {
      result.push({ ...el, elements: walk(el.elements) })
      if (el.id === afterId) result.push(newElement)
    }
    return result
  }
  return { ...template, content: walk(template.content) }
}

function moveElementInTemplate(template: ElementorTemplate, id: string, direction: 'up' | 'down'): ElementorTemplate {
  function walk(elements: ElementorElement[]): ElementorElement[] {
    const idx = elements.findIndex((el) => el.id === id)
    if (idx === -1) {
      return elements.map((el) => ({ ...el, elements: walk(el.elements) }))
    }
    const arr = [...elements]
    const newIdx = direction === 'up' ? idx - 1 : idx + 1
    if (newIdx < 0 || newIdx >= arr.length) return arr
    ;[arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]]
    return arr
  }
  return { ...template, content: walk(template.content) }
}
