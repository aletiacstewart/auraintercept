/**
 * Industry quick-start configuration.
 *
 * The canonical source is the `quickstart` column on `industry_template_packs`
 * (one row per vertical, 28 active packs). This module only supplies the
 * per-cluster fallbacks used when a pack has not been populated yet, plus the
 * resolver that merges the two.
 *
 * Do NOT add a parallel hardcoded industry list here — packs stay the single
 * source of truth for vertical behaviour.
 */

export type IndustryCluster = 'trades' | 'outdoor' | 'repair' | 'booking' | 'home_health';

/** Feature areas a vertical cares about. Used for soft ordering/emphasis. */
export type FeatureKey =
  | 'scheduling'
  | 'field_ops'
  | 'quotes'
  | 'invoicing'
  | 'inventory'
  | 'payments'
  | 'sms'
  | 'customer_portal'
  | 'marketing'
  | 'reviews';

/** Connection keys shared with `src/lib/integrationConfig.ts`. */
export type IntegrationKey = 'calendar' | 'sms' | 'voice' | 'email' | 'payments' | 'social' | 'crm';

export interface IndustryQuickstart {
  features_enabled: FeatureKey[];
  recommended_agents: string[];
  required_integrations: IntegrationKey[];
  onboarding_message: string;
  sample_workflow: string;
}

export const CLUSTER_QUICKSTARTS: Record<IndustryCluster, IndustryQuickstart> = {
  trades: {
    features_enabled: ['scheduling', 'field_ops', 'quotes', 'invoicing', 'inventory', 'payments', 'sms', 'customer_portal'],
    recommended_agents: ['booking', 'field_navigation', 'customer_followup'],
    required_integrations: ['calendar', 'sms', 'voice'],
    onboarding_message: 'Service businesses run on fast booking, clean dispatch and same-day quotes.',
    sample_workflow: 'Customer calls -> Aura books it -> Tech dispatched -> Customer texted -> Invoice sent',
  },
  outdoor: {
    features_enabled: ['scheduling', 'field_ops', 'quotes', 'invoicing', 'payments', 'sms', 'customer_portal', 'marketing', 'reviews'],
    recommended_agents: ['booking', 'field_navigation', 'customer_followup'],
    required_integrations: ['calendar', 'sms', 'voice'],
    onboarding_message: 'Outdoor work starts with a site visit, so Aura focuses on estimates, crew scheduling and follow-up.',
    sample_workflow: 'Enquiry -> Site visit booked -> Estimate sent -> Crew scheduled -> Follow-up for the next season',
  },
  repair: {
    features_enabled: ['scheduling', 'field_ops', 'quotes', 'invoicing', 'inventory', 'payments', 'sms', 'customer_portal', 'marketing', 'reviews'],
    recommended_agents: ['booking', 'field_navigation', 'business_finance'],
    required_integrations: ['calendar', 'sms', 'voice'],
    onboarding_message: 'Repair shops need quick intake, parts tracking and on-site invoicing.',
    sample_workflow: 'Customer calls -> Job booked -> Parts checked -> Repair completed -> Paid on site',
  },

  booking: {
    features_enabled: ['scheduling', 'customer_portal', 'sms', 'payments', 'marketing', 'reviews'],
    recommended_agents: ['booking', 'customer_service', 'outreach'],
    required_integrations: ['calendar', 'sms'],
    onboarding_message: 'Appointment businesses live on a full calendar, easy rebooking and steady reviews.',
    sample_workflow: 'Client books online -> Auto-confirmed -> Reminder sent -> Visit completed -> Review request',
  },
  home_health: {
    features_enabled: ['scheduling', 'field_ops', 'customer_portal', 'sms', 'invoicing', 'payments'],
    recommended_agents: ['booking', 'customer_service', 'customer_followup'],
    required_integrations: ['calendar', 'sms', 'voice'],
    onboarding_message: 'Care providers need reliable visit scheduling, caregiver coordination and clear family updates.',
    sample_workflow: 'Intake call -> Visit scheduled -> Caregiver assigned -> Family updated -> Billing prepared',
  },
};

interface PackLike {
  cluster?: string | null;
  label?: string | null;
  quickstart?: Partial<IndustryQuickstart> | null;
}

/**
 * Merges a pack's stored quickstart over its cluster defaults so every
 * vertical always resolves to a complete configuration.
 */
export function resolveQuickstart(pack: PackLike | null | undefined): IndustryQuickstart {
  const cluster = (pack?.cluster as IndustryCluster) || 'trades';
  const base = CLUSTER_QUICKSTARTS[cluster] ?? CLUSTER_QUICKSTARTS.trades;
  const stored = pack?.quickstart ?? {};
  return {
    features_enabled: stored.features_enabled?.length ? stored.features_enabled : base.features_enabled,
    recommended_agents: stored.recommended_agents?.length ? stored.recommended_agents : base.recommended_agents,
    required_integrations: stored.required_integrations?.length
      ? stored.required_integrations
      : base.required_integrations,
    onboarding_message: stored.onboarding_message || base.onboarding_message,
    sample_workflow: stored.sample_workflow || base.sample_workflow,
  };
}
