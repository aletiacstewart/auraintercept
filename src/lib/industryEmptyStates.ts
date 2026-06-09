import {
  Briefcase, Users, FileText, Receipt, Package, Calendar, Wrench,
  Home, Scissors, UtensilsCrossed, UserPlus, MapPin, Sparkles,
  type LucideIcon,
} from 'lucide-react';
import type { IndustryPack } from '@/hooks/useIndustryPack';

export type EmptyStateSurface =
  | 'jobs' | 'leads' | 'quotes' | 'customers' | 'inventory'
  | 'appointments' | 'employees' | 'invoices';

export interface EmptyState {
  icon: LucideIcon;
  title: string;
  body: string;
  ctaLabel: string;
  /** Navigate to this route on CTA click. */
  ctaRoute?: string;
  /** OR copy this prompt to clipboard so the user can paste it to Aura. */
  ctaPrompt?: string;
}

/* -------- Generic fallbacks (preserve current wording) ---------------- */
const GENERIC: Record<EmptyStateSurface, EmptyState> = {
  jobs: {
    icon: Briefcase, title: 'No jobs yet',
    body: 'Create your first job to start tracking work.',
    ctaLabel: 'Add a job', ctaRoute: '/dashboard/appointments?new=1',
  },
  leads: {
    icon: UserPlus, title: 'No leads yet',
    body: 'Capture your first lead to start your pipeline.',
    ctaLabel: 'Add a lead', ctaRoute: '/dashboard/leads?new=1',
  },
  quotes: {
    icon: FileText, title: 'No quotes yet',
    body: 'Build your first quote to send to a customer.',
    ctaLabel: 'Create quote', ctaRoute: '/dashboard/quotes?new=1',
  },
  customers: {
    icon: Users, title: 'No customers yet',
    body: 'Add your first customer or import an existing list.',
    ctaLabel: 'Add customer', ctaRoute: '/dashboard/customers?new=1',
  },
  inventory: {
    icon: Package, title: 'No inventory yet',
    body: 'Track your first item to keep stock visible.',
    ctaLabel: 'Add item', ctaRoute: '/dashboard/inventory?new=1',
  },
  appointments: {
    icon: Calendar, title: 'No appointments scheduled',
    body: 'Book your first appointment to get going.',
    ctaLabel: 'Schedule appointment', ctaRoute: '/dashboard/appointments?new=1',
  },
  employees: {
    icon: Users, title: 'No team members yet',
    body: 'Invite your first team member to assign work.',
    ctaLabel: 'Invite team member', ctaRoute: '/dashboard/employees?new=1',
  },
  invoices: {
    icon: Receipt, title: 'No invoices yet',
    body: 'Send your first invoice to start collecting payment.',
    ctaLabel: 'Create invoice', ctaRoute: '/dashboard/invoices?new=1',
  },
};

/* -------- Cluster overrides ------------------------------------------- */
type ClusterId = IndustryPack['cluster'];
const BY_CLUSTER: Partial<Record<ClusterId, Partial<Record<EmptyStateSurface, EmptyState>>>> = {
  trades: {
    jobs: {
      icon: Wrench, title: 'No service jobs yet',
      body: 'Add your first service area or job to start dispatching technicians.',
      ctaLabel: 'Add a service area', ctaRoute: '/dashboard/services',
    },
    inventory: {
      icon: Wrench, title: 'No truck inventory yet',
      body: 'Stock your first truck so techs know what they have on board.',
      ctaLabel: 'Stock a truck', ctaRoute: '/dashboard/inventory?new=1',
    },
  },
  outdoor: {
    jobs: {
      icon: MapPin, title: 'No service routes yet',
      body: 'Add your first property route to plan recurring visits.',
      ctaLabel: 'Add a route', ctaRoute: '/dashboard/services',
    },
  },
  repair: {
    jobs: {
      icon: Wrench, title: 'No repair tickets yet',
      body: 'Open your first repair ticket to track work in the bay.',
      ctaLabel: 'New repair ticket', ctaRoute: '/dashboard/appointments?new=1',
    },
  },
  booking: {
    jobs: {
      icon: Calendar, title: 'No bookings yet',
      body: 'Add a service to your menu so customers can book online.',
      ctaLabel: 'Add a service', ctaRoute: '/dashboard/services',
    },
    appointments: {
      icon: Calendar, title: 'No bookings yet',
      body: 'Open your booking page so clients can reserve a time.',
      ctaLabel: 'Set up bookings', ctaRoute: '/dashboard/appointments?new=1',
    },
  },
};

