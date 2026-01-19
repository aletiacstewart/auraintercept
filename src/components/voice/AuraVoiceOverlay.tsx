import React from 'react';
import { createPortal } from 'react-dom';
import { Mic, MicOff, X, Loader2 } from 'lucide-react';
import { useVoice } from '@/contexts/VoiceContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export function AuraVoiceOverlay() {
  const {
    isVoiceModeEnabled,
    isListening,
    isProcessing,
    interimTranscript,
    lastCommand,
    disableVoiceMode,
  } = useVoice();

  if (!isVoiceModeEnabled) return null;

  const overlayContent = (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] animate-fade-in pointer-events-auto">
      <div className={cn(
        "voice-overlay-container rounded-2xl px-6 py-4 min-w-[320px] max-w-[500px]",
        "flex items-center gap-4 shadow-2xl",
        "border border-secondary/30 bg-background"
      )}>
        {/* Microphone indicator */}
        <div className={cn(
          "relative flex items-center justify-center w-10 h-10 rounded-full",
          isProcessing ? "bg-primary/20" : isListening ? "bg-aura-emerald/20" : "bg-muted/20"
        )}>
          {isProcessing ? (
            <Loader2 className="w-5 h-5 text-primary animate-spin" />
          ) : isListening ? (
            <>
              <Mic className="w-5 h-5 text-aura-emerald aura-breathing" />
              {/* Pulse rings */}
              <div className="absolute inset-0 rounded-full bg-aura-emerald/20 aura-pulse-ring" />
              <div className="absolute inset-0 rounded-full bg-aura-emerald/10 aura-pulse-ring" style={{ animationDelay: '0.5s' }} />
            </>
          ) : (
            <MicOff className="w-5 h-5 text-muted-foreground" />
          )}
        </div>

        {/* Transcript display */}
        <div className="flex-1 min-w-0">
          {isProcessing ? (
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-primary uppercase tracking-wide">
                Processing
              </span>
              <span className="text-sm text-foreground/80">
                Understanding your command...
              </span>
            </div>
          ) : lastCommand?.success && lastCommand.action !== 'unknown' ? (
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-aura-emerald uppercase tracking-wide">
                {lastCommand.action === 'navigate' ? 'Navigation' : 
                 lastCommand.action === 'click_button' ? 'Button' :
                 lastCommand.action === 'click_card' ? 'Card' :
                 lastCommand.action === 'search' ? 'Search' :
                 lastCommand.action === 'fill_field' ? 'Field' :
                 'Command'}
              </span>
              <span className="text-sm text-foreground font-medium truncate">
                {lastCommand.message}
              </span>
            </div>
          ) : interimTranscript ? (
            <p className="text-sm text-foreground/80 truncate animate-pulse">
              {interimTranscript}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              {isListening ? "Listening to you..." : "Voice paused"}
            </p>
          )}
          
          {/* Hint text */}
          <p className="text-xs text-muted-foreground/60 mt-1">
            Try "Go to Leads", "Click New Quote", or "Search for John" • Ctrl+Shift+V
          </p>
        </div>

        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0"
          onClick={disableVoiceMode}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );

  // Use portal to ensure overlay renders at document.body level, above all modals
  return createPortal(overlayContent, document.body);
}
