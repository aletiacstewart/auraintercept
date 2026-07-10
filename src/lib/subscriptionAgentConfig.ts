// Subscription tier types — 4-TIER STRUCTURE
// Internal names: starter, connect, performance, command
// Display names: Aura Core, Aura Boost, Aura Pro, Aura Elite
export type SubscriptionTier = 'free' | 'starter' | 'connect' | 'performance' | 'command';

import { LAUNCH_PRICING, formatPrice, getTierPricing } from './launchPricing';

// Pricing strings are derived from launchPricing.ts so beta pricing is a
// single source of truth. Never hardcode dollar amounts in this file.
const priceOf = (k: 'starter' | 'connect' | 'performance' | 'command') =>
  `${formatPrice(LAUNCH_PRICING.active ? getTierPricing(k).sale : getTierPricing(k).original)}/mo`;
const originalPriceOf = (k: 'starter' | 'connect' | 'performance' | 'command') =>
  `${formatPrice(getTierPricing(k).original)}/mo`;

// Configuration for each subscription tier
export interface TierConfig {
  agents: string[];
  consoles: string[];
  label: string;
  price: string;
  originalPrice?: string;
  description: string;
}

// IMPORTANT: Keep in sync with supabase/functions/ai-agent-chat/index.ts TIER_AGENTS
// Map subscription tiers to available consolidated operatives.
// Canonical IDs are the 10-operative model. Legacy 24-agent IDs (booking, lead,
// route, etc.) are accepted via LEGACY_AGENT_MAP and normalized before any tier
// check, so DB rows seeded with old IDs still light up the right operatives.
// 4 TIERS: Core (5) / Boost (7) / Pro (10) / Elite (10 + specialists)
export const TIER_AGENT_CONFIG: Record<SubscriptionTier, TierConfig> = {
  free: {
    agents: [],
    consoles: [],
    label: 'Free',
    price: '$0/mo',
    description: 'Limited access — upgrade to unlock AI operatives',
  },
  starter: {
    // Aura Core — pricing derived from launchPricing.ts: 5 consolidated operatives (8 underlying agents) + all 4 comms channels +
    // industry specialists (auto-activated by industry pack). 10 employees.
    agents: [
      'triage',
      'customer_journey',
      'outreach',
      'creative_content',
      'web_presence',
    ],
    consoles: [
      'customer_portal', 'marketing_sales', 'creative_web_presence',
      'social_media', 'analytics_reports', 'ai_operatives_hub',
    ],
    label: 'Aura Core',
    price: priceOf('starter'),
    originalPrice: originalPriceOf('starter'),
    description: 'Voice, SMS, email & web chat handled by 5 AI operatives — booking, follow-up, creative content & web presence included',
  },
  connect: {
    // Aura Boost — pricing derived from launchPricing.ts: Core + Field Operations agents (Dispatch + Route/ETA/Check-In). 25 employees.
    agents: [
      'triage',
      'customer_journey',
      'outreach',
      'creative_content',
      'web_presence',
      'dispatch',
      'field_navigation',
    ],
    consoles: [
      'customer_portal', 'marketing_sales', 'creative_web_presence',
      'social_media', 'field_operations', 'analytics_reports', 'ai_operatives_hub',
    ],
    label: 'Aura Boost',
    price: priceOf('connect'),
    originalPrice: originalPriceOf('connect'),
    description: 'Voice, SMS, email & web chat + 7 AI operatives with dispatch, routing & field operations',
  },
  performance: {
    // Aura Pro — pricing derived from launchPricing.ts: Boost + Business Finance + Analytics + Admin + Business Management Console.
    // 50 employees.
    agents: [
      'triage',
      'customer_journey',
      'outreach',
      'creative_content',
      'web_presence',
      'dispatch',
      'field_navigation',
      'business_finance',
      'analytics_intelligence',
      'admin',
    ],
    consoles: [
      'customer_portal', 'marketing_sales', 'creative_web_presence',
      'social_media', 'field_operations', 'analytics_reports',
      'business_management', 'ai_operatives_hub',
    ],
    label: 'Aura Pro',
    price: priceOf('performance'),
    originalPrice: originalPriceOf('performance'),
    description: '24 AI Operatives with business management, analytics & admin (industry specialists included on every plan)',
  },
  command: {
    // Aura Elite — pricing derived from launchPricing.ts: All 10 consolidated operatives + industry specialists,
    // all 7 consoles + AI Hub, unlimited employees.
    agents: [
      'triage',
      'customer_journey',
      'outreach',
      'creative_content',
      'web_presence',
      'dispatch',
      'field_navigation',
      'business_finance',
      'analytics_intelligence',
      'admin',
    ],
    consoles: ['customer_portal', 'field_operations', 'business_management', 'marketing_sales', 'social_media', 'creative_web_presence', 'analytics_reports', 'ai_operatives_hub'],
    label: 'Aura Elite',
    price: priceOf('command'),
    originalPrice: originalPriceOf('command'),
    description: '24 AI Operatives — full suite with predictive analytics & AI Hub',
  },
};

