// Tier-based scoring for subscription plan recommendations
// Updated to 4-tier model: Core, Boost, Pro, Elite
export type TierType = 'CORE' | 'BOOST' | 'PRO' | 'ELITE';

export interface TierScores {
  CORE: number;      // 0-100 contribution (solo operators, salons, restaurants)
  BOOST: number;     // 0-100 contribution (small service teams, HVAC, plumbing)
  PRO: number;       // 0-100 contribution (growing companies, scaling field teams)
  ELITE: number;     // 0-100 contribution (large teams, enterprise, full suite)
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

// 30 Questions aligned to 4 subscription tiers (9 sections)
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
      { label: '1-2 employees (owner-operated)', tierScores: { CORE: 95, BOOST: 50, PRO: 25, ELITE: 10 } },
      { label: '3-5 employees', tierScores: { CORE: 70, BOOST: 90, PRO: 60, ELITE: 30 } },
      { label: '6-10 employees', tierScores: { CORE: 40, BOOST: 80, PRO: 90, ELITE: 60 } },
      { label: '11-25 employees', tierScores: { CORE: 15, BOOST: 50, PRO: 80, ELITE: 95 } },
    ],
  },
  {
    id: 'annual_revenue',
    question: 'What is your approximate annual revenue?',
    description: 'Helps us calibrate recommendations to your budget',
    section: 'Business Basics',
    options: [
      { label: 'Under $100K', tierScores: { CORE: 95, BOOST: 55, PRO: 20, ELITE: 5 } },
      { label: '$100K - $500K', tierScores: { CORE: 80, BOOST: 85, PRO: 55, ELITE: 30 } },
      { label: '$500K - $2M', tierScores: { CORE: 50, BOOST: 80, PRO: 90, ELITE: 70 } },
      { label: 'Over $2M', tierScores: { CORE: 25, BOOST: 55, PRO: 80, ELITE: 95 } },
    ],
  },
  {
    id: 'industry_type',
    question: 'What type of business do you operate?',
    description: 'Different industries have different automation needs',
    section: 'Business Basics',
    options: [
      { label: 'Restaurant, cafe, or food service', tierScores: { CORE: 95, BOOST: 45, PRO: 25, ELITE: 20 } },
      { label: 'Salon, spa, or wellness', tierScores: { CORE: 95, BOOST: 60, PRO: 35, ELITE: 25 } },
      { label: 'Personal services (consultant, coach, etc.)', tierScores: { CORE: 95, BOOST: 55, PRO: 30, ELITE: 20 } },
      { label: 'Home/field services (HVAC, plumbing, etc.)', tierScores: { CORE: 40, BOOST: 90, PRO: 95, ELITE: 85 } },
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
      { label: 'Mostly walk-ins, no appointments needed', tierScores: { CORE: 95, BOOST: 55, PRO: 45, ELITE: 40 } },
      { label: 'Mix of walk-ins and scheduled appointments', tierScores: { CORE: 80, BOOST: 75, PRO: 60, ELITE: 55 } },
      { label: 'All appointments are scheduled in advance', tierScores: { CORE: 95, BOOST: 85, PRO: 80, ELITE: 75 } },
      { label: 'Complex scheduling with multiple team members', tierScores: { CORE: 60, BOOST: 90, PRO: 95, ELITE: 90 } },
    ],
  },
  {
    id: 'service_location',
    question: 'Where do you primarily deliver your services?',
    description: 'Service location affects routing and dispatch needs',
    section: 'Industry & Services',
    options: [
      { label: 'At my business location only', tierScores: { CORE: 95, BOOST: 75, PRO: 45, ELITE: 30 } },
      { label: 'At customer locations (field service)', tierScores: { CORE: 35, BOOST: 90, PRO: 95, ELITE: 90 } },
      { label: 'Mix of both locations', tierScores: { CORE: 60, BOOST: 85, PRO: 85, ELITE: 80 } },
      { label: 'Virtual/remote services', tierScores: { CORE: 95, BOOST: 65, PRO: 45, ELITE: 35 } },
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
      { label: 'Under 5 minutes - we have great coverage', tierScores: { CORE: 50, BOOST: 40, PRO: 25, ELITE: 20 } },
      { label: 'Same hour - could be faster', tierScores: { CORE: 75, BOOST: 75, PRO: 55, ELITE: 45 } },
      { label: 'Same day - we miss some opportunities', tierScores: { CORE: 85, BOOST: 85, PRO: 75, ELITE: 65 } },
      { label: 'Next day or longer - this is a problem', tierScores: { CORE: 90, BOOST: 95, PRO: 90, ELITE: 85 } },
    ],
  },
  {
    id: 'after_hours_calls',
    question: 'What happens when a lead calls outside business hours?',
    description: 'After-hours leads are often high-intent buyers',
    section: 'Lead Intake & Response',
    options: [
      { label: 'We have 24/7 live coverage', tierScores: { CORE: 40, BOOST: 30, PRO: 22, ELITE: 20 } },
      { label: 'Voicemail - we call back next day', tierScores: { CORE: 75, BOOST: 70, PRO: 55, ELITE: 50 } },
      { label: 'Calls go unanswered, no follow-up', tierScores: { CORE: 85, BOOST: 85, PRO: 80, ELITE: 75 } },
      { label: 'We lose most after-hours leads', tierScores: { CORE: 90, BOOST: 90, PRO: 92, ELITE: 95 } },
    ],
  },
  {
    id: 'lead_volume',
    question: 'How many new leads do you receive per week?',
    description: 'Higher lead volume benefits more from automation',
    section: 'Lead Intake & Response',
    options: [
      { label: '1-5 leads per week', tierScores: { CORE: 90, BOOST: 70, PRO: 40, ELITE: 25 } },
      { label: '6-15 leads per week', tierScores: { CORE: 80, BOOST: 85, PRO: 65, ELITE: 50 } },
      { label: '16-30 leads per week', tierScores: { CORE: 55, BOOST: 85, PRO: 90, ELITE: 75 } },
      { label: '30+ leads per week', tierScores: { CORE: 30, BOOST: 65, PRO: 85, ELITE: 95 } },
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
      { label: 'Text chat only is fine', tierScores: { CORE: 80, BOOST: 55, PRO: 48, ELITE: 45 } },
      { label: 'Voice/speech capability is important', tierScores: { CORE: 90, BOOST: 90, PRO: 85, ELITE: 80 } },
      { label: 'Need both text and voice', tierScores: { CORE: 90, BOOST: 90, PRO: 90, ELITE: 90 } },
      { label: 'We want AI to make outbound calls', tierScores: { CORE: 80, BOOST: 85, PRO: 90, ELITE: 95 } },
    ],
  },
  {
    id: 'comm_channels',
    question: 'Which communication channels do your customers prefer?',
    description: 'Meeting customers where they are increases engagement',
    section: 'Communication Preferences',
    options: [
      { label: 'Email works fine for most', tierScores: { CORE: 85, BOOST: 75, PRO: 55, ELITE: 40 } },
      { label: 'SMS/texting is increasingly preferred', tierScores: { CORE: 85, BOOST: 85, PRO: 78, ELITE: 70 } },
      { label: 'Phone calls are still essential', tierScores: { CORE: 85, BOOST: 85, PRO: 88, ELITE: 90 } },
      { label: 'We need all channels - it varies', tierScores: { CORE: 70, BOOST: 80, PRO: 90, ELITE: 95 } },
    ],
  },
  {
    id: 'missed_calls',
    question: 'How many calls does your business miss per week?',
    description: 'Each missed call can cost $300-1000 in lost revenue',
    section: 'Communication Preferences',
    options: [
      { label: 'Rarely miss calls (0-2/week)', tierScores: { CORE: 70, BOOST: 55, PRO: 42, ELITE: 35 } },
      { label: '3-5 missed calls per week', tierScores: { CORE: 80, BOOST: 80, PRO: 68, ELITE: 60 } },
      { label: '6-10 missed calls per week', tierScores: { CORE: 85, BOOST: 90, PRO: 85, ELITE: 80 } },
      { label: '10+ missed calls per week', tierScores: { CORE: 75, BOOST: 82, PRO: 90, ELITE: 95 } },
    ],
  },
  {
    id: 'reservation_calls',
    question: 'Do you need AI to handle reservation or booking calls?',
    description: 'AI can book appointments directly via phone or chat',
    section: 'Communication Preferences',
    options: [
      { label: 'No - we don\'t take reservations', tierScores: { CORE: 85, BOOST: 60, PRO: 50, ELITE: 45 } },
      { label: 'Yes - simple booking over phone/chat', tierScores: { CORE: 95, BOOST: 75, PRO: 68, ELITE: 65 } },
      { label: 'Yes - with complex availability rules', tierScores: { CORE: 85, BOOST: 90, PRO: 88, ELITE: 85 } },
      { label: 'Yes - with service matching and routing', tierScores: { CORE: 70, BOOST: 90, PRO: 95, ELITE: 95 } },
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
      { label: 'Self-service online booking', tierScores: { CORE: 50, BOOST: 45, PRO: 38, ELITE: 35 } },
      { label: 'Call/email, we schedule manually', tierScores: { CORE: 85, BOOST: 75, PRO: 62, ELITE: 55 } },
      { label: 'Lots of back-and-forth to confirm', tierScores: { CORE: 90, BOOST: 90, PRO: 82, ELITE: 75 } },
      { label: 'Phone tag is a major issue for us', tierScores: { CORE: 95, BOOST: 95, PRO: 92, ELITE: 90 } },
    ],
  },
  {
    id: 'calendar_preference',
    question: 'Would direct calendar sync (without a customer portal) work for you?',
    description: 'Core uses direct calendar sync; Boost+ includes full customer portal',
    section: 'Scheduling & Operations',
    options: [
      { label: 'Yes - direct calendar sync is perfect', tierScores: { CORE: 95, BOOST: 55, PRO: 45, ELITE: 40 } },
      { label: 'I need a customer-facing booking portal', tierScores: { CORE: 95, BOOST: 85, PRO: 78, ELITE: 75 } },
      { label: 'I need both calendar sync AND customer portal', tierScores: { CORE: 90, BOOST: 90, PRO: 88, ELITE: 85 } },
      { label: 'Not sure what I need yet', tierScores: { CORE: 75, BOOST: 70, PRO: 62, ELITE: 60 } },
    ],
  },
  {
    id: 'daily_appointments',
    question: 'How many appointments do you handle per day?',
    description: 'Volume helps determine the right automation level',
    section: 'Scheduling & Operations',
    options: [
      { label: '1-5 appointments per day', tierScores: { CORE: 90, BOOST: 70, PRO: 45, ELITE: 30 } },
      { label: '6-15 appointments per day', tierScores: { CORE: 90, BOOST: 85, PRO: 68, ELITE: 55 } },
      { label: '16-30 appointments per day', tierScores: { CORE: 70, BOOST: 85, PRO: 90, ELITE: 80 } },
      { label: '30+ appointments per day', tierScores: { CORE: 45, BOOST: 65, PRO: 85, ELITE: 95 } },
    ],
  },
  {
    id: 'dispatch_routing',
    question: 'How do you currently dispatch and route technicians?',
    description: 'Efficient routing saves fuel and maximizes billable hours',
    section: 'Scheduling & Operations',
    options: [
      { label: 'Not applicable - services at my location', tierScores: { CORE: 90, BOOST: 65, PRO: 35, ELITE: 20 } },
      { label: 'Basic scheduling tools, some optimization', tierScores: { CORE: 50, BOOST: 75, PRO: 65, ELITE: 60 } },
      { label: 'Manual assignment based on availability', tierScores: { CORE: 55, BOOST: 90, PRO: 85, ELITE: 80 } },
      { label: 'First-available, no route optimization', tierScores: { CORE: 50, BOOST: 92, PRO: 95, ELITE: 90 } },
    ],
  },
  {
    id: 'customer_eta',
    question: 'How do customers know when a technician will arrive?',
    description: 'ETA transparency improves customer satisfaction by 40%',
    section: 'Scheduling & Operations',
    options: [
      { label: 'Not applicable - customers come to us', tierScores: { CORE: 90, BOOST: 60, PRO: 35, ELITE: 20 } },
      { label: 'Automated ETA texts when en route', tierScores: { CORE: 55, BOOST: 60, PRO: 52, ELITE: 50 } },
      { label: 'We call when leaving for the job', tierScores: { CORE: 50, BOOST: 85, PRO: 78, ELITE: 70 } },
      { label: 'They wait - no ETA communication', tierScores: { CORE: 55, BOOST: 92, PRO: 95, ELITE: 85 } },
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
      { label: 'Automated multi-platform requests', tierScores: { CORE: 45, BOOST: 45, PRO: 42, ELITE: 40 } },
      { label: 'Occasional email request to some customers', tierScores: { CORE: 65, BOOST: 70, PRO: 62, ELITE: 60 } },
      { label: 'Sometimes ask verbally after service', tierScores: { CORE: 70, BOOST: 80, PRO: 82, ELITE: 85 } },
      { label: "We don't actively collect reviews", tierScores: { CORE: 75, BOOST: 85, PRO: 90, ELITE: 95 } },
    ],
  },
  {
    id: 'customer_reactivation',
    question: 'How do you re-engage past customers?',
    description: 'Reactivating existing customers costs 5x less than acquiring new',
    section: 'Customer Retention & Reviews',
    options: [
      { label: 'Active campaigns with personalization', tierScores: { CORE: 40, BOOST: 45, PRO: 42, ELITE: 40 } },
      { label: 'Occasional promotions to our list', tierScores: { CORE: 55, BOOST: 65, PRO: 60, ELITE: 60 } },
      { label: "We should but don't have time", tierScores: { CORE: 60, BOOST: 75, PRO: 85, ELITE: 90 } },
      { label: 'No reactivation strategy', tierScores: { CORE: 65, BOOST: 80, PRO: 90, ELITE: 95 } },
    ],
  },
  {
    id: 'appointment_reminders',
    question: 'Do you send appointment reminders to customers?',
    description: 'Automated reminders reduce no-shows by up to 40%',
    section: 'Customer Retention & Reviews',
    options: [
      { label: 'Yes - automated via SMS and email', tierScores: { CORE: 50, BOOST: 50, PRO: 45, ELITE: 45 } },
      { label: 'Sometimes - manual calls or texts', tierScores: { CORE: 85, BOOST: 75, PRO: 68, ELITE: 65 } },
      { label: 'Rarely - we forget or lack time', tierScores: { CORE: 90, BOOST: 85, PRO: 82, ELITE: 80 } },
      { label: 'No reminders - high no-show rate', tierScores: { CORE: 95, BOOST: 90, PRO: 90, ELITE: 90 } },
    ],
  },

  // ========================================
  // Section 7: Social Media & Web Presence (3 questions)
  // ========================================
  {
    id: 'social_media_activity',
    question: 'How active is your business on social media?',
    description: 'Boost includes Social Media AI for content creation',
    section: 'Social Media & Web Presence',
    options: [
      { label: 'Very active (daily posts)', tierScores: { CORE: 70, BOOST: 60, PRO: 70, ELITE: 80 } },
      { label: 'Somewhat active (weekly)', tierScores: { CORE: 80, BOOST: 65, PRO: 68, ELITE: 75 } },
      { label: 'Rarely post (monthly or less)', tierScores: { CORE: 85, BOOST: 65, PRO: 62, ELITE: 65 } },
      { label: 'Not on social media currently', tierScores: { CORE: 75, BOOST: 75, PRO: 62, ELITE: 55 } },
    ],
  },
  {
    id: 'content_creation',
    question: 'Who currently creates your social media content?',
    description: 'AI can automate content creation and scheduling',
    section: 'Social Media & Web Presence',
    options: [
      { label: 'I/we create it manually', tierScores: { CORE: 85, BOOST: 70, PRO: 75, ELITE: 80 } },
      { label: 'We use a marketing agency', tierScores: { CORE: 60, BOOST: 70, PRO: 78, ELITE: 85 } },
      { label: "We don't create content", tierScores: { CORE: 80, BOOST: 70, PRO: 68, ELITE: 70 } },
      { label: 'Would love AI to handle this', tierScores: { CORE: 95, BOOST: 75, PRO: 82, ELITE: 90 } },
    ],
  },
  {
    id: 'website_status',
    question: "What's your current website situation?",
    description: 'Core includes a Web Presence site',
    section: 'Social Media & Web Presence',
    options: [
      { label: 'Professional website, works great', tierScores: { CORE: 55, BOOST: 65, PRO: 62, ELITE: 60 } },
      { label: 'Basic website, needs improvement', tierScores: { CORE: 85, BOOST: 70, PRO: 62, ELITE: 60 } },
      { label: 'No website currently', tierScores: { CORE: 95, BOOST: 75, PRO: 62, ELITE: 55 } },
      { label: 'Website with booking capability', tierScores: { CORE: 50, BOOST: 80, PRO: 78, ELITE: 75 } },
    ],
  },

  // ========================================
  // Section 8: Business Operations (4 questions)
  // ========================================
  {
    id: 'quoting_process',
    question: 'How do you create quotes/estimates for customers?',
    description: 'Elite includes AI Quoting capabilities',
    section: 'Business Operations',
    options: [
      { label: 'Fixed pricing - no quotes needed', tierScores: { CORE: 90, BOOST: 70, PRO: 45, ELITE: 30 } },
      { label: 'Professional quoting software', tierScores: { CORE: 45, BOOST: 55, PRO: 55, ELITE: 55 } },
      { label: 'Manual calculation, paper/basic docs', tierScores: { CORE: 50, BOOST: 80, PRO: 90, ELITE: 80 } },
      { label: 'Field techs need to quote on-site', tierScores: { CORE: 40, BOOST: 85, PRO: 95, ELITE: 90 } },
    ],
  },
  {
    id: 'inventory_tracking',
    question: 'Do you track inventory or parts/materials?',
    description: 'Elite includes Inventory Management',
    section: 'Business Operations',
    options: [
      { label: 'No inventory to track', tierScores: { CORE: 85, BOOST: 70, PRO: 48, ELITE: 35 } },
      { label: 'Yes, with inventory software', tierScores: { CORE: 45, BOOST: 55, PRO: 58, ELITE: 60 } },
      { label: 'Spreadsheets or manual tracking', tierScores: { CORE: 40, BOOST: 65, PRO: 80, ELITE: 90 } },
      { label: 'Need better inventory management', tierScores: { CORE: 35, BOOST: 60, PRO: 82, ELITE: 95 } },
    ],
  },
  {
    id: 'walkin_vs_appointment',
    question: 'Do you offer walk-in services or appointment-only?',
    description: 'Helps determine receptionist vs scheduling focus',
    section: 'Business Operations',
    options: [
      { label: 'Walk-ins only (no appointments)', tierScores: { CORE: 95, BOOST: 55, PRO: 42, ELITE: 35 } },
      { label: 'Mostly walk-ins, some appointments', tierScores: { CORE: 85, BOOST: 65, PRO: 55, ELITE: 50 } },
      { label: 'Mix of both equally', tierScores: { CORE: 80, BOOST: 75, PRO: 68, ELITE: 65 } },
      { label: 'Appointment-only', tierScores: { CORE: 95, BOOST: 85, PRO: 82, ELITE: 80 } },
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
      { label: 'Real-time dashboards with KPIs', tierScores: { CORE: 45, BOOST: 50, PRO: 48, ELITE: 45 } },
      { label: 'Weekly/monthly reports from software', tierScores: { CORE: 55, BOOST: 70, PRO: 68, ELITE: 65 } },
      { label: 'Spreadsheets and manual tracking', tierScores: { CORE: 60, BOOST: 78, PRO: 82, ELITE: 85 } },
      { label: 'Mostly gut feel and bank balance', tierScores: { CORE: 65, BOOST: 80, PRO: 90, ELITE: 95 } },
    ],
  },
  {
    id: 'marketing_automation',
    question: 'How do you run marketing campaigns and promotions?',
    description: 'Pro includes Campaign & Marketing capabilities',
    section: 'Analytics & Growth',
    options: [
      { label: 'Sophisticated marketing automation', tierScores: { CORE: 45, BOOST: 55, PRO: 52, ELITE: 50 } },
      { label: 'Basic email campaigns occasionally', tierScores: { CORE: 60, BOOST: 70, PRO: 75, ELITE: 80 } },
      { label: 'Mostly word of mouth', tierScores: { CORE: 70, BOOST: 70, PRO: 72, ELITE: 75 } },
      { label: 'Want AI-powered marketing automation', tierScores: { CORE: 45, BOOST: 65, PRO: 85, ELITE: 95 } },
    ],
  },
];

