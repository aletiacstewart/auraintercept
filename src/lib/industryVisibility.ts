/**
 * Industry visibility gate.
 *
 * Verticals listed here are temporarily HIDDEN from every customer-facing
 * surface (marketing pages, signup, demo seeder, audit, PDFs) until HIPAA
 * + BAA compliance work lands. The industry packs, lib entries, and DB rows
 * remain in place so we can re-enable in one flag flip.
 *
 * To re-enable: empty the set below, regen sitemap, reseed demos.
 */
export const HIPAA_GATED_INDUSTRIES = new Set<string>([
  // Medical verticals are HIDDEN platform-wide until HIPAA + BAA compliance
  // and the medical AI receptionist + patient scheduling features ship.
  // Empty this set to re-enable; existing company rows are untouched.
  'home_health',
  'physical_therapy',
  'occupational_therapy',
  'hospice',
  'veterinary',
  'medical_practice',
]);

// Verticals that still require the HIPAA/BAA "coming soon" disclosure.
export const MEDICAL_COMPLIANCE_PENDING_INDUSTRIES = new Set<string>([
  'home_health',
  'physical_therapy',
  'occupational_therapy',
  'hospice',
  'veterinary',
  'medical_practice',
]);

export function isMedicalCompliancePending(id: string | null | undefined): boolean {
  if (!id) return false;
  return MEDICAL_COMPLIANCE_PENDING_INDUSTRIES.has(id);
}

export function isIndustryVisible(id: string | null | undefined): boolean {
  if (!id) return true;
  return !HIPAA_GATED_INDUSTRIES.has(id);
}

export function filterVisibleIndustries<T extends { id: string }>(items: T[]): T[] {
  return items.filter((i) => isIndustryVisible(i.id));
}

export function filterVisibleIds(ids: string[]): string[] {
  return ids.filter(isIndustryVisible);
}