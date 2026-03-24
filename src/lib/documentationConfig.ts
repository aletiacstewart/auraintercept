/**
 * Master Documentation Configuration
 * Single source of truth for all platform data used across PDFs, Help pages, and guides.
 * Last updated: March 2026 — Consolidated to 5-Tier Growth Ladder + 10 AI Operatives
 */

// ============================================
// SUBSCRIPTION TIERS - 5-TIER STRUCTURE
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
    employees: 3,
    operatives: 2,  // triage + customer_journey
    consoles: 1,    // Customer Portal
    description: 'AI voice, chat, and scheduling with calendar sync and customer portal.',
    bestFor: 'Service businesses, restaurants, and solo operators needing 24/7 AI answering + automated booking.',
    highlights: [
      'AI Receptionist for 24/7 customer engagement',
      'Message Aura (Text) + Talk to Aura (Voice)',
      'Customer Journey Agent (Scheduling, Follow-up, Review)',
      'Customer Portal Console',
      'Smart Link Sharing (Website, Menu, Ordering)',
      'Knowledge Base for FAQs',
      'Embeddable Chat Widget',
      '3 Employee Accounts',
      'API Access',
    ],
    hasVoice: true,
    hasAutomation: true,
  },
  aura_growth: {
    id: 'aura_growth',
    name: 'Aura Growth',
    price: 597,
    annualPrice: 5970,
    annualSavings: 1194,
    implementationFee: 499,
    employees: 8,
    operatives: 5,  // + outreach + creative_content + web_presence
    consoles: 4,    // + Outreach & Sales, Social Media Ops, Creative & Web Presence
    description: 'Full marketing automation with social content, outreach campaigns, and web presence.',
    bestFor: 'Salons, wellness studios, personal services, and small businesses scaling their marketing.',
    highlights: [
      'Everything in Aura Connect',
      'Outreach Agent (Campaign, Lead Capture & Scoring, Marketing)',
      'Creative Content Agent (Social, Images, Video, Web Copy)',
      'Web Presence Agent (AI-powered site + SEO)',
      'Outreach & Sales Ops Console',
      'Social Media Ops Console',
      'Creative & Web Presence Console',
      '8 Employee Accounts',
      'API Access',
    ],
    hasVoice: true,
    hasAutomation: true,
  },
  single_point: {
    id: 'single_point',
    name: 'Aura Logistics',
    price: 1497,
    annualPrice: 14970,
    annualSavings: 2994,
    implementationFee: 499,
    employees: 15,
    operatives: 8,  // + dispatch + field_navigation + business_finance
    consoles: 6,    // + Field Operations, Business Operations
    description: 'Complete field operations with dispatch, routing, quoting, and invoicing.',
    bestFor: 'Service companies with field technicians needing dispatch automation and financial management.',
    highlights: [
      'Everything in Aura Growth',
      'Dispatch Agent (Smart job assignment)',
      'Field Navigation Agent (Route, ETA, Check-in)',
      'Business Finance Agent (Quoting, Invoice, Inventory)',
      'Field Operations Console',
      'Business Operations Console',
      'AI Outbound Calls for reminders (requires SignalWire)',
      'Up to 15 employees',
      'Stripe Payments Integration',
      'API Access',
    ],
    hasVoice: true,
    hasAutomation: true,
  },
  multi_track: {
    id: 'multi_track',
    name: 'Aura Performance',
    price: 2497,
    annualPrice: 24970,
    annualSavings: 4994,
    implementationFee: 499,
    employees: 30,
    operatives: 10,  // All 10 operatives
    consoles: 7,     // All 7 consoles
    description: 'Full business automation with all 10 AI operatives, analytics intelligence, and admin control.',
    bestFor: 'Growing companies needing comprehensive automation, analytics, and team management.',
    highlights: [
      'Everything in Aura Logistics',
      'All 10 AI Operatives',
      'All 7 Consoles',
      'Admin Agent (Scheduling, Staff, Customers)',
      'Analytics Intelligence Agent (Insights, Performance, Revenue, Forecast)',
      'Smart dispatch and job assignment',
      'Real-time GPS routing and navigation',
      'Up to 30 employees',
      'API Access',
    ],
    hasVoice: true,
    hasAutomation: true,
  },
  command: {
    id: 'command',
    name: 'Aura Command',
    price: 3497,
    annualPrice: 34970,
    annualSavings: 6994,
    implementationFee: 'Custom',
    employees: 'Unlimited',
    operatives: 10,  // Full 10-operative suite
    consoles: 7,     // All 7 Control Centers + AI Operatives Hub
    description: 'Enterprise AI operating system with unlimited employees, white-label branding, and predictive analytics.',
    bestFor: 'Large service companies with 15+ technicians or multi-location operations.',
    highlights: [
      'Everything in Aura Performance',
      'Unlimited Employee Accounts',
      'Advanced Predictive Analytics & Demand Forecasting',
      'Multi-location support',
      'White-label branding',
      'AI Operatives Hub (Management Interface)',
      'Priority Support',
      'Custom Implementation',
      'API Access',
    ],
    hasVoice: true,
    hasAutomation: true,
    isEnterprise: true,
  },
};

