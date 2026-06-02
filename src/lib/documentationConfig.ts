/**
 * Master Documentation Configuration
 * Single source of truth for all platform data used across PDFs, Help pages, and guides.
 * Last updated: April 2026 — Consolidated to 4-Tier Growth Ladder (Core/Boost/Pro/Elite) + 24 Smart AI Agents
 */

// ============================================
// SUBSCRIPTION TIERS - 4-TIER STRUCTURE
// ============================================

export interface TierConfig {
  id: string;
  name: string;
  price: number;
  annualPrice: number;
  annualSavings: number;
  implementationFee: number | 'Custom';
  employees: number | 'Unlimited';
  operatives: number;
  consoles: number;
  description: string;
  bestFor: string;
  highlights: string[];
  hasVoice: boolean;
  hasAutomation: boolean;
  isEnterprise?: boolean;
}

export const SUBSCRIPTION_TIERS: Record<string, TierConfig> = {
  aura_core: {
    id: 'aura_core',
    name: 'Aura Core',
    price: 697,
    annualPrice: 6970,
    annualSavings: 1394,
    implementationFee: 349,
    employees: 10,
    operatives: 8,
    consoles: 3,
    description: 'Voice, SMS, email & web chat handled by 8 Smart AI Agents — booking, follow-up, creative content & web presence included.',
    bestFor: 'Solo operators, restaurants, single-location service businesses.',
    highlights: [
      'Channels included: Voice calls, SMS, Email, Web chat (your own SignalWire / ElevenLabs / Resend accounts — billed separately by each provider)',
      'AI Receptionist (Triage) for 24/7 customer engagement',
      'Message Aura (Text) + Email Reminders',
      'Booking Agent + Follow-Up Agent + Review Agent',
      'Creative Content Agent + Web Presence Agent',
      'Lead Agent + Marketing Agent',
      'Customer Portal Console',
      'Outreach & Sales Ops Console',
      'Creative & Web Presence Console',
      'Smart Link Sharing + Embeddable Chat Widget',
      'Knowledge Base for FAQs',
      '10 Employee Accounts',
      'Basic Calendar Sync + API Access',
    ],
    hasVoice: true,
    hasAutomation: true,
  },
  aura_boost: {
    id: 'aura_boost',
    name: 'Aura Boost',
    price: 1097,
    annualPrice: 10970,
    annualSavings: 2194,
    implementationFee: 549,
    employees: 25,
    operatives: 12,
    consoles: 5,
    description: 'Voice, SMS, email & web chat + 12 Smart AI Agents with dispatch, routing & field operations.',
    bestFor: 'Small service teams (HVAC, plumbing, electrical, field service).',
    highlights: [
      'Everything in Aura Core',
      'Channels included: Voice calls, SMS, Email, Web chat (your own provider accounts — billed separately)',
      'Dispatch/GPS Console (Smart job assignment)',
      'Route Agent + ETA Agent + Check-In Agent',
      'Field Operations Console',
      'Social Media Console',
      'Full Communication: Text, Voice, Email, SMS Reminders',
      'Advanced Calendar Sync',
      '25 Employee Accounts',
      'API Access + Standard Support',
    ],
    hasVoice: true,
    hasAutomation: true,
  },
  aura_pro: {
    id: 'aura_pro',
    name: 'Aura Pro',
    price: 1997,
    annualPrice: 19970,
    annualSavings: 3994,
    implementationFee: 999,
    employees: 50,
    operatives: 16,
    consoles: 5,
    description: '16 Smart AI Agents with social media, campaigns, and industry specialist agents.',
    bestFor: 'Growing companies with field teams and multiple technicians.',
    highlights: [
      'Everything in Aura Boost',
      'Campaign Agent + Outreach Agent',
      'Social Scheduler Agent + Social Analytics Agent',
      'Industry Specialist Agents (Diagnostic, Permit, Site Survey, Insurance Claim)',
      '50 Employee Accounts',
      'Full API Access + Priority Support',
    ],
    hasVoice: true,
    hasAutomation: true,
  },
  aura_elite: {
    id: 'aura_elite',
    name: 'Aura Elite',
    price: 3497,
    annualPrice: 34970,
    annualSavings: 6994,
    implementationFee: 1749,
    employees: 'Unlimited',
    operatives: 24,
    consoles: 7,
    description: '24 Smart AI Agents — full suite with business operations, analytics & AI Hub.',
    bestFor: 'Large service teams, property management firms, enterprise operations.',
    highlights: [
      'Everything in Aura Pro',
      'Admin Agent + Quoting Agent',
      'Invoice Agent + Inventory Agent',
      'Insights Agent + Performance Agent',
      'Revenue Agent + Forecast Agent',
      'Business Management Console',
      'Analytics & Reports Console',
      'AI Operatives Hub (Management Interface)',
      'Unlimited Employee Accounts',
      'Advanced Analytics & Demand Forecasting',
      'Enterprise Access Control',
      'Dedicated Onboarding + Priority Support',
      'Custom AI Training Options',
      'API Access',
    ],
    hasVoice: true,
    hasAutomation: true,
    isEnterprise: true,
  },
};

