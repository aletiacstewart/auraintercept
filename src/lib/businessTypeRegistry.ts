/**
 * Business Type Registry — derived from the Marketing Platform Guide
 * (185 business types across 22 category groups) and the Lovable Console
 * Build Prompt (PROFILE_A–J mapping). Single source of truth for the
 * onboarding dropdown and the live-demo industry picker.
 *
 * Each business type resolves to:
 *   - profile  — drives console/agent/dashboard rendering via
 *                getProfileForBusinessType()
 *   - packId   — nearest INDUSTRY_CONTENT pack used for demo content
 *                (when an exact pack doesn't exist, falls back to the
 *                category's representative pack, then 'default')
 */

import { BUSINESS_TYPE_TO_PROFILE } from './businessTypeProfileMap';
import { INDUSTRY_CONTENT } from './industryMarketingContent';

/** Map raw key (e.g. 'hvac contractor') to a human label. */
function toLabel(key: string): string {
  return key
    .split(' ')
    .map((w) => {
      if (w === '&' || w === '/' || w === '-') return w;
      if (w === 'b2b') return 'B2B';
      if (w === 'msp') return 'MSP';
      if (w === 'it') return 'IT';
      if (w === 'hr') return 'HR';
      if (/^[a-z]/.test(w)) return w[0].toUpperCase() + w.slice(1);
      return w;
    })
    .join(' ');
}

