import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Calendar, AlertTriangle, FileText, Search, Bot, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useMultiAgentChat, ChatMessage } from '@/hooks/useMultiAgentChat';
import { supabase } from '@/integrations/supabase/client';

interface SmartWebsiteChatProps {
  companyId: string;
  companyName?: string;
  websiteId?: string;
  visitorFingerprint?: string;
  primaryColor?: string;
}

const AGENT_DISPLAY_NAMES: Record<string, string> = {
  triage: 'Receptionist',
  booking: 'Booking Agent',
  quote: 'Quote Agent',
  dispatch: 'Dispatch',
  eta: 'ETA Tracker',
  review: 'Review Agent',
  admin: 'Admin Assistant',
  lead: 'Lead Agent',
  campaign: 'Campaign Agent',
  follow_up: 'Follow-Up Agent',
};

const QUICK_ACTIONS = [
  { label: 'Book Appointment', icon: Calendar, action: 'I want to book an appointment' },
  { label: 'Get Quote', icon: FileText, action: 'I need a quote for services' },
  { label: 'Track Appointment', icon: Search, action: 'I want to track my appointment' },
  { label: 'Emergency', icon: AlertTriangle, action: 'I have an emergency' },
];

export const SmartWebsiteChat: React.FC<SmartWebsiteChatProps> = ({
  companyId,
  companyName,
  websiteId,
  visitorFingerprint,
  primaryColor = '#214ebb',
}) => {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { messages, isLoading, currentAgent, sendMessage, clearMessages } = useMultiAgentChat({
    companyId,
    onAgentChange: (agent) => {
      console.log('[SmartWebsiteChat] Agent changed to:', agent);
    },
  });

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Track chat message
  const trackMessage = useCallback(async (role: 'user' | 'assistant', content: string) => {
    if (!websiteId || !visitorFingerprint) return;
    
    try {
      await supabase.from('site_chat_logs').insert({
        website_id: websiteId,
        visitor_fingerprint: visitorFingerprint,
        interaction_type: role === 'user' ? 'user_message' : 'bot_message',
        message_content: content.substring(0, 500),
      });
    } catch (error) {
      console.error('Failed to track message:', error);
    }
  }, [websiteId, visitorFingerprint]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const message = input.trim();
    setInput('');
    await trackMessage('user', message);
    await sendMessage(message);
    
    // Track assistant response after it arrives
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role === 'assistant') {
      await trackMessage('assistant', lastMessage.content);
    }
  };

  const handleQuickAction = async (action: string) => {
    if (isLoading) return;
    await trackMessage('user', action);
    await sendMessage(action);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getAgentColor = (agent?: string) => {
    switch (agent) {
      case 'triage': return 'bg-blue-500';
      case 'booking': return 'bg-green-500';
      case 'quote': return 'bg-purple-500';
      case 'dispatch': return 'bg-orange-500';
      case 'eta': return 'bg-cyan-500';
      case 'review': return 'bg-yellow-500';
      case 'lead': return 'bg-pink-500';
      default: return 'bg-primary';
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header with current agent */}
      <div className="flex items-center justify-between pb-3 border-b mb-3">
        <div className="flex items-center gap-2">
          <div 
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs"
            style={{ backgroundColor: primaryColor }}
          >
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <p className="font-medium text-sm">{companyName || 'AI Assistant'}</p>
            <Badge variant="secondary" className={`text-xs ${getAgentColor(currentAgent)} text-white`}>
              {AGENT_DISPLAY_NAMES[currentAgent] || currentAgent}
            </Badge>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={clearMessages} className="h-8 w-8">
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Messages area */}
      <ScrollArea className="flex-1 pr-2" ref={scrollRef}>
        <div className="space-y-3">
          {messages.length === 0 ? (
            <div className="space-y-4">
              <p className="text-muted-foreground text-sm text-center">
                Hi! How can I help you today?
              </p>
              
              {/* Quick actions */}
              <div className="grid grid-cols-2 gap-2">
                {QUICK_ACTIONS.map((qa) => (
                  <Button
                    key={qa.label}
                    variant="outline"
                    size="sm"
                    className="h-auto py-2 px-3 justify-start text-xs"
                    onClick={() => handleQuickAction(qa.action)}
                    disabled={isLoading}
                  >
                    <qa.icon className="w-3 h-3 mr-2 shrink-0" style={{ color: primaryColor }} />
                    {qa.label}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <MessageBubble 
                key={idx} 
                message={msg} 
                primaryColor={primaryColor}
                onActionClick={handleQuickAction}
              />
            ))
          )}
          
          {isLoading && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="animate-pulse flex space-x-1">
                <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input area */}
      <div className="flex gap-2 pt-3 mt-auto border-t">
        <Input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message..."
          disabled={isLoading}
          className="flex-1"
        />
        <Button 
          onClick={handleSend} 
          disabled={!input.trim() || isLoading}
          size="icon"
          style={{ backgroundColor: primaryColor }}
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

interface MessageBubbleProps {
  message: ChatMessage;
  primaryColor: string;
  onActionClick?: (action: string) => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, primaryColor, onActionClick }) => {
  const isUser = message.role === 'user';
  
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[85%] space-y-1`}>
        {!isUser && message.agent && (
          <Badge variant="outline" className="text-xs mb-1">
            {AGENT_DISPLAY_NAMES[message.agent] || message.agent}
          </Badge>
        )}
        <div
          className={`rounded-lg px-3 py-2 text-sm ${
            isUser 
              ? 'text-white' 
              : 'bg-muted'
          }`}
          style={isUser ? { backgroundColor: primaryColor } : undefined}
        >
          {message.content}
        </div>
        
        {/* Action buttons from response */}
        {message.actions && message.actions.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {message.actions.map((action, idx) => (
              <Button
                key={idx}
                variant="outline"
                size="sm"
                className="text-xs h-7"
                onClick={() => onActionClick?.(action.action)}
              >
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
