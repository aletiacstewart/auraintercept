import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  className?: string;
  variant?: 'default' | 'compact';
}

/**
 * Standardized disclosure that 3rd-party provider fees (SignalWire, ElevenLabs,
 * Resend, Tavily, Stripe, A2P 10DLC, Social) are billed directly by each provider
 * to the customer's own credit card and are NOT covered by the Aura plan or trial.
 */
export function ThirdPartyFeeNotice({ className, variant = 'default' }: Props) {
  if (variant === 'compact') {
    return (
      <p className={cn('text-[11px] leading-tight text-muted-foreground', className)}>
        3rd-party usage (SignalWire voice/SMS, ElevenLabs voice, Resend email, Tavily, Stripe,
        A2P 10DLC, social APIs) is pay-as-you-go — billed directly by each vendor to your own
        credit card, including during your 60-Day Live Trial. Aura never resells or marks up
        vendor charges.
      </p>
    );
  }
  return (
    <div className={cn('rounded-lg border border-primary/20 bg-primary/5 p-3 flex gap-2', className)}>
      <AlertCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
      <div className="text-xs text-foreground/90 leading-relaxed">
        <p className="font-semibold mb-1">3rd-party services billed separately by each vendor — including during your trial</p>
        <p>
          Voice & SMS (SignalWire), AI voice (ElevenLabs), email (Resend), web research (Tavily),
          payments (Stripe), A2P 10DLC, and social APIs each require your own account with a valid
          credit card on file. You're invoiced <strong>directly by each provider on a pay-as-you-go
          basis</strong> for actual usage — per voice minute, per text, per email, per search, per
          transaction. These usage fees apply during your 60-Day Live Trial too. Aura's plan fee
          covers the platform only; we never resell, mark up, or absorb vendor charges.
        </p>
      </div>
    </div>
  );
}

export default ThirdPartyFeeNotice;