/** Category group name from the Marketing Platform Guide, per business type. */
export const BUSINESS_TYPE_CATEGORY: Record<string, string> = {
  // HVAC & Mechanical
  'hvac contractor': 'HVAC & Mechanical',
  'air conditioning contractor': 'HVAC & Mechanical',
  'air conditioning repair service': 'HVAC & Mechanical',
  'heating contractor': 'HVAC & Mechanical',
  'mechanical contractor': 'HVAC & Mechanical',
  'air duct cleaning service': 'HVAC & Mechanical',
  // Plumbing
  'plumber': 'Plumbing',
  'septic system service': 'Plumbing',
  'well drilling contractor': 'Plumbing',
  'water softening equipment supplier': 'Plumbing',
  'drain cleaning service': 'Plumbing',
  'water heater installation & repair': 'Plumbing',
  'leak detection service': 'Plumbing',
  // Electrical
  'electrician': 'Electrical',
  'electrical installation service': 'Electrical',
  'solar energy contractor': 'Electrical',
  'security system installer': 'Electrical',
  'home cinema installation': 'Electrical',
  'ev charger installation': 'Electrical',
  'generator installation & repair': 'Electrical',
  'smart home / automation installer': 'Electrical',
  // Roofing & Exterior
  'roofing contractor': 'Roofing & Exterior',
  'gutter cleaning service': 'Roofing & Exterior',
  'siding contractor': 'Roofing & Exterior',
  'pressure washing service': 'Roofing & Exterior',
  'window cleaning service': 'Roofing & Exterior',
  'window installation service': 'Roofing & Exterior',
  'fence contractor': 'Roofing & Exterior',
  'painting': 'Roofing & Exterior',
  'exterior cleaning service': 'Roofing & Exterior',
  'caulking & weatherproofing service': 'Roofing & Exterior',
  'awning & shutter installer': 'Roofing & Exterior',
  'concrete & driveway sealing': 'Roofing & Exterior',
  // Landscaping & Outdoor
  'landscaper': 'Landscaping & Outdoor',
  'lawn care service': 'Landscaping & Outdoor',
  'tree service': 'Landscaping & Outdoor',
  'landscape designer': 'Landscaping & Outdoor',
  'lawn sprinkler system contractor': 'Landscaping & Outdoor',
  'snow removal service': 'Landscaping & Outdoor',
  'pest control service': 'Landscaping & Outdoor',
  'pool cleaning service': 'Landscaping & Outdoor',
  'irrigation repair service': 'Landscaping & Outdoor',
  'outdoor lighting installer': 'Landscaping & Outdoor',
  'mosquito / tick control service': 'Landscaping & Outdoor',
  'holiday lighting service': 'Landscaping & Outdoor',
  'artificial turf installer': 'Landscaping & Outdoor',
  // Cleaning & Restoration
  'house cleaning service': 'Cleaning & Restoration',
  'carpet cleaning service': 'Cleaning & Restoration',
  'commercial cleaning service': 'Cleaning & Restoration',
  'water damage restoration service': 'Cleaning & Restoration',
  'fire damage restoration service': 'Cleaning & Restoration',
  'janitorial service': 'Cleaning & Restoration',
  'mold remediation service': 'Cleaning & Restoration',
  'biohazard / crime scene cleanup': 'Cleaning & Restoration',
  'dryer vent cleaning service': 'Cleaning & Restoration',
  'junk removal service': 'Cleaning & Restoration',
  'post-construction cleaning': 'Cleaning & Restoration',
  'move-in / move-out cleaning': 'Cleaning & Restoration',
  // Construction & Remodeling
  'general contractor': 'Construction & Remodeling',
  'custom home builder': 'Construction & Remodeling',
  'kitchen remodeler': 'Construction & Remodeling',
  'bathroom remodeler': 'Construction & Remodeling',
  'flooring contractor': 'Construction & Remodeling',
  'masonry contractor': 'Construction & Remodeling',
  'concrete contractor': 'Construction & Remodeling',
  'tile contractor': 'Construction & Remodeling',
  'dry wall contractor': 'Construction & Remodeling',
  'insulation contractor': 'Construction & Remodeling',
  'deck builder': 'Construction & Remodeling',
  'remodeler': 'Construction & Remodeling',
  'cabinet maker': 'Construction & Remodeling',
  'paving contractor': 'Construction & Remodeling',
  'excavating contractor': 'Construction & Remodeling',
  'foundation repair contractor': 'Construction & Remodeling',
  'waterproofing contractor': 'Construction & Remodeling',
  'stucco contractor': 'Construction & Remodeling',
  'solar panel installer': 'Construction & Remodeling',
  'accessibility remodeler ramps lifts': 'Construction & Remodeling',
  'countertop installer': 'Construction & Remodeling',
  'home addition contractor': 'Construction & Remodeling',
  // Home Inspection & Safety
  'home inspector': 'Home Inspection & Safety',
  'chimney sweep': 'Home Inspection & Safety',
  'fire protection service': 'Home Inspection & Safety',
  'glass repair service': 'Home Inspection & Safety',
  'locksmith': 'Home Inspection & Safety',
  'garage door supplier': 'Home Inspection & Safety',
  'radon testing & mitigation': 'Home Inspection & Safety',
  'asbestos / lead testing & removal': 'Home Inspection & Safety',
  'pest / termite inspection': 'Home Inspection & Safety',
  'sewer scope / drain inspection': 'Home Inspection & Safety',
  'alarm & monitoring system service': 'Home Inspection & Safety',
  // Appliance & Tech Services
  'appliance repair service': 'Appliance & Tech Services',
  'computer repair service': 'Appliance & Tech Services',
  'mobile phone repair shop': 'Appliance & Tech Services',
  'small engine repair service': 'Appliance & Tech Services',
  'tv mounting service': 'Appliance & Tech Services',
  'internet / wifi setup service': 'Appliance & Tech Services',
  'security camera installation': 'Appliance & Tech Services',
  'smart thermostat / device installer': 'Appliance & Tech Services',
  // Moving & Junk Removal
  'mover': 'Moving & Junk Removal',
  'moving and storage service': 'Moving & Junk Removal',
  'debris removal service': 'Moving & Junk Removal',
  'garbage collection service': 'Moving & Junk Removal',
  'towing service': 'Moving & Junk Removal',
  'waste management service': 'Moving & Junk Removal',
  'donation pickup service': 'Moving & Junk Removal',
  'piano moving service': 'Moving & Junk Removal',
  'estate cleanout service': 'Moving & Junk Removal',
  // Auto Services (Mobile)
  'car detailing service': 'Auto Services (Mobile)',
  'auto glass shop': 'Auto Services (Mobile)',
  'auto dent removal service': 'Auto Services (Mobile)',
  'oil change service': 'Auto Services (Mobile)',
  'window tinting service': 'Auto Services (Mobile)',
  'auto electrical service': 'Auto Services (Mobile)',
  'mobile mechanic': 'Auto Services (Mobile)',
  'mobile tire service': 'Auto Services (Mobile)',
  'mobile car wash': 'Auto Services (Mobile)',
  // Pet & Animal Services
  'pet groomer': 'Pet & Animal Services',
  'mobile pet groomer': 'Pet & Animal Services',
  'dog trainer': 'Pet & Animal Services',
  'pet sitter': 'Pet & Animal Services',
  'dog walker': 'Pet & Animal Services',
  'veterinary care': 'Pet & Animal Services',
  'mobile veterinarian': 'Pet & Animal Services',
  'pet waste removal service': 'Pet & Animal Services',
  // Health & Wellness (In-Home)
  'massage therapist': 'Health & Wellness (In-Home)',
  // Specialty Trades
  'painter': 'Specialty Trades',
  'carpenter': 'Specialty Trades',
  'handyman': 'Specialty Trades',
  'welder': 'Specialty Trades',
  'swimming pool contractor': 'Specialty Trades',
  'swimming pool repair service': 'Specialty Trades',
  'carpet installer': 'Specialty Trades',
  'asphalt contractor': 'Specialty Trades',
  'epoxy flooring contractor': 'Specialty Trades',
  'stone / marble installer': 'Specialty Trades',
  'glass block & shower installer': 'Specialty Trades',
  'fireplace installer / repair': 'Specialty Trades',
  'crawl space encapsulation': 'Specialty Trades',
  // Utility & Infrastructure
  'propane supplier': 'Utility & Infrastructure',
  'water utility company': 'Utility & Infrastructure',
  'utility contractor': 'Utility & Infrastructure',
  // Real Estate & Property
  'real estate agent': 'Real Estate & Property',
  'real estate agency': 'Real Estate & Property',
  'real estate appraiser': 'Real Estate & Property',
  'mortgage broker': 'Real Estate & Property',
  'title company': 'Real Estate & Property',
  'property management company': 'Real Estate & Property',
  'real estate photographer': 'Real Estate & Property',
  'stager / interior stager': 'Real Estate & Property',
  'land surveyor': 'Real Estate & Property',
  'real estate attorney': 'Real Estate & Property',
  // In-Home Personal Services
  'personal trainer': 'In-Home Personal Services',
  'private tutor / tutoring service': 'In-Home Personal Services',
  'music instructor': 'In-Home Personal Services',
  'life coach': 'In-Home Personal Services',
  'house sitter': 'In-Home Personal Services',
  'nanny / child care agency': 'In-Home Personal Services',
  'meal prep / personal chef': 'In-Home Personal Services',
  'wedding planner home/venue visits': 'In-Home Personal Services',
  'photographer real estate/events': 'In-Home Personal Services',
  'personal assistant': 'In-Home Personal Services',
  'executive assistant': 'In-Home Personal Services',
  // Delivery & On-Site Logistics
  'furniture delivery & assembly': 'Delivery & On-Site Logistics',
  'appliance delivery & installation': 'Delivery & On-Site Logistics',
  'propane / fuel delivery': 'Delivery & On-Site Logistics',
  'water delivery service': 'Delivery & On-Site Logistics',
  // Insurance & Assessment
  'home insurance agency': 'Insurance & Assessment',
  'auto insurance agency': 'Insurance & Assessment',
  'public adjuster': 'Insurance & Assessment',
  'property appraiser': 'Insurance & Assessment',
  // Senior & Lifestyle Services
  'senior move manager': 'Senior & Lifestyle Services',
  'personal organizer': 'Senior & Lifestyle Services',
  'home energy auditor': 'Senior & Lifestyle Services',
  'estate sale company': 'Senior & Lifestyle Services',
  'hoarding cleanup service': 'Senior & Lifestyle Services',
  // Event & Temporary Services
  'event setup / tent rental': 'Event & Temporary Services',
  'bounce house / party rental delivery': 'Event & Temporary Services',
  'portable restroom rental': 'Event & Temporary Services',
  'dj / mobile entertainment service': 'Event & Temporary Services',
  'catering service on-site': 'Event & Temporary Services',
  'photo booth rental': 'Event & Temporary Services',

  // Beauty & Salons
  'hair salon': 'Beauty & Salons',
  'barbershop': 'Beauty & Salons',
  'nail salon': 'Beauty & Salons',
  'day spa': 'Beauty & Salons',
  'medical spa': 'Beauty & Salons',
  'lash and brow studio': 'Beauty & Salons',
  'waxing studio': 'Beauty & Salons',
  'tanning salon': 'Beauty & Salons',
  'massage therapy studio': 'Beauty & Salons',
  'skincare clinic': 'Beauty & Salons',
  'esthetician clinic': 'Beauty & Salons',
  'tattoo studio': 'Beauty & Salons',
  'piercing studio': 'Beauty & Salons',
  'makeup artistry studio': 'Beauty & Salons',

  // Restaurants & Food Delivery
  'quick service restaurant': 'Restaurants & Food Delivery',
  'full service restaurant': 'Restaurants & Food Delivery',
  'cafe': 'Restaurants & Food Delivery',
  'coffee shop': 'Restaurants & Food Delivery',
  'food truck': 'Restaurants & Food Delivery',
  'ghost kitchen': 'Restaurants & Food Delivery',
  'virtual restaurant': 'Restaurants & Food Delivery',
  'catering company': 'Restaurants & Food Delivery',
  'meal prep delivery service': 'Restaurants & Food Delivery',
  'bakery': 'Restaurants & Food Delivery',
  'pizza delivery': 'Restaurants & Food Delivery',
  'bar': 'Restaurants & Food Delivery',
  'brewery with food service': 'Restaurants & Food Delivery',

  // Personal Assistants
  'virtual assistant service': 'Personal Assistants',
  'concierge service': 'Personal Assistants',
  'personal shopping service': 'Personal Assistants',
  'household management service': 'Personal Assistants',
  'family management service': 'Personal Assistants',
  'errand running service': 'Personal Assistants',
  'executive assistant service': 'Personal Assistants',
  'senior care coordination service': 'Personal Assistants',
  'companion service': 'Personal Assistants',
  'travel planning assistant': 'Personal Assistants',
  'personal organizing service': 'Personal Assistants',

  // B2B Pro Services
  'accounting firm': 'B2B Pro Services',
  'bookkeeping firm': 'B2B Pro Services',
  'law firm': 'B2B Pro Services',
  'legal service': 'B2B Pro Services',
  'marketing agency': 'B2B Pro Services',
  'advertising agency': 'B2B Pro Services',
  'it managed service provider': 'B2B Pro Services',
  'msp': 'B2B Pro Services',
  'business consulting firm': 'B2B Pro Services',
  'management consulting firm': 'B2B Pro Services',
  'hr agency': 'B2B Pro Services',
  'staffing agency': 'B2B Pro Services',
  'commercial insurance agency': 'B2B Pro Services',
  'financial advisory firm': 'B2B Pro Services',
  'wealth management firm': 'B2B Pro Services',
  'b2b commercial cleaning service': 'B2B Pro Services',
  'b2b janitorial service': 'B2B Pro Services',
  'payroll administration firm': 'B2B Pro Services',
  'benefits administration firm': 'B2B Pro Services',
};

