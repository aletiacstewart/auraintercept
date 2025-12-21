import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Bot, 
  Send, 
  User,
  Calendar,
  FileText,
  MapPin,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  action?: {
    type: 'booking' | 'quote' | 'tracking';
    data?: Record<string, unknown>;
  };
}

interface CustomerAIChatProps {
  company: {
    id: string;
    name: string;
    ai_agent_prompt: string | null;
    ai_voice_greeting: string | null;
    primary_color: string | null;
  };
}

export function CustomerAIChat({ company }: CustomerAIChatProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: company.ai_voice_greeting || `Hello! Welcome to ${company.name}. I'm here to help you with booking appointments, getting quotes, tracking your services, and answering any questions. How can I assist you today?`,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('ai-agent-chat', {
        body: {
          message: input.trim(),
          companyId: company.id,
          customerEmail: user?.email,
          conversationHistory: messages.map(m => ({
            role: m.role,
            content: m.content
          }))
        }
      });

      if (error) throw error;

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data?.response || "I'm sorry, I couldn't process that request. Please try again.",
        timestamp: new Date(),
        action: data?.action
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickActions = [
    { label: 'Book Appointment', icon: Calendar, prompt: 'I would like to book an appointment' },
    { label: 'Get Quote', icon: FileText, prompt: 'I need a quote for your services' },
    { label: 'Track Appointment', icon: MapPin, prompt: 'I want to track my appointment status' },
  ];

  return (
    <div className="flex flex-col h-[600px] bg-muted/20 rounded-lg overflow-hidden">
      {/* Chat Header */}
      <div 
        className="p-4 border-b flex items-center gap-3"
        style={{ 
          background: `linear-gradient(135deg, ${company.primary_color || '#0EA5E9'}20, transparent)` 
        }}
      >
        <div 
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ backgroundColor: company.primary_color || '#0EA5E9' }}
        >
          <Bot className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-medium">{company.name} AI Assistant</p>
          <p className="text-xs text-muted-foreground">Online • Ready to help</p>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'flex gap-3',
                message.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              {message.role === 'assistant' && (
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: company.primary_color || '#0EA5E9' }}
                >
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}
              <div
                className={cn(
                  'max-w-[80%] rounded-2xl px-4 py-2',
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card border'
                )}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                {message.action && (
                  <div className="mt-2 pt-2 border-t border-current/20">
                    <Button size="sm" variant="secondary" className="text-xs">
                      {message.action.type === 'booking' && 'Complete Booking'}
                      {message.action.type === 'quote' && 'View Quote'}
                      {message.action.type === 'tracking' && 'View Status'}
                    </Button>
                  </div>
                )}
              </div>
              {message.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ backgroundColor: company.primary_color || '#0EA5E9' }}
              >
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-card border rounded-2xl px-4 py-2">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Quick Actions */}
      {messages.length <= 2 && (
        <div className="p-4 border-t bg-background/50">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {quickActions.map((action) => (
              <Button
                key={action.label}
                variant="outline"
                size="sm"
                className="flex-shrink-0 gap-2"
                onClick={() => {
                  setInput(action.prompt);
                }}
              >
                <action.icon className="w-4 h-4" />
                {action.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t bg-background">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading || !input.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
