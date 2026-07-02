/**
 * 185-entry map: business type label -> ProfileKey.
 *
 * Source: `AuraIntercept_Lovable_ConsoleBuildPrompt` Section 4. Keys are the
 * exact business-type strings used in the spec, normalized via
 * `normalizeBusinessType` (lowercase, collapse whitespace, strip punctuation).
 *
 * Also includes a secondary lookup against this codebase's existing
 * canonical short ids (`hvac`, `plumbing`, …) so legacy values stored in
 * `companies.industry_vertical` still resolve to a profile.
 */

import { ProfileKey } from './industryProfiles';
import { toCanonicalIndustryId } from './industryIdAliases';

export function normalizeBusinessType(input: string | null | undefined): string {
  if (!input) return '';
  return String(input)
    .toLowerCase()
    .replace(/[._]/g, ' ')
    .replace(/[^\w\s/&-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Doc Section 4: 185 business types -> profile key. */
export const BUSINESS_TYPE_TO_PROFILE: Record<string, ProfileKey> = {
  // HVAC & Mechanical
  'hvac contractor': 'PROFILE_A',
  'air conditioning contractor': 'PROFILE_A',
  'air conditioning repair service': 'PROFILE_A',
  'heating contractor': 'PROFILE_A',
  'mechanical contractor': 'PROFILE_A',
  'air duct cleaning service': 'PROFILE_B',

  // Plumbing
  'plumber': 'PROFILE_A',
  'septic system service': 'PROFILE_B',
  'well drilling contractor': 'PROFILE_C',
  'water softening equipment supplier': 'PROFILE_J',
  'drain cleaning service': 'PROFILE_A',
  'water heater installation & repair': 'PROFILE_A',
  'leak detection service': 'PROFILE_A',

  // Electrical
  'electrician': 'PROFILE_A',
  'electrical installation service': 'PROFILE_C',
  'solar energy contractor': 'PROFILE_C',
  'security system installer': 'PROFILE_C',
  'home cinema installation': 'PROFILE_D',
  'ev charger installation': 'PROFILE_C',
  'generator installation & repair': 'PROFILE_A',
  'smart home / automation installer': 'PROFILE_C',

  // Roofing & Exterior
  'roofing contractor': 'PROFILE_C',
  'gutter cleaning service': 'PROFILE_B',
  'siding contractor': 'PROFILE_C',
  'pressure washing service': 'PROFILE_B',
  'window cleaning service': 'PROFILE_B',
  'window installation service': 'PROFILE_C',
  'fence contractor': 'PROFILE_C',
  'painting': 'PROFILE_C',
  'exterior cleaning service': 'PROFILE_B',
  'caulking & weatherproofing service': 'PROFILE_C',
  'awning & shutter installer': 'PROFILE_C',
  'concrete & driveway sealing': 'PROFILE_C',

  // Landscaping & Outdoor
  'landscaper': 'PROFILE_B',
  'lawn care service': 'PROFILE_B',
  'tree service': 'PROFILE_C',
  'landscape designer': 'PROFILE_C',
  'lawn sprinkler system contractor': 'PROFILE_B',
  'snow removal service': 'PROFILE_B',
  'pest control service': 'PROFILE_B',
  'pool cleaning service': 'PROFILE_B',
  'irrigation repair service': 'PROFILE_A',
  'outdoor lighting installer': 'PROFILE_C',
  'mosquito / tick control service': 'PROFILE_B',
  'holiday lighting service': 'PROFILE_B',
  'artificial turf installer': 'PROFILE_C',

  // Cleaning & Restoration
  'house cleaning service': 'PROFILE_B',
  'carpet cleaning service': 'PROFILE_B',
  'commercial cleaning service': 'PROFILE_B',
  'water damage restoration service': 'PROFILE_A',
  'fire damage restoration service': 'PROFILE_J',
  'janitorial service': 'PROFILE_B',
  'mold remediation service': 'PROFILE_J',
  'biohazard / crime scene cleanup': 'PROFILE_J',
  'dryer vent cleaning service': 'PROFILE_B',
  'junk removal service': 'PROFILE_J',
  'post-construction cleaning': 'PROFILE_J',
  'move-in / move-out cleaning': 'PROFILE_J',

  // Construction & Remodeling
  'general contractor': 'PROFILE_C',
  'custom home builder': 'PROFILE_C',
  'kitchen remodeler': 'PROFILE_C',
  'bathroom remodeler': 'PROFILE_C',
  'flooring contractor': 'PROFILE_C',
  'masonry contractor': 'PROFILE_C',
  'concrete contractor': 'PROFILE_C',
  'tile contractor': 'PROFILE_C',
  'dry wall contractor': 'PROFILE_C',
  'insulation contractor': 'PROFILE_C',
  'deck builder': 'PROFILE_C',
  'remodeler': 'PROFILE_C',
  'cabinet maker': 'PROFILE_C',
  'paving contractor': 'PROFILE_C',
  'excavating contractor': 'PROFILE_C',
  'foundation repair contractor': 'PROFILE_C',
  'waterproofing contractor': 'PROFILE_C',
  'stucco contractor': 'PROFILE_C',
  'solar panel installer': 'PROFILE_C',
  'accessibility remodeler ramps lifts': 'PROFILE_C',
  'countertop installer': 'PROFILE_C',
  'home addition contractor': 'PROFILE_C',

  // Home Inspection & Safety
  'home inspector': 'PROFILE_D',
  'chimney sweep': 'PROFILE_D',
  'fire protection service': 'PROFILE_D',
  'glass repair service': 'PROFILE_A',
  'locksmith': 'PROFILE_A',
  'garage door supplier': 'PROFILE_A',
  'radon testing & mitigation': 'PROFILE_D',
  'asbestos / lead testing & removal': 'PROFILE_J',
  'pest / termite inspection': 'PROFILE_D',
  'sewer scope / drain inspection': 'PROFILE_D',
  'alarm & monitoring system service': 'PROFILE_C',

  // Appliance & Tech Services
  'appliance repair service': 'PROFILE_A',
  'computer repair service': 'PROFILE_D',
  'mobile phone repair shop': 'PROFILE_D',
  'small engine repair service': 'PROFILE_D',
  'tv mounting service': 'PROFILE_D',
  'internet / wifi setup service': 'PROFILE_D',
  'security camera installation': 'PROFILE_C',
  'smart thermostat / device installer': 'PROFILE_D',

  // Moving & Junk Removal
  'mover': 'PROFILE_F',
  'moving and storage service': 'PROFILE_F',
  'debris removal service': 'PROFILE_F',
  'garbage collection service': 'PROFILE_F',
  'towing service': 'PROFILE_A',
  'waste management service': 'PROFILE_F',
  'donation pickup service': 'PROFILE_F',
  'piano moving service': 'PROFILE_F',
  'estate cleanout service': 'PROFILE_J',

  // Auto Services (Mobile)
  'car detailing service': 'PROFILE_G',
  'auto glass shop': 'PROFILE_G',
  'auto dent removal service': 'PROFILE_G',
  'oil change service': 'PROFILE_G',
  'window tinting service': 'PROFILE_G',
  'auto electrical service': 'PROFILE_G',
  'mobile mechanic': 'PROFILE_A',
  'mobile tire service': 'PROFILE_A',
  'mobile car wash': 'PROFILE_B',

  // Pet & Animal Services
  'pet groomer': 'PROFILE_H',
  'mobile pet groomer': 'PROFILE_H',
  'dog trainer': 'PROFILE_D',
  'pet sitter': 'PROFILE_D',
  'dog walker': 'PROFILE_B',
  'veterinary care': 'PROFILE_D',
  'mobile veterinarian': 'PROFILE_H',
  'pet waste removal service': 'PROFILE_B',

  // Health & Wellness (In-Home)
  'massage therapist': 'PROFILE_D',

  // Specialty Trades
  'painter': 'PROFILE_C',
  'carpenter': 'PROFILE_C',
  'handyman': 'PROFILE_A',
  'welder': 'PROFILE_C',
  'swimming pool contractor': 'PROFILE_C',
  'swimming pool repair service': 'PROFILE_C',
  'carpet installer': 'PROFILE_C',
  'asphalt contractor': 'PROFILE_C',
  'epoxy flooring contractor': 'PROFILE_C',
  'stone / marble installer': 'PROFILE_C',
  'glass block & shower installer': 'PROFILE_C',
  'fireplace installer / repair': 'PROFILE_C',
  'crawl space encapsulation': 'PROFILE_C',

  // Utility & Infrastructure
  'propane supplier': 'PROFILE_F',
  'water utility company': 'PROFILE_F',
  'utility contractor': 'PROFILE_C',

  // Real Estate & Property
  'real estate agent': 'PROFILE_E',
  'real estate agency': 'PROFILE_E',
  'real estate appraiser': 'PROFILE_D',
  'mortgage broker': 'PROFILE_E',
  'title company': 'PROFILE_E',
  'property management company': 'PROFILE_E',
  'real estate photographer': 'PROFILE_D',
  'stager / interior stager': 'PROFILE_D',
  'land surveyor': 'PROFILE_D',
  'real estate attorney': 'PROFILE_E',

  // In-Home Personal Services
  'personal trainer': 'PROFILE_D',
  'private tutor / tutoring service': 'PROFILE_D',
  'music instructor': 'PROFILE_D',
  'life coach': 'PROFILE_D',
  'house sitter': 'PROFILE_D',
  'nanny / child care agency': 'PROFILE_D',
  'meal prep / personal chef': 'PROFILE_D',
  'wedding planner home/venue visits': 'PROFILE_I',
  'photographer real estate/events': 'PROFILE_D',
  'personal assistant': 'PROFILE_D',
  'executive assistant': 'PROFILE_D',

  // Delivery & On-Site Logistics
  'furniture delivery & assembly': 'PROFILE_F',
  'appliance delivery & installation': 'PROFILE_F',
  'propane / fuel delivery': 'PROFILE_F',
  'water delivery service': 'PROFILE_F',

  // Insurance & Assessment
  'home insurance agency': 'PROFILE_D',
  'auto insurance agency': 'PROFILE_D',
  'public adjuster': 'PROFILE_D',
  'property appraiser': 'PROFILE_D',

  // Senior & Lifestyle Services
  'senior move manager': 'PROFILE_J',
  'personal organizer': 'PROFILE_D',
  'home energy auditor': 'PROFILE_D',
  'estate sale company': 'PROFILE_J',
  'hoarding cleanup service': 'PROFILE_J',

  // Event & Temporary Services
  'event setup / tent rental': 'PROFILE_I',
  'bounce house / party rental delivery': 'PROFILE_I',
  'portable restroom rental': 'PROFILE_I',
  'dj / mobile entertainment service': 'PROFILE_I',
  'catering service on-site': 'PROFILE_I',
  'photo booth rental': 'PROFILE_I',

  // Beauty & Salons
  'hair salon': 'PROFILE_D',
  'barbershop': 'PROFILE_D',
  'nail salon': 'PROFILE_D',
  'day spa': 'PROFILE_D',
  'medical spa': 'PROFILE_D',
  'lash and brow studio': 'PROFILE_D',
  'waxing studio': 'PROFILE_D',
  'tanning salon': 'PROFILE_D',
  'massage therapy studio': 'PROFILE_D',
  'skincare clinic': 'PROFILE_D',
  'esthetician clinic': 'PROFILE_D',
  'tattoo studio': 'PROFILE_D',
  'piercing studio': 'PROFILE_D',
  'makeup artistry studio': 'PROFILE_D',

  // Restaurants & Food Delivery
  'quick service restaurant': 'PROFILE_D',
  'full service restaurant': 'PROFILE_D',
  'cafe': 'PROFILE_D',
  'coffee shop': 'PROFILE_D',
  'food truck': 'PROFILE_D',
  'ghost kitchen': 'PROFILE_D',
  'virtual restaurant': 'PROFILE_D',
  'catering company': 'PROFILE_D',
  'meal prep delivery service': 'PROFILE_D',
  'bakery': 'PROFILE_D',
  'pizza delivery': 'PROFILE_D',
  'bar': 'PROFILE_D',
  'brewery with food service': 'PROFILE_D',

  // Personal Assistants
  'virtual assistant service': 'PROFILE_D',
  'concierge service': 'PROFILE_D',
  'personal shopping service': 'PROFILE_D',
  'household management service': 'PROFILE_D',
  'family management service': 'PROFILE_D',
  'errand running service': 'PROFILE_D',
  'executive assistant service': 'PROFILE_D',
  'senior care coordination service': 'PROFILE_D',
  'companion service': 'PROFILE_D',
  'travel planning assistant': 'PROFILE_D',
  'personal organizing service': 'PROFILE_D',

  // B2B Pro Services
  'accounting firm': 'PROFILE_D',
  'bookkeeping firm': 'PROFILE_D',
  'law firm': 'PROFILE_D',
  'legal service': 'PROFILE_D',
  'marketing agency': 'PROFILE_D',
  'advertising agency': 'PROFILE_D',
  'it managed service provider': 'PROFILE_D',
  'msp': 'PROFILE_D',
  'business consulting firm': 'PROFILE_D',
  'management consulting firm': 'PROFILE_D',
  'hr agency': 'PROFILE_D',
  'staffing agency': 'PROFILE_E',
  'commercial insurance agency': 'PROFILE_E',
  'financial advisory firm': 'PROFILE_D',
  'wealth management firm': 'PROFILE_D',
  'b2b commercial cleaning service': 'PROFILE_D',
  'b2b janitorial service': 'PROFILE_D',
  'payroll administration firm': 'PROFILE_D',
  'benefits administration firm': 'PROFILE_D',
};

/**
 * Legacy canonical industry-id shortcuts (e.g. `hvac`, `plumbing`) that
 * exist in `companies.industry_vertical` today. Used as a fallback when
 * the literal business-type string isn't in the 185-row table.
 */
export const CANONICAL_INDUSTRY_TO_PROFILE: Record<string, ProfileKey> = {
  hvac: 'PROFILE_A',
  plumbing: 'PROFILE_A',
  electrical: 'PROFILE_A',
  appliance_repair: 'PROFILE_A',
  handyman: 'PROFILE_A',
  mobile_mechanic: 'PROFILE_A',

  landscape: 'PROFILE_B',
  pool_spa: 'PROFILE_B',
  pest_control: 'PROFILE_B',

  roofing: 'PROFILE_C',
  solar: 'PROFILE_C',
  construction: 'PROFILE_C',
  security_systems: 'PROFILE_C',
  fencing: 'PROFILE_C',

  auto_care: 'PROFILE_G',
  real_estate: 'PROFILE_E',

  // Everything below has no field-ops dispatch — safe default Profile D.
  beauty_wellness: 'PROFILE_D',
  restaurants: 'PROFILE_D',
  personal_assistant: 'PROFILE_D',
  physical_therapy: 'PROFILE_D',
  occupational_therapy: 'PROFILE_D',
  hospice: 'PROFILE_D',
  home_health: 'PROFILE_D',
  veterinary: 'PROFILE_D',
  medical_practice: 'PROFILE_D',
  fitness: 'PROFILE_D',
  salon: 'PROFILE_D',
  professional: 'PROFILE_D',
  saas_platform: 'PROFILE_D',
  other: 'PROFILE_D',
};

/**
 * Resolve a profile from either the spec's literal business-type string or
 * this codebase's canonical short industry id. Falls back to PROFILE_D.
 */
export function getProfileForBusinessType(
  input: string | null | undefined,
): ProfileKey {
  const normalized = normalizeBusinessType(input);
  if (normalized && BUSINESS_TYPE_TO_PROFILE[normalized]) {
    return BUSINESS_TYPE_TO_PROFILE[normalized];
  }
  // Try canonical short id (industry_vertical column today)
  const canonical = toCanonicalIndustryId(input);
  if (canonical && CANONICAL_INDUSTRY_TO_PROFILE[canonical]) {
    return CANONICAL_INDUSTRY_TO_PROFILE[canonical];
  }
  return 'PROFILE_D';
}