const CATEGORY_EMOJI: Record<string, string> = {
  'HVAC & Mechanical': '🔥',
  'Plumbing': '💧',
  'Electrical': '⚡',
  'Roofing & Exterior': '🏠',
  'Landscaping & Outdoor': '🌿',
  'Cleaning & Restoration': '✨',
  'Construction & Remodeling': '🛠',
  'Home Inspection & Safety': '🛡',
  'Appliance & Tech Services': '🧊',
  'Moving & Junk Removal': '🚛',
  'Auto Services (Mobile)': '🚗',
  'Pet & Animal Services': '🐾',
  'Health & Wellness (In-Home)': '💆',
  'Specialty Trades': '🔨',
  'Utility & Infrastructure': '🏗',
  'Real Estate & Property': '🏘',
  'In-Home Personal Services': '👤',
  'Delivery & On-Site Logistics': '📦',
  'Insurance & Assessment': '📋',
  'Senior & Lifestyle Services': '🤝',
  'Event & Temporary Services': '🎉',
  'Beauty & Salons': '✂️',
  'Restaurants & Food Delivery': '🍽️',
  'Personal Assistants': '🤝',
  'B2B Pro Services': '💼',
};

/**
 * Map each business type → nearest INDUSTRY_CONTENT pack id for demo
 * content. Types not listed fall back to category default → 'default'.
 */
