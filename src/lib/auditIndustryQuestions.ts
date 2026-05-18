import type { AuditQuestion } from '@/components/audit/types';

// Question buckets keyed by canonical industry "family". Each industry id maps
// to exactly one bucket. All scores use the same TierScores shape so the
// tier-fit math in AgentOpportunityAudit keeps working.

type Bucket =
  | 'field_trades'
  | 'real_estate'
  | 'restaurants'
  | 'beauty_wellness'
  | 'personal_assistant'
  | 'healthcare'
  | 'other';

const INDUSTRY_TO_BUCKET: Record<string, Bucket> = {
  // Field / trades
  hvac: 'field_trades',
  plumbing: 'field_trades',
  electrical: 'field_trades',
  solar_energy: 'field_trades',
  solar: 'field_trades',
  roofing: 'field_trades',
  fencing_decking: 'field_trades',
  fencing: 'field_trades',
  landscape_trees: 'field_trades',
  landscape: 'field_trades',
  pool_spa: 'field_trades',
  pest_control: 'field_trades',
  appliance_repair: 'field_trades',
  handyman_cleaning: 'field_trades',
  handyman: 'field_trades',
  construction: 'field_trades',
  auto_care: 'field_trades',
  security_systems: 'field_trades',

  real_estate: 'real_estate',
  restaurants: 'restaurants',
  beauty_wellness: 'beauty_wellness',
  personal_assistant: 'personal_assistant',

  home_health: 'healthcare',
  physical_therapy: 'healthcare',
  occupational_therapy: 'healthcare',
  hospice: 'healthcare',

  other: 'other',
};

const FIELD_TRADES: AuditQuestion[] = [
  {
    id: 'service_location',
    question: 'Where do you mostly deliver your services?',
    description: 'Drives whether you need On The Way / Field Ops tools',
    section: 'Industry Specifics',
    options: [
      { label: 'At my shop / yard only', tierScores: { CORE: 80, BOOST: 60, PRO: 40, ELITE: 30 } },
      { label: 'At customer locations (field service)', tierScores: { CORE: 35, BOOST: 90, PRO: 95, ELITE: 90 } },
      { label: 'Mix of both', tierScores: { CORE: 50, BOOST: 85, PRO: 85, ELITE: 80 } },
    ],
  },
  {
    id: 'dispatch_routing',
    question: 'How do you dispatch and route your team today?',
    description: 'On The Way (Boost+) handles smart assignment + routing',
    section: 'Industry Specifics',
    options: [
      { label: 'Manual assignment based on availability', tierScores: { CORE: 50, BOOST: 90, PRO: 85, ELITE: 80 } },
      { label: 'Basic scheduling tools, some optimization', tierScores: { CORE: 50, BOOST: 75, PRO: 65, ELITE: 60 } },
      { label: 'First-available, no route optimization', tierScores: { CORE: 50, BOOST: 92, PRO: 95, ELITE: 90 } },
      { label: 'Solo operator — I run all jobs myself', tierScores: { CORE: 90, BOOST: 60, PRO: 40, ELITE: 25 } },
    ],
  },
  {
    id: 'customer_eta',
    question: 'How do customers know when you are on the way?',
    description: 'On The Way sends automated ETA texts on Boost+',
    section: 'Industry Specifics',
    options: [
      { label: 'Automated ETA texts already', tierScores: { CORE: 55, BOOST: 60, PRO: 52, ELITE: 50 } },
      { label: 'We call when we leave for the job', tierScores: { CORE: 50, BOOST: 85, PRO: 78, ELITE: 70 } },
      { label: 'They wait — no ETA communication', tierScores: { CORE: 55, BOOST: 92, PRO: 95, ELITE: 85 } },
    ],
  },
  {
    id: 'quoting_process',
    question: 'How do you create quotes / estimates for customers?',
    description: 'Billing (Elite) includes AI Quoting + Invoicing',
    section: 'Industry Specifics',
    options: [
      { label: 'Fixed pricing — no quotes needed', tierScores: { CORE: 80, BOOST: 70, PRO: 45, ELITE: 30 } },
      { label: 'Professional quoting software', tierScores: { CORE: 45, BOOST: 55, PRO: 55, ELITE: 55 } },
      { label: 'Manual calculation, paper / basic docs', tierScores: { CORE: 50, BOOST: 80, PRO: 90, ELITE: 80 } },
      { label: 'Field techs need to quote on-site', tierScores: { CORE: 40, BOOST: 85, PRO: 95, ELITE: 90 } },
    ],
  },
  {
    id: 'inventory_tracking',
    question: 'Do you track inventory or parts / materials?',
    description: 'Billing (Elite) includes Inventory Management',
    section: 'Industry Specifics',
    options: [
      { label: 'No inventory to track', tierScores: { CORE: 80, BOOST: 70, PRO: 50, ELITE: 35 } },
      { label: 'Yes — already on inventory software', tierScores: { CORE: 45, BOOST: 55, PRO: 58, ELITE: 60 } },
      { label: 'Spreadsheets or manual tracking', tierScores: { CORE: 40, BOOST: 65, PRO: 80, ELITE: 90 } },
      { label: 'Need better inventory management', tierScores: { CORE: 35, BOOST: 60, PRO: 82, ELITE: 95 } },
    ],
  },
  {
    id: 'phone_setup',
    question: "What's your business phone setup today?",
    description: 'We will tailor your phone setup steps in your PDF',
    section: 'Setup & Integrations',
    options: [
      { label: 'Port my existing business number in', tierScores: { CORE: 85, BOOST: 85, PRO: 82, ELITE: 80 } },
      { label: 'Get me a new business number', tierScores: { CORE: 90, BOOST: 85, PRO: 80, ELITE: 78 } },
      { label: 'Forward calls from my current line', tierScores: { CORE: 80, BOOST: 80, PRO: 78, ELITE: 75 } },
      { label: 'No business line yet — just my cell', tierScores: { CORE: 92, BOOST: 88, PRO: 80, ELITE: 75 } },
    ],
  },
];

