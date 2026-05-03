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
  technician: string;
  quote: string;
  invoice: string;
  lead: string;
}

const DEFAULTS: CompanyTerminology = {
  job: 'Job',
  appointment: 'Appointment',
  customer: 'Customer',
  serviceType: 'Service',
  technician: 'Technician',
  quote: 'Quote',
  invoice: 'Invoice',
  lead: 'Lead',
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
    const pick = (...keys: string[]): string | undefined => {
      for (const k of keys) {
        const v = term[k];
        if (typeof v === 'string' && v) return v;
      }
      return undefined;
    };
    return {
      job: pick('job', 'job_singular') || DEFAULTS.job,
      appointment:
        pick('appointment', 'job_singular', 'job') || DEFAULTS.appointment,
      customer: pick('customer', 'customer_singular') || DEFAULTS.customer,
      serviceType:
        pick('serviceType', 'service_type', 'service', 'service_singular') ||
        DEFAULTS.serviceType,
      technician: pick('technician', 'employee_singular', 'employee') || DEFAULTS.technician,
      quote: pick('quote') || DEFAULTS.quote,
      invoice: pick('invoice') || DEFAULTS.invoice,
      lead: pick('lead') || DEFAULTS.lead,
    };
  } catch (e) {
    console.warn('[terminology] resolve failed:', e);
    return DEFAULTS;
  }
}