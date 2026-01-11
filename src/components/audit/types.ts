export type ScoreCategory = 'FDA' | 'SA' | 'RA' | 'KOA' | 'FOA' | 'CA' | 'FUA' | 'BIA';

export interface ScoreOption {
  label: string;
  scores: Partial<Record<ScoreCategory, number>>;
}

export interface AuditQuestion {
  id: string;
  question: string;
  description?: string;
  section?: string;
  options: ScoreOption[];
}

export interface Scores {
  FDA: number;
  SA: number;
  RA: number;
  KOA: number;
  FOA: number;
  CA: number;
  FUA: number;
  BIA: number;
}

export interface AgentRecommendation {
  category: ScoreCategory;
  name: string;
  title: string;
  why: string;
  impact: string;
  icon: string;
  threshold: number;
}

export const QUESTIONS: AuditQuestion[] = [
  // === FRONT DESK & LEAD CAPTURE ===
  {
    id: 'after-hours',
    section: 'Front Desk & Lead Capture',
    question: 'How do you handle leads after 6 PM?',
    description: 'Think about what happens when potential customers try to reach you outside business hours.',
    options: [
      { label: "We don't - calls go unanswered", scores: { FDA: 20 } },
      { label: 'Voicemail with next-day callback', scores: { FDA: 10 } },
      { label: 'We have after-hours staff', scores: { FDA: 0 } },
      { label: 'We use an answering service', scores: { FDA: 5 } }
    ]
  },
  {
    id: 'response-time',
    section: 'Front Desk & Lead Capture',
    question: 'What is your average web lead response time?',
    description: 'From when a lead submits a form to when they receive a response.',
    options: [
      { label: 'Under 1 hour', scores: { FDA: 0 } },
      { label: '1-4 hours', scores: { FDA: 15 } },
      { label: 'Same business day', scores: { FDA: 20 } },
      { label: 'Over 24 hours', scores: { FDA: 25 } }
    ]
  },

  // === SCHEDULING & BOOKING ===
  {
    id: 'booking-method',
    section: 'Scheduling & Booking',
    question: 'How do customers book appointments?',
    description: 'Consider the typical journey from first contact to confirmed appointment.',
    options: [
      { label: 'Phone only - we play phone tag', scores: { SA: 20 } },
      { label: 'Email back-and-forth', scores: { SA: 15 } },
      { label: 'Basic online form (we call back)', scores: { SA: 10 } },
      { label: 'Self-service online booking', scores: { SA: 0 } }
    ]
  },

  // === FIELD OPERATIONS ===
  {
    id: 'technician-dispatch',
    section: 'Field Operations',
    question: 'How do you currently assign jobs to technicians?',
    description: 'Consider your dispatch and routing process for field staff.',
    options: [
      { label: 'First available - no optimization', scores: { FOA: 25 } },
      { label: 'Manually based on location', scores: { FOA: 15 } },
      { label: 'We use basic dispatch software', scores: { FOA: 10 } },
      { label: 'Smart routing with skills matching', scores: { FOA: 0 } }
    ]
  },
  {
    id: 'customer-eta',
    section: 'Field Operations',
    question: 'How do you communicate arrival times to customers?',
    description: 'Think about how customers know when to expect your team.',
    options: [
      { label: "We don't - they wait and wonder", scores: { FOA: 20 } },
      { label: 'We call when leaving previous job', scores: { FOA: 10 } },
      { label: 'Automated text when en route', scores: { FOA: 5 } },
      { label: 'Real-time GPS tracking for customers', scores: { FOA: 0 } }
    ]
  },

  // === COMMUNICATION CHANNELS ===
  {
    id: 'missed-calls',
    section: 'Communication Channels',
    question: 'How many calls does your business miss per week?',
    description: 'Estimate calls that go to voicemail or are abandoned.',
    options: [
      { label: '10+ calls missed weekly', scores: { CA: 25 } },
      { label: '5-10 missed calls', scores: { CA: 15 } },
      { label: '1-5 missed calls', scores: { CA: 10 } },
      { label: 'We rarely miss calls', scores: { CA: 0 } }
    ]
  },
  {
    id: 'contact-channels',
    section: 'Communication Channels',
    question: 'Which channels do customers use to reach you?',
    description: 'Consider all the ways customers try to contact your business.',
    options: [
      { label: 'Phone only', scores: { CA: 20 } },
      { label: 'Phone + email', scores: { CA: 15 } },
      { label: 'Phone, email, SMS', scores: { CA: 10 } },
      { label: 'All channels including web chat', scores: { CA: 0 } }
    ]
  },

  // === FOLLOW-UP & REVIEWS ===
  {
    id: 'appointment-reminders',
    section: 'Follow-up & Reviews',
    question: 'How do you remind customers about upcoming appointments?',
    description: 'Think about your process for reducing no-shows.',
    options: [
      { label: "We don't send reminders", scores: { FUA: 25, SA: 10 } },
      { label: 'Manual calls the day before', scores: { FUA: 15 } },
      { label: 'Automated email only', scores: { FUA: 10 } },
      { label: 'Multi-channel automated reminders', scores: { FUA: 0 } }
    ]
  },
  {
    id: 'review-collection',
    section: 'Follow-up & Reviews',
    question: 'How do you collect customer reviews after service?',
    description: 'Reviews are critical for local SEO and trust building.',
    options: [
      { label: "We don't actively collect reviews", scores: { FUA: 20 } },
      { label: 'Sometimes ask verbally', scores: { FUA: 15 } },
      { label: 'Email request after service', scores: { FUA: 10 } },
      { label: 'Automated multi-platform review requests', scores: { FUA: 0 } }
    ]
  },

  // === CUSTOMER REACTIVATION ===
  {
    id: 'dormant-database',
    section: 'Customer Reactivation',
    question: "How many past customers haven't been contacted in 6+ months?",
    description: 'Estimate the size of your "dormant" customer database.',
    options: [
      { label: 'Over 2,000 customers', scores: { RA: 35 } },
      { label: '500-2,000 customers', scores: { RA: 20 } },
      { label: '100-500 customers', scores: { RA: 10 } },
      { label: 'We actively re-engage everyone', scores: { RA: 0 } }
    ]
  },

  // === KNOWLEDGE & TRAINING ===
  {
    id: 'training-time',
    section: 'Knowledge & Training',
    question: 'How long does it take to train new staff on your processes?',
    description: 'Include time for them to learn SOPs, policies, and handle common situations independently.',
    options: [
      { label: 'Over 1 month', scores: { KOA: 25 } },
      { label: '2-4 weeks', scores: { KOA: 15 } },
      { label: '1-2 weeks', scores: { KOA: 5 } },
      { label: 'Under a week (we have documented SOPs)', scores: { KOA: 0 } }
    ]
  },

  // === BUSINESS INTELLIGENCE ===
  {
    id: 'performance-visibility',
    section: 'Business Intelligence',
    question: 'How do you track team/business performance metrics?',
    description: 'Consider how you measure and monitor KPIs.',
    options: [
      { label: 'Spreadsheets or gut feel', scores: { BIA: 25 } },
      { label: 'Basic reports from software', scores: { BIA: 15 } },
      { label: 'Weekly manual reporting', scores: { BIA: 10 } },
      { label: 'Real-time dashboards with KPIs', scores: { BIA: 0 } }
    ]
  },
  {
    id: 'revenue-forecasting',
    section: 'Business Intelligence',
    question: 'How do you forecast revenue and demand?',
    description: 'Think about how you plan for busy seasons and growth.',
    options: [
      { label: "We don't forecast - react as it comes", scores: { BIA: 20 } },
      { label: 'Simple historical comparisons', scores: { BIA: 15 } },
      { label: 'Quarterly planning with estimates', scores: { BIA: 10 } },
      { label: 'Data-driven forecasting models', scores: { BIA: 0 } }
    ]
  }
];

