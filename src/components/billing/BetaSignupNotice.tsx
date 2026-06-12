import { Zap } from 'lucide-react';

interface BetaSignupNoticeProps {
  variant?: 'full' | 'compact';
  className?: string;
}

/**
 * Unified BETA Sign-Up notice — explains 60-Day Live Trial, Beta Pricing,
 * capped beta onboarding fee, 3rd-party billing pass-through, and what the
 * onboarding fee covers. Used on the public homepage (above pricing plans)
 * and on the company signup form (above the tier selector).
 */
export function BetaSignupNotice({ variant = 'full', className = '' }: BetaSignupNoticeProps) {
  const compact = variant === 'compact';

  return (
    <div
      className={`rounded-xl border border-primary/30 bg-primary/5 p-4 md:p-5 space-y-3 ${className}`}
    >
      <div className="flex items-center gap-2 flex-wrap">
        <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 border border-primary/30 px-2 py-0.5 text-[10px] font-bold text-primary uppercase tracking-wider">
          <Zap className="w-3 h-3" /> Beta
        </span>
        <h3 className={`font-bold text-primary ${compact ? 'text-sm' : 'text-base md:text-lg'}`}>
          BETA Sign-Up — Limited Time
        </h3>
      </div>

      <p className={`text-foreground leading-relaxed ${compact ? 'text-[11px]' : 'text-sm'}`}>
        All beta members get a{' '}
        <span className="font-semibold text-primary">60-Day Live Trial</span>{' '}
        (30 days concierge onboarding + 30 days full live use). During beta,
        your one-time onboarding fee is{' '}
        <span className="font-semibold text-primary">capped at $497</span>{' '}
        regardless of tier, and you lock in{' '}
        <span className="font-semibold text-primary">Beta Pricing</span> on
        your monthly plan:
      </p>

      <ul className={`grid sm:grid-cols-2 gap-x-4 gap-y-1 text-foreground/90 ${compact ? 'text-[11px]' : 'text-xs md:text-sm'}`}>
        <li>
          <span className="font-semibold">Core:</span>{' '}
          <span className="line-through text-foreground/50">$697</span>{' '}
          <span className="text-primary font-semibold">$497/mo</span>
          {' · '}
          Onboarding <span className="text-primary font-semibold">$497</span>
        </li>
        <li>
          <span className="font-semibold">Boost:</span>{' '}
          <span className="line-through text-foreground/50">$1,394</span>{' '}
          <span className="text-primary font-semibold">$994/mo</span>
          {' · '}
          Onboarding <span className="text-primary font-semibold">$497</span>
        </li>
        <li>
          <span className="font-semibold">Pro:</span>{' '}
          <span className="line-through text-foreground/50">$2,788</span>{' '}
          <span className="text-primary font-semibold">$1,988/mo</span>
          {' · '}
          Onboarding <span className="text-primary font-semibold">$497</span>
        </li>
        <li>
          <span className="font-semibold">Elite:</span>{' '}
          <span className="line-through text-foreground/50">$5,576</span>{' '}
          <span className="text-primary font-semibold">$3,979/mo</span>
          {' · '}
          Onboarding <span className="text-primary font-semibold">$497</span>
        </li>
      </ul>

      <p className={`text-foreground/80 leading-relaxed ${compact ? 'text-[10px]' : 'text-xs'}`}>
        <span className="font-semibold text-foreground">3rd-party providers</span>{' '}
        (SignalWire, ElevenLabs, Resend, Tavily, Stripe) require your own
        account with a valid credit card and bill you directly — separate from
        your Aura plan fee. Aura never resells, marks up, or invoices 3rd-party
        usage.
      </p>

      <p className={`text-foreground/80 leading-relaxed italic ${compact ? 'text-[10px]' : 'text-xs'}`}>
        The onboarding fee is due at the start of your trial and covers account
        configuration, AI agent setup, knowledge-base build-out, 3rd-party
        activation, A2P 10DLC compliance filing, and your initial training
        session. Non-refundable once onboarding begins. Beta docs, guides, and
        tutorials may occasionally lag the latest changes — check the homepage
        for the most current pricing and trial details.
      </p>
    </div>
  );
}