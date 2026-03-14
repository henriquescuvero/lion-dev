import DOMPurify from 'dompurify'

/**
 * Sanitize HTML content to prevent XSS attacks
 */
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p', 'br', 'b', 'i', 'u', 'em', 'strong', 'a', 'ul', 'ol', 'li',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'div', 'blockquote',
      'sub', 'sup', 'hr', 'img',
    ],
    ALLOWED_ATTR: [
      'href', 'target', 'rel', 'src', 'alt', 'width', 'height',
      'style', 'class', 'id',
    ],
    ALLOW_DATA_ATTR: false,
  })
}

/**
 * Validate URL to prevent javascript: and data: injection
 */
export function isValidUrl(url: string): boolean {
  if (!url || url === '#') return true
  if (url.startsWith('/') || url.startsWith('#')) return true

  try {
    const parsed = new URL(url)
    return ['http:', 'https:', 'mailto:', 'tel:'].includes(parsed.protocol)
  } catch {
    return false
  }
}

/**
 * Sanitize a URL, returning '#' if invalid
 */
export function sanitizeUrl(url: string): string {
  return isValidUrl(url) ? url : '#'
}
