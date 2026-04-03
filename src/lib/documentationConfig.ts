/**
 * Master Documentation Configuration
 * Single source of truth for all platform data used across PDFs, Help pages, and guides.
 * Last updated: April 2026 — Consolidated to 3-Tier Growth Ladder + 10 AI Operatives
 */

// ============================================
// SUBSCRIPTION TIERS - 3-TIER STRUCTURE
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
  aura_connect: {
    id: 'aura_connect',
    name: 'Aura Connect',
    price: 297,
    annualPrice: 2970,
    annualSavings: 594,
    implementationFee: 299,
    employees: 5,
    operatives: 5,
    consoles: 4,
    description: 'AI voice, chat, scheduling, marketing automation, and web presence.',
    bestFor: 'Solo operators, salons, consultants, and small businesses needing 24/7 AI answering + marketing.',
    highlights: [
      'AI Receptionist for 24/7 customer engagement',
      'Message Aura (Text) + Talk to Aura (Voice)',
      'Customer Journey Agent (Scheduling, Follow-up, Review)',
      'Outreach Agent (Campaign, Lead Capture, Marketing)',
      'Creative Content Agent (Social, Images, Video, Web Copy)',
      'Web Presence Agent (AI-powered site + SEO)',
      'Customer Portal Console',
      'Outreach & Sales Ops Console',
      'Social Media Ops Console',
      'Creative & Web Presence Console',
      'Smart Link Sharing',
      'Knowledge Base for FAQs',
      'Embeddable Chat Widget',
      '5 Employee Accounts',
      'API Access',
    ],
    hasVoice: true,
    hasAutomation: true,
  },
  multi_track: {
    id: 'multi_track',
    name: 'Aura Performance',
    price: 497,
    annualPrice: 4970,
    annualSavings: 994,
    implementationFee: 499,
    employees: 15,
    operatives: 8,
    consoles: 6,
    description: 'Full field operations with dispatch, routing, quoting, and invoicing.',
    bestFor: 'HVAC, plumbing, electrical, and field service companies with technicians.',
    highlights: [
      'Everything in Aura Connect',
      'Dispatch Agent (Smart job assignment)',
      'Field Navigation Agent (Route, ETA, Check-in)',
      'Business Finance Agent (Quoting, Invoice, Inventory)',
      'Field Operations Console',
      'Business Operations Console',
      'AI Outbound Calls for reminders',
      'Stripe Payments Integration',
      '15 Employee Accounts',
      'API Access',
    ],
    hasVoice: true,
    hasAutomation: true,
  },
  command: {
    id: 'command',
    name: 'Aura Command',
    price: 697,
    annualPrice: 6970,
    annualSavings: 1394,
    implementationFee: 'Custom',
    employees: 'Unlimited',
    operatives: 10,
    consoles: 7,
    description: 'Enterprise AI operating system with unlimited employees, white-label branding, and predictive analytics.',
    bestFor: 'Multi-location franchises, enterprise teams, and large service companies.',
    highlights: [
      'Everything in Aura Performance',
      'Admin Agent (Scheduling, Staff, Customers)',
      'Analytics Intelligence Agent (Insights, Performance, Revenue, Forecast)',
      'Analytics & Reports Console',
      'AI Operatives Hub (Management Interface)',
      'Unlimited Employee Accounts',
      'Advanced Predictive Analytics & Demand Forecasting',
      'Multi-location support',
      'White-label branding',
      'Priority Support',
      'Custom Implementation',
      'API Access',
    ],
    hasVoice: true,
    hasAutomation: true,
    isEnterprise: true,
  },
};

// Tier order for display (price ascending) — 3-tier structure
export const TIER_ORDER = ['aura_connect', 'multi_track', 'command'] as const;

// Legacy tier ID → new 3-tier ID (for backward compatibility with DB records)
export const LEGACY_TIER_ID_MAP: Record<string, string> = {
  // Old 7-tier / 5-tier docConfig IDs
  'express': 'aura_connect',
  'aura_flow': 'aura_connect',
  'halo': 'aura_connect',
  'core': 'aura_connect',
  'single_point': 'multi_track',
  // subscriptionAgentConfig internal names
  'starter': 'aura_connect',
  'scheduling': 'aura_connect',
  'growth': 'aura_connect',
  'business': 'aura_connect',
  'field_ops': 'multi_track',
  'performance': 'multi_track',
  // Old 5-tier names
  'aura_growth': 'aura_connect',
  // Keep existing IDs valid
  'multi_track': 'multi_track',
  'command': 'command',
  'aura_connect': 'aura_connect',
  'connect': 'aura_connect',
};

