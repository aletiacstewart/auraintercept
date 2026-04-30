import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Bot, Send, Loader2, Mic, MicOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { TermsAgreementCheckbox } from '@/components/auth/TermsAgreementCheckbox';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { cn } from '@/lib/utils';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface LandingAIChatProps {
  /** Website ID for tracking (Smart Website context) */
  websiteId?: string;
  /** Company ID for context */
  companyId?: string;
  /** Visitor fingerprint for tracking */
  visitorFingerprint?: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/landing-chat`;

export const LandingAIChat: React.FC<LandingAIChatProps> = ({
  websiteId,
  companyId,
  visitorFingerprint,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi! I'm Aura. Ask me anything about our platform, features, pricing, or how we can help automate your service business!"
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [termsAgreed, setTermsAgreed] = useState(() => {
    try { return localStorage.getItem('aura_chat_terms') === 'true'; } catch { return false; }
  });
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Browser speech-to-text — appends final transcripts to the input field
  const voice = useVoiceInput({
    continuous: false,
    onTranscript: (text, isFinal) => {
      if (!isFinal) return;
      const trimmed = text.trim();
      if (!trimmed) return;
      setInput(prev => (prev ? prev + ' ' : '') + trimmed);
    },
    onError: (msg) => {
      toast({
        title: 'Microphone unavailable',
        description: msg,
        variant: 'destructive',
      });
    },
  });

  const handleMicToggle = () => {
    if (!termsAgreed) return;
    voice.toggle();
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Track message sent to site_chat_logs
  const trackMessage = useCallback(async (role: 'user' | 'assistant', content: string) => {
    if (!websiteId || !visitorFingerprint) return;
    
    await supabase.from('site_chat_logs').insert({
      website_id: websiteId,
      visitor_fingerprint: visitorFingerprint,
      interaction_type: 'message_sent',
      message_role: role,
      message_preview: content.slice(0, 100), // First 100 chars only for privacy
    });
  }, [websiteId, visitorFingerprint]);

  const streamChat = async (userMessages: Message[]) => {
    const response = await fetch(CHAT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ messages: userMessages }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to get response');
    }

    if (!response.body) throw new Error('No response body');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = '';
    let assistantContent = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);

        if (line.endsWith('\r')) line = line.slice(0, -1);
        if (line.startsWith(':') || line.trim() === '') continue;
        if (!line.startsWith('data: ')) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === '[DONE]') break;

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) {
            assistantContent += content;
            setMessages(prev => {
              const last = prev[prev.length - 1];
              if (last?.role === 'assistant' && prev.length > 1) {
                return prev.map((m, i) => 
                  i === prev.length - 1 ? { ...m, content: assistantContent } : m
                );
              }
              return [...prev, { role: 'assistant', content: assistantContent }];
            });
          }
        } catch {
          textBuffer = line + '\n' + textBuffer;
          break;
        }
      }
    }

    // Track assistant response
    if (assistantContent) {
      await trackMessage('assistant', assistantContent);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !termsAgreed) return;

    const userMessage: Message = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    // Track user message
    await trackMessage('user', userMessage.content);

    try {
      await streamChat(newMessages);
    } catch (error) {
      console.error('Chat error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to get response',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-border/50">
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
          <Bot className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-primary">Message Aura</h3>
          <p className="text-xs text-muted-foreground">Always available to help</p>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 min-h-0 py-4" ref={scrollRef}>
        <div className="space-y-3">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`rounded-lg p-3 max-w-[85%] break-words ${
                message.role === 'user'
                  ? 'bg-white ml-auto text-[hsl(220,60%,25%)]'
                  : 'bg-white text-[hsl(220,60%,25%)]'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
            </div>
          ))}
          {isLoading && messages[messages.length - 1]?.role === 'user' && (
            <div className="bg-white rounded-lg p-3 max-w-[85%]">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">Thinking...</span>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Terms Agreement (shown until agreed) */}
      {!termsAgreed && (
        <div className="py-3 px-1 border-t border-border/50">
          <TermsAgreementCheckbox
            id="chat-terms-agreement"
            checked={termsAgreed}
            onCheckedChange={(val) => {
              setTermsAgreed(val);
              try { localStorage.setItem('aura_chat_terms', String(val)); } catch {}
            }}
            compact
          />
          <p className="text-xs text-muted-foreground mt-2">
            By chatting, you consent to AI-generated responses and data processing as described in our policies.
          </p>
        </div>
      )}

      {/* Input — always rendered so layout doesn't shift */}
      <form onSubmit={handleSubmit} className="flex gap-2 pt-3 border-t border-border/50 shrink-0">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            !termsAgreed
              ? "Agree to terms above to chat..."
              : voice.isListening
              ? "Listening… speak now"
              : "Ask Aura anything..."
          }
          className="flex-1 bg-white border-border text-[hsl(220,60%,25%)]"
          disabled={isLoading || !termsAgreed}
          autoFocus={termsAgreed}
        />
        {voice.isSupported && (
          <Button
            type="button"
            size="icon"
            variant="outline"
            onClick={handleMicToggle}
            disabled={isLoading || !termsAgreed}
            aria-label={voice.isListening ? 'Stop voice input' : 'Start voice input'}
            aria-pressed={voice.isListening}
            className={cn(
              'shrink-0 transition-all duration-200',
              voice.isListening && 'animate-pulse'
            )}
            style={
              voice.isListening
                ? {
                    color: 'hsl(189,100%,65%)',
                    borderColor: 'hsl(189,100%,55%)',
                    boxShadow: '0 0 14px hsl(189,100%,55%/0.55)',
                  }
                : undefined
            }
          >
            {voice.isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </Button>
        )}
        <Button
          type="submit"
          size="icon"
          disabled={isLoading || !input.trim() || !termsAgreed}
          className="shrink-0"
        >
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </div>
  );
};
