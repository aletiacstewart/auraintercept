import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useConversation } from '@elevenlabs/react';
import { Mic, MicOff, PhoneOff, X, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import auraAvatarImg from '@/assets/aura-avatar.png';

type Variant = 'hero' | 'floating' | 'inline';
type Expression = 'neutral' | 'listening' | 'thinking' | 'happy' | 'concerned';
type Viseme = 'closed' | 'small' | 'mid' | 'wide' | 'o';

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
  const [viseme, setViseme] = useState<Viseme>('closed');
  const [blink, setBlink] = useState(false);
  const [expression, setExpression] = useState<Expression>('neutral');
  const expressionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number | null>(null);

  const flashExpression = useCallback((next: Expression, ms = 1800) => {
    setExpression(next);
    if (expressionTimerRef.current) clearTimeout(expressionTimerRef.current);
    expressionTimerRef.current = setTimeout(() => setExpression('neutral'), ms);
  }, []);

  const conversation = useConversation({
    onConnect: () => {
      setCaptions((c) => [...c, { who: 'aura', text: 'Connected. Listening…' }]);
      flashExpression('happy', 1500);
    },
    onDisconnect: () => {
      setCaptions((c) => [...c, { who: 'aura', text: 'Call ended.' }]);
      setMouthOpen(0);
      setViseme('closed');
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
      setViseme('closed');
      return;
    }
    const tick = () => {
      try {
        const data = conversation.getOutputByteFrequencyData?.();
        if (data && data.length) {
          const n = data.length;
          const lowEnd = Math.floor(n * 0.15);
          const midEnd = Math.floor(n * 0.5);
          let low = 0, mid = 0, high = 0, sum = 0;
          for (let i = 0; i < n; i++) {
            sum += data[i];
            if (i < lowEnd) low += data[i];
            else if (i < midEnd) mid += data[i];
            else high += data[i];
          }
          const avg = sum / n / 255;
          const amp = Math.min(1, avg * 2.4);
          setMouthOpen(amp);

          // Viseme picker
          if (amp < 0.06) {
            setViseme('closed');
          } else {
            const lAvg = low / Math.max(1, lowEnd);
            const mAvg = mid / Math.max(1, midEnd - lowEnd);
            const hAvg = high / Math.max(1, n - midEnd);
            if (hAvg > mAvg && hAvg > lAvg && amp > 0.18) setViseme('wide');     // E / I
            else if (lAvg > mAvg * 1.15 && lAvg > hAvg) setViseme('o');           // O / U
            else if (amp > 0.35) setViseme('mid');                                 // A
            else setViseme('small');
          }
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
      setTimeout(() => setBlink(false), 130);
      timer = setTimeout(loop, 2500 + Math.random() * 3000);
    };
    timer = setTimeout(loop, 1500);
    return () => clearTimeout(timer);
  }, []);

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
        viseme={viseme}
        blink={blink}
        expression={expression}
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
  viseme: Viseme;
  blink: boolean;
  expression: Expression;
}

function AuraCharacter({ size, connected, speaking, mouthOpen, viseme, blink, expression }: CharacterProps) {
  const ringScale = connected ? (speaking ? 1.08 : 1.04) : 1;

  // Face anchor points (% of container) — calibrated to the portrait
  const FACE = {
    leftEye:  { cx: 41, cy: 36 },
    rightEye: { cx: 56, cy: 36 },
    eyeRx: 4.5, eyeRy: 1.6,
    brow: { y: 31, leftX: 36, rightX: 60, w: 11, h: 1.4 },
    mouth: { cx: 49, cy: 51 },
    blush: { y: 47, leftX: 33, rightX: 64, r: 5 },
  };

  // Mouth shape per viseme — uses amplitude for height
  const amp = Math.max(0.05, mouthOpen);
  const mouthW = (() => {
    switch (viseme) {
      case 'wide': return 9 + amp * 3;     // E/I
      case 'mid':  return 7 + amp * 2;
      case 'small':return 5 + amp * 1.5;
      case 'o':    return 4.5 + amp * 1;
      default:     return 4;
    }
  })();
  const mouthH = (() => {
    if (viseme === 'closed') return 0.4;
    if (viseme === 'wide')   return 1 + amp * 2;
    if (viseme === 'o')      return 4 + amp * 4;
    return 1.5 + amp * 4;
  })();
  const mouthRy = viseme === 'o' ? mouthH : Math.max(0.5, mouthH * 0.55);

  // Brow positioning by expression
  const browLift = (() => {
    if (expression === 'happy') return -0.6;
    if (expression === 'listening') return -1.2;
    if (expression === 'thinking') return -0.4;
    if (expression === 'concerned') return 0.6;
    return 0;
  })();
  const browTilt = (() => {
    if (expression === 'concerned') return 6;   // inner brows up
    if (expression === 'listening') return -3;  // outer up (curious)
    return 0;
  })();

  const showBlush = expression === 'happy' || speaking;
  const headTilt = expression === 'listening' ? -1.2 : expression === 'thinking' ? 1 : 0;

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
      <div
        className="absolute inset-[3px] z-10 overflow-hidden rounded-full drop-shadow-lg"
        style={{
          transform: `rotate(${headTilt}deg) ${speaking ? 'scale(1.025)' : 'scale(1)'}`,
          transition: 'transform 220ms ease-out',
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
        />

        {/* Facial overlay — SVG shapes positioned over the photo */}
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="pointer-events-none absolute inset-0 h-full w-full"
        >
          {/* Blush */}
          <g
            style={{
              opacity: showBlush ? 0.35 : 0,
              transition: 'opacity 300ms ease-out',
            }}
          >
            <ellipse cx={FACE.blush.leftX} cy={FACE.blush.y} rx={FACE.blush.r} ry={FACE.blush.r * 0.7} fill="#ff6b9d" />
            <ellipse cx={FACE.blush.rightX} cy={FACE.blush.y} rx={FACE.blush.r} ry={FACE.blush.r * 0.7} fill="#ff6b9d" />
          </g>

          {/* Brows — drawn on top of existing brows to express */}
          <g style={{ transition: 'transform 200ms ease-out' }}>
            <rect
              x={FACE.brow.leftX}
              y={FACE.brow.y + browLift}
              width={FACE.brow.w}
              height={FACE.brow.h}
              rx={0.7}
              fill="#1a3a4a"
              opacity="0.85"
              transform={`rotate(${-browTilt} ${FACE.brow.leftX + FACE.brow.w / 2} ${FACE.brow.y + browLift})`}
              style={{ transition: 'all 200ms ease-out' }}
            />
            <rect
              x={FACE.brow.rightX}
              y={FACE.brow.y + browLift}
              width={FACE.brow.w}
              height={FACE.brow.h}
              rx={0.7}
              fill="#1a3a4a"
              opacity="0.85"
              transform={`rotate(${browTilt} ${FACE.brow.rightX + FACE.brow.w / 2} ${FACE.brow.y + browLift})`}
              style={{ transition: 'all 200ms ease-out' }}
            />
          </g>

          {/* Eyelids (blink) — skin-toned bars over the eyes */}
          <g style={{ opacity: blink ? 1 : 0, transition: 'opacity 60ms ease-out' }}>
            <ellipse cx={FACE.leftEye.cx} cy={FACE.leftEye.cy} rx={FACE.eyeRx + 0.3} ry={FACE.eyeRy + 0.4} fill="#f3d4c2" />
            <ellipse cx={FACE.rightEye.cx} cy={FACE.rightEye.cy} rx={FACE.eyeRx + 0.3} ry={FACE.eyeRy + 0.4} fill="#f3d4c2" />
          </g>

          {/* Mouth — driven by viseme */}
          {viseme === 'closed' ? (
            // Closed lips: thin horizontal line
            <rect
              x={FACE.mouth.cx - mouthW / 2}
              y={FACE.mouth.cy - 0.3}
              width={mouthW}
              height={0.7}
              rx={0.3}
              fill="#8a3a4a"
              opacity="0.75"
              style={{ transition: 'all 70ms linear' }}
            />
          ) : (
            <>
              {/* Inner mouth (dark) */}
              <ellipse
                cx={FACE.mouth.cx}
                cy={FACE.mouth.cy}
                rx={mouthW / 2}
                ry={mouthRy}
                fill="#3a1018"
                opacity="0.92"
                style={{ transition: 'all 70ms linear' }}
              />
              {/* Lip outline */}
              <ellipse
                cx={FACE.mouth.cx}
                cy={FACE.mouth.cy}
                rx={mouthW / 2}
                ry={mouthRy}
                fill="none"
                stroke="#a04050"
                strokeWidth="0.45"
                opacity="0.7"
                style={{ transition: 'all 70ms linear' }}
              />
            </>
          )}
        </svg>
      </div>
    </div>
  );
}

export default AuraAvatarChat;