/**
 * Declarative definitions for every agent on the platform:
 * 10 consolidated operatives (with their legacy aliases) + 14 industry specialists.
 *
 * This is the single source of truth for agent identity, aliases, tier gating,
 * tool-set selection and capability discovery. Prompt *text* for the 10
 * operatives still lives in the AGENT_PROMPTS table inside ai-agent-chat and is
 * injected into the registry at startup; specialist primers live here because
 * they are short and have no other home.
 *
 * Keep in sync with src/lib/agentCatalog.ts (a parity test enforces this).
 */

export type AgentTier = 'free' | 'starter' | 'connect' | 'performance' | 'command';

export const TIER_ORDER: Record<string, number> = {
  free: 0,
  starter: 1,
  connect: 2,
  performance: 3,
  command: 4,
};

/** Legacy / marketing tier name → canonical tier. */
export const LEGACY_TIER_MAP: Record<string, string> = {
  scheduling: 'starter', express: 'starter', aura_flow: 'starter', halo: 'starter',
  core: 'starter', aura_starter: 'starter', aura_core: 'starter',
  growth: 'connect', business: 'connect', aura_connect: 'connect', aura_growth: 'connect', aura_boost: 'connect',
  single_point: 'performance', field_ops: 'performance', multi_track: 'performance', aura_pro: 'performance',
  starter: 'starter', connect: 'connect', performance: 'performance', command: 'command', aura_elite: 'command',
};

export function meetsTier(current: string, required: string): boolean {
  return (TIER_ORDER[current] ?? 0) >= (TIER_ORDER[required] ?? 0);
}

export interface AgentDefinition {
  /** Canonical agent id used everywhere in the platform. */
  type: string;
  /** Human-readable name shown in the UI. */
  name: string;
  category: string;
  /** Older agent ids that resolve to this agent. */
  aliases: string[];
  /** Lowest plan tier that unlocks this agent. */
  minTier: AgentTier;
  /** Key into the AGENT_TOOLS table (defaults to `type`). */
  toolKey?: string;
  /** Plain-English list of what this agent can do. */
  capabilities: string[];
  isSpecialist: boolean;
  /** Base prompt for specialists (operatives read AGENT_PROMPTS instead). */
  basePrompt?: string;
}

