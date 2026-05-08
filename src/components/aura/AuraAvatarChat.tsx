import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useConversation } from '@elevenlabs/react';
import { Mic, MicOff, PhoneOff, X, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type Variant = 'hero' | 'floating' | 'inline';

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
  const [muted, setMuted] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [captions, setCaptions] = useState<Caption[]>([]);
  const [mouthOpen, setMouthOpen] = useState(0);
  const [blink, setBlink] = useState(false);
  const rafRef = useRef<number | null>(null);

  const conversation = useConversation({
    onConnect: () => setCaptions((c) => [...c, { who: 'aura', text: 'Connected. Listening…' }]),
    onDisconnect: () => {
      setCaptions((c) => [...c, { who: 'aura', text: 'Call ended.' }]);
      setMouthOpen(0);
    },
    onError: (e) => {
      console.error('Aura conversation error', e);
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
      } else if (msg?.type === 'agent_response') {
        const text = msg.agent_response_event?.agent_response;
        if (text) setCaptions((c) => [...c, { who: 'aura', text }]);
      } else if (msg?.source === 'user' && typeof msg.message === 'string') {
        setCaptions((c) => [...c, { who: 'user', text: msg.message }]);
      } else if (msg?.source === 'ai' && typeof msg.message === 'string') {
        setCaptions((c) => [...c, { who: 'aura', text: msg.message }]);
      }
    },
  });

  const isConnected = conversation.status === 'connected';
  const isSpeaking = conversation.isSpeaking;

  // Lip-sync via output frequency data
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
          let sum = 0;
          for (let i = 0; i < data.length; i++) sum += data[i];
          const avg = sum / data.length / 255; // 0..1
          setMouthOpen(Math.min(1, avg * 2.2));
        }
      } catch {/* ignore */}
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isConnected, conversation]);

  // Blink loop
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const loop = () => {
      setBlink(true);
      setTimeout(() => setBlink(false), 140);
      timer = setTimeout(loop, 2500 + Math.random() * 3000);
    };
    timer = setTimeout(loop, 1500);
    return () => clearTimeout(timer);
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

      <AuraCharacter
        size={variant === 'inline' ? 140 : 160}
        connected={isConnected}
        speaking={isSpeaking}
        mouthOpen={mouthOpen}
        blink={blink}
      />

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
  blink: boolean;
}

function AuraCharacter({ size, connected, speaking, mouthOpen, blink }: CharacterProps) {
  // Mouth height grows with audio amplitude
  const mouthH = 4 + mouthOpen * 18;
  const ringScale = connected ? (speaking ? 1.08 : 1.04) : 1;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Pulse ring */}
      <div
        className={cn(
          'absolute inset-0 rounded-full transition-transform duration-300',
          connected && 'animate-pulse',
        )}
        style={{
          background: 'var(--gradient-primary, linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent))))',
          filter: 'blur(14px)',
          opacity: connected ? 0.55 : 0.25,
          transform: `scale(${ringScale})`,
        }}
      />
      {/* Avatar SVG */}
      <svg
        viewBox="0 0 200 200"
        width={size}
        height={size}
        className="relative z-10 drop-shadow-lg"
      >
        <defs>
          <radialGradient id="auraHead" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.95" />
            <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity="0.85" />
          </radialGradient>
          <linearGradient id="auraVisor" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--background))" stopOpacity="0.85" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.4" />
          </linearGradient>
        </defs>

        {/* Head */}
        <circle cx="100" cy="100" r="78" fill="url(#auraHead)" />
        {/* Visor */}
        <ellipse cx="100" cy="92" rx="56" ry="34" fill="url(#auraVisor)" />

        {/* Eyes */}
        <g fill="hsl(var(--primary-foreground))">
          <ellipse
            cx="80"
            cy="92"
            rx="6"
            ry={blink ? 0.6 : 6}
            style={{ transition: 'all 80ms ease-out' }}
          />
          <ellipse
            cx="120"
            cy="92"
            rx="6"
            ry={blink ? 0.6 : 6}
            style={{ transition: 'all 80ms ease-out' }}
          />
        </g>

        {/* Mouth */}
        <rect
          x={88}
          y={130 - mouthH / 2}
          width={24}
          height={mouthH}
          rx={6}
          fill="hsl(var(--primary-foreground))"
          opacity={0.9}
          style={{ transition: 'all 60ms linear' }}
        />

        {/* Cheek glow when speaking */}
        {speaking && (
          <>
            <circle cx="62" cy="118" r="8" fill="hsl(var(--accent))" opacity="0.4" />
            <circle cx="138" cy="118" r="8" fill="hsl(var(--accent))" opacity="0.4" />
          </>
        )}
      </svg>
    </div>
  );
}

export default AuraAvatarChat;