/**
 * Single source of truth for normalizing industry IDs to the canonical
 * values stored in `industry_template_packs.industry_id`.
 *
 * Different parts of the codebase historically used drifting IDs
 * (e.g. `landscaping`, `solar_energy`, `realestate`). Always run
 * `toCanonicalIndustryId` before writing to `companies.industry_vertical`
 * or before looking up an industry pack so every consumer
 * (dashboards, consoles, AI agents, analytics) resolves the right pack.
 */

export const INDUSTRY_ID_ALIASES: Record<string, string> = {
  // INDUSTRY_TEMPLATES (Auth signup dropdown) drift
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
  // INDUSTRY_DEFAULTS / marketing-content drift
  solar_energy: 'solar',
  fencing_decking: 'fencing',
  landscape_trees: 'landscape',
  handyman_cleaning: 'handyman',
  // legacy
  general_contractor: 'construction',
};

/**
 * Canonical industry IDs available as `industry_template_packs.industry_id`.
 * Used for client-side validation when we want to reject unknown values
 * instead of silently passing them through.
 */
export const CANONICAL_INDUSTRY_IDS = new Set<string>([
  'hvac',
  'plumbing',
  'electrical',
  'roofing',
  'solar',
  'landscape',
  'pool_spa',
  'pest_control',
  'appliance_repair',
  'handyman',
  'construction',
  'auto_care',
  'security_systems',
  'real_estate',
  'beauty_wellness',
  'restaurants',
  'personal_assistant',
  'fencing',
  'other',
]);

export function toCanonicalIndustryId(
  id: string | null | undefined,
): string | null {
  if (!id) return null;
  const trimmed = String(id).trim().toLowerCase();
  if (!trimmed) return null;
  return INDUSTRY_ID_ALIASES[trimmed] ?? trimmed;
}

export function isCanonicalIndustryId(
  id: string | null | undefined,
): boolean {
  if (!id) return false;
  return CANONICAL_INDUSTRY_IDS.has(id);
}