// Tier-based scoring for subscription plan recommendations
// 4-tier model: Core, Boost, Pro, Elite
export type TierType = 'CORE' | 'BOOST' | 'PRO' | 'ELITE';

export interface TierScores {
  CORE: number;
  BOOST: number;
  PRO: number;
  ELITE: number;
}

export interface AuditOption {
  label: string;
  tierScores: TierScores;
}

export interface AuditQuestion {
  id: string;
  question: string;
  description?: string;
  section: string;
  options: AuditOption[];
}

export interface TierRecommendation {
  tier: TierType;
  label: string;
  price: string;
  description: string;
  keyFeatures: string[];
  agentCount: number;
  consoleCount: number;
  employeeLimit: string;
  implementationFee: string;
}

// Universal questions — apply to every industry. Industry-specific questions
// are appended at runtime via getQuestionsForIndustry().
export const UNIVERSAL_QUESTIONS: AuditQuestion[] = [
  // Section 1: Business Basics
  {
    id: 'employee_count',
    question: 'How many people work in your business (including you)?',
    description: 'Team size shapes which dashboard view and tier fits best',
    section: 'Business Basics',
    options: [
      { label: '1-2 people (owner-operated)', tierScores: { CORE: 95, BOOST: 50, PRO: 25, ELITE: 10 } },
      { label: '3-5 people', tierScores: { CORE: 70, BOOST: 90, PRO: 60, ELITE: 30 } },
      { label: '6-10 people', tierScores: { CORE: 40, BOOST: 80, PRO: 90, ELITE: 60 } },
      { label: '11+ people', tierScores: { CORE: 15, BOOST: 50, PRO: 80, ELITE: 95 } },
    ],
  },

  // Section 3: Lead Intake & Response (2)
  {
    id: 'after_hours_calls',
    question: 'What happens when a lead calls outside business hours?',
    description: 'Front Desk handles after-hours 24/7 across all tiers',
    section: 'Lead Intake & Response',
    options: [
      { label: 'We have 24/7 live coverage already', tierScores: { CORE: 40, BOOST: 30, PRO: 22, ELITE: 20 } },
      { label: 'Voicemail — we call back next day', tierScores: { CORE: 75, BOOST: 70, PRO: 55, ELITE: 50 } },
      { label: 'Calls go unanswered, no follow-up', tierScores: { CORE: 85, BOOST: 85, PRO: 80, ELITE: 75 } },
      { label: 'We lose most after-hours leads', tierScores: { CORE: 90, BOOST: 90, PRO: 92, ELITE: 95 } },
    ],
  },
  {
    id: 'lead_volume',
    question: 'About how many new leads do you get per week?',
    description: 'Higher volume gets more value from Marketing + Reports',
    section: 'Lead Intake & Response',
    options: [
      { label: '1-5 leads per week', tierScores: { CORE: 90, BOOST: 70, PRO: 40, ELITE: 25 } },
      { label: '6-15 leads per week', tierScores: { CORE: 80, BOOST: 85, PRO: 65, ELITE: 50 } },
      { label: '16-30 leads per week', tierScores: { CORE: 55, BOOST: 85, PRO: 90, ELITE: 75 } },
      { label: '30+ leads per week', tierScores: { CORE: 30, BOOST: 65, PRO: 85, ELITE: 95 } },
    ],
  },

  // Section 4: Communication Preferences (2)
  {
    id: 'ai_interaction_mode',
    question: 'How do you want customers to reach your AI Front Desk?',
    description: 'Voice, text, and email are included on every tier',
    section: 'Communication Preferences',
    options: [
      { label: 'Text chat (web + SMS) only is fine', tierScores: { CORE: 80, BOOST: 55, PRO: 48, ELITE: 45 } },
      { label: 'Voice answering is important', tierScores: { CORE: 90, BOOST: 90, PRO: 85, ELITE: 80 } },
      { label: 'Need both text and voice', tierScores: { CORE: 90, BOOST: 90, PRO: 90, ELITE: 90 } },
      { label: 'We also want AI to make outbound calls', tierScores: { CORE: 70, BOOST: 85, PRO: 90, ELITE: 95 } },
    ],
  },
  {
    id: 'missed_calls',
    question: 'How many calls does your business miss per week?',
    description: 'Each missed call can cost $300-1,000 in lost revenue',
    section: 'Communication Preferences',
    options: [
      { label: 'Rarely (0-2 / week)', tierScores: { CORE: 70, BOOST: 55, PRO: 42, ELITE: 35 } },
      { label: '3-5 missed calls / week', tierScores: { CORE: 80, BOOST: 80, PRO: 68, ELITE: 60 } },
      { label: '6-10 missed calls / week', tierScores: { CORE: 85, BOOST: 90, PRO: 85, ELITE: 80 } },
      { label: '10+ missed calls / week', tierScores: { CORE: 75, BOOST: 82, PRO: 90, ELITE: 95 } },
    ],
  },

  // Section 5: Scheduling & Operations
  {
    id: 'booking_process',
    question: 'How do customers book appointments today?',
    description: 'Front Desk + Booking can take this off your plate',
    section: 'Scheduling & Operations',
    options: [
      { label: 'Self-service online booking', tierScores: { CORE: 50, BOOST: 45, PRO: 38, ELITE: 35 } },
      { label: 'Call / email — we schedule manually', tierScores: { CORE: 85, BOOST: 75, PRO: 62, ELITE: 55 } },
      { label: 'Lots of back-and-forth to confirm', tierScores: { CORE: 90, BOOST: 90, PRO: 82, ELITE: 75 } },
      { label: 'Phone tag is a major issue', tierScores: { CORE: 95, BOOST: 95, PRO: 92, ELITE: 90 } },
    ],
  },

  // Section 6: Customer Retention & Reviews (2)
  {
    id: 'review_collection',
    question: 'How do you collect reviews after service?',
    description: 'Front Desk auto-asks for reviews on every tier',
    section: 'Customer Retention & Reviews',
    options: [
      { label: 'Automated multi-platform requests', tierScores: { CORE: 45, BOOST: 45, PRO: 42, ELITE: 40 } },
      { label: 'Occasional email requests', tierScores: { CORE: 65, BOOST: 70, PRO: 62, ELITE: 60 } },
      { label: 'Sometimes ask verbally after service', tierScores: { CORE: 70, BOOST: 80, PRO: 82, ELITE: 85 } },
      { label: "We don't actively collect reviews", tierScores: { CORE: 75, BOOST: 85, PRO: 90, ELITE: 95 } },
    ],
  },
  {
    id: 'appointment_reminders',
    question: 'Do you send appointment reminders to customers?',
    description: 'Cuts no-shows by up to 40% — included on every tier',
    section: 'Customer Retention & Reviews',
    options: [
      { label: 'Yes — automated SMS + email already', tierScores: { CORE: 50, BOOST: 50, PRO: 45, ELITE: 45 } },
      { label: 'Sometimes — manual calls or texts', tierScores: { CORE: 85, BOOST: 75, PRO: 68, ELITE: 65 } },
      { label: 'Rarely — we forget or lack time', tierScores: { CORE: 90, BOOST: 85, PRO: 82, ELITE: 80 } },
      { label: 'No reminders — high no-show rate', tierScores: { CORE: 95, BOOST: 90, PRO: 90, ELITE: 90 } },
    ],
  },

  // Section 7: Marketing & Web Presence (2)
  {
    id: 'social_media_activity',
    question: 'How active is your business on social media?',
    description: 'Marketing (Pro+) auto-creates and posts content',
    section: 'Marketing & Web Presence',
    options: [
      { label: 'Very active (daily posts)', tierScores: { CORE: 70, BOOST: 60, PRO: 70, ELITE: 80 } },
      { label: 'Somewhat active (weekly)', tierScores: { CORE: 80, BOOST: 65, PRO: 75, ELITE: 78 } },
      { label: 'Rarely post (monthly or less)', tierScores: { CORE: 85, BOOST: 70, PRO: 85, ELITE: 80 } },
      { label: 'Not on social media currently', tierScores: { CORE: 75, BOOST: 70, PRO: 80, ELITE: 75 } },
    ],
  },
  {
    id: 'website_status',
    question: "What's your current website situation?",
    description: 'Smart Website + Blog Manager are included from Core',
    section: 'Marketing & Web Presence',
    options: [
      { label: 'Professional website, works great', tierScores: { CORE: 55, BOOST: 65, PRO: 62, ELITE: 60 } },
      { label: 'Basic website, needs improvement', tierScores: { CORE: 85, BOOST: 70, PRO: 62, ELITE: 60 } },
      { label: 'No website currently', tierScores: { CORE: 95, BOOST: 75, PRO: 62, ELITE: 55 } },
      { label: 'Website with booking capability', tierScores: { CORE: 50, BOOST: 80, PRO: 78, ELITE: 75 } },
    ],
  },

  {
    id: 'marketing_automation',
    question: 'How do you currently run marketing campaigns?',
    description: 'Marketing (Pro+) includes Campaign + Outreach automation',
    section: 'Business Operations',
    options: [
      { label: 'Sophisticated marketing automation', tierScores: { CORE: 45, BOOST: 55, PRO: 52, ELITE: 50 } },
      { label: 'Basic email campaigns occasionally', tierScores: { CORE: 60, BOOST: 70, PRO: 75, ELITE: 80 } },
      { label: 'Mostly word of mouth', tierScores: { CORE: 70, BOOST: 70, PRO: 72, ELITE: 75 } },
      { label: 'Want AI-powered marketing automation', tierScores: { CORE: 45, BOOST: 65, PRO: 85, ELITE: 95 } },
    ],
  },

  // Section 9: Setup & Integrations
  {
    id: 'existing_integrations',
    question: 'Which of these do you already have set up?',
    description: 'We will mark these as "already done" in your setup checklist',
    section: 'Setup & Integrations',
    options: [
      { label: 'None of these yet', tierScores: { CORE: 85, BOOST: 80, PRO: 75, ELITE: 70 } },
      { label: 'Google Calendar (or similar) only', tierScores: { CORE: 80, BOOST: 78, PRO: 72, ELITE: 68 } },
      { label: 'Google Calendar + social media accounts', tierScores: { CORE: 70, BOOST: 75, PRO: 82, ELITE: 78 } },
      { label: 'Calendar + social + Stripe / payments', tierScores: { CORE: 60, BOOST: 70, PRO: 80, ELITE: 90 } },
    ],
  },
  {
    id: 'launch_timeline',
    question: 'How quickly do you want to launch?',
    description: 'We have a 30-day guided launch path either way',
    section: 'Setup & Integrations',
    options: [
      { label: 'This week — concierge kickoff please', tierScores: { CORE: 75, BOOST: 80, PRO: 85, ELITE: 92 } },
      { label: 'Within 30 days — guided launch', tierScores: { CORE: 85, BOOST: 85, PRO: 82, ELITE: 80 } },
      { label: 'Exploring — no rush', tierScores: { CORE: 80, BOOST: 75, PRO: 70, ELITE: 65 } },
      { label: 'Just researching for now', tierScores: { CORE: 78, BOOST: 70, PRO: 65, ELITE: 60 } },
    ],
  },
];

