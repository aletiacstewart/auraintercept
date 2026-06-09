/**
 * Industry capability flags — tells the UI which features are meaningful
 * for the current vertical so we can hide irrelevant fields.
 *
 * Resolution order: industry_id override > cluster default.
 */
import type { IndustryPack } from '@/hooks/useIndustryPack';

/**
 * True when the vertical actually dispatches a field worker
 * (technician, crew member, mechanic, etc.). False for "host the customer
 * comes to you" or "remote service" verticals like restaurants, salons,
 * real estate, professional services, personal assistant.
 */
export function hasFieldTechnicians(pack: IndustryPack | null | undefined): boolean {
  if (!pack) return true; // safe default for trades-flavored generic
  // Booking-cluster verticals never dispatch a tech to the customer.
  if (pack.cluster === 'booking') return false;
  const NO_TECH = new Set([
    'restaurants', 'real_estate', 'beauty_wellness', 'salon', 'fitness',
    'professional', 'personal_assistant',
    // Medical verticals that serve patients on-site (no field dispatch / GPS).
    'veterinary', 'medical_practice',
  ]);
  if (NO_TECH.has(pack.industry_id)) return false;
  return true;
}

/** Industries that don't price work via standalone quotes (use listings, menus,
 * insurance auth, or productized service tiers instead). */
const NO_QUOTES = new Set([
  'restaurants', 'real_estate', 'beauty_wellness', 'salon', 'fitness',
  'home_health', 'personal_assistant',
  'veterinary', 'medical_practice',
]);
export function usesQuotes(pack: IndustryPack | null | undefined): boolean {
  if (!pack) return true;
  return !NO_QUOTES.has(pack.industry_id);
}

/** Industries that don't run a lead pipeline in-app (walk-ins, recurring
 * members, smart-link inquiries). */
const NO_LEADS = new Set(['restaurants', 'beauty_wellness', 'salon']);
export function usesLeads(pack: IndustryPack | null | undefined): boolean {
  if (!pack) return true;
  return !NO_LEADS.has(pack.industry_id);
}

/** Industries that don't track parts / stock inventory in the platform. */
const NO_INVENTORY = new Set([
  'restaurants', 'real_estate', 'beauty_wellness', 'salon', 'fitness',
  'professional', 'personal_assistant',
  'veterinary', 'medical_practice',
]);
export function usesInventory(pack: IndustryPack | null | undefined): boolean {
  if (!pack) return true;
  return !NO_INVENTORY.has(pack.industry_id);
}

/** Industries that do meaningful B2B work and need a Companies/Accounts roster. */
const B2B_INDUSTRIES = new Set([
  'professional', 'home_health',
]);
export function usesCompaniesB2B(pack: IndustryPack | null | undefined): boolean {
  if (!pack) return false;
  if (pack.cluster === 'trades' || pack.cluster === 'outdoor' || pack.cluster === 'repair') return true;
  return B2B_INDUSTRIES.has(pack.industry_id);
}

/** Industries that don't manage in-app appointments at all (Smart-Link verticals). */
const NO_APPOINTMENTS = new Set(['restaurants']);
export function usesAppointments(pack: IndustryPack | null | undefined): boolean {
  if (!pack) return true;
  return !NO_APPOINTMENTS.has(pack.industry_id);
}
