/**
 * Industry-aware label overrides for job_assignments.status values.
 *
 * Field-dispatch industries (HVAC, plumbing, home health, etc.) talk about
 * technicians arriving at a customer location. Booking-only industries
 * (salon, restaurants, real estate, fitness, professional services,
 * personal assistant) don't dispatch — they check the client in at the
 * business. Surfacing "Arrived" / "En Route" / "On The Way" in those
 * consoles is misleading.
 *
 * Returns the label to render for a given status. Callers should still
 * keep the underlying status value untouched (the data model is shared).
 */
export function getJobStatusLabel(
  status: string,
  isFieldDispatch: boolean,
  fallback?: string,
): string {
  if (!isFieldDispatch) {
    if (status === 'arrived') return 'Checked In';
    if (status === 'en_route') return 'Ready';
  }
  return fallback ?? status;
}
