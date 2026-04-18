import React from 'react';
import { Link } from 'react-router-dom';
import { Crown, Sparkles, Clock } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { cn } from '@/lib/utils';

/**
 * Top-bar chip showing the company's current plan + "Upgrade" CTA.
 * Renders nothing until subscription state has loaded (avoids "Free" flash for paid users).
 */
export const CurrentPlanChip: React.FC = () => {
  const { subscriptionTier, inTrial, trialDaysRemaining, getTierInfo } = useSubscription();

  if (!subscriptionTier) return null;

  const tierInfo = getTierInfo(subscriptionTier);
  const isTopTier = subscriptionTier === 'command';
  const showUpgrade = !isTopTier;

  return (
    <div className="flex items-center gap-1.5">
      {/* Trial chip — only when in trial */}
      {inTrial && trialDaysRemaining > 0 && (
        <Link
          to="/dashboard/subscription"
          className={cn(
            'hidden sm:flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider',
            'border transition-all hover:scale-[1.02]'
          )}
          style={{
            background: 'rgba(251,191,36,0.08)',
            borderColor: 'rgba(251,191,36,0.35)',
            color: 'rgb(251,191,36)',
            boxShadow: '0 0 8px rgba(251,191,36,0.18)',
          }}
        >
          <Clock className="h-3 w-3 shrink-0" />
          {trialDaysRemaining}d trial
        </Link>
      )}

      {/* Plan chip */}
      <Link
        to="/dashboard/subscription"
        className={cn(
          'flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider',
          'border transition-all hover:scale-[1.02]'
        )}
        style={{
          background: 'rgba(0,229,255,0.08)',
          borderColor: 'rgba(0,229,255,0.35)',
          color: 'rgb(0,229,255)',
          boxShadow: '0 0 8px rgba(0,229,255,0.18)',
        }}
        title={`Current plan: ${tierInfo.label}`}
      >
        <Crown className="h-3 w-3 shrink-0" />
        <span className="hidden sm:inline">Current Plan: </span>
        <span>{tierInfo.label}</span>
      </Link>

      {/* Upgrade CTA — hidden when already on Elite */}
      {showUpgrade && (
        <Link
          to="/dashboard/subscription"
          className={cn(
            'hidden md:flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider',
            'border transition-all hover:scale-[1.02]'
          )}
          style={{
            background: 'linear-gradient(135deg, rgba(0,229,255,0.15), rgba(168,85,247,0.15))',
            borderColor: 'rgba(168,85,247,0.4)',
            color: 'rgb(216,180,254)',
            boxShadow: '0 0 10px rgba(168,85,247,0.25)',
          }}
        >
          <Sparkles className="h-3 w-3 shrink-0" />
          Upgrade
        </Link>
      )}
    </div>
  );
};
