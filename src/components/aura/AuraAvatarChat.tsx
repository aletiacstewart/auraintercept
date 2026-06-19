import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useConversation } from '@elevenlabs/react';
import { Mic, MicOff, PhoneOff, X, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import auraAvatarImg from '@/assets/aura-avatar.png';
import { useTranslation } from 'react-i18next';

type Variant = 'hero' | 'floating' | 'inline' | 'compact';
type Expression = 'neutral' | 'listening' | 'thinking' | 'happy' | 'concerned';

interface AuraAvatarChatProps {
  variant?: Variant;
  className?: string;
  onClose?: () => void;
}

interface Caption {
  who: 'user' | 'aura';
  text: string;
}

/**
 * AuraAvatarChat — stylized animated avatar with WebRTC voice chat
 * powered by the ElevenLabs platform Aura agent.
 */
export function AuraAvatarChat({ variant = 'inline', className, onClose }: AuraAvatarChatProps) {
  const { toast } = useToast();
  const { i18n } = useTranslation();
  const voiceLanguage: 'en' | 'es' = i18n.language?.startsWith('es') ? 'es' : 'en';
  const [muted, setMuted] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [captions, setCaptions] = useState<Caption[]>([]);
  const [mouthOpen, setMouthOpen] = useState(0);
  const [expression, setExpression] = useState<Expression>('neutral');
  const expressionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number | null>(null);

  const flashExpression = useCallback((next: Expression, ms = 1800) => {
    setExpression(next);
    if (expressionTimerRef.current) clearTimeout(expressionTimerRef.current);
    expressionTimerRef.current = setTimeout(() => setExpression('neutral'), ms);
  }, []);

  const conversation = useConversation({
    clientTools: {
      // Industry-matched live walkthrough demo (sales agent tool).
      // Captures industry + contact info, calls the edge function, and
      // returns the `spoken` field so Aura reads back the confirmation.
      send_walkthrough_demo: async (params: Record<string, unknown>) => {
        try {
          const { data, error } = await supabase.functions.invoke(
            'send-walkthrough-demo',
            {
              body: {
                industry: params.industry,
                name: params.name,
                email: params.email,
                phone: params.phone || params.mobile || params.phone_number,
                company_name: params.company_name || params.business_name,
                source: 'voice_web',
              },
            },
          );
          if (error) throw error;
          const spoken =
            data && typeof (data as any).spoken === 'string'
              ? (data as any).spoken
              : "I just sent your live walkthrough link by text and email — tap it whenever you're ready.";
          if ((data as any)?.demo_url) {
            toast({
              title: 'Live demo on the way',
              description: `Tap the link in your text or email — opens your ${(data as any).industry_label || 'industry'} demo.`,
            });
          }
          return JSON.stringify({ ok: true, spoken });
        } catch (e) {
          console.error('[AuraAvatarChat] send_walkthrough_demo failed:', e);
          return JSON.stringify({
            ok: false,
            spoken:
              "I had trouble sending that — can a teammate text the demo link in a couple minutes?",
          });
        }
      },
    },
    onConnect: () => {
      setCaptions((c) => [...c, { who: 'aura', text: 'Connected. Listening…' }]);
      flashExpression('happy', 1500);
    },
    onDisconnect: () => {
      setCaptions((c) => [...c, { who: 'aura', text: 'Call ended.' }]);
      setMouthOpen(0);
      setExpression('neutral');
    },
    onError: (e) => {
      console.error('Aura conversation error', e);
      flashExpression('concerned', 2500);
      toast({
        title: 'Aura call error',
        description: typeof e === 'string' ? e : 'Connection lost.',
        variant: 'destructive',
      });
    },
    onMessage: (msg: any) => {
      if (msg?.type === 'user_transcript') {
        const text = msg.user_transcription_event?.user_transcript;
        if (text) setCaptions((c) => [...c, { who: 'user', text }]);
        flashExpression('listening', 1200);
      } else if (msg?.type === 'agent_response') {
        const text = msg.agent_response_event?.agent_response;
        if (text) setCaptions((c) => [...c, { who: 'aura', text }]);
        flashExpression('happy', 1500);
      } else if (msg?.source === 'user' && typeof msg.message === 'string') {
        setCaptions((c) => [...c, { who: 'user', text: msg.message }]);
        flashExpression('listening', 1200);
      } else if (msg?.source === 'ai' && typeof msg.message === 'string') {
        setCaptions((c) => [...c, { who: 'aura', text: msg.message }]);
        flashExpression('happy', 1500);
      }
    },
  });

  const isConnected = conversation.status === 'connected';
  const isSpeaking = conversation.isSpeaking;

  // Lip-sync via output frequency data — amplitude + viseme from band energy
  useEffect(() => {
    if (!isConnected) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      setMouthOpen(0);
      return;
    }
    const tick = () => {
      try {
        const data = conversation.getOutputByteFrequencyData?.();
        if (data && data.length) {
          const n = data.length;
          let sum = 0;
          for (let i = 0; i < n; i++) sum += data[i];
          const avg = sum / n / 255;
          const amp = Math.min(1, avg * 2.4);
          setMouthOpen(amp);
        }
      } catch {/* ignore */}
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isConnected, conversation]);

  useEffect(() => () => {
    if (expressionTimerRef.current) clearTimeout(expressionTimerRef.current);
  }, []);

  const start = useCallback(async () => {
    setConnecting(true);
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      const { data, error } = await supabase.functions.invoke('elevenlabs-aura-token');
      if (error) throw error;
      if (!data?.token) throw new Error('No token returned');
      await conversation.startSession({
        conversationToken: data.token,
        connectionType: 'webrtc',
        overrides: {
          agent: { language: voiceLanguage },
        },
      });
    } catch (err) {
      console.error('Failed to start Aura call', err);
      toast({
        title: 'Could not start call',
        description: err instanceof Error ? err.message : 'Microphone or network error.',
        variant: 'destructive',
      });
    } finally {
      setConnecting(false);
    }
  }, [conversation, toast]);

  const stop = useCallback(async () => {
    await conversation.endSession();
  }, [conversation]);

  const toggleMute = useCallback(async () => {
    const next = !muted;
    setMuted(next);
    try {
      await conversation.setVolume({ volume: next ? 0 : 1 });
    } catch {/* ignore */}
  }, [muted, conversation]);

  // Sizing per variant
  const wrapClass = cn(
    'relative flex flex-col items-center gap-4 rounded-2xl border border-primary/30 bg-card/80 backdrop-blur-md p-6 shadow-2xl',
    variant === 'hero' && 'w-full max-w-md',
    variant === 'floating' && 'w-[360px]',
    variant === 'inline' && 'w-full',
    className,
  );

  return (
    <div className={wrapClass}>
      {onClose && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 h-7 w-7 rounded-full"
          onClick={onClose}
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </Button>
      )}

      {variant === 'compact' ? null : <AuraCharacter
        size={variant === 'inline' ? 140 : 160}
        connected={isConnected}
        speaking={isSpeaking}
        mouthOpen={mouthOpen}
        expression={expression}
      />}

      <div className="text-center">
        <div className="text-sm font-semibold text-foreground">Aura</div>
        <div className="text-xs text-muted-foreground">
          {connecting
            ? 'Connecting…'
            : isConnected
              ? isSpeaking ? 'Speaking' : 'Listening'
              : 'Tap call to talk live'}
        </div>
      </div>

      {/* Captions */}
      {captions.length > 0 && (
        <div className="w-full max-h-32 overflow-y-auto rounded-lg bg-muted/40 p-2 text-xs space-y-1">
          {captions.slice(-5).map((c, i) => (
            <div key={i} className={cn(c.who === 'user' ? 'text-foreground' : 'text-primary')}>
              <span className="font-semibold mr-1">{c.who === 'user' ? 'You:' : 'Aura:'}</span>
              {c.text}
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3">
        {!isConnected ? (
          <Button
            size="lg"
            onClick={start}
            disabled={connecting}
            className="rounded-full px-6"
          >
            <Phone className="mr-2 h-4 w-4" />
            {connecting ? 'Connecting…' : 'Talk to Aura'}
          </Button>
        ) : (
          <>
            <Button
              variant="outline"
              size="icon"
              onClick={toggleMute}
              className="rounded-full"
              aria-label={muted ? 'Unmute' : 'Mute'}
            >
              {muted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
            <Button
              variant="destructive"
              size="icon"
              onClick={stop}
              className="rounded-full"
              aria-label="End call"
            >
              <PhoneOff className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

// --- Stylized SVG avatar -----------------------------------------------------

interface CharacterProps {
  size: number;
  connected: boolean;
  speaking: boolean;
  mouthOpen: number; // 0..1
  expression: Expression;
}

export function AuraCharacter({ size, connected, speaking, mouthOpen, expression }: CharacterProps) {
  // Drive ring + portrait directly from amplitude — no fake facial features.
  const amp = Math.max(0, Math.min(1, mouthOpen));
  const ringScale = connected ? 1.02 + amp * 0.1 : 1;
  const ringOpacity = connected ? 0.45 + amp * 0.45 : 0.22;
  const portraitScale = 1 + (speaking ? amp * 0.018 : 0) + (connected ? 0.004 : 0);
  const portraitBrightness = 1 + (speaking ? amp * 0.08 : 0);
  const headTilt = expression === 'listening' ? -1.2 : expression === 'thinking' ? 1 : 0;
  const ringHue =
    expression === 'concerned' ? 'hsl(var(--destructive))'
    : expression === 'happy' ? 'hsl(var(--accent))'
    : 'hsl(var(--primary))';

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Pulse ring */}
      <div
        className={cn(
          'absolute inset-0 rounded-full transition-all duration-200',
        )}
        style={{
          background: `radial-gradient(circle, ${ringHue} 0%, transparent 70%)`,
          filter: `blur(${14 + amp * 10}px)`,
          opacity: ringOpacity,
          transform: `scale(${ringScale})`,
        }}
      />
      {/* Outer audio-reactive halo */}
      {connected && (
        <div
          className="absolute inset-0 rounded-full transition-all duration-150"
          style={{
            background: `radial-gradient(circle, ${ringHue} 0%, transparent 60%)`,
            filter: 'blur(22px)',
            opacity: amp * 0.5,
            transform: `scale(${1.05 + amp * 0.18})`,
          }}
        />
      )}
      {/* Rotating gradient ring (when live) */}
      <div
        className={cn(
          'absolute inset-0 rounded-full p-[3px]',
          connected && 'animate-spin',
        )}
        style={{
          background: 'conic-gradient(from 0deg, hsl(var(--primary)), hsl(var(--accent)), hsl(var(--primary)))',
          opacity: connected ? 0.9 : 0.5,
          animationDuration: expression === 'thinking' ? '3s' : '8s',
        }}
      >
        <div className="h-full w-full rounded-full bg-card" />
      </div>

      {/* Portrait */}
      <div
        className="absolute inset-[3px] z-10 overflow-hidden rounded-full drop-shadow-lg"
        style={{
          transform: `rotate(${headTilt}deg) scale(${portraitScale})`,
          transition: 'transform 180ms ease-out',
        }}
      >
        <img
          src={auraAvatarImg}
          alt="Aura"
          loading="eager"
          className={cn(
            'h-full w-full object-cover',
            connected && !speaking && '[animation:aura-breathe_3s_ease-in-out_infinite]',
          )}
          style={{
            filter: `brightness(${portraitBrightness})`,
            transition: 'filter 120ms linear',
          }}
        />
      </div>
    </div>
  );
}

export default AuraAvatarChat;