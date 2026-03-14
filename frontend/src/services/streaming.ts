import { API_KEY, API_BASE_URL } from '@/lib/constants'

export interface StreamRequestOptions {
  messages: Array<{
    role: 'system' | 'user' | 'assistant'
    content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>
  }>
  model: string
  systemPrompt: string
  maxTokens?: number
  onChunk?: (text: string) => void
  signal?: AbortSignal
}

interface StreamResult {
  text: string
  finishReason: string | null
}

/**
 * Shared streaming API call — used by both single and chunked generation.
 * Supports AbortController for cancellation.
 */
export async function streamRequest(options: StreamRequestOptions): Promise<StreamResult> {
  const { messages, model, systemPrompt, maxTokens = 64000, onChunk, signal } = options

  const response = await fetch(`${API_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
      max_tokens: maxTokens,
      stream: !!onChunk,
    }),
    signal,
  })

  if (!response.ok) {
    let errorDetails: string
    try {
      const json = await response.json()
      errorDetails = json.error?.message || JSON.stringify(json)
    } catch {
      errorDetails = await response.text()
    }
    throw new Error(`API Error (${response.status}): ${errorDetails}`)
  }

  if (onChunk && response.body) {
    return parseSSEStream(response.body, onChunk)
  }

  const data = await response.json()
  return {
    text: data.choices?.[0]?.message?.content ?? '',
    finishReason: data.choices?.[0]?.finish_reason ?? null,
  }
}

/**
 * Parse SSE stream from the API, calling onChunk with accumulated text.
 * Throttles onChunk calls to avoid excessive re-renders.
 */
async function parseSSEStream(
  body: ReadableStream<Uint8Array>,
  onChunk: (text: string) => void
): Promise<StreamResult> {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let fullText = ''
  let buffer = ''
  let finishReason: string | null = null
  let lastChunkTime = 0
  const THROTTLE_MS = 50

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      let hasNewContent = false

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed.startsWith('data: ')) continue
        const data = trimmed.slice(6)
        if (data === '[DONE]') continue

        try {
          const parsed = JSON.parse(data)
          const content = parsed.choices?.[0]?.delta?.content
          const reason = parsed.choices?.[0]?.finish_reason
          if (reason) finishReason = reason
          if (content) {
            fullText += content
            hasNewContent = true
          }
        } catch {
          // skip malformed chunks — this is expected for partial SSE data
        }
      }

      // Throttle UI updates
      if (hasNewContent) {
        const now = Date.now()
        if (now - lastChunkTime >= THROTTLE_MS) {
          onChunk(fullText)
          lastChunkTime = now
        }
      }
    }

    // Process remaining buffer
    if (buffer.trim().startsWith('data: ')) {
      const data = buffer.trim().slice(6)
      if (data !== '[DONE]') {
        try {
          const parsed = JSON.parse(data)
          const content = parsed.choices?.[0]?.delta?.content
          const reason = parsed.choices?.[0]?.finish_reason
          if (reason) finishReason = reason
          if (content) fullText += content
        } catch { /* skip */ }
      }
    }

    // Final update with complete text
    onChunk(fullText)
  } finally {
    reader.releaseLock()
  }

  return { text: fullText, finishReason }
}

/**
 * Extract JSON from AI response text (supports ```json blocks, raw JSON, etc.)
 */
export function extractJsonFromResponse(text: string): Record<string, unknown> | null {
  // Try ```json ... ``` first
  const jsonMatch = text.match(/```json\s*([\s\S]*?)```/)
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[1].trim())
    } catch { /* malformed */ }
  }

  // Try any ``` ... ``` block
  const codeMatch = text.match(/```\s*([\s\S]*?)```/)
  if (codeMatch) {
    try {
      const parsed = JSON.parse(codeMatch[1].trim())
      if (parsed && typeof parsed === 'object') return parsed
    } catch { /* not json */ }
  }

  // Try raw JSON object
  try {
    const startIdx = text.indexOf('{')
    const endIdx = text.lastIndexOf('}')
    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
      const parsed = JSON.parse(text.substring(startIdx, endIdx + 1))
      if (parsed && (parsed.content || parsed.title)) return parsed
    }
  } catch { /* not valid */ }

  return null
}

/**
 * Extract human-readable text from AI response (remove JSON blocks)
 */
export function extractTextFromResponse(text: string): string {
  return text
    .replace(/```json\s*[\s\S]*?```/g, '')
    .replace(/```\s*[\s\S]*?```/g, '')
    .replace(/\[continuando\.\.\.\]/g, '')
    .trim()
}
