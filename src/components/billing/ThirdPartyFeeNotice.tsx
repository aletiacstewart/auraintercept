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
        3rd-party fees (SignalWire, ElevenLabs, Resend, Tavily, Stripe, A2P 10DLC, social APIs) are
        billed directly to your own credit card by each provider and are not covered by the trial.
      </p>
    );
  }
  return (
    <div className={cn('rounded-lg border border-primary/20 bg-primary/5 p-3 flex gap-2', className)}>
      <AlertCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
      <div className="text-xs text-foreground/90 leading-relaxed">
        <p className="font-semibold mb-1">3rd-party services are not included</p>
        <p>
          Voice/SMS (SignalWire), AI voices (ElevenLabs), email (Resend), web search (Tavily),
          payments (Stripe), A2P 10DLC registration, and social APIs all require your own provider
          account with a valid credit card on file. Each provider invoices you directly — Aura
          never resells or marks up these fees.
        </p>
      </div>
    </div>
  );
}

export default ThirdPartyFeeNotice;