// Tier order for display (price ascending) — 4-tier structure
export const TIER_ORDER = ['aura_core', 'aura_boost', 'aura_pro', 'aura_elite'] as const;

// Legacy tier ID → new 4-tier ID (for backward compatibility with DB records)
export const LEGACY_TIER_ID_MAP: Record<string, string> = {
  // Old 7-tier / 5-tier docConfig IDs
  'express': 'aura_core',
  'aura_flow': 'aura_core',
  'halo': 'aura_core',
  'core': 'aura_core',
  'single_point': 'aura_pro',
  // subscriptionAgentConfig internal names
  'starter': 'aura_core',
  'scheduling': 'aura_core',
  'growth': 'aura_boost',
  'business': 'aura_boost',
  'field_ops': 'aura_pro',
  'performance': 'aura_pro',
  // Old 5-tier names
  'aura_growth': 'aura_boost',
  // Keep existing IDs valid
  'multi_track': 'aura_pro',
  'command': 'aura_elite',
  'aura_connect': 'aura_boost',
  'connect': 'aura_boost',
  // Self-map canonical IDs
  'aura_core': 'aura_core',
  'aura_boost': 'aura_boost',
  'aura_pro': 'aura_pro',
  'aura_elite': 'aura_elite',
};

// ============================================
// AI AGENTS - 24 TOTAL (10 consolidated operative groups)
// ============================================

export interface OperativeConfig {
  id: string;
  name: string;
  description: string;
  console: string;
  tier: string;
  dependencies: string[];
  isCore: boolean;
  worksAlone: boolean;
}

