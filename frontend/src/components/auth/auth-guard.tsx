import { useAuth } from '@/hooks/use-auth'
import { LoginPage } from './login-page'

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🦁</span>
          <span className="text-text-secondary text-sm animate-pulse-glow">Carregando...</span>
        </div>
      </div>
    )
  }

  if (!user) {
    return <LoginPage />
  }

  return <>{children}</>
}
