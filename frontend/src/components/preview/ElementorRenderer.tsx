import { Star, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import type { ElementorElement } from '../../types'

interface ElementorRendererProps {
  elements: ElementorElement[]
  editMode?: boolean
  onTextEdit?: (elementId: string, field: string, value: string) => void
}

export function ElementorRenderer({ elements, editMode, onTextEdit }: ElementorRendererProps) {
  return (
    <>
      {elements.map((el) => (
        <RenderElement key={el.id} element={el} editMode={editMode} onTextEdit={onTextEdit} />
      ))}
    </>
  )
}

function RenderElement({
  element,
  editMode,
  onTextEdit,
}: {
  element: ElementorElement
  editMode?: boolean
  onTextEdit?: (elementId: string, field: string, value: string) => void
}) {
  if (element.elType === 'container' || element.elType === 'section') {
    return <RenderContainer element={element} editMode={editMode} onTextEdit={onTextEdit} />
  }
  if (element.elType === 'column') {
    return <RenderContainer element={element} editMode={editMode} onTextEdit={onTextEdit} />
  }
  if (element.elType === 'widget') {
    return <RenderWidget element={element} editMode={editMode} onTextEdit={onTextEdit} />
  }
  return null
}

function getContainerStyle(s: Record<string, unknown>): React.CSSProperties {
  const style: React.CSSProperties = {}

  // Flex
  const dir = s.flex_direction as string
  if (dir) style.flexDirection = dir as 'row' | 'column'
  else style.flexDirection = 'column'

  style.display = 'flex'

  if (s.flex_wrap === 'wrap') style.flexWrap = 'wrap'

  const gap = s.flex_gap as { unit?: string; size?: number }
  if (gap?.size) style.gap = `${gap.size}${gap.unit || 'px'}`

  // Alignment
  const pos = s.content_position as string
  if (pos === 'center' || pos === 'middle') style.alignItems = 'center'
  else if (pos === 'bottom') style.alignItems = 'flex-end'

  const justify = s.justify_content as string
  if (justify === 'center') style.justifyContent = 'center'
  else if (justify === 'space-between') style.justifyContent = 'space-between'
  else if (justify === 'space-around') style.justifyContent = 'space-around'

  // Alignment for items
  const itemsAlign = s.align_items as string
  if (itemsAlign === 'center') style.alignItems = 'center'
  else if (itemsAlign === 'stretch') style.alignItems = 'stretch'

  // Background
  if (s.background_background === 'classic') {
    if (s.background_color) style.backgroundColor = s.background_color as string
    const bgImg = s.background_image as { url?: string }
    if (bgImg?.url) {
      style.backgroundImage = `url(${bgImg.url})`
      style.backgroundSize = 'cover'
      style.backgroundPosition = 'center'
    }
  } else if (s.background_background === 'gradient') {
    const c1 = (s.background_color as string) || '#000'
    const c2 = (s.background_color_b as string) || '#333'
    style.background = `linear-gradient(${(s.background_gradient_angle as { size?: number })?.size || 180}deg, ${c1}, ${c2})`
  }

  // Padding
  const pad = s.padding as { unit?: string; top?: string; right?: string; bottom?: string; left?: string }
  if (pad && typeof pad === 'object' && pad.top) {
    const u = pad.unit || 'px'
    style.padding = `${pad.top}${u} ${pad.right}${u} ${pad.bottom}${u} ${pad.left}${u}`
  }

  // Margin
  const mar = s.margin as { unit?: string; top?: string; right?: string; bottom?: string; left?: string }
  if (mar && typeof mar === 'object' && mar.top) {
    const u = mar.unit || 'px'
    style.margin = `${mar.top}${u} ${mar.right}${u} ${mar.bottom}${u} ${mar.left}${u}`
  }

  // Min height
  if (s.height === 'min-height') {
    const h = s.custom_height as { unit?: string; size?: number }
    if (h?.size) style.minHeight = `${h.size}${h.unit || 'px'}`
  } else if (s.height === 'fit') {
    style.height = 'fit-content'
  }

  // Width
  if (s.content_width === 'boxed') {
    style.maxWidth = '1140px'
    style.marginLeft = 'auto'
    style.marginRight = 'auto'
    style.width = '100%'
  }

  // Column size (legacy)
  const colSize = s._column_size as number
  if (colSize) style.width = `${colSize}%`

  // Border radius
  const br = s.border_radius as { unit?: string; top?: string; right?: string; bottom?: string; left?: string }
  if (br && typeof br === 'object' && br.top) {
    const u = br.unit || 'px'
    style.borderRadius = `${br.top}${u} ${br.right}${u} ${br.bottom}${u} ${br.left}${u}`
  }

  return style
}

function RenderContainer({
  element,
  editMode,
  onTextEdit,
}: {
  element: ElementorElement
  editMode?: boolean
  onTextEdit?: (elementId: string, field: string, value: string) => void
}) {
  const style = getContainerStyle(element.settings)

  return (
    <div style={style}>
      {element.elements.map((child) => (
        <RenderElement key={child.id} element={child} editMode={editMode} onTextEdit={onTextEdit} />
      ))}
    </div>
  )
}

function EditableSpan({
  value,
  editMode,
  onSave,
  className,
  style,
  tag: Tag = 'span',
}: {
  value: string
  editMode?: boolean
  onSave: (v: string) => void
  className?: string
  style?: React.CSSProperties
  tag?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div'
}) {
  if (editMode) {
    return (
      <Tag
        contentEditable
        suppressContentEditableWarning
        onBlur={(e) => {
          const v = (e.target as HTMLElement).textContent ?? ''
          if (v !== value) onSave(v)
        }}
        className={className}
        style={{
          ...style,
          outline: 'none',
          boxShadow: '0 0 0 1px rgba(230,168,23,0.4)',
          borderRadius: '2px',
          cursor: 'text',
        }}
      >
        {value}
      </Tag>
    )
  }
  return (
    <Tag className={className} style={style}>
      {value}
    </Tag>
  )
}

function getTypographyStyle(s: Record<string, unknown>, prefix = 'typography'): React.CSSProperties {
  const style: React.CSSProperties = {}
  const fs = s[`${prefix}_font_size`] as { unit?: string; size?: number }
  if (fs?.size) style.fontSize = `${fs.size}${fs.unit || 'px'}`
  const ff = s[`${prefix}_font_family`] as string
  if (ff) style.fontFamily = ff
  const fw = s[`${prefix}_font_weight`] as string
  if (fw) style.fontWeight = fw as React.CSSProperties['fontWeight']
  const lh = s[`${prefix}_line_height`] as { unit?: string; size?: number }
  if (lh?.size) style.lineHeight = `${lh.size}${lh.unit || 'px'}`
  const ls = s[`${prefix}_letter_spacing`] as { unit?: string; size?: number }
  if (ls?.size) style.letterSpacing = `${ls.size}${ls.unit || 'px'}`
  return style
}

function getAlignStyle(align?: string): React.CSSProperties {
  if (!align) return {}
  return { textAlign: align as React.CSSProperties['textAlign'] }
}

function RenderWidget({
  element,
  editMode,
  onTextEdit,
}: {
  element: ElementorElement
  editMode?: boolean
  onTextEdit?: (elementId: string, field: string, value: string) => void
}) {
  const s = element.settings
  const wt = element.widgetType

  // Common margin/padding
  const wrapStyle: React.CSSProperties = {}
  const mar = s._margin as { unit?: string; top?: string; right?: string; bottom?: string; left?: string }
  if (mar && typeof mar === 'object' && mar.top) {
    const u = mar.unit || 'px'
    wrapStyle.margin = `${mar.top}${u} ${mar.right}${u} ${mar.bottom}${u} ${mar.left}${u}`
  }
  const pad = s._padding as { unit?: string; top?: string; right?: string; bottom?: string; left?: string }
  if (pad && typeof pad === 'object' && pad.top) {
    const u = pad.unit || 'px'
    wrapStyle.padding = `${pad.top}${u} ${pad.right}${u} ${pad.bottom}${u} ${pad.left}${u}`
  }

  switch (wt) {
    case 'heading': {
      const tag = (s.header_size as string) || 'h2'
      const typo = getTypographyStyle(s)
      const align = getAlignStyle(s.align as string)
      const color = s.title_color as string
      const style = { ...typo, ...align, color: color || 'inherit', ...wrapStyle }
      const Tag = tag as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
      return (
        <EditableSpan
          value={(s.title as string) || ''}
          editMode={editMode}
          onSave={(v) => onTextEdit?.(element.id, 'title', v)}
          tag={Tag}
          style={style}
        />
      )
    }

    case 'text-editor': {
      const typo = getTypographyStyle(s)
      const align = getAlignStyle(s.align as string)
      const color = s.text_color as string
      const style = { ...typo, ...align, color: color || 'inherit', ...wrapStyle }
      const html = (s.editor as string) || ''
      if (editMode) {
        return (
          <div
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => {
              const v = (e.target as HTMLElement).innerHTML
              onTextEdit?.(element.id, 'editor', v)
            }}
            style={{
              ...style,
              outline: 'none',
              boxShadow: '0 0 0 1px rgba(230,168,23,0.4)',
              borderRadius: '2px',
              cursor: 'text',
            }}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        )
      }
      return <div style={style} dangerouslySetInnerHTML={{ __html: html }} />
    }

    case 'button': {
      const text = (s.text as string) || 'Button'
      const size = s.size as string
      const align = getAlignStyle(s.align as string)
      const bg = (s.background_color as string) || '#e6a817'
      const txtColor = (s.button_text_color as string) || '#fff'
      const typo = getTypographyStyle(s)
      const br = s.border_radius as { unit?: string; top?: string }
      const radius = br?.top ? `${br.top}${br.unit || 'px'}` : '4px'
      const padMap: Record<string, string> = {
        sm: '8px 16px',
        md: '12px 24px',
        lg: '16px 32px',
        xl: '20px 40px',
      }
      return (
        <div style={{ ...align, ...wrapStyle }}>
          <button
            style={{
              backgroundColor: bg,
              color: txtColor,
              padding: padMap[size] || padMap.md,
              borderRadius: radius,
              border: 'none',
              cursor: 'pointer',
              fontWeight: '600',
              display: 'inline-block',
              ...typo,
            }}
          >
            {text}
          </button>
        </div>
      )
    }

    case 'image': {
      const img = s.image as { url?: string }
      const align = getAlignStyle(s.align as string)
      const w = s.width as { unit?: string; size?: number }
      const width = w?.size ? `${w.size}${w.unit || '%'}` : '100%'
      if (!img?.url) return null
      return (
        <div style={{ ...align, ...wrapStyle }}>
          <img
            src={img.url}
            alt=""
            style={{ width, maxWidth: '100%', height: 'auto', borderRadius: '4px' }}
          />
        </div>
      )
    }

    case 'icon-box': {
      const icon = s.selected_icon as { value?: string }
      const title = (s.title_text as string) || ''
      const desc = (s.description_text as string) || ''
      const pos = (s.position as string) || 'top'
      const color = (s.primary_color as string) || '#e6a817'
      const iconSize = s.icon_size as { size?: number }
      const titleTypo = getTypographyStyle(s, 'title_typography')
      const descTypo = getTypographyStyle(s, 'description_typography')
      const titleColor = (s.title_color as string) || 'inherit'
      const descColor = (s.description_color as string) || '#999'

      return (
        <div
          style={{
            display: 'flex',
            flexDirection: pos === 'left' ? 'row' : 'column',
            alignItems: pos === 'left' ? 'flex-start' : 'center',
            gap: '12px',
            textAlign: pos === 'left' ? 'left' : 'center',
            ...wrapStyle,
          }}
        >
          {icon?.value && (
            <div
              style={{
                color,
                fontSize: iconSize?.size ? `${iconSize.size}px` : '40px',
                flexShrink: 0,
              }}
            >
              <i className={icon.value} />
            </div>
          )}
          <div>
            <EditableSpan
              value={title}
              editMode={editMode}
              onSave={(v) => onTextEdit?.(element.id, 'title_text', v)}
              tag="h3"
              style={{ ...titleTypo, color: titleColor, margin: '0 0 4px 0' }}
            />
            <EditableSpan
              value={desc}
              editMode={editMode}
              onSave={(v) => onTextEdit?.(element.id, 'description_text', v)}
              tag="p"
              style={{ ...descTypo, color: descColor, margin: 0 }}
            />
          </div>
        </div>
      )
    }

    case 'counter': {
      const end = (s.ending_number as number) ?? 100
      const prefix = (s.prefix as string) || ''
      const suffix = (s.suffix as string) || ''
      const title = (s.title as string) || ''
      const titleColor = (s.title_color as string) || '#999'
      const numColor = (s.number_color as string) || '#e6a817'
      return (
        <div style={{ textAlign: 'center', ...wrapStyle }}>
          <div style={{ fontSize: '40px', fontWeight: '700', color: numColor }}>
            {prefix}
            {end}
            {suffix}
          </div>
          {title && (
            <EditableSpan
              value={title}
              editMode={editMode}
              onSave={(v) => onTextEdit?.(element.id, 'title', v)}
              tag="p"
              style={{ color: titleColor, margin: '4px 0 0' }}
            />
          )}
        </div>
      )
    }

    case 'testimonial': {
      const content = (s.testimonial_content as string) || ''
      const name = (s.testimonial_name as string) || ''
      const job = (s.testimonial_job as string) || ''
      const img = s.testimonial_image as { url?: string }
      return (
        <div style={{ textAlign: 'center', ...wrapStyle }}>
          {img?.url && (
            <img
              src={img.url}
              alt={name}
              style={{ width: '60px', height: '60px', borderRadius: '50%', margin: '0 auto 12px' }}
            />
          )}
          <EditableSpan
            value={`"${content}"`}
            editMode={editMode}
            onSave={(v) => onTextEdit?.(element.id, 'testimonial_content', v.replace(/^"|"$/g, ''))}
            tag="p"
            style={{ fontStyle: 'italic', color: '#ccc', marginBottom: '12px' }}
          />
          <EditableSpan
            value={name}
            editMode={editMode}
            onSave={(v) => onTextEdit?.(element.id, 'testimonial_name', v)}
            tag="p"
            style={{ fontWeight: '600', margin: '0', color: 'inherit' }}
          />
          <EditableSpan
            value={job}
            editMode={editMode}
            onSave={(v) => onTextEdit?.(element.id, 'testimonial_job', v)}
            tag="p"
            style={{ color: '#999', fontSize: '13px', margin: '2px 0 0' }}
          />
        </div>
      )
    }

    case 'star-rating': {
      const rating = (s.rating as number) ?? 5
      const scale = (s.rating_scale as number) ?? 5
      const title = (s.title as string) || ''
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', ...wrapStyle }}>
          {title && <span style={{ fontSize: '14px' }}>{title}</span>}
          <div style={{ display: 'flex', gap: '2px' }}>
            {Array.from({ length: scale }).map((_, i) => (
              <Star
                key={i}
                size={16}
                style={{
                  fill: i < Math.floor(rating) ? '#e6a817' : 'transparent',
                  color: '#e6a817',
                }}
              />
            ))}
          </div>
        </div>
      )
    }

    case 'divider': {
      const color = (s.color as string) || '#333'
      const weight = s.weight as { size?: number }
      const w = s.width as { size?: number; unit?: string }
      return (
        <div style={{ ...wrapStyle }}>
          <hr
            style={{
              border: 'none',
              borderTop: `${weight?.size || 1}px ${(s.style as string) || 'solid'} ${color}`,
              width: w?.size ? `${w.size}${w.unit || '%'}` : '100%',
              margin: '0 auto',
            }}
          />
        </div>
      )
    }

    case 'spacer': {
      const space = s.space as { size?: number; unit?: string }
      return <div style={{ height: space?.size ? `${space.size}${space.unit || 'px'}` : '50px' }} />
    }

    case 'social-icons': {
      const list = (s.social_icon_list as Array<{ social_icon?: { value?: string }; link?: { url?: string } }>) || []
      return (
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', ...wrapStyle }}>
          {list.map((item, i) => (
            <a
              key={i}
              href={item.link?.url || '#'}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: '#333',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                textDecoration: 'none',
                fontSize: '16px',
              }}
            >
              {item.social_icon?.value && <i className={item.social_icon.value} />}
            </a>
          ))}
        </div>
      )
    }

    case 'accordion': {
      const tabs = (s.tabs as Array<{ tab_title?: string; tab_content?: string }>) || []
      return (
        <div style={wrapStyle}>
          {tabs.map((tab, i) => (
            <AccordionItem key={i} title={tab.tab_title || ''} content={tab.tab_content || ''} />
          ))}
        </div>
      )
    }

    case 'video': {
      const type = (s.video_type as string) || 'youtube'
      const url = (s.youtube_url as string) || (s.vimeo_url as string) || ''
      let embedUrl = url
      if (type === 'youtube') {
        const match = url.match(/(?:v=|\/)([\w-]{11})/)
        if (match) embedUrl = `https://www.youtube.com/embed/${match[1]}`
      }
      return (
        <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, ...wrapStyle }}>
          <iframe
            src={embedUrl}
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none', borderRadius: '4px' }}
            allowFullScreen
          />
        </div>
      )
    }

    case 'image-gallery': {
      const gallery = (s.gallery as Array<{ url?: string }>) || []
      const cols = (s.columns as number) || 3
      return (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            gap: '8px',
            ...wrapStyle,
          }}
        >
          {gallery.map((img, i) => (
            <img
              key={i}
              src={img.url || ''}
              alt=""
              style={{ width: '100%', height: 'auto', borderRadius: '4px' }}
            />
          ))}
        </div>
      )
    }

    case 'progress': {
      const title = (s.title as string) || ''
      const percent = s.percent as { size?: number }
      const pct = percent?.size || 0
      return (
        <div style={wrapStyle}>
          {title && <div style={{ fontSize: '14px', marginBottom: '4px' }}>{title}</div>}
          <div style={{ backgroundColor: '#333', borderRadius: '4px', height: '20px', overflow: 'hidden' }}>
            <div
              style={{
                width: `${pct}%`,
                height: '100%',
                backgroundColor: '#e6a817',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px',
                color: '#000',
                fontWeight: '600',
              }}
            >
              {pct}%
            </div>
          </div>
        </div>
      )
    }

    case 'alert': {
      const type = (s.alert_type as string) || 'info'
      const title = (s.alert_title as string) || ''
      const desc = (s.alert_description as string) || ''
      const colors: Record<string, { bg: string; border: string }> = {
        info: { bg: '#d1ecf1', border: '#bee5eb' },
        success: { bg: '#d4edda', border: '#c3e6cb' },
        warning: { bg: '#fff3cd', border: '#ffeaa7' },
        danger: { bg: '#f8d7da', border: '#f5c6cb' },
      }
      const c = colors[type] || colors.info
      return (
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: c.bg,
            border: `1px solid ${c.border}`,
            borderRadius: '4px',
            color: '#333',
            ...wrapStyle,
          }}
        >
          {title && <div style={{ fontWeight: '600', marginBottom: '4px' }}>{title}</div>}
          {desc && <div style={{ fontSize: '14px' }}>{desc}</div>}
        </div>
      )
    }

    default:
      return (
        <div
          style={{
            padding: '8px 12px',
            backgroundColor: '#1a1a2e',
            border: '1px dashed #333',
            borderRadius: '4px',
            fontSize: '12px',
            color: '#666',
            ...wrapStyle,
          }}
        >
          [{wt}]
        </div>
      )
  }
}

function AccordionItem({ title, content }: { title: string; content: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ borderBottom: '1px solid #333' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%',
          padding: '12px 0',
          background: 'none',
          border: 'none',
          color: 'inherit',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '15px',
          fontWeight: '500',
        }}
      >
        {title}
        <ChevronDown
          size={16}
          style={{
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
          }}
        />
      </button>
      {open && (
        <div
          style={{ padding: '0 0 12px', fontSize: '14px', color: '#999' }}
          dangerouslySetInnerHTML={{ __html: content }}
        />
      )}
    </div>
  )
}
