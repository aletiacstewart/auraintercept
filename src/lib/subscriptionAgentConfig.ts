// Subscription tier types matching the database enum
export type SubscriptionTier = 'free' | 'express' | 'aura_flow' | 'core' | 'halo' | 'single_point' | 'multi_track' | 'command';

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
  express: {
    // Aura Express ($197/mo): Voice & Chat only for restaurants - minimal agent set
    agents: [
      'triage',  // AI Receptionist only
    ],
    consoles: [],  // No consoles
    label: 'Aura Express',
    price: '$197/mo',
    description: 'AI Voice & Chat for restaurants with smart link sharing',
  },
  aura_flow: {
    // Aura Flow ($297/mo): AI voice, chat, scheduling + social media (1 employee)
    agents: [
      'triage', 'booking', 'followup',  // Customer Portal
      'social_content', 'social_scheduler', 'social_analytics',  // Social Media
      'creative'  // Creative Agent
    ],
    consoles: ['social_media'],  // Social Media only (removed marketing_sales)
    label: 'Aura Flow',
    price: '$297/mo',
    description: 'AI voice, chat, and scheduling with direct calendar sync',
  },
  core: {
    // Core: AI Chat + Social Media + Web Presence + universal agents
    agents: [
      'triage',  // AI Receptionist
      'campaign', 'lead', 'marketing',  // Outreach & Sales
      'social_content', 'social_scheduler', 'social_analytics',  // Social Media
      'creative'  // Creative Agent
    ],
    consoles: ['marketing_sales', 'social_media'],
    label: 'Core',
    price: '$500/mo',
    description: 'AI Chat + Social Media + Web Presence',
  },
  halo: {
    // Aura Halo ($397/mo): AI Receptionist + Scheduling + Review Agent for salons/wellness
    agents: [
      'triage', 'booking', 'followup', 'review',  // Customer Portal (added review)
      'campaign', 'lead', 'marketing',  // Outreach & Sales
      'social_content', 'social_scheduler', 'social_analytics',  // Social Media
      'creative'  // Creative Agent
    ],
    consoles: ['customer_portal', 'marketing_sales', 'social_media'],
    label: 'Aura Halo',
    price: '$397/mo',
    description: 'AI Receptionist, Scheduling, Voice & SMS/Email for salons & wellness',
  },
  single_point: {
    // Single-Point: Customer engagement + AI Voice + Scheduling + Web Presence
    agents: [
      'triage', 'booking', 'followup', 'review',  // Customer Portal (added booking)
      'campaign', 'lead', 'marketing',  // Outreach & Sales
      'social_content', 'social_scheduler', 'social_analytics',  // Social Media
      'creative', 'web_presence'  // Creative & Web Presence (added web_presence)
    ],
    consoles: ['customer_portal', 'marketing_sales', 'social_media', 'creative_web_presence'],  // Added creative_web_presence
    label: 'Single-Point',
    price: '$1,500/mo',
    description: 'Customer engagement + AI Voice + Web Presence',
  },
  multi_track: {
    // Multi-Track: Field ops + booking + Web Presence
    agents: [
      'triage', 'booking', 'followup', 'review',  // Customer Portal
      'dispatch', 'route', 'eta', 'checkin',  // Field Operations
      'quoting', 'invoice',  // Business Operations
      'campaign', 'lead', 'marketing',  // Outreach & Sales
      'social_content', 'social_scheduler', 'social_analytics',  // Social Media
      'creative', 'web_presence'  // Creative & Web Presence (added web_presence)
    ],
    consoles: ['customer_portal', 'field_operations', 'marketing_sales', 'social_media', 'creative_web_presence'],  // Added creative_web_presence
    label: 'Multi-Track',
    price: '$3,997/mo',
    description: 'Customer + Field operations + Online booking + Web Presence',
  },
  command: {
    // IMPORTANT: Keep in sync with supabase/functions/ai-agent-chat/index.ts TIER_AGENTS
    // 24 Total Agents: 4 Customer Portal + 4 Field Ops + 4 Business Ops + 3 Marketing + 3 Social Media + 4 Analytics + 1 Content Engine + 1 Web Presence
    agents: [
      // Customer Portal (4)
      'triage', 'booking', 'followup', 'review',
      // Field Operations (4)
      'dispatch', 'route', 'eta', 'checkin',
      // Business Operations (4)
      'admin', 'quoting', 'invoice', 'inventory',
      // Marketing & Sales (3)
      'campaign', 'lead', 'marketing',
      // Social Media (3)
      'social_content', 'social_scheduler', 'social_analytics',
      // Analytics & Reports (4)
      'insights', 'performance', 'revenue', 'forecast',
      // Content Engine (1)
      'creative',
      // Web Presence (1)
      'web_presence'
    ],
    consoles: ['customer_portal', 'field_operations', 'business_management', 'marketing_sales', 'social_media', 'creative_web_presence', 'analytics_reports', 'ai_operatives_hub'],
    label: 'Aura Pro Command',
    price: '$5,997/mo',
    description: 'Full business automation suite',
  },
};