// ============================================
// AI OPERATIVES - 10 TOTAL (Consolidated)
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
    tier: 'aura_connect',
    dependencies: [],
    isCore: true,
    worksAlone: true,
  },
  {
    id: 'customer_journey',
    name: 'Customer Journey Agent',
    description: 'End-to-end customer lifecycle management. Books appointments with calendar sync, sends SMS/email reminders, checks in after service completion, and collects Google/Yelp/Facebook reviews from satisfied customers.',
    console: 'customer_portal',
    tier: 'aura_connect',
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
    tier: 'aura_connect',
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
    tier: 'aura_connect',
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
    tier: 'aura_connect',
    dependencies: ['creative_content'],
    isCore: true,
    worksAlone: true,
  },
  // Field Operations Console - 2 operatives
  {
    id: 'dispatch',
    name: 'Dispatch Agent',
    description: 'Assigns technicians to jobs based on skills, location, availability, and workload. Optimizes assignments for efficiency.',
    console: 'field_operations',
    tier: 'multi_track',
    dependencies: [],
    isCore: true,
    worksAlone: true,
  },
  {
    id: 'field_navigation',
    name: 'Field Navigation Agent',
    description: 'End-to-end field mobility management. Plans traffic-aware driving routes, calculates and communicates real-time arrival times to customers, and tracks technician check-ins, job progress, and completion.',
    console: 'field_operations',
    tier: 'multi_track',
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
    tier: 'multi_track',
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
    tier: 'command',
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
    tier: 'command',
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
    tier: 'aura_connect',
    agentCount: 2,
    tabs: ['AI Assistant', 'Services', 'Appointments', 'Voice AI', 'Contact', 'Hours'],
    color: 'blue',
  },
  {
    id: 'marketing_sales',
    name: 'Outreach & Sales Ops',
    description: 'AI-powered marketing automation with campaign management, customer segmentation, promotional tools, and lead nurturing — all in one Outreach Agent.',
    tier: 'aura_connect',
    agentCount: 1,
    tabs: ['Campaign', 'Leads', 'Marketing'],
    color: 'orange',
  },
  {
    id: 'social_media',
    name: 'Social Media Ops',
    description: 'AI-powered creative studio for social media content creation across 6 platforms, AI image/video generation, and brand-consistent multi-channel content.',
    tier: 'aura_connect',
    agentCount: 1,
    tabs: ['Home', 'Create Content', 'My Posts'],
    color: 'pink',
  },
  {
    id: 'creative_web_presence',
    name: 'Creative & Web Presence',
    description: 'Content Engine for unified multi-channel generation plus AI-powered website builder, blog management, and SEO optimization.',
    tier: 'aura_connect',
    agentCount: 1,
    tabs: ['Content Engine', 'Brand Voice', 'Generate', 'Dashboard', 'Calendar', 'Web Presence', 'Blog', 'SEO'],
    color: 'violet',
  },
  {
    id: 'field_operations',
    name: 'Field Operations',
    description: 'Mobile-optimized console for field technicians with AI-powered dispatch, real-time GPS routing, and one-tap job management.',
    tier: 'multi_track',
    agentCount: 2,
    tabs: ['Map View', 'Schedule', 'Dispatch', 'Check-in'],
    color: 'green',
  },
  {
    id: 'business_management',
    name: 'Business Operations',
    description: 'Comprehensive business management console with AI-powered quoting, invoicing, lead management, and inventory tracking.',
    tier: 'multi_track',
    agentCount: 2,
    tabs: ['Aura Live', 'Quote', 'Invoice', 'Lead', 'Appts', 'Inventory', 'Companies', 'Employees', 'Customers'],
    color: 'purple',
  },
  {
    id: 'analytics_reports',
    name: 'Analytics & Reports',
    description: 'Advanced analytics console powered by a single Analytics Intelligence Agent covering performance, revenue, insights, and forecasting with 8 specialized tabs.',
    tier: 'command',
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
    description: 'Central management interface for all 10 AI Operatives with real-time monitoring, batch activation, dependency visualization, and performance analytics.',
    tier: 'command',
    agentCount: 10,
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
    purpose: 'SMS & Voice Calls',
    cost: '$2/number + ~$20-80/mo usage (40% cheaper SMS)',
    requiredFor: 'All Tiers (Voice & SMS)',
    optional: false,
  },
  {
    name: 'ElevenLabs',
    purpose: 'AI Voice Synthesis (Proxy Voice Chat)',
    cost: '$0-99+/month based on usage',
    requiredFor: 'All Tiers (Voice)',
    optional: false,
  },
  {
    name: 'Resend',
    purpose: 'Email Notifications',
    cost: '$0-20+/month based on volume',
    requiredFor: 'All Tiers (Email)',
    optional: false,
  },
  {
    name: 'A2P 10DLC Compliance',
    purpose: 'US SMS Regulatory Compliance (via SignalWire)',
    cost: 'Included with SignalWire registration',
    requiredFor: 'All Tiers (SMS)',
    optional: false,
  },
  {
    name: 'Google Calendar',
    purpose: 'Calendar Sync (Two-way)',
    cost: 'Free',
    requiredFor: 'Connect+ (Customer Journey Agent)',
    optional: true,
  },
  {
    name: 'Stripe',
    purpose: 'Invoice Payments',
    cost: '2.9% + $0.30/transaction',
    requiredFor: 'Performance+ (Business Finance Agent)',
    optional: true,
  },
  {
    name: 'Social Media (Platform OAuth)',
    purpose: 'Manual Bridge posting (available now) + Own API credentials for automatic posting.',
    cost: 'Free (Manual Bridge) or Free (Own API setup)',
    requiredFor: 'Performance+ (Social Media Ops — Creative Content Agent)',
    optional: true,
  },
  {
    name: 'Tavily',
    purpose: 'AI Web Research for Enhanced Content',
    cost: 'Free (1,000 searches/mo) or paid plans',
    requiredFor: 'Optional for all tiers (enhances AI content)',
    optional: true,
  },
];

