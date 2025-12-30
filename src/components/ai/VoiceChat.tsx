import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useConversation } from '@elevenlabs/react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Mic, MicOff, Phone, PhoneOff, Loader2, Volume2, MessageSquare, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface VoiceChatProps {
  companyId: string;
  companyName: string;
  onTranscript?: (role: 'user' | 'assistant', text: string) => void;
  /** Enable text-only mode to test without using voice credits */
  testMode?: boolean;
}

export const VoiceChat: React.FC<VoiceChatProps> = ({ 
  companyId, 
  companyName,
  onTranscript,
  testMode = false
}) => {
  const { toast } = useToast();
  const [isConnecting, setIsConnecting] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [agentId, setAgentId] = useState<string | null>(null);
  const [textInput, setTextInput] = useState('');
  const [isSendingText, setIsSendingText] = useState(false);

  // Avoid stale state inside useConversation callbacks
  const wasConnectedRef = useRef(false);
  const connectStartedAtRef = useRef<number | null>(null);
  const lastConnectMethodRef = useRef<'webrtc' | 'ws_signed_url' | 'ws_agent_id' | 'text_only' | null>(null);
  const lastAuthRef = useRef<{ token?: string; signed_url?: string } | null>(null);
  const autoRetryUsedRef = useRef(false);

  // ElevenLabs conversation hook - textOnly mode skips audio processing
  const conversation = useConversation({
    ...(testMode && { textOnly: true }),
    onConnect: () => {
      console.log('Connected to ElevenLabs agent', {
        method: lastConnectMethodRef.current,
        testMode,
      });
      wasConnectedRef.current = true;
      setIsConnecting(false);
      toast({
        title: testMode ? "Text Mode Started" : "Voice Chat Started",
        description: testMode 
          ? "Testing agent without using voice credits" 
          : "You can now speak with the AI assistant",
      });
    },
    onDisconnect: async () => {
      const connectedForMs = connectStartedAtRef.current ? Date.now() - connectStartedAtRef.current : null;
      console.log('Disconnected from ElevenLabs agent', {
        method: lastConnectMethodRef.current,
        connectedForMs,
        testMode,
      });

      setIsConnecting(false);

      // If we disconnect immediately after connecting, automatically fall back once.
      // Skip auto-retry in text mode as it's already a fallback
      const shouldAutoRetry =
        !testMode &&
        !autoRetryUsedRef.current &&
        lastConnectMethodRef.current === 'webrtc' &&
        typeof connectedForMs === 'number' &&
        connectedForMs < 2000 &&
        !!lastAuthRef.current?.signed_url;

      if (shouldAutoRetry) {
        autoRetryUsedRef.current = true;
        try {
          setIsConnecting(true);
          toast({
            title: 'Reconnecting…',
            description: 'Switching to a compatibility mode for your browser/network.',
          });
          await conversation.startSession({ signedUrl: lastAuthRef.current!.signed_url! });
          return;
        } catch (e) {
          console.error('Auto-retry via signed_url failed:', e);
          setIsConnecting(false);
        }
      }

      // Only show toast if we were previously connected
      if (wasConnectedRef.current) {
        toast({
          title: testMode ? "Text Mode Ended" : "Voice Chat Ended",
          description: "The conversation has been disconnected",
        });
      }

      wasConnectedRef.current = false;
    },
    onMessage: (message) => {
      console.log('Agent message:', message);
      // Handle transcripts based on message structure
      const msg = message as unknown as Record<string, unknown>;
      
      // Handle text mode messages (different format: { source, role, message })
      if (msg.source === 'ai' && typeof msg.message === 'string') {
        onTranscript?.('assistant', msg.message);
      } else if (msg.source === 'user' && typeof msg.message === 'string') {
        onTranscript?.('user', msg.message);
      }
      // Handle voice mode events (user_transcription_event, agent_response_event)
      else if (msg.user_transcription_event) {
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
        title: testMode ? "Text Mode Error" : "Voice Chat Error",
        description: errorMessage,
      });
    },
  });

  // Check microphone permission (skip in text mode)
  useEffect(() => {
    if (testMode) {
      setHasPermission(true); // Not needed for text mode
      return;
    }
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(() => setHasPermission(true))
      .catch(() => setHasPermission(false));
  }, [testMode]);

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

    // Reset attempt state
    autoRetryUsedRef.current = false;
    connectStartedAtRef.current = Date.now();

    try {
      // Request microphone permission only in voice mode
      if (!testMode) {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        setHasPermission(true);
      }

      if (!agentId) {
        throw new Error('No ElevenLabs agent configured for this company');
      }

      const { data, error } = await supabase.functions.invoke('elevenlabs-conversation-token', {
        body: { company_id: companyId },
      });

      if (error) {
        throw new Error(error.message || 'Failed to get conversation token');
      }

      // Cache auth so we can auto-fallback if needed
      lastAuthRef.current = {
        token: data?.token,
        signed_url: data?.signed_url,
      };

      console.log('Got ElevenLabs auth response:', {
        hasToken: Boolean(data?.token),
        hasSignedUrl: Boolean(data?.signed_url),
        testMode,
      });

      // In text mode, prefer signed URL (simpler) or direct agent ID
      if (testMode) {
        lastConnectMethodRef.current = 'text_only';
        if (data?.signed_url) {
          await conversation.startSession({
            signedUrl: data.signed_url,
          });
        } else {
          await conversation.startSession({
            agentId: agentId,
            connectionType: 'websocket',
          });
        }
      } else if (data?.token) {
        lastConnectMethodRef.current = 'webrtc';
        await conversation.startSession({
          conversationToken: data.token,
          connectionType: 'webrtc',
        });
      } else if (data?.signed_url) {
        lastConnectMethodRef.current = 'ws_signed_url';
        await conversation.startSession({
          signedUrl: data.signed_url,
        });
      } else {
        lastConnectMethodRef.current = 'ws_agent_id';
        await conversation.startSession({
          agentId: agentId,
          connectionType: 'websocket',
        });
      }
    } catch (error) {
      console.error('Failed to start conversation:', error);
      toast({
        variant: "destructive",
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Unable to start chat",
      });
    } finally {
      setIsConnecting(false);
    }
  }, [companyId, agentId, conversation, toast, testMode]);

  // Stop conversation
  const stopConversation = useCallback(async () => {
    try {
      wasConnectedRef.current = false; // Prevent duplicate toast from onDisconnect
      await conversation.endSession();
      toast({
        title: testMode ? "Text Mode Ended" : "Voice Chat Ended",
        description: "The conversation has been disconnected",
      });
    } catch (e) {
      console.error('Error ending session:', e);
    }
  }, [conversation, toast, testMode]);

  // Send text message (for text mode)
  const sendTextMessage = useCallback(async () => {
    if (!textInput.trim() || !conversation.status) return;
    
    setIsSendingText(true);
    try {
      // Log user message
      onTranscript?.('user', textInput.trim());
      
      // Send to agent
      conversation.sendUserMessage(textInput.trim());
      setTextInput('');
    } catch (error) {
      console.error('Failed to send message:', error);
      toast({
        variant: "destructive",
        title: "Send Failed",
        description: "Could not send message to agent",
      });
    } finally {
      setIsSendingText(false);
    }
  }, [textInput, conversation, onTranscript, toast]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendTextMessage();
    }
  };

  const isConnected = conversation.status === 'connected';
  const isSpeaking = isConnected && conversation.isSpeaking;

  // Visual feedback based on state
  const getStatusText = () => {
    if (isConnecting) return 'Connecting...';
    if (testMode && isConnected) return 'Text mode active - type to chat';
    if (isSpeaking) return 'AI is speaking...';
    if (isConnected) return 'Listening...';
    return testMode ? 'Click to start text mode' : 'Click to start voice chat';
  };

  const getStatusColor = () => {
    if (testMode && isConnected) return 'bg-blue-500';
    if (isSpeaking) return 'bg-secondary';
    if (isConnected) return 'bg-green-500';
    if (isConnecting) return 'bg-amber-500';
    return 'bg-muted';
  };

  if (!testMode && hasPermission === false) {
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
      {/* Test Mode Badge */}
      {testMode && (
        <Badge variant="secondary" className="gap-1 bg-blue-500/10 text-blue-600 border-blue-500/20">
          <MessageSquare className="h-3 w-3" />
          Text Mode (No Voice Credits)
        </Badge>
      )}

      {/* Voice/Text Visualizer */}
      <div 
        className={cn(
          "relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300",
          getStatusColor(),
          (isConnected || isSpeaking) && "animate-pulse"
        )}
      >
        {isConnecting ? (
          <Loader2 className="h-10 w-10 text-white animate-spin" />
        ) : testMode && isConnected ? (
          <MessageSquare className="h-10 w-10 text-white" />
        ) : isSpeaking ? (
          <Volume2 className="h-10 w-10 text-white animate-pulse" />
        ) : isConnected ? (
          <Mic className="h-10 w-10 text-white" />
        ) : testMode ? (
          <MessageSquare className="h-10 w-10 text-muted-foreground" />
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

      {/* Text Input (for text mode when connected) */}
      {testMode && isConnected && (
        <div className="flex gap-2 w-full max-w-md">
          <Input
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            disabled={isSendingText}
            className="flex-1"
          />
          <Button
            onClick={sendTextMessage}
            disabled={!textInput.trim() || isSendingText}
            size="icon"
          >
            {isSendingText ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      )}

      {/* Control Buttons */}
      <div className="flex gap-2">
        {!isConnected ? (
          <Button
            onClick={startConversation}
            disabled={isConnecting}
            className="gap-2"
            size="lg"
            variant={testMode ? "secondary" : "default"}
          >
            {isConnecting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : testMode ? (
              <MessageSquare className="h-4 w-4" />
            ) : (
              <Phone className="h-4 w-4" />
            )}
            {testMode ? "Start Text Mode" : "Start Voice Chat"}
          </Button>
        ) : (
          <Button
            onClick={stopConversation}
            variant="destructive"
            className="gap-2"
            size="lg"
          >
            <PhoneOff className="h-4 w-4" />
            {testMode ? "End Session" : "End Call"}
          </Button>
        )}
      </div>

      {/* Company branding */}
      <p className="text-xs text-muted-foreground mt-2">
        {testMode ? "Testing" : "Voice powered by"} {companyName}
      </p>
    </div>
  );
};