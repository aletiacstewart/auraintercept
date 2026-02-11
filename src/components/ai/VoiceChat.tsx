import React, { useCallback, useRef, useState } from "react";
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

  const [isConnecting, setIsConnecting] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [isSendingText, setIsSendingText] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [agentId, setAgentId] = useState<string | null>(null);

  // Text mode state
  const [testSessionActive, setTestSessionActive] = useState(false);
  const [testIsLoading, setTestIsLoading] = useState(false);
  const [testAgent, setTestAgent] = useState<string>("triage");
  const [testHistory, setTestHistory] = useState<TranscriptMsg[]>([]);
  const testSessionIdRef = useRef<string>(crypto.randomUUID());

  // Voice hook — minimal callbacks, no overrides
  const conversation = useConversation({
    onConnect: () => {
      console.log("[VoiceChat] ✅ Connected");
      setIsConnecting(false);
      toast({
        title: "Talk to Aura Connected",
        description: "You can now speak with the AI assistant",
      });
    },
    onDisconnect: () => {
      console.log("[VoiceChat] Disconnected");
      setIsConnecting(false);
      toast({
        title: "Talk to Aura Ended",
        description: "The voice conversation has been disconnected",
      });
    },
    onMessage: (message: any) => {
      if (message?.user_transcription_event) {
        const text = message.user_transcription_event.user_transcript;
        if (text) onTranscript?.("user", text);
      } else if (message?.agent_response_event) {
        const text = message.agent_response_event.agent_response;
        if (text) onTranscript?.("assistant", text);
      }
    },
    onError: (error: unknown) => {
      console.error("[VoiceChat] ❌ Error:", error);
      setIsConnecting(false);
      toast({
        variant: "destructive",
        title: "Voice Chat Error",
        description:
          error && typeof error === "object" && "message" in error
            ? String((error as { message: unknown }).message)
            : "Connection failed. Please try again.",
      });
    },
  });

  // Fetch agent ID
  React.useEffect(() => {
    if (!companyId) return;
    const fetch = async () => {
      const { data } = await supabase
        .from("tenant_integrations")
        .select("elevenlabs_agent_id")
        .eq("company_id", companyId)
        .maybeSingle();
      if (data?.elevenlabs_agent_id) setAgentId(data.elevenlabs_agent_id);
    };
    fetch();
  }, [companyId]);

  const startConversation = useCallback(async () => {
    // Text mode
    if (testMode) {
      setTestSessionActive(true);
      setTestAgent("triage");
      setTestHistory([]);
      testSessionIdRef.current = crypto.randomUUID();
      toast({ title: "Text Mode Started", description: "Testing booking logic without voice credits." });
      return;
    }

    // Voice mode — minimal path
    setIsConnecting(true);

    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setHasPermission(true);

      if (!agentId) throw new Error("No ElevenLabs agent configured for this company");

      // Direct agentId connection — bypasses edge function to isolate the issue
      console.log("[VoiceChat] Starting with agentId:", agentId);
      await conversation.startSession({
        agentId,
        connectionType: "webrtc",
      });
    } catch (e) {
      console.error("[VoiceChat] Start failed:", e);
      setIsConnecting(false);

      if (e instanceof DOMException && e.name === "NotAllowedError") {
        setHasPermission(false);
        return;
      }

      toast({
        variant: "destructive",
        title: "Connection Failed",
        description: e instanceof Error ? e.message : "Unable to start chat",
      });
    }
  }, [agentId, conversation, testMode, toast]);

  const stopConversation = useCallback(async () => {
    if (testMode) {
      setTestSessionActive(false);
      setTestIsLoading(false);
      toast({ title: "Text Mode Ended", description: "The testing session has ended." });
      return;
    }
    try {
      await conversation.endSession();
    } catch (e) {
      console.error("[VoiceChat] End session error:", e);
    }
  }, [conversation, testMode, toast]);

  // Text mode multi-agent calls
  const invokeMultiAgent = useCallback(
    async (userMessage: string) => {
      const conversationHistory = testHistory.map((m) => ({ role: m.role, content: m.text }));
      const { data, error } = await supabase.functions.invoke("ai-agent-chat", {
        body: { agentType: testAgent, message: userMessage, companyId, sessionId: testSessionIdRef.current, conversationHistory },
      });
      if (error) throw new Error(error.message);
      return {
        data,
        newAgent: (data?.handoff_to || data?.agent || testAgent) as string,
        assistantText: (data?.response || data?.message || "").toString(),
      };
    },
    [companyId, testAgent, testHistory]
  );

  const invokeMultiAgentHandoffFollowup = useCallback(
    async (userMessage: string, fromAgent: string, toAgent: string) => {
      const conversationHistory = [...testHistory, { role: "user", text: userMessage }].map((m) => ({ role: m.role, content: m.text }));
      const { data, error } = await supabase.functions.invoke("ai-agent-chat", {
        body: { agentType: toAgent, message: userMessage, companyId, sessionId: testSessionIdRef.current, isHandoff: true, handoffFrom: fromAgent, conversationHistory },
      });
      if (error) throw new Error(error.message);
      return { followUpText: (data?.response || data?.message || "").toString() };
    },
    [companyId, testHistory]
  );

  const sendTextMessage = useCallback(async () => {
    const userText = textInput.trim();
    if (!userText) return;

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
        if (data?.handoff_to) {
          const { followUpText } = await invokeMultiAgentHandoffFollowup(userText, testAgent, data.handoff_to);
          if (followUpText) {
            onTranscript?.("assistant", followUpText);
            setTestHistory((prev) => [...prev, { role: "assistant", text: followUpText }]);
          }
        }
      } catch (e) {
        toast({ variant: "destructive", title: "Message Failed", description: e instanceof Error ? e.message : "Could not send message" });
      } finally {
        setIsSendingText(false);
        setTestIsLoading(false);
      }
      return;
    }

    toast({ title: "Voice mode", description: "Use your microphone to talk (or switch to Text Mode to type)." });
  }, [invokeMultiAgent, invokeMultiAgentHandoffFollowup, onTranscript, testAgent, testIsLoading, testMode, testSessionActive, textInput, toast]);

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
          Microphone access was denied. Please enable it in your browser settings.
        </p>
        <Button variant="outline" size="sm" onClick={() => {
          setHasPermission(null);
          navigator.mediaDevices.getUserMedia({ audio: true }).then(() => setHasPermission(true)).catch(() => setHasPermission(false));
        }}>
          Retry Microphone Access
        </Button>
      </div>
    );
  }

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

      <div className={cn(
        "relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300",
        getStatusColor(),
        (isConnected || isSpeaking) && "animate-pulse"
      )}>
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
          <Button onClick={sendTextMessage} disabled={!textInput.trim() || isSendingText || testIsLoading} size="icon">
            {isSendingText || testIsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      )}

      <div className="flex gap-2">
        {!isConnected ? (
          <Button onClick={startConversation} disabled={isConnecting} className="gap-2" size="lg" variant={testMode ? "secondary" : "default"}>
            {isConnecting ? <Loader2 className="h-4 w-4 animate-spin" /> : testMode ? <MessageSquare className="h-4 w-4" /> : <Phone className="h-4 w-4" />}
            {testMode ? "Start Text Mode" : "Start Voice Chat"}
          </Button>
        ) : (
          <Button onClick={stopConversation} variant="destructive" className="gap-2" size="lg">
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
