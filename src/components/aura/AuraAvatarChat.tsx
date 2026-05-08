import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useConversation } from '@elevenlabs/react';
import { Mic, MicOff, PhoneOff, X, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import auraAvatarImg from '@/assets/aura-avatar.png';

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
  const ringScale = connected ? (speaking ? 1.08 : 1.04) : 1;
  // 5 EQ bars driven by audio amplitude with phase offsets
  const bars = [0.6, 0.85, 1, 0.85, 0.6];

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
      {/* Rotating gradient ring (when live) */}
      <div
        className={cn(
          'absolute inset-0 rounded-full p-[3px]',
          connected && 'animate-spin',
        )}
        style={{
          background: 'conic-gradient(from 0deg, hsl(var(--primary)), hsl(var(--accent)), hsl(var(--primary)))',
          opacity: connected ? 0.9 : 0.5,
          animationDuration: '6s',
        }}
      >
        <div className="h-full w-full rounded-full bg-card" />
      </div>

      {/* Portrait */}
      <img
        src={auraAvatarImg}
        alt="Aura"
        loading="eager"
        className={cn(
          'absolute inset-[3px] z-10 rounded-full object-cover drop-shadow-lg transition-transform',
          connected && !speaking && '[animation:aura-breathe_3s_ease-in-out_infinite]',
        )}
        style={{
          width: `calc(100% - 6px)`,
          height: `calc(100% - 6px)`,
          transform: speaking ? 'scale(1.03)' : undefined,
          transitionDuration: '180ms',
        }}
      />

      {/* Blink overlay */}
      <div
        className="absolute left-[18%] right-[18%] z-20 rounded-full bg-foreground/70 pointer-events-none"
        style={{
          top: '36%',
          height: blink ? '4%' : '0%',
          opacity: blink ? 0.5 : 0,
          transition: 'all 80ms ease-out',
          mixBlendMode: 'multiply',
        }}
      />

      {/* EQ bars when speaking */}
      {speaking && (
        <div
          className="absolute left-1/2 z-20 flex -translate-x-1/2 items-end gap-[3px]"
          style={{ bottom: '6%', height: '14%' }}
        >
          {bars.map((w, i) => (
            <div
              key={i}
              className="w-[4px] rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary))]"
              style={{
                height: `${20 + mouthOpen * w * 100}%`,
                transition: 'height 60ms linear',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default AuraAvatarChat;