export const AI_OPERATIVES: OperativeConfig[] = [
  // Customer Portal Console - 2 operatives
  {
    id: 'triage',
    name: 'AI Receptionist',
    description: 'First point of contact for all customers. Greets visitors, understands their needs, and routes them to the right agent or information.',
    console: 'customer_portal',
    tier: 'aura_core',
    dependencies: [],
    isCore: true,
    worksAlone: true,
  },
  {
    id: 'customer_journey',
    name: 'Customer Journey Agent',
    description: 'End-to-end customer lifecycle management. Books appointments with calendar sync, sends SMS/email reminders, checks in after service completion, and collects Google/Yelp/Facebook reviews from satisfied customers.',
    console: 'customer_portal',
    tier: 'aura_core',
    dependencies: ['triage'],
    isCore: false,
    worksAlone: false,
  },
  // Outreach & Sales Console - 1 operative
  {
    id: 'outreach',
    name: 'Outreach Agent',
    description: 'Unified marketing and sales automation. Creates and sends email/SMS campaigns, qualifies and scores incoming leads with automated nurturing sequences, manages customer segments, promo codes, referral tracking, and win-back targeting.',
    console: 'marketing_sales',
    tier: 'aura_core',
    dependencies: [],
    isCore: true,
    worksAlone: true,
  },
  // Social Media / Creative Console - 1 operative
  {
    id: 'creative_content',
    name: 'Creative Content Agent',
    description: 'All-in-one creative studio. Generates platform-optimized social posts for Instagram, Facebook, LinkedIn, TikTok, Google Business, and SMS. Creates AI-generated images and video scripts, blog posts, email copy, website landing pages, and multi-channel content campaigns with consistent brand voice.',
    console: 'social_media',
    tier: 'aura_core',
    dependencies: [],
    isCore: true,
    worksAlone: true,
  },
  // Creative & Web Presence Console - 1 operative
  {
    id: 'web_presence',
    name: 'Web Presence Agent',
    description: 'AI-powered website and blog management. Auto-optimizes SEO, suggests content updates, monitors site performance, and auto-publishes blog posts from the Content Engine.',
    console: 'creative_web_presence',
    tier: 'aura_core',
    dependencies: ['creative_content'],
    isCore: true,
    worksAlone: true,
  },
  // Field Operations Console - 2 operatives
  {
    id: 'dispatch',
    name: 'Dispatch/GPS Console',
    description: 'Assigns technicians to jobs based on skills, location, availability, and workload. Optimizes assignments for efficiency.',
    console: 'field_operations',
    tier: 'aura_boost',
    dependencies: [],
    isCore: true,
    worksAlone: true,
  },
  {
    id: 'field_navigation',
    name: 'Field Navigation Agent',
    description: 'End-to-end field mobility management. Plans traffic-aware driving routes, calculates and communicates real-time arrival times to customers, and tracks technician check-ins, job progress, and completion.',
    console: 'field_operations',
    tier: 'aura_boost',
    dependencies: ['dispatch'],
    isCore: false,
    worksAlone: false,
  },
  // Business Operations Console - 1 operative (finance)
  {
    id: 'business_finance',
    name: 'Business Finance Agent',
    description: 'Full financial operations management. Creates multi-line price quotes, generates invoices and tracks payments via Stripe, and monitors parts/materials inventory with low-stock alerts and reorder management.',
    console: 'business_management',
    tier: 'aura_elite',
    dependencies: [],
    isCore: false,
    worksAlone: true,
  },
  // Business Operations Console - 1 operative (admin)
  {
    id: 'admin',
    name: 'Admin Agent',
    description: 'Handles general business administration. Manages scheduling workflows, team assignments, customer profiles, and operational settings.',
    console: 'business_management',
    tier: 'aura_elite',
    dependencies: [],
    isCore: true,
    worksAlone: true,
  },
  // Analytics Console - 1 operative
  {
    id: 'analytics_intelligence',
    name: 'Analytics Intelligence Agent',
    description: 'Unified business intelligence engine. Answers natural language queries, tracks KPIs and technician performance, analyzes revenue trends by service and period, and predicts future demand with capacity planning — all in one conversation.',
    console: 'analytics_reports',
    tier: 'aura_elite',
    dependencies: [],
    isCore: true,
    worksAlone: true,
  },
];

// ============================================
// CONSOLES - 7 CONTROL CENTERS + AI OPERATIVES HUB (Management Interface)
// ============================================

export interface ConsoleConfig {
  id: string;
  name: string;
  description: string;
  tier: string;
  agentCount: number;
  tabs: string[];
  color: string;
}

export const CONSOLES: ConsoleConfig[] = [
  {
    id: 'customer_portal',
    name: 'Customer Portal',
    description: 'AI-powered customer engagement hub with Message Aura (Text), Talk to Aura (Voice), automated follow-ups, and review collection.',
    tier: 'aura_core',
    agentCount: 2,
    tabs: ['AI Assistant', 'Services', 'Appointments', 'Voice AI', 'Contact', 'Hours'],
    color: 'blue',
  },
  {
    id: 'marketing_sales',
    name: 'Outreach & Sales Console',
    description: 'AI-powered marketing automation with campaign management, customer segmentation, promotional tools, and lead nurturing — all in one Outreach Agent.',
    tier: 'aura_core',
    agentCount: 1,
    tabs: ['Campaign', 'Leads', 'Marketing'],
    color: 'orange',
  },
  {
    id: 'social_media',
    name: 'Social Media Console',
    description: 'AI-powered creative studio for social media content creation across 6 platforms, AI image/video generation, and brand-consistent multi-channel content.',
    tier: 'aura_boost',
    agentCount: 1,
    tabs: ['Home', 'Create Content', 'My Posts'],
    color: 'pink',
  },
  {
    id: 'creative_web_presence',
    name: 'Creative & Web Presence',
    description: 'Content Engine for unified multi-channel generation plus AI-powered website builder, blog management, and SEO optimization.',
    tier: 'aura_core',
    agentCount: 1,
    tabs: ['Content Engine', 'Brand Voice', 'Generate', 'Dashboard', 'Calendar', 'Web Presence', 'Blog', 'SEO'],
    color: 'violet',
  },
  {
    id: 'field_operations',
    name: 'Field Operations',
    description: 'Mobile-optimized console for field technicians with AI-powered dispatch, real-time GPS routing, and one-tap job management.',
    tier: 'aura_boost',
    agentCount: 2,
    tabs: ['Map View', 'Schedule', 'Dispatch', 'Check-in'],
    color: 'green',
  },
  {
    id: 'business_management',
    name: 'Business Operations',
    description: 'Comprehensive business management console with AI-powered quoting, invoicing, lead management, and inventory tracking.',
    tier: 'aura_elite',
    agentCount: 2,
    tabs: ['Aura Live', 'Quote', 'Invoice', 'Lead', 'Appts', 'Inventory', 'Companies', 'Employees', 'Customers'],
    color: 'purple',
  },
  {
    id: 'analytics_reports',
    name: 'Analytics & Reports',
    description: 'Advanced analytics console powered by a single Analytics Intelligence Agent covering performance, revenue, insights, and forecasting with 8 specialized tabs.',
    tier: 'aura_elite',
    agentCount: 1,
    tabs: ['Performance', 'Revenue', 'Insights', 'Forecast', 'KPIs', 'Social', 'Reminders', 'Export'],
    color: 'cyan',
  },
];

