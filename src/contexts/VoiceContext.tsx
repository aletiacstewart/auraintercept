import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { 
  executeCommand, 
  parseCommand, 
  VoiceCommand, 
  CommandResult, 
  parseNavigationCommand, 
  parseSearchIntent, 
  PAGE_ROUTES,
  AIAction,
  clickButtonByText,
  clickCardByLabel,
  fillFieldByLabel,
  focusFieldByLabel,
  injectSearchQuery,
  getVisibleButtonLabels,
  getVisibleCardLabels,
  getVisibleFieldLabels,
  isLikelyDictationText,
} from '@/lib/voiceNavigation';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

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
  isProcessing: boolean;
  
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
  const [isProcessing, setIsProcessing] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();

  // Execute AI-interpreted action
  const executeAIAction = useCallback((action: AIAction) => {
    let result: CommandResult = { success: false, action: 'unknown', message: action.message };

    switch (action.action) {
      case 'navigate':
        if (action.route) {
          navigate(action.route);
          result = { success: true, action: 'navigate', message: action.message || `Navigating to ${action.target || action.route}` };
        }
        break;
        
      case 'click_button':
        if (action.target) {
          result = clickButtonByText(action.target);
          if (!result.success && action.message) {
            result.message = action.message;
          }
        }
        break;
        
      case 'click_card':
        if (action.target) {
          result = clickCardByLabel(action.target);
          // If clicking the card didn't work but we have a route, navigate instead
          if (!result.success && action.route) {
            navigate(action.route);
            result = { success: true, action: 'navigate', message: action.message || `Opening ${action.target}` };
          }
        }
        break;
        
      case 'search':
        if (action.value) {
          result = injectSearchQuery(action.value);
        }
        break;
        
      case 'fill_field':
        if (action.target && action.value) {
          result = fillFieldByLabel(action.target, action.value);
        }
        break;
        
      case 'focus_field':
        if (action.target) {
          result = focusFieldByLabel(action.target);
        }
        break;
        
      case 'open_form':
        // Try to click "New X" or "+ New X" button
        if (action.target) {
          // First try exact match (handles "New Lead", "new lead", etc.)
          result = clickButtonByText(action.target);
          if (!result.success) {
            // Only prepend "New " if target doesn't already start with it
            const normalized = action.target.toLowerCase().trim();
            if (!normalized.startsWith('new ')) {
              result = clickButtonByText(`New ${action.target}`);
            }
          }
          if (!result.success) {
            result = clickButtonByText(`+ New ${action.target}`);
          }
          if (!result.success) {
            result = clickButtonByText(`Add ${action.target}`);
          }
          if (!result.success) {
            result = clickButtonByText(`Create ${action.target}`);
          }
        }
        break;
        
      case 'scroll':
        if (action.target === 'up') {
          window.scrollBy({ top: -300, behavior: 'smooth' });
          result = { success: true, action: 'scroll', message: 'Scrolled up' };
        } else if (action.target === 'down') {
          window.scrollBy({ top: 300, behavior: 'smooth' });
          result = { success: true, action: 'scroll', message: 'Scrolled down' };
        }
        break;
        
      default:
        result = { success: false, action: 'unknown', message: action.message || 'Command not understood' };
    }

    setLastCommand(result);
    
    if (result.success) {
      toast.success(result.message, {
        duration: 1500,
        className: 'voice-command-toast',
      });
    } else {
      toast.error(result.message || 'Could not execute command', {
        duration: 2000,
      });
    }
    
    return result;
  }, [navigate]);

  // Process voice command through AI
  const processWithAI = useCallback(async (text: string): Promise<boolean> => {
    // Skip empty or whitespace-only commands
    const trimmedText = text?.trim();
    if (!trimmedText) {
      console.log('Voice: Skipping empty command');
      return false;
    }
    
    setIsProcessing(true);
    
    try {
      const response = await supabase.functions.invoke('voice-navigator', {
        body: { 
          command: trimmedText,
          currentPage: location.pathname,
          visibleButtons: getVisibleButtonLabels(),
          visibleCards: getVisibleCardLabels(),
          visibleFields: getVisibleFieldLabels(),
        }
      });
      
      if (response.error) {
        console.error('Voice navigator error:', response.error);
        // Handle specific error codes
        if (response.error.message?.includes('429') || response.error.message?.includes('rate limit')) {
          toast.error('Voice AI rate limited. Try again in a moment.', { duration: 3000 });
        } else if (response.error.message?.includes('402') || response.error.message?.includes('payment')) {
          toast.error('Voice AI credits depleted. Please add credits.', { duration: 3000 });
        }
        return false;
      }
      
      const aiAction = response.data as AIAction;
      
      if (aiAction && aiAction.action && aiAction.action !== 'unknown') {
        executeAIAction(aiAction);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Voice AI processing error:', error);
      return false;
    } finally {
      setIsProcessing(false);
    }
  }, [location.pathname, executeAIAction]);

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

  const handleTranscript = useCallback(async (text: string, isFinal: boolean) => {
    if (!isFinal) return;
    
    // Skip empty or whitespace-only transcripts
    const trimmedText = text?.trim();
    if (!trimmedText) {
      console.log('Voice: Skipping empty transcript');
      return;
    }
    
    // Check if it's a simple command first (fast path)
    const command = parseCommand(trimmedText);
    if (command) {
      handleCommand(command);
      return;
    }
    
    // Context-aware dictation: If an input is focused and text looks like dictation, inject directly
    const activeElement = document.activeElement;
    const isInputElement = activeElement instanceof HTMLInputElement;
    const isTextAreaElement = activeElement instanceof HTMLTextAreaElement;
    
    if ((isInputElement || isTextAreaElement) && isLikelyDictationText(trimmedText)) {
      // This looks like dictation content, inject directly without AI processing
      const currentValue = activeElement.value;
      const newValue = currentValue ? `${currentValue} ${trimmedText}` : trimmedText;
      
      const nativeInputValueSetter = isInputElement
        ? Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set
        : Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
      
      if (nativeInputValueSetter) {
        nativeInputValueSetter.call(activeElement, newValue);
        const event = new Event('input', { bubbles: true });
        activeElement.dispatchEvent(event);
        setLastCommand({ success: true, action: 'dictate', message: 'Text entered' });
        toast.success('Text entered', { duration: 1000, className: 'voice-command-toast' });
      }
      return;
    }
    
    // Check for local navigation command (fast path for common patterns)
    const navigationDestination = parseNavigationCommand(trimmedText);
    if (navigationDestination && PAGE_ROUTES[navigationDestination]) {
      const route = PAGE_ROUTES[navigationDestination];
      navigate(route);
      setLastCommand({ success: true, action: 'navigate', message: `Navigating to ${navigationDestination}` });
      toast.success(`Navigating to ${navigationDestination}`, {
        duration: 1500,
        className: 'voice-command-toast',
      });
      return;
    }
    
    // Check for search command (fast path)
    const searchIntent = parseSearchIntent(trimmedText);
    if (searchIntent) {
      const result = injectSearchQuery(searchIntent.query);
      setLastCommand(result);
      if (result.success) {
        toast.success(result.message, { duration: 1500, className: 'voice-command-toast' });
      } else {
        toast.info(result.message, { duration: 2000 });
      }
      return;
    }
    
    // For complex commands, use AI interpretation
    const aiHandled = await processWithAI(trimmedText);
    
    // If AI couldn't handle it, fall back to text injection
    if (!aiHandled && trimmedText) {
      const activeElement = document.activeElement;
      
      // Only inject text into actual input/textarea elements
      const isInputElement = activeElement instanceof HTMLInputElement;
      const isTextAreaElement = activeElement instanceof HTMLTextAreaElement;
      
      if (isInputElement || isTextAreaElement) {
        const currentValue = activeElement.value;
        const newValue = currentValue ? `${currentValue} ${trimmedText}` : trimmedText;
        
        // Create a native input event for React - use the correct setter for element type
        const nativeInputValueSetter = isInputElement
          ? Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set
          : Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
        
        if (nativeInputValueSetter) {
          nativeInputValueSetter.call(activeElement, newValue);
          const event = new Event('input', { bubbles: true });
          activeElement.dispatchEvent(event);
          setLastCommand({ success: true, action: 'dictate', message: 'Text entered' });
        }
      }
    }
  }, [handleCommand, navigate, processWithAI]);

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
    isProcessing,
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
