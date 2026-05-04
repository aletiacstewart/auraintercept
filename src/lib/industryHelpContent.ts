import type { IndustryPack } from '@/hooks/useIndustryPack';
import type { ConsoleHelpConfig } from './helpContentConfig';

/**
 * Industry-aware overrides for Help page console cards (description, features,
 * tabs). Falls back to the generic (trades-flavored) config when no override
 * matches.
 *
 * Resolution order: industry_id > cluster > generic.
 */

type ConsoleOverride = Partial<Pick<ConsoleHelpConfig, 'description' | 'tabs'>> & {
  features?: string[];
};

type ConsoleOverrideMap = Partial<Record<string, ConsoleOverride>>;

const BY_INDUSTRY: Record<string, ConsoleOverrideMap> = {
  real_estate: {
    customer_portal: {
      description:
        'AI-powered buyer & seller engagement hub — showings, listing inquiries, and follow-ups.',
      tabs: ['Chat', 'Voice', 'Listings', 'Hours', 'Showings', 'Track'],
      features: [
        'Buyers and sellers ask questions and request showings',
        'Voice booking for showings and consults',
        'Listing search and inquiry capture',
        'Automated showing reminders and confirmations',
        'Review collection from past clients',
      ],
    },
  },
  restaurants: {
    customer_portal: {
      description:
        'AI-powered guest engagement hub — reservations, menu questions, private events.',
      tabs: ['Chat', 'Voice', 'Menu', 'Hours', 'Reservations', 'Events'],
      features: [
        'Guests book reservations via chat or voice',
        'Menu and hours questions answered automatically',
        'Private event and large-party inquiry capture',
        'Reservation reminders and confirmations',
      ],
    },
  },
  beauty_wellness: {
    customer_portal: {
      description:
        'AI-powered client engagement hub — bookings, service questions, and follow-ups.',
      tabs: ['Chat', 'Voice', 'Services', 'Hours', 'Stylists', 'Track'],
      features: [
        'Clients book appointments via chat or voice',
        'Service catalog with pricing',
        'Stylist availability and chair scheduling',
        'Automated reminders and rebook prompts',
      ],
    },
  },
};

/**
 * Resolve the industry-aware console config. Returns an object with the
 * effective description, tabs, and features for the given console + pack.
 * Anything not overridden uses the generic config values.
 */
export function getIndustryConsoleConfig(
  base: ConsoleHelpConfig,
  pack: IndustryPack | null | undefined,
): { description: string; tabs: string[]; features: string[] | null } {
  const override = pack ? BY_INDUSTRY[pack.industry_id]?.[base.id] : undefined;
  return {
    description: override?.description ?? base.description,
    tabs: override?.tabs ?? base.tabs ?? [],
    features: override?.features ?? null, // null means "use generic + tier filtering"
  };
}