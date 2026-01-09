import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Bot, User, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatBubbleProps {
  role: 'user' | 'assistant';
  content: string;
  agentLabel?: string;
  agentColor?: string;
  agentBgColor?: string;
  isHandoff?: boolean;
  isLoading?: boolean;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({
  role,
  content,
  agentLabel,
  agentColor,
  agentBgColor,
  isHandoff,
  isLoading,
}) => {
  const isUser = role === 'user';

  return (
    <div className={cn(
      'flex gap-2 sm:gap-3 animate-fade-in',
      isUser ? 'justify-end' : 'justify-start'
    )}>
      {/* Assistant avatar */}
      {!isUser && (
        <div className="shrink-0 h-8 w-8 rounded-full glass-primary flex items-center justify-center glow-primary">
          {isLoading ? (
            <Loader2 className="h-4 w-4 text-white animate-spin" />
          ) : (
            <Bot className="h-4 w-4 text-white" />
          )}
        </div>
      )}

      {/* Message content */}
      <div className={cn(
        'max-w-[85%] sm:max-w-[75%] px-4 py-2.5 shadow-md',
        isUser 
          ? 'message-bubble-user' 
          : 'message-bubble-assistant'
      )}>
        {/* Agent badge for handoffs */}
        {!isUser && agentLabel && isHandoff && (
          <Badge 
            className={cn(
              'text-[10px] mb-1.5 font-medium border-0',
              agentBgColor,
              agentColor
            )}
          >
            {agentLabel} Agent
          </Badge>
        )}
        
        {isLoading ? (
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        ) : (
          <p className="text-sm whitespace-pre-wrap leading-relaxed">{content}</p>
        )}
      </div>

      {/* User avatar */}
      {isUser && (
        <div className="shrink-0 h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
          <User className="h-4 w-4 text-secondary-foreground" />
        </div>
      )}
    </div>
  );
};
