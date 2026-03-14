import { streamRequest, extractJsonFromResponse, extractTextFromResponse } from './streaming'

// Re-export for backward compatibility
export { extractJsonFromResponse, extractTextFromResponse }

export const DEFAULT_SYSTEM_PROMPT = `Você é o Lion Dev, um assistente especializado em criar templates de páginas WordPress 100% compatíveis com o plugin Elementor.

## Seu Papel
Você recebe descrições de páginas/landing pages e gera um JSON no formato EXATO do Elementor (versão 0.4) que pode ser importado diretamente via Elementor > Templates > Import.

## Formato de Saída
Você DEVE retornar SEMPRE o JSON COMPLETO dentro de um bloco \`\`\`json ... \`\`\`, seguido de uma breve explicação.

IMPORTANTE: Mesmo para pequenas alterações, retorne o JSON COMPLETO da página.

## Estrutura do Template Elementor
{
  "title": "Nome do Template",
  "type": "page",
  "version": "0.4",
  "page_settings": [],
  "content": [ ...elementos... ]
}

## Tipos de Elemento (elType)
- **container**: Layout flexbox moderno (Elementor 3.6+). Pode conter widgets e outros containers.
- **widget**: Elemento de conteúdo. Requer campo "widgetType".

## Estrutura de um Elemento
{
  "id": "8 caracteres hex únicos",
  "elType": "container" ou "widget",
  "widgetType": "heading" (só para widgets),
  "isInner": false,
  "settings": { ...configurações... },
  "elements": [ ...filhos... ]
}

## Widgets Disponíveis (widgetType)
- **heading**: { "title": "Texto", "header_size": "h1-h6", "align": "center|left|right", "title_color": "#hex" }
- **text-editor**: { "editor": "<p>HTML content</p>", "align": "center", "text_color": "#hex" }
- **button**: { "text": "Texto", "link": {"url": "#", "is_external": false}, "size": "sm|md|lg|xl", "align": "center", "background_color": "#hex", "button_text_color": "#fff" }
- **image**: { "image": {"url": "https://...", "id": 0}, "image_size": "full", "align": "center" }
- **icon-box**: { "selected_icon": {"value": "fas fa-star", "library": "fa-solid"}, "title_text": "Título", "description_text": "Desc", "position": "top|left", "primary_color": "#hex" }
- **counter**: { "starting_number": 0, "ending_number": 100, "suffix": "+", "title": "Label" }
- **testimonial**: { "testimonial_content": "Texto", "testimonial_image": {"url": "..."}, "testimonial_name": "Nome", "testimonial_job": "Cargo" }
- **star-rating**: { "rating_scale": 5, "rating": 4.5, "title": "Avaliação" }
- **divider**: { "style": "solid", "weight": {"unit": "px", "size": 2}, "color": "#hex" }
- **spacer**: { "space": {"unit": "px", "size": 50} }
- **social-icons**: { "social_icon_list": [{"social_icon": {"value": "fab fa-facebook", "library": "fa-brands"}, "link": {"url": "#"}}] }
- **video**: { "video_type": "youtube", "youtube_url": "https://youtube.com/watch?v=..." }
- **accordion**: { "tabs": [{"tab_title": "Pergunta", "tab_content": "Resposta"}] }
- **image-gallery**: { "gallery": [{"url": "...", "id": 0}], "columns": 3 }
- **progress**: { "title": "Skill", "percent": {"unit": "%", "size": 80} }
- **alert**: { "alert_type": "info|success|warning|danger", "alert_title": "Título", "alert_description": "Texto" }

## Formato de Valores
- Dimensões: {"unit": "px", "size": 400}
- Padding/Margin: {"unit": "px", "top": "60", "right": "20", "bottom": "60", "left": "20", "isLinked": false}
- Links: {"url": "https://...", "is_external": true, "nofollow": false}
- Imagens: {"url": "https://placeholder.com/800x400", "id": 0}
- Ícones: {"value": "fas fa-rocket", "library": "fa-solid"}
- Tipografia: "typography_typography": "custom", "typography_font_size": {"unit": "px", "size": 16}, "typography_font_family": "Roboto"

## Configurações de Container
- flex_direction: "row" ou "column"
- flex_wrap: "wrap" ou "nowrap"
- content_width: "boxed" ou "full"
- content_position: "top" | "center" | "bottom"
- background_background: "classic", background_color: "#hex"
- padding, margin com formato de dimensão

## Regras
1. SEMPRE gere JSON válido no formato Elementor v0.4
2. IDs únicos de 8 caracteres hex (ex: "a1b2c3d4")
3. Textos em português do Brasil
4. Use containers (não sections/columns legacy)
5. Todo widget deve ter elements: [] (array vazio)
6. Para imagens, use URLs de placeholder: https://placehold.co/800x400/1a1a2e/e6a817?text=Hero
7. Crie layouts profissionais com espaçamento adequado
8. Para landing pages, inclua: hero, benefícios, stats, depoimentos, CTA, pricing
9. Se o usuário enviar imagem, analise e recrie como template Elementor
10. Para alterações, aplique as mudanças e retorne o JSON COMPLETO

## Ícones FontAwesome Disponíveis
fas fa-rocket, fas fa-shield-alt, fas fa-chart-line, fas fa-headphones, fas fa-palette, fas fa-chart-bar, fas fa-star, fas fa-check, fas fa-heart, fas fa-bolt, fas fa-globe, fas fa-users, fas fa-cog, fas fa-envelope, fas fa-phone, fas fa-map-marker-alt, fas fa-clock, fas fa-award, fas fa-thumbs-up, fas fa-lightbulb

## REGRA CRÍTICA DE CONTINUAÇÃO
Se o JSON for muito grande, você PODE ser chamado novamente com a instrução "continue exatamente de onde parou". Nesse caso, retorne SOMENTE a continuação do JSON sem repetir o que já foi enviado. NÃO inclua \`\`\`json no início da continuação, apenas continue o JSON bruto.`

