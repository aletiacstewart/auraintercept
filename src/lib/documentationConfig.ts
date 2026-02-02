/**
 * Master Documentation Configuration
 * Single source of truth for all platform data used across PDFs, Help pages, and guides.
 * Last updated: January 2026
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
    name: 'Aura Express',
    price: 197,
    annualPrice: 1970,
    annualSavings: 394,
    implementationFee: 299,
    employees: 2,
    operatives: 1,
    consoles: 0,
    description: 'AI voice and chat for restaurants with smart link sharing.',
    bestFor: 'Restaurants, cafes, food trucks, and food service businesses.',
    highlights: [
      'Message Aura (Text)',
      'Talk to Aura (Voice) for phone conversations',
      'Smart Link Sharing (Website, Menu, Ordering)',
      'Knowledge Base for FAQs',
      'Embeddable Chat Widget',
      'Designed specifically for restaurants',
    ],
    hasVoice: true,
    hasAutomation: false,
  },
  aura_flow: {
    id: 'aura_flow',
    name: 'Aura Flow',
    price: 297,
    annualPrice: 2970,
    annualSavings: 594,
    implementationFee: 399,
    employees: 2,
    operatives: 3,
    consoles: 0,
    description: 'AI voice, chat, and scheduling with calendar sync.',
    bestFor: 'Service businesses needing automated booking without a customer portal.',
    highlights: [
      'AI Receptionist for 24/7 engagement',
      'Message Aura (Text) + Talk to Aura (Voice)',
      'Smart Link Sharing',
      'Scheduling Agent with calendar sync',
      'Follow-up Agent (SMS + Email)',
      'Knowledge Base for FAQs',
    ],
    hasVoice: true,
    hasAutomation: true,
  },
  halo: {
    id: 'halo',
    name: 'Aura Halo',
    price: 397,
    annualPrice: 3970,
    annualSavings: 794,
    implementationFee: 499,
    employees: 3,
    operatives: 3,
    consoles: 1,
    description: 'AI-automated for salons and wellness businesses.',
    bestFor: 'Nail salons, hair salons, barbers, massage centers, spas, and wellness businesses.',
    highlights: [
      'AI Receptionist for 24/7 customer engagement',
      'Scheduling Agent for online booking',
      'Follow-up Agent for SMS/Email confirmations',
      'Message Aura (Text) + Talk to Aura (Voice)',
      '1 Console: Customer Portal',
      'Designed specifically for beauty & wellness',
    ],
    hasVoice: true,
    hasAutomation: true,
  },
  core: {
    id: 'core',
    name: 'Aura Core',
    price: 500,
    annualPrice: 5000,
    annualSavings: 1000,
    implementationFee: 499,
    employees: 2,
    operatives: 0, // Tools only, no AI automation
    consoles: 0,
    description: 'AI-assisted digital foundation with no automation.',
    bestFor: 'Businesses wanting AI-ready tools without automated workflows.',
    highlights: [
      'Message Aura (Text) (Chat Tool)',
      'Social Media Signal content tool',
      'Web Presence (1-page site)',
      'No AI automation - manual workflow only',
      '2 Employee Accounts',
      'No Talk to Aura (Voice) - text only',
    ],
    hasVoice: false,
    hasAutomation: false,
  },
  single_point: {
    id: 'single_point',
    name: 'Single-Point',
    price: 1500,
    annualPrice: 15000,
    annualSavings: 3000,
    implementationFee: 499,
    employees: 5,
    operatives: 3,
    consoles: 1,
    description: 'AI-automated lead intake and reputation management.',
    bestFor: 'Small service companies focused on lead capture and review collection.',
    highlights: [
      '3 AI Operatives: Receptionist, Follow-up, Review',
      '1 Console: Customer Portal',
      'Message Aura (Text) + Talk to Aura (Voice) included',
      'Choice of Social Media Signal OR Web Presence',
      'AI Outbound Calls for reminders (requires Twilio)',
      'Knowledge Base for intelligent responses',
      'Call to Book (no online scheduling)',
      'Up to 5 employees',
    ],
    hasVoice: true,
    hasAutomation: true,
  },
  multi_track: {
    id: 'multi_track',
    name: 'Multi-Track',
    price: 3997,
    annualPrice: 39970,
    annualSavings: 7994,
    implementationFee: 499,
    employees: 10,
    operatives: 10,
    consoles: 2,
    description: 'Full field operations with 10 AI operatives.',
    bestFor: 'Growing companies with field technicians needing dispatch automation and online booking.',
    highlights: [
      'Everything in Single-Point',
      '10 AI Operatives',
      '2 Consoles: Customer Portal + Field Operations',
      'Online appointment booking via AI',
      'Smart dispatch and job assignment',
      'Real-time GPS routing and navigation',
      'Customer ETA notifications',
      'Quoting and invoicing from the field',
      'Up to 10 employees',
    ],
    hasVoice: true,
    hasAutomation: true,
  },
  command: {
    id: 'command',
    name: 'Aura Pro Command',
    price: 5997,
    annualPrice: 59970,
    annualSavings: 11994,
    implementationFee: 'Custom',
    employees: 25,
    operatives: 24,
    consoles: 7,
    description: 'Enterprise automation with full 24-operative suite.',
    bestFor: 'Large service companies with 15+ technicians or multi-location operations.',
    highlights: [
      'All 24 AI Operatives',
      'All 7 Consoles',
      'Everything in Multi-Track',
      'Business Operations console',
      'Marketing & Sales automation',
      'Social Media Signal Ops (6 platforms)',
      'Analytics & Reports (8 tabs)',
      'Inventory management with reorder alerts',
      'Multi-location support',
      'White-label branding',
      '25 Employee Accounts',
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
    tier: 'halo',
    dependencies: [],
    isCore: true,
    worksAlone: true,
  },
  {
    id: 'booking',
    name: 'Scheduling Agent',
    description: 'Books appointments by checking technician availability, confirming dates and times, and sending confirmation messages.',
    console: 'customer_portal',
    tier: 'halo',
    dependencies: ['triage'],
    isCore: false,
    worksAlone: false,
  },
  {
    id: 'followup',
    name: 'Follow-up Agent',
    description: 'Sends appointment reminders before service, follows up after completion, and handles confirmation requests.',
    console: 'customer_portal',
    tier: 'halo',
    dependencies: ['triage'],
    isCore: false,
    worksAlone: false,
  },
  {
    id: 'review',
    name: 'Review Agent',
    description: 'Collects customer reviews after service completion. Directs satisfied customers to leave reviews on Google, Yelp, or Facebook.',
    console: 'customer_portal',
    tier: 'single_point',
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
    tier: 'command',
    dependencies: [],
    isCore: true,
    worksAlone: true,
  },
  {
    id: 'lead',
    name: 'Lead Agent',
    description: 'Qualifies and scores incoming leads based on engagement. Automates follow-up sequences to move leads through the pipeline.',
    console: 'marketing_sales',
    tier: 'command',
    dependencies: [],
    isCore: false,
    worksAlone: true,
  },
  {
    id: 'marketing',
    name: 'Marketing Agent',
    description: 'Manages customer segments, promo codes, referral tracking, and win-back targeting for inactive customers.',
    console: 'marketing_sales',
    tier: 'command',
    dependencies: [],
    isCore: false,
    worksAlone: true,
  },
  // Social Media Console - 3 agents
  {
    id: 'social_content',
    name: 'Social Media Signal Agent',
    description: 'Creates posts for 6 platforms: Instagram, Facebook, LinkedIn, TikTok, Google My Business, and SMS.',
    console: 'social_media',
    tier: 'command',
    dependencies: [],
    isCore: true,
    worksAlone: true,
  },
  {
    id: 'social_scheduler',
    name: 'Signal Scheduler',
    description: 'Queues and publishes social media content at optimal times. Manages content calendar and scheduling.',
    console: 'social_media',
    tier: 'command',
    dependencies: ['social_content'],
    isCore: false,
    worksAlone: false,
  },
  {
    id: 'social_analytics',
    name: 'Signal Analytics',
    description: 'Tracks engagement metrics across all social platforms. Provides insights on post performance and audience growth.',
    console: 'social_media',
    tier: 'command',
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
  // Virtual Assistant - 1 agent (available to all tiers with Talk to Aura)
  {
    id: 'assistant',
    name: 'Aura Assistant',
    description: 'Voice and text-based virtual assistant for platform navigation and quick actions.',
    console: 'all',
    tier: 'core',
    dependencies: [],
    isCore: true,
    worksAlone: true,
  },
  // Content Engine Console - 1 agent
  {
    id: 'creative',
    name: 'Creative Agent',
    description: 'Unified AI content generation for all channels. Creates on-brand content for web presence, social media, campaigns, blogs, and lead nurturing with consistent voice and messaging.',
    console: 'content_engine',
    tier: 'command',
    dependencies: [],
    isCore: true,
    worksAlone: true,
  },
  // Web Presence Console - 1 agent
  {
    id: 'web_presence',
    name: 'Web Presence Agent',
    description: 'AI-powered website and blog management. Auto-optimizes SEO, suggests content updates, monitors site performance, and auto-publishes blog posts from the Content Engine.',
    console: 'web_presence',
    tier: 'command',
    dependencies: ['creative'],
    isCore: true,
    worksAlone: true,
  },
];

// ============================================
// CONSOLES - 7 TOTAL
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
    tier: 'halo',
    agentCount: 4,
    tabs: ['Chat', 'Voice', 'Services', 'Hours', 'Feedback', 'Track', 'Billing'],
    color: 'blue',
  },
  {
    id: 'field_operations',
    name: 'Field Operations',
    description: 'Mobile-optimized console for field technicians with AI-powered dispatch, real-time GPS routing, and one-tap job management.',
    tier: 'multi_track',
    agentCount: 4,
    tabs: ['Accept Job', 'Get Directions', 'Mark En Route', 'Update ETA', 'Arrive & Start', 'Complete Job', 'Generate Quote', 'Generate Invoice', 'Contact Dispatch'],
    color: 'green',
  },
  {
    id: 'business_management',
    name: 'Business Operations',
    description: 'Comprehensive business management console with AI-powered quoting, invoicing, lead management, and inventory tracking.',
    tier: 'command',
    agentCount: 4,
    tabs: ['Quote', 'Invoice', 'Lead', 'Appointments', 'Inventory', 'Companies', 'Employees', 'Customers'],
    color: 'purple',
  },
  {
    id: 'marketing_sales',
    name: 'Outreach & Sales Ops',
    description: 'AI-powered marketing automation with campaign management, customer segmentation, promotional tools, and lead nurturing.',
    tier: 'command',
    agentCount: 3,
    tabs: ['Campaign', 'Leads', 'Marketing'],
    color: 'orange',
  },
  {
    id: 'social_media',
    name: 'Social Media Signal Ops',
    description: 'AI-powered social media signal management with content creation for 6 platforms, scheduling, and visual content calendar.',
    tier: 'command',
    agentCount: 3,
    tabs: ['New Post', 'Drafts', 'Scheduled', 'Calendar'],
    color: 'pink',
  },
  {
    id: 'analytics_reports',
    name: 'Analytics & Reports',
    description: 'Advanced analytics console with 8 specialized tabs for comprehensive business intelligence, forecasting, and multi-format report export.',
    tier: 'command',
    agentCount: 4,
    tabs: ['Performance', 'Revenue', 'Insights', 'Forecast', 'KPIs', 'Social', 'Reminders', 'Export'],
    color: 'cyan',
  },
  {
    id: 'ai_operatives_hub',
    name: 'AI Operatives Hub',
    description: 'Central management console for the Aura Intelligence Network. Configure, monitor, and analyze all 24 AI operatives.',
    tier: 'halo',
    agentCount: 0,
    tabs: ['Operatives', 'Quick Start', 'Monitor', 'Analytics', 'History'],
    color: 'indigo',
  },
  {
    id: 'content_engine',
    name: 'Content Engine',
    description: 'Unified AI content generation console. Create on-brand content for website, social media, campaigns, blogs, and SMS from a single topic.',
    tier: 'command',
    agentCount: 1,
    tabs: ['Generate', 'Dashboard', 'Calendar', 'Brand Voice'],
    color: 'violet',
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
    name: 'Twilio',
    purpose: 'SMS & Voice Calls',
    cost: '$1.15/number + ~$30-100/mo usage',
    requiredFor: 'Halo+ (for Voice)',
    optional: false,
  },
  {
    name: 'ElevenLabs',
    purpose: 'AI Voice Synthesis (Proxy Voice Chat)',
    cost: '$0-99+/month based on usage',
    requiredFor: 'Halo+ (for Voice)',
    optional: false,
  },
  {
    name: 'Resend',
    purpose: 'Email Notifications',
    cost: '$0-20+/month based on volume',
    requiredFor: 'All Tiers',
    optional: false,
  },
  {
    name: 'Google Calendar',
    purpose: 'Calendar Sync (Two-way)',
    cost: 'Free',
    requiredFor: 'Optional for Halo+',
    optional: true,
  },
  {
    name: 'Stripe',
    purpose: 'Invoice Payments',
    cost: '2.9% + $0.30/transaction',
    requiredFor: 'All Tiers',
    optional: false,
  },
  {
    name: 'Social Media Accounts',
    purpose: 'Content Publishing',
    cost: 'Free (platform accounts)',
    requiredFor: 'Core+ (for Social Media Signal)',
    optional: true,
  },
];

// ============================================
// PLATFORM STATISTICS
// ============================================

export const PLATFORM_STATS = {
  totalOperatives: 24,
  totalConsoles: 8,
  totalTiers: 7,
  startingPrice: 197,
  maxEmployees: 25,
  socialPlatforms: 6,
  analyticsTabs: 8,
  industries: ['HVAC', 'Plumbing', 'Electrical', 'General Contracting', 'Beauty & Wellness', 'Restaurants', 'Personal Services'],
};

// ============================================
// ADD-ONS & EXTRAS
// ============================================

export const ADDON_PRICING = {
  socialMediaSignal: {
    name: 'Social Media Signal',
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
