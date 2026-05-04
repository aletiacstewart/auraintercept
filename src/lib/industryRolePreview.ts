/**
 * Industry-aware copy for the "Try every view, all in one demo" section
 * (RolePreviewRow) on the /for-business marketing page. The 3 cards
 * (Owner Dashboard, Field/Team App, Customer Portal) must reflect the
 * selected industry — never fall through to "Technician / pay invoices /
 * AC repair" copy for healthcare, real estate, restaurants, etc.
 *
 * Resolution: industry override → cluster default → trades fallback.
 * Keyed off the marketing dropdown industry IDs (see industryMarketingContent.ts).
 */

export interface RolePreviewCard {
  title: string;
  description: string;
  highlights: [string, string, string];
}

export interface RolePreviewCopy {
  owner: RolePreviewCard;
  field: RolePreviewCard;
  customer: RolePreviewCard;
  /** Bottom CTA subtext: "admin, X & Y" */
  loginRoles: string;
}

type Cluster = 'trades' | 'outdoor' | 'repair' | 'booking' | 'realestate' | 'hospitality';

const CLUSTERS: Record<Cluster, RolePreviewCopy> = {
  trades: {
    owner: {
      title: 'Owner Dashboard',
      description: 'See every call, lead, job, and dollar flowing through your business — in real time.',
      highlights: ['Live call & lead feed', 'Revenue analytics', 'Aura command center'],
    },
    field: {
      title: 'Technician App',
      description: 'Mobile-first PWA your techs use in the field. Routes, jobs, photos, invoices — all in one.',
      highlights: ["Today's jobs", 'One-tap navigation', 'Photo & note capture'],
    },
    customer: {
      title: 'Customer Portal',
      description: 'What your customers see — book service, see ETAs, chat with Aura, pay invoices.',
      highlights: ['Self-service booking', 'Live ETA tracking', '24/7 AI chat'],
    },
    loginRoles: 'admin, technician & customer',
  },
  outdoor: {
    owner: {
      title: 'Owner Dashboard',
      description: 'See every route, crew, job, and dollar flowing through your business — in real time.',
      highlights: ['Live route & lead feed', 'Revenue analytics', 'Aura command center'],
    },
    field: {
      title: 'Crew App',
      description: 'Mobile-first PWA your crews use on-site. Routes, visits, photos, before/afters — all in one.',
      highlights: ["Today's visits", 'One-tap navigation', 'Photo proof & notes'],
    },
    customer: {
      title: 'Property Owner Portal',
      description: 'What your customers see — schedule visits, view photos, manage their service plan.',
      highlights: ['Self-service scheduling', 'Visit photo proof', '24/7 AI chat'],
    },
    loginRoles: 'admin, crew lead & property owner',
  },
  repair: {
    owner: {
      title: 'Owner Dashboard',
      description: 'See every ticket, lead, repair, and dollar flowing through your business — in real time.',
      highlights: ['Live ticket & lead feed', 'Revenue analytics', 'Aura command center'],
    },
    field: {
      title: 'Technician App',
      description: 'Mobile-first PWA your techs use bench-side or on-site. Tickets, parts, photos — all in one.',
      highlights: ["Today's tickets", 'Parts lookup', 'Photo & note capture'],
    },
    customer: {
      title: 'Customer Portal',
      description: 'What your customers see — open a ticket, track status, chat with Aura, pay invoices.',
      highlights: ['Self-service ticket open', 'Live repair status', '24/7 AI chat'],
    },
    loginRoles: 'admin, technician & customer',
  },
  booking: {
    owner: {
      title: 'Owner Dashboard',
      description: 'See every booking, client, and dollar flowing through your business — in real time.',
      highlights: ['Live booking & lead feed', 'Revenue analytics', 'Aura command center'],
    },
    field: {
      title: 'Staff App',
      description: "Mobile-first PWA your staff use on-shift. Today's bookings, client notes, check-ins — all in one.",
      highlights: ["Today's bookings", 'Client notes', 'One-tap check-in'],
    },
    customer: {
      title: 'Client Portal',
      description: 'What your clients see — book appointments, message your team, view their history.',
      highlights: ['Self-service booking', 'Live confirmations', '24/7 AI chat'],
    },
    loginRoles: 'admin, staff & client',
  },
  realestate: {
    owner: {
      title: 'Brokerage Dashboard',
      description: 'See every call, buyer/seller lead, showing, and commission — in real time.',
      highlights: ['Live lead & showing feed', 'Commission analytics', 'Aura command center'],
    },
    field: {
      title: 'Agent App',
      description: "Mobile app your agents use on the road. Today's showings, client notes, listing photos — all in one.",
      highlights: ["Today's showings", 'One-tap client lookup', 'Listing photos & notes'],
    },
    customer: {
      title: 'Buyer & Seller Portal',
      description: 'What your buyers and sellers see — book tours, track offer status, chat with Aura 24/7.',
      highlights: ['Self-service tour booking', 'Live showing status', '24/7 AI chat'],
    },
    loginRoles: 'broker, agent & client',
  },
  hospitality: {
    owner: {
      title: 'Owner Dashboard',
      description: 'See every call, reservation, table, and dollar flowing through your venue — in real time.',
      highlights: ['Live call & reservation feed', 'Revenue analytics', 'Aura command center'],
    },
    field: {
      title: 'Staff App',
      description: "Mobile app your team uses on-shift. Today's reservations, table status, special requests — all in one.",
      highlights: ["Today's reservations", 'Table & section view', 'Guest notes'],
    },
    customer: {
      title: 'Guest Portal',
      description: 'What your guests see — book a table, view the menu, message the host 24/7.',
      highlights: ['Self-service reservations', 'Live confirmations', '24/7 AI host'],
    },
    loginRoles: 'manager, staff & guest',
  },
};

