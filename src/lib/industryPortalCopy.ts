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
}

const CLUSTER: Record<IndustryPack['cluster'], PortalCopy> = {
  trades: {
    title: 'Customer Portal Console',
    description: 'AI-powered customer service portal for service trades',
    specialistSubtitle: 'Customer-facing specialists for self-diagnosis, surveys, and claims.',
    customerNoun: 'Customer', requestNoun: 'Service Request',
  },
  outdoor: {
    title: 'Property-Owner Portal Console',
    description: 'AI-powered portal for property owners on recurring service routes',
    specialistSubtitle: 'Owner-facing specialists for surveys, photo proof, and seasonal plans.',
    customerNoun: 'Property Owner', requestNoun: 'Service Visit',
  },
  repair: {
    title: 'Customer Portal Console',
    description: 'AI-powered ticket portal for repair customers',
    specialistSubtitle: 'Customer-facing specialists for self-diagnosis and ticket status.',
    customerNoun: 'Customer', requestNoun: 'Repair Ticket',
  },
  booking: {
    title: 'Client Portal Console',
    description: 'AI-powered booking portal for clients',
    specialistSubtitle: 'Client-facing specialists for booking, prep, and follow-up.',
    customerNoun: 'Client', requestNoun: 'Booking',
  },
};

const OVERRIDES: Record<string, Partial<PortalCopy>> = {
  real_estate: { title: 'Buyer & Seller Portal',
    description: 'AI-powered portal for buyers, sellers, and showings',
    specialistSubtitle: 'Client-facing specialists for showings, offers, and listing questions.',
    customerNoun: 'Buyer / Seller', requestNoun: 'Showing Request' },
  beauty_wellness: { title: 'Client Portal',
    description: 'AI-powered booking portal for salon and spa clients',
    specialistSubtitle: 'Client-facing specialists for booking, prep notes, and aftercare.',
    customerNoun: 'Client', requestNoun: 'Appointment' },
  restaurants: { title: 'Guest Portal',
    description: 'AI-powered reservation portal for guests',
    specialistSubtitle: 'Guest-facing specialists for reservations, special requests, and waitlist.',
    customerNoun: 'Guest', requestNoun: 'Reservation' },
  personal_assistant: { title: 'Client Portal',
    description: 'AI-powered concierge portal for clients',
    specialistSubtitle: 'Client-facing specialists for scheduling, travel, and errands.',
    customerNoun: 'Client', requestNoun: 'Request' },
  auto_care: { customerNoun: 'Vehicle Owner', requestNoun: 'Repair Order',
    specialistSubtitle: 'Owner-facing specialists for diagnostics and repair status.' },
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