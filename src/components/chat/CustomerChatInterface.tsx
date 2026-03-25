import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  Bot, Send, User, Loader2, Calendar, Clock, DollarSign, 
  AlertTriangle, Star, MapPin, MessageSquare, Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  getQuickActionsForTier,
  type SubscriptionTier,
  type QuickActionConfig 
} from '@/lib/customerPortalConfig';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  agent?: string;
  timestamp?: Date;
  actions?: Array<{ label: string; action: string }>;
}

export interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  message: string;
  variant?: 'default' | 'destructive' | 'outline';
}

interface CustomerChatInterfaceProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onSendMessage: (message: string) => void;
  companyName?: string;
  companyLogo?: string | null;
  primaryColor?: string;
  quickActions?: QuickAction[];
  currentAgent?: string;
  showAgentBadge?: boolean;
  showTimestamps?: boolean;
  placeholder?: string;
  welcomeMessage?: string;
  className?: string;
  subscriptionTier?: string;
  dispatchPhone?: string | null;
}

const AGENT_LABELS: Record<string, { label: string; color: string }> = {
  triage: { label: 'Assistant', color: 'bg-channel-chat' },
  booking: { label: 'Scheduling Agent', color: 'bg-channel-sms' },
  dispatch: { label: 'Dispatch Agent', color: 'bg-channel-voice' },
  quote: { label: 'Quote Agent', color: 'bg-channel-chat' },
  review: { label: 'Social Media Review Agent', color: 'bg-channel-email' },
  eta: { label: 'ETA Agent', color: 'bg-secondary' },
  'follow-up': { label: 'Follow-up Agent', color: 'bg-channel-voice' },
};

export const CustomerChatInterface: React.FC<CustomerChatInterfaceProps> = ({
  messages,
  isLoading,
  onSendMessage,
  companyName = 'AI Assistant',
  companyLogo,
  primaryColor,
  quickActions,
  currentAgent,
  showAgentBadge = true,
  showTimestamps = false,
  placeholder = 'Type your message...',
  welcomeMessage,
  className,
  subscriptionTier = 'connect',
  dispatchPhone,
}) => {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Get tier-filtered quick actions
  const effectiveQuickActions = useMemo(() => {
    if (quickActions) return quickActions; // Use custom actions if provided
    
    const tier = (subscriptionTier || 'single_point') as SubscriptionTier;
    const tierActions = getQuickActionsForTier(tier, !!dispatchPhone);
    
    // Convert to the QuickAction format expected by this component
    return tierActions.map(action => ({
      id: action.id,
      label: action.label,
      icon: <action.icon className="h-4 w-4" />,
      message: action.message,
      variant: action.variant,
      isCallAction: action.isCallAction,
    }));
  }, [quickActions, subscriptionTier, dispatchPhone]);

  const handleQuickAction = (action: any) => {
    if (action.isCallAction && dispatchPhone) {
      window.location.href = `tel:${dispatchPhone}`;
    } else if (action.message) {
      onSendMessage(action.message);
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim());
    setInput('');
  };

  const getAgentInfo = (agent?: string) => {
    if (!agent) return AGENT_LABELS.triage;
    return AGENT_LABELS[agent.toLowerCase()] || AGENT_LABELS.triage;
  };

  const formatTimestamp = (date?: Date) => {
    if (!date) return '';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={cn("flex flex-col h-full", className)}>
      <ScrollArea className="flex-1 pr-4" ref={scrollRef}>
        <div className="space-y-4 p-4">
          {messages.length === 0 && (
            <div className="text-center py-6">
              <div 
                className="h-16 w-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                style={{ background: primaryColor ? `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)` : undefined }}
              >
                {companyLogo ? (
                  <img src={companyLogo} alt={companyName} className="h-10 w-10 rounded-full object-cover" />
                ) : (
                  <Bot className="h-8 w-8 text-white" />
                )}
              </div>
              <h3 className="font-semibold text-lg">Hi there! 👋</h3>
              <p className="text-muted-foreground mt-1 mb-4">
                {welcomeMessage || `I'm your virtual assistant at ${companyName}. How can I help you today?`}
              </p>
              
              {/* Quick Actions Grid - filtered by subscription tier */}
              <div className="grid grid-cols-2 gap-2 mt-4 max-w-md mx-auto">
                {effectiveQuickActions.slice(0, 6).map((action) => (
                  <Button 
                    key={action.id}
                    variant={action.variant || 'outline'} 
                    size="sm"
                    className={cn(
                      "justify-start gap-2",
                      action.variant === 'destructive' && "bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground border-destructive/30"
                    )}
                    onClick={() => handleQuickAction(action)}
                  >
                    {action.icon}
                    <span className="truncate">{action.label}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}
          
          {messages.map((message, index) => {
            const agentInfo = getAgentInfo(message.agent);
            const showHandoff = showAgentBadge && 
              message.role === 'assistant' && 
              message.agent && 
              index > 0 && 
              messages[index - 1]?.agent !== message.agent;

            return (
              <div key={index}>
                {showHandoff && (
                  <div className="flex items-center justify-center gap-2 my-3">
                    <div className="h-px flex-1 bg-border" />
                    <Badge variant="outline" className="text-xs text-white/70 border-white/30">
                      Connected to {agentInfo.label}
                    </Badge>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                )}
                <div
                  className={cn(
                    'flex gap-3 p-3 rounded-lg',
                    message.role === 'user' 
                      ? 'bg-primary/10 ml-8' 
                      : 'bg-muted mr-8'
                  )}
                >
                  <div className={cn(
                    'h-8 w-8 rounded-full flex items-center justify-center shrink-0',
                    message.role === 'user' ? 'bg-primary' : agentInfo.color
                  )}>
                    {message.role === 'user' ? (
                      <User className="h-4 w-4 text-primary-foreground" />
                    ) : (
                      <Bot className="h-4 w-4 text-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    {showAgentBadge && message.role === 'assistant' && (
                      <p className="text-xs text-muted-foreground mb-1">{agentInfo.label}</p>
                    )}
                    <div className="whitespace-pre-wrap text-sm break-words">{message.content}</div>
                    {showTimestamps && message.timestamp && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatTimestamp(message.timestamp)}
                      </p>
                    )}
                    {/* Action buttons from AI response */}
                    {message.actions && message.actions.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {message.actions.map((action, idx) => (
                          <Button
                            key={idx}
                            variant="outline"
                            size="sm"
                            onClick={() => onSendMessage(action.action)}
                          >
                            {action.label}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          
          {isLoading && (
            <div className="flex gap-3 p-3 rounded-lg bg-muted mr-8">
              <div className={cn(
                "h-8 w-8 rounded-full flex items-center justify-center",
                getAgentInfo(currentAgent).color
              )}>
                <Loader2 className="h-4 w-4 animate-spin text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Thinking</span>
                  <span className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <form onSubmit={handleSubmit} className="flex gap-2 p-4 border-t">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder}
          disabled={isLoading}
          className="flex-1"
        />
        <Button type="submit" disabled={isLoading || !input.trim()} className="shrink-0">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
};
