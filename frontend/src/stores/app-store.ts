import { create } from 'zustand'

type ViewMode = 'desktop' | 'tablet' | 'mobile'

interface AppState {
  // Active project
  activeProjectId: string | null
  setActiveProject: (id: string | null) => void

  // UI state
  viewMode: ViewMode
  setViewMode: (mode: ViewMode) => void
  editMode: boolean
  toggleEditMode: () => void

  // Chat state
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
  streamingText: string | null
  setStreamingText: (text: string | null) => void

  // Modals
  showPromptModal: boolean
  setShowPromptModal: (show: boolean) => void
  showVersionHistory: boolean
  setShowVersionHistory: (show: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
  activeProjectId: null,
  setActiveProject: (id) => set({ activeProjectId: id }),

  viewMode: 'desktop',
  setViewMode: (mode) => set({ viewMode: mode }),
  editMode: false,
  toggleEditMode: () => set((s) => ({ editMode: !s.editMode })),

  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),
  streamingText: null,
  setStreamingText: (text) => set({ streamingText: text }),

  showPromptModal: false,
  setShowPromptModal: (show) => set({ showPromptModal: show }),
  showVersionHistory: false,
  setShowVersionHistory: (show) => set({ showVersionHistory: show }),
}))