export const BUSINESS_TYPE_TO_PACK: Record<string, string> = {
  // Exact matches to canonical packs
  'hvac contractor': 'hvac',
  'air conditioning contractor': 'hvac',
  'air conditioning repair service': 'hvac',
  'heating contractor': 'hvac',
  'mechanical contractor': 'hvac',
  'air duct cleaning service': 'hvac',
  'plumber': 'plumbing',
  'septic system service': 'plumbing',
  'drain cleaning service': 'plumbing',
  'water heater installation & repair': 'plumbing',
  'leak detection service': 'plumbing',
  'well drilling contractor': 'plumbing',
  'water softening equipment supplier': 'plumbing',
  'electrician': 'electrical',
  'electrical installation service': 'electrical',
  'generator installation & repair': 'electrical',
  'ev charger installation': 'electrical',
  'smart home / automation installer': 'electrical',
  'solar energy contractor': 'solar',
  'solar panel installer': 'solar',
  'security system installer': 'security_systems',
  'security camera installation': 'security_systems',
  'alarm & monitoring system service': 'security_systems',
  'home cinema installation': 'electrical',
  'roofing contractor': 'roofing',
  'gutter cleaning service': 'roofing',
  'siding contractor': 'roofing',
  'fence contractor': 'fencing',
  'landscaper': 'landscape',
  'lawn care service': 'landscape',
  'tree service': 'landscape',
  'landscape designer': 'landscape',
  'lawn sprinkler system contractor': 'landscape',
  'snow removal service': 'landscape',
  'irrigation repair service': 'landscape',
  'outdoor lighting installer': 'landscape',
  'artificial turf installer': 'landscape',
  'holiday lighting service': 'landscape',
  'pool cleaning service': 'pool_spa',
  'swimming pool contractor': 'pool_spa',
  'swimming pool repair service': 'pool_spa',
  'pest control service': 'pest_control',
  'mosquito / tick control service': 'pest_control',
  'appliance repair service': 'appliance_repair',
  'handyman': 'handyman',
  'house cleaning service': 'handyman',
  'commercial cleaning service': 'handyman',
  'janitorial service': 'handyman',
  'general contractor': 'construction',
  'custom home builder': 'construction',
  'kitchen remodeler': 'construction',
  'bathroom remodeler': 'construction',
  'flooring contractor': 'construction',
  'remodeler': 'construction',
  'car detailing service': 'auto_care',
  'mobile mechanic': 'auto_care',
  'oil change service': 'auto_care',
  'mobile tire service': 'auto_care',
  'mobile car wash': 'auto_care',
  'real estate agent': 'real_estate',
  'real estate agency': 'real_estate',
  'property management company': 'real_estate',
  'veterinary care': 'veterinary',
  'mobile veterinarian': 'veterinary',
  'massage therapist': 'beauty_wellness',
  'personal trainer': 'beauty_wellness',
  'personal assistant': 'beauty_wellness',
  'executive assistant': 'beauty_wellness',
};

