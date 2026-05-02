// Deno mirror of src/lib/industryIdAliases.ts. Keep in sync.
// Used by edge functions (create-demo-trial, etc.) to normalize incoming
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
};

export const CANONICAL_INDUSTRY_IDS = new Set<string>([
  'hvac', 'plumbing', 'electrical', 'roofing', 'solar', 'landscape',
  'pool_spa', 'pest_control', 'appliance_repair', 'handyman', 'construction',
  'auto_care', 'security_systems', 'real_estate', 'beauty_wellness',
  'restaurants', 'personal_assistant', 'fencing',
]);

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