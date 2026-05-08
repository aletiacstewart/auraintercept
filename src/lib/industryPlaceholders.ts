import type { IndustryPack } from '@/hooks/useIndustryPack';

export interface IndustryPlaceholders {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  searchCustomers: string;
  searchLeads: string;
  searchQuotes: string;
  searchInvoices: string;
  notes: string;
}

const GENERIC: IndustryPlaceholders = {
  firstName: 'Jane',
  lastName: 'Doe',
  email: 'jane.doe@example.com',
  phone: '(555) 123-4567',
  address: '123 Main St, City, State 12345',
  searchCustomers: 'Search customers…',
  searchLeads: 'Search leads…',
  searchQuotes: 'Search quotes…',
  searchInvoices: 'Search invoices…',
  notes: 'Add a note…',
};

const BY_INDUSTRY: Record<string, Partial<IndustryPlaceholders>> = {
  hvac:        { address: '123 Maple Ave (HVAC service address)', notes: 'e.g. AC not cooling, second floor' },
  plumbing:    { address: '456 Oak St (plumbing service address)', notes: 'e.g. Leak under kitchen sink' },
  electrical:  { address: '789 Pine Rd (electrical service address)', notes: 'e.g. Breaker keeps tripping' },
  appliance_repair: { address: '12 Cherry Ln (service address)', notes: 'e.g. Whirlpool dryer not spinning' },
  landscaping: { address: '34 Birch Dr (property address)', notes: 'e.g. Weekly mowing + hedge trim' },
  pool_service:{ address: '78 Lakeview Way (pool location)', notes: 'e.g. Cloudy water, weekly clean' },
  pest_control:{ address: '90 Elm St (treatment address)', notes: 'e.g. Ant infestation in kitchen' },
  cleaning:    { address: '21 Cedar Ct (cleaning address)', notes: 'e.g. Bi-weekly deep clean, 3 BR' },
  fitness:     { address: '500 Studio Way Suite 2', notes: 'e.g. New member intake, beginner' },
  salon:       { firstName: 'Alex', lastName: 'Rivera', address: '88 Salon Row', notes: 'e.g. Color + cut, allergy: PPD' },
  spa:         { firstName: 'Alex', lastName: 'Rivera', address: '88 Wellness Way', notes: 'e.g. 60-min massage, deep tissue' },
  professional:{ firstName: 'Morgan', lastName: 'Lee', email: 'morgan.lee@acme.com', address: '1 Corporate Plaza', notes: 'e.g. Discovery call, Q4 roadmap' },
  saas_platform:{ firstName: 'Morgan', lastName: 'Lee', email: 'morgan.lee@acme.com', address: 'Remote', notes: 'e.g. Trial signup, 25 seats' },
  restaurant:  { firstName: 'Sam', lastName: 'Park', address: 'Reservation only', notes: 'e.g. Party of 4, 7pm Friday' },
  real_estate: { address: '742 Listing Dr', notes: 'e.g. Showing request, 3BR/2BA' },
  legal:       { firstName: 'Morgan', lastName: 'Lee', address: '1 Court St', notes: 'e.g. Initial consult, family law' },
  medical:     { firstName: 'Pat', lastName: 'Nguyen', address: '200 Medical Pkwy', notes: 'e.g. New patient, annual checkup' },
  auto_repair: { address: '15 Garage Rd', notes: 'e.g. 2018 Honda Civic, check engine light' },
};

export function getIndustryPlaceholders(pack?: Pick<IndustryPack, 'industry_id' | 'cluster'> | null): IndustryPlaceholders {
  const id = (pack?.industry_id ?? 'generic').toLowerCase();
  const overrides = BY_INDUSTRY[id] ?? {};
  return { ...GENERIC, ...overrides };
}