const REAL_ESTATE: AuditQuestion[] = [
  {
    id: 're_listing_volume',
    question: 'How many active listings do you typically manage?',
    description: 'Listing volume shapes follow-up + marketing needs',
    section: 'Industry Specifics',
    options: [
      { label: '1-3 listings', tierScores: { CORE: 90, BOOST: 70, PRO: 45, ELITE: 30 } },
      { label: '4-10 listings', tierScores: { CORE: 70, BOOST: 85, PRO: 75, ELITE: 55 } },
      { label: '11-25 listings', tierScores: { CORE: 40, BOOST: 75, PRO: 90, ELITE: 80 } },
      { label: '25+ listings / team brokerage', tierScores: { CORE: 20, BOOST: 55, PRO: 80, ELITE: 95 } },
    ],
  },
  {
    id: 're_open_house_followup',
    question: 'How do you follow up with open house visitors?',
    description: 'Front Desk auto-texts every signed-in visitor',
    section: 'Industry Specifics',
    options: [
      { label: 'Automated drip campaigns already', tierScores: { CORE: 50, BOOST: 60, PRO: 70, ELITE: 75 } },
      { label: 'I personally text each visitor', tierScores: { CORE: 70, BOOST: 80, PRO: 80, ELITE: 75 } },
      { label: 'Manual emails after a few days', tierScores: { CORE: 85, BOOST: 85, PRO: 85, ELITE: 80 } },
      { label: 'We rarely follow up — leads go cold', tierScores: { CORE: 80, BOOST: 90, PRO: 95, ELITE: 90 } },
    ],
  },
  {
    id: 're_showing_scheduling',
    question: 'How are property showings scheduled today?',
    description: 'Front Desk handles 24/7 showing requests',
    section: 'Industry Specifics',
    options: [
      { label: 'ShowingTime / similar scheduler', tierScores: { CORE: 60, BOOST: 65, PRO: 70, ELITE: 70 } },
      { label: 'Phone tag with buyer agents', tierScores: { CORE: 90, BOOST: 88, PRO: 85, ELITE: 80 } },
      { label: 'Manual back-and-forth texts / emails', tierScores: { CORE: 85, BOOST: 85, PRO: 82, ELITE: 78 } },
    ],
  },
  {
    id: 're_commission_pipeline',
    question: 'How do you track deals / commissions in your pipeline?',
    description: 'Reports gives you a live pipeline view',
    section: 'Industry Specifics',
    options: [
      { label: 'CRM / transaction software', tierScores: { CORE: 55, BOOST: 65, PRO: 75, ELITE: 80 } },
      { label: 'Spreadsheet or notes', tierScores: { CORE: 70, BOOST: 80, PRO: 88, ELITE: 90 } },
      { label: 'In my head — small enough to track', tierScores: { CORE: 85, BOOST: 75, PRO: 65, ELITE: 55 } },
    ],
  },
  {
    id: 're_lead_source_mix',
    question: 'Where do most of your leads come from?',
    description: 'Drives which Marketing channels to prioritize',
    section: 'Industry Specifics',
    options: [
      { label: 'Mostly referrals / sphere', tierScores: { CORE: 80, BOOST: 75, PRO: 75, ELITE: 70 } },
      { label: 'Zillow / portals + ads', tierScores: { CORE: 60, BOOST: 70, PRO: 88, ELITE: 90 } },
      { label: 'Social media + content', tierScores: { CORE: 65, BOOST: 70, PRO: 90, ELITE: 85 } },
      { label: 'Mostly cold outreach / door knocking', tierScores: { CORE: 70, BOOST: 75, PRO: 88, ELITE: 92 } },
    ],
  },
];

