// Subscription tier types matching the database enum
export type SubscriptionTier = 'free' | 'core' | 'halo' | 'single_point' | 'multi_track' | 'command';

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
export const TIER_AGENT_CONFIG: Record<SubscriptionTier, TierConfig> = {
  free: {
    agents: [],
    consoles: [],
    label: 'Free',
    price: '$0/mo',
    description: 'Limited access - upgrade to unlock AI agents',
  },
  core: {
    // Core: Talk to Aura only (no agents), Social Media Signal + Web Presence included
    agents: [],
    consoles: [],
    label: 'Core',
    price: '$500/mo',
    description: 'Talk to Aura + Social Media Signal + Web Presence',
  },
  halo: {
    // Aura Halo ($397/mo): AI Receptionist + Scheduling + Follow-up for salons/wellness
    agents: ['triage', 'booking', 'followup'],
    consoles: ['customer_portal'],
    label: 'Aura Halo',
    price: '$397/mo',
    description: 'AI Receptionist, Scheduling, Voice & SMS/Email for salons & wellness',
  },
  single_point: {
    // Voice AI (chat + outbound calling) included, but NO booking (call to book)
    agents: ['triage', 'followup', 'review'],
    consoles: ['customer_portal'],
    label: 'Single-Point',
    price: '$497/mo',
    description: 'Customer engagement + AI Voice',
  },
  multi_track: {
    // Adds booking, field ops, and quoting/invoicing
    agents: [
      'triage', 'booking', 'followup', 'review',
      'dispatch', 'route', 'eta', 'checkin',
      'quoting', 'invoice'
    ],
    consoles: ['customer_portal', 'field_operations'],
    label: 'Multi-Track',
    price: '$897/mo',
    description: 'Customer + Field operations + Online booking',
  },
  command: {
    // IMPORTANT: Keep in sync with supabase/functions/ai-agent-chat/index.ts TIER_AGENTS
    // 23 Total Agents: 4 Customer Portal + 4 Field Ops + 5 Business Ops + 3 Marketing + 3 Social Media Signal + 4 Analytics
    agents: [
      // Customer Portal (4)
      'triage', 'booking', 'followup', 'review',
      // Field Operations (4)
      'dispatch', 'route', 'eta', 'checkin',
      // Business Operations (5)
      'admin', 'quoting', 'invoice', 'inventory', 'warranty',
      // Marketing & Sales (3)
      'campaign', 'lead', 'promo',
      // Social Media Signal (3)
      'social_content', 'social_scheduler', 'social_analytics',
      // Analytics & Reports (4)
      'insights', 'performance', 'revenue', 'forecast'
    ],
    consoles: ['customer_portal', 'field_operations', 'business_management', 'marketing_sales', 'social_media', 'analytics_reports'],
    label: 'Aura Pro Command',
    price: '$1,497/mo',
    description: 'Full business automation suite',
  },
};

// Agent dependencies - some agents require others to work properly
// IMPORTANT: Keep in sync with supabase/functions/ai-agent-chat/index.ts
export const AGENT_DEPENDENCIES: Record<string, string[]> = {
  booking: ['triage'],
  // followup and review now depend on triage (not booking) so Single-Point can use them
  followup: ['triage'],
  review: ['triage'],
  route: ['dispatch'],
  eta: ['dispatch', 'route'],
  checkin: ['dispatch'],
  invoice: ['quoting'],
  performance: ['insights'],
  revenue: ['insights'],
  forecast: ['insights', 'revenue'],
  // Social media agent dependencies
  social_scheduler: ['social_content'],
  social_analytics: ['social_content'],
};

// Console to required agents mapping - consoles need these agents enabled to work
export const CONSOLE_REQUIRED_AGENTS: Record<string, string[]> = {
  customer_portal: ['triage'],
  field_operations: ['dispatch'],
  business_management: ['admin', 'quoting'],
  marketing_sales: ['campaign'],
  social_media: ['social_content'],
  analytics_reports: ['insights'],
};

// Get the minimum tier required for a specific agent
export function getRequiredTierForAgent(agentType: string): SubscriptionTier | null {
  const tiers: SubscriptionTier[] = ['core', 'halo', 'single_point', 'multi_track', 'command'];
  
  for (const tier of tiers) {
    if (TIER_AGENT_CONFIG[tier].agents.includes(agentType)) {
      return tier;
    }
  }
  
  return null; // Agent not found in any tier
}

