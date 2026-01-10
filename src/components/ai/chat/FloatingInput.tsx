import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Home as HomeIcon, Mic } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FloatingInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onHome: () => void;
  onVoice?: () => void;
  isLoading?: boolean;
  placeholder?: string;
  showVoice?: boolean;
}

export const FloatingInput: React.FC<FloatingInputProps> = ({
  value,
  onChange,
  onSubmit,
  onHome,
  onVoice,
  isLoading,
  placeholder = "Type your message...",
  showVoice,
}) => {
  return (
    <form onSubmit={onSubmit} className="shrink-0 p-3 sm:p-4 border-t border-white/10 bg-slate-800/90 backdrop-blur-sm">
      <div className="flex items-center gap-2 bg-slate-700/80 border border-white/20 rounded-full px-2 py-1.5">
        <Button 
          type="button" 
          variant="ghost" 
          size="icon"
          onClick={onHome}
          className="shrink-0 h-8 w-8 rounded-full text-white/70 hover:bg-white/10 hover:text-white transition-colors"
        >
          <HomeIcon className="h-4 w-4" />
        </Button>
        
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={isLoading}
          className="flex-1 border-0 bg-transparent text-white focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-white/50 h-9"
        />

        {showVoice && (
          <Button 
            type="button" 
            variant="ghost" 
            size="icon"
            onClick={onVoice}
            className="shrink-0 h-8 w-8 rounded-full text-white/70 hover:bg-white/10 hover:text-white transition-colors"
          >
            <Mic className="h-4 w-4" />
          </Button>
        )}
        
        <Button 
          type="submit" 
          size="icon"
          disabled={isLoading || !value.trim()}
          className={cn(
            "shrink-0 h-8 w-8 rounded-full transition-all duration-300",
            value.trim() ? "glow-primary" : ""
          )}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
};