const RESTAURANTS: AuditQuestion[] = [
  {
    id: 'rest_reservation_volume',
    question: 'How many reservations / table requests do you handle weekly?',
    description: 'Higher volume gets more from automated reservations',
    section: 'Industry Specifics',
    options: [
      { label: 'Walk-in only / no reservations', tierScores: { CORE: 95, BOOST: 60, PRO: 35, ELITE: 25 } },
      { label: '1-25 reservations / week', tierScores: { CORE: 90, BOOST: 65, PRO: 45, ELITE: 30 } },
      { label: '25-100 reservations / week', tierScores: { CORE: 85, BOOST: 70, PRO: 60, ELITE: 45 } },
      { label: '100+ reservations / week', tierScores: { CORE: 70, BOOST: 75, PRO: 80, ELITE: 70 } },
    ],
  },
  {
    id: 'rest_takeout_delivery_mix',
    question: "What's your takeout / delivery mix?",
    description: 'Smart Link routes online orders to your existing apps',
    section: 'Industry Specifics',
    options: [
      { label: 'Dine-in only', tierScores: { CORE: 90, BOOST: 70, PRO: 45, ELITE: 30 } },
      { label: 'Some takeout / a 3rd-party app or two', tierScores: { CORE: 90, BOOST: 70, PRO: 55, ELITE: 40 } },
      { label: 'Heavy takeout + multiple delivery apps', tierScores: { CORE: 80, BOOST: 75, PRO: 70, ELITE: 60 } },
    ],
  },
  {
    id: 'rest_online_ordering',
    question: 'How do customers order online today?',
    section: 'Industry Specifics',
    options: [
      { label: 'Our own online ordering system', tierScores: { CORE: 75, BOOST: 60, PRO: 55, ELITE: 50 } },
      { label: 'Only 3rd-party (DoorDash / UberEats / etc.)', tierScores: { CORE: 90, BOOST: 70, PRO: 55, ELITE: 45 } },
      { label: 'Phone only — no online ordering', tierScores: { CORE: 95, BOOST: 75, PRO: 55, ELITE: 45 } },
    ],
  },
  {
    id: 'rest_review_volume',
    question: 'How do you handle Google / Yelp reviews?',
    description: 'Front Desk auto-asks every guest for a review',
    section: 'Industry Specifics',
    options: [
      { label: 'Reply quickly, ask actively', tierScores: { CORE: 60, BOOST: 55, PRO: 55, ELITE: 50 } },
      { label: 'We reply when we can', tierScores: { CORE: 80, BOOST: 75, PRO: 70, ELITE: 65 } },
      { label: 'Rarely reply, never ask', tierScores: { CORE: 90, BOOST: 80, PRO: 75, ELITE: 70 } },
    ],
  },
  {
    id: 'rest_waitlist_management',
    question: 'How do you manage the waitlist on busy nights?',
    section: 'Industry Specifics',
    options: [
      { label: 'Dedicated waitlist app (Yelp Waitlist, etc.)', tierScores: { CORE: 70, BOOST: 65, PRO: 60, ELITE: 55 } },
      { label: 'Pen & paper / verbal estimates', tierScores: { CORE: 90, BOOST: 75, PRO: 60, ELITE: 50 } },
      { label: 'No waitlist — just first come first served', tierScores: { CORE: 85, BOOST: 65, PRO: 50, ELITE: 40 } },
    ],
  },
];

