import { Mic, MicOff } from 'lucide-react';
import { useVoice } from '@/contexts/VoiceContext';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface VoiceStatusIndicatorProps {
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export function VoiceStatusIndicator({ 
  size = 'md', 
  showLabel = false,
  className 
}: VoiceStatusIndicatorProps) {
  const { isVoiceModeEnabled, isListening, isSupported, enableVoiceMode, disableVoiceMode } = useVoice();

  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  const iconSizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  };

  // Show disabled indicator if voice is not supported
  if (!isSupported) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn("inline-flex items-center gap-1.5 opacity-50", className)}>
              <div className={cn(
                "flex items-center justify-center rounded-full bg-muted text-muted-foreground",
                sizeClasses[size]
              )}>
                <MicOff className={cn(iconSizeClasses[size])} />
              </div>
              {showLabel && (
                <span className="text-xs font-medium text-muted-foreground">
                  Not Supported
                </span>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="bg-popover text-popover-foreground">
            <p className="text-xs">Voice not supported in this browser</p>
            <p className="text-xs text-muted-foreground">Try Chrome, Edge, or Safari</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  const handleToggle = () => {
    if (isVoiceModeEnabled) {
      disableVoiceMode();
    } else {
      enableVoiceMode();
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={handleToggle}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full transition-all duration-200",
              "focus:outline-none focus:ring-2 focus:ring-offset-2",
              isVoiceModeEnabled 
                ? "focus:ring-emerald-500" 
                : "focus:ring-red-500",
              showLabel && "px-2 py-1",
              className
            )}
          >
            <div
              className={cn(
                "flex items-center justify-center rounded-full transition-all relative",
                sizeClasses[size],
                isVoiceModeEnabled
                  ? "bg-emerald-500/20 text-emerald-500"
                  : "bg-red-500/20 text-red-500",
                isVoiceModeEnabled && "mic-ring-ripple",
                isListening && "voice-indicator-pulse"
              )}
            >
              {isVoiceModeEnabled ? (
                <Mic className={cn(
                  iconSizeClasses[size], 
                  isListening && "mic-flash-enabled"
                )} />
              ) : (
                <MicOff className={cn(iconSizeClasses[size])} />
              )}
            </div>
            {showLabel && (
              <span className={cn(
                "text-xs font-medium",
                isVoiceModeEnabled ? "text-emerald-600" : "text-red-500"
              )}>
                {isVoiceModeEnabled ? "Voice ON" : "Voice OFF"}
              </span>
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="bg-popover text-popover-foreground">
          <p className="text-xs">
            {isVoiceModeEnabled 
              ? "Voice Mode Active - Click to disable" 
              : "Voice Mode Off - Click to enable"}
          </p>
          <p className="text-xs text-muted-foreground">Ctrl+Shift+V</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
