import type { IndustryPack } from '@/hooks/useIndustryPack';

export interface PortalCopy {
  /** Console title (replaces "Customer Portal Console" header). */
  title: string;
  /** Description shown under the title. */
  description: string;
  /** Subtitle shown under the specialist operatives launcher. */
  specialistSubtitle: string;
  /** Noun for the customer (e.g. Customer, Client, Buyer, Guest). */
  customerNoun: string;
  /** Noun for a request (e.g. Service Request, Booking, Showing Request). */
  requestNoun: string;
  /** Header label shown on the customer-facing portal home (e.g. "Customer Portal", "Guest Portal"). */
  portalHeaderLabel: string;
  /** Welcome subtitle copy shown above the chat in the customer portal. */
  welcomeSubtitle: string;
}

const CLUSTER: Record<IndustryPack['cluster'], PortalCopy> = {
  trades: {
    title: 'Customer Portal Console',
    description: 'AI-powered customer service portal for service trades',
    specialistSubtitle: 'Customer-facing specialists for self-diagnosis, surveys, and claims.',
    customerNoun: 'Customer', requestNoun: 'Service Request',
    portalHeaderLabel: 'Customer Portal',
    welcomeSubtitle: 'Request service, track your technician, and view invoices.',
  },
  outdoor: {
    title: 'Property-Owner Portal Console',
    description: 'AI-powered portal for property owners on recurring service routes',
    specialistSubtitle: 'Owner-facing specialists for surveys, photo proof, and seasonal plans.',
    customerNoun: 'Property Owner', requestNoun: 'Service Visit',
    portalHeaderLabel: 'Property Owner Portal',
    welcomeSubtitle: 'Schedule visits, view photos, and manage your service plan.',
  },
  repair: {
    title: 'Customer Portal Console',
    description: 'AI-powered ticket portal for repair customers',
    specialistSubtitle: 'Customer-facing specialists for self-diagnosis and ticket status.',
    customerNoun: 'Customer', requestNoun: 'Repair Ticket',
    portalHeaderLabel: 'Customer Portal',
    welcomeSubtitle: 'Open a repair ticket, track status, and view your history.',
  },
  booking: {
    title: 'Client Portal Console',
    description: 'AI-powered booking portal for clients',
    specialistSubtitle: 'Client-facing specialists for booking, prep, and follow-up.',
    customerNoun: 'Client', requestNoun: 'Booking',
    portalHeaderLabel: 'Client Portal',
    welcomeSubtitle: 'Book appointments and message your team anytime.',
  },
  home_health: {
    title: 'Patient & Family Portal',
    description: 'AI-powered portal for patients and family caregivers',
    specialistSubtitle: 'Patient-facing specialists for scheduling, insurance, and care questions.',
    customerNoun: 'Patient', requestNoun: 'Visit Request',
    portalHeaderLabel: 'Patient Portal',
    welcomeSubtitle: 'Schedule visits, message your care team, and view your plan of care.',
  },
};

const OVERRIDES: Record<string, Partial<PortalCopy>> = {
  real_estate: { title: 'Buyer & Seller Portal',
    description: 'AI-powered portal for buyers, sellers, and showings',
    specialistSubtitle: 'Client-facing specialists for showings, offers, and listing questions.',
    customerNoun: 'Buyer / Seller', requestNoun: 'Showing Request',
    portalHeaderLabel: 'Buyer & Seller Portal',
    welcomeSubtitle: 'Browse listings, schedule showings, and message your agent.' },
  beauty_wellness: { title: 'Client Portal',
    description: 'AI-powered booking portal for salon and spa clients',
    specialistSubtitle: 'Client-facing specialists for booking, prep notes, and aftercare.',
    customerNoun: 'Client', requestNoun: 'Appointment',
    portalHeaderLabel: 'Client Portal',
    welcomeSubtitle: 'Book your next appointment and chat with your stylist.' },
  restaurants: { title: 'Guest Portal',
    description: 'AI-powered reservation portal for guests',
    specialistSubtitle: 'Guest-facing specialists for reservations, special requests, and waitlist.',
    customerNoun: 'Guest', requestNoun: 'Reservation',
    portalHeaderLabel: 'Guest Portal',
    welcomeSubtitle: 'Make a reservation, view the menu, and add special requests.' },
  personal_assistant: { title: 'Client Portal',
    description: 'AI-powered concierge portal for clients',
    specialistSubtitle: 'Client-facing specialists for scheduling, travel, and errands.',
    customerNoun: 'Client', requestNoun: 'Request',
    portalHeaderLabel: 'Client Portal',
    welcomeSubtitle: 'Send requests, view tasks, and message your assistant.' },
  auto_care: { customerNoun: 'Vehicle Owner', requestNoun: 'Repair Order',
    specialistSubtitle: 'Owner-facing specialists for diagnostics and repair status.',
    portalHeaderLabel: 'Vehicle Owner Portal',
    welcomeSubtitle: 'Open a repair order and track your vehicle\u2019s service.' },
  appliance_repair: { customerNoun: 'Customer', requestNoun: 'Repair Ticket',
    specialistSubtitle: 'Customer-facing specialists for self-diagnosis and warranty status.' },
  roofing: { customerNoun: 'Property Owner', requestNoun: 'Inspection Request',
    specialistSubtitle: 'Owner-facing specialists for inspections, claims, and storm response.' },
  solar: { customerNoun: 'Homeowner', requestNoun: 'Quote Request',
    specialistSubtitle: 'Homeowner-facing specialists for design, incentives, and savings.' },
  construction: { customerNoun: 'Owner', requestNoun: 'Project Inquiry',
    specialistSubtitle: 'Owner-facing specialists for bid walks, change orders, and progress updates.' },
  security_systems: { customerNoun: 'Customer', requestNoun: 'Service Request',
    specialistSubtitle: 'Customer-facing specialists for monitoring, panel issues, and add-ons.' },
  landscape: { customerNoun: 'Property Owner', requestNoun: 'Service Visit',
    specialistSubtitle: 'Owner-facing specialists for visit photos, plans, and seasonal services.' },
  pest_control: { customerNoun: 'Customer', requestNoun: 'Treatment Visit',
    specialistSubtitle: 'Customer-facing specialists for treatment plans and inspections.' },
  pool_spa: { customerNoun: 'Pool Owner', requestNoun: 'Service Visit',
    specialistSubtitle: 'Owner-facing specialists for chemistry, equipment, and recovery quotes.' },
  fencing: { customerNoun: 'Property Owner', requestNoun: 'Estimate Request',
    specialistSubtitle: 'Owner-facing specialists for measures, designs, and HOA questions.' },
  handyman: { customerNoun: 'Customer', requestNoun: 'Service Request',
    specialistSubtitle: 'Customer-facing specialists for scoping and bundle quotes.' },
};

export function getPortalCopy(pack: IndustryPack): PortalCopy {
  const base = CLUSTER[pack.cluster] ?? CLUSTER.trades;
  const ov = OVERRIDES[pack.industry_id];
  return ov ? { ...base, ...ov } : base;
}