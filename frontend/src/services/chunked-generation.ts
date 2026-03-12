import { API_KEY, API_BASE_URL } from '@/lib/constants'

interface ChatMessagePayload {
  role: 'system' | 'user' | 'assistant'
  content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>
}

interface SectionPlan {
  sections: Array<{
    name: string
    description: string
  }>
}

interface ChunkedCallbacks {
  onPlanReady?: (sections: string[]) => void
  onSectionStart?: (index: number, total: number, name: string) => void
  onSectionStream?: (index: number, total: number, name: string, text: string) => void
  onSectionComplete?: (index: number, total: number, name: string) => void
  onAssembling?: () => void
  onComplete?: (template: Record<string, unknown>) => void
  onError?: (error: string) => void
}

async function apiCall(
  messages: ChatMessagePayload[],
  model: string,
  systemPrompt: string,
  onStream?: (text: string) => void
): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
      max_tokens: 16384,
      stream: !!onStream,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`API Error (${response.status}): ${error}`)
  }

  if (onStream && response.body) {
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let fullText = ''
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed.startsWith('data: ')) continue
        const data = trimmed.slice(6)
        if (data === '[DONE]') continue
        try {
          const parsed = JSON.parse(data)
          const content = parsed.choices?.[0]?.delta?.content
          if (content) {
            fullText += content
            onStream(fullText)
          }
        } catch { /* skip */ }
      }
    }

    if (buffer.trim().startsWith('data: ')) {
      const data = buffer.trim().slice(6)
      if (data !== '[DONE]') {
        try {
          const parsed = JSON.parse(data)
          const content = parsed.choices?.[0]?.delta?.content
          if (content) fullText += content
        } catch { /* skip */ }
      }
    }

    return fullText
  }

  const data = await response.json()
  return data.choices?.[0]?.message?.content ?? ''
}

const PLAN_PROMPT = `Você é um planejador de templates Elementor. O usuário vai descrever uma página.

Sua ÚNICA tarefa: analisar o pedido e retornar um JSON com a lista de seções que a página precisa.

Retorne APENAS um JSON assim, sem explicação:
\`\`\`json
{
  "sections": [
    { "name": "hero", "description": "Banner principal com título, subtítulo e CTA" },
    { "name": "beneficios", "description": "3 cards de benefícios com ícones" }
  ]
}
\`\`\`

Regras:
- Mínimo 3 seções, máximo 10
- Cada seção deve ser independente (pode ser gerada separadamente)
- Nomes curtos e descritivos
- Seções comuns: hero, beneficios, sobre, servicos, stats, depoimentos, pricing, faq, cta, contato, footer
- Se o usuário pedir alteração em template existente, liste TODAS as seções do template (as que mudam e as que permanecem)`

const SECTION_PROMPT = `Você é o Lion Dev, especializado em gerar seções de templates Elementor.

Sua tarefa: gerar APENAS UMA SEÇÃO específica como um container Elementor JSON.

Retorne SOMENTE o JSON do container (SEM o wrapper do template, SEM title/type/version/content).
Retorne dentro de \`\`\`json ... \`\`\`

O JSON deve ser UM ÚNICO container com seus widgets dentro. Exemplo:
\`\`\`json
{
  "id": "a1b2c3d4",
  "elType": "container",
  "isInner": false,
  "settings": { ... },
  "elements": [ ... ]
}
\`\`\`

Regras:
1. IDs únicos de 8 caracteres hex
2. Textos em português do Brasil
3. Use containers (não sections/columns legacy)
4. Todo widget deve ter elements: []
5. Imagens placeholder: https://placehold.co/800x400/1a1a2e/e6a817?text=Seção
6. Layout profissional com espaçamento adequado
7. Widgets disponíveis: heading, text-editor, button, image, icon-box, counter, testimonial, star-rating, divider, spacer, social-icons, video, accordion, image-gallery, progress, alert
8. Ícones: fas fa-rocket, fas fa-shield-alt, fas fa-chart-line, fas fa-headphones, fas fa-star, fas fa-check, fas fa-heart, fas fa-bolt, fas fa-globe, fas fa-users, etc.`

function extractJsonBlock(text: string): Record<string, unknown> | null {
  const jsonMatch = text.match(/```json\s*([\s\S]*?)```/)
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[1].trim())
    } catch { /* malformed */ }
  }

  try {
    const startIdx = text.indexOf('{')
    const endIdx = text.lastIndexOf('}')
    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
      return JSON.parse(text.substring(startIdx, endIdx + 1))
    }
  } catch { /* not valid */ }

  return null
}

