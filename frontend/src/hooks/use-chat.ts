import { useAppStore } from '@/stores/app-store'
import { useMessages } from './use-messages'
import { useProjects, type Project } from './use-projects'
import { useTemplateVersions } from './use-template'
import { sendChatMessage, extractJsonFromResponse, extractTextFromResponse, DEFAULT_SYSTEM_PROMPT } from '@/services/ai'
import { generateId } from '@/lib/utils'
import type { ElementorTemplate } from '@/types/elementor'
import type { Message } from './use-messages'

export function useChat(project: Project | null) {
  const projectId = project?.id ?? null
  const { messages, loading: messagesLoading, addMessage, addLocalMessage, clearMessages, refetch: refetchMessages } = useMessages(projectId)
  const { updateProject, createProject } = useProjects()
  const { saveVersion } = useTemplateVersions(projectId)
  const { setIsLoading, setStreamingText } = useAppStore()

  async function sendMessage(content: string, images?: string[]) {
    let currentProjectId = projectId
    let currentProject = project

    // Auto-create project if none
    if (!currentProjectId) {
      const name = content.substring(0, 40) + (content.length > 40 ? '...' : '')
      currentProject = await createProject(name)
      if (!currentProject) return
      currentProjectId = currentProject.id
    }

    // Add user message locally first for instant feedback
    const tempUserMsg: Message = {
      id: generateId(),
      project_id: currentProjectId,
      role: 'user',
      content,
      images,
      created_at: new Date().toISOString(),
      template_json: null,
    }
    addLocalMessage(tempUserMsg)
    setIsLoading(true)
    setStreamingText(null)

    // Save user message to DB
    await addMessage({
      project_id: currentProjectId,
      role: 'user',
      content,
    })

    try {
      // Build API messages
      const apiMessages: Array<{
        role: 'user' | 'assistant'
        content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>
      }> = []

      const allMessages = [...messages, tempUserMsg]
      for (const m of allMessages) {
        if (m.role === 'user') {
          if (m.images && m.images.length > 0) {
            apiMessages.push({
              role: 'user',
              content: [
                { type: 'text', text: m.content || 'Analise esta imagem e crie um template Elementor baseado nela.' },
                ...m.images.map((img) => ({ type: 'image_url', image_url: { url: img } })),
              ],
            })
          } else if (m.content) {
            apiMessages.push({ role: 'user', content: m.content })
          }
        } else if (m.role === 'ai') {
          let aiContent = m.content || ''
          if (m.template_json) {
            aiContent += '\n\n```json\n' + JSON.stringify(m.template_json, null, 2) + '\n```'
          }
          if (aiContent.trim()) {
            apiMessages.push({ role: 'assistant', content: aiContent })
          }
        }
      }

      // Inject current template context if exists
      const currentTemplate = currentProject?.current_template
      if (currentTemplate && !allMessages.some((m) => m.role === 'ai' && m.template_json)) {
        apiMessages.splice(Math.max(0, apiMessages.length - 1), 0, {
          role: 'assistant',
          content: 'Template atual da página:\n\n```json\n' + JSON.stringify(currentTemplate, null, 2) + '\n```',
        })
      }

      const systemPrompt = currentProject?.system_prompt || DEFAULT_SYSTEM_PROMPT
      const fullResponse = await sendChatMessage(
        apiMessages,
        currentProject?.model || 'claude-sonnet-4-5-20250929',
        systemPrompt,
        (partial) => setStreamingText(partial),
        (status) => setStreamingText('⚡ ' + status)
      )

      setStreamingText(null)

      const json = extractJsonFromResponse(fullResponse) as ElementorTemplate | null
      const text = extractTextFromResponse(fullResponse)

      // Save AI message
      const aiMsg = await addMessage({
        project_id: currentProjectId,
        role: 'ai',
        content: text || (json ? 'Template gerado com sucesso!' : fullResponse),
        template_json: json,
      })

      // Update project template
      if (json && currentProjectId) {
        await updateProject(currentProjectId, { current_template: json })
        await saveVersion(json)
      }

      // Refetch to sync with DB
      if (aiMsg) {
        addLocalMessage({
          ...aiMsg,
          images: undefined,
        })
      }
    } catch (error) {
      addLocalMessage({
        id: generateId(),
        project_id: currentProjectId,
        role: 'ai',
        content: `Erro ao conectar com a IA: ${error instanceof Error ? error.message : 'Erro desconhecido'}. Tente novamente.`,
        template_json: null,
        created_at: new Date().toISOString(),
      })
    } finally {
      setIsLoading(false)
    }
  }

  return {
    messages,
    messagesLoading,
    sendMessage,
    clearMessages,
    refetchMessages,
  }
}
