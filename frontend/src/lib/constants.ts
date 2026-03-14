const _apiKey = import.meta.env.VITE_CLAUDE_API_KEY
if (!_apiKey && import.meta.env.PROD) {
  console.error('[Lion Dev] VITE_CLAUDE_API_KEY não configurada. A geração de templates não funcionará.')
}
export const API_KEY = _apiKey || 'sk-cliproxy-2024-secure'
export const API_BASE_URL = import.meta.env.VITE_CLAUDE_API_URL || 'https://claude-api-proxy.st3er3.easypanel.host/v1'

export const AVAILABLE_MODELS = [
  { id: 'claude-sonnet-4-5-20250929', name: 'Claude Sonnet 4.5', description: 'Recomendado' },
  { id: 'claude-sonnet-4-6', name: 'Claude Sonnet 4.6', description: 'Mais recente' },
  { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', description: 'Rápido' },
  { id: 'claude-opus-4-6', name: 'Claude Opus 4.6', description: 'Mais inteligente' },
  { id: 'claude-opus-4-5-20251101', name: 'Claude Opus 4.5', description: 'Avançado' },
  { id: 'claude-haiku-4-5-20251001', name: 'Claude Haiku 4.5', description: 'Ultra rápido' },
] as const

export const DEFAULT_MODEL = 'claude-sonnet-4-5-20250929'