/** Default pack per category for any type not in BUSINESS_TYPE_TO_PACK. */
const CATEGORY_DEFAULT_PACK: Record<string, string> = {
  'HVAC & Mechanical': 'hvac',
  'Plumbing': 'plumbing',
  'Electrical': 'electrical',
  'Roofing & Exterior': 'roofing',
  'Landscaping & Outdoor': 'landscape',
  'Cleaning & Restoration': 'handyman',
  'Construction & Remodeling': 'construction',
  'Home Inspection & Safety': 'default',
  'Appliance & Tech Services': 'appliance_repair',
  'Moving & Junk Removal': 'default',
  'Auto Services (Mobile)': 'auto_care',
  'Pet & Animal Services': 'veterinary',
  'Health & Wellness (In-Home)': 'beauty_wellness',
  'Specialty Trades': 'handyman',
  'Utility & Infrastructure': 'default',
  'Real Estate & Property': 'real_estate',
  'In-Home Personal Services': 'beauty_wellness',
  'Delivery & On-Site Logistics': 'default',
  'Insurance & Assessment': 'default',
  'Senior & Lifestyle Services': 'default',
  'Event & Temporary Services': 'default',
  'Beauty & Salons': 'beauty_wellness',
  'Restaurants & Food Delivery': 'restaurants',
  'Personal Assistants': 'personal_assistant',
  'B2B Pro Services': 'b2b_pro_services',
};

