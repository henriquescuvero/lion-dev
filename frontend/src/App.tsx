import { useState, useRef, useEffect, useCallback } from 'react'
import { Header } from './components/layout/Header'
import { ChatMessage } from './components/chat/ChatMessage'
import { ChatInput } from './components/chat/ChatInput'
import { PagePreview } from './components/preview/PagePreview'
import { LoadingState } from './components/ui/LoadingState'
import { PromptModal } from './components/ui/PromptModal'
import { ProjectsSidebar } from './components/sidebar/ProjectsSidebar'
import { initialMessages } from './data/mock-response'
import { generateId } from './utils/helpers'
import {
  sendChatMessage,
  extractJsonFromResponse,
  extractTextFromResponse,
  DEFAULT_MODEL,
  loadSystemPrompt,
} from './services/ai'
import {
  loadProjects,
  saveProjects,
  createProject,
  deleteProject,
  loadActiveProjectId,
  saveActiveProjectId,
} from './services/projects'
import type { ChatMessage as ChatMessageType, ElementorTemplate } from './types'
import type { Project } from './services/projects'

function makeInitialMessages(): ChatMessageType[] {
  return initialMessages.map((m) => ({ ...m, id: generateId(), timestamp: new Date() }))
}

function initState() {
  const allProjects = loadProjects()
  const savedId = loadActiveProjectId()
  const activeId =
    savedId && allProjects.some((p) => p.id === savedId)
      ? savedId
      : allProjects.length > 0
        ? allProjects[0].id
        : null

  const project = activeId ? allProjects.find((p) => p.id === activeId) : null

  return {
    projects: allProjects,
    activeId,
    messages:
      project && project.messages.length > 0
        ? project.messages.map((m) => ({ ...m, timestamp: new Date(m.timestamp) }))
        : makeInitialMessages(),
    page: project?.page ?? null,
    model: project?.model ?? DEFAULT_MODEL,
  }
}

