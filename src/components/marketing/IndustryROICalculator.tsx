import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp } from 'lucide-react';
import { getIndustryRoiDefaults } from '@/lib/industryRoiDefaults';

// Canonical 4-tier model (monthly price)
const TIERS = [
  { id: 'core', name: 'Core', price: 497 },
  { id: 'boost', name: 'Boost', price: 897 },
  { id: 'pro', name: 'Pro', price: 1797 },
  { id: 'elite', name: 'Elite', price: 2997 },
] as const;

// Industry benchmarks (NextPhone 2026, Aura Intercept analysis)
const MISSED_CALL_RATE = 0.62;
const AI_RECOVERY_RATE = 0.38;
const AFTER_HOURS_LOSS_RATE = 0.55;
const NO_SHOW_RATE = 0.25;
const NO_SHOW_REDUCTION = 0.40;
const ADMIN_HOURLY_RATE = 22;
const ADMIN_HOURS_SAVED_PER_TECH_PER_MONTH = 6; // ~1.5/wk
const WORKING_DAYS_PER_MONTH = 22;
const CONVERSION_RATE = 0.55; // call → booked job

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

const fmtK = (n: number) => {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return fmt(n);
};

interface Props {
  industryId: string;
  industryLabel?: string;
}

export function IndustryROICalculator({ industryId, industryLabel }: Props) {
  const defaults = getIndustryRoiDefaults(industryId);
  const [technicians, setTechnicians] = useState(defaults.technicians);
  const [avgJobValue, setAvgJobValue] = useState(defaults.avgJobValue);
  const [callsPerDay, setCallsPerDay] = useState(defaults.callsPerDay);
  const [tierId, setTierId] = useState<string>('boost');

  // Reset to industry defaults when industry changes
  useEffect(() => {
    setTechnicians(defaults.technicians);
    setAvgJobValue(defaults.avgJobValue);
    setCallsPerDay(defaults.callsPerDay);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [industryId]);

  const tier = TIERS.find((t) => t.id === tierId) ?? TIERS[1];

  const calc = useMemo(() => {
    const monthlyCalls = callsPerDay * WORKING_DAYS_PER_MONTH;
    const missedCalls = monthlyCalls * MISSED_CALL_RATE;
    const recoveredCalls = missedCalls * AI_RECOVERY_RATE;
    const recoveredJobs = recoveredCalls * CONVERSION_RATE;
    const recoveredRevenue = recoveredJobs * avgJobValue;

    const afterHoursCalls = monthlyCalls * AFTER_HOURS_LOSS_RATE;
    const afterHoursJobs = afterHoursCalls * AI_RECOVERY_RATE * CONVERSION_RATE;
    const afterHoursRevenue = afterHoursJobs * avgJobValue;

    const monthlyBookings = monthlyCalls * CONVERSION_RATE;
    const noShows = monthlyBookings * NO_SHOW_RATE;
    const noShowsSaved = noShows * NO_SHOW_REDUCTION;
    const noShowRevenue = noShowsSaved * avgJobValue;

    const adminSavings = technicians * ADMIN_HOURS_SAVED_PER_TECH_PER_MONTH * ADMIN_HOURLY_RATE;

    const monthlyRoi = recoveredRevenue + afterHoursRevenue + noShowRevenue + adminSavings;
    const netMonthly = monthlyRoi - tier.price;
    const annual = monthlyRoi * 12;
    const multiple = tier.price > 0 ? monthlyRoi / tier.price : 0;

    return {
      recoveredRevenue,
      afterHoursRevenue,
      noShowRevenue,
      adminSavings,
      monthlyRoi,
      netMonthly,
      annual,
      multiple,
    };
  }, [technicians, avgJobValue, callsPerDay, tier]);

  const label = industryLabel?.toLowerCase() ?? 'business';

  return (
    <Card className="border-border/60">
      <CardHeader>
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          <CardTitle className="text-xl">What Aura is worth to your {label}</CardTitle>
        </div>
        <CardDescription>
          Adjust the inputs to match your business. Defaults are pre-set for typical {label} operations.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Inputs */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <InputCard
            label={defaults.technicianLabel}
            value={String(technicians)}
          >
            <Slider
              value={[technicians]}
              onValueChange={(v) => setTechnicians(v[0])}
              min={1}
              max={50}
              step={1}
            />
          </InputCard>

          <InputCard label={defaults.jobLabel} value={fmt(avgJobValue)}>
            <Slider
              value={[avgJobValue]}
              onValueChange={(v) => setAvgJobValue(v[0])}
              min={25}
              max={5000}
              step={25}
            />
          </InputCard>

          <InputCard label="Calls / day" value={String(callsPerDay)}>
            <Slider
              value={[callsPerDay]}
              onValueChange={(v) => setCallsPerDay(v[0])}
              min={3}
              max={100}
              step={1}
            />
          </InputCard>

          <InputCard label="Tier" value={`${fmt(tier.price)}/mo`}>
            <Select value={tierId} onValueChange={setTierId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIERS.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name} ({fmt(t.price)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </InputCard>
        </div>

        {/* Results */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <ResultCard label="Monthly ROI value" value={fmt(calc.monthlyRoi)} accent="primary" />
          <ResultCard label="Net monthly gain" value={fmt(calc.netMonthly)} accent="success" />
          <ResultCard label="Annual value" value={fmtK(calc.annual)} accent="warning" />
          <ResultCard
            label="ROI multiple"
            value={`${calc.multiple.toFixed(1)}×`}
            accent="destructive"
          />
        </div>

        {/* Breakdown */}
        <div className="rounded-lg border border-border/60 divide-y divide-border/60 overflow-hidden">
          <BreakdownRow label="Recovered missed call revenue" value={fmt(calc.recoveredRevenue)} />
          <BreakdownRow label="After-hours lead capture" value={fmt(calc.afterHoursRevenue)} />
          <BreakdownRow label="No-show reduction savings" value={fmt(calc.noShowRevenue)} />
          <BreakdownRow label="Admin time savings" value={fmt(calc.adminSavings)} />
        </div>

        <p className="text-xs text-muted-foreground rounded-md bg-muted/40 p-3 border border-border/50">
          Based on industry benchmarks: 62% missed call rate (NextPhone 2026), 38% recovery rate with AI,
          55% after-hours lead loss (Aura Intercept analysis), 25% no-show rate reduced by 40% with automated
          reminders, ${ADMIN_HOURLY_RATE}/hr admin savings. Actual results vary.
        </p>
      </CardContent>
    </Card>
  );
}

function InputCard({ label, value, children }: { label: string; value: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border/60 bg-card/40 p-3 space-y-2">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="pt-1">{children}</div>
      <div className="text-base font-semibold text-foreground">{value}</div>
    </div>
  );
}

function ResultCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: 'primary' | 'success' | 'warning' | 'destructive';
}) {
  const accentClass = {
    primary: 'text-primary bg-primary/5 border-primary/20',
    success: 'text-emerald-500 bg-emerald-500/5 border-emerald-500/20',
    warning: 'text-amber-500 bg-amber-500/5 border-amber-500/20',
    destructive: 'text-orange-500 bg-orange-500/5 border-orange-500/20',
  }[accent];
  return (
    <div className={`rounded-lg border p-3 ${accentClass}`}>
      <div className="text-xs font-medium opacity-80">{label}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
    </div>
  );
}

function BreakdownRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5 bg-card/30">
      <span className="text-sm text-foreground">{label}</span>
      <span className="text-sm font-semibold text-emerald-500">{value}/mo</span>
    </div>
  );
}

export default IndustryROICalculator;