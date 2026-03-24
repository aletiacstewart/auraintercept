/**
 * Master Documentation Configuration
 * Single source of truth for all platform data used across PDFs, Help pages, and guides.
 * Last updated: March 2026 — Consolidated to 10 AI Operatives
 */

// ============================================
// SUBSCRIPTION TIERS - 7-TIER STRUCTURE
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
  express: {
    id: 'express',
    name: 'Aura Starter',
    price: 197,
    annualPrice: 1970,
    annualSavings: 394,
    implementationFee: 299,
    employees: 2,
    operatives: 1,  // Only AI Receptionist
    consoles: 0,  // No consoles
    description: 'AI voice and chat for restaurants with smart link sharing.',
    bestFor: 'Restaurants, cafes, food trucks, and food service businesses.',
    highlights: [
      'AI Receptionist for 24/7 engagement',
      'Message Aura (Text) + Talk to Aura (Voice)',
      'Smart Link Sharing (Website, Menu, Ordering)',
      'Knowledge Base for FAQs',
      'Embeddable Chat Widget',
      'API Access',
    ],
    hasVoice: true,
    hasAutomation: false,
  },
  aura_flow: {
    id: 'aura_flow',
    name: 'Aura Connect',
    price: 397,
    annualPrice: 3970,
    annualSavings: 794,
    implementationFee: 399,
    employees: 3,
    operatives: 2,  // triage + customer_journey
    consoles: 1,  // Customer Portal
    description: 'AI voice, chat, and scheduling with calendar sync.',
    bestFor: 'Service businesses needing automated booking with a customer portal.',
    highlights: [
      'AI Receptionist for 24/7 engagement',
      'Message Aura (Text) + Talk to Aura (Voice)',
      'Customer Journey Agent (Scheduling + Follow-up + Review)',
      'Customer Portal Console',
      'Smart Link Sharing',
      'Knowledge Base for FAQs',
      'API Access',
      '3 Employee Accounts',
    ],
    hasVoice: true,
    hasAutomation: true,
  },
  halo: {
    id: 'halo',
    name: 'Aura Growth',
    price: 597,
    annualPrice: 5970,
    annualSavings: 1194,
    implementationFee: 499,
    employees: 5,
    operatives: 4,  // triage + customer_journey + outreach + creative_content
    consoles: 3,
    description: 'AI-automated for salons and wellness businesses.',
    bestFor: 'Nail salons, hair salons, barbers, massage centers, spas, and wellness businesses.',
    highlights: [
      'AI Receptionist for 24/7 customer engagement',
      'Message Aura (Text) + Talk to Aura (Voice)',
      'Customer Journey Agent (Scheduling, Follow-up, Review)',
      'Customer Portal Console',
      'Outreach Agent (Campaign, Lead, Marketing)',
      'Creative Content Agent (Social, Images, Video, Web copy)',
      'Designed specifically for beauty & wellness',
      'API Access',
    ],
    hasVoice: true,
    hasAutomation: true,
  },
  core: {
    id: 'core',
    name: 'Aura Presence',
    price: 797,
    annualPrice: 7970,
    annualSavings: 1594,
    implementationFee: 499,
    employees: 8,
    operatives: 5,
    consoles: 4,
    description: 'AI-assisted digital foundation with marketing and web presence tools.',
    bestFor: 'Businesses wanting AI-ready tools with marketing automation and web presence.',
    highlights: [
      'AI Receptionist for 24/7 engagement',
      'Message Aura (Text)',
      'Outreach Agent (Campaign, Lead, Marketing)',
      'Creative Content Agent (Social, Images, Video)',
      'Web Presence Agent (AI-powered site + SEO)',
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
    operatives: 8,  // Field operations stack
    consoles: 6,
    description: 'Complete field operations with dispatch, routing, and quoting.',
    bestFor: 'Service companies with field technicians needing dispatch automation.',
    highlights: [
      'AI Receptionist + Customer Journey Agent',
      'Message Aura (Text) + Talk to Aura (Voice)',
      'Customer Portal Console',
      'Field Navigation Agent (Dispatch, Route, ETA, Check-in)',
      'Business Finance Agent (Quoting, Invoice)',
      'Outreach Agent + Creative Content Agent + Web Presence Agent',
      'AI Outbound Calls for reminders (requires SignalWire)',
      'Up to 15 employees',
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
    employees: 25,
    operatives: 10,  // All 10 agents
    consoles: 7,  // All 7 consoles
    description: 'Full business automation with analytics and intelligence.',
    bestFor: 'Growing companies needing comprehensive automation and analytics.',
    highlights: [
      'Everything in Logistics',
      'All 10 AI Operatives',
      'All 7 Consoles',
      'Admin Agent + Business Finance Agent (with Inventory)',
      'Analytics Intelligence Agent (Insights, Performance, Revenue, Forecast)',
      'Smart dispatch and job assignment',
      'Real-time GPS routing and navigation',
      'Up to 25 employees',
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
    employees: 50,
    operatives: 10,  // Full 10-agent suite
    consoles: 7,  // All 7 Control Centers
    description: 'Enterprise automation with full 10-operative suite and predictive analytics.',
    bestFor: 'Large service companies with 15+ technicians or multi-location operations.',
    highlights: [
      'All 10 AI Operatives',
      'All 7 Control Centers + AI Operatives Hub (Management Interface)',
      'Everything in Performance',
      'Advanced Predictive Analytics & Demand Forecasting',
      'Multi-location support',
      'White-label branding',
      '50 Employee Accounts',
      'API Access',
    ],
    hasVoice: true,
    hasAutomation: true,
    isEnterprise: true,
  },
};

// Tier order for display (price ascending)
export const TIER_ORDER = ['express', 'aura_flow', 'halo', 'core', 'single_point', 'multi_track', 'command'] as const;

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
  // Customer Portal Console - 2 agents
  {
    id: 'triage',
    name: 'AI Receptionist',
    description: 'First point of contact for all customers. Greets visitors, understands their needs, and routes them to the right agent or information.',
    console: 'customer_portal',
    tier: 'express',
    dependencies: [],
    isCore: true,
    worksAlone: true,
  },
  {
    id: 'customer_journey',
    name: 'Customer Journey Agent',
    description: 'End-to-end customer lifecycle management. Books appointments with calendar sync, sends SMS/email reminders, checks in after service completion, and collects Google/Yelp/Facebook reviews from satisfied customers.',
    console: 'customer_portal',
    tier: 'aura_flow',
    dependencies: ['triage'],
    isCore: false,
    worksAlone: false,
  },
  // Field Operations Console - 2 agents
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
  // Business Operations Console - 2 agents
  {
    id: 'admin',
    name: 'Admin Agent',
    description: 'Handles general business administration tasks. Manages settings, user access, and administrative operations.',
    console: 'business_management',
    tier: 'multi_track',
    dependencies: [],
    isCore: true,
    worksAlone: true,
  },
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
  // Outreach & Sales Console - 1 agent
  {
    id: 'outreach',
    name: 'Outreach Agent',
    description: 'Unified marketing and sales automation. Creates and sends email/SMS campaigns, qualifies and scores incoming leads with automated nurturing sequences, manages customer segments, promo codes, referral tracking, and win-back targeting.',
    console: 'marketing_sales',
    tier: 'halo',
    dependencies: [],
    isCore: true,
    worksAlone: true,
  },
  // Social Media / Creative Console - 2 agents
  {
    id: 'creative_content',
    name: 'Creative Content Agent',
    description: 'All-in-one creative studio. Generates platform-optimized social posts for Instagram, Facebook, LinkedIn, TikTok, Google Business, and SMS. Creates AI-generated images and video scripts, blog posts, email copy, website landing pages, and multi-channel content campaigns with consistent brand voice.',
    console: 'social_media',
    tier: 'halo',
    dependencies: [],
    isCore: true,
    worksAlone: true,
  },
  {
    id: 'web_presence',
    name: 'Web Presence Agent',
    description: 'AI-powered website and blog management. Auto-optimizes SEO, suggests content updates, monitors site performance, and auto-publishes blog posts from the Content Engine.',
    console: 'creative_web_presence',
    tier: 'core',
    dependencies: ['creative_content'],
    isCore: true,
    worksAlone: true,
  },
  // Analytics Console - 1 agent
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
    tier: 'aura_flow',
    agentCount: 2,
    tabs: ['AI Assistant', 'Services', 'Appointments', 'Voice AI', 'Contact', 'Hours'],
    color: 'blue',
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
    id: 'marketing_sales',
    name: 'Outreach & Sales Ops',
    description: 'AI-powered marketing automation with campaign management, customer segmentation, promotional tools, and lead nurturing — all in one Outreach Agent.',
    tier: 'halo',
    agentCount: 1,
    tabs: ['Campaign', 'Leads', 'Marketing'],
    color: 'orange',
  },
  {
    id: 'social_media',
    name: 'Social Media Ops',
    description: 'AI-powered creative studio for social media content creation across 6 platforms, AI image/video generation, and brand-consistent multi-channel content.',
    tier: 'halo',
    agentCount: 1,
    tabs: ['Home', 'Create Content', 'My Posts'],
    color: 'pink',
  },
  {
    id: 'creative_web_presence',
    name: 'Creative & Web Presence',
    description: 'Content Engine for unified multi-channel generation plus AI-powered website builder, blog management, and SEO optimization.',
    tier: 'core',
    agentCount: 2,
    tabs: ['Content Engine', 'Brand Voice', 'Generate', 'Dashboard', 'Calendar', 'Web Presence', 'Blog', 'SEO'],
    color: 'violet',
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
  totalTiers: 7,
  startingPrice: 197,
  maxEmployees: 50,
  socialPlatforms: 6,
  analyticsTabs: 8,
  industries: ['HVAC', 'Plumbing', 'Electrical', 'General Contracting', 'Beauty & Wellness', 'Restaurants', 'Personal Services'],
};

// ============================================
// ADD-ONS & EXTRAS
// ============================================

export const ADDON_PRICING = {
  socialMedia: {
    name: 'Social Media',
    price: 150,
    description: 'AI-powered creative content for 6 platforms',
    availableFor: ['single_point', 'multi_track'],
  },
  webPresence: {
    name: 'Web Presence',
    price: 150,
    description: '1-page professional website',
    availableFor: ['single_point', 'multi_track'],
  },
  additionalEmployees: {
    name: 'Additional Employees',
    price: 25,
    unit: 'per 10 employees',
    availableFor: ['single_point', 'multi_track'],
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

export function getTierByPrice(price: number): TierConfig | undefined {
  return Object.values(SUBSCRIPTION_TIERS).find(tier => tier.price === price);
}

export function getOperativesForTier(tierId: string): OperativeConfig[] {
  const tierHierarchy: Record<string, number> = {
    free: 0,
    express: 1,
    aura_flow: 2,
    halo: 3,
    core: 4,
    single_point: 5,
    multi_track: 6,
    command: 7,
  };
  
  const tierLevel = tierHierarchy[tierId] || 0;
  
  return AI_OPERATIVES.filter(op => {
    const opLevel = tierHierarchy[op.tier] || 0;
    return opLevel <= tierLevel;
  });
}

export function getConsolesForTierDoc(tierId: string): ConsoleConfig[] {
  const tierHierarchy: Record<string, number> = {
    free: 0,
    express: 1,
    aura_flow: 2,
    halo: 3,
    core: 4,
    single_point: 5,
    multi_track: 6,
    command: 7,
  };
  
  const tierLevel = tierHierarchy[tierId] || 0;
  
  return CONSOLES.filter(console => {
    const consoleLevel = tierHierarchy[console.tier] || 0;
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
  express: {
    stripe: { required: false, reason: 'Optional for accepting payments' },
    signalwire: { required: true, reason: 'Required for Talk to Aura voice calls and SMS reminders' },
    elevenlabs: { required: true, reason: 'Required for AI voice synthesis' },
    resend: { required: true, reason: 'Required for email notifications' },
    tavily: { required: false, reason: 'Optional for AI content research' },
    calendar: { required: false, reason: 'Optional for appointment sync' },
    a2p_10dlc: { required: true, reason: 'Required for US SMS compliance' },
    social_media: { required: false, reason: 'Not available on Starter tier' },
  },
  aura_flow: {
    stripe: { required: false, reason: 'Optional for accepting payments' },
    signalwire: { required: true, reason: 'Required for voice calls and SMS reminders' },
    elevenlabs: { required: true, reason: 'Required for AI voice synthesis' },
    resend: { required: true, reason: 'Required for email follow-ups' },
    tavily: { required: false, reason: 'Optional for AI content research' },
    calendar: { required: true, reason: 'Required for Customer Journey Agent calendar sync' },
    a2p_10dlc: { required: true, reason: 'Required for US SMS compliance' },
    social_media: { required: false, reason: 'Not available on Connect tier' },
  },
  halo: {
    stripe: { required: false, reason: 'Optional for accepting payments' },
    signalwire: { required: true, reason: 'Required for Talk to Aura voice calls and SMS reminders' },
    elevenlabs: { required: true, reason: 'Required for AI voice synthesis' },
    resend: { required: true, reason: 'Required for email notifications' },
    tavily: { required: false, reason: 'Optional for AI content research' },
    calendar: { required: true, reason: 'Required for Customer Portal scheduling' },
    a2p_10dlc: { required: true, reason: 'Required for US SMS compliance' },
    social_media: { required: false, reason: 'Optional for Growth tier' },
  },
  core: {
    stripe: { required: false, reason: 'Optional for accepting payments' },
    signalwire: { required: true, reason: 'Required for Talk to Aura voice calls and SMS reminders' },
    elevenlabs: { required: true, reason: 'Required for AI voice synthesis' },
    resend: { required: true, reason: 'Required for email notifications' },
    tavily: { required: false, reason: 'Optional for AI content research' },
    calendar: { required: true, reason: 'Required for Scheduling (inherits Connect+ agents)' },
    a2p_10dlc: { required: true, reason: 'Required for US SMS compliance' },
    social_media: { required: true, reason: 'Required for Social Media Ops (Presence tier)' },
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

// Get integration requirements for a specific tier
export function getIntegrationRequirements(tier: string | null): Record<IntegrationId, IntegrationRequirement> {
  return INTEGRATION_REQUIREMENTS[tier || 'free'] || INTEGRATION_REQUIREMENTS.free;
}
