import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { ElementorTemplate } from '@/types/elementor'

export interface Message {
  id: string
  project_id: string
  role: 'user' | 'ai'
  content: string | null
  template_json: ElementorTemplate | null
  images?: string[]
  created_at: string
}

export function useMessages(projectId: string | null) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)

  const fetchMessages = useCallback(async () => {
    if (!projectId) {
      setMessages([])
      return
    }
    setLoading(true)
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true })

    if (!error && data) {
      setMessages(data as unknown as Message[])
    }
    setLoading(false)
  }, [projectId])

  useEffect(() => {
    fetchMessages()
  }, [fetchMessages])

  async function addMessage(msg: {
    project_id: string
    role: 'user' | 'ai'
    content: string | null
    template_json?: ElementorTemplate | null
  }): Promise<Message | null> {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        project_id: msg.project_id,
        role: msg.role,
        content: msg.content,
        template_json: msg.template_json as unknown as Record<string, unknown> ?? null,
      })
      .select()
      .single()

    if (error || !data) return null
    const message = data as unknown as Message
    setMessages((prev) => [...prev, message])
    return message
  }

  function addLocalMessage(msg: Message) {
    setMessages((prev) => [...prev, msg])
  }

  function clearMessages() {
    setMessages([])
  }

  return { messages, loading, addMessage, addLocalMessage, clearMessages, refetch: fetchMessages }
}
