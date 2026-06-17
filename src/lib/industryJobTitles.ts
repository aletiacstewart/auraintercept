// Job-title catalog used by the onboarding form's Job Title dropdown.
// Industry IDs match those used in INDUSTRY_GROUPS (industryMarketingContent.ts).

export const UNIVERSAL_TITLES: string[] = [
  'Owner',
  'Co-Owner',
  'CEO',
  'President',
  'General Manager',
  'Operations Manager',
  'Office Manager',
  'Admin / Receptionist',
  'Sales Manager',
  'Sales Rep',
  'Marketing Manager',
  'Customer Service Lead',
  'Bookkeeper / Accountant',
];

export const INDUSTRY_TITLES: Record<string, string[]> = {
  hvac: ['Service Manager', 'Lead Technician', 'HVAC Technician', 'Install Crew Lead', 'Dispatcher'],
  plumbing: ['Master Plumber', 'Journeyman Plumber', 'Apprentice', 'Service Manager', 'Dispatcher'],
  electrical: ['Master Electrician', 'Journeyman Electrician', 'Apprentice', 'Estimator', 'Dispatcher'],
  solar_energy: ['Solar Consultant', 'System Designer', 'Installer Lead', 'Site Surveyor', 'Permitting Coordinator'],
  roofing: ['Project Manager', 'Estimator', 'Crew Lead', 'Roofer', 'Insurance Claims Specialist'],
  fencing_decking: ['Project Manager', 'Estimator', 'Install Crew Lead', 'Installer'],
  landscape_trees: ['Crew Lead', 'Landscaper', 'Arborist', 'Irrigation Tech', 'Designer'],
  pool_spa: ['Service Tech', 'Route Manager', 'Equipment Specialist'],
  pest_control: ['Lead Technician', 'Termite Specialist', 'Route Manager'],
  appliance_repair: ['Lead Technician', 'Appliance Tech', 'Parts Manager'],
  handyman_cleaning: ['Lead Handyman', 'Handyman', 'Cleaner', 'Crew Lead'],
  construction: ['Project Manager', 'Estimator', 'Foreman', 'Carpenter', 'Painter'],
  auto_care: ['Service Advisor', 'Master Tech', 'Mechanic', 'Service Manager'],
  security_systems: ['Install Tech', 'Monitoring Specialist', 'Sales Consultant'],
  real_estate: ['Broker', 'Realtor / Agent', 'Listing Coordinator', 'Transaction Coordinator'],
  beauty_wellness: ['Salon Owner', 'Stylist', 'Colorist', 'Nail Technician', 'Esthetician', 'Massage Therapist', 'Barber'],
  restaurants: ['Chef / Kitchen Manager', 'Front of House Manager', 'Host / Hostess', 'Server Lead'],
  personal_assistant: ['Executive Assistant', 'Personal Assistant', 'Concierge'],
  home_health: ['Director of Nursing', 'RN Case Manager', 'LPN', 'Home Health Aide', 'Scheduler'],
  physical_therapy: ['Clinic Director', 'Physical Therapist (PT)', 'PT Assistant (PTA)', 'Front Desk'],
  occupational_therapy: ['Clinic Director', 'Occupational Therapist (OT)', 'OT Assistant (COTA)', 'Front Desk'],
  hospice: ['Hospice Director', 'RN Case Manager', 'Chaplain', 'Social Worker', 'Hospice Aide'],
  veterinary: ['Veterinarian (DVM)', 'Vet Tech', 'Practice Manager', 'Front Desk'],
  medical_practice: ['Physician (MD/DO)', 'Nurse Practitioner', 'Medical Assistant', 'Practice Manager', 'Front Desk'],
};

export const OTHER_TITLE_VALUE = '__other__';

export function getIndustryTitles(industryId?: string | null): string[] {
  if (!industryId) return [];
  return INDUSTRY_TITLES[industryId] ?? [];
}