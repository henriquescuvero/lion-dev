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
