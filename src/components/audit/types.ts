// Tier-based scoring for subscription plan recommendations
// Updated to include Aura Core and Aura Halo tiers with 22 comprehensive questions
export type TierType = 'CORE' | 'HALO' | 'SINGLE_POINT' | 'MULTI_TRACK' | 'COMMAND';

export interface TierScores {
  CORE: number;         // 0-100 contribution
  HALO: number;         // 0-100 contribution (salons/wellness)
  SINGLE_POINT: number; // 0-100 contribution
  MULTI_TRACK: number;  // 0-100 contribution
  COMMAND: number;      // 0-100 contribution
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

// 22 Questions aligned to 5 subscription tiers (8 sections)
export const QUESTIONS: AuditQuestion[] = [
  // ========================================
  // Section 1: Business Basics (3 questions)
  // ========================================
  {
    id: 'employee_count',
    question: 'How many employees work in your business?',
    description: 'Team size determines operational complexity and tier fit',
    section: 'Business Basics',
    options: [
      { label: '1-2 employees (owner-operated)', tierScores: { CORE: 95, HALO: 85, SINGLE_POINT: 50, MULTI_TRACK: 25, COMMAND: 10 } },
      { label: '3-5 employees', tierScores: { CORE: 50, HALO: 70, SINGLE_POINT: 90, MULTI_TRACK: 55, COMMAND: 30 } },
      { label: '6-10 employees', tierScores: { CORE: 20, HALO: 40, SINGLE_POINT: 55, MULTI_TRACK: 90, COMMAND: 60 } },
      { label: '11-25 employees', tierScores: { CORE: 5, HALO: 15, SINGLE_POINT: 25, MULTI_TRACK: 70, COMMAND: 95 } },
    ],
  },
  {
    id: 'multi_location',
    question: 'Do you operate from multiple locations?',
    description: 'Multi-location operations require enterprise-level coordination',
    section: 'Business Basics',
    options: [
      { label: 'Single location', tierScores: { CORE: 85, HALO: 90, SINGLE_POINT: 80, MULTI_TRACK: 70, COMMAND: 50 } },
      { label: '2-3 locations', tierScores: { CORE: 30, HALO: 45, SINGLE_POINT: 55, MULTI_TRACK: 85, COMMAND: 80 } },
      { label: '4+ locations or franchise model', tierScores: { CORE: 10, HALO: 20, SINGLE_POINT: 30, MULTI_TRACK: 60, COMMAND: 95 } },
    ],
  },
  {
    id: 'annual_revenue',
    question: 'What is your approximate annual revenue?',
    description: 'Helps us calibrate recommendations to your budget',
    section: 'Business Basics',
    options: [
      { label: 'Under $100K', tierScores: { CORE: 90, HALO: 85, SINGLE_POINT: 55, MULTI_TRACK: 20, COMMAND: 5 } },
      { label: '$100K - $500K', tierScores: { CORE: 65, HALO: 80, SINGLE_POINT: 85, MULTI_TRACK: 60, COMMAND: 30 } },
      { label: '$500K - $2M', tierScores: { CORE: 30, HALO: 50, SINGLE_POINT: 65, MULTI_TRACK: 90, COMMAND: 70 } },
      { label: 'Over $2M', tierScores: { CORE: 10, HALO: 25, SINGLE_POINT: 40, MULTI_TRACK: 70, COMMAND: 95 } },
    ],
  },

  // ========================================
  // Section 2: Lead Intake & Response (3 questions)
  // ========================================
  {
    id: 'lead_response_time',
    question: 'How quickly do you typically respond to new leads?',
    description: 'Response time significantly impacts conversion rates',
    section: 'Lead Intake & Response',
    options: [
      { label: 'Under 5 minutes - we have great coverage', tierScores: { CORE: 50, HALO: 45, SINGLE_POINT: 40, MULTI_TRACK: 30, COMMAND: 20 } },
      { label: 'Same hour - could be faster', tierScores: { CORE: 70, HALO: 75, SINGLE_POINT: 75, MULTI_TRACK: 55, COMMAND: 45 } },
      { label: 'Same day - we miss some opportunities', tierScores: { CORE: 80, HALO: 85, SINGLE_POINT: 85, MULTI_TRACK: 80, COMMAND: 65 } },
      { label: 'Next day or longer - this is a problem', tierScores: { CORE: 85, HALO: 90, SINGLE_POINT: 95, MULTI_TRACK: 90, COMMAND: 85 } },
    ],
  },
  {
    id: 'after_hours_calls',
    question: 'What happens when a lead calls outside business hours?',
    description: 'After-hours leads are often high-intent buyers',
    section: 'Lead Intake & Response',
    options: [
      { label: 'We have 24/7 live coverage', tierScores: { CORE: 40, HALO: 35, SINGLE_POINT: 30, MULTI_TRACK: 25, COMMAND: 20 } },
      { label: 'Voicemail - we call back next day', tierScores: { CORE: 70, HALO: 75, SINGLE_POINT: 70, MULTI_TRACK: 60, COMMAND: 50 } },
      { label: 'Calls go unanswered, no follow-up', tierScores: { CORE: 80, HALO: 85, SINGLE_POINT: 85, MULTI_TRACK: 85, COMMAND: 75 } },
      { label: 'We lose most after-hours leads', tierScores: { CORE: 85, HALO: 90, SINGLE_POINT: 90, MULTI_TRACK: 90, COMMAND: 95 } },
    ],
  },
  {
    id: 'lead_volume',
    question: 'How many new leads do you receive per week?',
    description: 'Higher lead volume benefits more from automation',
    section: 'Lead Intake & Response',
    options: [
      { label: '1-5 leads per week', tierScores: { CORE: 90, HALO: 85, SINGLE_POINT: 70, MULTI_TRACK: 40, COMMAND: 25 } },
      { label: '6-15 leads per week', tierScores: { CORE: 65, HALO: 80, SINGLE_POINT: 85, MULTI_TRACK: 70, COMMAND: 50 } },
      { label: '16-30 leads per week', tierScores: { CORE: 35, HALO: 55, SINGLE_POINT: 70, MULTI_TRACK: 90, COMMAND: 75 } },
      { label: '30+ leads per week', tierScores: { CORE: 15, HALO: 30, SINGLE_POINT: 50, MULTI_TRACK: 80, COMMAND: 95 } },
    ],
  },

  // ========================================
  // Section 3: Communication Preferences (3 questions)
  // ========================================
  {
    id: 'ai_interaction_mode',
    question: 'How would you prefer customers to interact with your AI assistant?',
    description: 'Core is text-only; Halo+ includes voice capability',
    section: 'Communication Preferences',
    options: [
      { label: 'Text chat only is fine', tierScores: { CORE: 95, HALO: 50, SINGLE_POINT: 55, MULTI_TRACK: 50, COMMAND: 45 } },
      { label: 'Voice/speech capability is important', tierScores: { CORE: 15, HALO: 90, SINGLE_POINT: 90, MULTI_TRACK: 85, COMMAND: 80 } },
      { label: 'Need both text and voice', tierScores: { CORE: 20, HALO: 85, SINGLE_POINT: 85, MULTI_TRACK: 90, COMMAND: 90 } },
      { label: 'We want AI to make outbound calls', tierScores: { CORE: 5, HALO: 80, SINGLE_POINT: 80, MULTI_TRACK: 85, COMMAND: 95 } },
    ],
  },
  {
    id: 'comm_channels',
    question: 'Which communication channels do your customers prefer?',
    description: 'Meeting customers where they are increases engagement',
    section: 'Communication Preferences',
    options: [
      { label: 'Email works fine for most', tierScores: { CORE: 85, HALO: 70, SINGLE_POINT: 75, MULTI_TRACK: 50, COMMAND: 40 } },
      { label: 'SMS/texting is increasingly preferred', tierScores: { CORE: 60, HALO: 85, SINGLE_POINT: 80, MULTI_TRACK: 85, COMMAND: 70 } },
      { label: 'Phone calls are still essential', tierScores: { CORE: 25, HALO: 80, SINGLE_POINT: 85, MULTI_TRACK: 75, COMMAND: 90 } },
      { label: 'We need all channels - it varies', tierScores: { CORE: 40, HALO: 70, SINGLE_POINT: 70, MULTI_TRACK: 85, COMMAND: 95 } },
    ],
  },
  {
    id: 'missed_calls',
    question: 'How many calls does your business miss per week?',
    description: 'Each missed call can cost $300-1000 in lost revenue',
    section: 'Communication Preferences',
    options: [
      { label: 'Rarely miss calls (0-2/week)', tierScores: { CORE: 70, HALO: 60, SINGLE_POINT: 55, MULTI_TRACK: 45, COMMAND: 35 } },
      { label: '3-5 missed calls per week', tierScores: { CORE: 55, HALO: 80, SINGLE_POINT: 80, MULTI_TRACK: 70, COMMAND: 60 } },
      { label: '6-10 missed calls per week', tierScores: { CORE: 40, HALO: 85, SINGLE_POINT: 85, MULTI_TRACK: 90, COMMAND: 80 } },
      { label: '10+ missed calls per week', tierScores: { CORE: 25, HALO: 75, SINGLE_POINT: 75, MULTI_TRACK: 85, COMMAND: 95 } },
    ],
  },

  // ========================================
  // Section 4: Scheduling & Field Operations (3 questions)
  // ========================================
  {
    id: 'booking_process',
    question: 'How do customers book appointments with you?',
    description: 'Booking friction directly impacts revenue',
    section: 'Scheduling & Field Operations',
    options: [
      { label: 'Self-service online booking', tierScores: { CORE: 50, HALO: 40, SINGLE_POINT: 45, MULTI_TRACK: 40, COMMAND: 35 } },
      { label: 'Call/email, we schedule manually', tierScores: { CORE: 60, HALO: 85, SINGLE_POINT: 75, MULTI_TRACK: 65, COMMAND: 55 } },
      { label: 'Lots of back-and-forth to confirm', tierScores: { CORE: 50, HALO: 90, SINGLE_POINT: 80, MULTI_TRACK: 90, COMMAND: 75 } },
      { label: 'Phone tag is a major issue for us', tierScores: { CORE: 40, HALO: 95, SINGLE_POINT: 85, MULTI_TRACK: 95, COMMAND: 90 } },
    ],
  },
  {
    id: 'dispatch_routing',
    question: 'How do you currently dispatch and route technicians?',
    description: 'Efficient routing saves fuel and maximizes billable hours',
    section: 'Scheduling & Field Operations',
    options: [
      { label: 'Optimized software with real-time adjustments', tierScores: { CORE: 40, HALO: 35, SINGLE_POINT: 35, MULTI_TRACK: 45, COMMAND: 40 } },
      { label: 'Basic scheduling tools, some optimization', tierScores: { CORE: 50, HALO: 50, SINGLE_POINT: 55, MULTI_TRACK: 75, COMMAND: 60 } },
      { label: 'Manual assignment based on availability', tierScores: { CORE: 45, HALO: 55, SINGLE_POINT: 60, MULTI_TRACK: 90, COMMAND: 80 } },
      { label: 'First-available, no route optimization', tierScores: { CORE: 35, HALO: 50, SINGLE_POINT: 55, MULTI_TRACK: 95, COMMAND: 90 } },
    ],
  },
  {
    id: 'customer_eta',
    question: 'How do customers know when a technician will arrive?',
    description: 'ETA transparency improves customer satisfaction by 40%',
    section: 'Scheduling & Field Operations',
    options: [
      { label: 'Real-time GPS tracking they can view', tierScores: { CORE: 35, HALO: 30, SINGLE_POINT: 35, MULTI_TRACK: 40, COMMAND: 35 } },
      { label: 'Automated ETA texts when en route', tierScores: { CORE: 45, HALO: 55, SINGLE_POINT: 50, MULTI_TRACK: 60, COMMAND: 50 } },
      { label: 'We call when leaving for the job', tierScores: { CORE: 40, HALO: 50, SINGLE_POINT: 55, MULTI_TRACK: 85, COMMAND: 70 } },
      { label: 'They wait - no ETA communication', tierScores: { CORE: 35, HALO: 55, SINGLE_POINT: 60, MULTI_TRACK: 95, COMMAND: 85 } },
    ],
  },

  // ========================================
  // Section 5: Customer Retention & Reviews (2 questions)
  // ========================================
  {
    id: 'review_collection',
    question: 'How do you collect reviews after service?',
    description: 'Reviews drive 15-20% of new customer acquisition',
    section: 'Customer Retention & Reviews',
    options: [
      { label: 'Automated multi-platform requests', tierScores: { CORE: 45, HALO: 40, SINGLE_POINT: 40, MULTI_TRACK: 45, COMMAND: 40 } },
      { label: 'Occasional email request to some customers', tierScores: { CORE: 60, HALO: 65, SINGLE_POINT: 65, MULTI_TRACK: 70, COMMAND: 60 } },
      { label: 'Sometimes ask verbally after service', tierScores: { CORE: 55, HALO: 70, SINGLE_POINT: 70, MULTI_TRACK: 80, COMMAND: 85 } },
      { label: "We don't actively collect reviews", tierScores: { CORE: 50, HALO: 75, SINGLE_POINT: 75, MULTI_TRACK: 85, COMMAND: 95 } },
    ],
  },
  {
    id: 'customer_reactivation',
    question: 'How do you re-engage past customers?',
    description: 'Reactivating existing customers costs 5x less than acquiring new',
    section: 'Customer Retention & Reviews',
    options: [
      { label: 'Active campaigns with personalization', tierScores: { CORE: 40, HALO: 40, SINGLE_POINT: 40, MULTI_TRACK: 45, COMMAND: 40 } },
      { label: 'Occasional promotions to our list', tierScores: { CORE: 55, HALO: 55, SINGLE_POINT: 55, MULTI_TRACK: 65, COMMAND: 60 } },
      { label: "We should but don't have time", tierScores: { CORE: 50, HALO: 60, SINGLE_POINT: 60, MULTI_TRACK: 80, COMMAND: 90 } },
      { label: 'No reactivation strategy', tierScores: { CORE: 45, HALO: 65, SINGLE_POINT: 65, MULTI_TRACK: 85, COMMAND: 95 } },
    ],
  },

  // ========================================
  // Section 6: Social Media & Web Presence (3 questions)
  // ========================================
  {
    id: 'social_media_activity',
    question: 'How active is your business on social media?',
    description: 'Core includes Social Media Signal AI for content creation',
    section: 'Social Media & Web Presence',
    options: [
      { label: 'Very active (daily posts)', tierScores: { CORE: 70, HALO: 50, SINGLE_POINT: 45, MULTI_TRACK: 60, COMMAND: 80 } },
      { label: 'Somewhat active (weekly)', tierScores: { CORE: 80, HALO: 60, SINGLE_POINT: 55, MULTI_TRACK: 65, COMMAND: 75 } },
      { label: 'Rarely post (monthly or less)', tierScores: { CORE: 85, HALO: 70, SINGLE_POINT: 65, MULTI_TRACK: 60, COMMAND: 65 } },
      { label: 'Not on social media currently', tierScores: { CORE: 70, HALO: 75, SINGLE_POINT: 75, MULTI_TRACK: 55, COMMAND: 55 } },
    ],
  },
  {
    id: 'content_creation',
    question: 'Who currently creates your social media content?',
    description: 'AI can automate content creation and scheduling',
    section: 'Social Media & Web Presence',
    options: [
      { label: 'I/we create it manually', tierScores: { CORE: 85, HALO: 65, SINGLE_POINT: 60, MULTI_TRACK: 70, COMMAND: 80 } },
      { label: 'We use a marketing agency', tierScores: { CORE: 50, HALO: 60, SINGLE_POINT: 65, MULTI_TRACK: 70, COMMAND: 85 } },
      { label: "We don't create content", tierScores: { CORE: 80, HALO: 75, SINGLE_POINT: 70, MULTI_TRACK: 60, COMMAND: 70 } },
      { label: 'Would love AI to handle this', tierScores: { CORE: 95, HALO: 60, SINGLE_POINT: 55, MULTI_TRACK: 75, COMMAND: 90 } },
    ],
  },
  {
    id: 'website_status',
    question: "What's your current website situation?",
    description: 'Core includes a 1-page Web Presence site',
    section: 'Social Media & Web Presence',
    options: [
      { label: 'Professional website, works great', tierScores: { CORE: 40, HALO: 55, SINGLE_POINT: 60, MULTI_TRACK: 65, COMMAND: 60 } },
      { label: 'Basic website, needs improvement', tierScores: { CORE: 85, HALO: 75, SINGLE_POINT: 70, MULTI_TRACK: 65, COMMAND: 60 } },
      { label: 'No website currently', tierScores: { CORE: 95, HALO: 80, SINGLE_POINT: 75, MULTI_TRACK: 60, COMMAND: 55 } },
      { label: 'Website with booking capability', tierScores: { CORE: 35, HALO: 50, SINGLE_POINT: 55, MULTI_TRACK: 80, COMMAND: 75 } },
    ],
  },

  // ========================================
  // Section 7: Business Operations (3 questions)
  // ========================================
  {
    id: 'quoting_process',
    question: 'How do you create quotes/estimates for customers?',
    description: 'Multi-Track includes AI Quoting Agent',
    section: 'Business Operations',
    options: [
      { label: 'Professional quoting software', tierScores: { CORE: 45, HALO: 45, SINGLE_POINT: 50, MULTI_TRACK: 50, COMMAND: 55 } },
      { label: 'Manual calculation, paper/basic docs', tierScores: { CORE: 40, HALO: 50, SINGLE_POINT: 55, MULTI_TRACK: 90, COMMAND: 80 } },
      { label: 'Verbal estimates only', tierScores: { CORE: 50, HALO: 55, SINGLE_POINT: 60, MULTI_TRACK: 85, COMMAND: 75 } },
      { label: 'Field techs need to quote on-site', tierScores: { CORE: 25, HALO: 40, SINGLE_POINT: 45, MULTI_TRACK: 95, COMMAND: 90 } },
    ],
  },
  {
    id: 'inventory_tracking',
    question: 'Do you track inventory or parts/materials?',
    description: 'Command includes Inventory Management Agent',
    section: 'Business Operations',
    options: [
      { label: 'Yes, with inventory software', tierScores: { CORE: 45, HALO: 45, SINGLE_POINT: 50, MULTI_TRACK: 55, COMMAND: 60 } },
      { label: 'Spreadsheets or manual tracking', tierScores: { CORE: 35, HALO: 40, SINGLE_POINT: 45, MULTI_TRACK: 70, COMMAND: 90 } },
      { label: "Don't track inventory", tierScores: { CORE: 75, HALO: 80, SINGLE_POINT: 75, MULTI_TRACK: 50, COMMAND: 40 } },
      { label: 'Need better inventory management', tierScores: { CORE: 25, HALO: 35, SINGLE_POINT: 40, MULTI_TRACK: 75, COMMAND: 95 } },
    ],
  },
  {
    id: 'warranty_claims',
    question: 'Do you offer warranties or service guarantees?',
    description: 'Command includes Warranty Claims Agent',
    section: 'Business Operations',
    options: [
      { label: 'Yes, with a tracking system', tierScores: { CORE: 45, HALO: 45, SINGLE_POINT: 50, MULTI_TRACK: 60, COMMAND: 65 } },
      { label: 'Yes, but track manually', tierScores: { CORE: 40, HALO: 45, SINGLE_POINT: 50, MULTI_TRACK: 70, COMMAND: 90 } },
      { label: 'Limited warranties offered', tierScores: { CORE: 55, HALO: 60, SINGLE_POINT: 60, MULTI_TRACK: 65, COMMAND: 75 } },
      { label: 'No warranties offered', tierScores: { CORE: 70, HALO: 75, SINGLE_POINT: 70, MULTI_TRACK: 55, COMMAND: 45 } },
    ],
  },

  // ========================================
  // Section 8: Analytics & Growth (2 questions)
  // ========================================
  {
    id: 'performance_tracking',
    question: 'How do you track business performance metrics?',
    description: 'Data-driven decisions increase profitability by 20%',
    section: 'Analytics & Growth',
    options: [
      { label: 'Real-time dashboards with KPIs', tierScores: { CORE: 45, HALO: 45, SINGLE_POINT: 45, MULTI_TRACK: 50, COMMAND: 45 } },
      { label: 'Weekly/monthly reports from software', tierScores: { CORE: 55, HALO: 55, SINGLE_POINT: 60, MULTI_TRACK: 70, COMMAND: 65 } },
      { label: 'Spreadsheets and manual tracking', tierScores: { CORE: 50, HALO: 60, SINGLE_POINT: 65, MULTI_TRACK: 80, COMMAND: 85 } },
      { label: 'Mostly gut feel and bank balance', tierScores: { CORE: 45, HALO: 65, SINGLE_POINT: 70, MULTI_TRACK: 85, COMMAND: 95 } },
    ],
  },
  {
    id: 'marketing_automation',
    question: 'How do you run marketing campaigns and promotions?',
    description: 'Command includes Campaign & Marketing Agents',
    section: 'Analytics & Growth',
    options: [
      { label: 'Sophisticated marketing automation', tierScores: { CORE: 45, HALO: 45, SINGLE_POINT: 50, MULTI_TRACK: 55, COMMAND: 50 } },
      { label: 'Basic email campaigns occasionally', tierScores: { CORE: 55, HALO: 60, SINGLE_POINT: 65, MULTI_TRACK: 70, COMMAND: 80 } },
      { label: 'Mostly word of mouth', tierScores: { CORE: 60, HALO: 70, SINGLE_POINT: 70, MULTI_TRACK: 65, COMMAND: 75 } },
      { label: 'Want AI-powered marketing automation', tierScores: { CORE: 35, HALO: 45, SINGLE_POINT: 50, MULTI_TRACK: 75, COMMAND: 95 } },
    ],
  },
];

// Tier recommendations with full details matching v21 pricing
export const TIER_RECOMMENDATIONS: Record<TierType, TierRecommendation> = {
  CORE: {
    tier: 'CORE',
    label: 'Aura Core',
    price: '$500/mo',
    description: 'AI-assisted tools for digital presence — you stay in control, no automation',
    keyFeatures: [
      'Talk to Aura (Chat Tool)',
      'Social Media Signal (Content Tool)',
      'Web Presence (1-Page Site)',
      'Basic Lead Capture',
      'Email Notifications',
      '⚠️ Manual Operations (No AI Agents)',
    ],
    agentCount: 0,
    consoleCount: 0,
    employeeLimit: '2 employees',
    implementationFee: '$499',
  },
  HALO: {
    tier: 'HALO',
    label: 'Aura Halo',
    price: '$397/mo',
    description: 'AI receptionist with scheduling for salons, spas, and wellness businesses',
    keyFeatures: [
      'AI Receptionist (Triage Agent)',
      'Scheduling Agent (Online Booking)',
      'Follow-up Agent (SMS/Email Reminders)',
      'Proxy Voice Chat (ElevenLabs)',
      'Talk to Aura (Text + Voice)',
      'Customer Portal Console',
    ],
    agentCount: 3,
    consoleCount: 1,
    employeeLimit: '5 employees',
    implementationFee: '$397',
  },
  SINGLE_POINT: {
    tier: 'SINGLE_POINT',
    label: 'Single-Point',
    price: '$1,500/mo',
    description: 'AI Receptionist with voice capability for teams focused on lead capture',
    keyFeatures: [
      'AI Receptionist (Triage Agent)',
      'Follow-up Agent',
      'Review Request Agent',
      'Proxy Voice Chat (ElevenLabs/Twilio)',
      'Customer Portal Console',
      'Email + SMS + Voice Reminders',
      'Choice of Social Media Signal OR Web Presence',
    ],
    agentCount: 3,
    consoleCount: 1,
    employeeLimit: '5 employees',
    implementationFee: '$499',
  },
  MULTI_TRACK: {
    tier: 'MULTI_TRACK',
    label: 'Multi-Track',
    price: '$3,997/mo',
    description: 'Full field operations automation for growing service businesses',
    keyFeatures: [
      'All Single-Point features',
      '+6 Field Ops Agents (Dispatch, Route, ETA, Check-in, Quote, Invoice)',
      'Online Booking Agent',
      'Field Ops Console',
      'Social Media Signal + Web Presence included',
      'API Access',
    ],
    agentCount: 10,
    consoleCount: 2,
    employeeLimit: '10 employees',
    implementationFee: '$499+',
  },
  COMMAND: {
    tier: 'COMMAND',
    label: 'Aura Pro Command',
    price: '$6,997/mo',
    description: 'Complete AI workforce with all 23 operatives and 7 control centers',
    keyFeatures: [
      'All Multi-Track features',
      '+13 Agents (Admin, Inventory, Warranty, Campaign, Lead, Promo, Social Content, Social Scheduler, Social Analytics, Insights, Performance, Revenue, Forecast)',
      'All 7 Control Centers',
      'White-Label Branding',
      'Priority Support',
      'API Access',
    ],
    agentCount: 23,
    consoleCount: 7,
    employeeLimit: '25 employees',
    implementationFee: '$499+',
  },
};

// Section labels for progress display (8 sections)
export const SECTION_ORDER = [
  'Business Basics',
  'Lead Intake & Response',
  'Communication Preferences',
  'Scheduling & Field Operations',
  'Customer Retention & Reviews',
  'Social Media & Web Presence',
  'Business Operations',
  'Analytics & Growth',
];
