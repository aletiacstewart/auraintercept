import { useCallback, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  speak,
  stopSpeaking,
  isSpeechSupported,
  isRecognitionSupported,
  getSpeechRecognition,
} from '@/lib/browserTts';

type TranscriptMsg = { role: 'user' | 'assistant'; text: string };

interface UseBrowserVoiceChatOptions {
  companyId: string;
  onTranscript?: (role: 'user' | 'assistant', text: string) => void;
}

interface UseBrowserVoiceChatReturn {
  status: 'disconnected' | 'connected';
  isSpeaking: boolean;
  isProcessing: boolean;
  startSession: () => Promise<void>;
  endSession: () => void;
  /** True if the browser supports SpeechRecognition */
  recognitionSupported: boolean;
  /** True if the browser supports speechSynthesis */
  speechSupported: boolean;
}

/**
 * Browser-native voice chat hook.
 * Uses SpeechRecognition for STT, the ai-agent-chat edge function for LLM,
 * and speechSynthesis for TTS. Zero external API cost.
 */
export function useBrowserVoiceChat({
  companyId,
  onTranscript,
}: UseBrowserVoiceChatOptions): UseBrowserVoiceChatReturn {
  const [status, setStatus] = useState<'disconnected' | 'connected'>('disconnected');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const sessionIdRef = useRef<string>(crypto.randomUUID());
  const historyRef = useRef<TranscriptMsg[]>([]);
  const agentRef = useRef<string>('triage');
  const activeRef = useRef(false);

  const speechSupported = isSpeechSupported();
  const recognitionSupported = isRecognitionSupported();

  const processUserSpeech = useCallback(
    async (userText: string) => {
      if (!userText.trim() || !activeRef.current) return;

      onTranscript?.('user', userText);
      historyRef.current.push({ role: 'user', text: userText });

      setIsProcessing(true);
      try {
        const conversationHistory = historyRef.current.map((m) => ({
          role: m.role,
          content: m.text,
        }));

        const { data, error } = await supabase.functions.invoke('ai-agent-chat', {
          body: {
            agentType: agentRef.current,
            message: userText,
            companyId,
            sessionId: sessionIdRef.current,
            conversationHistory,
          },
        });

        if (error) throw error;

        const assistantText = (data?.response || data?.message || '').toString();
        const newAgent = data?.handoff_to || data?.agent || agentRef.current;
        if (newAgent !== agentRef.current) agentRef.current = newAgent;

        if (assistantText && activeRef.current) {
          onTranscript?.('assistant', assistantText);
          historyRef.current.push({ role: 'assistant', text: assistantText });

          // Speak the response
          setIsSpeaking(true);
          try {
            await speak(assistantText);
          } catch {
            // speech error — non-fatal
          }
          setIsSpeaking(false);
        }

        // Handle handoff follow-up
        if (data?.handoff_to && activeRef.current) {
          const followUpHistory = historyRef.current.map((m) => ({
            role: m.role,
            content: m.text,
          }));
          const { data: followUp } = await supabase.functions.invoke('ai-agent-chat', {
            body: {
              agentType: data.handoff_to,
              message: userText,
              companyId,
              sessionId: sessionIdRef.current,
              isHandoff: true,
              handoffFrom: agentRef.current,
              conversationHistory: followUpHistory,
            },
          });
          const followUpText = (followUp?.response || followUp?.message || '').toString();
          if (followUpText && activeRef.current) {
            onTranscript?.('assistant', followUpText);
            historyRef.current.push({ role: 'assistant', text: followUpText });
            setIsSpeaking(true);
            try {
              await speak(followUpText);
            } catch {
              // non-fatal
            }
            setIsSpeaking(false);
          }
        }
      } catch (e) {
        console.error('[BrowserVoiceChat] Error:', e);
        if (activeRef.current) {
          const errorMsg = 'Sorry, I had trouble processing that. Could you try again?';
          onTranscript?.('assistant', errorMsg);
          setIsSpeaking(true);
          try {
            await speak(errorMsg);
          } catch {
            // non-fatal
          }
          setIsSpeaking(false);
        }
      } finally {
        setIsProcessing(false);
      }
    },
    [companyId, onTranscript]
  );

  const startSession = useCallback(async () => {
    if (!recognitionSupported || !speechSupported) return;

    const SpeechRecognitionCtor = getSpeechRecognition();
    if (!SpeechRecognitionCtor) return;

    // Request microphone
    await navigator.mediaDevices.getUserMedia({ audio: true });

    activeRef.current = true;
    sessionIdRef.current = crypto.randomUUID();
    historyRef.current = [];
    agentRef.current = 'triage';

    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const last = event.results[event.results.length - 1];
      if (last.isFinal) {
        const transcript = last[0].transcript.trim();
        if (transcript) {
          processUserSpeech(transcript);
        }
      }
    };

    recognition.onerror = (event: any) => {
      console.error('[BrowserVoiceChat] Recognition error:', event.error);
      // Restart on non-fatal errors
      if (activeRef.current && event.error !== 'not-allowed') {
        try {
          recognition.start();
        } catch {
          // already started
        }
      }
    };

    recognition.onend = () => {
      // Auto-restart if session is still active
      if (activeRef.current) {
        try {
          recognition.start();
        } catch {
          // already started
        }
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
    setStatus('connected');

    // Speak a greeting
    const greeting = `Hello! I'm Aura, your AI assistant. How can I help you today?`;
    onTranscript?.('assistant', greeting);
    historyRef.current.push({ role: 'assistant', text: greeting });
    setIsSpeaking(true);
    try {
      await speak(greeting);
    } catch {
      // non-fatal
    }
    setIsSpeaking(false);
  }, [recognitionSupported, speechSupported, processUserSpeech, onTranscript]);

  const endSession = useCallback(() => {
    activeRef.current = false;
    stopSpeaking();
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // already stopped
      }
      recognitionRef.current = null;
    }
    setStatus('disconnected');
    setIsSpeaking(false);
    setIsProcessing(false);
  }, []);

  return {
    status,
    isSpeaking,
    isProcessing,
    startSession,
    endSession,
    recognitionSupported,
    speechSupported,
  };
}