// Agent dependencies - some agents require others to work properly
// IMPORTANT: Keep in sync with supabase/functions/ai-agent-chat/index.ts and OperativeDependencyGraph.tsx
export const AGENT_DEPENDENCIES: Record<string, string[]> = {
  // Customer Portal
  booking: ['triage'],
  followup: ['triage'],
  review: ['triage'],
  // Field Operations
  dispatch: ['triage', 'booking'],
  route: ['dispatch'],
  eta: ['dispatch', 'route'],
  checkin: ['dispatch'],
  // Business Operations
  invoice: ['quoting'],
  // Marketing & Sales
  marketing: ['campaign'],
  // Social Media & Web Presence
  social_scheduler: ['social_content'],
  social_analytics: ['social_content'],
  web_presence: ['creative'],
  // Analytics
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
  social_media: ['social_content'],  // social_content is the core agent for this console
  analytics_reports: ['insights'],
  ai_operatives_hub: [],
};

// Get the minimum tier required for a specific agent
export function getRequiredTierForAgent(agentType: string): SubscriptionTier | null {
  const tiers: SubscriptionTier[] = ['express', 'aura_flow', 'core', 'halo', 'single_point', 'multi_track', 'command'];
  
  for (const tier of tiers) {
    if (TIER_AGENT_CONFIG[tier].agents.includes(agentType)) {
      return tier;
    }
  }
  
  return null; // Agent not found in any tier
}

// Get the minimum tier required for a specific console
export function getRequiredTierForConsole(consoleType: string): SubscriptionTier | null {
  const tiers: SubscriptionTier[] = ['express', 'aura_flow', 'core', 'halo', 'single_point', 'multi_track', 'command'];
  
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
  const tiers: SubscriptionTier[] = ['express', 'aura_flow', 'core', 'halo', 'single_point', 'multi_track', 'command'];
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
  express: 1,
  aura_flow: 2,
  halo: 3,
  core: 4,
  single_point: 5,
  multi_track: 6,
  command: 7,
};

// Compare two tiers
export function isTierAtLeast(currentTier: SubscriptionTier, requiredTier: SubscriptionTier): boolean {
  return TIER_HIERARCHY[currentTier] >= TIER_HIERARCHY[requiredTier];
}

// Feature area to tier mapping (for role permissions)
export const TIER_FEATURE_CONFIG: Record<SubscriptionTier, string[]> = {
  free: [],
  express: [
    // Express tier: Voice & Chat only (no outreach/social consoles)
    'can_access_customers',
    'api_access',  // Added API Access
  ],
  aura_flow: [
    // Aura Flow tier: Voice & Chat + Scheduling + Social Media (1 employee)
    'can_access_appointments',
    'can_access_customers',
    'api_access',  // Added API Access
  ],
  core: [
    // Core tier: AI Chat + Marketing + Social
    'can_access_customers',
    'can_access_leads',
    'can_access_campaigns',
    'api_access',  // Added API Access
  ],
  halo: [
    // Halo tier: Appointments + Customers + Marketing + Social + Review
    'can_access_appointments',
    'can_access_customers',
    'can_access_leads',
    'can_access_campaigns',
    'api_access',  // Added API Access
  ],
  single_point: [
    'can_access_appointments',
    'can_access_customers',
    'can_access_quotes',
    'can_access_leads',
    'can_access_campaigns',
    'api_access',  // Added API Access
  ],
  multi_track: [
    'can_access_appointments',
    'can_access_customers',
    'can_access_quotes',
    'can_access_leads',
    'can_access_invoices',
    'can_access_field_ops',
    'can_access_inventory',
    'can_access_campaigns',
    'api_access',  // Added API Access
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
    'api_access',  // Added API Access
  ],
};

// Get the minimum tier required for a specific feature area
export function getRequiredTierForFeature(featureField: string): SubscriptionTier | null {
  const tiers: SubscriptionTier[] = ['express', 'aura_flow', 'core', 'halo', 'single_point', 'multi_track', 'command'];
  
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
