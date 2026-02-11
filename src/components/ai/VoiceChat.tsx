import React, { useCallback, useEffect, useRef, useState } from "react";
import { Conversation } from "@elevenlabs/client";
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

  // Direct Conversation instance (bypasses useConversation hook to avoid override injection)
  const conversationRef = useRef<any>(null);
  const [convStatus, setConvStatus] = useState<string>("disconnected");
  const [convIsSpeaking, setConvIsSpeaking] = useState(false);

  // Avoid stale state inside callbacks
  const wasConnectedRef = useRef(false);
  const connectStartedAtRef = useRef<number | null>(null);
  const lastConnectMethodRef = useRef<
    "webrtc" | "ws_signed_url" | "ws_agent_id" | null
  >(null);
  const lastAuthRef = useRef<{ token?: string; signed_url?: string } | null>(
    null
  );
  const autoRetryUsedRef = useRef(false);

  // Debug state
  const [debugInfo, setDebugInfo] = useState<{
    method: string | null;
    audioState: string | null;
    agentSpeaking: boolean;
  }>({ method: null, audioState: null, agentSpeaking: false });

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (conversationRef.current) {
        try { conversationRef.current.endSession(); } catch {}
        conversationRef.current = null;
      }
    };
  }, []);

  // Build callbacks for Conversation.startSession (no useConversation hook)
  const buildSessionCallbacks = useCallback(() => ({
    onConnect: () => {
      console.log("[VoiceChat] ✅ onConnect fired — connection established");
      wasConnectedRef.current = true;
      setIsConnecting(false);
      setConvStatus("connected");
      setDebugInfo((prev) => ({ ...prev, method: lastConnectMethodRef.current }));

      setTimeout(() => {
        const audioElements = document.querySelectorAll("audio");
        audioElements.forEach((el) => {
          if (el.paused) {
            console.log("[VoiceChat] Found paused <audio>, forcing play...");
            el.play().catch((e) => console.warn("[VoiceChat] audio.play() blocked:", e));
          }
        });
      }, 200);

      toast({
        title: "Talk to Aura Connected",
        description: "You can now speak with the AI assistant",
      });
    },
    onDisconnect: () => {
      console.log("[VoiceChat] onDisconnect fired");
      setConvStatus("disconnected");
      setConvIsSpeaking(false);
      conversationRef.current = null;
      setIsConnecting(false);

      if (wasConnectedRef.current) {
        toast({
          title: "Talk to Aura Ended",
          description: "The voice conversation has been disconnected",
        });
      }
      wasConnectedRef.current = false;
      setDebugInfo({ method: null, audioState: null, agentSpeaking: false });
    },
    onMessage: (message: any) => {
      console.log("[VoiceChat] onMessage:", message?.type || "unknown");

      if (message?.user_transcription_event) {
        const userText = message.user_transcription_event.user_transcript;
        if (userText) {
          console.log("[VoiceChat] User transcript:", userText);
          onTranscript?.("user", userText);
        }
      } else if (message?.agent_response_event) {
        const agentText = message.agent_response_event.agent_response;
        if (agentText) {
          console.log("[VoiceChat] Agent response:", agentText);
          onTranscript?.("assistant", agentText);
        }
      }
    },
    onModeChange: ({ mode }: { mode: string }) => {
      console.log("[VoiceChat] mode changed:", mode);
      setConvIsSpeaking(mode === "speaking");
      setDebugInfo((prev) => ({ ...prev, agentSpeaking: mode === "speaking" }));
    },
    onStatusChange: ({ status }: { status: string }) => {
      console.log("[VoiceChat] 📡 status changed:", status);
      setConvStatus(status);
    },
    onDebug: (info: unknown) => {
      console.log("[VoiceChat] 🔍 onDebug:", info);
    },
    onError: (error: unknown) => {
      console.error("[VoiceChat] ❌ onError:", error);
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
  }), [onTranscript, toast]);
  // Connection timeout: warn if agent doesn't speak within 10s
  const connectionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (convStatus === "connected") {
      connectionTimeoutRef.current = setTimeout(() => {
        if (!convIsSpeaking) {
          console.warn("[VoiceChat] ⚠️ Agent has not spoken within 10s of connecting");
          toast({
            variant: "destructive",
            title: "Agent Not Responding",
            description: "The voice agent connected but hasn't spoken. Check agent configuration or try again.",
          });
        }
      }, 10000);
    } else {
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
        connectionTimeoutRef.current = null;
      }
    }
    return () => {
      if (connectionTimeoutRef.current) clearTimeout(connectionTimeoutRef.current);
    };
  }, [convStatus, convIsSpeaking, toast]);

  // Clear timeout once agent starts speaking
  useEffect(() => {
    if (convIsSpeaking && connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
      connectionTimeoutRef.current = null;
    }
  }, [convIsSpeaking]);

  // Ensure SDK audio elements stay unmuted and playing
  useEffect(() => {
    if (convStatus !== "connected") return;

    try {
      conversationRef.current?.setVolume?.({ volume: 1 });
    } catch (e) {
      console.warn("[VoiceChat] setVolume failed:", e);
    }

    const interval = setInterval(() => {
      const audioElements = document.querySelectorAll("audio");
      let found = 0;
      audioElements.forEach((el) => {
        const hasSource = !!(el.srcObject || el.src);
        if (hasSource) found++;
        if (el.paused && hasSource) {
          console.log("[VoiceChat] Found paused audio element, forcing play...");
          el.play().catch(() => {});
        }
      });
      if (found === 0) {
        console.log("[VoiceChat] No audio elements with source found in DOM");
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [convStatus]);

  // Don't eagerly request microphone — request on user gesture in startConversation
  useEffect(() => {
    if (testMode) {
      setHasPermission(true);
    }
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

  // Helper to start a session using Conversation directly (no override injection)
  const startDirectSession = useCallback(async (sessionConfig: Record<string, any>) => {
    const callbacks = buildSessionCallbacks();
    console.log("[VoiceChat] ▶ Starting direct session (NO conversation_config_override)...", sessionConfig);
    const conv = await Conversation.startSession({
      ...sessionConfig,
      ...callbacks,
    } as any);
    conversationRef.current = conv;
    return conv;
  }, [buildSessionCallbacks]);

  const startConversation = useCallback(async () => {
    setIsConnecting(true);

    // Pre-create Audio element synchronously during user gesture for autoplay compliance
    const preloadAudio = new Audio();
    preloadAudio.preload = "auto";

    // Unlock audio playback synchronously on user gesture
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      ctx.resume();
      const buffer = ctx.createBuffer(1, 1, 22050);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start();
      console.log("[VoiceChat] AudioContext unlocked, state:", ctx.state);
      setDebugInfo((prev) => ({ ...prev, audioState: ctx.state }));
      ctx.onstatechange = () => {
        console.log("[VoiceChat] AudioContext state changed to:", ctx.state);
        setDebugInfo((prev) => ({ ...prev, audioState: ctx.state }));
      };
    } catch (e) {
      console.warn("[VoiceChat] AudioContext unlock failed:", e);
    }

    // Text mode: start local session
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

    // Voice mode: connect to ElevenLabs agent using Conversation directly
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
        { body: { company_id: companyId } }
      );

      if (error) throw new Error(error.message || "Failed to get token");

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

      const isIframe = window.self !== window.top;
      console.log("[VoiceChat] Connection strategy: prefer WebRTC, fallback WebSocket", {
        isIframe,
        hasToken: !!data?.token,
        hasSignedUrl: !!data?.signed_url,
        agentId,
      });

      if (data?.token) {
        lastConnectMethodRef.current = "webrtc";
        await startDirectSession({
          conversationToken: data.token,
          connectionType: "webrtc",
        });
      } else if (data?.signed_url) {
        lastConnectMethodRef.current = "ws_signed_url";
        await startDirectSession({
          signedUrl: data.signed_url,
        });
      } else if (agentId) {
        lastConnectMethodRef.current = "ws_agent_id";
        await startDirectSession({
          agentId,
          connectionType: "websocket",
        });
      } else {
        throw new Error("No connection method available — missing token, signed_url, and agentId");
      }
    } catch (e) {
      console.error("Failed to start conversation:", e);
      setIsConnecting(false);
      toast({
        variant: "destructive",
        title: "Connection Failed",
        description: e instanceof Error ? e.message : "Unable to start chat",
      });
    }
  }, [agentId, companyId, startDirectSession, testMode, toast]);

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
      if (conversationRef.current) {
        await conversationRef.current.endSession();
        conversationRef.current = null;
      }
      toast({
        title: "Talk to Aura Ended",
        description: "The conversation has been disconnected",
      });
    } catch (e) {
      console.error("Error ending session:", e);
    }
  }, [testMode, toast]);

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

  const isConnected = testMode ? testSessionActive : convStatus === "connected";
  const isSpeaking = !testMode && isConnected && convIsSpeaking;

  // Track isSpeaking changes for debug
  useEffect(() => {
    if (!testMode && isConnected) {
      console.log("[VoiceChat] isSpeaking changed:", convIsSpeaking);
      setDebugInfo((prev) => ({ ...prev, agentSpeaking: convIsSpeaking }));
    }
  }, [convIsSpeaking, isConnected, testMode]);

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
          Microphone access was denied. Please enable it in your browser settings.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setHasPermission(null);
            navigator.mediaDevices
              .getUserMedia({ audio: true })
              .then(() => setHasPermission(true))
              .catch(() => setHasPermission(false));
          }}
        >
          Retry Microphone Access
        </Button>
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
      {/* Debug badge — shows connection info when active */}
      {!testMode && isConnected && debugInfo.method && (
        <Badge variant="outline" className="gap-1 text-xs font-mono opacity-60">
          {debugInfo.method} | audio: {debugInfo.audioState || "?"} | speaking: {debugInfo.agentSpeaking ? "yes" : "no"}
        </Badge>
      )}
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
