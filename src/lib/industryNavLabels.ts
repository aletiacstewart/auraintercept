import type { IndustryPack } from '@/hooks/useIndustryPack';

export interface IndustryNavLabels {
  /** Label for the field-tech / front-line worker view in the sidebar. */
  techView: string;
  /** Label for the dispatch / scheduling map view in the sidebar. */
  dispatchView: string;
  /** Singular noun for a front-line team member (e.g. Technician, Stylist, Agent). */
  teamMemberNoun: string;
  /** Singular noun for the unit of work (e.g. Job, Appointment, Reservation). */
  jobNoun: string;
}

/**
 * Industry-aware page header titles + descriptions for the Leads, Quotes,
 * Invoices, Customers, and Inventory pages. Resolution hierarchy mirrors
 * the sidebar labels: INDUSTRY -> CLUSTER -> generic fallback.
 */
export interface IndustryPageHeaders {
  leads:     { title: string; description: string };
  quotes:    { title: string; description: string };
  invoices:  { title: string; description: string };
  customers: { title: string; description: string };
  inventory: { title: string; description: string };
  messages:     { title: string; description: string };
  calls:        { title: string; description: string };
  campaigns:    { title: string; description: string };
  appointments: { title: string; description: string };
  employees:    { title: string; description: string };
  analytics:    { title: string; description: string };
}

const GENERIC_HEADERS: IndustryPageHeaders = {
  leads:     { title: 'Leads',     description: 'Manage and follow up on potential customers' },
  quotes:    { title: 'Quotes',    description: 'Create and manage service quotes' },
  invoices:  { title: 'Invoices',  description: 'Create and manage customer invoices' },
  customers: { title: 'Customers', description: 'View and manage customer information, history, and preferences' },
  inventory: { title: 'Inventory', description: 'Manage parts, supplies, and stock levels' },
  messages:     { title: 'Messages',     description: 'View and respond to customer conversations across SMS and chat' },
  calls:        { title: 'Call History',  description: 'Review inbound and outbound call activity' },
  campaigns:    { title: 'Campaigns',     description: 'Plan and run marketing outreach' },
  appointments: { title: 'Appointments',  description: 'View, schedule, and manage upcoming work' },
  employees:    { title: 'Team',          description: 'Manage staff, roles, and availability' },
  analytics:    { title: 'Analytics',     description: 'Track performance, conversions, and revenue' },
};

const CLUSTER_HEADERS: Partial<Record<IndustryPack['cluster'], Partial<IndustryPageHeaders>>> = {
  trades:  GENERIC_HEADERS,
  outdoor: {
    quotes:    { title: 'Estimates',  description: 'Create and manage service estimates' },
    inventory: { title: 'Equipment',  description: 'Manage equipment, materials, and stock levels' },
    employees: { title: 'Crew',       description: 'Manage crews, roles, and availability' },
    appointments: { title: 'Service Visits', description: 'View, schedule, and manage upcoming visits' },
  },
  repair: {
    quotes:    { title: 'Repair Estimates', description: 'Create and manage repair estimates' },
    inventory: { title: 'Parts & Stock',    description: 'Manage parts, supplies, and stock levels' },
    appointments: { title: 'Service Tickets', description: 'View, schedule, and manage repair tickets' },
  },
  booking: {
    leads:     { title: 'Inquiries', description: 'Manage and follow up on prospective clients' },
    quotes:    { title: 'Estimates', description: 'Create and manage client estimates' },
    customers: { title: 'Clients',   description: 'View and manage client information, history, and preferences' },
    inventory: { title: 'Inventory', description: 'Manage products, supplies, and stock levels' },
    messages:  { title: 'Conversations', description: 'View and respond to client conversations across SMS and chat' },
    appointments: { title: 'Bookings', description: 'View, schedule, and manage upcoming bookings' },
    campaigns: { title: 'Promotions', description: 'Plan and run client outreach and promotions' },
  },
};