// Tier recommendations matching canonical 4-tier model
export const TIER_RECOMMENDATIONS: Record<TierType, TierRecommendation> = {
  CORE: {
    tier: 'CORE',
    label: 'Aura Core',
    price: '$197/mo',
    description: '8 AI Agents for booking, follow-up, creative content & web presence for solo operators and restaurants',
    keyFeatures: [
      'AI Receptionist (Triage) — 24/7 customer engagement',
      'Booking, Follow-Up, Review Agents',
      'Creative Content + Web Presence Agents',
      'Lead + Marketing Agents',
      '3 Control Centers included',
      'Text & Email channels',
    ],
    agentCount: 8,
    consoleCount: 3,
    employeeLimit: '10 employees',
    implementationFee: '$0',
  },
  BOOST: {
    tier: 'BOOST',
    label: 'Aura Boost',
    price: '$497/mo',
    description: '12 AI Agents with dispatch, routing & field operations for small service teams',
    keyFeatures: [
      'Everything in Core, plus:',
      'Dispatch Agent — Smart job assignment',
      'Route Agent + ETA Agent + Check-In Agent',
      'Field Operations Console + Social Media Console',
      '25 employee accounts',
      'Full Voice, SMS & Email channels',
    ],
    agentCount: 12,
    consoleCount: 5,
    employeeLimit: '25 employees',
    implementationFee: '$299',
  },
  PRO: {
    tier: 'PRO',
    label: 'Aura Pro',
    price: '$997/mo',
    description: '16 AI Agents with campaigns, outreach & analytics for scaling field teams',
    keyFeatures: [
      'Everything in Boost, plus:',
      'Campaign Agent + Outreach Agent',
      'Social Feed Queue + Social Analytics Agents',
      'White-Label Branding',
      '50 employee accounts',
      'Full Analytics & Reporting',
    ],
    agentCount: 16,
    consoleCount: 5,
    employeeLimit: '50 employees',
    implementationFee: '$599',
  },
  ELITE: {
    tier: 'ELITE',
    label: 'Aura Elite',
    price: '$1,997/mo',
    description: 'Full 24-agent suite for large service teams and enterprise operations',
    keyFeatures: [
      'Everything in Pro, plus:',
      'Admin + Quoting + Invoice + Inventory Agents',
      'Insights + Performance + Revenue + Forecast Agents',
      'All 7 Control Centers + AI Hub',
      'Full White-Label Branding',
      'Unlimited employees',
      'Dedicated Onboarding + Priority Support',
    ],
    agentCount: 24,
    consoleCount: 7,
    employeeLimit: 'Unlimited employees',
    implementationFee: '$999',
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
