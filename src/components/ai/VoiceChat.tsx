import React, { useCallback, useRef, useState } from "react";
import { useConversation } from "@elevenlabs/react";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
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
import { useBrowserVoiceChat } from "@/hooks/useBrowserVoiceChat";

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
  const { i18n } = useTranslation();
  const voiceLanguage: 'en' | 'es' = i18n.language?.startsWith('es') ? 'es' : 'en';

  const [isConnecting, setIsConnecting] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [isSendingText, setIsSendingText] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [agentId, setAgentId] = useState<string | null>(null);
  const [isProcessingTool, setIsProcessingTool] = useState(false);

  // Text mode state
  const [testSessionActive, setTestSessionActive] = useState(false);
  const [testIsLoading, setTestIsLoading] = useState(false);
  const [testAgent, setTestAgent] = useState<string>("triage");
  const [testHistory, setTestHistory] = useState<TranscriptMsg[]>([]);
  const testSessionIdRef = useRef<string>(crypto.randomUUID());

  // Text-mode TTS (ElevenLabs) — plays Aura's reply aloud while in text mode.
  const [ttsEnabled, setTtsEnabled] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    return window.localStorage.getItem("aura.textmode.tts") !== "off";
  });
  const ttsAudioRef = useRef<HTMLAudioElement | null>(null);
  const ttsUrlRef = useRef<string | null>(null);

  const toggleTts = useCallback(() => {
    setTtsEnabled((prev) => {
      const next = !prev;
      try { window.localStorage.setItem("aura.textmode.tts", next ? "on" : "off"); } catch {}
      if (!next && ttsAudioRef.current) {
        ttsAudioRef.current.pause();
        ttsAudioRef.current.src = "";
      }
      return next;
    });
  }, []);

  const playAuraVoice = useCallback(async (text: string) => {
    if (!ttsEnabled || !text?.trim()) return;
    try {
      // Stop anything currently playing
      if (ttsAudioRef.current) {
        ttsAudioRef.current.pause();
      }
      if (ttsUrlRef.current) {
        URL.revokeObjectURL(ttsUrlRef.current);
        ttsUrlRef.current = null;
      }

      const baseUrl = (import.meta as any).env?.VITE_SUPABASE_URL as string | undefined;
      const anonKey = (import.meta as any).env?.VITE_SUPABASE_PUBLISHABLE_KEY
        || (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;
      if (!baseUrl) throw new Error("Missing VITE_SUPABASE_URL");
      const res = await fetch(`${baseUrl}/functions/v1/elevenlabs-tts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(anonKey ? { Authorization: `Bearer ${anonKey}`, apikey: anonKey } : {}),
        },
        body: JSON.stringify({ text: text.slice(0, 4000) }),
      });
      if (!res.ok) {
        console.warn("[VoiceChat] TTS failed", res.status);
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      ttsUrlRef.current = url;
      const audio = ttsAudioRef.current ?? new Audio();
      ttsAudioRef.current = audio;
      audio.src = url;
      audio.play().catch((e) => console.warn("[VoiceChat] TTS play error", e));
    } catch (e) {
      console.warn("[VoiceChat] playAuraVoice error", e);
    }
  }, [ttsEnabled]);

  React.useEffect(() => {
    return () => {
      if (ttsAudioRef.current) {
        ttsAudioRef.current.pause();
        ttsAudioRef.current.src = "";
      }
      if (ttsUrlRef.current) {
        URL.revokeObjectURL(ttsUrlRef.current);
        ttsUrlRef.current = null;
      }
    };
  }, []);

  // Browser voice chat fallback hook
  const browserVoice = useBrowserVoiceChat({ companyId, onTranscript });
  const useBrowserFallback = !testMode && !agentId;

  // Helper to invoke voice-booking-agent edge function
  const invokeBookingAgent = useCallback(async (toolName: string, params: Record<string, unknown> = {}) => {
    console.log(`[VoiceChat] clientTool "${toolName}" called with:`, params);
    try {
      const { data, error } = await supabase.functions.invoke("voice-booking-agent", {
        body: { toolName, agentId, companyId, ...params },
      });
      if (error) throw error;
      console.log(`[VoiceChat] clientTool "${toolName}" response:`, data);
      return typeof data === "string" ? data : JSON.stringify(data);
    } catch (e) {
      console.error(`[VoiceChat] clientTool "${toolName}" failed:`, e);
      return JSON.stringify({ error: "Sorry, I had trouble with that request. Could you try again?" });
    }
  }, [agentId, companyId]);

  // Voice hook — with clientTools for reliable tool execution
  const conversation = useConversation({
    clientTools: {
      get_services: async (_params: Record<string, unknown>) => {
        setIsProcessingTool(true);
        try { return await invokeBookingAgent("get_services"); } finally { setIsProcessingTool(false); }
      },
      check_availability: async (params: Record<string, unknown>) => {
        setIsProcessingTool(true);
        try {
          return await invokeBookingAgent("check_availability", {
            preferred_date: params.preferred_date || params.date,
            service_type: params.service_type || params.service,
          });
        } finally { setIsProcessingTool(false); }
      },
      create_appointment: async (params: Record<string, unknown>) => {
        setIsProcessingTool(true);
        try {
          return await invokeBookingAgent("create_appointment", {
            customer_name: params.customer_name || params.name,
            customer_phone: params.customer_phone || params.phone,
            service_type: params.service_type || params.service,
            datetime: params.datetime || params.date_time || params.appointment_time,
            duration: params.duration || params.duration_minutes || 60,
          });
        } finally { setIsProcessingTool(false); }
      },
      // Industry-matched live walkthrough demo. Aura captures industry +
      // contact info, calls this tool, and reads back the `spoken` field so
      // the prospect immediately knows their text + email are on the way.
      send_walkthrough_demo: async (params: Record<string, unknown>) => {
        setIsProcessingTool(true);
        try {
          const { data, error } = await supabase.functions.invoke(
            "send-walkthrough-demo",
            {
              body: {
                industry: params.industry,
                name: params.name,
                email: params.email,
                phone: params.phone || params.mobile || params.phone_number,
                company_name: params.company_name || params.business_name,
                source: "voice_web",
              },
            },
          );
          if (error) throw error;
          const spoken = (data && typeof (data as any).spoken === "string")
            ? (data as any).spoken
            : "I just sent your live walkthrough link by text and email — tap it whenever you're ready.";
          if ((data as any)?.demo_url) {
            toast({
              title: "Live demo on the way",
              description: `Tap the link in your text or email — opens your ${(data as any).industry_label || "industry"} demo.`,
            });
          }
          return JSON.stringify({ ok: true, spoken });
        } catch (e) {
          console.error("[VoiceChat] send_walkthrough_demo failed:", e);
          return JSON.stringify({
            ok: false,
            spoken:
              "I had trouble sending that — can a teammate text the demo link in a couple minutes?",
          });
        } finally {
          setIsProcessingTool(false);
        }
      },
    },
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

    // Browser voice fallback (no ElevenLabs configured)
    if (useBrowserFallback) {
      if (!browserVoice.recognitionSupported || !browserVoice.speechSupported) {
        toast({
          variant: "destructive",
          title: "Browser Not Supported",
          description: "Your browser doesn't support voice features. Try Chrome or Edge.",
        });
        return;
      }
      setIsConnecting(true);
      try {
        await browserVoice.startSession();
        toast({
          title: "Browser Voice Started",
          description: "Using free browser voice — no ElevenLabs credits used.",
        });
      } catch (e) {
        if (e instanceof DOMException && e.name === "NotAllowedError") {
          setHasPermission(false);
        } else {
          toast({
            variant: "destructive",
            title: "Connection Failed",
            description: e instanceof Error ? e.message : "Unable to start chat",
          });
        }
      } finally {
        setIsConnecting(false);
      }
      return;
    }

    // Voice mode — ElevenLabs
    setIsConnecting(true);

    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setHasPermission(true);

      if (!agentId) throw new Error("No ElevenLabs agent configured for this company");

      console.log("[VoiceChat] Starting with agentId:", agentId);
      const isAuraSalesTenant = companyId === '04c57cbe-358e-4036-a3ad-b777a55f5be0';
      const walkthroughPromptAddendum = isAuraSalesTenant
        ? `\n\nLIVE WALKTHROUGH DEMO:\nIf the caller asks for a demo, walkthrough, sample, or "try it for my <industry>", do this:\n1. Confirm their industry. Supported: HVAC, plumbing, electrical, roofing, solar, landscaping, pool & spa, pest control, appliance repair, handyman, construction, auto care, security systems, real estate, beauty & wellness, restaurants, personal assistant, fencing. (Home health / hospice / PT / OT are on a HIPAA waitlist — capture them as a lead instead.)\n2. Collect first name and mobile phone number (email optional, company name optional).\n3. Call the send_walkthrough_demo client tool with { industry, name, phone, email?, company_name? }.\n4. Read back the tool's "spoken" field verbatim so the caller hears the confirmation. Never claim the demo was sent unless the tool returned ok:true.`
        : '';
      await conversation.startSession({
        agentId,
        connectionType: "webrtc",
        overrides: {
          agent: {
            language: voiceLanguage,
            ...(walkthroughPromptAddendum
              ? { prompt: { prompt: walkthroughPromptAddendum } }
              : {}),
          },
        },
      });

      const today = new Date();
      const formatted = today.toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      });
      const fillerNote = voiceLanguage === 'es'
        ? `La fecha de hoy es ${formatted} (${today.toISOString().split('T')[0]}). IMPORTANTE: Antes de usar cualquier herramienta, di siempre un breve relleno como "Permítame revisar eso" o "Un momento mientras lo busco" para que la persona sepa que sigues ahí. Nunca te quedes en silencio.`
        : `Today's date is ${formatted} (${today.toISOString().split('T')[0]}). IMPORTANT: Before using any tool, always say a brief filler like 'Let me check on that for you' or 'One moment while I look that up' so the caller knows you're still here. Never go silent.`;
      conversation.sendContextualUpdate(fillerNote);
      console.log("[VoiceChat] Sent date context:", formatted);
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
  }, [agentId, conversation, testMode, toast, useBrowserFallback, browserVoice]);

  const stopConversation = useCallback(async () => {
    if (testMode) {
      setTestSessionActive(false);
      setTestIsLoading(false);
      toast({ title: "Text Mode Ended", description: "The testing session has ended." });
      return;
    }
    if (useBrowserFallback) {
      browserVoice.endSession();
      toast({ title: "Browser Voice Ended", description: "The voice session has ended." });
      return;
    }
    try {
      await conversation.endSession();
    } catch (e) {
      console.error("[VoiceChat] End session error:", e);
    }
  }, [conversation, testMode, toast, useBrowserFallback, browserVoice]);

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
          playAuraVoice(assistantText);
        }
        if (data?.handoff_to) {
          const { followUpText } = await invokeMultiAgentHandoffFollowup(userText, testAgent, data.handoff_to);
          if (followUpText) {
            onTranscript?.("assistant", followUpText);
            setTestHistory((prev) => [...prev, { role: "assistant", text: followUpText }]);
            playAuraVoice(followUpText);
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
  }, [invokeMultiAgent, invokeMultiAgentHandoffFollowup, onTranscript, playAuraVoice, testAgent, testIsLoading, testMode, testSessionActive, textInput, toast]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendTextMessage();
    }
  };

  const isConnected = testMode
    ? testSessionActive
    : useBrowserFallback
      ? browserVoice.status === "connected"
      : conversation.status === "connected";
  const isSpeakingNow = useBrowserFallback
    ? browserVoice.isSpeaking
    : (!testMode && isConnected && conversation.isSpeaking);
  const isBrowserProcessing = useBrowserFallback && browserVoice.isProcessing;

  const getStatusText = () => {
    if (isConnecting) return "Connecting...";
    if (testMode && isConnected) return testIsLoading ? "Thinking…" : "Text mode active - type to chat";
    if (isProcessingTool || isBrowserProcessing) return "Processing your request...";
    if (isSpeakingNow) return "AI is speaking...";
    if (isConnected) return "Listening...";
    return testMode ? "Click to start text mode" : "Click to start voice chat";
  };

  const getStatusColor = () => {
    if (testMode && isConnected) return "bg-blue-500";
    if (isProcessingTool || isBrowserProcessing) return "bg-amber-500";
    if (isSpeakingNow) return "bg-secondary";
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


  return (
    <div className="flex flex-col items-center gap-4 p-4">
      {testMode && (
        <Badge variant="secondary" className="gap-1 bg-secondary/10 text-secondary border-secondary/20">
          <MessageSquare className="h-3 w-3" />
          Text Mode (No Voice Credits)
        </Badge>
      )}
      {useBrowserFallback && (
        <Badge variant="outline" className="gap-1 border-primary/30 text-primary">
          <Mic className="h-3 w-3" />
          Browser Voice (Free)
        </Badge>
      )}

      <div className={cn(
        "relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300",
        getStatusColor(),
        (isConnected || isSpeakingNow) && "animate-pulse"
      )}>
        {isConnecting ? (
          <Loader2 className="h-10 w-10 text-white animate-spin" />
        ) : testMode && isConnected ? (
          <MessageSquare className="h-10 w-10 text-white" />
        ) : isSpeakingNow ? (
          <Volume2 className="h-10 w-10 text-white animate-pulse" />
        ) : isConnected ? (
          <Mic className="h-10 w-10 text-white" />
        ) : testMode ? (
          <MessageSquare className="h-10 w-10 text-muted-foreground" />
        ) : (
          <Mic className="h-10 w-10 text-muted-foreground" />
        )}

        {(isConnected || isSpeakingNow) && (
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
