/**
 * Shared helper for resolving industry-specific terminology nouns
 * (job, appointment, customer, service_type, etc.) for a given company.
 *
 * Edge functions use this to substitute generic words in customer-facing
 * subjects/bodies (emails, SMS, push) with the active vertical's preferred
 * noun. Falls back to sensible defaults when the company has no industry pack.
 */

export interface CompanyTerminology {
  job: string;
  appointment: string;
  customer: string;
  serviceType: string;
}

const DEFAULTS: CompanyTerminology = {
  job: 'Job',
  appointment: 'Appointment',
  customer: 'Customer',
  serviceType: 'Service',
};

export async function getCompanyTerminology(
  supabase: { rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }> },
  companyId: string,
): Promise<CompanyTerminology> {
  if (!companyId) return DEFAULTS;
  try {
    const { data } = await supabase.rpc('get_company_industry_pack', {
      p_company_id: companyId,
    });
    const row = Array.isArray(data) ? data[0] : data;
    const term = ((row as Record<string, unknown>)?.terminology || {}) as Record<string, string>;
    return {
      job: (typeof term.job === 'string' && term.job) || DEFAULTS.job,
      appointment:
        (typeof term.appointment === 'string' && term.appointment) || DEFAULTS.appointment,
      customer: (typeof term.customer === 'string' && term.customer) || DEFAULTS.customer,
      serviceType:
        (typeof term.serviceType === 'string' && term.serviceType) ||
        (typeof term.service_type === 'string' && term.service_type) ||
        (typeof term.service === 'string' && term.service) ||
        DEFAULTS.serviceType,
    };
  } catch (e) {
    console.warn('[terminology] resolve failed:', e);
    return DEFAULTS;
  }
}