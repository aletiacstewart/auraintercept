/**
 * App-side mirror of the structured hand-off context defined in
 * `supabase/functions/_shared/agent-context.ts`. Keep both in sync.
 */

export interface AgentContextCustomer {
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  issue?: string | null;
}

export interface AgentContext {
  contextId?: string | null;
  companyId: string;
  fromAgent: string;
  toAgent: string;
  reason: string;
  appointmentId?: string | null;
  customerId?: string | null;
  jobId?: string | null;
  workflowId?: string | null;
  customer: AgentContextCustomer;
  metadata: Record<string, unknown>;
  createdAt: string;
}
