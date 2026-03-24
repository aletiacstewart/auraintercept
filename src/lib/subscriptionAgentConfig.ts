// Subscription tier types matching the database - NEW TIER NAMES
export type SubscriptionTier = 'free' | 'starter' | 'scheduling' | 'growth' | 'business' | 'field_ops' | 'performance' | 'command';

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
// NEW 7-TIER STRUCTURE with fixed console access
export const TIER_AGENT_CONFIG: Record<SubscriptionTier, TierConfig> = {
  free: {
    agents: [],
    consoles: [],
    label: 'Free',
    price: '$0/mo',
    description: 'Limited access - upgrade to unlock AI agents',
  },
  starter: {
    // Aura Starter ($197/mo): Lead Capture Stack only
    agents: [
      'triage',  // AI Receptionist only
    ],
    consoles: [],  // No consoles
    label: 'Aura Starter',
    price: '$197/mo',
    description: 'Never miss a lead again - 24/7 AI answering and lead capture',
  },
  scheduling: {
    // Aura Connect ($397/mo): Lead Capture + Booking Automation
    agents: [
      'triage', 'booking', 'followup',  // Lead Capture + Booking Stack
    ],
    consoles: ['customer_portal'],  // Now includes Customer Portal (has booking/followup)
    label: 'Aura Connect',
    price: '$397/mo',
    description: 'Turn conversations into booked appointments',
  },
  growth: {
    // Aura Growth ($597/mo): + Marketing Automation Stack
    agents: [
      'triage', 'booking', 'followup', 'review',  // Customer Portal
      'campaign', 'lead', 'marketing',  // Outreach & Sales
      'creative_content',  // Social Media & Creative (merged)
    ],
    consoles: ['customer_portal', 'marketing_sales', 'social_media'],  // 3 consoles
    label: 'Aura Growth',
    price: '$597/mo',
    description: 'Start growing automatically with marketing automation',
  },
  business: {
    // Aura Presence ($797/mo): + Office Automation Stack
    agents: [
      'triage', 'booking', 'followup', 'review',  // Customer Portal
      'campaign', 'lead', 'marketing',  // Outreach & Sales
      'creative_content', 'web_presence',  // Creative & Web Presence (merged creative + social)
    ],
    consoles: ['customer_portal', 'marketing_sales', 'social_media', 'creative_web_presence'],  // 4 consoles
    label: 'Aura Presence',
    price: '$797/mo',
    description: 'Run your office automatically with web presence',
  },
  field_ops: {
    // Aura Logistics ($1,497/mo): + Field Operations Stack
    agents: [
      'triage', 'booking', 'followup', 'review',  // Customer Portal
      'campaign', 'lead', 'marketing',  // Outreach & Sales
      'creative_content', 'web_presence',  // Creative & Web Presence
      'dispatch', 'route', 'eta', 'checkin',  // Field Operations
      'quoting', 'invoice',  // Business Operations (partial)
    ],
    consoles: ['customer_portal', 'field_operations', 'business_management', 'marketing_sales', 'social_media', 'creative_web_presence'],  // 6 consoles
    label: 'Aura Logistics',
    price: '$1,497/mo',
    description: 'Run your field team automatically',
  },
  performance: {
    // Aura Performance ($2,497/mo): + Business Intelligence Stack (Basic Analytics)
    // 19 agents - excludes revenue and forecast (advanced analytics for Command only)
    agents: [
      'triage', 'booking', 'followup', 'review',  // Customer Portal (4)
      'dispatch', 'route', 'eta', 'checkin',  // Field Operations (4)
      'admin', 'quoting', 'invoice', 'inventory',  // Business Operations (4)
      'campaign', 'lead', 'marketing',  // Outreach & Sales (3)
      'creative_content', 'web_presence',  // Social Media & Creative / Web Presence (2)
      'insights', 'performance',  // Analytics & Reports - Basic (2) - NO revenue, forecast
    ],
    consoles: ['customer_portal', 'field_operations', 'business_management', 'marketing_sales', 'social_media', 'creative_web_presence', 'analytics_reports'],  // All 7 consoles
    label: 'Aura Performance',
    price: '$2,497/mo',
    description: 'Run your entire company with AI and basic analytics',
  },
  command: {
    // Aura Command ($3,497/mo): All agents + enterprise features
    // IMPORTANT: Keep in sync with supabase/functions/ai-agent-chat/index.ts TIER_AGENTS
    // 21 Total Agents - Full suite including advanced analytics (revenue, forecast)
    agents: [
      // Customer Portal (4)
      'triage', 'booking', 'followup', 'review',
      // Field Operations (4)
      'dispatch', 'route', 'eta', 'checkin',
      // Business Operations (4)
      'admin', 'quoting', 'invoice', 'inventory',
      // Marketing & Sales (3)
      'campaign', 'lead', 'marketing',
      // Social Media & Creative (1 merged)
      'creative_content',
      // Creative & Web Presence (1)
      'web_presence',
      // Analytics & Reports (4) - FULL including revenue + forecast
      'insights', 'performance', 'revenue', 'forecast',
    ],
    consoles: ['customer_portal', 'field_operations', 'business_management', 'marketing_sales', 'social_media', 'creative_web_presence', 'analytics_reports', 'ai_operatives_hub'],
    label: 'Aura Command',
    price: '$3,497/mo',
    description: 'AI Operating System with predictive intelligence',
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
  // Creative & Web Presence
  web_presence: ['creative_content'],
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
  social_media: ['creative_content'],  // creative_content is the core agent for this console
  creative_web_presence: ['creative_content'],
  analytics_reports: ['insights'],
  ai_operatives_hub: [],
};

// Get the minimum tier required for a specific agent
export function getRequiredTierForAgent(agentType: string): SubscriptionTier | null {
  const tiers: SubscriptionTier[] = ['starter', 'scheduling', 'growth', 'business', 'field_ops', 'performance', 'command'];
  
  for (const tier of tiers) {
    if (TIER_AGENT_CONFIG[tier].agents.includes(agentType)) {
      return tier;
    }
  }
  
  return null; // Agent not found in any tier
}

// Get the minimum tier required for a specific console
export function getRequiredTierForConsole(consoleType: string): SubscriptionTier | null {
  const tiers: SubscriptionTier[] = ['starter', 'scheduling', 'growth', 'business', 'field_ops', 'performance', 'command'];
  
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
  const tiers: SubscriptionTier[] = ['starter', 'scheduling', 'growth', 'business', 'field_ops', 'performance', 'command'];
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

// Tier hierarchy for comparison - NEW ORDER
export const TIER_HIERARCHY: Record<SubscriptionTier, number> = {
  free: 0,
  starter: 1,
  scheduling: 2,
  growth: 3,
  business: 4,
  field_ops: 5,
  performance: 6,
  command: 7,
};

// Compare two tiers
export function isTierAtLeast(currentTier: SubscriptionTier, requiredTier: SubscriptionTier): boolean {
  return TIER_HIERARCHY[currentTier] >= TIER_HIERARCHY[requiredTier];
}

// Feature area to tier mapping (for role permissions)
export const TIER_FEATURE_CONFIG: Record<SubscriptionTier, string[]> = {
  free: [],
  starter: [
    // Starter tier: Lead Capture only
    'can_access_customers',
    'api_access',
  ],
  scheduling: [
    // Scheduling tier: + Booking
    'can_access_appointments',
    'can_access_customers',
    'api_access',
  ],
  growth: [
    // Growth tier: + Marketing + Social
    'can_access_appointments',
    'can_access_customers',
    'can_access_leads',
    'can_access_campaigns',
    'api_access',
  ],
  business: [
    // Business tier: + Web Presence
    'can_access_appointments',
    'can_access_customers',
    'can_access_leads',
    'can_access_campaigns',
    'api_access',
  ],
  field_ops: [
    // Field Ops tier: + Field Operations + Quoting/Invoicing
    'can_access_appointments',
    'can_access_customers',
    'can_access_quotes',
    'can_access_leads',
    'can_access_invoices',
    'can_access_field_ops',
    'can_access_campaigns',
    'api_access',
  ],
  performance: [
    // Performance tier: + Analytics + Inventory
    'can_access_appointments',
    'can_access_customers',
    'can_access_quotes',
    'can_access_leads',
    'can_access_invoices',
    'can_access_field_ops',
    'can_access_inventory',
    'can_access_campaigns',
    'can_access_analytics',
    'api_access',
  ],
  command: [
    // Command tier: Everything
    'can_access_appointments',
    'can_access_customers',
    'can_access_quotes',
    'can_access_leads',
    'can_access_invoices',
    'can_access_field_ops',
    'can_access_inventory',
    'can_access_campaigns',
    'can_access_analytics',
    'api_access',
  ],
};

// Get the minimum tier required for a specific feature area
export function getRequiredTierForFeature(featureField: string): SubscriptionTier | null {
  const tiers: SubscriptionTier[] = ['starter', 'scheduling', 'growth', 'business', 'field_ops', 'performance', 'command'];
  
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

// Legacy tier name mapping for backward compatibility
export const LEGACY_TIER_MAP: Record<string, SubscriptionTier> = {
  'express': 'starter',
  'aura_flow': 'scheduling',
  'halo': 'growth',
  'core': 'business',
  'single_point': 'field_ops',
  'multi_track': 'performance',
  'command': 'command',
};

// Helper to convert legacy tier names
export function normalizeTierName(tier: string): SubscriptionTier {
  return LEGACY_TIER_MAP[tier] ?? (tier as SubscriptionTier);
}