const INDUSTRY_HEADERS: Record<string, Partial<IndustryPageHeaders>> = {
  real_estate: {
    leads:     { title: 'Buyer & Seller Leads', description: 'Manage and follow up on prospective buyers and sellers' },
    quotes:    { title: 'Listing Proposals',    description: 'Create and manage listing proposals and CMAs' },
    invoices:  { title: 'Commission Invoices',  description: 'Create and manage commission invoices' },
    customers: { title: 'Clients',              description: 'View and manage buyer, seller, and past client records' },
    inventory: { title: 'Listings',             description: 'Manage active and pocket listings' },
    messages:     { title: 'Buyer & Seller Conversations', description: 'View and respond to buyer and seller conversations' },
    calls:        { title: 'Showing & Lead Calls', description: 'Review inbound and outbound call activity' },
    appointments: { title: 'Showings & Tours',     description: 'View, schedule, and manage showings and tours' },
    campaigns:    { title: 'Listing Promotions',    description: 'Plan and run listing and farm-area promotions' },
    employees:    { title: 'Agents',                description: 'Manage agents, roles, and availability' },
  },
  restaurants: {
    leads:     { title: 'Reservation Inquiries', description: 'Manage and follow up on private events and large parties' },
    quotes:    { title: 'Catering Quotes',       description: 'Create and manage catering and private event quotes' },
    invoices:  { title: 'Invoices',              description: 'Create and manage event and catering invoices' },
    customers: { title: 'Guests',                description: 'View and manage guest profiles, preferences, and visit history' },
    inventory: { title: 'Menu & Stock',          description: 'Manage menu items, ingredients, and stock levels' },
    messages:     { title: 'Guest Conversations', description: 'View and respond to guest conversations' },
    appointments: { title: 'Reservations',        description: 'View, schedule, and manage reservations' },
    employees:    { title: 'Staff',               description: 'Manage staff, shifts, and availability' },
  },
  beauty_wellness: {
    leads:     { title: 'Inquiries', description: 'Manage and follow up on prospective clients' },
    quotes:    { title: 'Service Estimates', description: 'Create and manage service estimates and packages' },
    customers: { title: 'Clients',  description: 'View and manage client profiles, history, and preferences' },
    inventory: { title: 'Products & Supplies', description: 'Manage retail products and back-bar supplies' },
    appointments: { title: 'Appointments', description: 'View, schedule, and manage client appointments' },
    employees:    { title: 'Stylists',     description: 'Manage stylists, chairs, and availability' },
  },
  salon: {
    leads:     { title: 'Inquiries', description: 'Manage and follow up on prospective clients' },
    customers: { title: 'Clients',   description: 'View and manage client profiles, history, and preferences' },
    inventory: { title: 'Products & Supplies', description: 'Manage retail products and back-bar supplies' },
    employees: { title: 'Stylists',  description: 'Manage stylists, chairs, and availability' },
  },
  fitness: {
    leads:     { title: 'Membership Inquiries', description: 'Manage and follow up on prospective members' },
    quotes:    { title: 'Membership Quotes',    description: 'Create and manage membership and program quotes' },
    customers: { title: 'Members',              description: 'View and manage member profiles, attendance, and preferences' },
    inventory: { title: 'Equipment & Retail',   description: 'Manage equipment, retail items, and stock levels' },
    appointments: { title: 'Classes & Sessions', description: 'View, schedule, and manage classes and sessions' },
    employees:    { title: 'Trainers',          description: 'Manage trainers, classes, and availability' },
  },
  professional: {
    leads:     { title: 'Prospects', description: 'Manage and follow up on prospective clients' },
    customers: { title: 'Clients',   description: 'View and manage client information, engagements, and preferences' },
    appointments: { title: 'Meetings', description: 'View, schedule, and manage client meetings' },
  },
  auto_care: {
    quotes:    { title: 'Repair Estimates', description: 'Create and manage repair estimates' },
    inventory: { title: 'Parts & Stock',    description: 'Manage parts, fluids, and shop supplies' },
    appointments: { title: 'Repair Orders', description: 'View, schedule, and manage repair orders' },
  },
  appliance_repair: {
    quotes:    { title: 'Repair Estimates', description: 'Create and manage repair estimates' },
    inventory: { title: 'Parts & Stock',    description: 'Manage replacement parts and supplies' },
    appointments: { title: 'Service Calls', description: 'View, schedule, and manage service calls' },
  },
  landscape: {
    quotes:    { title: 'Estimates',  description: 'Create and manage landscape service estimates' },
    inventory: { title: 'Equipment',  description: 'Manage equipment, materials, and stock levels' },
    appointments: { title: 'Service Visits', description: 'View, schedule, and manage service visits' },
  },
  pool_spa: {
    inventory: { title: 'Chemicals & Parts', description: 'Manage chemicals, parts, and supplies' },
    appointments: { title: 'Service Visits', description: 'View, schedule, and manage service visits' },
  },
  pest_control: {
    inventory: { title: 'Treatments & Supplies', description: 'Manage treatments, chemicals, and supplies' },
    appointments: { title: 'Treatment Visits', description: 'View, schedule, and manage treatment visits' },
  },
};