const BEAUTY_WELLNESS: AuditQuestion[] = [
  {
    id: 'bw_booking_density',
    question: 'How full is your appointment book on average?',
    section: 'Industry Specifics',
    options: [
      { label: 'Booked solid — need to grow the team', tierScores: { CORE: 60, BOOST: 70, PRO: 85, ELITE: 90 } },
      { label: 'Mostly full with some gaps', tierScores: { CORE: 80, BOOST: 80, PRO: 75, ELITE: 65 } },
      { label: 'Half full — actively need more clients', tierScores: { CORE: 90, BOOST: 80, PRO: 80, ELITE: 70 } },
      { label: 'Just starting / building a book', tierScores: { CORE: 95, BOOST: 70, PRO: 55, ELITE: 40 } },
    ],
  },
  {
    id: 'bw_rebooking',
    question: 'Do you re-book clients before they leave?',
    description: 'Front Desk sends auto rebook nudges on every tier',
    section: 'Industry Specifics',
    options: [
      { label: 'Yes, every visit', tierScores: { CORE: 60, BOOST: 60, PRO: 55, ELITE: 50 } },
      { label: 'Sometimes — depends on the client', tierScores: { CORE: 85, BOOST: 80, PRO: 70, ELITE: 65 } },
      { label: 'Rarely — they book again when they need us', tierScores: { CORE: 95, BOOST: 85, PRO: 75, ELITE: 70 } },
    ],
  },
  {
    id: 'bw_no_show_rate',
    question: 'About what is your no-show / late-cancel rate?',
    description: 'Reminders + deposits cut no-shows dramatically',
    section: 'Industry Specifics',
    options: [
      { label: 'Under 5%', tierScores: { CORE: 60, BOOST: 60, PRO: 55, ELITE: 50 } },
      { label: '5-15%', tierScores: { CORE: 90, BOOST: 80, PRO: 75, ELITE: 70 } },
      { label: '15%+', tierScores: { CORE: 95, BOOST: 90, PRO: 85, ELITE: 80 } },
    ],
  },
  {
    id: 'bw_intake_forms',
    question: 'How do you collect client intake forms / consent?',
    section: 'Industry Specifics',
    options: [
      { label: 'Digital forms sent before the visit', tierScores: { CORE: 60, BOOST: 60, PRO: 60, ELITE: 60 } },
      { label: 'Paper forms at the front desk', tierScores: { CORE: 90, BOOST: 80, PRO: 75, ELITE: 70 } },
      { label: 'No formal intake', tierScores: { CORE: 95, BOOST: 85, PRO: 80, ELITE: 75 } },
    ],
  },
  {
    id: 'bw_retail_inventory',
    question: 'Do you sell retail products on top of services?',
    description: 'Billing (Elite) adds inventory + retail',
    section: 'Industry Specifics',
    options: [
      { label: 'Yes, retail is a big part of revenue', tierScores: { CORE: 50, BOOST: 65, PRO: 80, ELITE: 95 } },
      { label: 'A small retail line', tierScores: { CORE: 75, BOOST: 75, PRO: 75, ELITE: 80 } },
      { label: 'No retail — services only', tierScores: { CORE: 90, BOOST: 80, PRO: 70, ELITE: 55 } },
    ],
  },
];