// Agent dependencies
export const AGENT_DEPENDENCIES: Record<string, string[]> = {
  customer_journey: ['triage'],
  dispatch: ['triage', 'customer_journey'],
  field_navigation: ['dispatch'],
  business_finance: [],
  web_presence: ['creative_content'],
  analytics_intelligence: [],
};

// Console to required agents mapping
export const CONSOLE_REQUIRED_AGENTS: Record<string, string[]> = {
  customer_portal: ['triage'],
  field_operations: ['dispatch'],
  business_management: ['business_finance'],
  marketing_sales: ['outreach'],
  social_media: ['creative_content'],
  creative_web_presence: ['creative_content'],
  analytics_reports: ['analytics_intelligence'],
  ai_operatives_hub: [],
};

// Tier hierarchy — 4-tier + free
export const TIER_HIERARCHY: Record<SubscriptionTier, number> = {
  free: 0,
  starter: 1,
  connect: 2,
  performance: 3,
  command: 4,
};

// Get the minimum tier required for a specific agent.
// Normalizes legacy agent IDs (booking/lead/route/etc.) to their consolidated
// operative before checking, so DB rows with old IDs still resolve correctly.
export function getRequiredTierForAgent(agentType: string): SubscriptionTier | null {
  const canonical = normalizeAgentName(agentType);
  const tiers: SubscriptionTier[] = ['starter', 'connect', 'performance', 'command'];
  for (const tier of tiers) {
    if (TIER_AGENT_CONFIG[tier].agents.includes(canonical)) return tier;
  }
  return null;
}

// Get the minimum tier required for a specific console
export function getRequiredTierForConsole(consoleType: string): SubscriptionTier | null {
  const tiers: SubscriptionTier[] = ['starter', 'connect', 'performance', 'command'];
  for (const tier of tiers) {
    if (TIER_AGENT_CONFIG[tier].consoles.includes(consoleType)) return tier;
  }
  return null;
}

export function tierIncludesAgent(tier: SubscriptionTier, agentType: string): boolean {
  const canonical = normalizeAgentName(agentType);
  return TIER_AGENT_CONFIG[tier]?.agents.includes(canonical) ?? false;
}

export function tierIncludesConsole(tier: SubscriptionTier, consoleType: string): boolean {
  return TIER_AGENT_CONFIG[tier]?.consoles.includes(consoleType) ?? false;
}

export function getAgentsForTier(tier: SubscriptionTier): string[] {
  return TIER_AGENT_CONFIG[tier]?.agents ?? [];
}

export function getConsolesForTier(tier: SubscriptionTier): string[] {
  return TIER_AGENT_CONFIG[tier]?.consoles ?? [];
}

export function getAgentDependencies(agentType: string): string[] {
  return AGENT_DEPENDENCIES[agentType] ?? [];
}

export function getConsoleRequiredAgents(consoleType: string): string[] {
  return CONSOLE_REQUIRED_AGENTS[consoleType] ?? [];
}

export function getTierDisplayInfo(tier: SubscriptionTier): { label: string; price: string; description: string } {
  const config = TIER_AGENT_CONFIG[tier];
  return {
    label: config?.label ?? 'Unknown',
    price: config?.price ?? '$0/mo',
    description: config?.description ?? '',
  };
}