// Management Interfaces (separate from Control Centers)
export const MANAGEMENT_INTERFACES: ConsoleConfig[] = [
  {
    id: 'ai_operatives_hub',
    name: 'AI Operatives Hub',
    description: 'Central management interface for all 24 Smart AI Agents with real-time monitoring, batch activation, dependency visualization, and performance analytics.',
    tier: 'aura_elite',
    agentCount: 24,
    tabs: ['Operatives', 'Quick Start', 'Monitor', 'Analytics', 'History'],
    color: 'indigo',
  },
];

// ============================================
// 3RD PARTY INTEGRATIONS
// ============================================

export interface IntegrationConfig {
  name: string;
  purpose: string;
  cost: string;
  requiredFor: string;
  optional: boolean;
}

export const THIRD_PARTY_INTEGRATIONS: IntegrationConfig[] = [
  {
    name: 'SignalWire',
    purpose: 'SMS & Voice Calls (your own account · billed directly by SignalWire)',
    cost: '~$0.50/local # + SMS $0.00415/segment + Voice $0.0066/min in / $0.008/min out + AI Agent $0.16/min',
    requiredFor: 'Limited for Core • Required for Boost, Pro, Elite (Voice & SMS)',
    optional: false,
  },
  {
    name: 'ElevenLabs',
    purpose: 'AI Voice Synthesis (your own account · billed directly by ElevenLabs)',
    cost: 'Free 15 min/mo · Starter $5 · Creator $22 · Pro $99 · pay-as-you-go',
    requiredFor: 'Limited for Core • Required for Boost, Pro, Elite (Voice)',
    optional: false,
  },
  {
    name: 'Resend',
    purpose: 'Email Notifications (your own account · billed directly by Resend)',
    cost: 'Free 3,000/mo · Pro $20 (50k) · Scale $90+ · overage ~$0.90/1,000',
    requiredFor: 'All Tiers (Email)',
    optional: false,
  },
  {
    name: 'A2P 10DLC Compliance',
    purpose: 'US SMS Regulatory Compliance (via SignalWire)',
    cost: '$4.50 brand one-time + $1.50–$30/mo campaign + $7.50/submission DCA + $250/mo T-Mobile if inactive 60 consecutive days (billed by SignalWire / The Campaign Registry)',
    requiredFor: 'Optional for Core • Required for Boost, Pro, Elite (SMS)',
    optional: false,
  },
  {
    name: 'Google Calendar',
    purpose: 'Calendar Sync (Two-way)',
    cost: 'Free',
    requiredFor: 'All tiers (Calendar Sync)',
    optional: true,
  },
  {
    name: 'Stripe',
    purpose: 'Invoice Payments',
    cost: '2.9% + $0.30/transaction',
    requiredFor: 'Elite (Invoice Agent)',
    optional: true,
  },
  {
    name: 'Social Media (Platform OAuth)',
    purpose: 'Manual Bridge posting (available now) + Own API credentials for automatic posting.',
    cost: 'Free (Manual Bridge) or Free (Own API setup)',
    requiredFor: 'Required for Pro, Elite • Optional for Core, Boost',
    optional: true,
  },
  {
    name: 'Tavily',
    purpose: 'AI Web Research for Enhanced Content (your own account · billed directly by Tavily)',
    cost: 'Free 1,000 credits/mo · $0.008/credit overage · Project plans from ~$30/mo',
    requiredFor: 'Optional for all tiers (enhances AI content)',
    optional: true,
  },
];

