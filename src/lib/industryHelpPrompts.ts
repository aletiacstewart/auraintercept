import type { IndustryPack } from '@/hooks/useIndustryPack';

/**
 * Industry-aware "Example Prompts" used on the Help page per console.
 * Falls back to the generic config useCases when no override is defined.
 */

type ConsoleId =
  | 'customer_portal'
  | 'field_operations'
  | 'business_management'
  | 'marketing_sales'
  | 'social_media'
  | 'creative_web_presence'
  | 'analytics_reports'
  | 'ai_operatives_hub';


const BY_INDUSTRY: Record<string, Partial<Record<ConsoleId, string[]>>> = {
  real_estate: {
    customer_portal: [
      '"Book a showing for tomorrow"',
      '"What listings do you have under $400k?"',
      '"I\'d like to schedule a buyer consult"',
      '"What\'s the status of my offer?"',
      '"I need to reschedule a showing"',
    ],
  },
  restaurants: {
    customer_portal: [
      '"Make a reservation for 4 at 7pm"',
      '"What are your hours?"',
      '"Do you have outdoor seating?"',
      '"I need to change my reservation"',
      '"What\'s on the menu tonight?"',
    ],
  },
  beauty_wellness: {
    customer_portal: [
      '"Book a haircut tomorrow at 2pm"',
      '"What services do you offer?"',
      '"How much is a color treatment?"',
      '"I need to reschedule"',
      '"What are your hours?"',
    ],
  },
  personal_assistant: {
    customer_portal: [
      '"Book a strategy call"',
      '"What services do you offer?"',
      '"What are your hours?"',
      '"I need to reschedule"',
    ],
  },
};

export function getIndustryUseCases(
  consoleId: string,
  pack: IndustryPack | null | undefined,
  fallback: string[],
): string[] {
  if (!pack) return fallback;
  const overrides = BY_INDUSTRY[pack.industry_id];
  if (overrides && overrides[consoleId as ConsoleId]) {
    return overrides[consoleId as ConsoleId]!;
  }
  return fallback;
}