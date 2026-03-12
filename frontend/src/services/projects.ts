import type { ElementorTemplate, ChatMessage } from '../types'
import { DEFAULT_MODEL } from './ai'

export interface Project {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  page: ElementorTemplate | null
  messages: ChatMessage[]
  model: string
}

const STORAGE_KEY = 'liondev-projects'
const ACTIVE_KEY = 'liondev-active-project'

export function loadProjects(): Project[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const projects = JSON.parse(raw) as Project[]
    return projects
      .filter((p) => p && p.id && p.name)
      .map((p) => ({
        ...p,
        messages: Array.isArray(p.messages)
          ? p.messages.map((m) => ({ ...m, timestamp: new Date(m.timestamp) }))
          : [],
        page: p.page ?? null,
        model: p.model ?? DEFAULT_MODEL,
      }))
  } catch (e) {
    console.warn('[LionDev] Failed to load projects from localStorage:', e)
    return []
  }
}

export function saveProjects(projects: Project[]): void {
  try {
    // Strip base64 images before saving to avoid exceeding localStorage limit
    const cleaned = projects.map((p) => ({
      ...p,
      messages: p.messages.map((m) => {
        if (m.images && m.images.some((img) => img.startsWith('data:'))) {
          return { ...m, images: m.images.filter((img) => !img.startsWith('data:')) }
        }
        return m
      }),
    }))
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned))
  } catch (e) {
    console.warn('[LionDev] Failed to save projects to localStorage:', e)
  }
}

export function loadActiveProjectId(): string | null {
  return localStorage.getItem(ACTIVE_KEY)
}

export function saveActiveProjectId(id: string | null): void {
  if (id) {
    localStorage.setItem(ACTIVE_KEY, id)
  } else {
    localStorage.removeItem(ACTIVE_KEY)
  }
}

export function createProject(name: string): Project {
  return {
    id: crypto.randomUUID?.() ?? Math.random().toString(36).substring(2, 11),
    name,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    page: null,
    messages: [],
    model: DEFAULT_MODEL,
  }
}

export function deleteProject(projects: Project[], id: string): Project[] {
  return projects.filter((p) => p.id !== id)
}
