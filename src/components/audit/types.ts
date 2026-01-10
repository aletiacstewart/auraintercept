export type ScoreCategory = 'FDA' | 'SA' | 'RA' | 'KOA';

export interface ScoreOption {
  label: string;
  scores: Partial<Record<ScoreCategory, number>>;
}

export interface AuditQuestion {
  id: string;
  question: string;
  description?: string;
  options: ScoreOption[];
}

export interface Scores {
  FDA: number;
  SA: number;
  RA: number;
  KOA: number;
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
  {
    id: 'after-hours',
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
    question: 'What is your average web lead response time?',
    description: 'From when a lead submits a form to when they receive a response.',
    options: [
      { label: 'Under 1 hour', scores: { FDA: 0 } },
      { label: '1-4 hours', scores: { FDA: 15 } },
      { label: 'Same business day', scores: { FDA: 20 } },
      { label: 'Over 24 hours', scores: { FDA: 25 } }
    ]
  },
  {
    id: 'booking-method',
    question: 'How do customers book appointments?',
    description: 'Consider the typical journey from first contact to confirmed appointment.',
    options: [
      { label: 'Phone only - we play phone tag', scores: { SA: 20 } },
      { label: 'Email back-and-forth', scores: { SA: 15 } },
      { label: 'Basic online form (we call back)', scores: { SA: 10 } },
      { label: 'Self-service online booking', scores: { SA: 0 } }
    ]
  },
  {
    id: 'training-time',
    question: 'How long does it take to train new staff on your processes?',
    description: 'Include time for them to learn SOPs, policies, and handle common situations independently.',
    options: [
      { label: 'Over 1 month', scores: { KOA: 25 } },
      { label: '2-4 weeks', scores: { KOA: 15 } },
      { label: '1-2 weeks', scores: { KOA: 5 } },
      { label: 'Under a week (we have documented SOPs)', scores: { KOA: 0 } }
    ]
  },
  {
    id: 'dormant-database',
    question: 'How many past customers haven\'t been contacted in 6+ months?',
    description: 'Estimate the size of your "dormant" customer database.',
    options: [
      { label: 'Over 2,000 customers', scores: { RA: 35 } },
      { label: '500-2,000 customers', scores: { RA: 20 } },
      { label: '100-500 customers', scores: { RA: 10 } },
      { label: 'We actively re-engage everyone', scores: { RA: 0 } }
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
  }
];

export const CATEGORY_LABELS: Record<ScoreCategory, string> = {
  FDA: 'Front-Desk Automation',
  SA: 'Scheduling Automation',
  RA: 'Reactivation Automation',
  KOA: 'Knowledge Automation'
};
