/**
 * Maps agent tool names to the canonical lifecycle events they should announce,
 * and pulls the record ids out of a tool result.
 *
 * Payloads intentionally carry ids only — never customer contact details.
 */

export const TOOL_EVENT_MAP: Record<string, string> = {
  create_appointment: 'appointment.created',
  book_appointment: 'appointment.created',
  reschedule_appointment: 'appointment.rescheduled',
  cancel_appointment: 'appointment.cancelled',
  assign_technician: 'technician.assigned',
  mark_job_complete: 'job.completed',
  complete_job: 'job.completed',
  create_invoice: 'invoice.created',
  mark_invoice_paid: 'invoice.paid',
  create_quote: 'quote.created',
  send_quote: 'quote.sent',
  approve_quote: 'quote.approved',
};

type AnyRecord = Record<string, any>;

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

  if (appointmentId) payload.appointment_id = appointmentId;
  if (customerId) payload.customer_id = customerId;
  if (jobId) payload.job_id = jobId;
  if (technicianId) payload.technician_id = technicianId;
  if (invoiceId) payload.invoice_id = invoiceId;
  if (quoteId) payload.quote_id = quoteId;
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
