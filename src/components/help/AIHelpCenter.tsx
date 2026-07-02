import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { X, MessageCircle, Send, Sparkles, Loader2, HelpCircle, History, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import ReactMarkdown from 'react-markdown';
import { HELP_SYSTEM_PROMPT } from '@/lib/helpSystemPrompt';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface QuickQuestion {
  question: string;
  category: string;
}

interface HistoryEntry {
  question: string;
  timestamp: number;
}

// Context-aware suggestions based on current page
const PAGE_SUGGESTIONS: Record<string, QuickQuestion[]> = {
  '/dashboard/ai-agents': [
    { question: 'How do I enable a specific AI agent?', category: 'Agents' },
    { question: 'What is the difference between triage and booking agents?', category: 'Agents' },
    { question: 'How do agent handoffs work?', category: 'Agents' },
  ],
  '/dashboard/appointments': [
    { question: 'How do I reschedule an appointment?', category: 'Scheduling' },
    { question: 'How do I set up appointment reminders?', category: 'Reminders' },
    { question: 'Can I sync with Google Calendar?', category: 'Integrations' },
  ],
  '/dashboard/ai-consoles/social-media': [
    { question: 'How does the Manual Bridge posting work?', category: 'Social' },
    { question: 'Can I generate AI content for social media?', category: 'Social' },
    { question: 'Can I use my own API credentials for automatic posting?', category: 'Integrations' },
    { question: 'When will automatic platform-level posting be available?', category: 'Social' },
  ],
  '/dashboard/analytics': [
    { question: 'How do I export analytics data?', category: 'Analytics' },
    { question: 'What metrics are tracked?', category: 'Analytics' },
    { question: 'How do I view agent performance?', category: 'Analytics' },
  ],
  '/dashboard/settings': [
    { question: 'How do I change company settings?', category: 'Settings' },
    { question: 'How do I set up integrations?', category: 'Integrations' },
    { question: 'How do I manage team permissions?', category: 'Team' },
  ],
};

const DEFAULT_QUESTIONS: QuickQuestion[] = [
  { question: 'How do I set up my AI receptionist?', category: 'Agents' },
  { question: 'How do I create a social media post?', category: 'Social' },
  { question: 'How do I manage appointments?', category: 'Scheduling' },
  { question: 'How do I configure SMS reminders?', category: 'Reminders' },
  { question: 'What are the different subscription tiers?', category: 'Billing' },
  { question: 'How do I add a team member?', category: 'Team' },
  { question: 'How do I connect my calendar?', category: 'Integrations' },
  { question: 'How do I set up the customer portal?', category: 'Portal' },
];

// System prompt is derived from CONSOLE_HELP_CONFIG + TIER_HELP_DESCRIPTIONS
// so this widget and the full Help page stay on a single content source.
const SYSTEM_PROMPT = HELP_SYSTEM_PROMPT;

const HISTORY_STORAGE_KEY = 'aura-help-history';
const MAX_HISTORY_ITEMS = 10;

export function AIHelpCenter() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchHistory, setSearchHistory] = useState<HistoryEntry[]>([]);
  const [activeTab, setActiveTab] = useState('suggested');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const location = useLocation();

  // Load search history from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (stored) {
        setSearchHistory(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load search history:', e);
    }
  }, []);

  // Save search history to localStorage
  const saveToHistory = (question: string) => {
    const newEntry: HistoryEntry = { question, timestamp: Date.now() };
    const updated = [newEntry, ...searchHistory.filter(h => h.question !== question)].slice(0, MAX_HISTORY_ITEMS);
    setSearchHistory(updated);
    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save search history:', e);
    }
  };

  // Get context-aware suggestions
  const getContextualSuggestions = (): QuickQuestion[] => {
    const path = location.pathname;
    
    // Check for exact match first
    if (PAGE_SUGGESTIONS[path]) {
      return PAGE_SUGGESTIONS[path];
    }
    
    // Check for partial matches
    for (const [pagePath, suggestions] of Object.entries(PAGE_SUGGESTIONS)) {
      if (path.startsWith(pagePath)) {
        return suggestions;
      }
    }
    
    return [];
  };

  const contextualSuggestions = getContextualSuggestions();
  const hasContextualSuggestions = contextualSuggestions.length > 0;

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
    saveToHistory(userMessage);

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

  const clearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem(HISTORY_STORAGE_KEY);
  };

  const formatTimestamp = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
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

                {/* Contextual suggestions */}
                {hasContextualSuggestions && (
                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Lightbulb className="h-4 w-4 text-amber-500" />
                      <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                        Suggestions for this page
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {contextualSuggestions.map((q, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleQuickQuestion(q.question)}
                          className="w-full text-left text-sm p-2 rounded hover:bg-amber-500/10 transition-colors"
                        >
                          {q.question}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tabbed questions */}
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="w-full">
                    <TabsTrigger value="suggested" className="flex-1 text-xs">
                      <MessageCircle className="h-3 w-3 mr-1" />
                      Popular
                    </TabsTrigger>
                    <TabsTrigger value="history" className="flex-1 text-xs">
                      <History className="h-3 w-3 mr-1" />
                      Recent
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="suggested" className="mt-3">
                    <div className="grid grid-cols-1 gap-2">
                      {DEFAULT_QUESTIONS.map((q, idx) => (
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
                  </TabsContent>
                  
                  <TabsContent value="history" className="mt-3">
                    {searchHistory.length > 0 ? (
                      <>
                        <div className="grid grid-cols-1 gap-2">
                          {searchHistory.map((entry, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleQuickQuestion(entry.question)}
                              className="flex items-center gap-2 p-2.5 rounded-lg border bg-card hover:bg-accent hover:border-accent-foreground/20 transition-colors text-left group"
                            >
                              <History className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                              <span className="text-sm flex-1 truncate">{entry.question}</span>
                              <span className="text-[10px] text-muted-foreground">
                                {formatTimestamp(entry.timestamp)}
                              </span>
                            </button>
                          ))}
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={clearHistory}
                          className="w-full mt-2 text-muted-foreground text-xs"
                        >
                          Clear history
                        </Button>
                      </>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No recent questions</p>
                        <p className="text-xs">Your search history will appear here</p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
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
            AI help • Responses may not be 100% accurate
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
