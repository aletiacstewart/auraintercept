import {
  CalendarPlus,
  FileText,
  PenTool,
  Truck,
  UserPlus,
  DollarSign,
  Map,
  Phone,
  Sparkles,
  ClipboardList,
  Wrench,
  Home,
  Scissors,
  type LucideIcon,
} from 'lucide-react';
import type { IndustryPack } from '@/hooks/useIndustryPack';

export interface QuickAction {
  key: string;
  icon: LucideIcon;
  label: string;
  description: string;
  route: string;
  /** Prompt sent to Aura when the card is clicked. Defaults to label. */
  command?: string;
}

/* ----------------------------------------------------------------------------
 * Cluster defaults — one set per industry-pack cluster.
 * Industry-specific overrides below this map win when present.
 * -------------------------------------------------------------------------- */
const CLUSTER_QUICK_ACTIONS: Record<IndustryPack['cluster'], QuickAction[]> = {
  trades: [
    { key: 'bookEmergency', icon: CalendarPlus, label: "Book today's emergency job",
      description: 'Opens the booking flow pre-filled for today and flagged as urgent.',
      route: '/dashboard/appointments?new=1&urgent=1&when=today' },
    { key: 'overdueInvoices', icon: FileText, label: 'Show overdue invoices & chase them',
      description: 'Jumps to Invoices filtered to overdue and offers to send reminders.',
      route: '/dashboard/invoices?status=overdue' },
    { key: 'generatePosts', icon: PenTool, label: 'Generate seasonal social posts',
      description: 'Opens Content Engine with a seasonal campaign drafted.',
      route: '/dashboard/content-engine' },
    { key: 'checkDispatch', icon: Truck, label: "Check today's dispatch schedule",
      description: "Opens the Field Ops board for today's jobs and technician assignments.",
      route: '/dashboard/dispatch-field-ops?view=today' },
    { key: 'createQuote', icon: UserPlus, label: 'Create a quote for a new lead',
      description: 'Opens the Quote builder so you can price a new lead in seconds.',
      route: '/dashboard/quotes?new=1' },
    { key: 'weekRevenue', icon: DollarSign, label: "Show me this week's revenue",
      description: 'Opens Revenue Analysis scoped to this week with charts and totals.',
      route: '/dashboard/ai-consoles/revenue-analysis?range=this-week' },
  ],

  outdoor: [
    { key: 'todaysRoute', icon: Map, label: "Show today's recurring routes",
      description: 'Opens the Dispatch map clustered by recurring stops for today.',
      route: '/dashboard/dispatch-field-ops?view=today' },
    { key: 'weatherImpact', icon: Truck, label: 'Reschedule weather-impacted stops',
      description: 'Surfaces stops at risk from current weather and offers to reshuffle.',
      route: '/dashboard/dispatch-field-ops' },
    { key: 'seasonalCampaign', icon: PenTool, label: 'Generate a seasonal campaign',
      description: 'Opens Content Engine pre-loaded with this season’s service offers.',
      route: '/dashboard/content-engine' },
    { key: 'overdueInvoices', icon: FileText, label: 'Chase overdue invoices',
      description: 'Jumps to Invoices filtered to overdue and offers to send reminders.',
      route: '/dashboard/invoices?status=overdue' },
    { key: 'quoteProperty', icon: UserPlus, label: 'Quote a new property',
      description: 'Opens the Quote builder pre-filled for property service work.',
      route: '/dashboard/quotes?new=1' },
    { key: 'weekRevenue', icon: DollarSign, label: "Show me this week's revenue",
      description: 'Opens Revenue Analysis scoped to this week with charts and totals.',
      route: '/dashboard/ai-consoles/revenue-analysis?range=this-week' },
  ],

  repair: [
    { key: 'repairQueue', icon: ClipboardList, label: "Open today's repair queue",
      description: 'Shows tickets ready for diagnosis or in-progress repair.',
      route: '/dashboard/dispatch-field-ops?view=today' },
    { key: 'partsPending', icon: Wrench, label: 'Parts orders pending',
      description: 'Opens inventory filtered to back-ordered or in-transit parts.',
      route: '/dashboard/inventory' },
    { key: 'generatePosts', icon: PenTool, label: 'Generate a repair-tip post',
      description: 'Opens Content Engine with a how-to repair tip drafted.',
      route: '/dashboard/content-engine' },
    { key: 'overdueInvoices', icon: FileText, label: 'Chase overdue invoices',
      description: 'Jumps to Invoices filtered to overdue and offers to send reminders.',
      route: '/dashboard/invoices?status=overdue' },
    { key: 'createQuote', icon: UserPlus, label: 'Quote a new ticket',
      description: 'Opens the Quote builder so you can price a new ticket in seconds.',
      route: '/dashboard/quotes?new=1' },
    { key: 'weekRevenue', icon: DollarSign, label: "Show me this week's revenue",
      description: 'Opens Revenue Analysis scoped to this week with charts and totals.',
      route: '/dashboard/ai-consoles/revenue-analysis?range=this-week' },
  ],

  booking: [
    { key: 'bookAppointment', icon: CalendarPlus, label: 'Book today’s next appointment',
      description: 'Opens the booking flow pre-filled for today’s next available slot.',
      route: '/dashboard/appointments?new=1&when=today' },
    { key: 'newLeadsFollowUp', icon: Phone, label: 'New leads to follow up',
      description: 'Shows leads from the last 24h and drafts personalized follow-ups.',
      route: '/dashboard/leads' },
    { key: 'generatePosts', icon: PenTool, label: 'Generate social posts',
      description: 'Opens Content Engine with a fresh batch of branded posts.',
      route: '/dashboard/content-engine' },
    { key: 'todaysCalendar', icon: Map, label: "Open today's calendar",
      description: 'Shows today’s appointments across the team.',
      route: '/dashboard/appointments' },
    { key: 'sendProposal', icon: UserPlus, label: 'Send a proposal',
      description: 'Opens the Quote/Proposal builder to send to a prospect.',
      route: '/dashboard/quotes?new=1' },
    { key: 'weekRevenue', icon: DollarSign, label: "Show me this week's revenue",
      description: 'Opens Revenue Analysis scoped to this week with charts and totals.',
      route: '/dashboard/ai-consoles/revenue-analysis?range=this-week' },
  ],
};

