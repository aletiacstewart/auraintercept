/**
 * Master Documentation Configuration
 * Single source of truth for all platform data used across PDFs, Help pages, and guides.
 * Last updated: February 2026
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
    hasAutomation: false,  // No automation consoles
  },
  aura_flow: {
    id: 'aura_flow',
    name: 'Aura Scheduling',
    price: 397,
    annualPrice: 3970,
    annualSavings: 794,
    implementationFee: 399,
    employees: 3,
    operatives: 3,  // triage, booking, followup
    consoles: 1,  // Customer Portal
    description: 'AI voice, chat, and scheduling with calendar sync.',
    bestFor: 'Service businesses needing automated booking with a customer portal.',
    highlights: [
      'AI Receptionist for 24/7 engagement',
      'Message Aura (Text) + Talk to Aura (Voice)',
      'Scheduling Agent with calendar sync',
      'Follow-up Agent (SMS + Email)',
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
    operatives: 11,  // Added review agent + marketing stack
    consoles: 3,
    description: 'AI-automated for salons and wellness businesses.',
    bestFor: 'Nail salons, hair salons, barbers, massage centers, spas, and wellness businesses.',
    highlights: [
      'AI Receptionist for 24/7 customer engagement',
      'Message Aura (Text) + Talk to Aura (Voice)',
      'Scheduling Agent + Follow-up Agent + Review Agent',
      'Customer Portal Console',
      'Outreach & Sales Ops (Campaign, Lead, Marketing agents)',
      'Social Media Ops (Content, Scheduler, Analytics agents)',
      'Creative Agent for content generation',
      'Designed specifically for beauty & wellness',
      'API Access',
    ],
    hasVoice: true,
    hasAutomation: true,
  },
  core: {
    id: 'core',
    name: 'Aura Business',
    price: 797,
    annualPrice: 7970,
    annualSavings: 1594,
    implementationFee: 499,
    employees: 8,
    operatives: 12,
    consoles: 4,
    description: 'AI-assisted digital foundation with marketing and web presence tools.',
    bestFor: 'Businesses wanting AI-ready tools with marketing automation and web presence.',
    highlights: [
      'AI Receptionist for 24/7 engagement',
      'Message Aura (Text)',
      'Outreach & Sales Ops (Campaign, Lead, Marketing agents)',
      'Social Media Ops (Content, Scheduler, Analytics agents)',
      'Creative Agent for content generation',
      'Web Presence Agent (AI-powered site)',
      'Creative & Web Presence Console',
      '8 Employee Accounts',
      'API Access',
    ],
    hasVoice: true,
    hasAutomation: true,
  },
  single_point: {
    id: 'single_point',
    name: 'Aura Field Ops',
    price: 1497,
    annualPrice: 14970,
    annualSavings: 2994,
    implementationFee: 499,
    employees: 15,
    operatives: 18,  // Field operations stack
    consoles: 6,
    description: 'Complete field operations with dispatch, routing, and quoting.',
    bestFor: 'Service companies with field technicians needing dispatch automation.',
    highlights: [
      'AI Receptionist + Scheduling Agent + Follow-up + Review agents',
      'Message Aura (Text) + Talk to Aura (Voice)',
      'Customer Portal Console',
      'Field Operations Console (Dispatch, Route, ETA, Check-in)',
      'Business Management Console (Quoting, Invoice)',
      'Outreach & Sales Ops (Campaign, Lead, Marketing agents)',
      'Social Media Ops (Content, Scheduler, Analytics agents)',
      'Creative Agent + Web Presence Agent',
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
    price: 3497,
    annualPrice: 34970,
    annualSavings: 6994,
    implementationFee: 499,
    employees: 25,
    operatives: 22,  // 22 agents - basic analytics (excludes revenue, forecast)
    consoles: 7,  // All 7 consoles
    description: 'Full business automation with basic analytics and intelligence.',
    bestFor: 'Growing companies needing comprehensive automation and basic analytics.',
    highlights: [
      'Everything in Field Ops',
      '22 AI Operatives (basic analytics)',
      'All 7 Consoles',
      'Business Operations console (Admin, Inventory)',
      'Analytics & Reports (Insights, Performance metrics)',
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
    price: 5497,
    annualPrice: 54970,
    annualSavings: 10994,
    implementationFee: 'Custom',
    employees: 50,
    operatives: 24,  // Full 24-agent suite including revenue + forecast
    consoles: 7,  // All 7 Control Centers (AI Operatives Hub is management interface, not a console)
    description: 'Enterprise automation with full 24-operative suite and predictive analytics.',
    bestFor: 'Large service companies with 15+ technicians or multi-location operations.',
    highlights: [
      'All 24 AI Operatives',
      'All 7 Control Centers + AI Operatives Hub (Management Interface)',
      'Everything in Performance',
      'Advanced Analytics (Revenue + Forecast agents)',
      'Predictive intelligence and demand forecasting',
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
// AI OPERATIVES - 24 TOTAL
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
  // Customer Portal Console - 4 agents
  {
    id: 'triage',
    name: 'AI Receptionist',
    description: 'First point of contact for all customers. Greets visitors, understands their needs, and routes them to the right agent or information.',
    console: 'customer_portal',
    tier: 'express',  // Universal agent - available on all paid tiers
    dependencies: [],
    isCore: true,
    worksAlone: true,
  },
  {
    id: 'booking',
    name: 'Scheduling Agent',
    description: 'Books appointments by checking technician availability, confirming dates and times, and sending confirmation messages.',
    console: 'customer_portal',
    tier: 'aura_flow',
    dependencies: ['triage'],
    isCore: false,
    worksAlone: false,
  },
  {
    id: 'followup',
    name: 'Follow-up Agent',
    description: 'Sends appointment reminders before service, follows up after completion, and handles confirmation requests.',
    console: 'customer_portal',
    tier: 'aura_flow',
    dependencies: ['triage'],
    isCore: false,
    worksAlone: false,
  },
  {
    id: 'review',
    name: 'Review Agent',
    description: 'Collects customer reviews after service completion. Directs satisfied customers to leave reviews on Google, Yelp, or Facebook.',
    console: 'customer_portal',
    tier: 'halo',  // Changed from single_point to halo
    dependencies: ['followup'],
    isCore: false,
    worksAlone: false,
  },
  // Field Operations Console - 4 agents
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
    id: 'route',
    name: 'Route Agent',
    description: 'Plans the best driving routes for technicians. Considers traffic, distance, and appointment times to minimize travel.',
    console: 'field_operations',
    tier: 'multi_track',
    dependencies: ['dispatch'],
    isCore: false,
    worksAlone: false,
  },
  {
    id: 'eta',
    name: 'ETA Agent',
    description: 'Calculates and communicates arrival times to customers. Automatically updates estimates based on traffic and delays.',
    console: 'field_operations',
    tier: 'multi_track',
    dependencies: ['dispatch', 'route'],
    isCore: false,
    worksAlone: false,
  },
  {
    id: 'checkin',
    name: 'Check-in Agent',
    description: 'Tracks when technicians arrive at jobs and start work. Logs job progress and completion for accountability.',
    console: 'field_operations',
    tier: 'multi_track',
    dependencies: ['dispatch'],
    isCore: false,
    worksAlone: false,
  },
  // Business Operations Console - 4 agents
  {
    id: 'admin',
    name: 'Admin Agent',
    description: 'Handles general business administration tasks. Manages settings, user access, and administrative operations.',
    console: 'business_management',
    tier: 'command',
    dependencies: [],
    isCore: true,
    worksAlone: true,
  },
  {
    id: 'quoting',
    name: 'Quoting Agent',
    description: 'Creates price quotes for customers based on service type, materials, and labor. Supports multi-line item quotes.',
    console: 'business_management',
    tier: 'multi_track',
    dependencies: [],
    isCore: false,
    worksAlone: true,
  },
  {
    id: 'invoice',
    name: 'Invoice Agent',
    description: 'Generates invoices from completed jobs or quotes. Tracks payment status and sends payment reminders.',
    console: 'business_management',
    tier: 'multi_track',
    dependencies: ['quoting'],
    isCore: false,
    worksAlone: false,
  },
  {
    id: 'inventory',
    name: 'Inventory Agent',
    description: 'Tracks parts, materials, and supplies. Alerts when stock is low and helps plan reorders.',
    console: 'business_management',
    tier: 'command',
    dependencies: [],
    isCore: false,
    worksAlone: true,
  },
  // Outreach & Sales Console - 3 agents
  {
    id: 'campaign',
    name: 'Campaign Agent',
    description: 'Creates and sends email/SMS campaigns. Manages campaign scheduling and performance analytics.',
    console: 'marketing_sales',
    tier: 'halo',  // Changed from express to halo
    dependencies: [],
    isCore: true,
    worksAlone: true,
  },
  {
    id: 'lead',
    name: 'Lead Agent',
    description: 'Qualifies and scores incoming leads based on engagement. Automates follow-up sequences to move leads through the pipeline.',
    console: 'marketing_sales',
    tier: 'halo',  // Changed from express to halo
    dependencies: [],
    isCore: false,
    worksAlone: true,
  },
  {
    id: 'marketing',
    name: 'Marketing Agent',
    description: 'Manages customer segments, promo codes, referral tracking, and win-back targeting for inactive customers.',
    console: 'marketing_sales',
    tier: 'halo',  // Changed from express to halo
    dependencies: [],
    isCore: false,
    worksAlone: true,
  },
  // Social Media Console - 3 agents
  {
    id: 'social_content',
    name: 'Social Media Agent',
    description: 'Creates posts for 6 platforms: Instagram, Facebook, LinkedIn, TikTok, Google My Business, and SMS.',
    console: 'social_media',
    tier: 'aura_flow',  // Changed from express to aura_flow
    dependencies: [],
    isCore: true,
    worksAlone: true,
  },
  {
    id: 'social_scheduler',
    name: 'Social Media Scheduler',
    description: 'Queues and publishes social media content at optimal times. Manages content calendar and scheduling.',
    console: 'social_media',
    tier: 'aura_flow',  // Changed from express to aura_flow
    dependencies: ['social_content'],
    isCore: false,
    worksAlone: false,
  },
  {
    id: 'social_analytics',
    name: 'Social Media Analytics',
    description: 'Tracks engagement metrics across all social platforms. Provides insights on post performance and audience growth.',
    console: 'social_media',
    tier: 'aura_flow',  // Changed from express to aura_flow
    dependencies: ['social_content'],
    isCore: false,
    worksAlone: false,
  },
  // Analytics Console - 4 agents
  {
    id: 'insights',
    name: 'Insights Agent',
    description: 'Provides natural language business queries. Answer questions about your business data conversationally.',
    console: 'analytics_reports',
    tier: 'command',
    dependencies: [],
    isCore: true,
    worksAlone: true,
  },
  {
    id: 'performance',
    name: 'Performance Agent',
    description: 'Tracks KPIs and operational metrics. Monitors technician performance, job completion rates, and efficiency.',
    console: 'analytics_reports',
    tier: 'command',
    dependencies: [],
    isCore: false,
    worksAlone: true,
  },
  {
    id: 'revenue',
    name: 'Revenue Agent',
    description: 'Analyzes financial trends and forecasts. Tracks revenue by service type, technician, and time period.',
    console: 'analytics_reports',
    tier: 'command',
    dependencies: [],
    isCore: false,
    worksAlone: true,
  },
  {
    id: 'forecast',
    name: 'Forecast Agent',
    description: 'Predicts demand and capacity needs. Helps plan staffing and inventory based on historical patterns.',
    console: 'analytics_reports',
    tier: 'command',
    dependencies: [],
    isCore: false,
    worksAlone: true,
  },
  // Creative & Web Presence Console - 2 agents
  {
    id: 'creative',
    name: 'Creative Agent',
    description: 'Unified AI content generation for all channels. Creates on-brand content for web presence, social media, campaigns, blogs, and lead nurturing with consistent voice and messaging.',
    console: 'creative_web_presence',
    tier: 'aura_flow',  // Changed from express to aura_flow
    dependencies: [],
    isCore: true,
    worksAlone: true,
  },
  // Web Presence Agent - Part of Creative & Web Presence
  {
    id: 'web_presence',
    name: 'Web Presence Agent',
    description: 'AI-powered website and blog management. Auto-optimizes SEO, suggests content updates, monitors site performance, and auto-publishes blog posts from the Content Engine.',
    console: 'creative_web_presence',
    tier: 'single_point',  // Changed from command to single_point
    dependencies: ['creative'],
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
    agentCount: 4,
    tabs: ['Chat', 'Voice', 'Services', 'Hours', 'Feedback', 'Track', 'Billing'],
    color: 'blue',
  },
  {
    id: 'field_operations',
    name: 'Field Operations',
    description: 'Mobile-optimized console for field technicians with AI-powered dispatch, real-time GPS routing, and one-tap job management.',
    tier: 'single_point',
    agentCount: 4,
    tabs: ['Map View', 'Schedule', 'Dispatch', 'Check-in'],
    color: 'green',
  },
  {
    id: 'business_management',
    name: 'Business Operations',
    description: 'Comprehensive business management console with AI-powered quoting, invoicing, lead management, and inventory tracking.',
    tier: 'single_point',
    agentCount: 4,
    tabs: ['Aura Live', 'Quote', 'Invoice', 'Lead', 'Appts', 'Inventory', 'Companies', 'Employees', 'Customers'],
    color: 'purple',
  },
  {
    id: 'marketing_sales',
    name: 'Outreach & Sales Ops',
    description: 'AI-powered marketing automation with campaign management, customer segmentation, promotional tools, and lead nurturing.',
    tier: 'halo',
    agentCount: 3,
    tabs: ['Campaign', 'Leads', 'Marketing'],
    color: 'orange',
  },
  {
    id: 'social_media',
    name: 'Social Media Ops',
    description: 'AI-powered social media management with content creation for 6 platforms, scheduling, and visual content calendar.',
    tier: 'halo',
    agentCount: 3,
    tabs: ['Home', 'Social Posts', 'Analytics'],
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
    description: 'Advanced analytics console with 8 specialized tabs for comprehensive business intelligence, forecasting, and multi-format report export.',
    tier: 'multi_track',
    agentCount: 4,
    tabs: ['Performance', 'Revenue', 'Insights', 'Forecast', 'KPIs', 'Social', 'Reminders', 'Export'],
    color: 'cyan',
  },
];

// Management Interfaces (separate from Control Centers)
export const MANAGEMENT_INTERFACES: ConsoleConfig[] = [
  {
    id: 'ai_operatives_hub',
    name: 'AI Operatives Hub',
    description: 'Central management interface for all 24 AI Operatives with real-time monitoring, batch activation, dependency visualization, and performance analytics.',
    tier: 'command',
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
    requiredFor: 'Scheduling+ (booking/scheduling agents)',
    optional: true,
  },
  {
    name: 'Stripe',
    purpose: 'Invoice Payments',
    cost: '2.9% + $0.30/transaction',
    requiredFor: 'Field Ops+ (invoicing)',
    optional: true,
  },
  {
    name: 'Social Media Accounts',
    purpose: 'Content Publishing',
    cost: 'Free (platform accounts)',
    requiredFor: 'Core+ (for Social Media)',
    optional: true,
  },
];

// ============================================
// PLATFORM STATISTICS
// ============================================

export const PLATFORM_STATS = {
  totalOperatives: 24,
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
    description: 'AI-powered content creation for 6 platforms',
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

export type IntegrationId = 'stripe' | 'signalwire' | 'elevenlabs' | 'resend' | 'tavily' | 'calendar' | 'a2p_10dlc';

export interface IntegrationRequirement {
  required: boolean; // true = auto-enabled + locked, false = optional (soft lock)
  reason?: string; // Why it's required/optional
}

// Maps integration ID to tier requirements
// 'required: true' = auto-enabled and cannot be disabled
// 'required: false' = optional, user can enable if they want
export const INTEGRATION_REQUIREMENTS: Record<string, Record<IntegrationId, IntegrationRequirement>> = {
  express: {
    stripe: { required: false, reason: 'Optional for accepting payments' },
    signalwire: { required: true, reason: 'Required for Talk to Aura voice calls and SMS reminders' },
    elevenlabs: { required: true, reason: 'Required for AI voice synthesis' },
    resend: { required: true, reason: 'Required for email notifications' },
    tavily: { required: false, reason: 'Not included in your plan' },
    calendar: { required: false, reason: 'Optional for appointment sync' },
    a2p_10dlc: { required: true, reason: 'Required for US SMS compliance' },
  },
  aura_flow: {
    stripe: { required: false, reason: 'Optional for accepting payments' },
    signalwire: { required: true, reason: 'Required for voice calls and SMS reminders' },
    elevenlabs: { required: true, reason: 'Required for AI voice synthesis' },
    resend: { required: true, reason: 'Required for email follow-ups' },
    tavily: { required: false, reason: 'Not included in your plan' },
    calendar: { required: true, reason: 'Required for Scheduling Agent calendar sync' },
    a2p_10dlc: { required: true, reason: 'Required for US SMS compliance' },
  },
  halo: {
    stripe: { required: false, reason: 'Optional for accepting payments' },
    signalwire: { required: true, reason: 'Required for Talk to Aura voice calls and SMS reminders' },
    elevenlabs: { required: true, reason: 'Required for AI voice synthesis' },
    resend: { required: true, reason: 'Required for email notifications' },
    tavily: { required: false, reason: 'Not included in your plan' },
    calendar: { required: true, reason: 'Required for Customer Portal scheduling' },
    a2p_10dlc: { required: true, reason: 'Required for US SMS compliance' },
  },
  core: {
    stripe: { required: false, reason: 'Optional for accepting payments' },
    signalwire: { required: true, reason: 'Required for Talk to Aura voice calls and SMS reminders' },
    elevenlabs: { required: true, reason: 'Required for AI voice synthesis' },
    resend: { required: true, reason: 'Required for email notifications' },
    tavily: { required: false, reason: 'Optional for AI content research' },
    calendar: { required: false, reason: 'Optional for appointment sync' },
    a2p_10dlc: { required: true, reason: 'Required for US SMS compliance' },
  },
  single_point: {
    stripe: { required: true, reason: 'Required for invoice payments' },
    signalwire: { required: true, reason: 'Required for voice calls and SMS reminders' },
    elevenlabs: { required: true, reason: 'Required for AI voice synthesis' },
    resend: { required: true, reason: 'Required for email reminders' },
    tavily: { required: false, reason: 'Optional for AI content research' },
    calendar: { required: true, reason: 'Required for field operations scheduling' },
    a2p_10dlc: { required: true, reason: 'Required for US SMS compliance' },
  },
  multi_track: {
    stripe: { required: true, reason: 'Required for invoicing and payments' },
    signalwire: { required: true, reason: 'Required for dispatch notifications and voice' },
    elevenlabs: { required: true, reason: 'Required for AI voice synthesis' },
    resend: { required: true, reason: 'Required for email notifications' },
    tavily: { required: false, reason: 'Optional for AI content research' },
    calendar: { required: true, reason: 'Required for field operations scheduling' },
    a2p_10dlc: { required: true, reason: 'Required for US SMS compliance' },
  },
  command: {
    stripe: { required: true, reason: 'Required for invoicing and payments' },
    signalwire: { required: true, reason: 'Required for full communication suite' },
    elevenlabs: { required: true, reason: 'Required for AI voice synthesis' },
    resend: { required: true, reason: 'Required for email campaigns' },
    tavily: { required: false, reason: 'Optional for AI content research' },
    calendar: { required: true, reason: 'Required for enterprise scheduling' },
    a2p_10dlc: { required: true, reason: 'Required for US SMS compliance' },
  },
  // Fallback for free/unknown tiers
  free: {
    stripe: { required: false, reason: 'Subscribe to enable payments' },
    signalwire: { required: false, reason: 'Subscribe to enable voice/SMS' },
    elevenlabs: { required: false, reason: 'Subscribe to enable AI voice' },
    resend: { required: false, reason: 'Subscribe to enable email' },
    tavily: { required: false, reason: 'Subscribe to enable AI research' },
    calendar: { required: false, reason: 'Subscribe to enable calendar sync' },
    a2p_10dlc: { required: false, reason: 'Subscribe to enable SMS compliance' },
  },
};

// Get integration requirements for a specific tier
export function getIntegrationRequirements(tier: string | null): Record<IntegrationId, IntegrationRequirement> {
  return INTEGRATION_REQUIREMENTS[tier || 'free'] || INTEGRATION_REQUIREMENTS.free;
}
