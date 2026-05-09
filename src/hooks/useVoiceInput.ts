import { useState, useEffect, useCallback, useRef } from 'react';

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

export interface VoiceInputState {
  isSupported: boolean;
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  error: string | null;
  confidence: number;
}

export interface UseVoiceInputOptions {
  continuous?: boolean;
  language?: string;
  onTranscript?: (transcript: string, isFinal: boolean) => void;
  onCommand?: (command: string) => void;
  onError?: (error: string) => void;
}

// Voice commands that should be intercepted
const VOICE_COMMANDS = [
  'next', 'tab', 'back', 'previous', 'clear', 'erase',
  'save job', 'submit', 'send', 'clock out', 'logout', 'sign out',
  'hey aura', 'ask aura', 'aura help', 'cancel', 'stop listening'
];

export function useVoiceInput(options: UseVoiceInputOptions = {}) {
  const {
    continuous = true,
    language = 'en-US',
    onTranscript,
    onCommand,
    onError,
  } = options;

  const [state, setState] = useState<VoiceInputState>({
    isSupported: false,
    isListening: false,
    transcript: '',
    interimTranscript: '',
    error: null,
    confidence: 0,
  });

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const restartTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const stoppedRef = useRef<boolean>(false);

  // Check for browser support
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setState(prev => ({ ...prev, isSupported: !!SpeechRecognition }));
  }, []);

  // Initialize speech recognition
  const initRecognition = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return null;

    const recognition = new SpeechRecognition();
    recognition.continuous = continuous;
    recognition.interimResults = true;
    recognition.lang = language;

    recognition.onstart = () => {
      setState(prev => ({ ...prev, isListening: true, error: null }));
    };

    recognition.onend = () => {
      setState(prev => ({ ...prev, isListening: false }));

      // Auto-restart if continuous mode and not intentionally stopped / errored
      if (continuous && recognitionRef.current && !stoppedRef.current) {
        restartTimeoutRef.current = setTimeout(() => {
          if (stoppedRef.current || !recognitionRef.current) return;
          try {
            recognitionRef.current?.start();
          } catch (e) {
            // Already started or other error
          }
        }, 100);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      const errorMessage = getErrorMessage(event.error);
      setState(prev => ({ ...prev, error: errorMessage, isListening: false }));
      onError?.(errorMessage);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;
        
        if (result.isFinal) {
          finalTranscript += transcript;
          
          // Check for voice commands
          const command = detectCommand(transcript.toLowerCase().trim());
          if (command) {
            onCommand?.(command);
          } else {
            onTranscript?.(transcript, true);
          }
          
          setState(prev => ({
            ...prev,
            transcript: prev.transcript + transcript,
            interimTranscript: '',
            confidence: result[0].confidence || 0,
          }));
        } else {
          interimTranscript += transcript;
          onTranscript?.(transcript, false);
          setState(prev => ({ ...prev, interimTranscript }));
        }
      }
    };

    return recognition;
  }, [continuous, language, onCommand, onError, onTranscript]);

  // Start listening
  const start = useCallback(async () => {
    if (!state.isSupported) {
      setState(prev => ({ ...prev, error: 'Speech recognition is not supported in this browser' }));
      return false;
    }

    try {
      // Probe permission first (where supported) to fail fast
      try {
        if (navigator.permissions && (navigator.permissions as any).query) {
          const status = await (navigator.permissions as any).query({ name: 'microphone' as PermissionName });
          if (status.state === 'denied') {
            const msg = 'Microphone blocked. Enable it in your browser settings.';
            setState(prev => ({ ...prev, error: msg, isListening: false }));
            onError?.(msg);
            return false;
          }
        }
      } catch { /* Safari ignores microphone permission query */ }

      // Request microphone permission / device
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Release the probe stream — SpeechRecognition opens its own
      stream.getTracks().forEach(t => t.stop());

      stoppedRef.current = false;
      setState(prev => ({ ...prev, error: null }));

      if (!recognitionRef.current) {
        recognitionRef.current = initRecognition();
      }

      recognitionRef.current?.start();
      return true;
    } catch (error: any) {
      let errorMessage = 'Microphone unavailable. Please check your audio device.';
      if (error?.name === 'NotAllowedError') {
        errorMessage = 'Microphone permission denied. Allow it in your browser settings.';
      } else if (error?.name === 'NotFoundError') {
        errorMessage = 'No microphone found on this device.';
      } else if (error?.name === 'NotReadableError') {
        errorMessage = 'Microphone is in use by another app.';
      }
      setState(prev => ({ ...prev, error: errorMessage }));
      onError?.(errorMessage);
      return false;
    }
  }, [state.isSupported, initRecognition, onError]);

  // Stop listening
  const stop = useCallback(() => {
    stoppedRef.current = true;
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }
    const rec = recognitionRef.current;
    recognitionRef.current = null;
    try { rec?.abort(); } catch { /* ignore */ }
    setState(prev => ({ ...prev, isListening: false, interimTranscript: '', error: null }));
  }, []);

  // Toggle listening
  const toggle = useCallback(() => {
    if (state.isListening) {
      stop();
    } else {
      start();
    }
  }, [state.isListening, start, stop]);

  // Clear transcript
  const clearTranscript = useCallback(() => {
    setState(prev => ({ ...prev, transcript: '', interimTranscript: '' }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
      }
      recognitionRef.current?.abort();
    };
  }, []);

  return {
    ...state,
    start,
    stop,
    toggle,
    clearTranscript,
  };
}

function detectCommand(text: string): string | null {
  for (const command of VOICE_COMMANDS) {
    if (text.includes(command)) {
      return command;
    }
  }
  return null;
}

function getErrorMessage(error: string): string {
  switch (error) {
    case 'no-speech':
      return "I didn't catch that. Try speaking again.";
    case 'audio-capture':
      return 'No microphone detected. Please check your audio input.';
    case 'not-allowed':
      return 'Microphone access denied. Please enable permissions.';
    case 'network':
      return 'Network error. Please check your connection.';
    case 'aborted':
      return 'Voice input was cancelled.';
    default:
      return `Voice recognition error: ${error}`;
  }
}