const PERSONAL_ASSISTANT: AuditQuestion[] = [
  {
    id: 'pa_client_count',
    question: 'How many active clients are you serving?',
    section: 'Industry Specifics',
    options: [
      { label: '1-3 retainer clients', tierScores: { CORE: 95, BOOST: 60, PRO: 35, ELITE: 25 } },
      { label: '4-10 clients', tierScores: { CORE: 85, BOOST: 80, PRO: 65, ELITE: 50 } },
      { label: '10-25 clients / running an agency', tierScores: { CORE: 40, BOOST: 75, PRO: 90, ELITE: 85 } },
      { label: '25+ clients / agency at scale', tierScores: { CORE: 20, BOOST: 55, PRO: 80, ELITE: 95 } },
    ],
  },
  {
    id: 'pa_engagement_model',
    question: 'How do you usually engage with clients?',
    section: 'Industry Specifics',
    options: [
      { label: 'Monthly retainers', tierScores: { CORE: 80, BOOST: 80, PRO: 75, ELITE: 75 } },
      { label: 'Hourly / per-task', tierScores: { CORE: 85, BOOST: 80, PRO: 75, ELITE: 70 } },
      { label: 'A mix of both', tierScores: { CORE: 80, BOOST: 85, PRO: 85, ELITE: 80 } },
    ],
  },
  {
    id: 'pa_task_channels',
    question: 'Where do client requests come in from?',
    section: 'Industry Specifics',
    options: [
      { label: 'Mostly email / one channel', tierScores: { CORE: 80, BOOST: 70, PRO: 60, ELITE: 55 } },
      { label: 'Email + text + chat — all over the place', tierScores: { CORE: 80, BOOST: 85, PRO: 90, ELITE: 90 } },
      { label: 'A dedicated task tool (Asana / ClickUp / etc.)', tierScores: { CORE: 70, BOOST: 70, PRO: 75, ELITE: 75 } },
    ],
  },
  {
    id: 'pa_calendar_integration',
    question: 'Do you manage client calendars?',
    section: 'Industry Specifics',
    options: [
      { label: 'Yes, for most clients', tierScores: { CORE: 65, BOOST: 75, PRO: 80, ELITE: 80 } },
      { label: 'For a few clients', tierScores: { CORE: 75, BOOST: 75, PRO: 75, ELITE: 70 } },
      { label: 'No — tasks only, no calendar work', tierScores: { CORE: 85, BOOST: 75, PRO: 65, ELITE: 55 } },
    ],
  },
];

const HEALTHCARE: AuditQuestion[] = [
  {
    id: 'hc_visit_volume',
    question: 'About how many visits / sessions do you run per week?',
    section: 'Industry Specifics',
    options: [
      { label: 'Under 20', tierScores: { CORE: 90, BOOST: 70, PRO: 45, ELITE: 30 } },
      { label: '20-50', tierScores: { CORE: 70, BOOST: 85, PRO: 75, ELITE: 60 } },
      { label: '50-150', tierScores: { CORE: 40, BOOST: 70, PRO: 90, ELITE: 80 } },
      { label: '150+ / multi-clinician', tierScores: { CORE: 20, BOOST: 55, PRO: 80, ELITE: 95 } },
    ],
  },
  {
    id: 'hc_intake_documentation',
    question: 'How do you collect intake + consent documentation?',
    description: 'Front Desk + Smart Forms handle digital intake',
    section: 'Industry Specifics',
    options: [
      { label: 'Digital forms via our EHR / portal', tierScores: { CORE: 60, BOOST: 65, PRO: 70, ELITE: 75 } },
      { label: 'Paper forms at first visit', tierScores: { CORE: 90, BOOST: 85, PRO: 80, ELITE: 75 } },
      { label: 'Mix of digital + paper', tierScores: { CORE: 85, BOOST: 85, PRO: 82, ELITE: 78 } },
    ],
  },
  {
    id: 'hc_scheduling_complexity',
    question: 'How complex is your scheduling?',
    section: 'Industry Specifics',
    options: [
      { label: 'Simple — single clinician / single location', tierScores: { CORE: 90, BOOST: 70, PRO: 50, ELITE: 35 } },
      { label: 'Multiple clinicians, varying durations', tierScores: { CORE: 50, BOOST: 80, PRO: 90, ELITE: 80 } },
      { label: 'In-home visits + route planning', tierScores: { CORE: 30, BOOST: 90, PRO: 90, ELITE: 85 } },
    ],
  },
  {
    id: 'hc_referral_followup',
    question: 'How do you handle referral / new-patient follow-up?',
    section: 'Industry Specifics',
    options: [
      { label: 'Auto-respond + schedule fast', tierScores: { CORE: 60, BOOST: 65, PRO: 70, ELITE: 75 } },
      { label: 'Manual call-back from front desk', tierScores: { CORE: 85, BOOST: 85, PRO: 80, ELITE: 75 } },
      { label: 'Often falls through the cracks', tierScores: { CORE: 85, BOOST: 90, PRO: 92, ELITE: 90 } },
    ],
  },
  {
    id: 'hc_compliance_followup',
    question: 'Do you have automated post-visit follow-up / outcome surveys?',
    section: 'Industry Specifics',
    options: [
      { label: 'Yes, fully automated', tierScores: { CORE: 55, BOOST: 60, PRO: 65, ELITE: 70 } },
      { label: 'Manual phone calls when we can', tierScores: { CORE: 80, BOOST: 80, PRO: 80, ELITE: 80 } },
      { label: 'No structured follow-up', tierScores: { CORE: 85, BOOST: 85, PRO: 88, ELITE: 90 } },
    ],
  },
];

