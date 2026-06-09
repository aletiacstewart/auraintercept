export interface IndustryRoiDefaults {
  technicians: number;
  avgJobValue: number;
  callsPerDay: number;
  technicianLabel: string; // e.g. "# of technicians", "# of stylists"
  jobLabel: string; // e.g. "Avg job value", "Avg ticket"
}

const DEFAULT: IndustryRoiDefaults = {
  technicians: 6,
  avgJobValue: 350,
  callsPerDay: 15,
  technicianLabel: '# of staff',
  jobLabel: 'Avg job value ($)',
};

export const INDUSTRY_ROI_DEFAULTS: Record<string, IndustryRoiDefaults> = {
  default: DEFAULT,
  hvac: { technicians: 8, avgJobValue: 450, callsPerDay: 18, technicianLabel: '# of technicians', jobLabel: 'Avg job value ($)' },
  plumbing: { technicians: 6, avgJobValue: 425, callsPerDay: 16, technicianLabel: '# of plumbers', jobLabel: 'Avg job value ($)' },
  electrical: { technicians: 6, avgJobValue: 475, callsPerDay: 14, technicianLabel: '# of electricians', jobLabel: 'Avg job value ($)' },
  solar: { technicians: 5, avgJobValue: 1800, callsPerDay: 10, technicianLabel: '# of installers', jobLabel: 'Avg install value ($)' },
  roofing: { technicians: 6, avgJobValue: 950, callsPerDay: 12, technicianLabel: '# of crews', jobLabel: 'Avg job value ($)' },
  fencing: { technicians: 4, avgJobValue: 650, callsPerDay: 10, technicianLabel: '# of crews', jobLabel: 'Avg job value ($)' },
  landscape: { technicians: 6, avgJobValue: 180, callsPerDay: 14, technicianLabel: '# of crews', jobLabel: 'Avg job value ($)' },
  pool_spa: { technicians: 5, avgJobValue: 220, callsPerDay: 12, technicianLabel: '# of technicians', jobLabel: 'Avg service value ($)' },
  pest_control: { technicians: 6, avgJobValue: 175, callsPerDay: 16, technicianLabel: '# of technicians', jobLabel: 'Avg job value ($)' },
  appliance_repair: { technicians: 5, avgJobValue: 240, callsPerDay: 14, technicianLabel: '# of technicians', jobLabel: 'Avg repair value ($)' },
  handyman: { technicians: 4, avgJobValue: 220, callsPerDay: 12, technicianLabel: '# of staff', jobLabel: 'Avg job value ($)' },
  construction: { technicians: 8, avgJobValue: 2400, callsPerDay: 10, technicianLabel: '# of crews', jobLabel: 'Avg project value ($)' },
  auto_care: { technicians: 6, avgJobValue: 320, callsPerDay: 18, technicianLabel: '# of techs', jobLabel: 'Avg RO value ($)' },
  security_systems: { technicians: 4, avgJobValue: 550, callsPerDay: 12, technicianLabel: '# of installers', jobLabel: 'Avg install value ($)' },
  real_estate: { technicians: 5, avgJobValue: 6500, callsPerDay: 20, technicianLabel: '# of agents', jobLabel: 'Avg commission ($)' },
  beauty_wellness: { technicians: 6, avgJobValue: 95, callsPerDay: 22, technicianLabel: '# of stylists', jobLabel: 'Avg ticket ($)' },
  restaurants: { technicians: 12, avgJobValue: 42, callsPerDay: 35, technicianLabel: '# of seats / staff', jobLabel: 'Avg ticket ($)' },
  personal_assistant: { technicians: 3, avgJobValue: 175, callsPerDay: 12, technicianLabel: '# of assistants', jobLabel: 'Avg engagement ($)' },
  home_health: { technicians: 8, avgJobValue: 165, callsPerDay: 18, technicianLabel: '# of caregivers', jobLabel: 'Avg visit value ($)' },
  physical_therapy: { technicians: 5, avgJobValue: 145, callsPerDay: 20, technicianLabel: '# of therapists', jobLabel: 'Avg visit value ($)' },
  occupational_therapy: { technicians: 5, avgJobValue: 150, callsPerDay: 18, technicianLabel: '# of therapists', jobLabel: 'Avg visit value ($)' },
  hospice: { technicians: 8, avgJobValue: 195, callsPerDay: 14, technicianLabel: '# of caregivers', jobLabel: 'Avg visit value ($)' },
  veterinary: { technicians: 4, avgJobValue: 185, callsPerDay: 22, technicianLabel: '# of veterinarians', jobLabel: 'Avg visit value ($)' },
  medical_practice: { technicians: 4, avgJobValue: 210, callsPerDay: 28, technicianLabel: '# of providers', jobLabel: 'Avg visit value ($)' },
  other: DEFAULT,
};

export function getIndustryRoiDefaults(id: string | null | undefined): IndustryRoiDefaults {
  if (!id) return DEFAULT;
  return INDUSTRY_ROI_DEFAULTS[id] ?? DEFAULT;
}