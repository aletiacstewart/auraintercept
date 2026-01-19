import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Sparkles, Search, Command, Mic, MicOff, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useVoice } from '@/contexts/VoiceContext';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface AuraCommandBarProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (query: string) => void;
  onClear?: () => void;
  placeholder?: string;
  isLoading?: boolean;
  autoFocus?: boolean;
  className?: string;
}

export function AuraCommandBar({
  value,
  onChange,
  onSubmit,
  onClear,
  placeholder = "Ask Aura anything about your data... (e.g., 'What is my projected revenue next month?')",
  isLoading = false,
  autoFocus = false,
  className,
}: AuraCommandBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { isVoiceModeEnabled, isListening, isSupported, toggleVoiceMode } = useVoice();

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim() && !isLoading) {
      onSubmit(value.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cn("w-full", className)}>
      <div className="relative">
        {/* Gradient border effect */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-secondary rounded-xl opacity-75 blur-sm" />
        
        <div className={cn(
          "relative flex items-center gap-2 bg-background rounded-xl border border-border p-1",
          isVoiceModeEnabled && isListening && "voice-listening-active"
        )}>
          {/* Icon */}
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          
          {/* Input */}
          <Input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isLoading}
            className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-base placeholder:text-muted-foreground/60"
          />
          
          {/* Clear button */}
          {value && onClear && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 flex-shrink-0"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClear();
              }}
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </Button>
          )}
          
          {/* Voice input toggle */}
          {isSupported && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={toggleVoiceMode}
                  className={cn(
                    "h-9 w-9 rounded-lg transition-all",
                    isVoiceModeEnabled && "bg-aura-emerald/10 text-aura-emerald"
                  )}
                >
                  {isVoiceModeEnabled ? (
                    <Mic className={cn("h-4 w-4", isListening && "aura-breathing")} />
                  ) : (
                    <MicOff className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <span>{isVoiceModeEnabled ? 'Disable Voice' : 'Enable Voice'}</span>
                <span className="ml-2 text-muted-foreground text-xs">Ctrl+Shift+V</span>
              </TooltipContent>
            </Tooltip>
          )}
          
          {/* Keyboard shortcut hint */}
          <div className="hidden md:flex items-center gap-1 px-2 py-1 rounded bg-muted text-muted-foreground text-xs">
            <Command className="h-3 w-3" />
            <span>K</span>
          </div>
          
          {/* Submit button */}
          <Button 
            type="submit" 
            disabled={!value.trim() || isLoading}
            className="rounded-lg"
          >
            {isLoading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}
