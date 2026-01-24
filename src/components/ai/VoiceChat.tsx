import React, { useCallback, useEffect, useRef, useState } from "react";
import { useConversation } from "@elevenlabs/react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  MessageSquare,
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  Send,
  Volume2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface VoiceChatProps {
  companyId: string;
  companyName: string;
  onTranscript?: (role: "user" | "assistant", text: string) => void;
  /** Enable text-only mode to test without using voice credits */
  testMode?: boolean;
}

type TranscriptMsg = { role: "user" | "assistant"; text: string };

export const VoiceChat: React.FC<VoiceChatProps> = ({
  companyId,
  companyName,
  onTranscript,
  testMode = false,
}) => {
  const { toast } = useToast();

  // Shared UI state
  const [isConnecting, setIsConnecting] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [isSendingText, setIsSendingText] = useState(false);

  // Voice mode state
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [agentId, setAgentId] = useState<string | null>(null);

  // Text mode state (uses our multi-agent backend)
  const [testSessionActive, setTestSessionActive] = useState(false);
  const [testIsLoading, setTestIsLoading] = useState(false);
  const [testAgent, setTestAgent] = useState<string>("triage");
  const [testHistory, setTestHistory] = useState<TranscriptMsg[]>([]);
  const testSessionIdRef = useRef<string>(crypto.randomUUID());

  // Avoid stale state inside useConversation callbacks
  const wasConnectedRef = useRef(false);
  const connectStartedAtRef = useRef<number | null>(null);
  const lastConnectMethodRef = useRef<
    "webrtc" | "ws_signed_url" | "ws_agent_id" | null
  >(null);
  const lastAuthRef = useRef<{ token?: string; signed_url?: string } | null>(
    null
  );
  const autoRetryUsedRef = useRef(false);

  // ElevenLabs conversation hook (VOICE mode only)
  const conversation = useConversation({
    onConnect: () => {
      wasConnectedRef.current = true;
      setIsConnecting(false);
      toast({
        title: "Voice Chat Started",
        description: "You can now speak with the AI assistant",
      });
    },
    onDisconnect: async () => {
      const connectedForMs = connectStartedAtRef.current
        ? Date.now() - connectStartedAtRef.current
        : null;

      setIsConnecting(false);

      const shouldAutoRetry =
        !testMode &&
        !autoRetryUsedRef.current &&
        lastConnectMethodRef.current === "webrtc" &&
        typeof connectedForMs === "number" &&
        connectedForMs < 2000 &&
        !!lastAuthRef.current?.signed_url;

      if (shouldAutoRetry) {
        autoRetryUsedRef.current = true;
        try {
          setIsConnecting(true);
          toast({
            title: "Reconnecting…",
            description: "Switching to a compatibility mode for your browser/network.",
          });
          await conversation.startSession({
            signedUrl: lastAuthRef.current!.signed_url!,
          });
          return;
        } catch (e) {
          console.error("Auto-retry via signed_url failed:", e);
          setIsConnecting(false);
        }
      }

      if (wasConnectedRef.current) {
        toast({
          title: "Voice Chat Ended",
          description: "The conversation has been disconnected",
        });
      }

      wasConnectedRef.current = false;
    },
    onMessage: (message) => {
      // Voice-mode transcript events
      const msg = message as unknown as Record<string, unknown>;

      if (msg.user_transcription_event) {
        const event = msg.user_transcription_event as Record<string, unknown>;
        const userText = event.user_transcript as string | undefined;
        if (userText) onTranscript?.("user", userText);
      } else if (msg.agent_response_event) {
        const event = msg.agent_response_event as Record<string, unknown>;
        const agentText = event.agent_response as string | undefined;
        if (agentText) onTranscript?.("assistant", agentText);
      }
    },
    onError: (error: unknown) => {
      console.error("ElevenLabs conversation error:", error);
      setIsConnecting(false);
      wasConnectedRef.current = false;

      const errorMessage =
        error && typeof error === "object" && "message" in error
          ? String((error as { message: unknown }).message)
          : "Connection to voice agent failed. Please try again.";

      toast({
        variant: "destructive",
        title: "Voice Chat Error",
        description: errorMessage,
      });
    },
  });

  // Check microphone permission (voice mode only)
  // Skip eager permission request in embed mode to prevent state churn
  useEffect(() => {
    if (testMode) {
      setHasPermission(true);
      return;
    }
    
    // Defer permission check in embed mode - only request when user initiates
    const isEmbed = typeof window !== 'undefined' && 
      new URLSearchParams(window.location.search).get('embed') === 'true';
    if (isEmbed) {
      // Don't eagerly request permission in embed mode; will request on startConversation
      return;
    }
    
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then(() => setHasPermission(true))
      .catch(() => setHasPermission(false));
  }, [testMode]);

  // Fetch agent ID for this company (voice mode only)
  useEffect(() => {
    const fetchAgentId = async () => {
      const { data, error } = await supabase
        .from("tenant_integrations")
        .select("elevenlabs_agent_id")
        .eq("company_id", companyId)
        .maybeSingle();

      if (!error && data?.elevenlabs_agent_id) {
        setAgentId(data.elevenlabs_agent_id);
      }
    };

    if (companyId) fetchAgentId();
  }, [companyId]);

  const startConversation = useCallback(async () => {
    setIsConnecting(true);

    // Text mode: start local session; use our multi-agent backend for responses
    if (testMode) {
      setTestSessionActive(true);
      setTestAgent("triage");
      setTestHistory([]);
      testSessionIdRef.current = crypto.randomUUID();
      setIsConnecting(false);
      toast({
        title: "Text Mode Started",
        description: "Testing booking logic without voice credits.",
      });
      return;
    }

    // Voice mode: connect to ElevenLabs agent
    autoRetryUsedRef.current = false;
    connectStartedAtRef.current = Date.now();

    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setHasPermission(true);

      if (!agentId) {
        throw new Error("No ElevenLabs agent configured for this company");
      }

      const { data, error } = await supabase.functions.invoke(
        "elevenlabs-conversation-token",
        {
          body: { company_id: companyId },
        }
      );

      if (error) throw new Error(error.message || "Failed to get token");

      // Handle voice locked error (subscription tier gating)
      if (data?.error === 'voice_locked') {
        toast({
          variant: 'destructive',
          title: 'Voice Upgrade Required',
          description: 'Voice features require the Aura Pro Command tier subscription. Upgrade to unlock.',
        });
        setIsConnecting(false);
        return;
      }

      lastAuthRef.current = {
        token: data?.token,
        signed_url: data?.signed_url,
      };

      if (data?.token) {
        lastConnectMethodRef.current = "webrtc";
        await conversation.startSession({
          conversationToken: data.token,
          connectionType: "webrtc",
        });
      } else if (data?.signed_url) {
        lastConnectMethodRef.current = "ws_signed_url";
        await conversation.startSession({ signedUrl: data.signed_url });
      } else {
        lastConnectMethodRef.current = "ws_agent_id";
        await conversation.startSession({
          agentId,
          connectionType: "websocket",
        });
      }
    } catch (e) {
      console.error("Failed to start conversation:", e);
      toast({
        variant: "destructive",
        title: "Connection Failed",
        description: e instanceof Error ? e.message : "Unable to start chat",
      });
    } finally {
      setIsConnecting(false);
    }
  }, [agentId, companyId, conversation, testMode, toast]);

  const stopConversation = useCallback(async () => {
    if (testMode) {
      setTestSessionActive(false);
      setTestIsLoading(false);
      toast({
        title: "Text Mode Ended",
        description: "The testing session has ended.",
      });
      return;
    }

    try {
      wasConnectedRef.current = false;
      await conversation.endSession();
      toast({
        title: "Voice Chat Ended",
        description: "The conversation has been disconnected",
      });
    } catch (e) {
      console.error("Error ending session:", e);
    }
  }, [conversation, testMode, toast]);

  const invokeMultiAgent = useCallback(
    async (userMessage: string) => {
      const conversationHistory = testHistory.map((m) => ({
        role: m.role,
        content: m.text,
      }));

      const { data, error } = await supabase.functions.invoke("ai-agent-chat", {
        body: {
          agentType: testAgent,
          message: userMessage,
          companyId,
          sessionId: testSessionIdRef.current,
          conversationHistory,
        },
      });

      if (error) throw new Error(error.message);

      const newAgent = (data?.handoff_to || data?.agent || testAgent) as string;
      const assistantText = (data?.response || data?.message || "").toString();

      return { data, newAgent, assistantText };
    },
    [companyId, testAgent, testHistory]
  );

  const invokeMultiAgentHandoffFollowup = useCallback(
    async (userMessage: string, fromAgent: string, toAgent: string) => {
      const conversationHistory = [...testHistory, { role: "user", text: userMessage }].map(
        (m) => ({ role: m.role, content: m.text })
      );

      const { data, error } = await supabase.functions.invoke("ai-agent-chat", {
        body: {
          agentType: toAgent,
          message: userMessage,
          companyId,
          sessionId: testSessionIdRef.current,
          isHandoff: true,
          handoffFrom: fromAgent,
          conversationHistory,
        },
      });

      if (error) throw new Error(error.message);

      const followUpText = (data?.response || data?.message || "").toString();
      return { followUpText };
    },
    [companyId, testHistory]
  );

  const sendTextMessage = useCallback(async () => {
    const userText = textInput.trim();
    if (!userText) return;

    // Text mode: our multi-agent backend (so appointment options/tools work)
    if (testMode) {
      if (!testSessionActive || testIsLoading) return;

      setTextInput("");
      setIsSendingText(true);
      setTestIsLoading(true);

      try {
        onTranscript?.("user", userText);
        setTestHistory((prev) => [...prev, { role: "user", text: userText }]);

        const { data, newAgent, assistantText } = await invokeMultiAgent(userText);

        if (newAgent && newAgent !== testAgent) setTestAgent(newAgent);

        if (assistantText) {
          onTranscript?.("assistant", assistantText);
          setTestHistory((prev) => [...prev, { role: "assistant", text: assistantText }]);
        }

        // Follow-up call on handoff (mirrors useMultiAgentChat behavior)
        if (data?.handoff_to) {
          const { followUpText } = await invokeMultiAgentHandoffFollowup(
            userText,
            testAgent,
            data.handoff_to
          );
          if (followUpText) {
            onTranscript?.("assistant", followUpText);
            setTestHistory((prev) => [...prev, { role: "assistant", text: followUpText }]);
          }
        }
      } catch (e) {
        console.error("Text mode chat error:", e);
        toast({
          variant: "destructive",
          title: "Message Failed",
          description: e instanceof Error ? e.message : "Could not send message",
        });
      } finally {
        setIsSendingText(false);
        setTestIsLoading(false);
      }

      return;
    }

    // Voice mode: we don't send typed messages
    toast({
      title: "Voice mode",
      description: "Use your microphone to talk (or switch to Text Mode to type).",
    });
  }, [invokeMultiAgent, invokeMultiAgentHandoffFollowup, onTranscript, testAgent, testHistory, testIsLoading, testMode, testSessionActive, textInput, toast]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendTextMessage();
    }
  };

  const isConnected = testMode ? testSessionActive : conversation.status === "connected";
  const isSpeaking = !testMode && isConnected && conversation.isSpeaking;

  const getStatusText = () => {
    if (isConnecting) return "Connecting...";
    if (testMode && isConnected) return testIsLoading ? "Thinking…" : "Text mode active - type to chat";
    if (isSpeaking) return "AI is speaking...";
    if (isConnected) return "Listening...";
    return testMode ? "Click to start text mode" : "Click to start voice chat";
  };

  const getStatusColor = () => {
    if (testMode && isConnected) return "bg-blue-500";
    if (isSpeaking) return "bg-secondary";
    if (isConnected) return "bg-green-500";
    if (isConnecting) return "bg-amber-500";
    return "bg-muted";
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

  // Only require ElevenLabs agent in voice mode
  if (!testMode && !agentId) {
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
      {testMode && (
        <Badge variant="secondary" className="gap-1 bg-secondary/10 text-secondary border-secondary/20">
          <MessageSquare className="h-3 w-3" />
          Text Mode (No Voice Credits)
        </Badge>
      )}

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

        {(isConnected || isSpeaking) && (
          <>
            <div className="absolute inset-0 rounded-full border-2 border-current opacity-20 animate-ping" />
            <div className="absolute inset-[-4px] rounded-full border border-current opacity-10 animate-pulse" />
          </>
        )}
      </div>

      <p className="text-sm text-muted-foreground">{getStatusText()}</p>

      {testMode && isConnected && (
        <div className="flex gap-2 w-full max-w-md">
          <Input
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={testIsLoading ? "Thinking…" : "Type your message…"}
            disabled={isSendingText || testIsLoading}
            className="flex-1"
          />
          <Button
            onClick={sendTextMessage}
            disabled={!textInput.trim() || isSendingText || testIsLoading}
            size="icon"
          >
            {isSendingText || testIsLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      )}

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

      <p className="text-xs text-muted-foreground mt-2">
        {testMode ? `Testing (${testAgent})` : "Voice powered by"} {companyName}
      </p>
    </div>
  );
};
