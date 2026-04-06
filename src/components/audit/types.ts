// Tier-based scoring for subscription plan recommendations
// Updated to 3-tier model: Connect, Performance, Command
export type TierType = 'CONNECT' | 'PERFORMANCE' | 'COMMAND';

export interface TierScores {
  CONNECT: number;      // 0-100 contribution (solo operators, salons, consultants)
  PERFORMANCE: number;  // 0-100 contribution (HVAC, plumbing, field service)
  COMMAND: number;      // 0-100 contribution (multi-location, enterprise)
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

// 30 Questions aligned to 3 subscription tiers (9 sections)
// Scoring collapsed from legacy 7-tier: max(EXPRESS,FLOW,CORE,HALO)→CONNECT, max(SINGLE_POINT,MULTI_TRACK)→PERFORMANCE, COMMAND stays
export const QUESTIONS: AuditQuestion[] = [
  // ========================================
  // Section 1: Business Basics (4 questions)
  // ========================================
  {
    id: 'employee_count',
    question: 'How many employees work in your business?',
    description: 'Team size determines operational complexity and tier fit',
    section: 'Business Basics',
    options: [
      { label: '1-2 employees (owner-operated)', tierScores: { CONNECT: 95, PERFORMANCE: 50, COMMAND: 10 } },
      { label: '3-5 employees', tierScores: { CONNECT: 70, PERFORMANCE: 90, COMMAND: 30 } },
      { label: '6-10 employees', tierScores: { CONNECT: 40, PERFORMANCE: 90, COMMAND: 60 } },
      { label: '11-25 employees', tierScores: { CONNECT: 15, PERFORMANCE: 70, COMMAND: 95 } },
    ],
  },
  {
    id: 'multi_location',
    question: 'Do you operate from multiple locations?',
    description: 'Multi-location operations require enterprise-level coordination',
    section: 'Business Basics',
    options: [
      { label: 'Single location', tierScores: { CONNECT: 90, PERFORMANCE: 80, COMMAND: 50 } },
      { label: '2-3 locations', tierScores: { CONNECT: 45, PERFORMANCE: 85, COMMAND: 80 } },
      { label: '4+ locations or franchise model', tierScores: { CONNECT: 20, PERFORMANCE: 60, COMMAND: 95 } },
    ],
  },
  {
    id: 'annual_revenue',
    question: 'What is your approximate annual revenue?',
    description: 'Helps us calibrate recommendations to your budget',
    section: 'Business Basics',
    options: [
      { label: 'Under $100K', tierScores: { CONNECT: 95, PERFORMANCE: 55, COMMAND: 5 } },
      { label: '$100K - $500K', tierScores: { CONNECT: 80, PERFORMANCE: 85, COMMAND: 30 } },
      { label: '$500K - $2M', tierScores: { CONNECT: 50, PERFORMANCE: 90, COMMAND: 70 } },
      { label: 'Over $2M', tierScores: { CONNECT: 25, PERFORMANCE: 70, COMMAND: 95 } },
    ],
  },
  {
    id: 'industry_type',
    question: 'What type of business do you operate?',
    description: 'Different industries have different automation needs',
    section: 'Business Basics',
    options: [
      { label: 'Restaurant, cafe, or food service', tierScores: { CONNECT: 95, PERFORMANCE: 45, COMMAND: 20 } },
      { label: 'Salon, spa, or wellness', tierScores: { CONNECT: 95, PERFORMANCE: 60, COMMAND: 25 } },
      { label: 'Personal services (consultant, coach, etc.)', tierScores: { CONNECT: 95, PERFORMANCE: 55, COMMAND: 20 } },
      { label: 'Home/field services (HVAC, plumbing, etc.)', tierScores: { CONNECT: 40, PERFORMANCE: 95, COMMAND: 85 } },
    ],
  },

  // ========================================
  // Section 2: Industry & Services (2 questions)
  // ========================================
  {
    id: 'appointment_model',
    question: 'Do customers typically need to schedule appointments?',
    description: 'Scheduling needs determine automation requirements',
    section: 'Industry & Services',
    options: [
      { label: 'Mostly walk-ins, no appointments needed', tierScores: { CONNECT: 95, PERFORMANCE: 55, COMMAND: 40 } },
      { label: 'Mix of walk-ins and scheduled appointments', tierScores: { CONNECT: 80, PERFORMANCE: 75, COMMAND: 55 } },
      { label: 'All appointments are scheduled in advance', tierScores: { CONNECT: 95, PERFORMANCE: 85, COMMAND: 75 } },
      { label: 'Complex scheduling with multiple team members', tierScores: { CONNECT: 60, PERFORMANCE: 95, COMMAND: 90 } },
    ],
  },
  {
    id: 'service_location',
    question: 'Where do you primarily deliver your services?',
    description: 'Service location affects routing and dispatch needs',
    section: 'Industry & Services',
    options: [
      { label: 'At my business location only', tierScores: { CONNECT: 95, PERFORMANCE: 75, COMMAND: 30 } },
      { label: 'At customer locations (field service)', tierScores: { CONNECT: 35, PERFORMANCE: 95, COMMAND: 90 } },
      { label: 'Mix of both locations', tierScores: { CONNECT: 60, PERFORMANCE: 85, COMMAND: 80 } },
      { label: 'Virtual/remote services', tierScores: { CONNECT: 95, PERFORMANCE: 65, COMMAND: 35 } },
    ],
  },

  // ========================================
  // Section 3: Lead Intake & Response (3 questions)
  // ========================================
  {
    id: 'lead_response_time',
    question: 'How quickly do you typically respond to new leads?',
    description: 'Response time significantly impacts conversion rates',
    section: 'Lead Intake & Response',
    options: [
      { label: 'Under 5 minutes - we have great coverage', tierScores: { CONNECT: 50, PERFORMANCE: 40, COMMAND: 20 } },
      { label: 'Same hour - could be faster', tierScores: { CONNECT: 75, PERFORMANCE: 75, COMMAND: 45 } },
      { label: 'Same day - we miss some opportunities', tierScores: { CONNECT: 85, PERFORMANCE: 85, COMMAND: 65 } },
      { label: 'Next day or longer - this is a problem', tierScores: { CONNECT: 90, PERFORMANCE: 95, COMMAND: 85 } },
    ],
  },
  {
    id: 'after_hours_calls',
    question: 'What happens when a lead calls outside business hours?',
    description: 'After-hours leads are often high-intent buyers',
    section: 'Lead Intake & Response',
    options: [
      { label: 'We have 24/7 live coverage', tierScores: { CONNECT: 40, PERFORMANCE: 30, COMMAND: 20 } },
      { label: 'Voicemail - we call back next day', tierScores: { CONNECT: 75, PERFORMANCE: 70, COMMAND: 50 } },
      { label: 'Calls go unanswered, no follow-up', tierScores: { CONNECT: 85, PERFORMANCE: 85, COMMAND: 75 } },
      { label: 'We lose most after-hours leads', tierScores: { CONNECT: 90, PERFORMANCE: 90, COMMAND: 95 } },
    ],
  },
  {
    id: 'lead_volume',
    question: 'How many new leads do you receive per week?',
    description: 'Higher lead volume benefits more from automation',
    section: 'Lead Intake & Response',
    options: [
      { label: '1-5 leads per week', tierScores: { CONNECT: 90, PERFORMANCE: 70, COMMAND: 25 } },
      { label: '6-15 leads per week', tierScores: { CONNECT: 80, PERFORMANCE: 85, COMMAND: 50 } },
      { label: '16-30 leads per week', tierScores: { CONNECT: 55, PERFORMANCE: 90, COMMAND: 75 } },
      { label: '30+ leads per week', tierScores: { CONNECT: 30, PERFORMANCE: 80, COMMAND: 95 } },
    ],
  },

  // ========================================
  // Section 4: Communication Preferences (4 questions)
  // ========================================
  {
    id: 'ai_interaction_mode',
    question: 'How would you prefer customers to interact with your AI assistant?',
    description: 'All tiers include voice, SMS, and email capability',
    section: 'Communication Preferences',
    options: [
      { label: 'Text chat only is fine', tierScores: { CONNECT: 80, PERFORMANCE: 55, COMMAND: 45 } },
      { label: 'Voice/speech capability is important', tierScores: { CONNECT: 90, PERFORMANCE: 90, COMMAND: 80 } },
      { label: 'Need both text and voice', tierScores: { CONNECT: 90, PERFORMANCE: 90, COMMAND: 90 } },
      { label: 'We want AI to make outbound calls', tierScores: { CONNECT: 80, PERFORMANCE: 85, COMMAND: 95 } },
    ],
  },
  {
    id: 'comm_channels',
    question: 'Which communication channels do your customers prefer?',
    description: 'Meeting customers where they are increases engagement',
    section: 'Communication Preferences',
    options: [
      { label: 'Email works fine for most', tierScores: { CONNECT: 85, PERFORMANCE: 75, COMMAND: 40 } },
      { label: 'SMS/texting is increasingly preferred', tierScores: { CONNECT: 85, PERFORMANCE: 85, COMMAND: 70 } },
      { label: 'Phone calls are still essential', tierScores: { CONNECT: 85, PERFORMANCE: 85, COMMAND: 90 } },
      { label: 'We need all channels - it varies', tierScores: { CONNECT: 70, PERFORMANCE: 85, COMMAND: 95 } },
    ],
  },
  {
    id: 'missed_calls',
    question: 'How many calls does your business miss per week?',
    description: 'Each missed call can cost $300-1000 in lost revenue',
    section: 'Communication Preferences',
    options: [
      { label: 'Rarely miss calls (0-2/week)', tierScores: { CONNECT: 70, PERFORMANCE: 55, COMMAND: 35 } },
      { label: '3-5 missed calls per week', tierScores: { CONNECT: 80, PERFORMANCE: 80, COMMAND: 60 } },
      { label: '6-10 missed calls per week', tierScores: { CONNECT: 85, PERFORMANCE: 90, COMMAND: 80 } },
      { label: '10+ missed calls per week', tierScores: { CONNECT: 75, PERFORMANCE: 85, COMMAND: 95 } },
    ],
  },
  {
    id: 'reservation_calls',
    question: 'Do you need AI to handle reservation or booking calls?',
    description: 'AI can book appointments directly via phone or chat',
    section: 'Communication Preferences',
    options: [
      { label: 'No - we don\'t take reservations', tierScores: { CONNECT: 85, PERFORMANCE: 60, COMMAND: 45 } },
      { label: 'Yes - simple booking over phone/chat', tierScores: { CONNECT: 95, PERFORMANCE: 75, COMMAND: 65 } },
      { label: 'Yes - with complex availability rules', tierScores: { CONNECT: 85, PERFORMANCE: 90, COMMAND: 85 } },
      { label: 'Yes - with service matching and routing', tierScores: { CONNECT: 70, PERFORMANCE: 95, COMMAND: 95 } },
    ],
  },

  // ========================================
  // Section 5: Scheduling & Operations (5 questions)
  // ========================================
  {
    id: 'booking_process',
    question: 'How do customers book appointments with you?',
    description: 'Booking friction directly impacts revenue',
    section: 'Scheduling & Operations',
    options: [
      { label: 'Self-service online booking', tierScores: { CONNECT: 50, PERFORMANCE: 45, COMMAND: 35 } },
      { label: 'Call/email, we schedule manually', tierScores: { CONNECT: 85, PERFORMANCE: 75, COMMAND: 55 } },
      { label: 'Lots of back-and-forth to confirm', tierScores: { CONNECT: 90, PERFORMANCE: 90, COMMAND: 75 } },
      { label: 'Phone tag is a major issue for us', tierScores: { CONNECT: 95, PERFORMANCE: 95, COMMAND: 90 } },
    ],
  },
  {
    id: 'calendar_preference',
    question: 'Would direct calendar sync (without a customer portal) work for you?',
    description: 'Connect uses direct calendar sync; Performance+ includes full customer portal',
    section: 'Scheduling & Operations',
    options: [
      { label: 'Yes - direct calendar sync is perfect', tierScores: { CONNECT: 95, PERFORMANCE: 55, COMMAND: 40 } },
      { label: 'I need a customer-facing booking portal', tierScores: { CONNECT: 95, PERFORMANCE: 85, COMMAND: 75 } },
      { label: 'I need both calendar sync AND customer portal', tierScores: { CONNECT: 90, PERFORMANCE: 90, COMMAND: 85 } },
      { label: 'Not sure what I need yet', tierScores: { CONNECT: 75, PERFORMANCE: 70, COMMAND: 60 } },
    ],
  },
  {
    id: 'daily_appointments',
    question: 'How many appointments do you handle per day?',
    description: 'Volume helps determine the right automation level',
    section: 'Scheduling & Operations',
    options: [
      { label: '1-5 appointments per day', tierScores: { CONNECT: 90, PERFORMANCE: 70, COMMAND: 30 } },
      { label: '6-15 appointments per day', tierScores: { CONNECT: 90, PERFORMANCE: 85, COMMAND: 55 } },
      { label: '16-30 appointments per day', tierScores: { CONNECT: 70, PERFORMANCE: 90, COMMAND: 80 } },
      { label: '30+ appointments per day', tierScores: { CONNECT: 45, PERFORMANCE: 80, COMMAND: 95 } },
    ],
  },
  {
    id: 'dispatch_routing',
    question: 'How do you currently dispatch and route technicians?',
    description: 'Efficient routing saves fuel and maximizes billable hours',
    section: 'Scheduling & Operations',
    options: [
      { label: 'Not applicable - services at my location', tierScores: { CONNECT: 90, PERFORMANCE: 65, COMMAND: 20 } },
      { label: 'Basic scheduling tools, some optimization', tierScores: { CONNECT: 50, PERFORMANCE: 75, COMMAND: 60 } },
      { label: 'Manual assignment based on availability', tierScores: { CONNECT: 55, PERFORMANCE: 90, COMMAND: 80 } },
      { label: 'First-available, no route optimization', tierScores: { CONNECT: 50, PERFORMANCE: 95, COMMAND: 90 } },
    ],
  },
  {
    id: 'customer_eta',
    question: 'How do customers know when a technician will arrive?',
    description: 'ETA transparency improves customer satisfaction by 40%',
    section: 'Scheduling & Operations',
    options: [
      { label: 'Not applicable - customers come to us', tierScores: { CONNECT: 90, PERFORMANCE: 60, COMMAND: 20 } },
      { label: 'Automated ETA texts when en route', tierScores: { CONNECT: 55, PERFORMANCE: 60, COMMAND: 50 } },
      { label: 'We call when leaving for the job', tierScores: { CONNECT: 50, PERFORMANCE: 85, COMMAND: 70 } },
      { label: 'They wait - no ETA communication', tierScores: { CONNECT: 55, PERFORMANCE: 95, COMMAND: 85 } },
    ],
  },

  // ========================================
  // Section 6: Customer Retention & Reviews (3 questions)
  // ========================================
  {
    id: 'review_collection',
    question: 'How do you collect reviews after service?',
    description: 'Reviews drive 15-20% of new customer acquisition',
    section: 'Customer Retention & Reviews',
    options: [
      { label: 'Automated multi-platform requests', tierScores: { CONNECT: 45, PERFORMANCE: 45, COMMAND: 40 } },
      { label: 'Occasional email request to some customers', tierScores: { CONNECT: 65, PERFORMANCE: 70, COMMAND: 60 } },
      { label: 'Sometimes ask verbally after service', tierScores: { CONNECT: 70, PERFORMANCE: 80, COMMAND: 85 } },
      { label: "We don't actively collect reviews", tierScores: { CONNECT: 75, PERFORMANCE: 85, COMMAND: 95 } },
    ],
  },
  {
    id: 'customer_reactivation',
    question: 'How do you re-engage past customers?',
    description: 'Reactivating existing customers costs 5x less than acquiring new',
    section: 'Customer Retention & Reviews',
    options: [
      { label: 'Active campaigns with personalization', tierScores: { CONNECT: 40, PERFORMANCE: 45, COMMAND: 40 } },
      { label: 'Occasional promotions to our list', tierScores: { CONNECT: 55, PERFORMANCE: 65, COMMAND: 60 } },
      { label: "We should but don't have time", tierScores: { CONNECT: 60, PERFORMANCE: 80, COMMAND: 90 } },
      { label: 'No reactivation strategy', tierScores: { CONNECT: 65, PERFORMANCE: 85, COMMAND: 95 } },
    ],
  },
  {
    id: 'appointment_reminders',
    question: 'Do you send appointment reminders to customers?',
    description: 'Automated reminders reduce no-shows by up to 40%',
    section: 'Customer Retention & Reviews',
    options: [
      { label: 'Yes - automated via SMS and email', tierScores: { CONNECT: 50, PERFORMANCE: 50, COMMAND: 45 } },
      { label: 'Sometimes - manual calls or texts', tierScores: { CONNECT: 85, PERFORMANCE: 75, COMMAND: 65 } },
      { label: 'Rarely - we forget or lack time', tierScores: { CONNECT: 90, PERFORMANCE: 85, COMMAND: 80 } },
      { label: 'No reminders - high no-show rate', tierScores: { CONNECT: 95, PERFORMANCE: 90, COMMAND: 90 } },
    ],
  },

  // ========================================
  // Section 7: Social Media & Web Presence (3 questions)
  // ========================================
  {
    id: 'social_media_activity',
    question: 'How active is your business on social media?',
    description: 'Connect includes Social Media AI for content creation',
    section: 'Social Media & Web Presence',
    options: [
      { label: 'Very active (daily posts)', tierScores: { CONNECT: 70, PERFORMANCE: 60, COMMAND: 80 } },
      { label: 'Somewhat active (weekly)', tierScores: { CONNECT: 80, PERFORMANCE: 65, COMMAND: 75 } },
      { label: 'Rarely post (monthly or less)', tierScores: { CONNECT: 85, PERFORMANCE: 65, COMMAND: 65 } },
      { label: 'Not on social media currently', tierScores: { CONNECT: 75, PERFORMANCE: 75, COMMAND: 55 } },
    ],
  },
  {
    id: 'content_creation',
    question: 'Who currently creates your social media content?',
    description: 'AI can automate content creation and scheduling',
    section: 'Social Media & Web Presence',
    options: [
      { label: 'I/we create it manually', tierScores: { CONNECT: 85, PERFORMANCE: 70, COMMAND: 80 } },
      { label: 'We use a marketing agency', tierScores: { CONNECT: 60, PERFORMANCE: 70, COMMAND: 85 } },
      { label: "We don't create content", tierScores: { CONNECT: 80, PERFORMANCE: 70, COMMAND: 70 } },
      { label: 'Would love AI to handle this', tierScores: { CONNECT: 95, PERFORMANCE: 75, COMMAND: 90 } },
    ],
  },
  {
    id: 'website_status',
    question: "What's your current website situation?",
    description: 'Connect includes a Web Presence site',
    section: 'Social Media & Web Presence',
    options: [
      { label: 'Professional website, works great', tierScores: { CONNECT: 55, PERFORMANCE: 65, COMMAND: 60 } },
      { label: 'Basic website, needs improvement', tierScores: { CONNECT: 85, PERFORMANCE: 70, COMMAND: 60 } },
      { label: 'No website currently', tierScores: { CONNECT: 95, PERFORMANCE: 75, COMMAND: 55 } },
      { label: 'Website with booking capability', tierScores: { CONNECT: 50, PERFORMANCE: 80, COMMAND: 75 } },
    ],
  },

  // ========================================
  // Section 8: Business Operations (4 questions)
  // ========================================
  {
    id: 'quoting_process',
    question: 'How do you create quotes/estimates for customers?',
    description: 'Performance includes AI Quoting capabilities',
    section: 'Business Operations',
    options: [
      { label: 'Fixed pricing - no quotes needed', tierScores: { CONNECT: 90, PERFORMANCE: 70, COMMAND: 30 } },
      { label: 'Professional quoting software', tierScores: { CONNECT: 45, PERFORMANCE: 55, COMMAND: 55 } },
      { label: 'Manual calculation, paper/basic docs', tierScores: { CONNECT: 50, PERFORMANCE: 90, COMMAND: 80 } },
      { label: 'Field techs need to quote on-site', tierScores: { CONNECT: 40, PERFORMANCE: 95, COMMAND: 90 } },
    ],
  },
  {
    id: 'inventory_tracking',
    question: 'Do you track inventory or parts/materials?',
    description: 'Command includes Inventory Management',
    section: 'Business Operations',
    options: [
      { label: 'No inventory to track', tierScores: { CONNECT: 85, PERFORMANCE: 70, COMMAND: 35 } },
      { label: 'Yes, with inventory software', tierScores: { CONNECT: 45, PERFORMANCE: 55, COMMAND: 60 } },
      { label: 'Spreadsheets or manual tracking', tierScores: { CONNECT: 40, PERFORMANCE: 70, COMMAND: 90 } },
      { label: 'Need better inventory management', tierScores: { CONNECT: 35, PERFORMANCE: 75, COMMAND: 95 } },
    ],
  },
  {
    id: 'walkin_vs_appointment',
    question: 'Do you offer walk-in services or appointment-only?',
    description: 'Helps determine receptionist vs scheduling focus',
    section: 'Business Operations',
    options: [
      { label: 'Walk-ins only (no appointments)', tierScores: { CONNECT: 95, PERFORMANCE: 55, COMMAND: 35 } },
      { label: 'Mostly walk-ins, some appointments', tierScores: { CONNECT: 85, PERFORMANCE: 65, COMMAND: 50 } },
      { label: 'Mix of both equally', tierScores: { CONNECT: 80, PERFORMANCE: 75, COMMAND: 65 } },
      { label: 'Appointment-only', tierScores: { CONNECT: 95, PERFORMANCE: 85, COMMAND: 80 } },
    ],
  },

  // ========================================
  // Section 9: Analytics & Growth (2 questions)
  // ========================================
  {
    id: 'performance_tracking',
    question: 'How do you track business performance metrics?',
    description: 'Data-driven decisions increase profitability by 20%',
    section: 'Analytics & Growth',
    options: [
      { label: 'Real-time dashboards with KPIs', tierScores: { CONNECT: 45, PERFORMANCE: 50, COMMAND: 45 } },
      { label: 'Weekly/monthly reports from software', tierScores: { CONNECT: 55, PERFORMANCE: 70, COMMAND: 65 } },
      { label: 'Spreadsheets and manual tracking', tierScores: { CONNECT: 60, PERFORMANCE: 80, COMMAND: 85 } },
      { label: 'Mostly gut feel and bank balance', tierScores: { CONNECT: 65, PERFORMANCE: 85, COMMAND: 95 } },
    ],
  },
  {
    id: 'marketing_automation',
    question: 'How do you run marketing campaigns and promotions?',
    description: 'Command includes Campaign & Marketing capabilities',
    section: 'Analytics & Growth',
    options: [
      { label: 'Sophisticated marketing automation', tierScores: { CONNECT: 45, PERFORMANCE: 55, COMMAND: 50 } },
      { label: 'Basic email campaigns occasionally', tierScores: { CONNECT: 60, PERFORMANCE: 70, COMMAND: 80 } },
      { label: 'Mostly word of mouth', tierScores: { CONNECT: 70, PERFORMANCE: 70, COMMAND: 75 } },
      { label: 'Want AI-powered marketing automation', tierScores: { CONNECT: 45, PERFORMANCE: 75, COMMAND: 95 } },
    ],
  },
];

// Tier recommendations matching canonical 3-tier model
export const TIER_RECOMMENDATIONS: Record<TierType, TierRecommendation> = {
  CONNECT: {
    tier: 'CONNECT',
    label: 'Aura Connect',
    price: '$297/mo',
    description: 'AI-powered booking, reminders, and customer engagement for solo operators, salons, and consultants',
    keyFeatures: [
      'AI Receptionist (Triage) — 24/7 customer engagement',
      'Customer Journey — Booking, follow-ups, review collection',
      'Outreach — Campaign & lead management',
      'Creative Content — Multi-channel content generation',
      'Web Presence — AI website builder & SEO',
      '4 Control Centers included',
      'Voice, SMS & Email channels',
    ],
    agentCount: 5,
    consoleCount: 4,
    employeeLimit: '5 employees',
    implementationFee: '$299',
  },
  PERFORMANCE: {
    tier: 'PERFORMANCE',
    label: 'Aura Performance',
    price: '$497/mo',
    description: 'Full field operations automation for HVAC, plumbing, and growing service businesses',
    keyFeatures: [
      'Everything in Connect, plus:',
      'Dispatch — Smart job assignment by skills & proximity',
      'Field Navigation — Route optimization & ETA tracking',
      'Business Finance — Quoting, invoicing & inventory',
      '6 Control Centers included',
      '15 employee accounts',
      'API Access',
    ],
    agentCount: 18,
    consoleCount: 6,
    employeeLimit: '15 employees',
    implementationFee: '$499',
  },
  COMMAND: {
    tier: 'COMMAND',
    label: 'Aura Command',
    price: '$697/mo',
    description: 'Enterprise solution for multi-location operations and large teams',
    keyFeatures: [
      'Everything in Performance, plus:',
      'Admin — Multi-location support & advanced permissions',
      'Analytics Intelligence — KPIs, forecasting & revenue analysis',
      'All 7 Control Centers + AI Operatives Hub',
      'White-Label Branding',
      'Unlimited employees',
      'Priority Support & Custom Implementation',
    ],
    agentCount: 24,
    consoleCount: 7,
    employeeLimit: 'Unlimited employees',
    implementationFee: 'Custom',
  },
};

// Section labels for progress display (9 sections)
export const SECTION_ORDER = [
  'Business Basics',
  'Industry & Services',
  'Lead Intake & Response',
  'Communication Preferences',
  'Scheduling & Operations',
  'Customer Retention & Reviews',
  'Social Media & Web Presence',
  'Business Operations',
  'Analytics & Growth',
];
