import { useCompanyProfile } from './useCompanyProfile';

/**
 * Convenience accessor for the cosmetic gates declared in a profile's
 * `labelOverrides` — `hideDispatch` and `hideRoute`. Sidebar console
 * gating (C2 = Field Ops) and agent hiding are handled separately in
 * `DashboardLayout` / `initialize-company-agents`. Use this hook only
 * for shared form/console UI bits that need to disappear for
 * appointment-only or pipeline profiles (D, E, I, partially J).
 */
export function useProfileGates() {
  const { spec, loading } = useCompanyProfile();
  const overrides = spec?.labelOverrides ?? {};
  return {
    loading,
    hideDispatch: !!overrides.hideDispatch,
    hideRoute: !!overrides.hideRoute,
    technicianNoun: overrides.technician ?? 'Technician',
    jobNoun: overrides.job ?? 'Job',
    quoteNoun: overrides.quote ?? 'Quote',
  };
}