// ============================================
// PLATFORM STATISTICS
// ============================================

export const PLATFORM_STATS = {
  totalAgents: 24,
  totalOperatives: 10, // 10 consolidated operative groups
  totalConsoles: 7,
  totalTiers: 4,
  startingPrice: 697,
  maxEmployees: 'Unlimited',
  socialPlatforms: 6,
  analyticsTabs: 8,
  industries: [
    'HVAC', 'Plumbing', 'Electrical', 'Solar', 'Roofing', 'Fencing & Decking',
    'Landscape & Trees', 'Pool & Spa', 'Pest Control', 'Appliance Repair',
    'Handyman & Cleaning', 'Construction', 'Auto Care', 'Security Systems',
    'Real Estate', 'Beauty & Wellness', 'Restaurants', 'Personal Assistant',
  ],
};

// ============================================
// ADD-ONS & EXTRAS
// ============================================

export const ADDON_PRICING = {
  additionalEmployees: {
    name: 'Additional Employees',
    price: 25,
    unit: 'per 10 employees/month',
    availableFor: ['connect', 'performance', 'command'],
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

export function getTierByPrice(price: number): TierConfig | undefined {
  return Object.values(SUBSCRIPTION_TIERS).find(tier => tier.price === price);
}

// Tier hierarchy for the 4-tier system
const TIER_HIERARCHY_DOC: Record<string, number> = {
  free: 0,
  // Legacy IDs (all map to canonical 4)
  express: 1,
  aura_flow: 1,
  starter: 1,
  scheduling: 1,
  halo: 1,
  core: 1,
  business: 2,
  growth: 2,
  aura_growth: 2,
  // 4-Tier IDs
  aura_core: 1,
  connect: 2,
  aura_connect: 2,
  aura_boost: 2,
  // Pro
  single_point: 3,
  field_ops: 3,
  multi_track: 3,
  performance: 3,
  aura_pro: 3,
  // Elite
  command: 4,
  aura_elite: 4,
};

export function getOperativesForTier(tierId: string): OperativeConfig[] {
  const tierLevel = TIER_HIERARCHY_DOC[tierId] ?? 0;
  return AI_OPERATIVES.filter(op => {
    const opLevel = TIER_HIERARCHY_DOC[op.tier] ?? 0;
    return opLevel <= tierLevel;
  });
}

export function getConsolesForTierDoc(tierId: string): ConsoleConfig[] {
  const tierLevel = TIER_HIERARCHY_DOC[tierId] ?? 0;
  return CONSOLES.filter(c => {
    const consoleLevel = TIER_HIERARCHY_DOC[c.tier] ?? 0;
    return consoleLevel <= tierLevel;
  });
}

export function getOperativesForConsole(consoleId: string): OperativeConfig[] {
  return AI_OPERATIVES.filter(op => op.console === consoleId || op.console === 'all');
}

// Format price for display
export function formatPrice(price: number | 'Custom'): string {
  if (price === 'Custom') return 'Custom';
  return `$${price.toLocaleString()}`;
}

// Format employees for display
export function formatEmployees(employees: number | 'Unlimited'): string {
  if (employees === 'Unlimited') return 'Unlimited';
  return `${employees}`;
}

// ============================================
// INTEGRATION REQUIREMENTS BY TIER
// ============================================

export type IntegrationId = 'stripe' | 'signalwire' | 'elevenlabs' | 'resend' | 'tavily' | 'calendar' | 'a2p_10dlc' | 'social_media';

export interface IntegrationRequirement {
  required: boolean;
  reason?: string;
}

export const INTEGRATION_REQUIREMENTS: Record<string, Record<IntegrationId, IntegrationRequirement>> = {
  aura_core: {
    stripe: { required: false, reason: 'Optional for accepting payments' },
    signalwire: { required: true, reason: 'Required for Talk to Aura voice calls and SMS reminders' },
    elevenlabs: { required: true, reason: 'Required for AI voice synthesis' },
    resend: { required: true, reason: 'Required for email notifications' },
    tavily: { required: false, reason: 'Optional for AI content research' },
    calendar: { required: true, reason: 'Required for booking agent calendar sync' },
    a2p_10dlc: { required: false, reason: 'Optional for Core tier' },
    social_media: { required: false, reason: 'Optional for Core tier' },
  },
  aura_boost: {
    stripe: { required: false, reason: 'Optional for accepting payments' },
    signalwire: { required: true, reason: 'Required for dispatch notifications and voice' },
    elevenlabs: { required: true, reason: 'Required for AI voice synthesis' },
    resend: { required: true, reason: 'Required for email notifications' },
    tavily: { required: false, reason: 'Optional for AI content research' },
    calendar: { required: true, reason: 'Required for field operations scheduling' },
    a2p_10dlc: { required: true, reason: 'Required for US SMS compliance' },
    social_media: { required: false, reason: 'Optional for Boost tier' },
  },
  aura_pro: {
    stripe: { required: false, reason: 'Optional for accepting payments' },
    signalwire: { required: true, reason: 'Required for dispatch notifications and voice' },
    elevenlabs: { required: true, reason: 'Required for AI voice synthesis' },
    resend: { required: true, reason: 'Required for email notifications' },
    tavily: { required: false, reason: 'Optional for AI content research' },
    calendar: { required: true, reason: 'Required for field operations scheduling' },
    a2p_10dlc: { required: true, reason: 'Required for US SMS compliance' },
    social_media: { required: true, reason: 'Required for Social Media Ops (Pro tier)' },
  },
  aura_elite: {
    stripe: { required: true, reason: 'Required for invoicing and payments' },
    signalwire: { required: true, reason: 'Required for full communication suite' },
    elevenlabs: { required: true, reason: 'Required for AI voice synthesis' },
    resend: { required: true, reason: 'Required for email campaigns' },
    tavily: { required: false, reason: 'Optional for AI content research' },
    calendar: { required: true, reason: 'Required for enterprise scheduling' },
    a2p_10dlc: { required: true, reason: 'Required for US SMS compliance' },
    social_media: { required: true, reason: 'Required for Social Media Ops (Elite tier)' },
  },
  free: {
    stripe: { required: false, reason: 'Subscribe to enable payments' },
    signalwire: { required: false, reason: 'Subscribe to enable voice/SMS' },
    elevenlabs: { required: false, reason: 'Subscribe to enable AI voice' },
    resend: { required: false, reason: 'Subscribe to enable email' },
    tavily: { required: false, reason: 'Subscribe to enable AI research' },
    calendar: { required: false, reason: 'Subscribe to enable calendar sync' },
    a2p_10dlc: { required: false, reason: 'Subscribe to enable SMS compliance' },
    social_media: { required: false, reason: 'Subscribe to enable social media' },
  },
};

// Backward compatibility aliases — all legacy names → canonical 4 tier keys
export const INTEGRATION_REQUIREMENTS_COMPAT: Record<string, string> = {
  express: 'aura_core',
  aura_flow: 'aura_core',
  starter: 'aura_core',
  scheduling: 'aura_core',
  halo: 'aura_core',
  core: 'aura_core',
  growth: 'aura_boost',
  business: 'aura_boost',
  aura_growth: 'aura_boost',
  aura_connect: 'aura_boost',
  connect: 'aura_boost',
  field_ops: 'aura_pro',
  performance: 'aura_pro',
  single_point: 'aura_pro',
  multi_track: 'aura_pro',
  command: 'aura_elite',
};

// Get integration requirements for a specific tier
export function getIntegrationRequirements(tier: string | null): Record<IntegrationId, IntegrationRequirement> {
  if (!tier) return INTEGRATION_REQUIREMENTS.free;
  const normalized = INTEGRATION_REQUIREMENTS_COMPAT[tier] ?? tier;
  return INTEGRATION_REQUIREMENTS[normalized] || INTEGRATION_REQUIREMENTS.free;
}
