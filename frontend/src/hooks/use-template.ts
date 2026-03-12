import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { ElementorTemplate } from '@/types/elementor'

export interface TemplateVersion {
  id: string
  project_id: string
  version_number: number
  title: string | null
  template: ElementorTemplate
  created_at: string
}

export function useTemplateVersions(projectId: string | null) {
  const [versions, setVersions] = useState<TemplateVersion[]>([])
  const [loading, setLoading] = useState(false)

  const fetchVersions = useCallback(async () => {
    if (!projectId) {
      setVersions([])
      return
    }
    setLoading(true)
    const { data, error } = await supabase
      .from('template_versions')
      .select('*')
      .eq('project_id', projectId)
      .order('version_number', { ascending: false })

    if (!error && data) {
      setVersions(data as unknown as TemplateVersion[])
    }
    setLoading(false)
  }, [projectId])

  async function saveVersion(template: ElementorTemplate, title?: string) {
    if (!projectId) return
    const nextVersion = versions.length > 0 ? versions[0].version_number + 1 : 1

    const { data, error } = await supabase
      .from('template_versions')
      .insert({
        project_id: projectId,
        version_number: nextVersion,
        title: title ?? template.title ?? null,
        template: template as unknown as Record<string, unknown>,
      })
      .select()
      .single()

    if (!error && data) {
      setVersions((prev) => [data as unknown as TemplateVersion, ...prev])
    }
  }

  async function revertToVersion(version: TemplateVersion): Promise<ElementorTemplate> {
    return version.template
  }

  return { versions, loading, fetchVersions, saveVersion, revertToVersion }
}
