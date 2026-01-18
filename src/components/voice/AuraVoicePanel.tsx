import { Mic, Keyboard, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useVoice } from '@/contexts/VoiceContext';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';

interface AuraVoicePanelProps {
  collapsed?: boolean;
}

export function AuraVoicePanel({ collapsed = false }: AuraVoicePanelProps) {
  const { isVoiceModeEnabled, isSupported, toggleVoiceMode, isListening } = useVoice();

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
            Aura Voice
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

      {/* Status indicator */}
      {isVoiceModeEnabled && (
        <div className="flex items-center gap-1.5 text-[10px] text-aura-emerald/80">
          <span className={cn(
            "w-1.5 h-1.5 rounded-full bg-aura-emerald",
            isListening ? "animate-pulse" : ""
          )} />
          {isListening ? "Listening..." : "Ready"}
        </div>
      )}

      {/* Keyboard shortcut hint */}
      <div className="flex items-center gap-1 mt-2 text-[10px] text-sidebar-foreground/50">
        <Keyboard className="w-3 h-3" />
        <span>Ctrl+Shift+V to toggle</span>
      </div>
    </div>
  );
}
