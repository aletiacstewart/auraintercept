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
  onTranscript?: (role: 'user' | 'assistant', text: string) => void;
}

export const VoiceChat: React.FC<VoiceChatProps> = ({ 
  companyId, 
  companyName,
  onTranscript 
}) => {
  const { toast } = useToast();
  const [isConnecting, setIsConnecting] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [agentId, setAgentId] = useState<string | null>(null);

  // Avoid stale state inside useConversation callbacks
  const wasConnectedRef = useRef(false);

  // ElevenLabs conversation hook
  const conversation = useConversation({
    onConnect: () => {
      console.log('Connected to ElevenLabs agent');
      wasConnectedRef.current = true;
      setIsConnecting(false);
      toast({
        title: "Voice Chat Started",
        description: "You can now speak with the AI assistant",
      });
    },
    onDisconnect: () => {
      console.log('Disconnected from ElevenLabs agent');
      setIsConnecting(false);

      // Only show toast if we were previously connected
      if (wasConnectedRef.current) {
        toast({
          title: "Voice Chat Ended",
          description: "The conversation has been disconnected",
        });
      }

      wasConnectedRef.current = false;
    },
    onMessage: (message) => {
      console.log('Agent message:', message);
      // Handle transcripts based on message structure
      const msg = message as unknown as Record<string, unknown>;
      
      if (msg.user_transcription_event) {
        const event = msg.user_transcription_event as Record<string, unknown>;
        const userText = event.user_transcript as string | undefined;
        if (userText) {
          onTranscript?.('user', userText);
        }
      } else if (msg.agent_response_event) {
        const event = msg.agent_response_event as Record<string, unknown>;
        const agentText = event.agent_response as string | undefined;
        if (agentText) {
          onTranscript?.('assistant', agentText);
        }
      }
    },
    onError: (error: unknown) => {
      console.error('ElevenLabs conversation error:', error);
      setIsConnecting(false);
      wasConnectedRef.current = false;

      const errorMessage =
        error && typeof error === 'object' && 'message' in error
          ? String((error as { message: unknown }).message)
          : "Connection to voice agent failed. Please try again.";

      toast({
        variant: "destructive",
        title: "Voice Chat Error",
        description: errorMessage,
      });
    },
  });

  // Check microphone permission
  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(() => setHasPermission(true))
      .catch(() => setHasPermission(false));
  }, []);

  // Fetch agent ID for this company
  useEffect(() => {
    const fetchAgentId = async () => {
      const { data, error } = await supabase
        .from('tenant_integrations')
        .select('elevenlabs_agent_id')
        .eq('company_id', companyId)
        .maybeSingle();

      if (!error && data?.elevenlabs_agent_id) {
        setAgentId(data.elevenlabs_agent_id);
        console.log('Found ElevenLabs agent ID:', data.elevenlabs_agent_id);
      }
    };
    
    if (companyId) {
      fetchAgentId();
    }
  }, [companyId]);

  // Start conversation
  const startConversation = useCallback(async () => {
    setIsConnecting(true);

    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setHasPermission(true);

      if (!agentId) {
        throw new Error('No ElevenLabs agent configured for this company');
      }

      // Get signed URL from edge function
      const { data, error } = await supabase.functions.invoke('elevenlabs-conversation-token', {
        body: { company_id: companyId }
      });

      if (error) {
        throw new Error(error.message || 'Failed to get conversation token');
      }

      console.log('Got ElevenLabs token response:', data);

      if (data?.token) {
        // WebRTC is typically more stable/low-latency than websocket
        await conversation.startSession({
          conversationToken: data.token,
          connectionType: 'webrtc',
        });
      } else if (data?.signed_url) {
        // Fallback: Connect using signed URL (WebSocket)
        await conversation.startSession({
          signedUrl: data.signed_url,
        });
      } else {
        // Fallback: Connect directly with agent ID (public agent)
        await conversation.startSession({
          agentId: agentId,
          connectionType: 'websocket',
        });
      }

    } catch (error) {
      console.error('Failed to start voice conversation:', error);
      toast({
        variant: "destructive",
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Unable to start voice chat",
      });
    } finally {
      setIsConnecting(false);
    }
  }, [companyId, agentId, conversation, toast]);

  // Stop conversation
  const stopConversation = useCallback(async () => {
    try {
      wasConnectedRef.current = false; // Prevent duplicate toast from onDisconnect
      await conversation.endSession();
      toast({
        title: "Voice Chat Ended",
        description: "The conversation has been disconnected",
      });
    } catch (e) {
      console.error('Error ending session:', e);
    }
  }, [conversation, toast]);

  const isConnected = conversation.status === 'connected';
  const isSpeaking = isConnected && conversation.isSpeaking;

  // Visual feedback based on state
  const getStatusText = () => {
    if (isConnecting) return 'Connecting...';
    if (isSpeaking) return 'AI is speaking...';
    if (isConnected) return 'Listening...';
    return 'Click to start voice chat';
  };

  const getStatusColor = () => {
    if (isSpeaking) return 'bg-secondary';
    if (isConnected) return 'bg-green-500';
    if (isConnecting) return 'bg-amber-500';
    return 'bg-muted';
  };

  if (hasPermission === false) {
    return (
      <div className="flex flex-col items-center gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
        <MicOff className="h-8 w-8 text-destructive" />
        <p className="text-sm text-center text-destructive">
          Microphone access is required for voice chat. Please enable it in your browser settings.
        </p>
      </div>
    );
  }

  if (!agentId) {
    return (
      <div className="flex flex-col items-center gap-3 p-4 rounded-lg bg-muted/50 border border-border">
        <Mic className="h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-center text-muted-foreground">
          Voice agent not configured. Please add an ElevenLabs Agent ID in the Integrations settings.
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
          (isConnected || isSpeaking) && "animate-pulse"
        )}
      >
        {isConnecting ? (
          <Loader2 className="h-10 w-10 text-white animate-spin" />
        ) : isSpeaking ? (
          <Volume2 className="h-10 w-10 text-white animate-pulse" />
        ) : isConnected ? (
          <Mic className="h-10 w-10 text-white" />
        ) : (
          <Mic className="h-10 w-10 text-muted-foreground" />
        )}
        
        {/* Pulse rings when active */}
        {(isConnected || isSpeaking) && (
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