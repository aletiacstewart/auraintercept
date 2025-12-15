import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useConversation } from '@elevenlabs/react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Mic, MicOff, Phone, PhoneOff, Loader2, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VoiceChatProps {
  companyId: string;
  companyName: string;
  agentId?: string;
  onTranscript?: (role: 'user' | 'assistant', text: string) => void;
}

export const VoiceChat: React.FC<VoiceChatProps> = ({ 
  companyId, 
  companyName,
  agentId,
  onTranscript 
}) => {
  const { toast } = useToast();
  const [isConnecting, setIsConnecting] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const visualizerRef = useRef<HTMLDivElement>(null);

  const conversation = useConversation({
    onConnect: () => {
      console.log('Connected to ElevenLabs agent');
      toast({
        title: "Voice Connected",
        description: "You can now speak with the AI assistant",
      });
    },
    onDisconnect: () => {
      console.log('Disconnected from ElevenLabs agent');
    },
    onMessage: (message: unknown) => {
      console.log('Voice message:', message);
      const msg = message as Record<string, unknown>;
      
      // Handle transcriptions
      if (msg.type === 'user_transcript' && onTranscript) {
        const event = msg.user_transcription_event as Record<string, string> | undefined;
        const text = event?.user_transcript;
        if (text) onTranscript('user', text);
      }
      if (msg.type === 'agent_response' && onTranscript) {
        const event = msg.agent_response_event as Record<string, string> | undefined;
        const text = event?.agent_response;
        if (text) onTranscript('assistant', text);
      }
    },
    onError: (error) => {
      console.error('Voice error:', error);
      toast({
        variant: "destructive",
        title: "Voice Error",
        description: "Connection failed. Please try again.",
      });
    },
  });

  // Check microphone permission on mount
  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(() => setHasPermission(true))
      .catch(() => setHasPermission(false));
  }, []);

  const startConversation = useCallback(async () => {
    setIsConnecting(true);
    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setHasPermission(true);

      // Get credentials from edge function
      const { data, error } = await supabase.functions.invoke(
        'elevenlabs-conversation-token',
        {
          body: { company_id: companyId, agent_id: agentId }
        }
      );

      if (error) {
        throw new Error(error.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      if (data.signed_url) {
        // Use signed URL for authenticated agent
        await conversation.startSession({
          signedUrl: data.signed_url,
        });
      } else {
        // For testing without a pre-configured agent, show setup message
        toast({
          variant: "destructive",
          title: "Agent Not Configured",
          description: "Please configure an ElevenLabs Conversational AI agent in your ElevenLabs dashboard and add the agent ID in settings.",
        });
        setIsConnecting(false);
        return;
      }
    } catch (error) {
      console.error('Failed to start voice conversation:', error);
      toast({
        variant: "destructive",
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Unable to connect to voice assistant",
      });
    } finally {
      setIsConnecting(false);
    }
  }, [conversation, companyId, agentId, toast]);

  const stopConversation = useCallback(async () => {
    await conversation.endSession();
  }, [conversation]);

  const isConnected = conversation.status === 'connected';
  const isSpeaking = conversation.isSpeaking;

  // Visual feedback based on state
  const getStatusText = () => {
    if (isConnecting) return 'Connecting...';
    if (isConnected && isSpeaking) return 'AI is speaking...';
    if (isConnected) return 'Listening...';
    return 'Click to start voice chat';
  };

  const getStatusColor = () => {
    if (isConnected && isSpeaking) return 'bg-secondary';
    if (isConnected) return 'bg-green-500';
    return 'bg-muted';
  };

  if (hasPermission === false) {
    return (
      <div className="flex flex-col items-center gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
        <MicOff className="h-8 w-8 text-destructive" />
        <p className="text-sm text-center text-destructive">
          Microphone access is required for voice chat.
          <br />
          Please enable it in your browser settings.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      {/* Voice Visualizer */}
      <div 
        ref={visualizerRef}
        className={cn(
          "relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300",
          getStatusColor(),
          isConnected && "animate-pulse"
        )}
      >
        {isConnecting ? (
          <Loader2 className="h-10 w-10 text-white animate-spin" />
        ) : isConnected ? (
          isSpeaking ? (
            <Volume2 className="h-10 w-10 text-white animate-pulse" />
          ) : (
            <Mic className="h-10 w-10 text-white" />
          )
        ) : (
          <Mic className="h-10 w-10 text-muted-foreground" />
        )}
        
        {/* Pulse rings when connected */}
        {isConnected && (
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
        {!isConnected ? (
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
