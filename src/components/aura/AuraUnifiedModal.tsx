import { useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles, User, Bot, Mic, MicOff, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUnifiedAura } from '@/hooks/useUnifiedAura';
import { useAuth } from '@/contexts/AuthContext';
import { AuraCommandBar } from './AuraCommandBar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface AuraUnifiedModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuraUnifiedModal({ open, onOpenChange }: AuraUnifiedModalProps) {
  const { user, companyId } = useAuth();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  const {
    inputValue,
    setInputValue,
    handleInput,
    messages,
    isLoading,
    isProcessing,
    currentAgent,
    isVoiceModeEnabled,
    isListening,
  } = useUnifiedAura({
    companyId: companyId || undefined,
    userId: user?.id,
    onActionExecuted: (action) => {
      // Close modal after navigation actions
      if (action === 'navigate') {
        setTimeout(() => onOpenChange(false), 500);
      }
    },
  });
  
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);
  
  const handleSubmit = (query: string) => {
    handleInput(query);
    setInputValue('');
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span>Ask Aura</span>
            {currentAgent && (
              <Badge variant="outline" className="ml-2 text-xs">
                {currentAgent}
              </Badge>
            )}
            {isVoiceModeEnabled && (
              <Badge 
                variant="secondary" 
                className={cn(
                  "ml-auto flex items-center gap-1",
                  isListening && "bg-aura-emerald/10 text-aura-emerald"
                )}
              >
                {isListening ? (
                  <>
                    <Mic className="h-3 w-3 aura-breathing" />
                    Listening...
                  </>
                ) : (
                  <>
                    <MicOff className="h-3 w-3" />
                    Voice Ready
                  </>
                )}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>
        
        {/* Chat messages area */}
        <ScrollArea ref={scrollAreaRef} className="flex-1 min-h-[300px] max-h-[400px] pr-4">
          <div className="space-y-4 py-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[200px] text-center text-muted-foreground">
                <Sparkles className="h-12 w-12 mb-4 text-primary/30" />
                <p className="text-lg font-medium">Hi! I'm Aura</p>
                <p className="text-sm max-w-md mt-2">
                  Ask me anything about your business data, or tell me what you'd like to do.
                </p>
                <div className="flex flex-wrap gap-2 mt-4 justify-center">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleSubmit("What's my revenue this month?")}
                  >
                    Revenue this month
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleSubmit("Show me today's appointments")}
                  >
                    Today's appointments
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleSubmit("Go to customers")}
                  >
                    Go to customers
                  </Button>
                </div>
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex gap-3",
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  {message.role !== 'user' && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "max-w-[80%] rounded-lg px-4 py-2",
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    )}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    {message.agent && message.role !== 'user' && (
                      <p className="text-xs mt-1 opacity-60">{message.agent}</p>
                    )}
                  </div>
                  {message.role === 'user' && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                      <User className="h-4 w-4 text-secondary-foreground" />
                    </div>
                  )}
                </div>
              ))
            )}
            
            {/* Loading indicator */}
            {(isLoading || isProcessing) && (
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                  <Loader2 className="h-4 w-4 text-white animate-spin" />
                </div>
                <div className="bg-muted rounded-lg px-4 py-2">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-foreground/30 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-foreground/30 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-foreground/30 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        
        {/* Unified command bar */}
        <div className="flex-shrink-0 pt-4 border-t">
          <AuraCommandBar
            value={inputValue}
            onChange={setInputValue}
            onSubmit={handleSubmit}
            isLoading={isLoading || isProcessing}
            placeholder="Ask about data, or say what you want to do..."
            autoFocus
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
