import { Mic, Keyboard, Sparkles, MicOff, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useVoice } from '@/contexts/VoiceContext';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface AuraVoicePanelProps {
  collapsed?: boolean;
}

export function AuraVoicePanel({ collapsed = false }: AuraVoicePanelProps) {
  const { 
    isVoiceModeEnabled, 
    isSupported, 
    toggleVoiceMode, 
    isListening,
    isProcessing,
    interimTranscript,
    lastCommand,
    disableVoiceMode,
  } = useVoice();

  if (!isSupported) return null;

  if (collapsed) {
    return (
      <button
        onClick={toggleVoiceMode}
        className={cn(
          "w-full flex items-center justify-center p-2 rounded-lg transition-all duration-300",
          isVoiceModeEnabled 
            ? "bg-aura-emerald/20 text-aura-emerald" 
            : "bg-sidebar-accent/50 text-sidebar-foreground/60 hover:text-sidebar-foreground"
        )}
        title={isVoiceModeEnabled ? "Voice Mode Active - Click to disable" : "Enable Voice Mode"}
      >
        <div className="relative">
          <Mic className={cn(
            "w-5 h-5",
            isListening && "animate-pulse"
          )} />
          {isVoiceModeEnabled && (
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-aura-emerald rounded-full animate-pulse" />
          )}
        </div>
      </button>
    );
  }

  return (
    <div className={cn(
      "mx-2 p-3 rounded-xl border transition-all duration-300",
      isVoiceModeEnabled 
        ? "bg-gradient-to-br from-aura-emerald/10 to-aura-teal/10 border-aura-emerald/30" 
        : "bg-sidebar-accent/30 border-sidebar-border/50"
    )}>
      {/* Header with NEW badge */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={cn(
            "w-7 h-7 rounded-lg flex items-center justify-center transition-colors",
            isVoiceModeEnabled ? "bg-aura-emerald/20" : "bg-sidebar-accent"
          )}>
            <Mic className={cn(
              "w-4 h-4",
              isVoiceModeEnabled ? "text-aura-emerald" : "text-sidebar-foreground/60",
              isListening && "animate-pulse"
            )} />
          </div>
          <span className={cn(
            "text-sm font-semibold",
            isVoiceModeEnabled ? "text-aura-emerald" : "text-sidebar-foreground"
          )}>
            Ask Aura
          </span>
        </div>
        <Badge 
          variant="outline" 
          className="text-[10px] px-1.5 py-0 h-4 bg-aura-emerald/10 text-aura-emerald border-aura-emerald/30"
        >
          <Sparkles className="w-2.5 h-2.5 mr-0.5" />
          NEW
        </Badge>
      </div>

      {/* Toggle */}
      <div className="flex items-center justify-between mb-2">
        <label 
          htmlFor="voice-mode-toggle" 
          className="text-xs text-sidebar-foreground/70 cursor-pointer"
        >
          {isVoiceModeEnabled ? "Voice Mode Active" : "Enable Voice Mode"}
        </label>
        <Switch
          id="voice-mode-toggle"
          checked={isVoiceModeEnabled}
          onCheckedChange={toggleVoiceMode}
          className={cn(
            "data-[state=checked]:bg-aura-emerald",
            isListening && "ring-2 ring-aura-emerald/50"
          )}
        />
      </div>

      {/* Voice Status Panel - Only show when voice is enabled */}
      {isVoiceModeEnabled && (
        <div className="mt-3 p-2.5 rounded-lg bg-sidebar-accent/50 border border-sidebar-border/30">
          <div className="flex items-start gap-2.5">
            {/* Microphone indicator */}
            <div className={cn(
              "relative flex items-center justify-center w-8 h-8 rounded-full shrink-0",
              isProcessing ? "bg-primary/20" : isListening ? "bg-aura-emerald/20" : "bg-muted/20"
            )}>
              {isProcessing ? (
                <Loader2 className="w-4 h-4 text-primary animate-spin" />
              ) : isListening ? (
                <>
                  <Mic className="w-4 h-4 text-aura-emerald aura-breathing" />
                  {/* Pulse rings */}
                  <div className="absolute inset-0 rounded-full bg-aura-emerald/20 aura-pulse-ring" />
                </>
              ) : (
                <MicOff className="w-4 h-4 text-sidebar-foreground/50" />
              )}
            </div>

            {/* Transcript display */}
            <div className="flex-1 min-w-0">
              {isProcessing ? (
                <div className="space-y-0.5">
                  <span className="text-[10px] font-medium text-primary uppercase tracking-wide">
                    Processing
                  </span>
                  <p className="text-xs text-sidebar-foreground">
                    Understanding your command...
                  </p>
                </div>
              ) : lastCommand?.success && lastCommand.action !== 'unknown' ? (
                <div className="space-y-0.5">
                  <span className="text-[10px] font-medium text-aura-emerald uppercase tracking-wide">
                    {lastCommand.action === 'navigate' ? 'Navigation' : 
                     lastCommand.action === 'click_button' ? 'Button' :
                     lastCommand.action === 'click_card' ? 'Card' :
                     lastCommand.action === 'search' ? 'Search' :
                     lastCommand.action === 'fill_field' ? 'Field' :
                     'Command'}
                  </span>
                  <p className="text-xs text-sidebar-foreground font-medium truncate">
                    {lastCommand.message}
                  </p>
                </div>
              ) : interimTranscript ? (
                <p className="text-xs text-sidebar-foreground truncate animate-pulse">
                  {interimTranscript}
                </p>
              ) : (
                <p className="text-xs text-sidebar-foreground">
                  {isListening ? "Listening to you..." : "Voice paused"}
                </p>
              )}
              
              {/* Hint text */}
              <p className="text-[10px] text-sidebar-foreground/60 mt-1 leading-tight">
                Try "Go to Leads" or "New Quote"
              </p>
            </div>

            {/* Close button */}
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-sidebar-foreground/50 hover:text-sidebar-foreground shrink-0"
              onClick={disableVoiceMode}
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        </div>
      )}

      {/* Keyboard shortcut hint - only show when not enabled */}
      {!isVoiceModeEnabled && (
        <div className="flex items-center gap-1 mt-2 text-[10px] text-sidebar-foreground/50">
          <Keyboard className="w-3 h-3" />
          <span>Ctrl+Shift+V to toggle</span>
        </div>
      )}
    </div>
  );
}
