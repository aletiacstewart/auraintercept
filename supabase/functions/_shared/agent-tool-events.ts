/**
 * Maps agent tool names to the canonical lifecycle events they should announce,
 * and pulls the record ids out of a tool result.
 *
 * Payloads intentionally carry ids only — never customer contact details.
 */

/** Tools whose event name is fixed. */
export const TOOL_EVENT_MAP: Record<string, string> = {
  create_appointment: 'appointment.created',
  assign_technician: 'technician.assigned',
  generate_quote: 'quote.created',
  send_quote: 'quote.sent',
  generate_invoice: 'invoice.created',
  capture_lead: 'lead.qualified',
  send_review_request: 'followup.sent',
  create_campaign: 'campaign.created',
  create_seasonal_campaign: 'campaign.created',
  create_social_post: 'content.generated',
  reorder_parts: 'inventory.low',
};

type AnyRecord = Record<string, any>;

/**
 * Resolve the event for a tool call. `update_job_status` depends on the status
 * the agent set, so it is decided here rather than in the fixed map.
 */
export function eventNameForTool(
  toolName: string,
  args: unknown,
  result: unknown,
): string | null {
  if (toolName === 'update_job_status') {
    const a = (args && typeof args === 'object' ? args : {}) as AnyRecord;
    const r = (result && typeof result === 'object' ? result : {}) as AnyRecord;
    const status = String(a.status || a.new_status || r.status || '').toLowerCase();
    if (['completed', 'complete', 'done', 'finished'].includes(status)) return 'job.completed';
    if (['in_progress', 'started', 'on_site', 'en_route', 'arrived'].includes(status)) return 'job.started';
    return null;
  }
  return TOOL_EVENT_MAP[toolName] ?? null;
}

function pick(result: AnyRecord, ...paths: string[]): string | undefined {
  for (const path of paths) {
    const value = path
      .split('.')
      .reduce<any>((acc, key) => (acc == null ? acc : acc[key]), result);
    if (typeof value === 'string' && value) return value;
  }
  return undefined;
}

/** Build the id-only event payload for a successful tool result. */
export function extractEventPayload(
  toolName: string,
  result: unknown,
  contextId?: string | null,
): Record<string, unknown> {
  const r = (result && typeof result === 'object' ? result : {}) as AnyRecord;
  const payload: Record<string, unknown> = {};
  if (contextId) payload.context_id = contextId;

  const appointmentId = pick(r, 'appointment.id', 'appointment_id', 'appointmentId');
  const customerId = pick(r, 'customer.id', 'customer_id', 'customerId');
  const jobId = pick(r, 'job.id', 'job_id', 'jobId', 'job_assignment_id');
  const technicianId = pick(r, 'technician.id', 'technician_id', 'technicianId', 'employee_id');
  const invoiceId = pick(r, 'invoice.id', 'invoice_id', 'invoiceId');
  const quoteId = pick(r, 'quote.id', 'quote_id', 'quoteId');
  const leadId = pick(r, 'lead.id', 'lead_id', 'leadId');
  const campaignId = pick(r, 'campaign.id', 'campaign_id', 'campaignId');

  if (appointmentId) payload.appointment_id = appointmentId;
  if (customerId) payload.customer_id = customerId;
  if (jobId) payload.job_id = jobId;
  if (technicianId) payload.technician_id = technicianId;
  if (invoiceId) payload.invoice_id = invoiceId;
  if (quoteId) payload.quote_id = quoteId;
  if (leadId) payload.lead_id = leadId;
  if (campaignId) payload.campaign_id = campaignId;
  payload.tool = toolName;

  return payload;
}

/** True when the tool result represents a successful action worth announcing. */
export function toolResultIsSuccess(result: unknown): boolean {
  if (!result || typeof result !== 'object') return false;
  const r = result as AnyRecord;
  if (r.error) return false;
  if (r.success === false) return false;
  return true;
}