// Get the minimum tier required for a specific console
export function getRequiredTierForConsole(consoleType: string): SubscriptionTier | null {
  const tiers: SubscriptionTier[] = ['core', 'halo', 'single_point', 'multi_track', 'command'];
  
  for (const tier of tiers) {
    if (TIER_AGENT_CONFIG[tier].consoles.includes(consoleType)) {
      return tier;
    }
  }
  
  return null;
}

// Check if a tier includes access to a specific agent
export function tierIncludesAgent(tier: SubscriptionTier, agentType: string): boolean {
  return TIER_AGENT_CONFIG[tier]?.agents.includes(agentType) ?? false;
}

// Check if a tier includes access to a specific console
export function tierIncludesConsole(tier: SubscriptionTier, consoleType: string): boolean {
  return TIER_AGENT_CONFIG[tier]?.consoles.includes(consoleType) ?? false;
}

// Get agents available for a specific tier
export function getAgentsForTier(tier: SubscriptionTier): string[] {
  return TIER_AGENT_CONFIG[tier]?.agents ?? [];
}

// Get consoles available for a specific tier
export function getConsolesForTier(tier: SubscriptionTier): string[] {
  return TIER_AGENT_CONFIG[tier]?.consoles ?? [];
}

// Get dependencies for an agent
export function getAgentDependencies(agentType: string): string[] {
  return AGENT_DEPENDENCIES[agentType] ?? [];
}

// Get required agents for a console
export function getConsoleRequiredAgents(consoleType: string): string[] {
  return CONSOLE_REQUIRED_AGENTS[consoleType] ?? [];
}

// Get tier display info
export function getTierDisplayInfo(tier: SubscriptionTier): { label: string; price: string; description: string } {
  const config = TIER_AGENT_CONFIG[tier];
  return {
    label: config?.label ?? 'Unknown',
    price: config?.price ?? '$0/mo',
    description: config?.description ?? '',
  };
}

// Get upgrade path - what tier to upgrade to for a specific agent
export function getUpgradeTierForAgent(currentTier: SubscriptionTier, agentType: string): SubscriptionTier | null {
  const tiers: SubscriptionTier[] = ['core', 'halo', 'single_point', 'multi_track', 'command'];
  const currentIndex = tiers.indexOf(currentTier);
  
  // If already on command, no upgrade available
  if (currentTier === 'command') return null;
  
  // Find the minimum tier that includes this agent
  for (let i = Math.max(0, currentIndex + 1); i < tiers.length; i++) {
    if (TIER_AGENT_CONFIG[tiers[i]].agents.includes(agentType)) {
      return tiers[i];
    }
  }
  
  return null;
}

// Tier hierarchy for comparison
export const TIER_HIERARCHY: Record<SubscriptionTier, number> = {
  free: 0,
  core: 1,
  halo: 2,
  single_point: 3,
  multi_track: 4,
  command: 5,
};

// Compare two tiers
export function isTierAtLeast(currentTier: SubscriptionTier, requiredTier: SubscriptionTier): boolean {
  return TIER_HIERARCHY[currentTier] >= TIER_HIERARCHY[requiredTier];
}

// Feature area to tier mapping (for role permissions)
export const TIER_FEATURE_CONFIG: Record<SubscriptionTier, string[]> = {
  free: [],
  core: [
    // Core tier: AI Chat only, limited features
    'can_access_customers',
  ],
  halo: [
    // Halo tier: Appointments + Customers for salons
    'can_access_appointments',
    'can_access_customers',
  ],
  single_point: [
    'can_access_appointments',
    'can_access_customers',
    'can_access_quotes',
  ],
  multi_track: [
    'can_access_appointments',
    'can_access_customers',
    'can_access_quotes',
    'can_access_leads',
    'can_access_invoices',
    'can_access_field_ops',
    'can_access_inventory',
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
  ],
};

// Get the minimum tier required for a specific feature area
export function getRequiredTierForFeature(featureField: string): SubscriptionTier | null {
  const tiers: SubscriptionTier[] = ['core', 'halo', 'single_point', 'multi_track', 'command'];
  
  for (const tier of tiers) {
    if (TIER_FEATURE_CONFIG[tier].includes(featureField)) {
      return tier;
    }
  }
  
  return null; // Feature not found in any tier
}

// Check if a tier includes access to a specific feature area
export function tierIncludesFeature(tier: SubscriptionTier, featureField: string): boolean {
  return TIER_FEATURE_CONFIG[tier]?.includes(featureField) ?? false;
}