// ============================================
// PLATFORM STATISTICS
// ============================================

export const PLATFORM_STATS = {
  totalOperatives: 10,
  totalConsoles: 7,
  totalTiers: 3,
  startingPrice: 297,
  maxEmployees: 'Unlimited',
  socialPlatforms: 6,
  analyticsTabs: 8,
  industries: ['HVAC', 'Plumbing', 'Electrical', 'General Contracting', 'Beauty & Wellness', 'Restaurants', 'Personal Services'],
};

// ============================================
// ADD-ONS & EXTRAS
// ============================================

export const ADDON_PRICING = {
  additionalEmployees: {
    name: 'Additional Employees',
    price: 25,
    unit: 'per 10 employees/month',
    availableFor: ['multi_track'],
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

export function getTierByPrice(price: number): TierConfig | undefined {
  return Object.values(SUBSCRIPTION_TIERS).find(tier => tier.price === price);
}

// Tier hierarchy for the 3-tier system
const TIER_HIERARCHY_DOC: Record<string, number> = {
  free: 0,
  // Legacy IDs (all map to canonical 3)
  express: 1,
  aura_flow: 1,
  starter: 1,
  scheduling: 1,
  halo: 1,
  core: 1,
  business: 1,
  growth: 1,
  aura_growth: 1,
  // 3-Tier IDs
  aura_connect: 1,
  connect: 1,
  // Performance
  single_point: 2,
  field_ops: 2,
  multi_track: 2,
  performance: 2,
  // Command
  command: 3,
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
  aura_connect: {
    stripe: { required: false, reason: 'Optional for accepting payments' },
    signalwire: { required: true, reason: 'Required for Talk to Aura voice calls and SMS reminders' },
    elevenlabs: { required: true, reason: 'Required for AI voice synthesis' },
    resend: { required: true, reason: 'Required for email notifications' },
    tavily: { required: false, reason: 'Optional for AI content research' },
    calendar: { required: true, reason: 'Required for Customer Journey Agent calendar sync' },
    a2p_10dlc: { required: true, reason: 'Required for US SMS compliance' },
    social_media: { required: false, reason: 'Optional for Connect tier' },
  },
  multi_track: {
    stripe: { required: true, reason: 'Required for Business Finance Agent invoice payments' },
    signalwire: { required: true, reason: 'Required for dispatch notifications and voice' },
    elevenlabs: { required: true, reason: 'Required for AI voice synthesis' },
    resend: { required: true, reason: 'Required for email notifications' },
    tavily: { required: false, reason: 'Optional for AI content research' },
    calendar: { required: true, reason: 'Required for field operations scheduling' },
    a2p_10dlc: { required: true, reason: 'Required for US SMS compliance' },
    social_media: { required: true, reason: 'Required for Social Media Ops (Performance tier)' },
  },
  command: {
    stripe: { required: true, reason: 'Required for invoicing and payments' },
    signalwire: { required: true, reason: 'Required for full communication suite' },
    elevenlabs: { required: true, reason: 'Required for AI voice synthesis' },
    resend: { required: true, reason: 'Required for email campaigns' },
    tavily: { required: false, reason: 'Optional for AI content research' },
    calendar: { required: true, reason: 'Required for enterprise scheduling' },
    a2p_10dlc: { required: true, reason: 'Required for US SMS compliance' },
    social_media: { required: true, reason: 'Required for Social Media Ops (Command tier)' },
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

// Backward compatibility aliases — all legacy names → canonical 3 tier keys
export const INTEGRATION_REQUIREMENTS_COMPAT: Record<string, string> = {
  express: 'aura_connect',
  aura_flow: 'aura_connect',
  starter: 'aura_connect',
  scheduling: 'aura_connect',
  halo: 'aura_connect',
  core: 'aura_connect',
  growth: 'aura_connect',
  business: 'aura_connect',
  aura_growth: 'aura_connect',
  field_ops: 'multi_track',
  performance: 'multi_track',
  single_point: 'multi_track',
  connect: 'aura_connect',
};

// Get integration requirements for a specific tier
export function getIntegrationRequirements(tier: string | null): Record<IntegrationId, IntegrationRequirement> {
  if (!tier) return INTEGRATION_REQUIREMENTS.free;
  const normalized = INTEGRATION_REQUIREMENTS_COMPAT[tier] ?? tier;
  return INTEGRATION_REQUIREMENTS[normalized] || INTEGRATION_REQUIREMENTS.free;
}
