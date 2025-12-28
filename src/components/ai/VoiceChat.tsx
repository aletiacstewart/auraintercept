import React, { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Mic, MicOff, Phone, PhoneOff, Loader2, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VoiceChatProps {
  companyId: string;
  companyName: string;
  onTranscript?: (role: 'user' | 'assistant', text: string) => void;
}

// Check if Web Speech API is available
const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

export const VoiceChat: React.FC<VoiceChatProps> = ({ 
  companyId, 
  companyName,
  onTranscript 
}) => {
  const { toast } = useToast();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [conversationHistory, setConversationHistory] = useState<Array<{ role: 'user' | 'assistant', content: string }>>([]);
  
  const recognitionRef = useRef<any>(null);
  const recognitionStartedRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isActiveRef = useRef(false);
  const elevenLabsAvailableRef = useRef(true);

  // Check microphone permission and Speech API availability
  useEffect(() => {
    if (!SpeechRecognition) {
      setHasPermission(false);
      return;
    }
    
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(() => setHasPermission(true))
      .catch(() => setHasPermission(false));
  }, []);

  // Initialize speech recognition
  const initRecognition = useCallback(() => {
    if (!SpeechRecognition) return null;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      recognitionStartedRef.current = true;
    };

    recognition.onresult = async (event: any) => {
      const transcript = event.results[0][0].transcript;
      console.log('User said:', transcript);

      if (transcript && isActiveRef.current) {
        onTranscript?.('user', transcript);
        setConversationHistory(prev => [...prev, { role: 'user', content: transcript }]);
        await processUserInput(transcript);
      }
    };

    recognition.onerror = (event: any) => {
      recognitionStartedRef.current = false;
      console.error('Speech recognition error:', event.error);
      if (event.error !== 'aborted' && event.error !== 'no-speech') {
        toast({
          variant: "destructive",
          title: "Speech Error",
          description: `Could not recognize speech: ${event.error}`,
        });
      }
    };

    recognition.onend = () => {
      recognitionStartedRef.current = false;
      setIsListening(false);
      // Restart listening if still active and not processing/speaking
      if (isActiveRef.current && !isProcessing && !isSpeaking) {
        setTimeout(() => {
          if (!isActiveRef.current) return;
          if (recognitionStartedRef.current) return;
          try {
            recognition.start();
            recognitionStartedRef.current = true;
            setIsListening(true);
          } catch (e) {
            console.log('Recognition restart skipped:', e);
          }
        }, 150);
      }
    };

    return recognition;
  }, [onTranscript, toast, isProcessing, isSpeaking]);

  // Process user input with AI agent
  const processUserInput = useCallback(async (userText: string) => {
    setIsProcessing(true);
    setIsListening(false);

    try {
      // Stop recognition while processing
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore
        }
      }

      // Build messages for AI
      const messages = [
        ...conversationHistory,
        { role: 'user' as const, content: userText }
      ];

      // Call AI agent (non-streaming for reliable parsing)
      const { data: aiResponse, error: aiError } = await supabase.functions.invoke('ai-agent', {
        body: {
          messages,
          company_id: companyId,
          stream: false,
        }
      });

      if (aiError) {
        throw new Error(aiError.message);
      }

      // Parse the AI response
      let assistantText = '';
      if (typeof aiResponse === 'string') {
        // Handle streaming response
        const lines = aiResponse.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            try {
              const json = JSON.parse(line.substring(6));
              const content = json.choices?.[0]?.delta?.content;
              if (content) assistantText += content;
            } catch (e) {
              // Skip malformed JSON
            }
          }
        }
      } else if (aiResponse?.choices?.[0]?.message?.content) {
        assistantText = aiResponse.choices[0].message.content;
      } else if (aiResponse?.content) {
        assistantText = aiResponse.content;
      }

      if (!assistantText) {
        assistantText = "I'm sorry, I couldn't process that request. Could you please try again?";
      }

      console.log('AI response:', assistantText);
      onTranscript?.('assistant', assistantText);
      setConversationHistory(prev => [...prev, { role: 'assistant', content: assistantText }]);

      // Convert to speech
      await speakText(assistantText);

    } catch (error) {
      console.error('Error processing input:', error);
      toast({
        variant: "destructive",
        title: "Processing Error",
        description: error instanceof Error ? error.message : "Failed to process your request",
      });
    } finally {
      setIsProcessing(false);
      // Resume listening if still active
      if (isActiveRef.current) {
        setTimeout(() => startListening(), 500);
      }
    }
  }, [companyId, conversationHistory, onTranscript, toast]);

  // Start listening
  const startListening = useCallback(() => {
    if (!recognitionRef.current || !isActiveRef.current) return;
    if (isProcessing || isSpeaking) return;
    if (recognitionStartedRef.current) return;

    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch (e) {
      // Common when recognition is already started; keep it quiet.
      console.log('Could not start recognition:', e);
    }
  }, [isProcessing, isSpeaking]);

  // Speak text using ElevenLabs TTS
  const speakText = useCallback(async (text: string) => {
    setIsSpeaking(true);

    const speakWithBrowser = () => {
      setIsSpeaking(false);
      if (!('speechSynthesis' in window)) return false;
      try {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        utterance.rate = 1;
        utterance.onend = () => {
          if (isActiveRef.current) setTimeout(() => startListening(), 250);
        };
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
        return true;
      } catch {
        return false;
      }
    };

    try {
      // If ElevenLabs is known-broken in this session, skip it.
      if (!elevenLabsAvailableRef.current) {
        if (!speakWithBrowser()) {
          throw new Error('Voice output not available in this browser');
        }
        return;
      }

      // Call ElevenLabs TTS backend function
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ text, company_id: companyId }),
        }
      );

      if (!response.ok) {
        // If ElevenLabs is blocked (401), disable it for the rest of the session.
        const raw = await response.text().catch(() => '');
        if (raw.includes('401') || raw.toLowerCase().includes('elevenlabs api error')) {
          elevenLabsAvailableRef.current = false;
          toast({
            title: 'Voice provider unavailable',
            description: 'Switching to browser voice output for this session.',
          });
          if (speakWithBrowser()) return;
        }
        throw new Error('TTS request failed');
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      // Play the audio
      if (audioRef.current) {
        audioRef.current.pause();
        URL.revokeObjectURL(audioRef.current.src);
      }

      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
        if (isActiveRef.current) setTimeout(() => startListening(), 300);
      };

      audio.onerror = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
        console.error('Audio playback error');
      };

      await audio.play();
    } catch (error) {
      console.error('TTS error:', error);
      setIsSpeaking(false);

      if (speakWithBrowser()) return;

      toast({
        variant: 'destructive',
        title: 'Voice Error',
        description: error instanceof Error ? error.message : 'Could not generate speech',
      });
    }
  }, [companyId, startListening, toast]);


  // Start conversation
  const startConversation = useCallback(async () => {
    setIsConnecting(true);

    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setHasPermission(true);

      // Initialize recognition
      recognitionRef.current = initRecognition();
      if (!recognitionRef.current) {
        throw new Error('Speech recognition not available in this browser');
      }

      isActiveRef.current = true;
      
      // Start with a greeting
      const greeting = `Hello! Welcome to ${companyName}. How can I help you today?`;
      onTranscript?.('assistant', greeting);
      setConversationHistory([{ role: 'assistant', content: greeting }]);
      
      await speakText(greeting);

      toast({
        title: "Voice Chat Started",
        description: "You can now speak with the AI assistant",
      });
    } catch (error) {
      console.error('Failed to start voice conversation:', error);
      isActiveRef.current = false;
      toast({
        variant: "destructive",
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Unable to start voice chat",
      });
    } finally {
      setIsConnecting(false);
    }
  }, [companyName, initRecognition, onTranscript, speakText, toast]);

  // Stop conversation
  const stopConversation = useCallback(() => {
    isActiveRef.current = false;
    recognitionStartedRef.current = false;

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Ignore
      }
      recognitionRef.current = null;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      URL.revokeObjectURL(audioRef.current.src);
      audioRef.current = null;
    }

    setIsListening(false);
    setIsSpeaking(false);
    setIsProcessing(false);
    setConversationHistory([]);

    toast({
      title: "Voice Chat Ended",
      description: "The conversation has been disconnected",
    });
  }, [toast]);

  const isConnected = isActiveRef.current && (isListening || isSpeaking || isProcessing);

  // Visual feedback based on state
  const getStatusText = () => {
    if (isConnecting) return 'Connecting...';
    if (isSpeaking) return 'AI is speaking...';
    if (isProcessing) return 'Processing...';
    if (isListening) return 'Listening...';
    if (isActiveRef.current) return 'Ready';
    return 'Click to start voice chat';
  };

  const getStatusColor = () => {
    if (isSpeaking) return 'bg-secondary';
    if (isProcessing) return 'bg-amber-500';
    if (isListening) return 'bg-green-500';
    if (isActiveRef.current) return 'bg-primary';
    return 'bg-muted';
  };

  if (hasPermission === false) {
    return (
      <div className="flex flex-col items-center gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
        <MicOff className="h-8 w-8 text-destructive" />
        <p className="text-sm text-center text-destructive">
          {!SpeechRecognition 
            ? 'Speech recognition is not supported in this browser. Please use Chrome or Edge.'
            : 'Microphone access is required for voice chat. Please enable it in your browser settings.'
          }
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      {/* Voice Visualizer */}
      <div 
        className={cn(
          "relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300",
          getStatusColor(),
          (isListening || isSpeaking) && "animate-pulse"
        )}
      >
        {isConnecting ? (
          <Loader2 className="h-10 w-10 text-white animate-spin" />
        ) : isSpeaking ? (
          <Volume2 className="h-10 w-10 text-white animate-pulse" />
        ) : isProcessing ? (
          <Loader2 className="h-10 w-10 text-white animate-spin" />
        ) : isListening ? (
          <Mic className="h-10 w-10 text-white" />
        ) : (
          <Mic className="h-10 w-10 text-muted-foreground" />
        )}
        
        {/* Pulse rings when active */}
        {(isListening || isSpeaking) && (
          <>
            <div className="absolute inset-0 rounded-full border-2 border-current opacity-20 animate-ping" />
            <div className="absolute inset-[-4px] rounded-full border border-current opacity-10 animate-pulse" />
          </>
        )}
      </div>

      {/* Status Text */}
      <p className="text-sm text-muted-foreground">{getStatusText()}</p>

      {/* Control Buttons */}
      <div className="flex gap-2">
        {!isActiveRef.current ? (
          <Button
            onClick={startConversation}
            disabled={isConnecting}
            className="gap-2"
            size="lg"
          >
            {isConnecting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Phone className="h-4 w-4" />
            )}
            Start Voice Chat
          </Button>
        ) : (
          <Button
            onClick={stopConversation}
            variant="destructive"
            className="gap-2"
            size="lg"
          >
            <PhoneOff className="h-4 w-4" />
            End Call
          </Button>
        )}
      </div>

      {/* Company branding */}
      <p className="text-xs text-muted-foreground mt-2">
        Voice powered by {companyName}
      </p>
    </div>
  );
};