export interface BusinessTypeEntry {
  /** Normalized key used by BUSINESS_TYPE_TO_PROFILE (lowercase). */
  key: string;
  /** Human-readable label. */
  label: string;
  /** Marketing Platform Guide category. */
  category: string;
  /** Nearest INDUSTRY_CONTENT pack id for demo content. */
  packId: string;
}

function resolvePackId(key: string): string {
  if (BUSINESS_TYPE_TO_PACK[key]) return BUSINESS_TYPE_TO_PACK[key];
  const cat = BUSINESS_TYPE_CATEGORY[key];
  if (cat && CATEGORY_DEFAULT_PACK[cat]) return CATEGORY_DEFAULT_PACK[cat];
  return 'default';
}

/** Flat list of all 185 business types. */
export const BUSINESS_TYPES: BusinessTypeEntry[] = Object.keys(BUSINESS_TYPE_TO_PROFILE)
  .map((key) => ({
    key,
    label: toLabel(key),
    category: BUSINESS_TYPE_CATEGORY[key] || 'Other',
    packId: resolvePackId(key),
  }))
  .sort((a, b) => a.label.localeCompare(b.label));

/** Business types grouped by category, in Marketing Platform Guide order. */
const CATEGORY_ORDER = [
  'HVAC & Mechanical',
  'Plumbing',
  'Electrical',
  'Roofing & Exterior',
  'Landscaping & Outdoor',
  'Cleaning & Restoration',
  'Construction & Remodeling',
  'Home Inspection & Safety',
  'Appliance & Tech Services',
  'Moving & Junk Removal',
  'Auto Services (Mobile)',
  'Pet & Animal Services',
  'Health & Wellness (In-Home)',
  'Specialty Trades',
  'Utility & Infrastructure',
  'Real Estate & Property',
  'In-Home Personal Services',
  'Delivery & On-Site Logistics',
  'Insurance & Assessment',
  'Senior & Lifestyle Services',
  'Event & Temporary Services',
  'Beauty & Salons',
  'Restaurants & Food Delivery',
  'Personal Assistants',
  'B2B Pro Services',
];

export interface BusinessTypeGroup {
  category: string;
  emoji: string;
  items: BusinessTypeEntry[];
}

export const BUSINESS_TYPE_GROUPS: BusinessTypeGroup[] = CATEGORY_ORDER.map((category) => ({
  category,
  emoji: CATEGORY_EMOJI[category] || '✨',
  items: BUSINESS_TYPES
    .filter((b) => b.category === category)
    .sort((a, b) => a.label.localeCompare(b.label)),
})).filter((g) => g.items.length > 0);

/** Resolve a stored business-type or canonical id to its demo pack id. */
export function getPackIdForBusinessType(input: string | null | undefined): string {
  if (!input) return 'default';
  const key = String(input).toLowerCase().trim();
  // If input is already a known demo pack id (e.g. main-category demoPack
  // from mainIndustryCategories), pass it through so newly-added packs like
  // `cleaning_restoration` route to their own content.
  if (INDUSTRY_CONTENT[key]) return key;
  return resolvePackId(key);
}

/** Total count for marketing copy. */
export const BUSINESS_TYPE_COUNT = BUSINESS_TYPES.length;
export const BUSINESS_TYPE_CATEGORY_COUNT = BUSINESS_TYPE_GROUPS.length;