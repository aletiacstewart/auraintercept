import type { IndustryPack } from '@/hooks/useIndustryPack';

/**
 * Industry-aware "Example Prompts" used on the Help page per console.
 * Falls back to the generic config useCases when no override is defined.
 */

type ConsoleId =
  | 'customer_portal'
  | 'field_operations'
  | 'business_management'
  | 'marketing_sales'
  | 'social_media'
  | 'creative_web_presence'
  | 'analytics_reports'
  | 'ai_operatives_hub';

const HEALTHCARE_SHARED: Partial<Record<ConsoleId, string[]>> = {
  customer_portal: [
    '"What are your office hours?"',
    '"What types of visits do you offer?"',
    '"Book my next appointment"',
    '"I need to reschedule my visit"',
    '"Do you accept my insurance?"',
    '"What\'s the status of my appointment?"',
    '"I\'d like to speak with the front desk"',
  ],
  marketing_sales: [
    '"Send a recall reminder to lapsed patients"',
    '"Create a new-patient welcome sequence"',
    '"Send appointment confirmations for tomorrow"',
    '"Win back patients who haven\'t booked in 6 months"',
  ],
  business_management: [
    '"Schedule a follow-up visit for next week"',
    '"Pull up the patient\'s upcoming appointments"',
    '"Email the front desk to verify insurance"',
    '"Add a new patient record"',
  ],
  analytics_reports: [
    '"How many no-shows this month?"',
    '"Show recall reminder performance"',
    '"What\'s our booking conversion rate?"',
    '"Export this month\'s appointments"',
  ],
};

const HEALTHCARE_FIELD_OPS = [
  '"Pull up today\'s patient schedule"',
  '"Mark patient as checked in"',
  '"Update visit status to in-progress"',
  '"Complete this visit and notify the patient"',
  '"Show me the next patient on the schedule"',
];

const HEALTHCARE_SOCIAL = [
  '"Post a new-patient welcome on Facebook"',
  '"Share a wellness tip on Instagram"',
  '"Schedule a recall reminder post for next week"',
  '"Generate a Google My Business update"',
];

const HEALTHCARE_CREATIVE = [
  '"Write a blog post about preventive care"',
  '"Update the website with our new hours"',
  '"Generate a patient newsletter"',
  '"Refresh the homepage hero copy"',
];

const HEALTHCARE_OPERATIVES = [
  '"Show me which agents are active"',
  '"Enable the recall reminder agent"',
  '"Run a test on the booking agent"',
  '"View this week\'s agent activity"',
];

// Apply to every healthcare console fallthrough
HEALTHCARE_SHARED.field_operations = HEALTHCARE_FIELD_OPS;
HEALTHCARE_SHARED.social_media = HEALTHCARE_SOCIAL;
HEALTHCARE_SHARED.creative_web_presence = HEALTHCARE_CREATIVE;
HEALTHCARE_SHARED.ai_operatives_hub = HEALTHCARE_OPERATIVES;

const BY_INDUSTRY: Record<string, Partial<Record<ConsoleId, string[]>>> = {
  dental: {
    ...HEALTHCARE_SHARED,
    customer_portal: [
      '"What are your office hours?"',
      '"Book a cleaning"',
      '"I need to reschedule my dental visit"',
      '"Do you accept my dental insurance?"',
      '"How much is a whitening treatment?"',
      '"What\'s the status of my appointment?"',
    ],
  },
  chiropractic: {
    ...HEALTHCARE_SHARED,
    customer_portal: [
      '"Book my next adjustment"',
      '"What are your office hours?"',
      '"Set up a recurring weekly appointment"',
      '"Do you accept my insurance?"',
      '"I need to reschedule"',
    ],
  },
  medical_office: {
    ...HEALTHCARE_SHARED,
    customer_portal: [
      '"Book my annual physical"',
      '"What are your office hours?"',
      '"I need to reschedule my visit"',
      '"Do you accept my insurance?"',
      '"What\'s the status of my appointment?"',
      '"I\'d like to talk to the front desk"',
    ],
  },
  veterinary: {
    ...HEALTHCARE_SHARED,
    customer_portal: [
      '"Book a wellness exam for my dog"',
      '"What are your clinic hours?"',
      '"My pet needs a vaccine update"',
      '"How much is a dental cleaning for cats?"',
      '"I need to reschedule my pet\'s visit"',
      '"What\'s the status of my appointment?"',
    ],
  },
  physical_therapy: {
    ...HEALTHCARE_SHARED,
    customer_portal: [
      '"Book my next therapy session"',
      '"Set up a recurring weekly slot"',
      '"What are your hours?"',
      '"Do you accept my insurance?"',
      '"I need to reschedule"',
    ],
  },
  optometry: {
    ...HEALTHCARE_SHARED,
    customer_portal: [
      '"Book my annual eye exam"',
      '"What are your hours?"',
      '"Do you accept VSP / EyeMed?"',
      '"I\'m due for a contact lens fitting"',
      '"I need to reschedule my exam"',
    ],
  },
  real_estate: {
    customer_portal: [
      '"Book a showing for tomorrow"',
      '"What listings do you have under $400k?"',
      '"I\'d like to schedule a buyer consult"',
      '"What\'s the status of my offer?"',
      '"I need to reschedule a showing"',
    ],
  },
  restaurants: {
    customer_portal: [
      '"Make a reservation for 4 at 7pm"',
      '"What are your hours?"',
      '"Do you have outdoor seating?"',
      '"I need to change my reservation"',
      '"What\'s on the menu tonight?"',
    ],
  },
  beauty_wellness: {
    customer_portal: [
      '"Book a haircut tomorrow at 2pm"',
      '"What services do you offer?"',
      '"How much is a color treatment?"',
      '"I need to reschedule"',
      '"What are your hours?"',
    ],
  },
  personal_assistant: {
    customer_portal: [
      '"Book a strategy call"',
      '"What services do you offer?"',
      '"What are your hours?"',
      '"I need to reschedule"',
    ],
  },
};

export function getIndustryUseCases(
  consoleId: string,
  pack: IndustryPack | null | undefined,
  fallback: string[],
): string[] {
  if (!pack) return fallback;
  const overrides = BY_INDUSTRY[pack.industry_id];
  if (overrides && overrides[consoleId as ConsoleId]) {
    return overrides[consoleId as ConsoleId]!;
  }
  return fallback;
}