// Subscription tier types matching the database enum
export type SubscriptionTier = 'free' | 'single_point' | 'multi_track' | 'command';

// Configuration for each subscription tier
export interface TierConfig {
  agents: string[];
  consoles: string[];
  label: string;
  price: string;
  description: string;
}

// Map subscription tiers to available agents and consoles
export const TIER_AGENT_CONFIG: Record<SubscriptionTier, TierConfig> = {
  free: {
    agents: [],
    consoles: [],
    label: 'Free',
    price: '$0/mo',
    description: 'Limited access - upgrade to unlock AI agents',
  },
  single_point: {
    agents: ['triage', 'booking', 'followup', 'review'],
    consoles: ['customer_portal'],
    label: 'Single-Point',
    price: '$497/mo',
    description: 'Customer engagement essentials',
  },
  multi_track: {
    agents: [
      'triage', 'booking', 'followup', 'review',
      'dispatch', 'route', 'eta', 'checkin',
      'quoting', 'invoice'
    ],
    consoles: ['customer_portal', 'field_operations'],
    label: 'Multi-Track',
    price: '$897/mo',
    description: 'Customer + Field operations',
  },
  command: {
    agents: [
      'triage', 'booking', 'followup', 'review',
      'dispatch', 'route', 'eta', 'checkin',
      'admin', 'quoting', 'invoice', 'inventory', 'warranty',
      'campaign',
      'insights', 'performance', 'revenue', 'forecast'
    ],
    consoles: ['customer_portal', 'field_operations', 'business_management', 'marketing_sales', 'analytics_reports'],
    label: 'Command',
    price: '$1,497/mo',
    description: 'Full business automation suite',
  },
};

// Agent dependencies - some agents require others to work properly
export const AGENT_DEPENDENCIES: Record<string, string[]> = {
  booking: ['triage'],
  followup: ['booking'],
  review: ['followup'],
  route: ['dispatch'],
  eta: ['dispatch', 'route'],
  checkin: ['dispatch'],
  invoice: ['quoting'],
  performance: ['insights'],
  revenue: ['insights'],
  forecast: ['insights', 'revenue'],
};

// Console to required agents mapping - consoles need these agents enabled to work
export const CONSOLE_REQUIRED_AGENTS: Record<string, string[]> = {
  customer_portal: ['triage'],
  field_operations: ['dispatch'],
  business_management: ['admin', 'quoting'],
  marketing_sales: ['campaign'],
  analytics_reports: ['insights'],
};

// Get the minimum tier required for a specific agent
export function getRequiredTierForAgent(agentType: string): SubscriptionTier | null {
  const tiers: SubscriptionTier[] = ['single_point', 'multi_track', 'command'];
  
  for (const tier of tiers) {
    if (TIER_AGENT_CONFIG[tier].agents.includes(agentType)) {
      return tier;
    }
  }
  
  return null; // Agent not found in any tier
}

// Get the minimum tier required for a specific console
export function getRequiredTierForConsole(consoleType: string): SubscriptionTier | null {
  const tiers: SubscriptionTier[] = ['single_point', 'multi_track', 'command'];
  
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
  const tiers: SubscriptionTier[] = ['single_point', 'multi_track', 'command'];
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
  single_point: 1,
  multi_track: 2,
  command: 3,
};

// Compare two tiers
export function isTierAtLeast(currentTier: SubscriptionTier, requiredTier: SubscriptionTier): boolean {
  return TIER_HIERARCHY[currentTier] >= TIER_HIERARCHY[requiredTier];
}

// Feature area to tier mapping (for role permissions)
export const TIER_FEATURE_CONFIG: Record<SubscriptionTier, string[]> = {
  free: [],
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
  const tiers: SubscriptionTier[] = ['single_point', 'multi_track', 'command'];
  
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
