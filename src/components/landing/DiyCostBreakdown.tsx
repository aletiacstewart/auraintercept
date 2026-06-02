import { Card, CardContent } from '@/components/ui/card';
import { Calculator, TrendingDown } from 'lucide-react';
import { DIY_BREAKDOWN, DIY_DISCLAIMER, type DiyTierBreakdown } from '@/lib/diyCostBreakdown';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

const range = (low: number, high: number) =>
  low === high ? fmt(low) : `${fmt(low)}–${fmt(high)}`;

const accentClass = (tierId: DiyTierBreakdown['tierId']) => {
  switch (tierId) {
    case 'core':
      return 'text-teal-400 border-teal-400/40';
    case 'boost':
      return 'text-cyan-400 border-cyan-400/40';
    case 'pro':
      return 'text-purple-400 border-purple-400/40';
    case 'elite':
      return 'text-amber-400 border-amber-400/40';
  }
};

export const DiyCostBreakdown = () => {
  return (
    <div className="mt-8 space-y-4">
      <div className="flex items-center gap-2 text-center justify-center">
        <Calculator className="w-5 h-5 text-primary" />
        <h3 className="text-xl font-bold text-white">
          What would it cost to build this yourself?
        </h3>
      </div>
      <p className="text-xs text-white/70 text-center max-w-3xl mx-auto">
        Comparable functionality assembled from individual SaaS tools, contractors, and one-time setup work.
        Aura replaces this stack at a single transparent price per tier.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        {DIY_BREAKDOWN.map((tier) => {
          const accent = accentClass(tier.tierId);
          return (
            <Card key={tier.tierId} className={`dark-card-surface border ${accent.split(' ')[1]}`}>
              <CardContent className="p-4 space-y-3">
                <div>
                  <div className={`text-sm font-bold ${accent.split(' ')[0]}`}>{tier.tierName}</div>
                  <div className="text-[11px] text-white/60">
                    Aura: <span className="font-semibold text-white">{fmt(tier.auraMonthly)}</span>/mo
                  </div>
                </div>

                <ul className="space-y-1.5 text-[11px] text-white/80">
                  {tier.items.map((it) => (
                    <li key={it.label} className="flex justify-between gap-2 leading-tight">
                      <span className="flex-1">
                        {it.label}
                        {it.oneTime && <span className="text-white/40"> (one-time)</span>}
                      </span>
                      <span className="text-white/70 whitespace-nowrap">{range(it.low, it.high)}</span>
                    </li>
                  ))}
                </ul>

                <div className="pt-2 border-t border-white/10 space-y-1 text-[11px]">
                  <div className="flex justify-between text-white">
                    <span className="font-semibold">DIY monthly:</span>
                    <span className="font-semibold">{range(tier.monthlyLow, tier.monthlyHigh)}</span>
                  </div>
                  {tier.oneTimeHigh > 0 && (
                    <div className="flex justify-between text-white/70">
                      <span>DIY one-time:</span>
                      <span>{range(tier.oneTimeLow, tier.oneTimeHigh)}</span>
                    </div>
                  )}
                  <div className={`flex items-center justify-between gap-2 mt-2 pt-2 border-t border-white/10 ${accent.split(' ')[0]} font-semibold`}>
                    <span className="flex items-center gap-1">
                      <TrendingDown className="w-3 h-3" />
                      vs Aura saves:
                    </span>
                    <span>{range(tier.savingsLow, tier.savingsHigh)}/mo</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <p className="text-[10px] italic text-white/50 text-center max-w-4xl mx-auto leading-relaxed">
        {DIY_DISCLAIMER}
      </p>
    </div>
  );
};

export default DiyCostBreakdown;