/** Map marketing industry IDs (see industryMarketingContent.ts) to a cluster. */
const INDUSTRY_TO_CLUSTER: Record<string, Cluster> = {
  // Essential Trades
  hvac: 'trades', plumbing: 'trades', electrical: 'trades', solar_energy: 'trades', solar: 'trades',
  // Exterior & Structural
  roofing: 'trades', fencing_decking: 'trades', fencing: 'trades', construction: 'trades',
  // Property & Estate (route-based)
  landscape_trees: 'outdoor', landscape: 'outdoor', pool_spa: 'outdoor', pest_control: 'outdoor',
  handyman_cleaning: 'outdoor', handyman: 'outdoor',
  // Repair
  appliance_repair: 'repair', appliance: 'repair', auto_care: 'repair', auto_repair: 'repair',
  security_systems: 'trades',
  // Real estate
  real_estate: 'realestate',
  // Booking / personal services
  beauty_wellness: 'booking', salon: 'booking', fitness: 'booking', personal_assistant: 'booking',
  legal: 'booking', accounting: 'booking', cleaning: 'outdoor',
  // Hospitality
  restaurants: 'hospitality', restaurant: 'hospitality',
};

/** Per-industry overrides for verticals where cluster defaults aren't tight enough. */
const INDUSTRY_OVERRIDES: Record<string, Partial<RolePreviewCopy>> = {
  beauty_wellness: {
    owner: {
      title: 'Salon Dashboard',
      description: 'See every call, booking, stylist, and dollar flowing through your salon — in real time.',
      highlights: ['Live booking & lead feed', 'Stylist revenue analytics', 'Aura command center'],
    },
    field: {
      title: 'Stylist App',
      description: "Mobile app your stylists use chair-side. Today's bookings, client notes, color formulas — all in one.",
      highlights: ["Today's bookings", 'Client formulas', 'One-tap check-in'],
    },
    customer: {
      title: 'Client Portal',
      description: 'What your clients see — book with their stylist, get reminders, chat 24/7.',
      highlights: ['Self-service booking', 'Stylist reminders', '24/7 AI chat'],
    },
    loginRoles: 'owner, stylist & client',
  },
  restaurants: {
    field: {
      title: 'Host & Server App',
      description: "Mobile app your front-of-house uses on-shift. Today's reservations, table status, allergy notes — all in one.",
      highlights: ["Today's reservations", 'Table status', 'Allergy & guest notes'],
    },
  },
  real_estate: {
    loginRoles: 'broker, agent & buyer/seller',
  },
  personal_assistant: {
    field: {
      title: 'Assistant App',
      description: "Mobile app your team uses on the go. Today's tasks, client requests, errands — all in one.",
      highlights: ["Today's tasks", 'Client requests', 'Notes & receipts'],
    },
    customer: {
      title: 'Client Portal',
      description: 'What your clients see — request tasks, track status, chat 24/7.',
      highlights: ['Self-service requests', 'Live task status', '24/7 AI chat'],
    },
    loginRoles: 'admin, assistant & client',
  },
};

export function getRolePreviewCopy(industryId: string | undefined): RolePreviewCopy {
  const id = (industryId || 'default').toLowerCase();
  const cluster = INDUSTRY_TO_CLUSTER[id] || 'trades';
  const base = CLUSTERS[cluster];
  const override = INDUSTRY_OVERRIDES[id];
  if (!override) return base;
  return {
    owner: override.owner ?? base.owner,
    field: override.field ?? base.field,
    customer: override.customer ?? base.customer,
    loginRoles: override.loginRoles ?? base.loginRoles,
  };
}