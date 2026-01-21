import { forwardRef } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { useVoice } from '@/contexts/VoiceContext';
import { cn } from '@/lib/utils';

interface FormVoiceIndicatorProps {
  className?: string;
}

export const FormVoiceIndicator = forwardRef<HTMLButtonElement, FormVoiceIndicatorProps>(
  function FormVoiceIndicator({ className }, ref) {
    const { isVoiceModeEnabled, isListening, enableVoiceMode, disableVoiceMode } = useVoice();

    const handleToggle = () => {
      if (isVoiceModeEnabled) {
        disableVoiceMode();
      } else {
        enableVoiceMode();
      }
    };

    return (
      <button
        ref={ref}
        onClick={handleToggle}
        type="button"
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all",
          "focus:outline-none focus:ring-2 focus:ring-offset-1",
          isVoiceModeEnabled
            ? "bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25 focus:ring-emerald-500"
            : "bg-red-500/15 text-red-500 hover:bg-red-500/25 focus:ring-red-500",
          isListening && "voice-indicator-pulse",
          className
        )}
      >
        {isVoiceModeEnabled ? (
          <Mic className="w-3 h-3" />
        ) : (
          <MicOff className="w-3 h-3" />
        )}
        <span>{isVoiceModeEnabled ? "Voice ON" : "Voice OFF"}</span>
      </button>
    );
  }
);

FormVoiceIndicator.displayName = 'FormVoiceIndicator';