export async function generateChunked(
  userRequest: string,
  contextMessages: ChatMessagePayload[],
  model: string,
  customSystemPrompt: string | null,
  existingTemplate: Record<string, unknown> | null,
  callbacks: ChunkedCallbacks
): Promise<{ template: Record<string, unknown>; explanation: string } | null> {
  try {
    // === STEP 1: Plan the sections ===
    const planMessages: ChatMessagePayload[] = [
      ...contextMessages,
      { role: 'user', content: userRequest },
    ]

    if (existingTemplate) {
      planMessages.splice(planMessages.length - 1, 0, {
        role: 'assistant',
        content: 'Template atual da página:\n\n```json\n' + JSON.stringify(existingTemplate, null, 2).substring(0, 2000) + '\n...(truncado)\n```',
      })
    }

    const planResponse = await apiCall(planMessages, model, PLAN_PROMPT)
    const plan = extractJsonBlock(planResponse) as SectionPlan | null

    if (!plan?.sections?.length) {
      callbacks.onError?.('Não foi possível planejar as seções da página')
      return null
    }

    const sectionNames = plan.sections.map((s) => s.name)
    callbacks.onPlanReady?.(sectionNames)

    // === STEP 2: Generate each section ===
    const generatedSections: Array<Record<string, unknown>> = []
    const totalSections = plan.sections.length

    for (let i = 0; i < totalSections; i++) {
      const section = plan.sections[i]
      callbacks.onSectionStart?.(i, totalSections, section.name)

      const sectionMessages: ChatMessagePayload[] = [
        {
          role: 'user',
          content: `Pedido original do usuário: "${userRequest}"

Gere a seção "${section.name}": ${section.description}

${existingTemplate ? `Contexto: Esta é uma alteração em uma página existente. Mantenha o estilo visual consistente.` : `Esta é a seção ${i + 1} de ${totalSections} de uma nova página.`}

${i > 0 ? `Seções já geradas: ${plan.sections.slice(0, i).map((s) => s.name).join(', ')}. Mantenha consistência visual.` : ''}`,
        },
      ]

      const sectionResponse = await apiCall(
        sectionMessages,
        model,
        customSystemPrompt ? SECTION_PROMPT + '\n\nContexto adicional:\n' + customSystemPrompt.substring(0, 500) : SECTION_PROMPT,
        (text) => callbacks.onSectionStream?.(i, totalSections, section.name, text)
      )

      const sectionJson = extractJsonBlock(sectionResponse)

      if (sectionJson) {
        generatedSections.push(sectionJson)
        callbacks.onSectionComplete?.(i, totalSections, section.name)
      } else {
        // Retry once for failed section
        callbacks.onSectionStream?.(i, totalSections, section.name, '⚠️ Regenerando seção...')
        const retryResponse = await apiCall(sectionMessages, model, SECTION_PROMPT)
        const retryJson = extractJsonBlock(retryResponse)
        if (retryJson) {
          generatedSections.push(retryJson)
          callbacks.onSectionComplete?.(i, totalSections, section.name)
        } else {
          callbacks.onError?.(`Falha ao gerar seção "${section.name}" após 2 tentativas`)
        }
      }
    }

    if (generatedSections.length === 0) {
      callbacks.onError?.('Nenhuma seção foi gerada com sucesso')
      return null
    }

    // === STEP 3: Assemble final template ===
    callbacks.onAssembling?.()

    const title = existingTemplate
      ? (existingTemplate as { title?: string }).title || 'Template'
      : userRequest.substring(0, 60)

    const template: Record<string, unknown> = {
      title,
      type: 'page',
      version: '0.4',
      page_settings: [],
      content: generatedSections,
    }

    // Validate the assembled template
    try {
      JSON.stringify(template)
    } catch {
      callbacks.onError?.('Erro ao montar o template final')
      return null
    }

    const explanation = `Template gerado com sucesso! ${generatedSections.length} seções criadas: ${sectionNames.slice(0, generatedSections.length).join(', ')}.`

    callbacks.onComplete?.(template)

    return { template, explanation }
  } catch (error) {
    callbacks.onError?.(error instanceof Error ? error.message : 'Erro desconhecido')
    return null
  }
}

/**
 * Detects if the user request is likely to produce a large template
 * that benefits from chunked generation
 */
export function shouldUseChunkedGeneration(content: string, hasExistingTemplate: boolean): boolean {
  const largeIndicators = [
    /landing\s*page/i,
    /página\s*(completa|inteira|toda)/i,
    /site\s*(completo|inteiro|todo)/i,
    /crie?\s*(uma?\s*)?(página|site|landing)/i,
    /home\s*page/i,
    /múltiplas?\s*seções/i,
    /várias?\s*seções/i,
    /página\s*de\s*vendas/i,
    /funil/i,
    /one\s*page/i,
  ]

  const isLargeRequest = largeIndicators.some((r) => r.test(content))
  const isModification = hasExistingTemplate && content.length > 20

  // Use chunked for new large pages or significant modifications
  return isLargeRequest || (isModification && /alter|mud|troc|refaz|recri|remodel/i.test(content))
}
