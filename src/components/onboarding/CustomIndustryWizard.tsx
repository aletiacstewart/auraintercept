import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

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
}

interface Props {
  value: CustomIndustryConfig;
  onChange: (next: CustomIndustryConfig) => void;
}

export function CustomIndustryWizard({ value, onChange }: Props) {
  const set = (k: keyof CustomIndustryConfig, v: string) =>
    onChange({ ...value, [k]: v });

  return (
    <div className="space-y-3 rounded-lg border border-border/50 bg-card/40 p-3">
      <p className="text-xs text-muted-foreground">
        We use these three answers to draft your industry settings — Aura's
        agents, console layout, and scripts adapt to match.
      </p>

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