import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './use-auth'
import { useAppStore } from '@/stores/app-store'
import { DEFAULT_MODEL } from '@/lib/constants'
import type { ElementorTemplate } from '@/types/elementor'

export interface Project {
  id: string
  user_id: string
  name: string
  model: string
  current_template: ElementorTemplate | null
  system_prompt: string | null
  created_at: string
  updated_at: string
}

export function useProjects() {
  const { user } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const setActiveProject = useAppStore((s) => s.setActiveProject)

  const fetchProjects = useCallback(async () => {
    if (!user) {
      setProjects([])
      setLoading(false)
      return
    }
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })

    if (!error && data) {
      setProjects(data as unknown as Project[])
    }
    setLoading(false)
  }, [user])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  async function createProject(name: string): Promise<Project | null> {
    if (!user) return null
    const { data, error } = await supabase
      .from('projects')
      .insert({
        user_id: user.id,
        name,
        model: DEFAULT_MODEL,
      })
      .select()
      .single()

    if (error || !data) return null
    const project = data as unknown as Project
    setProjects((prev) => [project, ...prev])
    setActiveProject(project.id)
    return project
  }

  async function deleteProject(id: string) {
    await supabase.from('projects').delete().eq('id', id)
    setProjects((prev) => prev.filter((p) => p.id !== id))
    const activeId = useAppStore.getState().activeProjectId
    if (activeId === id) {
      const remaining = projects.filter((p) => p.id !== id)
      setActiveProject(remaining.length > 0 ? remaining[0].id : null)
    }
  }

  async function updateProject(id: string, updates: Partial<Pick<Project, 'name' | 'model' | 'current_template' | 'system_prompt'>>) {
    const { error } = await supabase
      .from('projects')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (!error) {
      setProjects((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...updates, updated_at: new Date().toISOString() } : p))
      )
    }
  }

  return { projects, loading, createProject, deleteProject, updateProject, refetch: fetchProjects }
}
