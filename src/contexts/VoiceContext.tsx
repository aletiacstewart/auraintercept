import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { executeCommand, parseCommand, VoiceCommand, CommandResult } from '@/lib/voiceNavigation';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface VoiceContextType {
  // State
  isVoiceModeEnabled: boolean;
  isListening: boolean;
  isSupported: boolean;
  transcript: string;
  interimTranscript: string;
  error: string | null;
  lastCommand: CommandResult | null;
  activeFieldId: string | null;
  
  // Actions
  enableVoiceMode: () => void;
  disableVoiceMode: () => void;
  toggleVoiceMode: () => void;
  setActiveField: (fieldId: string | null) => void;
  clearTranscript: () => void;
  injectText: (text: string) => void;
}

const VoiceContext = createContext<VoiceContextType | undefined>(undefined);

const VOICE_MODE_KEY = 'aura-voice-mode-enabled';

export function VoiceProvider({ children }: { children: React.ReactNode }) {
  const [isVoiceModeEnabled, setIsVoiceModeEnabled] = useState(() => {
    return localStorage.getItem(VOICE_MODE_KEY) === 'true';
  });
  const [activeFieldId, setActiveFieldId] = useState<string | null>(null);
  const [lastCommand, setLastCommand] = useState<CommandResult | null>(null);
  
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleCommand = useCallback((command: string) => {
    const parsedCommand = parseCommand(command) || command as VoiceCommand;
    
    const result = executeCommand(parsedCommand, {
      onLogout: () => {
        signOut();
        navigate('/auth');
      },
      onAuraActivate: () => {
        navigate('/dashboard/ask-aura');
      },
      onStopListening: () => {
        setIsVoiceModeEnabled(false);
        localStorage.setItem(VOICE_MODE_KEY, 'false');
      },
    });
    
    setLastCommand(result);
    
    // Show toast for command feedback
    if (result.success) {
      toast.success(result.message, {
        duration: 1500,
        className: 'voice-command-toast',
      });
    } else {
      toast.error(result.message || "Command not recognized. Try 'Next' or 'Save Job'.", {
        duration: 2000,
      });
    }
  }, [navigate, signOut]);

  const handleTranscript = useCallback((text: string, isFinal: boolean) => {
    if (!isFinal) return;
    
    // Check if it's a command first
    const command = parseCommand(text);
    if (command) {
      handleCommand(command);
      return;
    }
    
    // Otherwise, inject text into the active field
    const activeElement = document.activeElement as HTMLInputElement | HTMLTextAreaElement;
    if (activeElement && ('value' in activeElement)) {
      const currentValue = activeElement.value;
      const newValue = currentValue ? `${currentValue} ${text}` : text;
      
      // Create a native input event for React
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype, 'value'
      )?.set || Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype, 'value'
      )?.set;
      
      nativeInputValueSetter?.call(activeElement, newValue);
      
      const event = new Event('input', { bubbles: true });
      activeElement.dispatchEvent(event);
    }
  }, [handleCommand]);

  const handleError = useCallback((error: string) => {
    toast.error(error, { duration: 3000 });
  }, []);

  const {
    isSupported,
    isListening,
    transcript,
    interimTranscript,
    error,
    start,
    stop,
    clearTranscript: clearVoiceTranscript,
  } = useVoiceInput({
    continuous: true,
    onTranscript: handleTranscript,
    onCommand: handleCommand,
    onError: handleError,
  });

  // Start/stop listening based on voice mode
  useEffect(() => {
    if (isVoiceModeEnabled && isSupported) {
      start();
    } else {
      stop();
    }
  }, [isVoiceModeEnabled, isSupported, start, stop]);

  // Persist voice mode preference
  useEffect(() => {
    localStorage.setItem(VOICE_MODE_KEY, isVoiceModeEnabled.toString());
  }, [isVoiceModeEnabled]);

  // Global keyboard shortcut: Ctrl+Shift+V
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'V') {
        event.preventDefault();
        setIsVoiceModeEnabled(prev => !prev);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const enableVoiceMode = useCallback(() => {
    setIsVoiceModeEnabled(true);
  }, []);

  const disableVoiceMode = useCallback(() => {
    setIsVoiceModeEnabled(false);
  }, []);

  const toggleVoiceMode = useCallback(() => {
    setIsVoiceModeEnabled(prev => !prev);
  }, []);

  const setActiveField = useCallback((fieldId: string | null) => {
    setActiveFieldId(fieldId);
  }, []);

  const injectText = useCallback((text: string) => {
    handleTranscript(text, true);
  }, [handleTranscript]);

  const value: VoiceContextType = {
    isVoiceModeEnabled,
    isListening,
    isSupported,
    transcript,
    interimTranscript,
    error,
    lastCommand,
    activeFieldId,
    enableVoiceMode,
    disableVoiceMode,
    toggleVoiceMode,
    setActiveField,
    clearTranscript: clearVoiceTranscript,
    injectText,
  };

  return (
    <VoiceContext.Provider value={value}>
      {children}
    </VoiceContext.Provider>
  );
}

export function useVoice() {
  const context = useContext(VoiceContext);
  if (context === undefined) {
    throw new Error('useVoice must be used within a VoiceProvider');
  }
  return context;
}