export const AGENT_RECOMMENDATIONS: AgentRecommendation[] = [
  {
    category: 'FDA',
    name: 'front-desk',
    title: '24/7 Front-Desk Agent',
    why: 'Your business is "leaking" leads during evenings and weekends. Speed-to-lead is critical—78% of customers buy from whoever responds first.',
    impact: 'This agent acts as a tireless receptionist, qualifying leads and answering FAQs instantly. It stops your competitors from stealing the "fastest finger" win.',
    icon: 'Headphones',
    threshold: 30
  },
  {
    category: 'SA',
    name: 'scheduler',
    title: 'Autonomous Scheduler',
    why: 'Manual booking is a massive administrative tax on your skilled labor. Phone tag wastes 2-3 hours per employee per week.',
    impact: 'This agent syncs with your calendar to handle scheduling autonomously. It eliminates double bookings and sends automated reminders to slash no-show rates by up to 40%.',
    icon: 'Calendar',
    threshold: 20
  },
  {
    category: 'RA',
    name: 'reactivation',
    title: 'Database Reactivation Agent',
    why: 'You are sitting on a "gold mine" of past customers that is currently dormant. It costs 5x more to acquire a new customer than retain an existing one.',
    impact: 'This agent sends personalized SMS/Email reach-outs to your existing database to book repeat service or seasonal maintenance, generating revenue without any new ad spend.',
    icon: 'Users',
    threshold: 25
  },
  {
    category: 'KOA',
    name: 'knowledge',
    title: 'Internal Knowledge Agent',
    why: 'Institutional knowledge is trapped in "heads" rather than a system, making scaling difficult and creating bottlenecks.',
    impact: 'A custom AI trained on your manuals. Staff can ask "How do I fix [X]?" or "What\'s our policy on [Y]?" and get instant, accurate answers—reducing manager interruptions by 60%.',
    icon: 'BookOpen',
    threshold: 20
  },
  {
    category: 'FOA',
    name: 'field-ops',
    title: 'Field Operations Suite',
    why: 'Inefficient dispatch and poor route planning cost you fuel, time, and customer satisfaction. Customers hate uncertainty about arrival times.',
    impact: 'Smart technician assignment based on location, skills, and workload. Real-time ETA updates keep customers informed and reduce "where are you?" calls by 80%.',
    icon: 'Truck',
    threshold: 30
  },
  {
    category: 'CA',
    name: 'multi-channel',
    title: 'Multi-Channel AI Hub',
    why: 'Every missed call is a lost opportunity. Customers expect to reach you on their preferred channel—not just phone.',
    impact: 'AI-powered voice, SMS, and chat agents that never miss a lead. Seamless handoffs between channels ensure no customer falls through the cracks.',
    icon: 'MessageSquare',
    threshold: 25
  },
  {
    category: 'FUA',
    name: 'follow-up',
    title: 'Follow-up & Review System',
    why: 'Without systematic follow-up, you lose repeat business and miss review opportunities. Reviews directly impact your Google ranking and conversion rates.',
    impact: 'Automated appointment reminders reduce no-shows by 40%. Post-service review requests boost your online reputation and generate 3x more reviews.',
    icon: 'Star',
    threshold: 20
  },
  {
    category: 'BIA',
    name: 'business-intel',
    title: 'Business Intelligence Engine',
    why: 'Flying blind without data leads to reactive decisions instead of proactive strategy. You can\'t improve what you don\'t measure.',
    impact: 'AI-powered dashboards surface insights automatically. Demand forecasting helps you staff appropriately and identify revenue opportunities before competitors.',
    icon: 'BarChart3',
    threshold: 25
  }
];

export const CATEGORY_LABELS: Record<ScoreCategory, string> = {
  FDA: 'Front-Desk Automation',
  SA: 'Scheduling Automation',
  RA: 'Reactivation Automation',
  KOA: 'Knowledge Automation',
  FOA: 'Field Operations',
  CA: 'Communication Channels',
  FUA: 'Follow-up & Reviews',
  BIA: 'Business Intelligence'
};

export const CATEGORY_MAX_SCORES: Record<ScoreCategory, number> = {
  FDA: 45,
  SA: 30,
  RA: 35,
  KOA: 25,
  FOA: 45,
  CA: 45,
  FUA: 45,
  BIA: 45
};