// Back-compat alias for any callers that still import QUESTIONS.
export const QUESTIONS = UNIVERSAL_QUESTIONS;

// Tier recommendations matching canonical 4-tier model — refreshed plain-English copy
export const TIER_RECOMMENDATIONS: Record<TierType, TierRecommendation> = {
  CORE: {
    tier: 'CORE',
    label: 'Aura Core',
    price: '$497/mo (Beta Pricing — was $697)',
    description: '8 Smart AI Agents that staff your Front Desk 24/7 — perfect for solo operators, restaurants, salons & personal services.',
    keyFeatures: [
      'Front Desk: 24/7 voice, text & email triage',
      'Front Desk: booking, reminders, follow-ups & review requests',
      'Marketing: content + Smart Website + blog',
      '3 Control Centers (Customer Portal, Marketing, Reports)',
      'Simple dashboard view (Pro view also available)',
      'Up to 10 employees',
    ],
    agentCount: 8,
    consoleCount: 3,
    employeeLimit: 'Up to 10 employees',
    implementationFee: '$249 one-time (50% OFF — was $497)',
  },
  BOOST: {
    tier: 'BOOST',
    label: 'Aura Boost',
    price: '$994/mo (Beta Pricing — was $1,394)',
    description: '12 Smart AI Agents that add On The Way (dispatch, routing & ETAs) for small service teams in the field.',
    keyFeatures: [
      'Everything in Core, plus:',
      'On The Way: smart dispatch, routing & live ETA texts',
      'Field Ops Console + Social Media Console',
      'Full voice, SMS & email channels',
      'Up to 25 employees',
    ],
    agentCount: 12,
    consoleCount: 5,
    employeeLimit: 'Up to 25 employees',
    implementationFee: '$497 one-time (50% OFF — was $994)',
  },
  PRO: {
    tier: 'PRO',
    label: 'Aura Pro',
    price: '$1,988/mo (Beta Pricing — was $2,788)',
    description: '16 Smart AI Agents adding full Marketing automation, Outreach & deeper Reports for scaling field teams.',
    keyFeatures: [
      'Everything in Boost, plus:',
      'Marketing: campaigns, outreach & social queue',
      'Reports: agent performance + revenue insights',
      'Industry Specialist Agents',
      'Up to 50 employees',
    ],
    agentCount: 16,
    consoleCount: 5,
    employeeLimit: 'Up to 50 employees',
    implementationFee: '$994 one-time (50% OFF — was $1,988)',
  },
  ELITE: {
    tier: 'ELITE',
    label: 'Aura Elite',
    price: '$3,979/mo (Beta Pricing — was $5,576)',
    description: 'All 10 AI Operatives (24 agents) — adds Billing (quotes, invoices, inventory) and full Reports for large teams & enterprise operations.',
    keyFeatures: [
      'Everything in Pro, plus:',
      'Billing: AI quoting, invoicing & inventory',
      'Reports: revenue forecast + KPI dashboards',
      'All 7 Control Centers + AI Operatives Hub',
      'Unlimited employees + dedicated onboarding',
    ],
    agentCount: 24,
    consoleCount: 7,
    employeeLimit: 'Unlimited employees',
    implementationFee: '$1,990 one-time (50% OFF — was $3,979)',
  },
};

// Section labels for progress display. Now derived dynamically from the
// composed question list so industry-specific sections (e.g. "Industry Specifics")
// appear in the right place.
export const SECTION_ORDER = [
  'Business Basics',
  'Industry Specifics',
  'Lead Intake & Response',
  'Communication Preferences',
  'Scheduling & Operations',
  'Customer Retention & Reviews',
  'Marketing & Web Presence',
  'Business Operations',
  'Setup & Integrations',
];

export function buildSectionOrder(questions: AuditQuestion[]): string[] {
  const seen = new Set<string>();
  const order: string[] = [];
  for (const q of questions) {
    if (!seen.has(q.section)) {
      seen.add(q.section);
      order.push(q.section);
    }
  }
  return order;
}
