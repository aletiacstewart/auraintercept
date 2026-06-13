import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, X, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface BetaCodeResult {
  code: string;
  label: string | null;
  trial_days: number;
  waive_onboarding_fee: boolean;
  onboarding_fee_cap_cents?: number | null;
  onboarding_cap_expires_at?: string | null;
}

interface Props {
  onApplied: (result: BetaCodeResult | null) => void;
  applied: BetaCodeResult | null;
  className?: string;
}

/** Beta invite code redeemer used in signup + checkout flows. */
export function BetaCodeInput({ onApplied, applied, className }: Props) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const handleApply = async () => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('validate_beta_code', { p_code: trimmed });
      const row = Array.isArray(data) ? data[0] : data;
      if (error || !row?.valid) {
        toast.error(row?.message || 'Invalid invite code');
        return;
      }
      onApplied({
        code: trimmed,
        label: row.label ?? null,
        trial_days: row.trial_days ?? 60,
        waive_onboarding_fee: !!row.waive_onboarding_fee,
        onboarding_fee_cap_cents: row.onboarding_fee_cap_cents ?? null,
        onboarding_cap_expires_at: row.onboarding_cap_expires_at ?? null,
      });
      toast.success(`Beta access unlocked — ${row.trial_days || 60}-day free trial`);
      setCode('');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to validate code');
    } finally {
      setLoading(false);
    }
  };

  if (applied) {
    const onboardingLine = applied.waive_onboarding_fee
      ? 'Beta Onboarding: FREE'
      : 'Beta onboarding = 50% of monthly (per tier)';
    return (
      <div className={className}>
        <div className="flex items-center justify-between gap-2 rounded-lg border border-primary/40 bg-primary/10 px-3 py-2">
          <div className="flex items-center gap-2 min-w-0">
            <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
            <div className="min-w-0">
              <div className="text-sm font-semibold text-foreground truncate">
                {applied.code} applied
              </div>
              <div className="text-[11px] text-muted-foreground">
                {applied.trial_days}-day free trial · {onboardingLine}
              </div>
            </div>
          </div>
          <Badge variant="secondary" className="border-primary/40">
            <Sparkles className="w-3 h-3 mr-1" /> BETA
          </Badge>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onApplied(null)}
            aria-label="Remove beta code"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        className={`text-xs text-primary hover:underline ${className || ''}`}
        onClick={() => setOpen(true)}
      >
        Have a beta invite code?
      </button>
    );
  }

  return (
    <div className={`flex gap-2 ${className || ''}`}>
      <Input
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="BETA-XXXX-XXXX"
        className="font-mono uppercase"
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            handleApply();
          }
        }}
      />
      <Button type="button" onClick={handleApply} disabled={loading || !code.trim()} variant="secondary">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
      </Button>
    </div>
  );
}

export default BetaCodeInput;