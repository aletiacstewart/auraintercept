import React from 'react';
import { Mic, MicOff } from 'lucide-react';
import { useVoice } from '@/contexts/VoiceContext';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface VoiceModeToggleProps {
  className?: string;
  showLabel?: boolean;
  size?: 'sm' | 'default' | 'lg';
}

export function VoiceModeToggle({ className, showLabel = false, size = 'default' }: VoiceModeToggleProps) {
  const { isVoiceModeEnabled, isListening, isSupported, toggleVoiceMode } = useVoice();

  if (!isSupported) return null;

  const iconSize = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5';
  const buttonSize = size === 'sm' ? 'h-8 w-8' : size === 'lg' ? 'h-12 w-12' : 'h-10 w-10';

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleVoiceMode}
          className={cn(
            buttonSize,
            "relative transition-all duration-300",
            isVoiceModeEnabled && "bg-aura-emerald/10 hover:bg-aura-emerald/20",
            className
          )}
        >
          {isVoiceModeEnabled ? (
            <>
              <Mic className={cn(iconSize, "text-aura-emerald", isListening && "aura-breathing")} />
              {isListening && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-aura-emerald opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-aura-emerald" />
                </span>
              )}
            </>
          ) : (
            <MicOff className={cn(iconSize, "text-muted-foreground")} />
          )}
          
          {showLabel && (
            <span className="ml-2 text-sm">
              {isVoiceModeEnabled ? 'Voice On' : 'Voice Off'}
            </span>
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="flex flex-col gap-1">
        <span className="font-medium">
          {isVoiceModeEnabled ? 'Disable Ask Aura' : 'Enable Ask Aura'}
        </span>
        <span className="text-xs text-muted-foreground">
          Ctrl+Shift+V
        </span>
      </TooltipContent>
    </Tooltip>
  );
}

export function VoiceModeBadge() {
  const { isVoiceModeEnabled, isListening, isSupported } = useVoice();

  if (!isSupported || !isVoiceModeEnabled) return null;

  return (
    <Badge 
      variant="outline" 
      className={cn(
        "gap-1.5 border-aura-emerald/50 text-aura-emerald bg-aura-emerald/10",
        isListening && "animate-pulse"
      )}
    >
      <Mic className="w-3 h-3" />
      Voice Mode
    </Badge>
  );
}
