import { useRef, useEffect, useCallback } from 'react'
import { ChatMessage } from './chat-message'
import { ChatInput } from './chat-input'
import { StreamingMessage, LoadingIndicator } from './streaming-message'
import { useChat } from '@/hooks/use-chat'
import { useAppStore } from '@/stores/app-store'
import type { Project } from '@/hooks/use-projects'

interface ChatPanelProps {
  project: Project | null
  createProject: (name: string) => Promise<Project | null>
  updateProject: (id: string, updates: Partial<Pick<Project, 'model' | 'current_template'>>) => Promise<void>
}

export function ChatPanel({ project, createProject, updateProject }: ChatPanelProps) {
  const { messages, messagesLoading, sendMessage } = useChat(project, { createProject, updateProject })
  const { isLoading, streamingText } = useAppStore()
  const chatEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = useCallback(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading, streamingText, scrollToBottom])

  const greeting = messages.length === 0 && !messagesLoading

  return (
    <div className="w-[35%] min-w-[300px] flex flex-col border-r border-border">
      <div className="flex-1 overflow-y-auto">
        {greeting && (
          <div className="flex items-start gap-3 px-4 py-3 animate-fade-in">
            <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 bg-primary/10 border border-primary/20">
              <span className="text-sm">🦁</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-text-secondary">Lion Dev</span>
              </div>
              <div className="text-sm leading-relaxed text-text-secondary">
                Olá! Sou o Lion Dev, seu assistente para criar templates WordPress compatíveis com Elementor. Descreva a página que deseja criar e eu gero o template JSON pronto para importar no Elementor.
              </div>
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}

        {isLoading && streamingText && <StreamingMessage text={streamingText} />}

        {isLoading && !streamingText && <LoadingIndicator />}

        <div ref={chatEndRef} />
      </div>

      <ChatInput
        onSend={sendMessage}
        disabled={isLoading}
        model={project?.model || 'claude-sonnet-4-5-20250929'}
        onModelChange={(model) => {
          if (project) updateProject(project.id, { model })
        }}
      />
    </div>
  )
}
