/**
 * Declarative multi-step workflows.
 *
 * A workflow is an ordered list of steps; each step names the agent that runs
 * it and the instruction that agent receives. The engine
 * (`workflow-engine.ts`) walks the list, carrying the shared AgentContext from
 * one step to the next. Adding a workflow means adding an entry here — the
 * engine and the orchestrator need no changes.
 */

export type WorkflowStepFailure = 'escalate' | 'skip';

export interface WorkflowStepDefinition {
  /** Stable key used in the per-step log. */
  key: string;
  /** Plain-English label shown in the UI. */
  label: string;
  /** Agent (or legacy alias) that executes the step. */
  agent: string;
  /**
   * Instruction sent to the agent. `{{placeholders}}` are filled from the run's
   * context (customer.name, customer.phone, appointmentId, ...).
   */
  instruction: string;
  /** A required step that exhausts its retries escalates the whole run. */
  required?: boolean;
  /** What to do when the step exhausts its retries. Default: escalate. */
  onFailure?: WorkflowStepFailure;
  /**
   * Context paths that must exist after the step ran (e.g. 'appointmentId').
   * If one is missing the step counts as failed — an agent that only replies
   * with questions never passes for done.
   */
  expects?: string[];
  /** Tool the agent must actually have called for the step to count. */
  requiresToolCall?: string;
}

export interface WorkflowDefinition {
  key: string;
  name: string;
  /** One line describing the outcome, in the customer's words. */
  description: string;
  steps: WorkflowStepDefinition[];
}

export const WORKFLOW_DEFINITIONS: Record<string, WorkflowDefinition> = {
  new_service_request: {
    key: 'new_service_request',
    name: 'New Service Request',
    description:
      'Takes a new service request from first contact to a booked, assigned, routed job with the customer notified.',
    steps: [
      {
        key: 'triage',
        label: 'Understand the request',
        agent: 'triage',
        instruction:
          'A new service request came in from {{customer.name}} ({{customer.phone}}). What they need: {{customer.issue}}. Classify the request, note the urgency and summarise what service is required. Do not contact the customer.',
        required: true,
      },
      {
        key: 'booking',
        label: 'Book the appointment',
        agent: 'customer_journey',
        instruction:
          'Book the service now for {{customer.name}}, phone {{customer.phone}}, email {{customer.email}}, address {{customer.address}}, for: {{customer.issue}}. This is an automated workflow — do not ask questions and do not wait for a reply. Call create_appointment immediately using the next available business slot (tomorrow 9am if you have nothing better) and report the appointment id.',
        required: true,
        requiresToolCall: 'create_appointment',
        expects: ['appointmentId'],
      },
      {
        key: 'dispatch',
        label: 'Assign a technician',
        agent: 'dispatch',
        instruction:
          'Assign the best available technician to appointment {{appointmentId}} for {{customer.name}} at {{customer.address}}. This is an automated workflow — do not ask questions. Check availability and call assign_technician with the appointment id above, then report who was assigned.',
        required: true,
        requiresToolCall: 'assign_technician',
      },
      {
        key: 'field_navigation',
        label: 'Plan the route',
        agent: 'field_navigation',
        instruction:
          'Plan the route and estimated arrival time for appointment {{appointmentId}} at {{customer.address}}. This is an automated workflow — do not ask questions; use the appointment id above and report the ETA.',
        required: false,
        onFailure: 'skip',
      },
      {
        key: 'notify_customer',
        label: 'Notify the customer',
        agent: 'customer_journey',
        instruction:
          'Prepare a confirmation text for {{customer.name}} at {{customer.phone}} covering appointment {{appointmentId}}: the service ({{customer.issue}}), the date and time, and who is coming. This is an automated workflow — do not ask questions. Submit it as a draft for approval; do not send it directly.',
        required: true,
      },
    ],
  },

  lead_to_quote: {
    key: 'lead_to_quote',
    name: 'Lead to Quote',
    description: 'Qualifies a new lead, follows up and prepares a quote for approval.',
    steps: [
      {
        key: 'qualify',
        label: 'Qualify the lead',
        agent: 'outreach',
        instruction:
          'Qualify the new lead {{customer.name}} ({{customer.phone}}, {{customer.email}}). Interest: {{customer.issue}}. Score the lead and note the next best action.',
        required: true,
      },
      {
        key: 'follow_up',
        label: 'Draft the follow-up',
        agent: 'outreach',
        instruction:
          'Prepare a follow-up message for {{customer.name}} based on their interest in {{customer.issue}}. Submit it as a draft for approval — do not send it directly.',
        required: false,
        onFailure: 'skip',
      },
      {
        key: 'quote',
        label: 'Prepare the quote',
        agent: 'business_finance',
        instruction:
          'Prepare a quote for {{customer.name}} covering {{customer.issue}} using our real service pricing. Leave it in draft for review.',
        required: true,
      },
    ],
  },
};

export function getWorkflowDefinition(key: string): WorkflowDefinition | null {
  return WORKFLOW_DEFINITIONS[key] ?? null;
}

export function listWorkflowDefinitions(): WorkflowDefinition[] {
  return Object.values(WORKFLOW_DEFINITIONS);
}
