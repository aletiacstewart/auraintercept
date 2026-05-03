import type { IndustryPack } from '@/hooks/useIndustryPack';
import type { ConsoleHelpConfig } from './helpContentConfig';

/**
 * Industry-aware overrides for Help page console cards (description, features,
 * tabs). Falls back to the generic (trades-flavored) config when no override
 * matches.
 *
 * Resolution order: industry_id > cluster > generic.
 */

type ConsoleOverride = Partial<Pick<ConsoleHelpConfig, 'description' | 'tabs'>> & {
  features?: string[];
};

type ConsoleOverrideMap = Partial<Record<string, ConsoleOverride>>;

const HEALTHCARE_BASE: ConsoleOverrideMap = {
  customer_portal: {
    description:
      'AI-powered patient engagement hub with chat, voice, automated scheduling, recall reminders, and review collection — all in one Customer Journey Agent.',
    tabs: ['Chat', 'Voice', 'Visit Types', 'Hours', 'Insurance', 'Track', 'Billing'],
    features: [
      'Message Aura (Text) — patients ask questions and book online',
      'Talk to Aura (Voice) — voice booking and front-desk overflow',
      'Voice Reminders for upcoming visits',
      'Answer questions using your Knowledge Base',
      'Automated recall and follow-up sequences via Email/SMS',
      'Review collection (Google / Yelp / Facebook)',
      'Visit catalog with general pricing or "Contact for pricing"',
      'Office hours display',
      'Online appointment booking via AI chat',
      'Visit tracking and status updates',
      'Insurance verification email handoff to the front desk',
    ],
  },
  field_operations: {
    description:
      'Front-desk / provider console for managing the day\'s patient schedule, check-ins, and visit status.',
    tabs: ['Today\'s Schedule', 'Check In', 'Update Status', 'Insurance Note', 'Complete Visit', 'Contact Front Desk'],
    features: [
      'View today\'s patient schedule at a glance',
      'One-tap patient check-in',
      'Update visit status (in-room, in-progress, complete)',
      'Send "ready for you" notifications to waiting patients',
      'Quick insurance-verification handoff to the front desk',
      'Complete visit and trigger recall scheduling',
      'Patient lookup by name or phone',
    ],
  },
  business_management: {
    description:
      'Front-office command center powered by Admin Agent + Business Finance Agent — patient records, scheduling, billing handoff, and supplies.',
    tabs: ['Quote', 'Invoice', 'New Patient', 'Appointments', 'Supplies', 'Staff', 'Patients'],
    features: [
      'Create and send patient quotes / treatment estimates',
      'Generate invoices and track payment status',
      'Capture and triage new-patient inquiries',
      'Appointment scheduling and calendar management',
      'Track supplies and stock levels',
      'Reorder alerts for clinical and front-office supplies',
      'Staff management and role assignments',
      'Patient database with visit history',
    ],
  },
  marketing_sales: {
    description:
      'AI-powered patient outreach — recall reminders, new-patient welcomes, win-back campaigns, and referral programs.',
    tabs: ['Campaign', 'Patients', 'Recall', 'Reviews'],
    features: [
      'Email and SMS recall reminders',
      'Patient segmentation for personalized outreach',
      'Promo codes for new-patient specials',
      'Referral program with reward tracking',
      'Win-back campaigns for lapsed patients',
      'Campaign performance analytics',
    ],
  },
  analytics_reports: {
    description:
      'Practice analytics — no-show trends, recall conversion, schedule utilization, and revenue.',
    features: [
      'No-show and cancellation reports',
      'Recall reminder conversion rate',
      'Schedule utilization by provider',
      'Revenue trends and projections',
      'Patient lifetime value insights',
      'Multi-format export: CSV and PDF',
    ],
  },
};

const VETERINARY_OVERRIDE: ConsoleOverrideMap = {
  ...HEALTHCARE_BASE,
  customer_portal: {
    description:
      'AI-powered pet-owner engagement hub with chat, voice booking, vaccine reminders, and review collection.',
    tabs: ['Chat', 'Voice', 'Services', 'Hours', 'Pets', 'Track', 'Billing'],
    features: [
      'Pet-owners ask questions and book wellness exams',
      'Voice booking and after-hours overflow',
      'Vaccine and wellness reminders',
      'Pet records (kept as JSON on the customer record — not a clinical EHR)',
      'Review collection (Google / Yelp / Facebook)',
      'Service catalog with pricing',
      'Clinic hours display',
    ],
  },
};

const BY_INDUSTRY: Record<string, ConsoleOverrideMap> = {
  dental: HEALTHCARE_BASE,
  chiropractic: HEALTHCARE_BASE,
  medical_office: HEALTHCARE_BASE,
  physical_therapy: HEALTHCARE_BASE,
  optometry: HEALTHCARE_BASE,
  veterinary: VETERINARY_OVERRIDE,
  real_estate: {
    customer_portal: {
      description:
        'AI-powered buyer & seller engagement hub — showings, listing inquiries, and follow-ups.',
      tabs: ['Chat', 'Voice', 'Listings', 'Hours', 'Showings', 'Track'],
      features: [
        'Buyers and sellers ask questions and request showings',
        'Voice booking for showings and consults',
        'Listing search and inquiry capture',
        'Automated showing reminders and confirmations',
        'Review collection from past clients',
      ],
    },
  },
  restaurants: {
    customer_portal: {
      description:
        'AI-powered guest engagement hub — reservations, menu questions, private events.',
      tabs: ['Chat', 'Voice', 'Menu', 'Hours', 'Reservations', 'Events'],
      features: [
        'Guests book reservations via chat or voice',
        'Menu and hours questions answered automatically',
        'Private event and large-party inquiry capture',
        'Reservation reminders and confirmations',
      ],
    },
  },
  beauty_wellness: {
    customer_portal: {
      description:
        'AI-powered client engagement hub — bookings, service questions, and follow-ups.',
      tabs: ['Chat', 'Voice', 'Services', 'Hours', 'Stylists', 'Track'],
      features: [
        'Clients book appointments via chat or voice',
        'Service catalog with pricing',
        'Stylist availability and chair scheduling',
        'Automated reminders and rebook prompts',
      ],
    },
  },
};

/**
 * Resolve the industry-aware console config. Returns an object with the
 * effective description, tabs, and features for the given console + pack.
 * Anything not overridden uses the generic config values.
 */
export function getIndustryConsoleConfig(
  base: ConsoleHelpConfig,
  pack: IndustryPack | null | undefined,
): { description: string; tabs: string[]; features: string[] | null } {
  const override = pack ? BY_INDUSTRY[pack.industry_id]?.[base.id] : undefined;
  return {
    description: override?.description ?? base.description,
    tabs: override?.tabs ?? base.tabs ?? [],
    features: override?.features ?? null, // null means "use generic + tier filtering"
  };
}