// Tier-based scoring for subscription plan recommendations
export type TierType = 'SINGLE_POINT' | 'MULTI_TRACK' | 'COMMAND';

export interface TierScores {
  SINGLE_POINT: number;  // 0-100 contribution
  MULTI_TRACK: number;   // 0-100 contribution
  COMMAND: number;       // 0-100 contribution
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
}

// Questions aligned to subscription tiers and features
export const QUESTIONS: AuditQuestion[] = [
  // Section 1: Lead Intake & Response
  {
    id: 'lead_response_time',
    question: 'How quickly do you typically respond to new leads?',
    description: 'Response time significantly impacts conversion rates',
    section: 'Lead Intake & Response',
    options: [
      { label: 'Under 5 minutes - we have great coverage', tierScores: { SINGLE_POINT: 40, MULTI_TRACK: 30, COMMAND: 20 } },
      { label: 'Same hour - could be faster', tierScores: { SINGLE_POINT: 70, MULTI_TRACK: 50, COMMAND: 40 } },
      { label: 'Same day - we miss some opportunities', tierScores: { SINGLE_POINT: 85, MULTI_TRACK: 75, COMMAND: 60 } },
      { label: 'Next day or longer - this is a problem', tierScores: { SINGLE_POINT: 95, MULTI_TRACK: 90, COMMAND: 85 } },
    ],
  },
  {
    id: 'after_hours_calls',
    question: 'What happens when a lead calls outside business hours?',
    description: 'After-hours leads are often high-intent buyers',
    section: 'Lead Intake & Response',
    options: [
      { label: 'We have 24/7 live coverage', tierScores: { SINGLE_POINT: 30, MULTI_TRACK: 25, COMMAND: 20 } },
      { label: 'Voicemail - we call back next day', tierScores: { SINGLE_POINT: 65, MULTI_TRACK: 55, COMMAND: 45 } },
      { label: 'Calls go unanswered, no follow-up', tierScores: { SINGLE_POINT: 80, MULTI_TRACK: 85, COMMAND: 75 } },
      { label: 'We lose most after-hours leads', tierScores: { SINGLE_POINT: 85, MULTI_TRACK: 90, COMMAND: 95 } },
    ],
  },
  // Section 2: Scheduling & Booking
  {
    id: 'booking_process',
    question: 'How do customers book appointments with you?',
    description: 'Booking friction directly impacts revenue',
    section: 'Scheduling & Booking',
    options: [
      { label: 'Self-service online booking', tierScores: { SINGLE_POINT: 40, MULTI_TRACK: 35, COMMAND: 30 } },
      { label: 'Call/email, we schedule manually', tierScores: { SINGLE_POINT: 75, MULTI_TRACK: 60, COMMAND: 50 } },
      { label: 'Lots of back-and-forth to confirm', tierScores: { SINGLE_POINT: 80, MULTI_TRACK: 85, COMMAND: 70 } },
      { label: 'Phone tag is a major issue', tierScores: { SINGLE_POINT: 85, MULTI_TRACK: 90, COMMAND: 95 } },
    ],
  },
  {
    id: 'appointment_reminders',
    question: 'How do you remind customers about appointments?',
    description: 'No-shows cost service businesses 5-10% of revenue',
    section: 'Scheduling & Booking',
    options: [
      { label: 'Automated multi-channel (email + SMS)', tierScores: { SINGLE_POINT: 35, MULTI_TRACK: 40, COMMAND: 35 } },
      { label: 'Automated email only', tierScores: { SINGLE_POINT: 55, MULTI_TRACK: 70, COMMAND: 55 } },
      { label: 'Manual calls/texts before appointments', tierScores: { SINGLE_POINT: 70, MULTI_TRACK: 85, COMMAND: 80 } },
      { label: 'We don\'t send reminders consistently', tierScores: { SINGLE_POINT: 80, MULTI_TRACK: 90, COMMAND: 95 } },
    ],
  },
  // Section 3: Team & Field Operations
  {
    id: 'team_size',
    question: 'How many field technicians or employees do you have?',
    description: 'Team size determines your operational complexity',
    section: 'Team & Field Operations',
    options: [
      { label: '1-5 employees', tierScores: { SINGLE_POINT: 90, MULTI_TRACK: 50, COMMAND: 30 } },
      { label: '6-10 employees', tierScores: { SINGLE_POINT: 60, MULTI_TRACK: 90, COMMAND: 60 } },
      { label: '11-25 employees', tierScores: { SINGLE_POINT: 30, MULTI_TRACK: 85, COMMAND: 90 } },
      { label: '25+ employees', tierScores: { SINGLE_POINT: 15, MULTI_TRACK: 60, COMMAND: 95 } },
    ],
  },
  {
    id: 'dispatch_routing',
    question: 'How do you currently dispatch and route technicians?',
    description: 'Efficient routing saves fuel and maximizes billable hours',
    section: 'Team & Field Operations',
    options: [
      { label: 'Optimized software with real-time adjustments', tierScores: { SINGLE_POINT: 30, MULTI_TRACK: 40, COMMAND: 35 } },
      { label: 'Basic scheduling tools, some optimization', tierScores: { SINGLE_POINT: 50, MULTI_TRACK: 75, COMMAND: 60 } },
      { label: 'Manual assignment based on availability', tierScores: { SINGLE_POINT: 55, MULTI_TRACK: 90, COMMAND: 75 } },
      { label: 'First-available, no route optimization', tierScores: { SINGLE_POINT: 60, MULTI_TRACK: 95, COMMAND: 90 } },
    ],
  },
  {
    id: 'customer_eta',
    question: 'How do customers know when a technician will arrive?',
    description: 'ETA transparency improves customer satisfaction by 40%',
    section: 'Team & Field Operations',
    options: [
      { label: 'Real-time GPS tracking they can view', tierScores: { SINGLE_POINT: 30, MULTI_TRACK: 35, COMMAND: 30 } },
      { label: 'Automated ETA texts when en route', tierScores: { SINGLE_POINT: 45, MULTI_TRACK: 55, COMMAND: 45 } },
      { label: 'We call when leaving for the job', tierScores: { SINGLE_POINT: 55, MULTI_TRACK: 85, COMMAND: 70 } },
      { label: 'They wait - no ETA communication', tierScores: { SINGLE_POINT: 65, MULTI_TRACK: 95, COMMAND: 85 } },
    ],
  },
  // Section 4: Communication Preferences
  {
    id: 'comm_channels',
    question: 'Which channels do your customers prefer for communication?',
    description: 'Meeting customers where they are increases engagement',
    section: 'Communication Channels',
    options: [
      { label: 'Email works fine for most', tierScores: { SINGLE_POINT: 85, MULTI_TRACK: 50, COMMAND: 40 } },
      { label: 'SMS/texting is increasingly preferred', tierScores: { SINGLE_POINT: 55, MULTI_TRACK: 90, COMMAND: 70 } },
      { label: 'Phone calls are still essential', tierScores: { SINGLE_POINT: 50, MULTI_TRACK: 70, COMMAND: 95 } },
      { label: 'We need all channels - it varies', tierScores: { SINGLE_POINT: 40, MULTI_TRACK: 75, COMMAND: 95 } },
    ],
  },
  {
    id: 'missed_calls',
    question: 'How many calls does your business miss per week?',
    description: 'Each missed call can cost $300-1000 in lost revenue',
    section: 'Communication Channels',
    options: [
      { label: 'Rarely miss calls (0-2/week)', tierScores: { SINGLE_POINT: 50, MULTI_TRACK: 40, COMMAND: 30 } },
      { label: '3-5 missed calls per week', tierScores: { SINGLE_POINT: 75, MULTI_TRACK: 70, COMMAND: 60 } },
      { label: '5-10 missed calls per week', tierScores: { SINGLE_POINT: 80, MULTI_TRACK: 90, COMMAND: 80 } },
      { label: '10+ missed calls per week', tierScores: { SINGLE_POINT: 75, MULTI_TRACK: 85, COMMAND: 95 } },
    ],
  },
  // Section 5: Customer Retention & Growth
  {
    id: 'review_collection',
    question: 'How do you collect reviews after service?',
    description: 'Reviews drive 15-20% of new customer acquisition',
    section: 'Customer Retention & Growth',
    options: [
      { label: 'Automated multi-platform requests', tierScores: { SINGLE_POINT: 35, MULTI_TRACK: 40, COMMAND: 35 } },
      { label: 'Occasional email request to some customers', tierScores: { SINGLE_POINT: 55, MULTI_TRACK: 70, COMMAND: 60 } },
      { label: 'Sometimes ask verbally after service', tierScores: { SINGLE_POINT: 60, MULTI_TRACK: 75, COMMAND: 85 } },
      { label: 'We don\'t actively collect reviews', tierScores: { SINGLE_POINT: 65, MULTI_TRACK: 80, COMMAND: 95 } },
    ],
  },
  {
    id: 'customer_reactivation',
    question: 'How do you re-engage past customers?',
    description: 'Reactivating existing customers costs 5x less than acquiring new',
    section: 'Customer Retention & Growth',
    options: [
      { label: 'Active campaigns with personalization', tierScores: { SINGLE_POINT: 35, MULTI_TRACK: 40, COMMAND: 35 } },
      { label: 'Occasional promotions to our list', tierScores: { SINGLE_POINT: 50, MULTI_TRACK: 65, COMMAND: 60 } },
      { label: 'We should but don\'t have time', tierScores: { SINGLE_POINT: 55, MULTI_TRACK: 75, COMMAND: 90 } },
      { label: 'No reactivation strategy', tierScores: { SINGLE_POINT: 60, MULTI_TRACK: 80, COMMAND: 95 } },
    ],
  },
  // Section 6: Business Intelligence & Scale
  {
    id: 'performance_tracking',
    question: 'How do you track business performance metrics?',
    description: 'Data-driven decisions increase profitability by 20%',
    section: 'Business Intelligence & Branding',
    options: [
      { label: 'Real-time dashboards with KPIs', tierScores: { SINGLE_POINT: 40, MULTI_TRACK: 45, COMMAND: 40 } },
      { label: 'Weekly/monthly reports from software', tierScores: { SINGLE_POINT: 55, MULTI_TRACK: 65, COMMAND: 60 } },
      { label: 'Spreadsheets and manual tracking', tierScores: { SINGLE_POINT: 60, MULTI_TRACK: 75, COMMAND: 85 } },
      { label: 'Mostly gut feel and bank balance', tierScores: { SINGLE_POINT: 65, MULTI_TRACK: 80, COMMAND: 95 } },
    ],
  },
  {
    id: 'white_label',
    question: 'Do you need white-label/custom branding for customer-facing tools?',
    description: 'Brand consistency builds trust and recognition',
    section: 'Business Intelligence & Branding',
    options: [
      { label: 'Not important - function over form', tierScores: { SINGLE_POINT: 80, MULTI_TRACK: 70, COMMAND: 40 } },
      { label: 'Nice to have eventually', tierScores: { SINGLE_POINT: 60, MULTI_TRACK: 65, COMMAND: 60 } },
      { label: 'Yes, brand consistency matters to us', tierScores: { SINGLE_POINT: 40, MULTI_TRACK: 55, COMMAND: 85 } },
      { label: 'Essential - we serve enterprise clients', tierScores: { SINGLE_POINT: 25, MULTI_TRACK: 40, COMMAND: 95 } },
    ],
  },
];

