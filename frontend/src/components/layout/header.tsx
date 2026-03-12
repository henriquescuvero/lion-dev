import { Code2, FileText, LogOut, History, User } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useAppStore } from '@/stores/app-store'
import { useState, useRef, useEffect } from 'react'

export function Header() {
  const { user, signOut } = useAuth()
  const setShowPromptModal = useAppStore((s) => s.setShowPromptModal)
  const setShowVersionHistory = useAppStore((s) => s.setShowVersionHistory)
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <header className="flex items-center justify-between px-6 py-3 border-b border-border bg-bg-secondary/50 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 border border-primary/20">
          <span className="text-lg leading-none">🦁</span>
        </div>
        <div>
          <h1 className="text-base font-semibold text-text-primary leading-tight">
            Lion Dev
          </h1>
          <p className="text-xs text-text-muted flex items-center gap-1">
            <Code2 size={11} />
            Elementor Template Builder
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowVersionHistory(true)}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border hover:border-primary/40 text-text-secondary hover:text-primary transition-all"
          title="Histórico de versões"
        >
          <History size={13} />
          <span>Versões</span>
        </button>
        <button
          onClick={() => setShowPromptModal(true)}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border hover:border-primary/40 text-text-secondary hover:text-primary transition-all"
          title="Ver prompt do agente"
        >
          <FileText size={13} />
          <span>Prompt</span>
        </button>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-medium">
          v3.0
        </span>

        {/* User menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-bg-tertiary border border-border hover:border-primary/40 transition-all"
          >
            <User size={14} className="text-text-secondary" />
          </button>
          {showMenu && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-bg-secondary border border-border rounded-lg shadow-xl z-50 overflow-hidden">
              <div className="px-3 py-2 border-b border-border">
                <p className="text-xs text-text-muted truncate">{user?.email}</p>
              </div>
              <button
                onClick={() => { signOut(); setShowMenu(false) }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-text-secondary hover:bg-bg-tertiary hover:text-red-400 transition-colors"
              >
                <LogOut size={12} />
                Sair
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
