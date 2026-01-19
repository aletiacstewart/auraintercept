import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, Mic } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useVoice } from '@/contexts/VoiceContext';
import { AuraUnifiedModal } from './AuraUnifiedModal';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface AuraFloatingButtonProps {
  className?: string;
}

export function AuraFloatingButton({ className }: AuraFloatingButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { isVoiceModeEnabled, isListening, toggleVoiceMode, isSupported } = useVoice();
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPressRef = useRef(false);
  
  const handleMouseDown = useCallback(() => {
    isLongPressRef.current = false;
    longPressTimerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      // Long press activates voice mode
      if (isSupported) {
        toggleVoiceMode();
      }
    }, 500);
  }, [isSupported, toggleVoiceMode]);
  
  const handleMouseUp = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    
    // If it wasn't a long press, open the modal
    if (!isLongPressRef.current) {
      setIsModalOpen(true);
    }
    isLongPressRef.current = false;
  }, []);
  
  const handleMouseLeave = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    isLongPressRef.current = false;
  }, []);
  
  return (
    <>
      <div className={cn("fixed bottom-6 right-6 z-50", className)}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="lg"
              className={cn(
                "rounded-full w-14 h-14 shadow-lg transition-all duration-300",
                "bg-gradient-to-br from-primary to-secondary hover:shadow-xl hover:scale-105",
                isVoiceModeEnabled && isListening && "ring-4 ring-aura-emerald/50 animate-pulse"
              )}
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
              onTouchStart={handleMouseDown}
              onTouchEnd={handleMouseUp}
            >
              {isVoiceModeEnabled && isListening ? (
                <Mic className="h-6 w-6 text-white aura-breathing" />
              ) : (
                <Sparkles className="h-6 w-6 text-white" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p className="font-medium">Analytics & Reports</p>
            <p className="text-xs text-muted-foreground">Click to chat • Hold for voice</p>
          </TooltipContent>
        </Tooltip>
        
        {/* Voice mode indicator ring */}
        {isVoiceModeEnabled && (
          <div className="absolute inset-0 -z-10 rounded-full bg-aura-emerald/20 animate-ping" />
        )}
      </div>
      
      <AuraUnifiedModal 
        open={isModalOpen} 
        onOpenChange={setIsModalOpen}
      />
    </>
  );
}
