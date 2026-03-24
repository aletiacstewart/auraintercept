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
// 10-AGENT CONSOLIDATED STRUCTURE
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
    consoles: [],
    label: 'Aura Starter',
    price: '$197/mo',
    description: 'Never miss a lead again - 24/7 AI answering and lead capture',
  },
  scheduling: {
    // Aura Connect ($397/mo): Lead Capture + Customer Journey
    agents: [
      'triage', 'customer_journey',  // Lead Capture + Customer Journey (booking+followup+review)
    ],
    consoles: ['customer_portal'],
    label: 'Aura Connect',
    price: '$397/mo',
    description: 'Turn conversations into booked appointments',
  },
  growth: {
    // Aura Growth ($597/mo): + Outreach & Social
    agents: [
      'triage', 'customer_journey',  // Customer Portal
      'outreach',                    // Outreach & Sales (campaign+lead+marketing merged)
      'creative_content',            // Social Media & Creative (merged)
    ],
    consoles: ['customer_portal', 'marketing_sales', 'social_media'],
    label: 'Aura Growth',
    price: '$597/mo',
    description: 'Start growing automatically with marketing automation',
  },
  business: {
    // Aura Presence ($797/mo): + Web Presence
    agents: [
      'triage', 'customer_journey',
      'outreach',
      'creative_content', 'web_presence',
    ],
    consoles: ['customer_portal', 'marketing_sales', 'social_media', 'creative_web_presence'],
    label: 'Aura Presence',
    price: '$797/mo',
    description: 'Run your office automatically with web presence',
  },
  field_ops: {
    // Aura Logistics ($1,497/mo): + Field Operations Stack
    agents: [
      'triage', 'customer_journey',              // Customer Portal
      'outreach',                                // Outreach & Sales
      'creative_content', 'web_presence',        // Creative & Web Presence
      'dispatch', 'field_navigation',            // Field Operations (dispatch+route+eta+checkin merged)
      'business_finance',                        // Business Finance (quoting+invoice+inventory merged)
    ],
    consoles: ['customer_portal', 'field_operations', 'business_management', 'marketing_sales', 'social_media', 'creative_web_presence'],
    label: 'Aura Logistics',
    price: '$1,497/mo',
    description: 'Run your field team automatically',
  },
  performance: {
    // Aura Performance ($2,497/mo): All 10 agents
    agents: [
      'triage', 'customer_journey',              // Customer Portal (2)
      'dispatch', 'field_navigation',            // Field Operations (2)
      'admin', 'business_finance',               // Business Operations (2)
      'outreach',                                // Outreach & Sales (1)
      'creative_content', 'web_presence',        // Social Media & Creative / Web Presence (2)
      'analytics_intelligence',                  // Analytics & Reports (1) — unified agent
    ],
    consoles: ['customer_portal', 'field_operations', 'business_management', 'marketing_sales', 'social_media', 'creative_web_presence', 'analytics_reports'],
    label: 'Aura Performance',
    price: '$2,497/mo',
    description: 'Run your entire company with AI and full analytics',
  },
  command: {
    // Aura Command ($3,497/mo): All agents + enterprise features
    // 10 Total Agents - Full suite
    agents: [
      // Customer Portal (2)
      'triage', 'customer_journey',
      // Field Operations (2)
      'dispatch', 'field_navigation',
      // Business Operations (2)
      'admin', 'business_finance',
      // Outreach & Sales (1)
      'outreach',
      // Social Media & Creative (1)
      'creative_content',
      // Creative & Web Presence (1)
      'web_presence',
      // Analytics & Reports (1) — unified agent
      'analytics_intelligence',
    ],
    consoles: ['customer_portal', 'field_operations', 'business_management', 'marketing_sales', 'social_media', 'creative_web_presence', 'analytics_reports', 'ai_operatives_hub'],
    label: 'Aura Command',
    price: '$3,497/mo',
    description: 'AI Operating System with predictive intelligence',
  },
};

// Agent dependencies
export const AGENT_DEPENDENCIES: Record<string, string[]> = {
  // Customer Portal
  customer_journey: ['triage'],
  // Field Operations
  dispatch: ['triage', 'customer_journey'],
  field_navigation: ['dispatch'],
  // Business Operations
  business_finance: [],
  // Creative & Web Presence
  web_presence: ['creative_content'],
  // Analytics
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

// Get the minimum tier required for a specific agent
export function getRequiredTierForAgent(agentType: string): SubscriptionTier | null {
  const tiers: SubscriptionTier[] = ['starter', 'scheduling', 'growth', 'business', 'field_ops', 'performance', 'command'];
  
  for (const tier of tiers) {
    if (TIER_AGENT_CONFIG[tier].agents.includes(agentType)) {
      return tier;
    }
  }
  
  return null;
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
  const tiers: SubscriptionTier[] = ['starter', 'scheduling', 'growth', 'business', 'field_ops', 'performance', 'command'];
  const currentIndex = tiers.indexOf(currentTier);
  
  if (currentTier === 'command') return null;
  
  for (let i = Math.max(0, currentIndex + 1); i < tiers.length; i++) {
    if (TIER_AGENT_CONFIG[tiers[i]].agents.includes(agentType)) {
      return tiers[i];
    }
  }
  
  return null;
}

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

export function isTierAtLeast(currentTier: SubscriptionTier, requiredTier: SubscriptionTier): boolean {
  return TIER_HIERARCHY[currentTier] >= TIER_HIERARCHY[requiredTier];
}

export const TIER_FEATURE_CONFIG: Record<SubscriptionTier, string[]> = {
  free: [],
  starter: [
    'can_access_customers',
    'api_access',
  ],
  scheduling: [
    'can_access_appointments',
    'can_access_customers',
    'api_access',
  ],
  growth: [
    'can_access_appointments',
    'can_access_customers',
    'can_access_leads',
    'can_access_campaigns',
    'api_access',
  ],
  business: [
    'can_access_appointments',
    'can_access_customers',
    'can_access_leads',
    'can_access_campaigns',
    'api_access',
  ],
  field_ops: [
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

export function getRequiredTierForFeature(featureField: string): SubscriptionTier | null {
  const tiers: SubscriptionTier[] = ['starter', 'scheduling', 'growth', 'business', 'field_ops', 'performance', 'command'];
  
  for (const tier of tiers) {
    if (TIER_FEATURE_CONFIG[tier].includes(featureField)) {
      return tier;
    }
  }
  
  return null;
}

export function tierIncludesFeature(tier: SubscriptionTier, featureField: string): boolean {
  return TIER_FEATURE_CONFIG[tier]?.includes(featureField) ?? false;
}

export const LEGACY_TIER_MAP: Record<string, SubscriptionTier> = {
  'express': 'starter',
  'aura_flow': 'scheduling',
  'halo': 'growth',
  'core': 'business',
  'single_point': 'field_ops',
  'multi_track': 'performance',
  'command': 'command',
};

export function normalizeTierName(tier: string): SubscriptionTier {
  return LEGACY_TIER_MAP[tier] ?? (tier as SubscriptionTier);
}

// Legacy agent name mapping — maps old granular agent names to new consolidated agents
// Used for backward compatibility with existing database records
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
  'performance': 'analytics_intelligence',
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
