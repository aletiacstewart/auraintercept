/**
 * Per-industry sidebar hide rules. Some verticals need specific nav
 * items suppressed even though their parent console/profile is still in
 * use. Adding a vertical here is a one-line data change — no layout
 * component edit required.
 *
 * Keyed by industry pack `industry_id`. Values are exact `item.href`
 * strings from the DashboardLayout nav config. Platform admins bypass
 * these hides so they can still inspect the routes.
 *
 * Example:
 *   restaurants — no in-app reservation system; Aura only sends Smart
 *   Links via voice/chat, so `/dashboard/appointments` is hidden.
 */
export const HIDDEN_NAV_HREFS_BY_INDUSTRY: Record<string, string[]> = {
  restaurants: ['/dashboard/appointments'],
};

export function isNavHrefHiddenForIndustry(
  industryId: string | null | undefined,
  href: string,
): boolean {
  if (!industryId) return false;
  return HIDDEN_NAV_HREFS_BY_INDUSTRY[industryId]?.includes(href) ?? false;
}