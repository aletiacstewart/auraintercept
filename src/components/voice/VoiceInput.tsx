import React, { useEffect, useRef } from 'react';
import { Mic } from 'lucide-react';
import { useVoice } from '@/contexts/VoiceContext';
import { cn } from '@/lib/utils';

interface VoiceInputProps {
  children: React.ReactElement;
  fieldId?: string;
  className?: string;
}

/**
 * Wrapper component that adds voice input capabilities to any input/textarea field.
 * Shows a subtle "listening" indicator when the field is focused and voice mode is active.
 */
export function VoiceInput({ children, fieldId, className }: VoiceInputProps) {
  const { isVoiceModeEnabled, isListening, setActiveField } = useVoice();
  const [isFocused, setIsFocused] = React.useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const inputElement = wrapperRef.current?.querySelector('input, textarea, [contenteditable]');
    
    if (!inputElement) return;

    const handleFocus = () => {
      setIsFocused(true);
      setActiveField(fieldId || null);
    };

    const handleBlur = () => {
      setIsFocused(false);
      setActiveField(null);
    };

    inputElement.addEventListener('focus', handleFocus);
    inputElement.addEventListener('blur', handleBlur);

    return () => {
      inputElement.removeEventListener('focus', handleFocus);
      inputElement.removeEventListener('blur', handleBlur);
    };
  }, [fieldId, setActiveField]);

  const showVoiceIndicator = isVoiceModeEnabled && isListening && isFocused;

  return (
    <div 
      ref={wrapperRef}
      className={cn(
        "voice-input-wrapper relative",
        showVoiceIndicator && "voice-listening-active",
        className
      )}
    >
      {children}
      
      {/* Voice listening indicator */}
      {showVoiceIndicator && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none z-10">
          <div className="relative">
            <Mic className="w-4 h-4 text-aura-emerald voice-mic-pulse" />
            <div className="absolute inset-0 rounded-full bg-aura-emerald/20 voice-mic-ring" />
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Higher-order component version for wrapping existing input components
 */
export function withVoiceInput<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  fieldId?: string
) {
  return function VoiceEnabledComponent(props: P) {
    return (
      <VoiceInput fieldId={fieldId}>
        <WrappedComponent {...props} />
      </VoiceInput>
    );
  };
}