export const AGENT_DEFINITIONS: AgentDefinition[] = [
  // ==================== 10 CORE OPERATIVES ====================
  {
    type: 'triage',
    name: 'AI Receptionist',
    category: 'customer_engagement',
    aliases: ['receptionist', 'emergency', 'intake', 'faq'],
    minTier: 'starter',
    capabilities: [
      'greet customers and classify what they need',
      'check available services',
      'capture leads',
      'share booking and payment links',
      'route to the right specialist',
    ],
    isSpecialist: false,
  },
  {
    type: 'customer_journey',
    name: 'Customer Journey',
    category: 'customer_engagement',
    aliases: ['booking', 'followup', 'review'],
    minTier: 'starter',
    capabilities: [
      'book, reschedule and cancel appointments',
      'check availability',
      'send appointment reminders and follow-ups',
      'request and collect reviews',
    ],
    isSpecialist: false,
  },
  {
    type: 'outreach',
    name: 'Outreach',
    category: 'marketing_sales',
    aliases: ['campaign', 'lead', 'marketing'],
    minTier: 'starter',
    capabilities: [
      'create and run marketing campaigns',
      'qualify and score leads',
      'run win-back and referral offers',
      'send promotional emails and texts',
    ],
    isSpecialist: false,
  },
  {
    type: 'creative_content',
    name: 'Creative Content',
    category: 'creative_web',
    aliases: ['creative', 'social_content', 'social_scheduler', 'social_analytics'],
    minTier: 'starter',
    toolKey: 'social',
    capabilities: [
      'draft on-brand copy and posts',
      'schedule social posts',
      'track post performance',
    ],
    isSpecialist: false,
  },
  {
    type: 'web_presence',
    name: 'Web Presence',
    category: 'creative_web',
    aliases: [],
    minTier: 'starter',
    capabilities: [
      'update website content',
      'write and publish blog posts',
      'improve SEO',
    ],
    isSpecialist: false,
  },
  {
    type: 'dispatch',
    name: 'Dispatch / GPS Console',
    category: 'field_operations',
    aliases: [],
    minTier: 'connect',
    capabilities: [
      'assign jobs to staff by skill, location and availability',
      'see who is available now',
      'reassign and escalate jobs',
    ],
    isSpecialist: false,
  },
  {
    type: 'field_navigation',
    name: 'Field Navigation',
    category: 'field_operations',
    aliases: ['route', 'eta', 'checkin'],
    minTier: 'connect',
    capabilities: [
      'optimize routes',
      'calculate and share ETAs',
      'record check-in and check-out',
    ],
    isSpecialist: false,
  },
  {
    type: 'business_finance',
    name: 'Business Finance',
    category: 'business_operations',
    aliases: ['quoting', 'invoice', 'inventory', 'estimate', 'payments'],
    minTier: 'performance',
    capabilities: [
      'create quotes and estimates',
      'create and send invoices',
      'collect payments',
      'track parts and inventory',
    ],
    isSpecialist: false,
  },
  {
    type: 'admin',
    name: 'Admin',
    category: 'business_operations',
    aliases: [],
    minTier: 'performance',
    capabilities: [
      'manage users and roles',
      'update company configuration',
      'review platform settings',
    ],
    isSpecialist: false,
  },
  {
    type: 'analytics_intelligence',
    name: 'Analytics Intelligence',
    category: 'analytics_reports',
    aliases: ['insights', 'revenue', 'forecast', 'performance', 'analytics'],
    minTier: 'performance',
    capabilities: [
      'report on revenue and job performance',
      'surface trends and anomalies',
      'forecast demand and revenue',
    ],
    isSpecialist: false,
  },

  // ==================== 14 INDUSTRY SPECIALISTS ====================
  // Shipped on every plan; activation is driven by the industry pack's
  // extra_operatives list, not by subscription tier.
  {
    type: 'diagnostic',
    name: 'Diagnostic',
    category: 'specialist',
    aliases: [],
    minTier: 'free',
    capabilities: ['diagnose symptoms', 'suggest likely cause and parts'],
    isSpecialist: true,
    basePrompt: 'You are a Diagnostic specialist. Given symptoms, photos, brand, and model, suggest the most likely cause and recommended fix or parts list. Always recommend a tech visit if uncertain.',
  },
  {
    type: 'permit_code',
    name: 'Permit & Code',
    category: 'specialist',
    aliases: [],
    minTier: 'free',
    capabilities: ['check permit requirements', 'outline permit-pull steps'],
    isSpecialist: true,
    basePrompt: 'You are a Permit & Code specialist. Help determine whether a job requires a permit, what local code applies, and outline the permit-pull steps.',
  },
  {
    type: 'site_survey',
    name: 'Site Survey & Quote',
    category: 'specialist',
    aliases: [],
    minTier: 'free',
    capabilities: ['collect pre-install survey details', 'produce a takeoff-ready scope'],
    isSpecialist: true,
    basePrompt: 'You are a Site Survey & Quote specialist. Walk customers through pre-install survey requirements (measurements, photos, access, utilities) and produce a takeoff-ready scope.',
  },
  {
    type: 'insurance_claim',
    name: 'Insurance Claim',
    category: 'specialist',
    aliases: [],
    minTier: 'free',
    capabilities: ['document damage', 'produce claim-ready summaries'],
    isSpecialist: true,
    basePrompt: 'You are an Insurance Claim specialist. Help document damage with photos, dates, cause-of-loss, and produce claim-ready summaries for the carrier.',
  },
  {
    type: 'listing_writer',
    name: 'Listing Writer',
    category: 'specialist',
    aliases: [],
    minTier: 'free',
    capabilities: ['draft MLS-safe listing copy', 'write headlines and feature bullets'],
    isSpecialist: true,
    basePrompt: 'You are a Listing Writer specialist for a real-estate business. Given property facts (beds, baths, sqft, lot, features, neighborhood), draft compelling, MLS-safe listing descriptions, attention-grabbing headlines, and 3–5 feature bullets. Never invent facts not provided. Match the brand voice when available.',
  },
  {
    type: 'offer_drafter',
    name: 'Offer Drafter',
    category: 'specialist',
    aliases: [],
    minTier: 'free',
    capabilities: ['compose offers and counter-offers', 'summarize key terms'],
    isSpecialist: true,
    basePrompt: 'You are an Offer Drafter specialist for a real-estate business. Compose offer letters, counter-offers, and contingency language. Surface key terms (price, EMD, financing, inspection, close date, contingencies) clearly. Always remind the user to have an attorney/broker review before sending.',
  },
  {
    type: 'comp_analyst',
    name: 'Comp Analyst',
    category: 'specialist',
    aliases: [],
    minTier: 'free',
    capabilities: ['analyze comparable sales', 'recommend a list-price range'],
    isSpecialist: true,
    basePrompt: 'You are a Comparable Sales (Comp) Analyst. Given a subject property and a list of nearby sales/rentals, summarize price-per-sqft, days-on-market, and pricing position (under/at/over market). Recommend a list-price range with rationale. Never fabricate comps that were not provided.',
  },
  {
    type: 'style_consultant',
    name: 'Style Consultant',
    category: 'specialist',
    aliases: [],
    minTier: 'free',
    capabilities: ['recommend services by client profile', 'build a maintenance plan'],
    isSpecialist: true,
    basePrompt: 'You are a Style Consultant for a beauty/wellness business. Based on the client photo, hair/skin notes, and visit history, suggest cuts, colors, or treatments that fit their face shape, lifestyle, and previous services. Always include a maintenance plan and a polite upsell.',
  },
  {
    type: 'loyalty_coach',
    name: 'Loyalty Coach',
    category: 'specialist',
    aliases: [],
    minTier: 'free',
    capabilities: ['spot lapsing clients', 'draft personalized rebook outreach'],
    isSpecialist: true,
    basePrompt: 'You are a Loyalty Coach for a beauty/wellness business. Identify clients at risk of lapsing (no visit in 8+ weeks vs. their normal cadence) and draft warm, personalized rebook outreach with a specific suggested service and time window. Never sound transactional.',
  },
  {
    type: 'menu_writer',
    name: 'Menu Writer',
    category: 'specialist',
    aliases: [],
    minTier: 'free',
    capabilities: ['write menu copy and specials', 'add dietary callouts'],
    isSpecialist: true,
    basePrompt: 'You are a Menu Writer for a restaurant. Draft menu item copy, daily specials, and dietary callouts (GF, V, VG, contains-nuts) in the brand voice. Keep descriptions under 25 words and lead with the most appetizing detail. Never invent ingredients not provided.',
  },
  {
    type: 'reservation_optimizer',
    name: 'Reservation Optimizer',
    category: 'specialist',
    aliases: [],
    minTier: 'free',
    capabilities: ['reshuffle reservations', 'increase covers without moving guests'],
    isSpecialist: true,
    basePrompt: "You are a Reservation Optimizer for a restaurant. Given today's reservation grid, table inventory, and turn-times, suggest specific reshuffles that increase covers, reduce gaps, and avoid double-seating. Always state the impact (e.g. \"+4 covers, no guests moved\").",
  },
  {
    type: 'task_triager',
    name: 'Task Triager',
    category: 'specialist',
    aliases: [],
    minTier: 'free',
    capabilities: ['prioritize inbound tasks', 'recommend the next action'],
    isSpecialist: true,
    basePrompt: 'You are a Task Triager for a personal-assistant/concierge business. Sort inbound client tasks by urgency, owner, and due date. Output a prioritized list with a one-line rationale per task and a recommended next action.',
  },
  {
    type: 'calendar_optimizer',
    name: 'Calendar Optimizer',
    category: 'specialist',
    aliases: [],
    minTier: 'free',
    capabilities: ['consolidate calendar slots', 'quantify travel time saved'],
    isSpecialist: true,
    basePrompt: 'You are a Calendar Optimizer. Given a calendar with appointments, locations, and travel times, suggest specific slot consolidations and travel-aware fixes (e.g. "move the 2pm Westside visit to Thursday next to the other two Westside stops"). Quantify the time saved.',
  },
  {
    type: 'review_responder',
    name: 'Review Responder',
    category: 'specialist',
    aliases: [],
    minTier: 'free',
    capabilities: ['draft on-brand review responses', 'de-escalate negative reviews'],
    isSpecialist: true,
    basePrompt: 'You are a Review Responder. Draft on-brand responses to new customer reviews across Google, Yelp, and Facebook. Always thank the reviewer by name, address specifics they mentioned, and never argue with negative reviews — acknowledge, apologize where appropriate, and offer a direct contact path. Keep responses under 60 words.',
  },
];
