import { useState } from 'react'
import { Plus, FolderOpen, Trash2, X } from 'lucide-react'
import type { Project } from '../../services/projects'

interface ProjectsSidebarProps {
  projects: Project[]
  activeProjectId: string | null
  onSelectProject: (id: string) => void
  onCreateProject: (name: string) => void
  onDeleteProject: (id: string) => void
}

export function ProjectsSidebar({
  projects,
  activeProjectId,
  onSelectProject,
  onCreateProject,
  onDeleteProject,
}: ProjectsSidebarProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [newName, setNewName] = useState('')

  function handleCreate() {
    const name = newName.trim()
    if (!name) return
    onCreateProject(name)
    setNewName('')
    setIsCreating(false)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleCreate()
    if (e.key === 'Escape') {
      setIsCreating(false)
      setNewName('')
    }
  }

  return (
    <div className="w-[220px] min-w-[220px] flex flex-col border-r border-border bg-bg-secondary/50 h-full">
      <div className="flex items-center justify-between px-3 py-3 border-b border-border">
        <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
          Projetos
        </span>
        <button
          onClick={() => setIsCreating(true)}
          className="p-1 rounded-md hover:bg-bg-tertiary text-text-muted hover:text-accent transition-all"
          title="Novo projeto"
        >
          <Plus size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isCreating && (
          <div className="px-2 py-2 border-b border-border">
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Nome do projeto..."
                autoFocus
                className="flex-1 bg-bg-primary text-xs text-text-primary placeholder:text-text-muted px-2 py-1.5 rounded border border-border focus:border-accent/40 outline-none"
              />
              <button
                onClick={handleCreate}
                disabled={!newName.trim()}
                className="p-1 rounded text-accent hover:bg-accent/10 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Plus size={14} />
              </button>
              <button
                onClick={() => {
                  setIsCreating(false)
                  setNewName('')
                }}
                className="p-1 rounded text-text-muted hover:text-text-primary hover:bg-bg-tertiary"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        )}

        {projects.length === 0 && !isCreating && (
          <div className="px-3 py-8 text-center">
            <FolderOpen size={24} className="text-text-muted mx-auto mb-2" />
            <p className="text-xs text-text-muted">Nenhum projeto</p>
            <button
              onClick={() => setIsCreating(true)}
              className="text-xs text-accent hover:underline mt-1"
            >
              Criar primeiro projeto
            </button>
          </div>
        )}

        {projects.map((project) => (
          <div
            key={project.id}
            onClick={() => onSelectProject(project.id)}
            className={`group flex items-center gap-2 px-3 py-2.5 cursor-pointer transition-all border-l-2 ${
              activeProjectId === project.id
                ? 'bg-accent/5 border-l-accent text-text-primary'
                : 'border-l-transparent text-text-secondary hover:bg-bg-tertiary/50 hover:text-text-primary'
            }`}
          >
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{project.name}</p>
              <p className="text-[10px] text-text-muted">
                {new Date(project.updatedAt).toLocaleDateString('pt-BR')}
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDeleteProject(project.id)
              }}
              className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-bg-tertiary text-text-muted hover:text-red-400 transition-all"
            >
              <Trash2 size={12} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
