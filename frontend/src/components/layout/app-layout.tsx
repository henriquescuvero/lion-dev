import { Header } from './header'
import { ProjectsSidebar } from '@/components/sidebar/projects-sidebar'
import { ChatPanel } from '@/components/chat/chat-panel'
import { PagePreview } from '@/components/preview/page-preview'
import { PromptModal } from '@/components/modals/prompt-modal'
import { VersionHistoryModal } from '@/components/modals/version-history-modal'
import { useAppStore } from '@/stores/app-store'
import { useProjects } from '@/hooks/use-projects'

export function AppLayout() {
  const { projects, loading, createProject, deleteProject, updateProject } = useProjects()
  const activeProjectId = useAppStore((s) => s.activeProjectId)
  const showPromptModal = useAppStore((s) => s.showPromptModal)
  const setShowPromptModal = useAppStore((s) => s.setShowPromptModal)
  const showVersionHistory = useAppStore((s) => s.showVersionHistory)
  const setShowVersionHistory = useAppStore((s) => s.setShowVersionHistory)

  const activeProject = projects.find((p) => p.id === activeProjectId) ?? null

  return (
    <div className="h-screen flex flex-col bg-bg-primary overflow-hidden">
      <Header />
      <div className="flex-1 flex min-h-0">
        <ProjectsSidebar
          projects={projects}
          loading={loading}
          activeProjectId={activeProjectId}
          onSelectProject={(id) => useAppStore.getState().setActiveProject(id)}
          onCreateProject={createProject}
          onDeleteProject={deleteProject}
        />

        <ChatPanel project={activeProject} createProject={createProject} updateProject={updateProject} />

        <div className="flex-1 flex flex-col min-w-0">
          <PagePreview
            project={activeProject}
            onPageUpdate={(template) => {
              if (activeProject) {
                updateProject(activeProject.id, { current_template: template })
              }
            }}
          />
        </div>
      </div>

      {showPromptModal && activeProject && (
        <PromptModal
          project={activeProject}
          onClose={() => setShowPromptModal(false)}
          onSave={(prompt) => updateProject(activeProject.id, { system_prompt: prompt })}
        />
      )}

      {showVersionHistory && activeProject && (
        <VersionHistoryModal
          projectId={activeProject.id}
          onClose={() => setShowVersionHistory(false)}
          onRevert={(template) => {
            updateProject(activeProject.id, { current_template: template })
            setShowVersionHistory(false)
          }}
        />
      )}
    </div>
  )
}