export function getUpgradeTierForAgent(currentTier: SubscriptionTier, agentType: string): SubscriptionTier | null {
  const canonical = normalizeAgentName(agentType);
  const tiers: SubscriptionTier[] = ['starter', 'connect', 'performance', 'command'];
  const currentIndex = tiers.indexOf(currentTier);
  if (currentTier === 'command') return null;
  for (let i = Math.max(0, currentIndex + 1); i < tiers.length; i++) {
    if (TIER_AGENT_CONFIG[tiers[i]].agents.includes(canonical)) return tiers[i];
  }
  return null;
}

export function isTierAtLeast(currentTier: SubscriptionTier, requiredTier: SubscriptionTier): boolean {
  return TIER_HIERARCHY[currentTier] >= TIER_HIERARCHY[requiredTier];
}

export const TIER_FEATURE_CONFIG: Record<SubscriptionTier, string[]> = {
  free: [],
  starter: [
    'can_access_appointments',
    'can_access_customers',
    'can_access_leads',
    'can_access_campaigns',
    'can_access_field_ops',
    'can_access_analytics',
    'api_access',
  ],
  connect: [
    'can_access_appointments',
    'can_access_customers',
    'can_access_leads',
    'can_access_campaigns',
    'can_access_field_ops',
    'can_access_analytics',
    'api_access',
  ],
  performance: [
    'can_access_appointments',
    'can_access_customers',
    'can_access_quotes',
    'can_access_invoices',
    'can_access_inventory',
    'can_access_leads',
    'can_access_field_ops',
    'can_access_analytics',
    'can_access_campaigns',
    'api_access',
  ],
  command: [
    'can_access_appointments',
    'can_access_customers',
    'can_access_quotes',
    'can_access_leads',
    'can_access_invoices',
    'can_access_field_ops',
    'can_access_inventory',
    'can_access_campaigns',
    'can_access_analytics',
    'can_access_warranties',
    'api_access',
  ],
};

export function getRequiredTierForFeature(featureField: string): SubscriptionTier | null {
  const tiers: SubscriptionTier[] = ['starter', 'connect', 'performance', 'command'];
  for (const tier of tiers) {
    if (TIER_FEATURE_CONFIG[tier].includes(featureField)) return tier;
  }
  return null;
}

export function tierIncludesFeature(tier: SubscriptionTier, featureField: string): boolean {
  return TIER_FEATURE_CONFIG[tier]?.includes(featureField) ?? false;
}

// ============================================
// LEGACY TIER MAPS — backward compatibility
// ============================================

// Maps any legacy/old/external tier name → current 4-tier internal ID
export const LEGACY_TIER_MAP: Record<string, SubscriptionTier> = {
  // Old docConfig IDs
  'express': 'starter',
  'aura_flow': 'starter',
  'halo': 'starter',
  'core': 'starter',
  'single_point': 'performance',
  'multi_track': 'performance',
  // Old subscriptionAgentConfig names
  'scheduling': 'starter',
  'business': 'connect',
  // Legacy 5-tier names → 4-tier
  'growth': 'connect',
  'field_ops': 'performance',
  // Already-canonical names (self-map for safety)
  'starter': 'starter',
  'connect': 'connect',
  'performance': 'performance',
  'command': 'command',
  // Supabase DB values
  'aura_starter': 'starter',
  'aura_connect': 'connect',
  'aura_growth': 'connect',
  // New display name aliases
  'aura_core': 'starter',
  'aura_boost': 'connect',
  'aura_pro': 'performance',
  'aura_elite': 'command',
};

export function normalizeTierName(tier: string): SubscriptionTier {
  return LEGACY_TIER_MAP[tier] ?? (tier as SubscriptionTier);
}

// Legacy agent name mapping — maps old granular agent names to consolidated operatives
export const LEGACY_AGENT_MAP: Record<string, string> = {
  // Reception / intake variants
  'receptionist': 'triage',
  'emergency': 'triage',
  'intake': 'triage',
  'faq': 'triage',
  'booking': 'customer_journey',
  'followup': 'customer_journey',
  'review': 'customer_journey',
  'route': 'field_navigation',
  'eta': 'field_navigation',
  'checkin': 'field_navigation',
  'quoting': 'business_finance',
  'invoice': 'business_finance',
  'inventory': 'business_finance',
  'estimate': 'business_finance',
  'payments': 'business_finance',
  'campaign': 'outreach',
  'lead': 'outreach',
  'marketing': 'outreach',
  'insights': 'analytics_intelligence',
  'revenue': 'analytics_intelligence',
  'forecast': 'analytics_intelligence',
  'analytics': 'analytics_intelligence',
  'creative': 'creative_content',
  'social_content': 'creative_content',
  'social_scheduler': 'creative_content',
  'social_analytics': 'creative_content',
};