const CLUSTER_DEFAULTS: Record<IndustryPack['cluster'], IndustryNavLabels> = {
  trades:  { techView: 'Technician View', dispatchView: 'Dispatch View', teamMemberNoun: 'Technician', jobNoun: 'Job' },
  outdoor: { techView: 'Crew View',       dispatchView: 'Route View',    teamMemberNoun: 'Crew Member', jobNoun: 'Stop' },
  repair:  { techView: 'Technician View', dispatchView: 'Shop Queue',    teamMemberNoun: 'Technician', jobNoun: 'Ticket' },
  booking: { techView: 'Agent View',      dispatchView: 'Schedule View', teamMemberNoun: 'Team Member', jobNoun: 'Appointment' },
};

const INDUSTRY_OVERRIDES: Record<string, IndustryNavLabels> = {
  real_estate:      { techView: 'Agent View',      dispatchView: 'Listings Map',   teamMemberNoun: 'Agent',      jobNoun: 'Showing' },
  beauty_wellness:  { techView: 'Stylist View',    dispatchView: 'Chair Schedule', teamMemberNoun: 'Stylist',    jobNoun: 'Appointment' },
  salon:            { techView: 'Stylist View',    dispatchView: 'Chair Schedule', teamMemberNoun: 'Stylist',    jobNoun: 'Appointment' },
  fitness:          { techView: 'Trainer View',    dispatchView: 'Class Schedule', teamMemberNoun: 'Trainer',    jobNoun: 'Class' },
  professional:     { techView: 'Consultant View', dispatchView: 'Schedule View',  teamMemberNoun: 'Consultant', jobNoun: 'Meeting' },
  personal_assistant:{techView: 'Concierge View',  dispatchView: 'Schedule View',  teamMemberNoun: 'Concierge',  jobNoun: 'Errand' },
  restaurants:      { techView: 'Server View',     dispatchView: 'Floor Plan',     teamMemberNoun: 'Server',     jobNoun: 'Reservation' },
  auto_care:        { techView: 'Technician View', dispatchView: 'Bay Queue',      teamMemberNoun: 'Technician', jobNoun: 'Repair Order' },
  appliance_repair: { techView: 'Technician View', dispatchView: 'Service Queue',  teamMemberNoun: 'Technician', jobNoun: 'Repair Ticket' },
  mobile_mechanic:  { techView: 'Mechanic View',   dispatchView: 'Route View',     teamMemberNoun: 'Mechanic',   jobNoun: 'Service Call' },
  landscape:        { techView: 'Crew View',       dispatchView: 'Route View',     teamMemberNoun: 'Crew Member',jobNoun: 'Visit' },
  pool_spa:         { techView: 'Tech View',       dispatchView: 'Route View',     teamMemberNoun: 'Pool Tech',  jobNoun: 'Service Visit' },
  pest_control:     { techView: 'Tech View',       dispatchView: 'Route View',     teamMemberNoun: 'Pest Tech',  jobNoun: 'Treatment Visit' },
};

export function getNavLabels(pack: IndustryPack): IndustryNavLabels {
  return INDUSTRY_OVERRIDES[pack.industry_id]
      ?? CLUSTER_DEFAULTS[pack.cluster]
      ?? CLUSTER_DEFAULTS.trades;
}

/**
 * Resolve the page header (title + description) for a given page surface
 * based on the active industry pack.
 */
export function getPageHeader(
  surface: keyof IndustryPageHeaders,
  pack: IndustryPack,
): { title: string; description: string } {
  const industryOverride = INDUSTRY_HEADERS[pack.industry_id]?.[surface];
  if (industryOverride) return industryOverride;
  const clusterOverride = CLUSTER_HEADERS[pack.cluster]?.[surface];
  if (clusterOverride) return clusterOverride;
  return GENERIC_HEADERS[surface];
}