export default function App() {
  const [init] = useState(initState)
  const [projects, setProjects] = useState<Project[]>(init.projects)
  const [activeProjectId, setActiveProjectId] = useState<string | null>(init.activeId)
  const [messages, setMessages] = useState<ChatMessageType[]>(init.messages)
  const [isLoading, setIsLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState<ElementorTemplate | null>(init.page)
  const [model, setModel] = useState(init.model)
  const [showPrompt, setShowPrompt] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [streamingText, setStreamingText] = useState<string | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Refs for async access
  const messagesRef = useRef(messages)
  messagesRef.current = messages
  const projectsRef = useRef(projects)
  projectsRef.current = projects
  const activeIdRef = useRef(activeProjectId)
  activeIdRef.current = activeProjectId
  const currentPageRef = useRef(currentPage)
  currentPageRef.current = currentPage
  const saveLockRef = useRef(false)

  // Save activeProjectId to localStorage
  useEffect(() => {
    saveActiveProjectId(activeProjectId)
  }, [activeProjectId])

  // Persist project to storage
  function persistCurrentProject() {
    const id = activeIdRef.current
    if (!id || saveLockRef.current) return
    setProjects((prev) => {
      const updated = prev.map((p) =>
        p.id === id
          ? {
              ...p,
              messages: messagesRef.current,
              page: currentPageRef.current,
              model,
              updatedAt: new Date().toISOString(),
            }
          : p
      )
      saveProjects(updated)
      return updated
    })
  }

  // Debounced auto-save
  useEffect(() => {
    if (!activeProjectId || saveLockRef.current) return
    const timer = setTimeout(persistCurrentProject, 800)
    return () => clearTimeout(timer)
  }, [activeProjectId, messages, currentPage, model])

  // Switch projects — properly isolate state
  function switchToProject(projectId: string | null) {
    // Save current project first
    persistCurrentProject()

    saveLockRef.current = true
    setActiveProjectId(projectId)

    if (!projectId) {
      setMessages(makeInitialMessages())
      setCurrentPage(null)
      setModel(DEFAULT_MODEL)
      saveLockRef.current = false
      return
    }

    // Read FRESH from localStorage to get latest data
    const freshProjects = loadProjects()
    const project = freshProjects.find((p) => p.id === projectId)
    if (project) {
      const msgs =
        project.messages.length > 0
          ? project.messages.map((m) => ({ ...m, timestamp: new Date(m.timestamp) }))
          : makeInitialMessages()
      setMessages(msgs)
      messagesRef.current = msgs
      setCurrentPage(project.page)
      currentPageRef.current = project.page
      setModel(project.model)
    } else {
      setMessages(makeInitialMessages())
      setCurrentPage(null)
      setModel(DEFAULT_MODEL)
    }

    requestAnimationFrame(() => {
      saveLockRef.current = false
    })
  }

  const scrollToBottom = useCallback(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading, streamingText, scrollToBottom])

  function handleCreateProject(name: string) {
    // Save current project first
    persistCurrentProject()

    const project = createProject(name)
    const updated = [project, ...projectsRef.current]
    setProjects(updated)
    saveProjects(updated)

    // Set new project state with fresh initial messages
    saveLockRef.current = true
    setActiveProjectId(project.id)
    const freshMessages = makeInitialMessages()
    setMessages(freshMessages)
    messagesRef.current = freshMessages
    setCurrentPage(null)
    currentPageRef.current = null
    setModel(DEFAULT_MODEL)

    requestAnimationFrame(() => {
      saveLockRef.current = false
    })
  }

  function handleDeleteProject(id: string) {
    const updated = deleteProject(projectsRef.current, id)
    setProjects(updated)
    saveProjects(updated)
    if (activeProjectId === id) {
      if (updated.length > 0) {
        switchToProject(updated[0].id)
      } else {
        setActiveProjectId(null)
        setMessages(makeInitialMessages())
        setCurrentPage(null)
        setModel(DEFAULT_MODEL)
      }
    }
  }

  async function handleSendMessage(content: string, images?: string[]) {
    let projectId = activeIdRef.current

    // Auto-create project if none selected
    if (!projectId) {
      const name = content.substring(0, 40) + (content.length > 40 ? '...' : '')
      const project = createProject(name)
      const updated = [project, ...projectsRef.current]
      setProjects(updated)
      projectsRef.current = updated
      saveProjects(updated)
      setActiveProjectId(project.id)
      projectId = project.id
      activeIdRef.current = project.id
    }

    const userMessage: ChatMessageType = {
      id: generateId(),
      role: 'user',
      content,
      images,
      timestamp: new Date(),
    }

    const updatedMessages = [...messagesRef.current, userMessage]
    setMessages(updatedMessages)
    messagesRef.current = updatedMessages
    setIsLoading(true)
    setStreamingText(null)

    try {
      // Build API messages with full context
      const apiMessages: Array<{
        role: 'user' | 'assistant'
        content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>
      }> = []

      for (const m of updatedMessages) {
        if (m.role === 'user') {
          if (m.images && m.images.length > 0) {
            apiMessages.push({
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: m.content || 'Analise esta imagem e crie um template Elementor baseado nela.',
                },
                ...m.images.map((img) => ({
                  type: 'image_url',
                  image_url: { url: img },
                })),
              ],
            })
          } else if (m.content) {
            apiMessages.push({ role: 'user', content: m.content })
          }
        } else if (m.role === 'ai') {
          // Include AI responses with their JSON so the AI has context for modifications
          let aiContent = m.content || ''
          if (m.json) {
            aiContent += '\n\n```json\n' + JSON.stringify(m.json, null, 2) + '\n```'
          }
          if (aiContent.trim()) {
            apiMessages.push({ role: 'assistant', content: aiContent })
          }
        }
      }

      // If there's a current page but no AI message included the JSON,
      // inject it so the AI knows what to modify
      const currentPageJson = currentPageRef.current
      if (currentPageJson && !updatedMessages.some((m) => m.role === 'ai' && m.json)) {
        apiMessages.splice(Math.max(0, apiMessages.length - 1), 0, {
          role: 'assistant',
          content:
            'Template atual da página:\n\n```json\n' +
            JSON.stringify(currentPageJson, null, 2) +
            '\n```',
        })
      }

      const systemPrompt = loadSystemPrompt()
      const fullResponse = await sendChatMessage(
        apiMessages,
        model,
        systemPrompt,
        (partial) => {
          setStreamingText(partial)
        }
      )

      setStreamingText(null)

      const json = extractJsonFromResponse(fullResponse) as ElementorTemplate | null
      const text = extractTextFromResponse(fullResponse)

      const aiMessage: ChatMessageType = {
        id: generateId(),
        role: 'ai',
        content: text || (json ? 'Template gerado com sucesso!' : fullResponse),
        json: json ?? undefined,
        timestamp: new Date(),
      }

      const finalMessages = [...messagesRef.current, aiMessage]
      setMessages(finalMessages)
      messagesRef.current = finalMessages

      // Update preview when JSON is found
      if (json) {
        setCurrentPage(json)
        currentPageRef.current = json
      }

      // Always persist after AI response
      setProjects((prev) => {
        const updated = prev.map((p) =>
          p.id === projectId
            ? {
                ...p,
                messages: finalMessages,
                page: json ?? currentPageRef.current,
                model,
                updatedAt: new Date().toISOString(),
              }
            : p
        )
        saveProjects(updated)
        return updated
      })
    } catch (error) {
      const errorMsg: ChatMessageType = {
        id: generateId(),
        role: 'ai',
        content: `Erro ao conectar com a IA: ${error instanceof Error ? error.message : 'Erro desconhecido'}. Tente novamente.`,
        timestamp: new Date(),
      }
      const finalMessages = [...messagesRef.current, errorMsg]
      setMessages(finalMessages)
      messagesRef.current = finalMessages
    } finally {
      setIsLoading(false)
    }
  }

  function handlePageUpdate(page: ElementorTemplate) {
    setCurrentPage(page)
    currentPageRef.current = page
    setMessages((prev) => {
      const updated = [...prev]
      for (let i = updated.length - 1; i >= 0; i--) {
        if (updated[i].json) {
          updated[i] = { ...updated[i], json: page }
          break
        }
      }
      messagesRef.current = updated
      return updated
    })
  }

  return (
    <div className="h-screen flex flex-col bg-bg-primary overflow-hidden">
      <Header onShowPrompt={() => setShowPrompt(true)} />
      <div className="flex-1 flex min-h-0">
        <ProjectsSidebar
          projects={projects}
          activeProjectId={activeProjectId}
          onSelectProject={switchToProject}
          onCreateProject={handleCreateProject}
          onDeleteProject={handleDeleteProject}
        />

        {/* Chat Panel */}
        <div className="w-[35%] min-w-[300px] flex flex-col border-r border-border">
          <div className="flex-1 overflow-y-auto">
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
            {isLoading && streamingText && (
              <div className="flex items-start gap-3 px-4 py-3 animate-fade-in">
                <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 bg-accent/10 border border-accent/20">
                  <span className="text-sm">🦁</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-text-secondary">Lion Dev</span>
                    <span className="text-[10px] text-accent animate-pulse-glow">gerando...</span>
                  </div>
                  <div className="text-sm leading-relaxed text-text-secondary whitespace-pre-wrap">
                    {streamingText.substring(0, 500)}
                    {streamingText.length > 500 && '...'}
                  </div>
                </div>
              </div>
            )}
            {isLoading && !streamingText && <LoadingState />}
            <div ref={chatEndRef} />
          </div>
          <ChatInput
            onSend={handleSendMessage}
            disabled={isLoading}
            model={model}
            onModelChange={setModel}
          />
        </div>

        {/* Preview Panel */}
        <div className="flex-1 flex flex-col min-w-0">
          <PagePreview
            page={currentPage}
            editMode={editMode}
            onToggleEditMode={() => setEditMode(!editMode)}
            onPageUpdate={handlePageUpdate}
          />
        </div>
      </div>

      {showPrompt && <PromptModal onClose={() => setShowPrompt(false)} />}
    </div>
  )
}