// Tier order for display (price ascending) — 5-tier structure
export const TIER_ORDER = ['aura_connect', 'aura_growth', 'single_point', 'multi_track', 'command'] as const;

// Legacy tier ID → new 5-tier ID (for backward compatibility with DB records)
export const LEGACY_TIER_ID_MAP: Record<string, string> = {
  // Old 7-tier docConfig IDs
  'express': 'aura_connect',
  'aura_flow': 'aura_connect',
  'halo': 'aura_growth',
  'core': 'aura_growth',
  // Keep existing IDs that are still valid
  'single_point': 'single_point',
  'multi_track': 'multi_track',
  'command': 'command',
  // subscriptionAgentConfig internal names
  'starter': 'aura_connect',
  'scheduling': 'aura_connect',
  'growth': 'aura_growth',
  'business': 'aura_growth',
  'field_ops': 'single_point',
  'performance': 'multi_track',
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
    tier: 'aura_growth',
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
    tier: 'aura_growth',
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
    tier: 'aura_growth',
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
    tier: 'single_point',
    dependencies: [],
    isCore: true,
    worksAlone: true,
  },
  {
    id: 'field_navigation',
    name: 'Field Navigation Agent',
    description: 'End-to-end field mobility management. Plans traffic-aware driving routes, calculates and communicates real-time arrival times to customers, and tracks technician check-ins, job progress, and completion.',
    console: 'field_operations',
    tier: 'single_point',
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
    tier: 'single_point',
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
    tier: 'multi_track',
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
    tier: 'multi_track',
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
    tier: 'aura_growth',
    agentCount: 1,
    tabs: ['Campaign', 'Leads', 'Marketing'],
    color: 'orange',
  },
  {
    id: 'social_media',
    name: 'Social Media Ops',
    description: 'AI-powered creative studio for social media content creation across 6 platforms, AI image/video generation, and brand-consistent multi-channel content.',
    tier: 'aura_growth',
    agentCount: 1,
    tabs: ['Home', 'Create Content', 'My Posts'],
    color: 'pink',
  },
  {
    id: 'creative_web_presence',
    name: 'Creative & Web Presence',
    description: 'Content Engine for unified multi-channel generation plus AI-powered website builder, blog management, and SEO optimization.',
    tier: 'aura_growth',
    agentCount: 1,
    tabs: ['Content Engine', 'Brand Voice', 'Generate', 'Dashboard', 'Calendar', 'Web Presence', 'Blog', 'SEO'],
    color: 'violet',
  },
  {
    id: 'field_operations',
    name: 'Field Operations',
    description: 'Mobile-optimized console for field technicians with AI-powered dispatch, real-time GPS routing, and one-tap job management.',
    tier: 'single_point',
    agentCount: 2,
    tabs: ['Map View', 'Schedule', 'Dispatch', 'Check-in'],
    color: 'green',
  },
  {
    id: 'business_management',
    name: 'Business Operations',
    description: 'Comprehensive business management console with AI-powered quoting, invoicing, lead management, and inventory tracking.',
    tier: 'single_point',
    agentCount: 2,
    tabs: ['Aura Live', 'Quote', 'Invoice', 'Lead', 'Appts', 'Inventory', 'Companies', 'Employees', 'Customers'],
    color: 'purple',
  },
  {
    id: 'analytics_reports',
    name: 'Analytics & Reports',
    description: 'Advanced analytics console powered by a single Analytics Intelligence Agent covering performance, revenue, insights, and forecasting with 8 specialized tabs.',
    tier: 'multi_track',
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
    requiredFor: 'Logistics+ (Business Finance Agent)',
    optional: true,
  },
  {
    name: 'Social Media (Platform OAuth)',
    purpose: 'Manual Bridge posting (available now) + Own API credentials for automatic posting.',
    cost: 'Free (Manual Bridge) or Free (Own API setup)',
    requiredFor: 'Growth+ (Social Media Ops — Creative Content Agent)',
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
  totalConsoles: 7,  // 7 Control Centers (AI Operatives Hub is a management interface, not counted)
  totalTiers: 5,
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
    availableFor: ['single_point', 'multi_track'],
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

export function getTierByPrice(price: number): TierConfig | undefined {
  return Object.values(SUBSCRIPTION_TIERS).find(tier => tier.price === price);
}

// Tier hierarchy for the 5-tier system
const TIER_HIERARCHY_DOC: Record<string, number> = {
  free: 0,
  // Legacy IDs (for backward compatibility)
  express: 1,
  aura_flow: 1,
  starter: 1,
  scheduling: 1,
  // 5-Tier IDs
  aura_connect: 1,
  // Growth
  halo: 2,
  core: 2,
  business: 2,
  growth: 2,
  aura_growth: 2,
  // Logistics
  single_point: 3,
  field_ops: 3,
  // Performance
  multi_track: 4,
  performance: 4,
  // Command
  command: 5,
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
    social_media: { required: false, reason: 'Not available on Connect tier' },
  },
  aura_growth: {
    stripe: { required: false, reason: 'Optional for accepting payments' },
    signalwire: { required: true, reason: 'Required for Talk to Aura voice calls and SMS reminders' },
    elevenlabs: { required: true, reason: 'Required for AI voice synthesis' },
    resend: { required: true, reason: 'Required for email notifications' },
    tavily: { required: false, reason: 'Optional for AI content research' },
    calendar: { required: true, reason: 'Required for Customer Portal scheduling' },
    a2p_10dlc: { required: true, reason: 'Required for US SMS compliance' },
    social_media: { required: false, reason: 'Optional for Growth tier' },
  },
  single_point: {
    stripe: { required: true, reason: 'Required for Business Finance Agent invoice payments' },
    signalwire: { required: true, reason: 'Required for voice calls and SMS reminders' },
    elevenlabs: { required: true, reason: 'Required for AI voice synthesis' },
    resend: { required: true, reason: 'Required for email reminders' },
    tavily: { required: false, reason: 'Optional for AI content research' },
    calendar: { required: true, reason: 'Required for field operations scheduling' },
    a2p_10dlc: { required: true, reason: 'Required for US SMS compliance' },
    social_media: { required: false, reason: 'Optional for Logistics tier' },
  },
  multi_track: {
    stripe: { required: true, reason: 'Required for invoicing and payments' },
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

// Backward compatibility aliases
export const INTEGRATION_REQUIREMENTS_COMPAT: Record<string, string> = {
  express: 'aura_connect',
  aura_flow: 'aura_connect',
  starter: 'aura_connect',
  scheduling: 'aura_connect',
  halo: 'aura_growth',
  core: 'aura_growth',
  growth: 'aura_growth',
  business: 'aura_growth',
  field_ops: 'single_point',
  performance: 'multi_track',
};

// Get integration requirements for a specific tier
export function getIntegrationRequirements(tier: string | null): Record<IntegrationId, IntegrationRequirement> {
  if (!tier) return INTEGRATION_REQUIREMENTS.free;
  // Normalize legacy tier names
  const normalized = INTEGRATION_REQUIREMENTS_COMPAT[tier] ?? tier;
  return INTEGRATION_REQUIREMENTS[normalized] || INTEGRATION_REQUIREMENTS.free;
}