export function normalizeAgentName(agentType: string): string {
  return LEGACY_AGENT_MAP[agentType] ?? agentType;
}

// === INDUSTRY SPECIALIST OPERATIVES ===
// 4 specialist agents enabled per-industry via industry_template_packs.extra_operatives.
// Always require Performance ($2,788) tier minimum (or trial). They never appear in TIER_AGENT_CONFIG
// because they are opted-in by industry pack rather than by tier alone.
export const INDUSTRY_SPECIALIST_OPERATIVES = [
  // Field/repair specialists (existing)
  'diagnostic', 'permit_code', 'site_survey', 'insurance_claim',
  // Real Estate
  'listing_writer', 'offer_drafter', 'comp_analyst',
  // Beauty & Wellness
  'style_consultant', 'loyalty_coach',
  // Restaurants
  'menu_writer', 'reservation_optimizer',
  // Personal Assistant
  'task_triager', 'calendar_optimizer',
  // Universal booking-first
  'review_responder',
] as const;

export type IndustrySpecialistOperative = typeof INDUSTRY_SPECIALIST_OPERATIVES[number];

export const SPECIALIST_LABELS: Record<IndustrySpecialistOperative, string> = {
  diagnostic: 'Diagnostic',
  permit_code: 'Permit & Code',
  site_survey: 'Site Survey & Quote',
  insurance_claim: 'Insurance Claim',
  listing_writer: 'Listing Writer',
  offer_drafter: 'Offer Drafter',
  comp_analyst: 'Comp Analyst',
  style_consultant: 'Style Consultant',
  loyalty_coach: 'Loyalty Coach',
  menu_writer: 'Menu Writer',
  reservation_optimizer: 'Reservation Optimizer',
  task_triager: 'Task Triager',
  calendar_optimizer: 'Calendar Optimizer',
  review_responder: 'Review Responder',
};

export const SPECIALIST_DESCRIPTIONS: Record<IndustrySpecialistOperative, string> = {
  diagnostic: 'Photo + symptom analysis with likely-fix suggestions and parts recommendations.',
  permit_code: 'Local code lookups, permit determinations, and pull-process guidance.',
  site_survey: 'Pre-install survey workflow, measurements, and takeoff math.',
  insurance_claim: 'Damage documentation and claim-ready reports for carriers.',
  listing_writer: 'Drafts listing descriptions, headlines, and feature highlights from property data.',
  offer_drafter: 'Composes offer letters, counter-offers, and contingency language for review.',
  comp_analyst: 'Pulls comparable sales and rentals, summarizes pricing position.',
  style_consultant: 'Suggests cuts, colors, and treatments based on client photo + history.',
  loyalty_coach: 'Identifies repeat-visit risk and drafts personalized rebook outreach.',
  menu_writer: 'Drafts menu copy, daily specials, and dietary callouts in your brand voice.',
  reservation_optimizer: 'Reshuffles bookings to maximize covers and minimize gaps.',
  task_triager: 'Sorts inbound client tasks by urgency, owner, and due date.',
  calendar_optimizer: 'Suggests slot consolidation and travel-time-aware scheduling fixes.',
  review_responder: 'Drafts on-brand responses to new reviews across Google, Yelp, and Facebook.',
};

export function isSpecialistOperative(agentType: string): agentType is IndustrySpecialistOperative {
  return (INDUSTRY_SPECIALIST_OPERATIVES as readonly string[]).includes(agentType);
}

// Specialist operatives are industry-specific and available on ALL plans
// (including the 60-Day Live Trial). Activation is driven by the industry pack, not by tier.
export const SPECIALIST_MIN_TIER: SubscriptionTier = 'free';

export function getSpecialistRequiredTier(): SubscriptionTier {
  return SPECIALIST_MIN_TIER;
}

export function tierAllowsSpecialists(_tier: SubscriptionTier): boolean {
  // Specialist operatives ship with every plan since they are industry-specific.
  return true;
}
