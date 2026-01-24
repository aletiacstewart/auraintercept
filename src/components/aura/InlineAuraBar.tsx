import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sparkles, Search, Mic, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useVoice } from '@/contexts/VoiceContext';
import { useUnifiedAura } from '@/hooks/useUnifiedAura';
import { useAuth } from '@/contexts/AuthContext';
import { AuraQuickResponsePopup } from './AuraQuickResponsePopup';
import { AnimatePresence, motion } from 'framer-motion';

interface InlineAuraBarProps {
  className?: string;
  placeholder?: string;
}

export function InlineAuraBar({ className, placeholder }: InlineAuraBarProps) {
  const { companyId, user } = useAuth();
  const { isVoiceModeEnabled, toggleVoiceMode, isListening, isSupported } = useVoice();
  const [showResponse, setShowResponse] = useState(false);
  const [lastResponse, setLastResponse] = useState<string | null>(null);
  const [showThinking, setShowThinking] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const {
    inputValue,
    setInputValue,
    handleInput,
    isLoading,
    messages,
    clearInput,
  } = useUnifiedAura({
    companyId: companyId || undefined,
    userId: user?.id,
    onActionExecuted: () => {
      // Clear input when action is executed
      clearInput();
    },
  });

  // Show thinking state when loading
  useEffect(() => {
    if (isLoading) {
      setShowThinking(true);
      setShowResponse(false);
    } else {
      setShowThinking(false);
    }
  }, [isLoading]);

  // Show quick response popup when new assistant message arrives
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.role === 'assistant' && lastMessage.content) {
      setLastResponse(lastMessage.content);
      setShowResponse(true);
      setShowThinking(false);
    }
  }, [messages]);

  // Clear response when messages are cleared
  useEffect(() => {
    if (messages.length === 0 && lastResponse) {
      setLastResponse(null);
      setShowResponse(false);
    }
  }, [messages.length, lastResponse]);

  const onSubmit = async () => {
    if (inputValue.trim()) {
      setShowThinking(true);
      await handleInput(inputValue, false);
      clearInput(); // Use clearInput to also reset voice state
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
    if (e.key === 'Escape') {
      setInputValue('');
      setShowResponse(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div className={cn("relative", className)}>
      <div className="flex items-center gap-2 bg-card border border-border rounded-xl p-1.5 shadow-sm hover:shadow-md transition-shadow">
        {/* Aura Icon */}
        <div className={cn(
          "w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0 transition-all",
          isLoading && "animate-pulse"
        )}>
          <Sparkles className="h-4 w-4 text-white" />
        </div>
        
        {/* Input Field */}
        <Input
          ref={inputRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={placeholder || "Ask Aura anything..."}
          className="border-0 bg-transparent flex-1 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm text-foreground placeholder:text-muted-foreground"
          onKeyDown={handleKeyDown}
          disabled={isLoading}
        />
        
        {/* Clear button when there's input */}
        {inputValue && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 flex-shrink-0 relative z-10"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              clearInput();
            }}
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </Button>
        )}
        
        {/* Voice Toggle */}
        {isSupported && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn(
              "h-8 w-8 flex-shrink-0 transition-colors relative z-10",
              isVoiceModeEnabled && isListening && "bg-primary/20 text-primary"
            )}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              // Focus the input first to ensure proper context for voice
              inputRef.current?.focus();
              toggleVoiceMode();
            }}
          >
            <Mic className={cn(
              "h-4 w-4",
              isVoiceModeEnabled && isListening && "animate-pulse"
            )} />
          </Button>
        )}
        
        {/* Submit Button */}
        <Button
          size="sm"
          className="h-8 px-3 flex-shrink-0"
          onClick={onSubmit}
          disabled={!inputValue.trim() || isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
        </Button>
      </div>
      
      {/* Thinking Indicator */}
      <AnimatePresence>
        {showThinking && !showResponse && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 mt-2 p-4 bg-card border border-border rounded-xl shadow-lg z-50"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0 animate-pulse">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">Aura is thinking...</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Quick Response Popup */}
      <AnimatePresence>
        {showResponse && lastResponse && (
          <AuraQuickResponsePopup 
            response={lastResponse} 
            onDismiss={() => setShowResponse(false)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
