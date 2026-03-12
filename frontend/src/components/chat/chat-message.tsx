import { User } from 'lucide-react'
import { formatTimestamp } from '@/lib/utils'
import { JsonViewer } from '@/components/json-viewer/json-viewer'
import type { Message } from '@/hooks/use-messages'

interface ChatMessageProps {
  message: Message
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user'

  return (
    <div className="flex items-start gap-3 px-4 py-3 animate-fade-in">
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
          isUser
            ? 'bg-bg-tertiary border border-border'
            : 'bg-primary/10 border border-primary/20'
        }`}
      >
        {isUser ? (
          <User size={14} className="text-text-secondary" />
        ) : (
          <span className="text-sm">🦁</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium text-text-secondary">
            {isUser ? 'Você' : 'Lion Dev'}
          </span>
          <span className="text-[10px] text-text-muted">
            {formatTimestamp(message.created_at)}
          </span>
        </div>
        {message.images && message.images.length > 0 && (
          <div className="flex gap-2 mb-2 flex-wrap">
            {message.images.map((img, i) => (
              <img
                key={i}
                src={img}
                alt={`Anexo ${i + 1}`}
                className="w-24 h-24 object-cover rounded-lg border border-border"
              />
            ))}
          </div>
        )}
        {message.content && (
          <div
            className={`text-sm leading-relaxed rounded-lg px-3 py-2 ${
              isUser
                ? 'bg-user-bubble text-text-primary border border-border'
                : 'text-text-secondary'
            }`}
          >
            {message.content}
          </div>
        )}
        {message.template_json && (
          <div className="mt-3">
            <JsonViewer data={message.template_json} />
          </div>
        )}
      </div>
    </div>
  )
}