const OTHER_FALLBACK: AuditQuestion[] = [
  {
    id: 'other_service_location',
    question: 'Where do you mostly deliver your services?',
    section: 'Industry Specifics',
    options: [
      { label: 'At my business location only', tierScores: { CORE: 95, BOOST: 75, PRO: 45, ELITE: 30 } },
      { label: 'At customer locations', tierScores: { CORE: 35, BOOST: 90, PRO: 95, ELITE: 90 } },
      { label: 'Mix of both', tierScores: { CORE: 60, BOOST: 85, PRO: 85, ELITE: 80 } },
      { label: 'Virtual / remote', tierScores: { CORE: 95, BOOST: 65, PRO: 45, ELITE: 35 } },
    ],
  },
  {
    id: 'other_quoting',
    question: 'How do you quote / price work today?',
    section: 'Industry Specifics',
    options: [
      { label: 'Fixed pricing', tierScores: { CORE: 90, BOOST: 70, PRO: 45, ELITE: 30 } },
      { label: 'Custom quotes per job', tierScores: { CORE: 50, BOOST: 80, PRO: 90, ELITE: 90 } },
      { label: 'Subscriptions / retainers', tierScores: { CORE: 75, BOOST: 75, PRO: 75, ELITE: 70 } },
    ],
  },
  {
    id: 'other_phone_setup',
    question: "What's your business phone setup today?",
    section: 'Setup & Integrations',
    options: [
      { label: 'Port my existing business number in', tierScores: { CORE: 85, BOOST: 85, PRO: 82, ELITE: 80 } },
      { label: 'Get me a new business number', tierScores: { CORE: 90, BOOST: 85, PRO: 80, ELITE: 78 } },
      { label: 'Forward calls from my current line', tierScores: { CORE: 80, BOOST: 80, PRO: 78, ELITE: 75 } },
      { label: 'No business line yet — just my cell', tierScores: { CORE: 92, BOOST: 88, PRO: 80, ELITE: 75 } },
    ],
  },
];

const BUCKET_QUESTIONS: Record<Bucket, AuditQuestion[]> = {
  field_trades: FIELD_TRADES,
  real_estate: REAL_ESTATE,
  restaurants: RESTAURANTS,
  beauty_wellness: BEAUTY_WELLNESS,
  personal_assistant: PERSONAL_ASSISTANT,
  healthcare: HEALTHCARE,
  other: OTHER_FALLBACK,
};

export function getQuestionsForIndustry(industryId: string | null | undefined): AuditQuestion[] {
  if (!industryId) return OTHER_FALLBACK;
  const bucket = INDUSTRY_TO_BUCKET[industryId] ?? 'other';
  return BUCKET_QUESTIONS[bucket];
}

export function getIndustryBucket(industryId: string | null | undefined): Bucket {
  if (!industryId) return 'other';
  return INDUSTRY_TO_BUCKET[industryId] ?? 'other';
}