// Tier recommendations with full details
export const TIER_RECOMMENDATIONS: Record<TierType, TierRecommendation> = {
  SINGLE_POINT: {
    tier: 'SINGLE_POINT',
    label: 'Single-Point',
    price: '$497/mo',
    description: 'Perfect for small teams focused on lead capture and customer engagement',
    keyFeatures: [
      'AI Receptionist (Triage Agent)',
      'Follow-up Agent',
      'Review Agent',
      'AI Voice (Chat + Outbound Calls)',
      'Customer Portal Console',
      'Email + SMS + Voice Reminders',
      'Up to 5 employees',
    ],
    agentCount: 3,
    consoleCount: 1,
  },
  MULTI_TRACK: {
    tier: 'MULTI_TRACK',
    label: 'Multi-Track',
    price: '$897/mo',
    description: 'Ideal for growing teams with field operations and multi-channel needs',
    keyFeatures: [
      'All Single-Point features',
      'Online Booking Agent',
      '+6 Field Ops Agents (Dispatch, Route, ETA, Check-in, Quote, Invoice)',
      'Field Ops Console',
      'Up to 10 employees',
    ],
    agentCount: 10,
    consoleCount: 2,
  },
  COMMAND: {
    tier: 'COMMAND',
    label: 'Command',
    price: '$1,497/mo',
    description: 'Complete business automation with analytics, marketing, and white-label',
    keyFeatures: [
      'All Multi-Track features',
      '+9 Agents (Admin, Inventory, Warranty, Campaign, Lead, Promo, Social Content, Social Scheduler, Social Analytics)',
      'All 6 Control Centers',
      'White-Label Branding',
      'Unlimited employees',
    ],
    agentCount: 19,
    consoleCount: 6,
  },
};

// Section labels for progress display
export const SECTION_ORDER = [
  'Lead Intake & Response',
  'Scheduling & Booking',
  'Team & Field Operations',
  'Communication Channels',
  'Customer Retention & Growth',
  'Business Intelligence & Branding',
];