/* -------- Industry overrides ----------------------------------------- */
const BY_INDUSTRY: Record<string, Partial<Record<EmptyStateSurface, EmptyState>>> = {
  real_estate: {
    jobs: {
      icon: Home, title: 'No listings yet',
      body: 'Add your first listing to start scheduling showings.',
      ctaLabel: 'Add a listing', ctaRoute: '/dashboard/services',
    },
    appointments: {
      icon: Calendar, title: 'No showings booked',
      body: 'Add a listing and open showing slots for buyers.',
      ctaLabel: 'Schedule a showing', ctaRoute: '/dashboard/appointments?new=1',
    },
    employees: {
      icon: UserPlus, title: 'No agents yet',
      body: 'Invite your first agent so you can assign showings.',
      ctaLabel: 'Invite an agent', ctaRoute: '/dashboard/employees?new=1',
    },
    leads: {
      icon: UserPlus, title: 'No buyers or sellers yet',
      body: 'Capture your first lead from a listing inquiry.',
      ctaLabel: 'Add a lead', ctaRoute: '/dashboard/leads?new=1',
    },
  },
  beauty_wellness: {
    jobs: {
      icon: Scissors, title: 'No services yet',
      body: 'Add your first stylist + chair so clients can book.',
      ctaLabel: 'Add a stylist', ctaRoute: '/dashboard/employees?new=1',
    },
    employees: {
      icon: Scissors, title: 'No stylists yet',
      body: 'Invite your first stylist so clients can book with them.',
      ctaLabel: 'Invite a stylist', ctaRoute: '/dashboard/employees?new=1',
    },
    appointments: {
      icon: Calendar, title: 'No appointments booked',
      body: 'Set your service menu so clients can book online.',
      ctaLabel: 'Add a service', ctaRoute: '/dashboard/services',
    },
  },
  restaurants: {
    jobs: {
      icon: UtensilsCrossed, title: 'No reservations yet',
      body: 'Add a reservation slot or open your menu to start taking bookings.',
      ctaLabel: 'Add a reservation slot', ctaRoute: '/dashboard/appointments?new=1',
    },
    inventory: {
      icon: UtensilsCrossed, title: 'No menu items yet',
      body: 'Add your first menu item so guests can order or browse.',
      ctaLabel: 'Add menu item', ctaRoute: '/dashboard/inventory?new=1',
    },
    employees: {
      icon: UserPlus, title: 'No servers yet',
      body: 'Invite your first server to assign tables and shifts.',
      ctaLabel: 'Invite a server', ctaRoute: '/dashboard/employees?new=1',
    },
    appointments: {
      icon: Calendar, title: 'No reservations booked',
      body: 'Open reservation slots so guests can book a table.',
      ctaLabel: 'Add reservation slot', ctaRoute: '/dashboard/appointments?new=1',
    },
  },
  personal_assistant: {
    jobs: {
      icon: Sparkles, title: 'No tasks yet',
      body: 'Capture your first task so your assistant can pick it up.',
      ctaLabel: 'Add a task', ctaRoute: '/dashboard/appointments?new=1',
    },
  },
  veterinary: {
    jobs: {
      icon: Calendar, title: 'No exams scheduled',
      body: 'Open your exam schedule so pet owners can book online.',
      ctaLabel: 'Schedule an exam', ctaRoute: '/dashboard/appointments?new=1',
    },
    appointments: {
      icon: Calendar, title: 'No exams booked',
      body: 'Add availability so clients can reserve exam slots.',
      ctaLabel: 'Add availability', ctaRoute: '/dashboard/appointments?new=1',
    },
    employees: {
      icon: UserPlus, title: 'No veterinarians yet',
      body: 'Invite your first veterinarian so you can assign exams.',
      ctaLabel: 'Invite a veterinarian', ctaRoute: '/dashboard/employees?new=1',
    },
  },
  medical_practice: {
    jobs: {
      icon: Calendar, title: 'No visits scheduled',
      body: 'Open your visit schedule so patients can book online.',
      ctaLabel: 'Schedule a visit', ctaRoute: '/dashboard/appointments?new=1',
    },
    appointments: {
      icon: Calendar, title: 'No visits booked',
      body: 'Add availability so patients can reserve visit slots.',
      ctaLabel: 'Add availability', ctaRoute: '/dashboard/appointments?new=1',
    },
    employees: {
      icon: UserPlus, title: 'No providers yet',
      body: 'Invite your first provider so you can assign visits.',
      ctaLabel: 'Invite a provider', ctaRoute: '/dashboard/employees?new=1',
    },
  },
};

export function getIndustryEmptyState(
  surface: EmptyStateSurface,
  pack: IndustryPack,
): EmptyState {
  return (
    BY_INDUSTRY[pack.industry_id]?.[surface] ??
    BY_CLUSTER[pack.cluster]?.[surface] ??
    GENERIC[surface]
  );
}