import React from 'react';
import { Mic, MicOff, X } from 'lucide-react';
import { useVoice } from '@/contexts/VoiceContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export function AuraVoiceOverlay() {
  const {
    isVoiceModeEnabled,
    isListening,
    interimTranscript,
    lastCommand,
    disableVoiceMode,
  } = useVoice();

  if (!isVoiceModeEnabled) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
      <div className={cn(
        "voice-overlay-container rounded-2xl px-6 py-4 min-w-[320px] max-w-[500px]",
        "flex items-center gap-4 shadow-2xl",
        "border border-secondary/30"
      )}>
        {/* Microphone indicator */}
        <div className={cn(
          "relative flex items-center justify-center w-10 h-10 rounded-full",
          isListening ? "bg-aura-emerald/20" : "bg-muted/20"
        )}>
          {isListening ? (
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
          {lastCommand?.success && lastCommand.action !== 'unknown' ? (
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-aura-emerald uppercase tracking-wide">
                Command
              </span>
              <span className="text-sm text-foreground font-medium">
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
            Say "Next", "Clear", or "Save Job" • Ctrl+Shift+V to toggle
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
}
