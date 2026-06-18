/**
 * Maps sidebar nav hrefs to the canonical Console IDs (C1..C7) defined in
 * `industryProfiles.ts`. A nav item is hidden when the company's profile
 * does not list its console — except for platform_admin, who always sees
 * every console.
 *
 * Spec (Section 3 of AuraIntercept_Lovable_ConsoleBuildPrompt):
 *   C1 — AI Receptionist / Customer-Facing Front Desk
 *   C2 — Field Ops / Dispatch
 *   C3 — Business Management (admin / finance)
 *   C4 — Marketing & Outreach
 *   C5 — Social Media
 *   C6 — Analytics & Reports
 *   C7 — (reserved / custom)
 */

import type { ConsoleId, ProfileSpec } from './industryProfiles';

/** href -> ConsoleId. Only entries that map to a profile console are listed. */
export const NAV_HREF_TO_CONSOLE: Record<string, ConsoleId> = {
  // C1 — front desk / customer-facing
  '/dashboard/ai-consoles/customer-portal': 'C1',
  '/dashboard/customer-website-app': 'C1',

  // C2 — field ops / dispatch
  '/dashboard/ai-consoles/field-ops': 'C2',
  '/dashboard/dispatch-field-ops': 'C2',

  // C3 — business management
  '/dashboard/ai-consoles/business-mgt-ops': 'C3',

  // C4 — marketing & outreach
  '/dashboard/ai-consoles/marketing-sales': 'C4',

  // C5 — social media
  '/dashboard/ai-consoles/social-media': 'C5',

  // C6 — analytics & reports
  '/dashboard/ai-consoles/analytics': 'C6',
};

/**
 * True when the nav item should be visible for the given profile spec.
 * Items with no mapping (Settings, Knowledge, Integrations, Help, etc.) are
 * always allowed — profile only gates the AI consoles.
 */
export function navItemAllowedByProfile(
  href: string,
  spec: ProfileSpec | null | undefined,
): boolean {
  if (!spec) return true;
  const consoleId = NAV_HREF_TO_CONSOLE[href];
  if (!consoleId) return true;
  return spec.consoles.includes(consoleId);
}