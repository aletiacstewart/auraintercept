// Subscription tier types — 4-TIER STRUCTURE
// Internal names: starter, connect, performance, command
export type SubscriptionTier = 'free' | 'starter' | 'connect' | 'performance' | 'command';

// Configuration for each subscription tier
export interface TierConfig {
  agents: string[];
  consoles: string[];
  label: string;
  price: string;
  description: string;
}

// IMPORTANT: Keep in sync with supabase/functions/ai-agent-chat/index.ts TIER_AGENTS
// Map subscription tiers to available agents and consoles
// 4 TIERS
export const TIER_AGENT_CONFIG: Record<SubscriptionTier, TierConfig> = {
  free: {
    agents: [],
    consoles: [],
    label: 'Free',
    price: '$0/mo',
    description: 'Limited access — upgrade to unlock AI operatives',
  },
  starter: {
    // Aura Starter ($197/mo): 4 operatives, 3 consoles, 10 employees
    agents: [
      'triage',              // AI Receptionist
      'customer_journey',    // Booking + Follow-Up
      'creative_content',    // Creative Content Agent
      'outreach',            // Marketing/Outreach (limited)
    ],
    consoles: ['customer_portal', 'marketing_sales', 'creative_web_presence'],
    label: 'Aura Starter',
    price: '$197/mo',
    description: 'AI answering, booking, follow-up, and creative content for solo operators',
  },
  connect: {
    // Aura Connect ($497/mo): 7 operatives, 5 consoles, 25 employees
    agents: [
      'triage',              // AI Receptionist
      'customer_journey',    // Booking + Follow-Up + Review
      'outreach',            // Campaign, Lead, Marketing
      'creative_content',    // Creative Content Agent
      'web_presence',        // Web Presence Agent
      'dispatch',            // Dispatch Agent
      'field_navigation',    // Route Agent
    ],
    consoles: ['customer_portal', 'marketing_sales', 'creative_web_presence', 'social_media', 'field_operations'],
    label: 'Aura Connect',
    price: '$497/mo',
    description: 'Full field dispatch, routing, web presence, and marketing for service teams',
  },
  performance: {
    // Aura Performance ($997/mo): 9 operatives, 6 consoles, 50 employees
    agents: [
      'triage', 'customer_journey',              // Customer Portal (2)
      'outreach',                                // Outreach & Sales (1)
      'creative_content', 'web_presence',        // Creative & Web Presence (2)
      'dispatch', 'field_navigation',            // Field Operations (2)
      'business_finance',                        // Business Finance (1)
      'admin',                                   // Admin Agent (1)
    ],
    consoles: ['customer_portal', 'marketing_sales', 'social_media', 'creative_web_presence', 'field_operations', 'business_management'],
    label: 'Aura Performance',
    price: '$997/mo',
    description: 'Full business management with quoting, invoicing, inventory, and white-label branding',
  },
  command: {
    // Aura Command ($1,997/mo): All 10+ operatives, all 7 consoles + AI Hub, unlimited employees
    agents: [
      'triage', 'customer_journey',              // Customer Portal (2)
      'dispatch', 'field_navigation',            // Field Operations (2)
      'admin', 'business_finance',               // Business Operations (2)
      'outreach',                                // Outreach & Sales (1)
      'creative_content', 'web_presence',        // Creative & Web Presence (2)
      'analytics_intelligence',                  // Analytics & Reports (1)
    ],
    consoles: ['customer_portal', 'field_operations', 'business_management', 'marketing_sales', 'social_media', 'creative_web_presence', 'analytics_reports', 'ai_operatives_hub'],
    label: 'Aura Command',
    price: '$1,997/mo',
    description: 'Enterprise AI operating system with predictive analytics, AI Hub, and unlimited employees',
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

// Get the minimum tier required for a specific agent
export function getRequiredTierForAgent(agentType: string): SubscriptionTier | null {
  const tiers: SubscriptionTier[] = ['starter', 'connect', 'performance', 'command'];
  for (const tier of tiers) {
    if (TIER_AGENT_CONFIG[tier].agents.includes(agentType)) return tier;
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
  return TIER_AGENT_CONFIG[tier]?.agents.includes(agentType) ?? false;
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
  const tiers: SubscriptionTier[] = ['starter', 'connect', 'performance', 'command'];
  const currentIndex = tiers.indexOf(currentTier);
  if (currentTier === 'command') return null;
  for (let i = Math.max(0, currentIndex + 1); i < tiers.length; i++) {
    if (TIER_AGENT_CONFIG[tiers[i]].agents.includes(agentType)) return tiers[i];
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
    'api_access',
  ],
  connect: [
    'can_access_appointments',
    'can_access_customers',
    'can_access_leads',
    'can_access_campaigns',
    'can_access_field_ops',
    'api_access',
  ],
  performance: [
    'can_access_appointments',
    'can_access_customers',
    'can_access_quotes',
    'can_access_leads',
    'can_access_invoices',
    'can_access_field_ops',
    'can_access_inventory',
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
};

export function normalizeTierName(tier: string): SubscriptionTier {
  return LEGACY_TIER_MAP[tier] ?? (tier as SubscriptionTier);
}

// Legacy agent name mapping — maps old granular agent names to consolidated operatives
export const LEGACY_AGENT_MAP: Record<string, string> = {
  'booking': 'customer_journey',
  'followup': 'customer_journey',
  'review': 'customer_journey',
  'route': 'field_navigation',
  'eta': 'field_navigation',
  'checkin': 'field_navigation',
  'quoting': 'business_finance',
  'invoice': 'business_finance',
  'inventory': 'business_finance',
  'campaign': 'outreach',
  'lead': 'outreach',
  'marketing': 'outreach',
  'insights': 'analytics_intelligence',
  'revenue': 'analytics_intelligence',
  'forecast': 'analytics_intelligence',
  'creative': 'creative_content',
  'social_content': 'creative_content',
  'social_scheduler': 'creative_content',
  'social_analytics': 'creative_content',
};

export function normalizeAgentName(agentType: string): string {
  return LEGACY_AGENT_MAP[agentType] ?? agentType;
}
