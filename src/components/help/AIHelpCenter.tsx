import { useState, useRef, useEffect } from 'react';
import { X, MessageCircle, Send, Sparkles, Loader2, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import ReactMarkdown from 'react-markdown';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface QuickQuestion {
  question: string;
  category: string;
}

const QUICK_QUESTIONS: QuickQuestion[] = [
  { question: 'How do I set up my AI receptionist?', category: 'Agents' },
  { question: 'How do I create a social media post?', category: 'Social' },
  { question: 'How do I manage appointments?', category: 'Scheduling' },
  { question: 'How do I configure SMS reminders?', category: 'Reminders' },
  { question: 'What are the different subscription tiers?', category: 'Billing' },
  { question: 'How do I add a team member?', category: 'Team' },
  { question: 'How do I connect my calendar?', category: 'Integrations' },
  { question: 'How do I set up the customer portal?', category: 'Portal' },
];

const SYSTEM_PROMPT = `You are Aura, the AI help assistant for the Aura Intercept platform. You help users navigate and use the platform effectively.

Key platform features you can help with:
1. **AI Operatives (Agents)**: 24 specialized AI agents including Receptionist, Scheduling, Follow-up, Review, Dispatch, Quoting, Invoice agents
2. **Consoles**: Customer Portal, Business Ops, Field Ops, Marketing & Sales, Social Media, Analytics & Reports, Web Presence
3. **Communication**: Message Aura (text chat), Talk to Aura (voice - requires ElevenLabs + Twilio), SMS/Email/Voice reminders
4. **Subscription Tiers**: Express ($197), Flow ($297), Halo ($297), Core ($397), Single-Point ($497), Multi-Track ($597), Command ($997)
5. **Integrations**: Twilio (SMS/Voice), ElevenLabs (AI Voice), Stripe (Payments), Calendar sync, Social media platforms

Navigation tips:
- Quick Setup: Initial configuration wizard at /dashboard/quick-setup
- AI Operatives Hub: Enable/configure agents at /dashboard/ai-agents
- Knowledge Base: Customize AI responses at /dashboard/knowledge
- Social Media Ops: Create posts at /dashboard/ai-consoles/social-media
- Customer Portal: Manage at /dashboard/ai-consoles/customer-portal

Always be helpful, concise, and provide specific navigation paths when applicable. Use markdown formatting for clarity.`;

export function AIHelpCenter() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const handleSubmit = async (question: string) => {
    if (!question.trim() || isLoading) return;

    const userMessage = question.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setQuery('');
    setIsLoading(true);

    try {
      // Build conversation history for context
      const conversationHistory = messages.map(m => ({
        role: m.role,
        content: m.content
      }));
      conversationHistory.push({ role: 'user', content: userMessage });

      const { data, error } = await supabase.functions.invoke('lovable-ai', {
        body: {
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            ...conversationHistory
          ],
          model: 'google/gemini-2.5-flash',
        },
      });

      if (error) throw error;

      const assistantMessage = data?.choices?.[0]?.message?.content || 
        "I'm sorry, I couldn't process your question. Please try again or contact support.";

      setMessages(prev => [...prev, { role: 'assistant', content: assistantMessage }]);
    } catch (err) {
      console.error('Help center error:', err);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "I'm having trouble connecting right now. Please check your connection or try again later." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickQuestion = (question: string) => {
    handleSubmit(question);
  };

  const handleClear = () => {
    setMessages([]);
    setQuery('');
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent w-full justify-start"
        >
          <HelpCircle className="h-4 w-4" />
          <span>AI Help Center</span>
          <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0 h-4 bg-primary/20 text-primary">
            AI
          </Badge>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-lg p-0 flex flex-col">
        <SheetHeader className="px-4 py-3 border-b bg-muted/30">
          <SheetTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                AI Help Center
                <Badge variant="outline" className="text-[10px]">Beta</Badge>
              </div>
              <p className="text-xs font-normal text-muted-foreground">Ask anything about the platform</p>
            </div>
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            {messages.length === 0 ? (
              <>
                {/* Welcome message */}
                <Card className="p-4 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="font-medium text-sm">Hi! I'm your AI Help Assistant</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Ask me anything about setting up agents, creating content, managing appointments, 
                        or navigating the platform. I'm here to help!
                      </p>
                    </div>
                  </div>
                </Card>

                {/* Quick questions */}
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                    Popular Questions
                  </h4>
                  <div className="grid grid-cols-1 gap-2">
                    {QUICK_QUESTIONS.map((q, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleQuickQuestion(q.question)}
                        className="flex items-center gap-2 p-2.5 rounded-lg border bg-card hover:bg-accent hover:border-accent-foreground/20 transition-colors text-left group"
                      >
                        <MessageCircle className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                        <span className="text-sm flex-1">{q.question}</span>
                        <Badge variant="secondary" className="text-[10px]">{q.category}</Badge>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Chat messages */}
                <div className="space-y-4">
                  {messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        'flex gap-3',
                        msg.role === 'user' ? 'justify-end' : 'justify-start'
                      )}
                    >
                      {msg.role === 'assistant' && (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center flex-shrink-0">
                          <Sparkles className="h-4 w-4 text-primary-foreground" />
                        </div>
                      )}
                      <div
                        className={cn(
                          'rounded-lg px-3 py-2 max-w-[85%] text-sm',
                          msg.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted prose prose-sm dark:prose-invert max-w-none'
                        )}
                      >
                        {msg.role === 'assistant' ? (
                          <ReactMarkdown
                            components={{
                              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                              ul: ({ children }) => <ul className="list-disc list-inside mb-2">{children}</ul>,
                              ol: ({ children }) => <ol className="list-decimal list-inside mb-2">{children}</ol>,
                              li: ({ children }) => <li className="mb-1">{children}</li>,
                              strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                              code: ({ children }) => <code className="bg-background/50 px-1 rounded text-xs">{children}</code>,
                            }}
                          >
                            {msg.content}
                          </ReactMarkdown>
                        ) : (
                          msg.content
                        )}
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                        <Sparkles className="h-4 w-4 text-primary-foreground" />
                      </div>
                      <div className="bg-muted rounded-lg px-3 py-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Clear button */}
                <div className="flex justify-center">
                  <Button variant="ghost" size="sm" onClick={handleClear} className="text-muted-foreground">
                    <X className="h-3 w-3 mr-1" />
                    Clear conversation
                  </Button>
                </div>
              </>
            )}
          </div>
        </ScrollArea>

        {/* Input area */}
        <div className="p-4 border-t bg-muted/30">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit(query);
            }}
            className="flex gap-2"
          >
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask a question..."
              className="flex-1"
              disabled={isLoading}
            />
            <Button type="submit" size="icon" disabled={isLoading || !query.trim()}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
          <p className="text-[10px] text-muted-foreground text-center mt-2">
            AI-powered help • Responses may not be 100% accurate
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
