import { User } from 'lucide-react'
import type { ChatMessage as ChatMessageType } from '../../types'
import { JsonViewer } from '../json-viewer/JsonViewer'
import { formatTimestamp } from '../../utils/helpers'

interface ChatMessageProps {
  message: ChatMessageType
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex items-start gap-3 px-4 py-3 animate-fade-in ${isUser ? '' : ''}`}>
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
          isUser
            ? 'bg-bg-tertiary border border-border'
            : 'bg-accent/10 border border-accent/20'
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
            {isUser ? 'Voce' : 'Lion Dev'}
          </span>
          <span className="text-[10px] text-text-muted">
            {formatTimestamp(message.timestamp)}
          </span>
        </div>
        {/* Attached images */}
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
        {message.json && (
          <div className="mt-3">
            <JsonViewer data={message.json} />
          </div>
        )}
      </div>
    </div>
  )
}
