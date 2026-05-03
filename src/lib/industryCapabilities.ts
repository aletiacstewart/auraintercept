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
 * real estate, professional services, personal assistant, healthcare.
 */
export function hasFieldTechnicians(pack: IndustryPack | null | undefined): boolean {
  if (!pack) return true; // safe default for trades-flavored generic
  // Booking-cluster verticals never dispatch a tech to the customer.
  if (pack.cluster === 'booking') return false;
  // Healthcare verticals are in-office; no tech dispatch.
  const NO_TECH = new Set([
    'restaurants', 'real_estate', 'beauty_wellness', 'salon', 'fitness',
    'professional', 'personal_assistant',
    'dental', 'chiropractic', 'medical_office', 'physical_therapy', 'optometry', 'veterinary',
  ]);
  if (NO_TECH.has(pack.industry_id)) return false;
  return true;
}
