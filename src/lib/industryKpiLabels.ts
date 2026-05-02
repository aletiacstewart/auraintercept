import type { IndustryPack } from '@/hooks/useIndustryPack';

/**
 * Map of canonical KPI tile titles → industry-specific replacements.
 * Only titles that appear in CompanyAdminDashboard's `allStatCards` are remapped.
 * Anything not in the map is rendered unchanged.
 */
export type KpiLabelMap = Partial<Record<
  | 'Customers' | 'Leads' | 'Appointments' | 'Open Quotes' | 'Outstanding'
  | 'Revenue (Month)' | 'Inventory' | 'Employees',
  string
>>;

const CLUSTER: Record<IndustryPack['cluster'], KpiLabelMap> = {
  trades:  { Appointments: 'Jobs Scheduled' },
  outdoor: { Appointments: 'Visits Scheduled', Customers: 'Properties' },
  repair:  { Appointments: 'Tickets Open' },
  booking: { Appointments: 'Bookings', Customers: 'Clients', Employees: 'Team' },
};

const OVERRIDES: Record<string, KpiLabelMap> = {
  hvac:        { Appointments: 'Service Calls', Outstanding: 'Unpaid Invoices' },
  plumbing:    { Appointments: 'Service Calls', Outstanding: 'Unpaid Invoices' },
  electrical:  { Appointments: 'Service Calls', Outstanding: 'Unpaid Invoices' },
  appliance_repair: { Appointments: 'Repair Tickets', Outstanding: 'Unpaid Invoices' },
  landscape:   { Appointments: 'Route Stops', Customers: 'Properties' },
  pest_control:{ Appointments: 'Treatments', Customers: 'Properties' },
  pool_spa:    { Appointments: 'Pool Visits', Customers: 'Pool Owners' },
  roofing:     { Appointments: 'Inspections', Customers: 'Properties', 'Open Quotes': 'Open Estimates' },
  solar:       { Appointments: 'Site Surveys', Customers: 'Homeowners', 'Open Quotes': 'Open Proposals' },
  fencing:     { Appointments: 'Measures Booked', Customers: 'Properties', 'Open Quotes': 'Open Estimates' },
  auto_care:   { Appointments: 'Bay Bookings', Customers: 'Vehicle Owners', 'Open Quotes': 'Open Estimates', Inventory: 'Parts Inventory' },
  construction:{ Appointments: 'Site Visits', Customers: 'Owners', 'Open Quotes': 'Open Bids' },
  handyman:    { Appointments: 'Visits Scheduled' },
  security_systems: { Appointments: 'Installs Scheduled', Customers: 'Accounts' },
  real_estate: { Appointments: 'Showings', Customers: 'Buyers / Sellers', Leads: 'Buyer Leads',
                 'Open Quotes': 'Active Listings', 'Revenue (Month)': 'Commissions (Month)', Employees: 'Agents' },
  beauty_wellness: { Appointments: 'Chair Bookings', Customers: 'Clients', Employees: 'Stylists' },
  restaurants: { Appointments: 'Reservations', Customers: 'Guests', Employees: 'Staff', Inventory: 'Stock On Hand' },
  personal_assistant: { Appointments: 'Sessions', Customers: 'Clients', Employees: 'Assistants' },
};

export function getKpiLabelMap(pack: IndustryPack): KpiLabelMap {
  return { ...(CLUSTER[pack.cluster] ?? {}), ...(OVERRIDES[pack.industry_id] ?? {}) };
}

/** Convenience: relabel a single canonical title for the given pack. */
export function relabelKpi(pack: IndustryPack, title: string): string {
  const map = getKpiLabelMap(pack) as Record<string, string>;
  return map[title] ?? title;
}
/**
 * Canonical KPI titles to surface in Simple Mode (top-5 KPI strip).
 * Returned in display order. Always uses canonical (pre-relabel) titles —
 * the dashboard relabels them via `relabelKpi` before matching.
 */
export type CanonicalKpiTitle =
  | 'Customers' | 'Leads' | 'Appointments' | 'Open Quotes'
  | 'Outstanding' | 'Revenue (Month)' | 'Inventory' | 'Employees'
  | 'Messages' | 'Campaigns' | 'Social Posts' | 'Blog Posts'
  | 'Website Traffic';

const SIMPLE_KPI_BY_CLUSTER: Record<IndustryPack['cluster'], CanonicalKpiTitle[]> = {
  trades:  ['Appointments', 'Open Quotes', 'Outstanding', 'Revenue (Month)', 'Leads'],
  outdoor: ['Appointments', 'Customers', 'Open Quotes', 'Revenue (Month)', 'Leads'],
  repair:  ['Appointments', 'Open Quotes', 'Outstanding', 'Revenue (Month)', 'Customers'],
  booking: ['Appointments', 'Customers', 'Revenue (Month)', 'Messages', 'Leads'],
};

const SIMPLE_KPI_BY_INDUSTRY: Record<string, CanonicalKpiTitle[]> = {
  real_estate:        ['Appointments', 'Open Quotes', 'Leads', 'Revenue (Month)', 'Customers'],
  beauty_wellness:    ['Appointments', 'Customers', 'Revenue (Month)', 'Messages', 'Employees'],
  restaurants:        ['Appointments', 'Customers', 'Revenue (Month)', 'Inventory', 'Messages'],
  personal_assistant: ['Appointments', 'Customers', 'Messages', 'Revenue (Month)', 'Leads'],
  auto_care:          ['Appointments', 'Open Quotes', 'Outstanding', 'Inventory', 'Revenue (Month)'],
  appliance_repair:   ['Appointments', 'Open Quotes', 'Outstanding', 'Revenue (Month)', 'Customers'],
  landscape:          ['Appointments', 'Customers', 'Open Quotes', 'Revenue (Month)', 'Outstanding'],
  pest_control:       ['Appointments', 'Customers', 'Revenue (Month)', 'Open Quotes', 'Outstanding'],
  pool_spa:           ['Appointments', 'Customers', 'Revenue (Month)', 'Open Quotes', 'Outstanding'],
  roofing:            ['Appointments', 'Open Quotes', 'Leads', 'Revenue (Month)', 'Outstanding'],
  solar:              ['Appointments', 'Open Quotes', 'Leads', 'Revenue (Month)', 'Customers'],
};

export function getSimpleModeKpis(pack: IndustryPack): CanonicalKpiTitle[] {
  return SIMPLE_KPI_BY_INDUSTRY[pack.industry_id]
      ?? SIMPLE_KPI_BY_CLUSTER[pack.cluster]
      ?? SIMPLE_KPI_BY_CLUSTER.trades;
}
