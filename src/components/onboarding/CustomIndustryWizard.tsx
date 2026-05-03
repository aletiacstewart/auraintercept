import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

/**
 * "Other / Custom" industry wizard — collects the three things the workspace
 * resolver needs to draft a usable industry_config when none of the 18 verticals
 * fit:
 *   1) what the business primarily schedules / sells / delivers
 *   2) who their customer is
 *   3) the key actions the AI Front Desk should know how to handle
 *
 * Returns its state via onChange so the parent (Auth signup) can inline-render it.
 */
export interface CustomIndustryConfig {
  primary_offering: string;
  customer_type: string;
  key_actions: string;
  /** When set, signup will create the company with this preset industry slug. */
  preset_industry?: string;
  /** Required acknowledgement for healthcare verticals. */
  hipaa_acknowledged?: boolean;
}

interface Props {
  value: CustomIndustryConfig;
  onChange: (next: CustomIndustryConfig) => void;
}

const HEALTHCARE_PRESETS: { slug: string; label: string }[] = [
  { slug: 'dental', label: 'Dental Practice' },
  { slug: 'chiropractic', label: 'Chiropractic' },
  { slug: 'medical_office', label: 'Medical Office' },
  { slug: 'veterinary', label: 'Veterinary' },
  { slug: 'physical_therapy', label: 'Physical Therapy' },
  { slug: 'optometry', label: 'Optometry' },
];

export function CustomIndustryWizard({ value, onChange }: Props) {
  const set = (k: keyof CustomIndustryConfig, v: string) =>
    onChange({ ...value, [k]: v });
  const isHealthcare =
    !!value.preset_industry && HEALTHCARE_PRESETS.some((p) => p.slug === value.preset_industry);

  return (
    <div className="space-y-3 rounded-lg border border-border/50 bg-card/40 p-3">
      <p className="text-xs text-muted-foreground">
        We use these three answers to draft your industry settings — Aura's
        agents, console layout, and scripts adapt to match.
      </p>

      <div className="space-y-1">
        <Label className="text-xs">Healthcare practice? Pick one to skip the questions:</Label>
        <div className="flex flex-wrap gap-1">
          {HEALTHCARE_PRESETS.map((p) => {
            const active = value.preset_industry === p.slug;
            return (
              <button
                key={p.slug}
                type="button"
                onClick={() =>
                  onChange({
                    ...value,
                    preset_industry: active ? undefined : p.slug,
                    hipaa_acknowledged: active ? false : value.hipaa_acknowledged,
                  })
                }
                className={cn(
                  'rounded-full border px-2.5 py-1 text-[10px] transition',
                  active
                    ? 'border-primary bg-primary/15 text-primary'
                    : 'border-border/60 bg-background hover:border-primary/50',
                )}
              >
                {p.label}
              </button>
            );
          })}
        </div>
        {isHealthcare && (
          <div className="mt-2 rounded-md border border-amber-500/40 bg-amber-500/5 p-2 space-y-1.5">
            <p className="text-[10px] leading-relaxed text-amber-300">
              <strong>HIPAA scope:</strong> Aura is used as an AI receptionist for appointments
              and insurance intake only. It does not handle medical records, prescriptions, or
              clinical advice. Interactions are logged for compliance.
            </p>
            <label className="flex items-start gap-2 text-[10px] text-amber-200 cursor-pointer">
              <Checkbox
                checked={!!value.hipaa_acknowledged}
                onCheckedChange={(c) =>
                  onChange({ ...value, hipaa_acknowledged: c === true })
                }
                className="mt-0.5"
              />
              <span>I acknowledge this scope and will keep clinical/PHI workflows out of Aura.</span>
            </label>
          </div>
        )}
      </div>

      <div className="space-y-1">
        <Label className="text-xs">1. What do you primarily schedule, sell, or deliver?</Label>
        <Input
          placeholder="e.g. Mobile dog grooming sessions"
          value={value.primary_offering}
          onChange={(e) => set('primary_offering', e.target.value)}
          className="text-xs h-8"
        />
      </div>

      <div className="space-y-1">
        <Label className="text-xs">2. Who is your typical customer?</Label>
        <Input
          placeholder="e.g. Busy pet owners in suburban neighborhoods"
          value={value.customer_type}
          onChange={(e) => set('customer_type', e.target.value)}
          className="text-xs h-8"
        />
      </div>

      <div className="space-y-1">
        <Label className="text-xs">3. What 2–4 actions should your AI Front Desk handle?</Label>
        <Textarea
          placeholder="e.g. Book a grooming visit, quote a price, send our service area, take a message"
          value={value.key_actions}
          onChange={(e) => set('key_actions', e.target.value)}
          className="text-xs min-h-[64px]"
        />
      </div>
    </div>
  );
}

export const EMPTY_CUSTOM_INDUSTRY: CustomIndustryConfig = {
  primary_offering: '',
  customer_type: '',
  key_actions: '',
};

/** Convert the wizard state into the JSON shape stored on companies.industry_config. */
export function buildIndustryConfig(c: CustomIndustryConfig): Record<string, unknown> {
  const description = [
    c.primary_offering && `Offers: ${c.primary_offering}`,
    c.customer_type && `For: ${c.customer_type}`,
  ]
    .filter(Boolean)
    .join('. ');

  const actions = c.key_actions
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => s.toLowerCase().replace(/\s+/g, '_').slice(0, 40));

  return {
    description,
    primary_offering: c.primary_offering,
    customer_type: c.customer_type,
    key_actions: actions,
    agent_actions: actions.length
      ? { customer_journey: actions }
      : undefined,
    prompt_overrides: description
      ? { tone: `Adapt language for: ${description}` }
      : undefined,
  };
}