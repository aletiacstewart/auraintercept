/**
 * Structured hand-off context shared by every AI agent.
 *
 * Before this module, a hand-off carried only a free-text reason plus a loose
 * `customerInfo` blob, so the receiving agent had to re-derive (or re-ask for)
 * everything the previous agent already knew. `AgentContext` is the typed,
 * validated package that travels with a hand-off instead.
 */

export interface AgentContextCustomer {
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  /** What the customer is trying to get done (free text). */
  issue?: string | null;
}

export interface AgentContext {
  /** Row id of the shared `ai_agent_context` record, when the run has one. */
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
  /** Free-form, agent-specific key/value data. */
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface AgentContextInput {
  contextId?: string | null;
  companyId: string;
  fromAgent: string;
  toAgent: string;
  reason?: string | null;
  appointmentId?: string | null;
  customerId?: string | null;
  jobId?: string | null;
  workflowId?: string | null;
  customer?: AgentContextCustomer | null;
  metadata?: Record<string, unknown> | null;
}

/** Digits-only phone, keeping a leading +. */
function normalizePhone(value?: string | null): string | null {
  if (!value) return null;
  const trimmed = String(value).trim();
  if (!trimmed) return null;
  const plus = trimmed.startsWith('+');
  const digits = trimmed.replace(/\D/g, '');
  if (!digits) return null;
  return plus ? `+${digits}` : digits;
}

function normalizeText(value?: string | null): string | null {
  if (value === undefined || value === null) return null;
  const trimmed = String(value).trim();
  return trimmed ? trimmed : null;
}

function normalizeEmail(value?: string | null): string | null {
  const text = normalizeText(value);
  return text ? text.toLowerCase() : null;
}

/**
 * Build a normalized AgentContext. Empty values are dropped so a downstream
 * merge never overwrites real data with blanks.
 */
export function buildAgentContext(input: AgentContextInput): AgentContext {
  const c = input.customer || {};
  const customer: AgentContextCustomer = {};
  const name = normalizeText(c.name);
  const phone = normalizePhone(c.phone);
  const email = normalizeEmail(c.email);
  const address = normalizeText(c.address);
  const issue = normalizeText(c.issue);
  if (name) customer.name = name;
  if (phone) customer.phone = phone;
  if (email) customer.email = email;
  if (address) customer.address = address;
  if (issue) customer.issue = issue;

  return {
    contextId: normalizeText(input.contextId),
    companyId: input.companyId,
    fromAgent: input.fromAgent,
    toAgent: input.toAgent,
    reason: normalizeText(input.reason) || 'Agent handoff',
    appointmentId: normalizeText(input.appointmentId),
    customerId: normalizeText(input.customerId),
    jobId: normalizeText(input.jobId),
    workflowId: normalizeText(input.workflowId),
    customer,
    metadata: input.metadata && typeof input.metadata === 'object' ? { ...input.metadata } : {},
    createdAt: new Date().toISOString(),
  };
}

/** Merge a partial context onto an existing one without losing populated fields. */
export function mergeAgentContext(
  base: AgentContext | null | undefined,
  patch: AgentContextInput,
): AgentContext {
  const next = buildAgentContext({
    ...patch,
    contextId: patch.contextId ?? base?.contextId ?? null,
    appointmentId: patch.appointmentId ?? base?.appointmentId ?? null,
    customerId: patch.customerId ?? base?.customerId ?? null,
    jobId: patch.jobId ?? base?.jobId ?? null,
    workflowId: patch.workflowId ?? base?.workflowId ?? null,
    customer: { ...(base?.customer || {}), ...(patch.customer || {}) },
    metadata: { ...(base?.metadata || {}), ...(patch.metadata || {}) },
  });
  return next;
}

/** Dotted paths that must be present before handing off to a given agent. */
export const AGENT_CONTEXT_REQUIREMENTS: Record<string, string[]> = {
  dispatch: ['appointmentId', 'customer.name', 'customer.phone'],
  field_navigation: ['customer.name'],
  business_finance: ['customer.name'],
};

/** Human-readable field names used in the "still need…" message. */
const FIELD_LABELS: Record<string, string> = {
  appointmentId: 'a booked appointment',
  customerId: 'the customer record',
  jobId: 'the job',
  workflowId: 'the workflow',
  'customer.name': "the customer's name",
  'customer.phone': "the customer's phone number",
  'customer.email': "the customer's email",
  'customer.address': 'the service address',
};

function readPath(ctx: AgentContext, path: string): unknown {
  return path.split('.').reduce<any>((acc, key) => (acc == null ? acc : acc[key]), ctx as any);
}

export interface AgentContextValidation {
  ok: boolean;
  missing: string[];
  errors: string[];
}

/**
 * Validate a context against the requirements of its target agent.
 * `requirements` may be passed explicitly; otherwise the target agent's
 * entry in AGENT_CONTEXT_REQUIREMENTS is used (empty = nothing required).
 */
export function validateAgentContext(
  ctx: AgentContext,
  requirements?: string[],
): AgentContextValidation {
  const required = requirements ?? AGENT_CONTEXT_REQUIREMENTS[ctx.toAgent] ?? [];
  const missing = required.filter((path) => {
    const value = readPath(ctx, path);
    return value === undefined || value === null || value === '';
  });
  return {
    ok: missing.length === 0,
    missing,
    errors: missing.map((path) => `Missing ${FIELD_LABELS[path] || path}`),
  };
}

/** Plain-English list of what is still needed, for the model to act on. */
export function describeMissingContext(validation: AgentContextValidation): string {
  return validation.missing.map((path) => FIELD_LABELS[path] || path).join(', ');
}

/** Render the context as the prompt block the receiving agent reads. */
export function describeAgentContext(ctx: AgentContext): string {
  const lines: string[] = [
    `IMPORTANT: You are receiving a handoff from the ${ctx.fromAgent} agent.`,
    `Reason for handoff: ${ctx.reason}`,
  ];

  const ids: string[] = [];
  if (ctx.appointmentId) ids.push(`- Appointment ID: ${ctx.appointmentId}`);
  if (ctx.customerId) ids.push(`- Customer ID: ${ctx.customerId}`);
  if (ctx.jobId) ids.push(`- Job ID: ${ctx.jobId}`);
  if (ctx.workflowId) ids.push(`- Workflow ID: ${ctx.workflowId}`);
  if (ids.length) lines.push('', 'RECORDS ALREADY CREATED (use these IDs directly):', ...ids);

  const c = ctx.customer;
  if (c.name || c.phone || c.email || c.address || c.issue) {
    lines.push('', 'CUSTOMER INFORMATION ALREADY COLLECTED:');
    if (c.name) lines.push(`- Name: ${c.name}`);
    if (c.phone) lines.push(`- Phone: ${c.phone}`);
    if (c.address) lines.push(`- Address: ${c.address}`);
    if (c.email) lines.push(`- Email: ${c.email}`);
    if (c.issue) lines.push(`- Issue: ${c.issue}`);
  }

  const metaKeys = Object.keys(ctx.metadata || {});
  if (metaKeys.length) {
    lines.push('', 'ADDITIONAL CONTEXT:');
    for (const key of metaKeys) {
      const value = (ctx.metadata as Record<string, unknown>)[key];
      if (value === null || value === undefined || value === '') continue;
      lines.push(`- ${key}: ${typeof value === 'object' ? JSON.stringify(value) : String(value)}`);
    }
  }

  const hasAllCore = Boolean(c.name && c.phone && c.address);
  if (hasAllCore) {
    lines.push(
      '',
      'You ALREADY HAVE all required customer info. DO NOT ask for name, phone, or address again!',
      'Instead: Greet them by name, confirm the issue, and proceed to help them immediately.',
    );
  } else {
    const missing: string[] = [];
    if (!c.name) missing.push('name');
    if (!c.phone) missing.push('phone number');
    if (!c.address) missing.push('address');
    if (missing.length) lines.push('', `You still need: ${missing.join(', ')}. Only ask for what's missing.`);
  }

  lines.push(
    '',
    'YOUR FIRST MESSAGE MUST:',
    '1. Greet the customer by name if you have it',
    '2. Acknowledge their specific issue',
    "3. Tell them exactly what you're doing to help",
    '4. If you have their address, confirm it and proceed',
    '5. Only ask for missing information',
  );

  return lines.join('\n');
}

/** Safe JSON round-trip helpers used for transport and jsonb storage. */
export function serializeAgentContext(ctx: AgentContext): Record<string, unknown> {
  return JSON.parse(JSON.stringify(ctx));
}

export function parseAgentContext(value: unknown): AgentContext | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Record<string, any>;
  if (!raw.companyId && !raw.company_id) return null;
  return buildAgentContext({
    contextId: raw.contextId ?? raw.context_id ?? null,
    companyId: raw.companyId ?? raw.company_id,
    fromAgent: raw.fromAgent ?? raw.from_agent ?? 'unknown',
    toAgent: raw.toAgent ?? raw.to_agent ?? 'unknown',
    reason: raw.reason ?? null,
    appointmentId: raw.appointmentId ?? raw.appointment_id ?? null,
    customerId: raw.customerId ?? raw.customer_id ?? null,
    jobId: raw.jobId ?? raw.job_id ?? null,
    workflowId: raw.workflowId ?? raw.workflow_id ?? null,
    customer: raw.customer ?? null,
    metadata: raw.metadata ?? null,
  });
}