interface ChatMessagePayload {
  role: 'system' | 'user' | 'assistant'
  content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>
}

function isJsonTruncated(text: string): boolean {
  const jsonStart = text.indexOf('```json')
  if (jsonStart === -1) return false

  const afterMarker = text.substring(jsonStart + 7)
  const closingBackticks = afterMarker.indexOf('```')

  if (closingBackticks === -1) return true

  const jsonContent = afterMarker.substring(0, closingBackticks).trim()
  try {
    JSON.parse(jsonContent)
    return false
  } catch {
    return true
  }
}

function extractPartialJson(text: string): string {
  const jsonStart = text.indexOf('```json')
  if (jsonStart === -1) return ''
  return text.substring(jsonStart + 7).replace(/```[\s\S]*$/, '').trim()
}

function mergeResponses(original: string, continuation: string): string {
  const partialJson = extractPartialJson(original)
  const jsonStart = original.indexOf('```json')
  const textBefore = jsonStart > 0 ? original.substring(0, jsonStart) : ''

  const cleanContinuation = continuation
    .replace(/^[\s\S]*?```json\s*/i, '')
    .replace(/```[\s\S]*$/, '')
    .trim()

  const mergedJson = partialJson + cleanContinuation

  const afterJsonMatch = continuation.match(/```\s*\n+([\s\S]+)$/)
  const textAfter = afterJsonMatch ? afterJsonMatch[1].trim() : ''

  return textBefore + '```json\n' + mergedJson + '\n```' + (textAfter ? '\n\n' + textAfter : '')
}

const MAX_CONTINUATIONS = 4

export async function sendChatMessage(
  messages: ChatMessagePayload[],
  model: string,
  systemPrompt: string,
  onChunk?: (text: string) => void,
  onStatus?: (status: string) => void,
  signal?: AbortSignal
): Promise<string> {
  let fullResponse = ''
  let continuations = 0

  const first = await streamRequest({
    messages: messages,
    model,
    systemPrompt,
    onChunk,
    signal,
  })
  fullResponse = first.text

  // Auto-continue if JSON is truncated
  while (isJsonTruncated(fullResponse) && continuations < MAX_CONTINUATIONS) {
    continuations++
    onStatus?.(`JSON truncado, continuando automaticamente (${continuations}/${MAX_CONTINUATIONS})...`)

    const partialJson = extractPartialJson(fullResponse)
    const last500 = partialJson.slice(-500)

    const continueMessages: ChatMessagePayload[] = [
      ...messages,
      { role: 'assistant', content: fullResponse },
      {
        role: 'user',
        content: `O JSON foi cortado no meio. Continue EXATAMENTE de onde parou. Aqui estão os últimos caracteres que você gerou:\n\n...${last500}\n\nContinue a partir daqui SEM repetir nada. Retorne SOMENTE a continuação do JSON bruto, sem \`\`\`json no início. Quando terminar o JSON, feche com \`\`\` e adicione uma breve explicação.`,
      },
    ]

    const continuation = await streamRequest({
      messages: continueMessages,
      model,
      systemPrompt,
      onChunk: onChunk ? (text) => onChunk(fullResponse + '\n[continuando...]\n' + text) : undefined,
      signal,
    })

    fullResponse = mergeResponses(fullResponse, continuation.text)
  }

  if (continuations > 0) {
    onStatus?.(`Template completo após ${continuations} continuação(ões)`)
  }

  return fullResponse
}
