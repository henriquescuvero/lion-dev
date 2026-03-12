// Elementor Template Format (v0.4)
export interface ElementorTemplate {
  title: string
  type: string
  version: string
  page_settings: Record<string, unknown> | unknown[]
  content: ElementorElement[]
}

export interface ElementorElement {
  id: string
  elType: 'container' | 'section' | 'column' | 'widget'
  widgetType?: string
  isInner: boolean
  settings: Record<string, unknown>
  elements: ElementorElement[]
}

export interface ChatMessage {
  id: string
  role: 'user' | 'ai'
  content: string
  json?: ElementorTemplate
  images?: string[]
  timestamp: Date
}
