// Deno mirror of src/lib/industryIdAliases.ts. Keep in sync.
// Used by edge functions to normalize incoming
// industry IDs before persisting to companies.industry_vertical.

export const INDUSTRY_ID_ALIASES: Record<string, string> = {
  landscaping: 'landscape',
  pool: 'pool_spa',
  pest: 'pest_control',
  appliance: 'appliance_repair',
  auto: 'auto_care',
  security: 'security_systems',
  realestate: 'real_estate',
  beauty: 'beauty_wellness',
  restaurant: 'restaurants',
  personalassistant: 'personal_assistant',
  solar_energy: 'solar',
  fencing_decking: 'fencing',
  landscape_trees: 'landscape',
  handyman_cleaning: 'handyman',
  general_contractor: 'construction',
  pt: 'physical_therapy',
  ot: 'occupational_therapy',
  hospices: 'hospice',
  homehealth: 'home_health',
  home_care: 'home_health',
  homecare: 'home_health',
  home_health_care: 'home_health',
  vet: 'veterinary',
  vets: 'veterinary',
  veterinarian: 'veterinary',
  veterinarians: 'veterinary',
  animal_hospital: 'veterinary',
  medical_office: 'medical_practice',
  medical_offices: 'medical_practice',
  doctor: 'medical_practice',
  doctors_office: 'medical_practice',
  clinic: 'medical_practice',
  physician: 'medical_practice',
  physicians: 'medical_practice',
  private_practice: 'medical_practice',
  private_medical_practice: 'medical_practice',
};

export const CANONICAL_INDUSTRY_IDS = new Set<string>([
  'hvac', 'plumbing', 'electrical', 'roofing', 'solar', 'landscape',
  'pool_spa', 'pest_control', 'appliance_repair', 'handyman', 'construction',
  'auto_care', 'security_systems', 'real_estate', 'beauty_wellness',
  'restaurants', 'personal_assistant', 'fencing',
  'physical_therapy', 'occupational_therapy', 'hospice', 'home_health',
  'veterinary', 'medical_practice',
]);

/**
 * Industries temporarily HIDDEN until HIPAA + BAA compliance lands.
 * Edge functions that accept inbound industry IDs (e.g. create-demo-trial)
 * should refuse or normalize these to 'other'. Existing rows are untouched.
 */
export const HIPAA_GATED_INDUSTRIES = new Set<string>([
  'home_health', 'physical_therapy', 'occupational_therapy', 'hospice',
  'veterinary', 'medical_practice',
]);

export function isIndustryHipaaGated(id: string | null | undefined): boolean {
  if (!id) return false;
  return HIPAA_GATED_INDUSTRIES.has(String(id).trim().toLowerCase());
}

export function toCanonicalIndustryId(
  id: string | null | undefined,
): string | null {
  if (!id) return null;
  const trimmed = String(id).trim().toLowerCase();
  if (!trimmed) return null;
  return INDUSTRY_ID_ALIASES[trimmed] ?? trimmed;
}

export function isCanonicalIndustryId(id: string | null | undefined): boolean {
  if (!id) return false;
  return CANONICAL_INDUSTRY_IDS.has(id);
}