/* ----------------------------------------------------------------------------
 * Per-industry overrides — wins over the cluster default.
 * Add an entry only when the cluster default doesn’t fit the vertical’s lingo.
 * -------------------------------------------------------------------------- */
const INDUSTRY_QUICK_ACTIONS: Record<string, QuickAction[]> = {
  real_estate: [
    { key: 'bookShowing', icon: Home, label: 'Book a showing today',
      description: 'Opens the booking flow pre-filled as a showing for today.',
      route: '/dashboard/appointments?new=1&type=showing&when=today' },
    { key: 'newLeadsFollowUp', icon: Phone, label: 'Follow up with new buyers/sellers',
      description: 'Shows new leads from the last 24h and drafts follow-up messages.',
      route: '/dashboard/leads' },
    { key: 'listingPosts', icon: PenTool, label: 'Generate listing posts',
      description: 'Opens Content Engine with social posts drafted for your listings.',
      route: '/dashboard/content-engine' },
    { key: 'todaysCalendar', icon: Map, label: "Today's showings calendar",
      description: 'Opens today’s schedule of showings and open houses.',
      route: '/dashboard/appointments' },
    { key: 'sendProposal', icon: UserPlus, label: 'Send a proposal/offer packet',
      description: 'Opens the Quote builder to draft a proposal or offer packet.',
      route: '/dashboard/quotes?new=1' },
    { key: 'weekRevenue', icon: DollarSign, label: 'Show me this week’s commissions',
      description: 'Opens Revenue Analysis scoped to this week with charts and totals.',
      route: '/dashboard/ai-consoles/revenue-analysis?range=this-week' },
  ],

  salon: [
    { key: 'bookAppointment', icon: Scissors, label: 'Book today’s next chair',
      description: 'Opens the booking flow pre-filled for the next open chair.',
      route: '/dashboard/appointments?new=1&when=today' },
    { key: 'newLeadsFollowUp', icon: Phone, label: 'Follow up with new clients',
      description: 'Shows new client requests and drafts personalized replies.',
      route: '/dashboard/leads' },
    { key: 'generatePosts', icon: PenTool, label: 'Generate style/before-after posts',
      description: 'Opens Content Engine with style and promo posts drafted.',
      route: '/dashboard/content-engine' },
    { key: 'todaysCalendar', icon: Map, label: "Today's chair schedule",
      description: 'Opens today’s schedule across all stylists.',
      route: '/dashboard/appointments' },
    { key: 'sendProposal', icon: UserPlus, label: 'Send a service quote',
      description: 'Opens the Quote builder to send a service quote to a client.',
      route: '/dashboard/quotes?new=1' },
    { key: 'weekRevenue', icon: DollarSign, label: "Show me this week's revenue",
      description: 'Opens Revenue Analysis scoped to this week with charts and totals.',
      route: '/dashboard/ai-consoles/revenue-analysis?range=this-week' },
  ],
};

/** Resolve the 6 quick actions for a given industry pack. */
export function getIndustryQuickActions(pack: IndustryPack): QuickAction[] {
  const override = INDUSTRY_QUICK_ACTIONS[pack.industry_id];
  if (override) return override;
  return CLUSTER_QUICK_ACTIONS[pack.cluster] ?? CLUSTER_QUICK_ACTIONS.trades;
}

// Re-export for tests.
export { CLUSTER_QUICK_ACTIONS, INDUSTRY_QUICK_ACTIONS };
// Default fallback exposed for the Aura sparkle decoration.
export const QUICK_ACTIONS_FALLBACK_ICON = Sparkles;