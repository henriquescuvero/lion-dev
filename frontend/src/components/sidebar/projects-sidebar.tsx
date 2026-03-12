import { useState } from 'react'
import { Plus, Trash2, FolderOpen } from 'lucide-react'
import type { Project } from '@/hooks/use-projects'

interface ProjectsSidebarProps {
  projects: Project[]
  loading: boolean
  activeProjectId: string | null
  onSelectProject: (id: string) => void
  onCreateProject: (name: string) => Promise<Project | null>
  onDeleteProject: (id: string) => Promise<void>
}

export function ProjectsSidebar({
  projects,
  loading,
  activeProjectId,
  onSelectProject,
  onCreateProject,
  onDeleteProject,
}: ProjectsSidebarProps) {
  const [showInput, setShowInput] = useState(false)
  const [newName, setNewName] = useState('')

  async function handleCreate() {
    const name = newName.trim()
    if (!name) return
    await onCreateProject(name)
    setNewName('')
    setShowInput(false)
  }

  return (
    <div className="w-[220px] min-w-[220px] border-r border-border bg-bg-secondary/30 flex flex-col">
      <div className="p-3 border-b border-border">
        <button
          onClick={() => setShowInput(true)}
          className="w-full flex items-center justify-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all"
        >
          <Plus size={14} />
          Novo Projeto
        </button>
      </div>

      {showInput && (
        <div className="p-3 border-b border-border">
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreate()
              if (e.key === 'Escape') { setShowInput(false); setNewName('') }
            }}
            placeholder="Nome do projeto..."
            className="w-full text-xs px-2.5 py-1.5 rounded-lg bg-bg-primary border border-border text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50"
          />
          <div className="flex gap-1.5 mt-2">
            <button
              onClick={handleCreate}
              className="flex-1 text-[10px] py-1 rounded bg-primary text-bg-primary font-medium"
            >
              Criar
            </button>
            <button
              onClick={() => { setShowInput(false); setNewName('') }}
              className="flex-1 text-[10px] py-1 rounded border border-border text-text-muted"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 rounded-lg bg-bg-tertiary/50 animate-pulse" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="p-4 text-center">
            <FolderOpen size={24} className="mx-auto text-text-muted mb-2" />
            <p className="text-xs text-text-muted">Nenhum projeto</p>
          </div>
        ) : (
          projects.map((project) => (
            <div
              key={project.id}
              onClick={() => onSelectProject(project.id)}
              className={`group flex items-center justify-between px-3 py-2.5 cursor-pointer border-l-2 transition-all ${
                activeProjectId === project.id
                  ? 'border-primary bg-primary/5 text-text-primary'
                  : 'border-transparent hover:bg-bg-tertiary/50 text-text-secondary'
              }`}
            >
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium truncate">{project.name}</p>
                <p className="text-[10px] text-text-muted mt-0.5">
                  {new Date(project.updated_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDeleteProject(project.id)
                }}
                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/10 hover:text-red-400 transition-all"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
